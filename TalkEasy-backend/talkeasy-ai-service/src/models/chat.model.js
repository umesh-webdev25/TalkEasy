import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true
  },

  user_id: {
    type: String,
    required: true,
    index: true
  },

  title: {
    type: String,
    default: "New Chat"
  },

  toolType: {
    type: String
  },

  isPinned: {
    type: Boolean,
    default: false
  },

  isArchived: {
    type: Boolean,
    default: false
  },

  model: {
    type: String
  },

  lastMessage: {
    type: String
  },

  message_count: {
    type: Number,
    default: 0
  },

  isStarred: {
    type: Boolean,
    default: false
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  last_updated: {
    type: Date,
    default: Date.now
  },

  last_activity: {
    type: Date,
    default: Date.now
  }
});

chatSessionSchema.index({
  user_id: 1,
  last_updated: -1
});

export const ChatSession =
  mongoose.model(
    "ChatSession",
    chatSessionSchema
  );
