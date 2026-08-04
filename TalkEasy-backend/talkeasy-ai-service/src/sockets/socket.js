import { Server } from 'socket.io';
import { logger } from 'shared';
import { sttService } from '../services/groqWhisper.service.js';
import { llmService } from '../services/gemini.service.js';
import { ttsService } from '../services/elevenLabs.service.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { aiOrchestrator } from '../services/ai/aiOrchestrator.service.js';

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
    let userId = socket.handshake.query.userId || null; // Passed from frontend auth if available

    if (!userId) {
      logger.warn(`🔌 WebSocket connection rejected: Missing userId (Socket ID: ${socket.id})`);
      socket.emit('message', { type: 'error', message: 'Authentication required. Missing userId.' });
      socket.disconnect(true);
      return;
    }

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

    socket.on(SOCKET_EVENTS.STREAM_START, async (payload) => {
      try {
        const { prompt, configType = 'default' } = payload;
        if (!prompt) throw new Error("Prompt is required for streaming");

        let session = await chatRepository.findBySessionId(session_id);
        if (!session) {
          session = await chatRepository.createSession({ session_id, user_id: userId });
        }
        
        await messageRepository.createMessage({
          sessionId: session._id,
          user_id: userId || 'system',
          role: 'user',
          content: prompt
        });

        const promptParts = [{ text: prompt }]; 
        const stream = await aiOrchestrator.processChatRequest(promptParts, { stream: true, configType });
        
        let accumulatedResponse = '';
        for await (const chunk of stream) {
            accumulatedResponse += chunk;
            socket.emit(SOCKET_EVENTS.STREAM_CHUNK, { chunk });
        }
        
        await messageRepository.createMessage({
          sessionId: session._id,
          user_id: userId || 'system',
          role: 'assistant',
          content: accumulatedResponse
        });
        
        socket.emit(SOCKET_EVENTS.STREAM_END, { success: true });
      } catch (error) {
        logger.error(`Streaming error: ${error.message}`);
        socket.emit(SOCKET_EVENTS.STREAM_ERROR, { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 WebSocket disconnected: ${socket.id}`);
    });
  });

  const processAudio = async (audioBuffer, socket, session_id, web_search_enabled, lang, userId) => {
    try {
      socket.emit('message', { type: 'llm_streaming_start', message: 'Transcribing audio...' });
      
      // Ensure audioBuffer has a WAV header before STT, otherwise Whisper fails on raw PCM
      const generateWavHeader = (dataLength, sampleRate = 16000, numChannels = 1, bitsPerSample = 16) => {
        const header = Buffer.alloc(44);
        header.write('RIFF', 0);
        header.writeUInt32LE(dataLength + 36, 4);
        header.write('WAVE', 8);
        header.write('fmt ', 12);
        header.writeUInt32LE(16, 16);
        header.writeUInt16LE(1, 20);
        header.writeUInt16LE(numChannels, 22);
        header.writeUInt32LE(sampleRate, 24);
        header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
        header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
        header.writeUInt16LE(bitsPerSample, 34);
        header.write('data', 36);
        header.writeUInt32LE(dataLength, 40);
        return header;
      };
      
      const wavBuffer = Buffer.concat([generateWavHeader(audioBuffer.length), audioBuffer]);
      const transcribedText = await sttService.transcribeAudio(wavBuffer);
      if (!transcribedText) {
         socket.emit('message', { type: 'llm_streaming_error', message: 'No speech detected.' });
         return;
      }
      
      let session = await chatRepository.findBySessionId(session_id);
      if (!session) {
        session = await chatRepository.createSession({ session_id, user_id: userId });
      }

      // Security check
      if (session.user_id && userId && session.user_id !== userId) {
        socket.emit('message', { type: 'llm_streaming_error', message: 'Unauthorized session access.' });
        return;
      }

      const recentMessages = await messageRepository.getRecentMessages(session._id, 20);
      const chatHistory = recentMessages.map(m => ({ role: m.role, content: m.content }));
      
      await messageRepository.createMessage({
        sessionId: session._id,
        user_id: userId || 'system',
        role: 'user',
        content: transcribedText
      });
      session.message_count += 1;
      session.last_activity = new Date();
      await chatRepository.saveSession(session);

      socket.emit('message', { type: 'llm_streaming_start', message: 'LLM is generating response...', user_message: transcribedText });
      socket.emit('message', { type: 'tts_streaming_start', message: 'Starting voice synthesis...' });

      const llmStream = llmService.generateStreamingResponse(transcribedText, chatHistory, null, lang);
      let accumulatedResponse = '';
      let currentSentenceBuffer = '';
      let ttsQueue = Promise.resolve();

      const queueTTS = (textChunk) => {
        ttsQueue = ttsQueue.then(async () => {
          try {
            const audioStream = await ttsService.client.textToSpeech.convert(ttsService.voiceId, {
              text: textChunk,
              model_id: 'eleven_turbo_v2_5', // Low latency streaming model
              output_format: 'mp3_44100_128',
            });
            const chunks = [];
            for await (const chunk of audioStream) {
              chunks.push(chunk);
            }
            // Send entire sentence MP3 as a single chunk so decodeAudioData on frontend succeeds
            const audioBase64 = Buffer.concat(chunks).toString('base64');
            socket.emit('message', {
              type: 'tts_audio_chunk',
              audio_base64,
              is_final: false
            });
          } catch (error) {
            logger.warn(`TTS generation failed for chunk: ${error.message}`);
            socket.emit('message', { type: 'error', message: `TTS failed: ${error.message}` });
          }
        });
      };

      for await (const chunk of llmStream) {
        accumulatedResponse += chunk;
        currentSentenceBuffer += chunk;
        socket.emit('message', { type: 'llm_streaming_chunk', chunk, accumulated_length: accumulatedResponse.length });

        // Split by sentence boundaries: ., !, ?, followed by space or newline
        let match;
        while ((match = currentSentenceBuffer.match(/([.?!]+)(\s+|$)/)) && match.index !== undefined) {
           const sentenceEndIdx = match.index + match[0].length;
           const sentence = currentSentenceBuffer.substring(0, sentenceEndIdx).trim();
           currentSentenceBuffer = currentSentenceBuffer.substring(sentenceEndIdx);
           
           if (sentence.length > 0) {
             queueTTS(sentence);
           }
        }
      }

      if (currentSentenceBuffer.trim().length > 0) {
        queueTTS(currentSentenceBuffer.trim());
      }

      await ttsQueue;

      await messageRepository.createMessage({
        sessionId: session._id,
        user_id: userId || 'system',
        role: 'assistant',
        content: accumulatedResponse
      });
      session.message_count += 1;
      session.last_activity = new Date();
      session.last_updated = new Date();
      await chatRepository.saveSession(session);

      socket.emit('message', { type: 'tts_audio_chunk', is_final: true });
      socket.emit('message', { type: 'llm_streaming_complete', complete_response: accumulatedResponse });
      
    } catch (error) {
      logger.error(`Error processing audio: ${error.message}`);
      socket.emit('message', { type: 'llm_streaming_error', message: error.message });
    }
  };

  return io;
};
