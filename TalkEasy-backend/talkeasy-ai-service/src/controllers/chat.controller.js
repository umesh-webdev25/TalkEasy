import { chatRepository } from '../repositories/chat.repository.js';
import { fileRepository } from '../repositories/file.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { logger, AppError, asyncHandler, sendSuccess } from 'shared';
import { llmService } from '../services/gemini.service.js';
import { sttService } from '../services/groqWhisper.service.js';
import { ttsService } from '../services/elevenLabs.service.js';
import { eventBus } from '../services/eventBus.service.js';
import { titleGeneratorService } from '../services/titleGenerator.service.js';
import fs from 'fs';

const toolPrompts = {
  "translator": "You are an expert polyglot linguist and professional translation engineer. Accurately translate the input text to the target language requested by the user while preserving idiomatic nuance, grammar, tone, and formatting. If no target language is explicitly specified, detect the source language and provide clear translations into major global languages (English, Spanish, French, Hindi). Never leave translations empty.",
  "meeting_notes": "You are an expert executive meeting assistant and transcript analyst. Given an audio transcript or meeting notes, analyze the content and ALWAYS format your response in exactly the following structured Markdown sections:\n\n## Meeting Summary\nA concise executive overview of what was discussed.\n\n## Action Items\n- [ ] Action item details (assignee and deadline if mentioned)\n\n## Key Points\n- Core decisions, facts, and milestones discussed.\n\n## Follow-ups\n- Next steps and scheduled check-ins.",
  "email_writer": "You are a professional corporate communications specialist and email writer. Generate perfectly structured, compelling, and grammatically flawless emails based on the user's instructions. ALWAYS follow this exact format:\n\n**Subject:** [Clear and action-oriented subject line]\n\n[Professional Salutation],\n\n[Concise opening statement regarding the purpose of the email]\n\n[Structured body content, utilizing clear bullet points if applicable for readability]\n\n[Professional call to action or closing remark]\n\n[Professional Sign-off],\n[Name / Sender Title]",
  "code_assistant": "You are an elite Principal Software Engineer and Architectural Consultant. Provide clean, robust, modern, and production-ready code solutions. ALWAYS use GitHub-flavored Markdown fenced code blocks specifying the language (e.g., ```javascript, ```python, ```tsx). Explain your architectural decisions, logic, syntax highlighting, and edge cases clearly. Do not truncate, compress, or omit necessary lines of code.",
  "document_summarizer": "You are a specialized Document Intelligence Analyst. Read the provided document contents (PDF, DOCX, TXT, Markdown) and provide a structured executive summary, core takeaways, and critical analysis. Format key findings cleanly using Markdown bullet points and section headers.",
  "pdf_analyzer": "You are an advanced Multimodal PDF Intelligence Agent. Inspect uploaded PDF documents (both text-based and scanned images), perform OCR via Gemini Vision if necessary, interpret tables/charts, and accurately answer specific questions with direct evidence from the text.",
  "image_analyzer": "You are an expert Computer Vision Specialist and Image Analyst using Google Gemini Vision. Describe uploaded images (PNG, JPG, WEBP) in meticulous detail, perform Optical Character Recognition (OCR), read handwriting, explain financial charts/graphs, detect objects, and answer explicit questions regarding visual context."
};

const addMessage = async (sessionId, role, content, userId = null, fileId = null) => {
  let session = await chatRepository.findBySessionId(sessionId);
  if (!session) {
    session = await chatRepository.createSession({ session_id: sessionId, user_id: userId });
  }

  // Security Check: If a session exists, ensure the user owns it
  if (session.user_id && userId && session.user_id !== userId) {
    throw new AppError("Unauthorized access to chat session.", 403);
  }

  await messageRepository.createMessage({
    sessionId: session._id,
    user_id: userId || 'system',
    role,
    content,
    fileId
  });

  session.message_count += 1;
  session.last_activity = new Date();
  session.last_updated = new Date();
  await chatRepository.saveSession(session);
  return session;
};

export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.user_id : null;
  const session = await chatRepository.findBySessionId(req.params.session_id);
  
  if (!session) {
    return sendSuccess(res, 200, "Chat history retrieved", { session_id: req.params.session_id, messages: [], message_count: 0 });
  }

  if (session.user_id && userId && session.user_id !== userId) {
    throw new AppError("Unauthorized access to chat session.", 403);
  }

  // Support Pagination
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;

  const messages = await messageRepository.getMessagesBySession(session._id, limit, skip);
  sendSuccess(res, 200, "Chat history retrieved", { session_id: req.params.session_id, messages, message_count: session.message_count });
});

