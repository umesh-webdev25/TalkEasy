import { ChatSession, File } from '../models/chat.model.js';
import { logger } from '../config/logger.js';
import { llmService } from '../services/gemini.service.js';
import { sttService } from '../services/groqWhisper.service.js';
import { ttsService } from '../services/elevenLabs.service.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const toolPrompts = {
  "translator": "You are a professional translator. Translate text accurately while preserving meaning and tone.",
  "meeting_notes": "You are a meeting assistant. Generate summaries, action items, decisions, and next steps.",
  "email_writer": "You are a professional email writing assistant.",
  "code_assistant": "You are an expert software engineer and coding assistant.",
  "document_summarizer": "You are an expert document summarization assistant. Create concise summaries and extract key points.",
  "pdf_analyzer": "You are an expert PDF analysis assistant. Answer questions about uploaded PDF documents and provide summaries."
};

const addMessage = async (sessionId, role, content, userId = null) => {
  let session = await ChatSession.findOne({ session_id: sessionId });
  if (!session) {
    session = new ChatSession({ session_id: sessionId, user_id: userId, messages: [] });
  }
  session.messages.push({ role, content });
  session.message_count += 1;
  session.last_activity = new Date();
  session.last_updated = new Date();
  await session.save();
  return session;
};

export const getChatHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ session_id: req.params.session_id });
    const messages = session ? session.messages : [];
    return res.json({ success: true, session_id: req.params.session_id, messages, message_count: messages.length });
  } catch (error) {
    logger.error(`Error getting chat history: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllChatHistories = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    let query = {};
    if (userId) {
      query.user_id = userId;
    }
    const histories = await ChatSession.find(query).sort({ last_activity: -1 });
    return res.json({ success: true, chat_histories: histories });
  } catch (error) {
    logger.error(`Error getting all chat histories: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleStar = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { isStarred } = req.body;
    await ChatSession.updateOne({ session_id }, { isStarred, last_updated: new Date() });
    return res.json({ success: true });
  } catch (error) {
    logger.error(`Error toggling star: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearSessionHistory = async (req, res) => {
  try {
    const { session_id } = req.params;
    await ChatSession.deleteOne({ session_id });
    return res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    logger.error(`Error clearing session history: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const searchChatMessages = async (req, res) => {
  try {
    const { query, session_id } = req.query;
    const userId = req.user ? req.user.user_id : null;
    if (!query) return res.json({ success: true, results: [], count: 0 });

    const matchConditions = {};
    if (session_id) matchConditions.session_id = session_id;
    if (userId) matchConditions.user_id = userId;

    const pipeline = [
      { $match: matchConditions },
      { $unwind: "$messages" },
      { $match: { "messages.content": { $regex: query, $options: "i" } } },
      { $project: { _id: 0, session_id: 1, message: "$messages", created_at: 1 } },
      { $sort: { "message.timestamp": -1 } },
      { $limit: 50 }
    ];

    const results = await ChatSession.aggregate(pipeline);
    return res.json({ success: true, results, count: results.length });
  } catch (error) {
    logger.error(`Error searching chat messages: ${error.message}`);
    return res.status(500).json({ success: false, results: [], error: error.message });
  }
};

export const chatWithAgentText = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { text, toolType } = req.body;
    const userId = req.user ? req.user.user_id : null;

    if (!text) return res.status(400).json({ success: false, message: "Text required" });

    let session = await ChatSession.findOne({ session_id });
    let currentToolType = toolType || (session ? session.toolType : null);

    if (!session && toolType) {
      session = new ChatSession({ session_id, user_id: userId, toolType });
      await session.save();
    }

    const systemPromptOverride = currentToolType ? toolPrompts[currentToolType] : null;

    let finalQuery = text;
    const sessionFiles = await File.find({ linkedChatId: session_id });
    if (sessionFiles && sessionFiles.length > 0) {
      const docContext = sessionFiles.map(f => `--- Document: ${f.fileName} ---\n${f.extractedText || ''}`).join('\n\n');
      if (docContext.trim()) {
        finalQuery = `Document Content:\n${docContext}\n\nUser Question:\n${text}`;
      }
    }

    await addMessage(session_id, 'user', text, userId);
    const chatHistory = session ? session.messages.map(m => ({ role: m.role, content: m.content })) : [];

    let responseText;
    try {
      responseText = await llmService.generateResponse(finalQuery, chatHistory, "auto", systemPromptOverride);
    } catch (err) {
      logger.error(`LLM generation failed: ${err.message}`);
      responseText = "I'm sorry, I am currently experiencing API limits or technical difficulties. Please try again later.";
      await addMessage(session_id, 'assistant', responseText, userId);
      return res.json({ success: true, message: err.message, llm_response: responseText, session_id, error: true });
    }

    await addMessage(session_id, 'assistant', responseText, userId);
    return res.json({ success: true, message: "Chat processed successfully", llm_response: responseText, session_id });
  } catch (error) {
    logger.error(`Error in text chat: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message, error: true });
  }
};

export const chatWithAgent = async (req, res) => {
  let tempAudioPath = null;
  try {
    const { session_id } = req.params;
    const userId = req.user ? req.user.user_id : null;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Audio file is required", error_type: "file_error" });
    }

    tempAudioPath = req.file.path;
    const transcribedText = await sttService.transcribeAudio(tempAudioPath);

    let session = await ChatSession.findOne({ session_id });
    const currentToolType = session ? session.toolType : null;
    const systemPromptOverride = currentToolType ? toolPrompts[currentToolType] : null;

    let finalQuery = transcribedText;
    const sessionFiles = await File.find({ linkedChatId: session_id });
    if (sessionFiles && sessionFiles.length > 0) {
      const docContext = sessionFiles.map(f => `--- Document: ${f.fileName} ---\n${f.extractedText || ''}`).join('\n\n');
      if (docContext.trim()) {
        finalQuery = `Document Content:\n${docContext}\n\nUser Question:\n${transcribedText}`;
      }
    }

    await addMessage(session_id, 'user', transcribedText, userId);
    const chatHistory = session ? session.messages.map(m => ({ role: m.role, content: m.content })) : [];

    let responseText;
    try {
      responseText = await llmService.generateResponse(finalQuery, chatHistory, "auto", systemPromptOverride);
    } catch (err) {
      logger.error(`LLM error: ${err.message}`);
      responseText = "I'm sorry, I encountered an error generating a response.";
    }

    await addMessage(session_id, 'assistant', responseText, userId);
    
    // We can't return the raw audio bytes easily in JSON, so we return a relative URL or base64
    // The python version generated a file and returned a URL
    let audioUrl = null;
    try {
      // In the new TTS service we return base64
      const audioBuffer = await ttsService.generateSpeech(responseText);
      const audioBase64 = audioBuffer.toString('base64');
      audioUrl = `data:audio/mp3;base64,${audioBase64}`;
    } catch (err) {
      logger.error(`TTS error: ${err.message}`);
    }

    return res.json({
      success: true,
      message: "Voice chat processed successfully",
      transcription: transcribedText,
      llm_response: responseText,
      audio_url: audioUrl,
      session_id
    });
  } catch (error) {
    logger.error(`Error in voice chat: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
  }
};
