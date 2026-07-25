import { File } from '../models/chat.model.js';

class FileRepository {
  async findByChatId(chatId) {
    return await File.find({ linkedChatId: chatId });
  }

  async findByUserId(userId) {
    return await File.find({ uploadedBy: userId });
  }

  async findById(fileId) {
    return await File.findOne({ fileId: fileId });
  }

  async saveFile(fileData) {
    const file = new File(fileData);
    await file.save();
    return file;
  }

  async deleteFile(fileId) {
    return await File.deleteOne({ fileId: fileId });
  }

  async updateFile(fileId, updateData) {
    return await File.findOneAndUpdate({ fileId: fileId }, updateData, { new: true });
  }
}

export const fileRepository = new FileRepository();
