import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    content: {
      type: String,
      default: "",
    },

    fileId: {
      type: String,
      ref: "File",
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },

    attachments: [{
      type: String
    }],

    tokens: {
      type: Number,
      default: 0
    },

    latency: {
      type: Number,
      default: 0
    },

    model: {
      type: String
    },
  },
  {
    timestamps: true,
  },
);

chatMessageSchema.index({
  sessionId: 1,
  createdAt: 1,
});

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
