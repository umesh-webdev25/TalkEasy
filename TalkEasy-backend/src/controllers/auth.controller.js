import { authService } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const signup = async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    const validation = authService.validateEmail(email);
    if (!validation.is_valid) {
      return res.status(400).json({ detail: validation.error || "Invalid email" });
    }

    const user = await authService.createUser(validation.normalized_email, first_name, last_name, password);
    
    if (emailService.isConfigured()) {
      const subject = "Welcome to TalkEasy";
      const bodyText = `Hi ${first_name || ''},\n\nThanks for signing up for TalkEasy. Your account has been created.\n\nRegards,\nTalkEasy Team`;
      emailService.sendEmail(validation.normalized_email, subject, bodyText).catch(e => logger.warn(`Failed to send welcome email: ${e}`));
    }
    
    return res.json({ success: true, message: "User created successfully", user_id: user._id });
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    if (error.message === 'User already exists') {
      return res.status(409).json({ detail: error.message });
    }
    return res.status(500).json({ detail: "Failed to create user" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password required" });
    }

    const user = await authService.authenticateUser(email.toLowerCase(), password);
    if (!user) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    const payload = { sub: user.email, user_id: user._id };
    const accessToken = authService.createAccessToken(payload);
    const refreshToken = authService.createRefreshToken(payload);

    return res.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      user: { id: user._id, email: user.email, first_name: user.first_name, last_name: user.last_name }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({ detail: "Login failed" });
  }
};

export const logout = async (req, res) => {
  // Simple stateless logout since JWTs are stateless
  return res.json({ success: true, message: "Logged out" });
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.user_id);
    if (!user) return res.status(404).json({ detail: "User not found" });
    
    const userObj = user.toObject();
    delete userObj.password_hash;
    return res.json({ success: true, user: userObj });
  } catch (error) {
    logger.error(`Get me error: ${error.message}`);
    return res.status(500).json({ detail: "Failed to fetch user" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    return res.json({ success: true, users });
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    return res.status(500).json({ detail: "Failed to fetch users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await authService.getUserById(req.params.user_id);
    if (!user) return res.status(404).json({ detail: "User not found" });
    
    const userObj = user.toObject();
    delete userObj.password_hash;
    return res.json({ success: true, user: userObj });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    return res.status(500).json({ detail: "Failed to fetch user" });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ detail: "OAuth failed" });

    const payload = { sub: user.email, user_id: user._id };
    const accessToken = authService.createAccessToken(payload);
    const refreshToken = authService.createRefreshToken(payload);

    const userObj = { id: user._id, email: user.email, first_name: user.first_name, last_name: user.last_name };

    const html = `
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Login successful</title></head>
        <body>
          <script>
            try {
              localStorage.setItem('access_token', ${JSON.stringify(accessToken)});
              localStorage.setItem('refresh_token', ${JSON.stringify(refreshToken)});
              localStorage.setItem('user', JSON.stringify(${JSON.stringify(userObj)}));
            } catch(e) {}
            window.location.href = '${env.FRONTEND_URL}';
          </script>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    logger.error(`Google OAuth callback error: ${error.message}`);
    return res.status(400).json({ detail: "OAuth failed" });
  }
};
