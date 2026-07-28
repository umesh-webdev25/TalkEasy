import { File } from '../models/File.js';

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

  async createFile(fileData) {
    return this.saveFile(fileData);
  }

  async getFile(fileId) {
    return this.findById(fileId);
  }

  async getFilesBySession(chatId) {
    return this.findByChatId(chatId);
  }

  async deleteFile(fileId) {
    return await File.deleteOne({ fileId: fileId });
  }

  async updateFile(fileId, updateData) {
    return await File.findOneAndUpdate({ fileId: fileId }, updateData, { new: true });
  }
}

export const fileRepository = new FileRepository();
