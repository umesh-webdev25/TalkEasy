import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  user_id: { type: String },
  messages: [messageSchema],
  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  last_activity: { type: Date, default: Date.now },
  message_count: { type: Number, default: 0 },
  isStarred: { type: Boolean, default: false },
  toolType: { type: String }
});

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

const fileSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  uploadedBy: { type: String },
  linkedChatId: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  extractedText: { type: String }
});

export const File = mongoose.model('File', fileSchema);
