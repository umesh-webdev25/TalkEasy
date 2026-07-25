import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository.js';
import { generateToken, verifyToken } from 'shared';

class AuthService {
  async createUser(email, firstName, lastName, password) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser({
      email,
      first_name: firstName,
      last_name: lastName,
      password_hash: passwordHash
    });
    return user;
  }

  async authenticateUser(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return null;
    return user;
  }

  async getUserByEmail(email) {
    return await userRepository.findByEmail(email);
  }

  async getUserById(id) {
    return await userRepository.findById(id);
  }

  async getAllUsers() {
    return await userRepository.findAllUsers();
  }

  createAccessToken(payload) {
    return generateToken(payload, process.env.JWT_SECRET, '15m');
  }

  createRefreshToken(payload) {
    return generateToken(payload, process.env.JWT_SECRET, '7d');
  }

  verifyToken(token) {
    return verifyToken(token, process.env.JWT_SECRET);
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
