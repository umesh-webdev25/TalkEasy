import { Server } from 'socket.io';
import { logger } from '../config/logger.js';
import { sttService } from '../services/groqWhisper.service.js';
import { llmService } from '../services/gemini.service.js';
import { ttsService } from '../services/elevenLabs.service.js';
import { ChatSession } from '../models/chat.model.js';
import { v4 as uuidv4 } from 'uuid';

export const setupSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 WebSocket connected: ${socket.id}`);
    let session_id = socket.handshake.query.session_id || uuidv4();
    let web_search_enabled = socket.handshake.query.web_search === 'true';
    let lang = socket.handshake.query.lang || 'auto';
    let userId = null; // Optional: Decode from token

    let audioBuffer = [];
    let isStreaming = false;

    socket.emit('message', {
      type: 'audio_stream_ready',
      message: 'Audio streaming endpoint ready. Send binary audio data.',
      session_id,
      web_search_enabled,
      timestamp: new Date().toISOString()
    });

    socket.on('message', async (data) => {
      try {
        if (typeof data === 'string') {
          let commandData;
          try {
            commandData = JSON.parse(data);
            if (commandData.type === 'session_id') {
              session_id = commandData.session_id;
              return;
            } else if (commandData.type === 'web_search_toggle') {
              web_search_enabled = commandData.enabled;
              return;
            }
          } catch (e) {
            commandData = data;
          }

          if (commandData === 'start_streaming') {
            audioBuffer = [];
            isStreaming = true;
            socket.emit('message', { type: 'command_response', status: 'streaming_ready' });
          } else if (commandData === 'stop_streaming') {
            isStreaming = false;
            socket.emit('message', { type: 'command_response', status: 'streaming_stopped' });
            
            if (audioBuffer.length > 0) {
              const fullBuffer = Buffer.concat(audioBuffer);
              audioBuffer = [];
              await processAudio(fullBuffer, socket, session_id, web_search_enabled, lang, userId);
            }
          }
        } else if (Buffer.isBuffer(data) && isStreaming) {
          audioBuffer.push(data);
          socket.emit('message', { type: 'audio_chunk_received', total_bytes: data.length });
        }
      } catch (error) {
        logger.error(`Socket message error: ${error.message}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 WebSocket disconnected: ${socket.id}`);
    });
  });

  const processAudio = async (audioBuffer, socket, session_id, web_search_enabled, lang, userId) => {
    try {
      socket.emit('message', { type: 'llm_streaming_start', message: 'Transcribing audio...' });
      
      const transcribedText = await sttService.transcribeAudio(audioBuffer);
      if (!transcribedText) {
         socket.emit('message', { type: 'llm_streaming_error', message: 'No speech detected.' });
         return;
      }
      
      let session = await ChatSession.findOne({ session_id });
      if (!session) {
        session = new ChatSession({ session_id, user_id: userId, messages: [] });
      }
      const chatHistory = session.messages.map(m => ({ role: m.role, content: m.content }));
      session.messages.push({ role: 'user', content: transcribedText });
      await session.save();

      socket.emit('message', { type: 'llm_streaming_start', message: 'LLM is generating response...', user_message: transcribedText });

      const llmStream = llmService.generateStreamingResponse(transcribedText, chatHistory, null, lang);
      let accumulatedResponse = '';

      for await (const chunk of llmStream) {
        accumulatedResponse += chunk;
        socket.emit('message', { type: 'llm_streaming_chunk', chunk, accumulated_length: accumulatedResponse.length });
      }

      session.messages.push({ role: 'assistant', content: accumulatedResponse });
      await session.save();

      socket.emit('message', { type: 'tts_streaming_start', message: 'Generating speech...' });

      const audioStream = await ttsService.client.textToSpeech.convert(ttsService.voiceId, {
        text: ttsService.truncateText(accumulatedResponse),
        model_id: 'eleven_monolingual_v1',
        output_format: 'mp3_44100_128',
      });
      
      let chunkNumber = 0;
      for await (const chunk of audioStream) {
        chunkNumber++;
        socket.emit('message', {
          type: 'tts_audio_chunk',
          audio_base64: chunk.toString('base64'),
          chunk_number: chunkNumber,
          is_final: false
        });
      }

      socket.emit('message', { type: 'tts_audio_chunk', is_final: true });
      socket.emit('message', { type: 'llm_streaming_complete', complete_response: accumulatedResponse });
      
    } catch (error) {
      logger.error(`Error processing audio: ${error.message}`);
      socket.emit('message', { type: 'llm_streaming_error', message: error.message });
    }
  };

  return io;
};
