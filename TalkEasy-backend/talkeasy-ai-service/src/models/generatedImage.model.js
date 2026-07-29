import mongoose from 'mongoose';

const generatedImageSchema = new mongoose.Schema({
    prompt: { type: String, required: true },
    negativePrompt: { type: String, default: "" },
    style: { type: String, default: "default" },
    model: { type: String, required: true },
    width: { type: Number, default: 1024 },
    height: { type: Number, default: 1024 },
    seed: { type: Number },
    generationTime: { type: Number }, // latency
    cloudinaryId: { type: String },
    imageUrl: { type: String, required: true },
    userId: { type: String, required: true, index: true },
}, { timestamps: true });

export const GeneratedImage = mongoose.model('GeneratedImage', generatedImageSchema);
