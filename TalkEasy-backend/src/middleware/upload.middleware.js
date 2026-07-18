import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Setup storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files are temporarily saved to 'uploads/' directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename and ensure uniqueness to prevent collisions
    const uniqueSuffix = crypto.randomBytes(8).toString('hex') + '-' + Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

// File filter to restrict uploads to application/pdf
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    // Passing error to be caught by the wrapper
    const error = new Error('Invalid file type. Only application/pdf is allowed.');
    error.status = 400;
    cb(error, false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size
  },
  fileFilter
});

// Middleware wrapper to handle Multer errors gracefully and send appropriate HTTP responses
export const documentUploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors (e.g., limit exceeded)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          success: false, 
          error: 'File exceeds the maximum limit of 20MB.' 
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      // Handle custom file filter error or unknown errors
      return res.status(err.status || 500).json({ success: false, error: err.message });
    }
    
    // Check if file is actually uploaded (since it's marked as required in the workflow)
    if (!req.file) {
       // Only throw an error if the user hasn't provided a file for initial upload
       // However, we need to consider if the sessionId is provided without a file. 
       // We'll let the controller handle that logic. This middleware just handles the file if present.
    }

    next();
  });
};
