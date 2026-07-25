import { User } from '../models/user.model.js';

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(id) {
    return await User.findById(id);
  }

  async findAllUsers() {
    return await User.find({}, { password_hash: 0 });
  }

  async createUser(userData) {
    const user = new User(userData);
    await user.save();
    return user;
  }
}

export const userRepository = new UserRepository();