export const getAllChatHistories = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.user_id : null;
  const histories = await chatRepository.findByUserId(userId);
  sendSuccess(res, 200, "Chat histories retrieved", { chat_histories: histories });
});

export const toggleStar = asyncHandler(async (req, res) => {
  const { session_id } = req.params;
  const { isStarred } = req.body;
  const userId = req.user ? req.user.user_id : null;

  const session = await chatRepository.findBySessionId(session_id);
  if (session && session.user_id && userId && session.user_id !== userId) {
    throw new AppError("Unauthorized access to chat session.", 403);
  }

  await chatRepository.updateSession(session_id, { isStarred, last_updated: new Date() });
  sendSuccess(res, 200, "Star toggled");
});

export const clearSessionHistory = asyncHandler(async (req, res) => {
  const { session_id } = req.params;
  const userId = req.user ? req.user.user_id : null;

  const session = await chatRepository.findBySessionId(session_id);
  if (session) {
    if (session.user_id && userId && session.user_id !== userId) {
      throw new AppError("Unauthorized access to chat session.", 403);
    }
    await messageRepository.deleteMessagesBySession(session._id);
    await chatRepository.deleteSession(session_id);
  }

  sendSuccess(res, 200, "Chat history cleared");
});

export const searchChatMessages = asyncHandler(async (req, res) => {
  const { query, session_id } = req.query;
  const userId = req.user ? req.user.user_id : null;
  if (!query) return res.json({ success: true, results: [], count: 0 });

  const matchConditions = {};
  if (userId) matchConditions.user_id = userId;

  if (session_id) {
    const session = await chatRepository.findBySessionId(session_id);
    if (session) {
      if (session.user_id && userId && session.user_id !== userId) {
        throw new AppError("Unauthorized access to chat session.", 403);
      }
      matchConditions.sessionId = session._id;
    } else {
      return res.json({ success: true, results: [], count: 0 });
    }
  }

  const results = await messageRepository.searchMessages(matchConditions, query);
  sendSuccess(res, 200, "Search completed", { results, count: results.length });
});

export const chatWithAgentText = asyncHandler(async (req, res) => {
  const { session_id } = req.params;
  const { text, toolType } = req.body;
  const userId = req.user ? req.user.user_id : null;

  if (!text) {
    throw new AppError("Message text is required in request payload", 400);
  }

  let session = await chatRepository.findBySessionId(session_id);
  
  if (session && session.user_id && userId && session.user_id !== userId) {
    throw new AppError("Unauthorized access to chat session.", 403);
  }

  let currentToolType = toolType || (session ? session.toolType : null);

  if (!session && toolType) {
    session = await chatRepository.createSession({ session_id, user_id: userId, toolType });
  }

  const systemPromptOverride = currentToolType ? toolPrompts[currentToolType] : null;
  if (currentToolType && !toolPrompts[currentToolType]) {
    logger.info(`Tool type '${currentToolType}' initiated with specialized mode.`);
  }

  let finalQuery = text;
  let sessionFiles = await fileRepository.findByChatId(session ? session._id : session_id) || [];

  // Extract file IDs from message tags like [FILE:uuid] and associate them with this chat
  const fileMatches = text.match(/\[FILE:([a-zA-Z0-9-]+)\]/g);
  if (fileMatches) {
    for (const match of fileMatches) {
      const id = match.replace('[FILE:', '').replace(']', '');
      const existing = sessionFiles.find(f => f.fileId === id);
      if (!existing) {
        const file = await fileRepository.findById(id);
        if (file) {
          await fileRepository.updateFile(id, { linkedChatId: session ? session._id : session_id });
          sessionFiles.push(file);
        }
      }
    }
  }

  if (sessionFiles && sessionFiles.length > 0) {
    const docContext = sessionFiles.map(f => `--- Attached ${f.fileType || 'File'}: ${f.fileName} ---\n${f.extractedText || '[Multimodal Attachment]'}`).join('\n\n');
    if (docContext.trim()) {
      finalQuery = `Attached Files & Document Context:\n${docContext}\n\nUser Message:\n${text}`;
    }
  }

  await addMessage(session_id, 'user', text, userId);
  
  const recentMessages = session ? await messageRepository.getRecentMessages(session._id, 20) : [];
  const chatHistory = recentMessages.map(m => ({ role: m.role, content: m.content }));

  let responseText;
  try {
    responseText = await llmService.generateResponse(finalQuery, chatHistory, "auto", systemPromptOverride, sessionFiles);
  } catch (err) {
    logger.error(`❌ LLM text generation failed in chat controller: ${err.message}`);
    responseText = `Error: ${err.message || "I encountered technical difficulties processing your request. Please try again later."}`;
    await addMessage(session_id, 'assistant', responseText, userId);
    return res.status(500).json({ success: false, message: err.message, llm_response: responseText, session_id, error: true });
  }

  await addMessage(session_id, 'assistant', responseText, userId);

  // Generate dynamic title in the background if this is the first message
  if (!session || session.message_count === 1) {
    titleGeneratorService.generateTitleAsync(session_id, userId, text).catch(e => logger.error(`Title generation background task error: ${e.message}`));
  }

  return res.json({ success: true, message: "Chat processed successfully", llm_response: responseText, session_id });
});

