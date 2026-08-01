import { InferenceClient } from "@huggingface/inference";
import { env } from '../../config/env.js';
import { logger, AppError } from 'shared';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const imageGenerationService = {
    async generate(promptText, options = {}) {
        logger.info(`Generating image for prompt: ${promptText}`);
        
        let buffer;
        let ext = 'jpg';
        let imageBlobType = null;

        try {
            if (env.HF_TOKEN) {
                const client = new InferenceClient(env.HF_TOKEN);
                logger.info("Trying HuggingFace inference...");
                
                const imageBlob = await client.textToImage({
                    model: "stabilityai/stable-diffusion-3.5-large",
                    inputs: promptText,
                });
                
                imageBlobType = imageBlob.type;
                const arrayBuffer = await imageBlob.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
                
                // Analyze the first 100 bytes to check if it's JSON or plain Base64
                const textPreview = buffer.toString('utf8', 0, Math.min(buffer.length, 100)).trim();
                
                if (textPreview.startsWith('{')) {
                    const fullText = buffer.toString('utf8');
                    try {
                        const json = JSON.parse(fullText);
                        if (json.image) {
                            buffer = Buffer.from(json.image, 'base64');
                        } else if (json.images && json.images.length > 0) {
                            const imgData = json.images[0].url || json.images[0].base64;
                            if (imgData.startsWith('data:')) {
                                buffer = Buffer.from(imgData.split(',')[1], 'base64');
                            } else {
                                buffer = Buffer.from(imgData, 'base64');
                            }
                        } else {
                            throw new Error("Invalid JSON structure received from image generation API.");
                        }
                    } catch (e) {
                        logger.warn("Failed to parse JSON image response, proceeding with raw buffer");
                    }
                } else if (buffer.length > 100 && /^[a-zA-Z0-9+/]{50,}/.test(textPreview.replace(/\s+/g, ''))) {
                    // If the response is a raw base64 string
                    buffer = Buffer.from(buffer.toString('utf8').trim(), 'base64');
                }
            } else {
                throw new Error("HF_TOKEN missing, falling back to alternative.");
            }
        } catch (hfError) {
            logger.warn(`HuggingFace failed: ${hfError.message}. Falling back to Pollinations API...`);
            
            try {
                // Fallback to Pollinations API which is free and doesn't require an API key
                const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1024&height=1024&nologo=true`);
                if (!response.ok) {
                    throw new Error(`Pollinations API failed with status ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
                imageBlobType = response.headers.get('content-type');
            } catch (fallbackError) {
                logger.error(`❌ Image generation fallback failed: ${fallbackError.message}`);
                throw new AppError(`Failed to generate image: HuggingFace (${hfError.message}), Fallback (${fallbackError.message})`, 500);
            }
        }

        try {
            if (!buffer || buffer.length === 0) {
                throw new AppError("Generated image buffer is empty.", 500);
            }

            // Determine correct extension via magic bytes or fallback to blob type
            if (buffer[0] === 0xFF && buffer[1] === 0xD8) ext = 'jpg';
            else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ext = 'png';
            else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) ext = 'webp';
            else if (imageBlobType === 'image/png') ext = 'png';
            else if (imageBlobType === 'image/webp') ext = 'webp';
            
            // Ensure uploads directory exists
            const uploadDir = path.join(os.tmpdir(), 'talkeasy-uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `generated-${Date.now()}.${ext}`;
            const filePath = path.join(uploadDir, fileName);
            
            // Save image to disk
            fs.writeFileSync(filePath, buffer);
            
            // Construct the URL to serve the image statically
            const port = env.PORT || 3000;
            const imageUrl = `http://localhost:${port}/uploads/${fileName}`;

            return { imageUrl };
        } catch (error) {
            logger.error(`❌ Image generation processing failed: ${error.message}`);
            throw new AppError(`Failed to process generated image: ${error.message}`, 500);
        }
    }
};
