import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

class EmailService {
  constructor() {
    this.host = process.env.SMTP_HOST;
    this.port = parseInt(process.env.SMTP_PORT || '587');
    this.user = process.env.SMTP_USER;
    this.password = process.env.SMTP_PASS;
    this.fromAddress = process.env.SMTP_FROM || this.user;
    
    if (this.isConfigured()) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.port === 465,
        auth: {
          user: this.user,
          pass: this.password,
        },
      });
    }
  }

  isConfigured() {
    return Boolean(this.host && this.port && this.user && this.password);
  }

  async sendEmail(to, subject, body) {
    if (!this.isConfigured()) {
      logger.warn("Email service not configured. Missing SMTP credentials.");
      return false;
    }
    
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text: body,
      });
      logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error sending email: ${error.message}`);
      if (error.message.includes('Authentication')) {
        logger.error("💡 For Gmail: Use App Password, not regular password!");
        logger.error("   1. Enable 2FA: https://myaccount.google.com/security");
        logger.error("   2. Generate App Password: https://myaccount.google.com/apppasswords");
      }
      return false;
    }
  }
}

export const emailService = new EmailService();
