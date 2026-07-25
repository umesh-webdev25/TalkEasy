import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
import { logger, AppError, asyncHandler, sendSuccess } from 'shared';
import { fileRepository } from '../repositories/file.repository.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { llmService } from '../services/gemini.service.js';
import { sttService } from '../services/groqWhisper.service.js';

export const uploadFile = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.user_id : null;
  const { linked_chat_id } = req.body;

  if (!req.file) {
    throw new AppError("No file provided in request payload. Please select a valid file to upload.", 400);
  }

  const fileId = uuidv4();
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase();
  
  let fileType = "document";
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) fileType = "image";
  else if (['.mp3', '.wav', '.m4a', '.webm', '.ogg'].includes(ext)) fileType = "audio";

  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, `${fileId}${ext}`);
  fs.renameSync(req.file.path, filePath);
  
  const fileUrl = `/uploads/${fileId}${ext}`;
  const fileSize = req.file.size;
  let extractedText = "";

  logger.info(`📂 Processing uploaded file: ${originalName} (${fileType}, ${fileSize} bytes)`);

  if (ext === '.pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = (data.text && data.text.trim().length > 0) ? data.text : "[Scanned or image-based PDF. Content will be analyzed dynamically via Gemini Multimodal API.]";
      logger.info(`📄 Extracted ${extractedText.length} characters from PDF ${originalName}`);
    } catch (err) {
      logger.warn(`⚠️ Warning: pdf-parse text extraction unsuccessful (${err.message}). Defaulting to native Gemini Multimodal PDF processing.`);
      extractedText = "[Scanned or image-based PDF. Content will be analyzed dynamically via Gemini Multimodal API.]";
    }
  } else if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value || "[Empty DOCX document]";
    } catch (err) {
      logger.error(`❌ Error extracting DOCX content: ${err.message}`);
      extractedText = "Failed to extract text from DOCX document.";
    }
  } else if (ext === '.txt' || ext === '.md') {
    extractedText = fs.readFileSync(filePath, 'utf-8');
  } else if (fileType === 'image') {
    extractedText = "[Uploaded Image. Content and visual features will be analyzed dynamically via Gemini Vision API.]";
  } else if (fileType === 'audio') {
    try {
      logger.info(`🎧 Audio recording detected (${originalName}). Invoking Groq Whisper STT transcription...`);
      extractedText = await sttService.transcribeAudio(filePath);
    } catch (err) {
      logger.error(`❌ STT audio transcription error during file upload: ${err.message}`);
      extractedText = "[Audio file uploaded. Transcription unsuccessful or pending.]";
    }
  }

  await fileRepository.saveFile({
    fileId,
    fileName: originalName,
    fileType,
    fileSize,
    fileUrl,
    uploadedBy: userId,
    linkedChatId: linked_chat_id,
    extractedText: extractedText ? extractedText.substring(0, 50000) : ""
  });

  sendSuccess(res, 200, "File uploaded successfully", {
    fileId,
    fileUrl,
    fileName: originalName,
    fileType,
    extractedTextPreview: extractedText ? extractedText.substring(0, 200) : ""
  });
});

export const analyzeFile = asyncHandler(async (req, res) => {
  const { file_id } = req.params;
  const { query = "Summarize this document and highlight key insights.", sessionId } = req.body;
  const userId = req.user ? req.user.user_id : null;

  const file = await fileRepository.findById(file_id);
  if (!file) {
    throw new AppError(`File reference '${file_id}' not found in database.`, 404);
  }

  const filePath = path.join(process.cwd(), file.fileUrl.startsWith('/') ? file.fileUrl.substring(1) : file.fileUrl);
  if (!fs.existsSync(filePath) && (!file.extractedText || file.extractedText.startsWith('['))) {
    throw new AppError("The physical file could not be located on the filesystem and no text content was previously extracted.", 404);
  }

  let prompt = query;
  if (file.extractedText && !file.extractedText.startsWith('[') && file.extractedText.trim().length > 10) {
    prompt = `Based on the following document text from '${file.fileName}', answer the query: '${query}'\n\nDocument Text:\n${file.extractedText.substring(0, 50000)}`;
  } else {
    prompt = `Please analyze the attached file '${file.fileName}' and address the following query: '${query}'`;
  }

  let chatHistory = [];
  if (sessionId) {
    let session = await chatRepository.findBySessionId(sessionId);
    if (!session) {
      session = await chatRepository.createSession({ session_id: sessionId, user_id: userId, messages: [] });
    }
    chatHistory = session.messages.map(m => ({ role: m.role, content: m.content }));
    
    session.messages.push({ role: 'user', content: `Analyze file '${file.fileName}': ${query}` });
    await chatRepository.saveSession(session);
  }

  logger.info(`🔬 Analyzing file ${file.fileName} (${file.fileType}) for session ${sessionId || 'none'}`);
  const responseText = await llmService.generateResponse(prompt, chatHistory, "auto", null, [file]);

  if (sessionId) {
    await chatRepository.updateSession(sessionId, 
      { $push: { messages: { role: 'assistant', content: responseText } }, last_activity: new Date(), last_updated: new Date() }
    );
  }

  sendSuccess(res, 200, "Analysis complete", { llm_response: responseText });
});


export const getUserFilesEndpoint = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.user_id : null;
  const files = await fileRepository.findByUserId(userId);
  sendSuccess(res, 200, "Files retrieved", { files });
});

export const deleteFileEndpoint = asyncHandler(async (req, res) => {
  const { file_id } = req.params;
  const userId = req.user ? req.user.user_id : null;

  const file = await fileRepository.findById(file_id);
  if (!file) throw new AppError("File not found", 404);

  if (file.uploadedBy !== userId) {
    throw new AppError("Not authorized to delete this file", 403);
  }

  if (file.fileUrl) {
    const filePath = path.join(process.cwd(), file.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await fileRepository.deleteFile(file_id);
  sendSuccess(res, 200, "File deleted");
});
