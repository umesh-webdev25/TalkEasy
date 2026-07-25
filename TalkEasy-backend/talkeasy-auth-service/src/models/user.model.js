import mongoose from 'mongoose';
import { z } from 'zod';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  password_hash: { type: String, required: false },
  email_verified: { type: Boolean, default: false },
  email_deliverable: { type: Boolean },
  email_deliverable_reason: { type: String },
  last_login: { type: Date }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

export const userValidation = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(6).optional()
});
