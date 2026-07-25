import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Setup storage with directory existence check
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex') + '-' + Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

// Allowed MIME types and extensions for security and tool feature verification
const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'text/plain', 'text/markdown',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.docx', '.txt', '.md', '.mp3', '.wav', '.m4a', '.webm', '.ogg'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type (${file.mimetype || ext}). Supported formats: PNG, JPG, WEBP, PDF, DOCX, TXT, MD, MP3, WAV, M4A, WEBM.`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size
  }
});

export default upload;

// Debugging logging middleware required for verification
export const logUploadDebug = (req, res, next) => {
  console.log(req.body);
  console.log(req.file);
  console.log(req.files);
  console.log(req.file?.path);
  console.log(req.file?.mimetype);
  next();
};

// Middleware wrapper to handle Multer errors gracefully and send appropriate HTTP responses
export const documentUploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          success: false, 
          error: 'File exceeds the maximum limit of 20MB.' 
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

