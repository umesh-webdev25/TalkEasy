import cloudinary from "../config/cloudinary.js";
import pino from "pino";

const logger = pino({ name: "cloudinary-service" });

class CloudinaryService {
  /**
   * Upload an image to Cloudinary
   * @param {string} filePath - Local file path
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(filePath) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "TalkEasy/images",
        resource_type: "image",
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      logger.error({ err: error }, "Error uploading image to Cloudinary");
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  /**
   * Upload a PDF to Cloudinary
   * @param {string} filePath - Local file path
   * @returns {Promise<Object>} Upload result
   */
  async uploadPdf(filePath) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "TalkEasy/pdfs",
        resource_type: "raw",
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      logger.error({ err: error }, "Error uploading PDF to Cloudinary");
      throw new Error("Failed to upload PDF to Cloudinary");
    }
  }

  /**
   * Upload a file based on mimeType
   * @param {string} filePath - Local file path
   * @param {string} mimeType - File mimeType
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(filePath, mimeType) {
    if (mimeType && mimeType.startsWith("image/")) {
      return await this.uploadImage(filePath);
    } else {
      return await this.uploadPdf(filePath);
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - Cloudinary public_id
   * @param {string} resourceType - Resource type ('image', 'raw', etc)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(publicId, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, `Error deleting file from Cloudinary (publicId: ${publicId})`);
      throw new Error("Failed to delete file from Cloudinary");
    }
  }
}

export default new CloudinaryService();