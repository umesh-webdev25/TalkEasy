import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    feature: { type: String, required: true },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latency: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
}, { timestamps: true });

export const AIUsage = mongoose.model('AIUsage', aiUsageSchema);
