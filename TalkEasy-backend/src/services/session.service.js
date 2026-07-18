import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'session-service' });

class SessionService {
  constructor() {
    // In-memory session store. For a production app with horizontal scaling, 
    // this would be replaced with Redis or a database.
    this.sessions = new Map();
    // Default session timeout: 2 hours (in milliseconds)
    this.SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; 
  }

  /**
   * Creates a new document session and schedules its cleanup
   * @param {object} metadata - Initial metadata (documentId, filename, mimeType)
   * @returns {object} The created session
   */
  createSession(metadata) {
    const sessionId = uuidv4();
    const now = Date.now();
    
    const session = {
      sessionId,
      documentId: metadata.documentId,
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      uploadedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.SESSION_TIMEOUT_MS).toISOString(),
      geminiFileUri: null,
      geminiFileName: null, 
      extractedText: null, // used if fallback was needed
      pageCount: null,
      history: [] // For conversation context
    };

    this.sessions.set(sessionId, session);
    logger.info({ sessionId, filename: session.filename }, 'New document session created');
    
    // Automatically schedule cleanup
    setTimeout(() => this.deleteSession(sessionId), this.SESSION_TIMEOUT_MS);

    return session;
  }

  /**
   * Retrieves an active session, extending its expiration time
   * @param {string} sessionId - The session ID
   * @returns {object|null} The session object, or null if not found/expired
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check expiration just in case setTimeout hasn't fired or was missed
    if (new Date() > new Date(session.expiresAt)) {
      this.deleteSession(sessionId);
      return null;
    }

    // Extend expiration on use (rolling session)
    const now = Date.now();
    session.expiresAt = new Date(now + this.SESSION_TIMEOUT_MS).toISOString();
    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * Updates an existing session with new data
   * @param {string} sessionId - The session ID
   * @param {object} data - Data to merge into the session
   * @returns {boolean} True if updated, false if session not found
   */
  updateSession(sessionId, data) {
    if (!this.sessions.has(sessionId)) {
      return false;
    }
    const session = this.sessions.get(sessionId);
    Object.assign(session, data);
    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Deletes a session
   * @param {string} sessionId - The session ID
   */
  deleteSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      // NOTE: Gemini File API files automatically expire after 48 hours. 
      // If immediate cleanup is required, we could call geminiService.deleteFile(session.geminiFileName) here.
      this.sessions.delete(sessionId);
      logger.info({ sessionId }, 'Session expired and deleted');
    }
  }
}

export const sessionService = new SessionService();
