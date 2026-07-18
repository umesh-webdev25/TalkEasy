import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
import { logger } from '../config/logger.js';
import { File, ChatSession } from '../models/chat.model.js';
import { llmService } from '../services/gemini.service.js';

export const uploadFile = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const { linked_chat_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileId = uuidv4();
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    
    let fileType = "document";
    if (['.png', '.jpg', '.jpeg'].includes(ext)) fileType = "image";
    else if (['.mp3', '.wav', '.m4a'].includes(ext)) fileType = "audio";

    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${fileId}${ext}`);
    fs.renameSync(req.file.path, filePath);
    
    const fileUrl = `/uploads/${fileId}${ext}`;
    const fileSize = req.file.size;
    let extractedText = "";

    if (ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        extractedText = data.text;
      } catch (err) {
        logger.error(`Error extracting PDF: ${err.message}`);
        extractedText = "Error extracting text.";
      }
    } else if (ext === '.docx') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } catch (err) {
        logger.error(`Error extracting DOCX: ${err.message}`);
        extractedText = "Error extracting text.";
      }
    } else if (ext === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    }

    const newFile = new File({
      fileId,
      fileName: originalName,
      fileType,
      fileSize,
      fileUrl,
      uploadedBy: userId,
      linkedChatId: linked_chat_id,
      extractedText: extractedText.substring(0, 50000)
    });
    await newFile.save();

    return res.json({
      success: true,
      fileId,
      message: "File uploaded successfully",
      extractedTextPreview: extractedText ? extractedText.substring(0, 200) : ""
    });

  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const analyzeFile = async (req, res) => {
  try {
    const { file_id } = req.params;
    const { query = "Summarize this document", sessionId } = req.body;
    const userId = req.user ? req.user.user_id : null;

    const file = await File.findOne({ fileId: file_id });
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const extractedText = file.extractedText;
    if (!extractedText) return res.json({ success: false, message: "No text extracted from this file." });

    const prompt = `Based on the following document text, answer the query: '${query}'\n\nDocument Text:\n${extractedText.substring(0, 30000)}`;

    let chatHistory = [];
    if (sessionId) {
      let session = await ChatSession.findOne({ session_id: sessionId });
      if (!session) {
        session = new ChatSession({ session_id: sessionId, user_id: userId, messages: [] });
      }
      chatHistory = session.messages.map(m => ({ role: m.role, content: m.content }));
      
      session.messages.push({ role: 'user', content: `Analyze file '${file.fileName}': ${query}` });
      await session.save();
    }

    const responseText = await llmService.generateResponse(prompt, chatHistory);

    if (sessionId) {
      await ChatSession.updateOne(
        { session_id: sessionId },
        { $push: { messages: { role: 'assistant', content: responseText } }, last_activity: new Date(), last_updated: new Date() }
      );
    }

    return res.json({ success: true, message: "Analysis complete", llm_response: responseText });
  } catch (error) {
    logger.error(`Error analyzing file: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserFilesEndpoint = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const files = await File.find({ uploadedBy: userId }, { _id: 0 }).sort({ uploadedAt: -1 });
    return res.json({ success: true, files });
  } catch (error) {
    return res.status(500).json({ success: false, files: [], error: error.message });
  }
};

export const deleteFileEndpoint = async (req, res) => {
  try {
    const { file_id } = req.params;
    const userId = req.user ? req.user.user_id : null;

    const file = await File.findOne({ fileId: file_id });
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    if (file.uploadedBy !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this file" });
    }

    if (file.fileUrl) {
      const filePath = path.join(process.cwd(), file.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await File.deleteOne({ fileId: file_id, uploadedBy: userId });
    return res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};