export const chatWithAgent = asyncHandler(async (req, res) => {
  let tempAudioPath = null;
  try {
    const { session_id } = req.params;
    const userId = req.user ? req.user.user_id : null;

    if (!req.file) {
      throw new AppError("Audio recording file is required in request payload", 400);
    }

    tempAudioPath = req.file.path;
    logger.info(`🎙️ Voice chat received audio file at ${tempAudioPath} (${req.file.size} bytes). Transcribing...`);
    
    const transcribedText = await sttService.transcribeAudio(tempAudioPath);
    if (!transcribedText) {
      throw new AppError("No speech detected in recorded audio.", 400);
    }

    let session = await chatRepository.findBySessionId(session_id);
    
    if (session && session.user_id && userId && session.user_id !== userId) {
      throw new AppError("Unauthorized access to chat session.", 403);
    }

    const currentToolType = session ? session.toolType : null;
    const systemPromptOverride = currentToolType ? toolPrompts[currentToolType] : null;

    let finalQuery = transcribedText;
    const sessionFiles = await fileRepository.findByChatId(session ? session._id : session_id) || [];
    if (sessionFiles && sessionFiles.length > 0) {
      const docContext = sessionFiles.map(f => `--- Attached Document: ${f.fileName} ---\n${f.extractedText || '[Multimodal Attachment]'}`).join('\n\n');
      if (docContext.trim()) {
        finalQuery = `Attached Document Content:\n${docContext}\n\nTranscribed Voice Query:\n${transcribedText}`;
      }
    }

    await addMessage(session_id, 'user', transcribedText, userId);
    
    const recentMessages = session ? await messageRepository.getRecentMessages(session._id, 20) : [];
    const chatHistory = recentMessages.map(m => ({ role: m.role, content: m.content }));

    let responseText;
    try {
      responseText = await llmService.generateResponse(finalQuery, chatHistory, "auto", systemPromptOverride, sessionFiles);
    } catch (err) {
      logger.error(`❌ LLM voice generation failed in chat controller: ${err.message}`);
      responseText = `I encountered an error generating a response: ${err.message}`;
    }

    await addMessage(session_id, 'assistant', responseText, userId);
    
    let audioUrl = null;
    try {
      const audioBuffer = await ttsService.generateSpeech(responseText);
      if (audioBuffer) {
        const audioBase64 = audioBuffer.toString('base64');
        audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      }
    } catch (err) {
      logger.error(`❌ ElevenLabs TTS error: ${err.message}`);
    }

    // Generate dynamic title in the background if this is the first message
    if (!session || session.message_count === 1) {
      titleGeneratorService.generateTitleAsync(session_id, userId, transcribedText).catch(e => logger.error(`Title generation background task error: ${e.message}`));
    }

    return res.json({
      success: true,
      message: "Voice chat processed successfully",
      transcription: transcribedText,
      llm_response: responseText,
      audio_url: audioUrl,
      session_id
    });
  } finally {
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
        logger.info(`🧹 Successfully removed temporary voice recording: ${tempAudioPath}`);
      } catch (cleanupErr) {
        logger.warn(`⚠️ Failed to remove temporary audio file: ${cleanupErr.message}`);
      }
    }
  }
});

export const subscribeToChatEvents = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.user_id : null;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const handleTitleUpdate = (data) => {
    if (data.userId === userId) {
      res.write(`event: title_updated\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  eventBus.on('chat_title_updated', handleTitleUpdate);

  req.on('close', () => {
    eventBus.off('chat_title_updated', handleTitleUpdate);
  });
});
