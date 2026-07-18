import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { env } from '../config/env.js';

class AuthService {
  async createUser(email, firstName, lastName, password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      first_name: firstName,
      last_name: lastName,
      password_hash: passwordHash
    });
    await user.save();
    return user;
  }

  async authenticateUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return null;
    return user;
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async getUserById(id) {
    return await User.findById(id);
  }

  async getAllUsers() {
    return await User.find({}, { password_hash: 0 });
  }

  createAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  }

  createRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
  }

  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regex.test(email)) {
      return { is_valid: true, normalized_email: email.toLowerCase() };
    }
    return { is_valid: false, error: "Invalid email format" };
  }
}

export const authService = new AuthService();
