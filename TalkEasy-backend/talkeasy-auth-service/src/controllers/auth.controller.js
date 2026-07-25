import { authService } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';
import { logger, AppError, asyncHandler, sendSuccess } from 'shared';

export const signup = asyncHandler(async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const validation = authService.validateEmail(email);
  if (!validation.is_valid) {
    throw new AppError(validation.error || "Invalid email", 400);
  }

  try {
    const user = await authService.createUser(validation.normalized_email, first_name, last_name, password);
    
    if (emailService.isConfigured()) {
      const subject = "Welcome to TalkEasy";
      const bodyText = `Hi ${first_name || ''},\n\nThanks for signing up for TalkEasy. Your account has been created.\n\nRegards,\nTalkEasy Team`;
      emailService.sendEmail(validation.normalized_email, subject, bodyText).catch(e => logger.warn(`Failed to send welcome email: ${e}`));
    }
    
    sendSuccess(res, 200, "User created successfully", { user_id: user._id });
  } catch (error) {
    if (error.message === 'User already exists') {
      throw new AppError(error.message, 409);
    }
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password required", 400);
  }

  const user = await authService.authenticateUser(email.toLowerCase(), password);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
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
});

export const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "Logged out");
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.user_id);
  if (!user) throw new AppError("User not found", 404);
  
  const userObj = user.toObject();
  delete userObj.password_hash;
  return res.json({ success: true, user: userObj });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await authService.getAllUsers();
  return res.json({ success: true, users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.params.user_id);
  if (!user) throw new AppError("User not found", 404);
  
  const userObj = user.toObject();
  delete userObj.password_hash;
  return res.json({ success: true, user: userObj });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError("OAuth failed", 401);

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
          window.location.href = '${process.env.FRONTEND_URL}';
        </script>
      </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});
