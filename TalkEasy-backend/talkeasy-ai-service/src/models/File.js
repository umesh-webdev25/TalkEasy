import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    uploadedBy: {
     type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    linkedChatId: {
      type: String,
      ref: "ChatSession",
      required: false,
      index: true
    },

    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
      index: true
    },

    fileName: {
      type: String,
      required: true
    },

    fileType: {
      type: String
    },

    fileSize: {
      type: Number
    },

    fileUrl: {
      type: String
    },

    cloudinaryUrl: {
      type: String
    },

    cloudinaryPublicId: {
      type: String
    },

    extractedText: {
      type: String,
      default: ""
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

fileSchema.index({
  linkedChatId: 1,
  createdAt: -1
});

export const File = mongoose.model(
  "File",
  fileSchema
);