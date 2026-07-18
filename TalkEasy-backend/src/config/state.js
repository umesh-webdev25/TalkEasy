import { logger } from './logger.js';
import { getInitialConfig } from './settings.js';

class GlobalState {
  constructor() {
    this.sttService = null;
    this.llmService = null;
    this.ttsService = null;
    this.emailService = null;
    this.config = getInitialConfig();
  }
}

export const globalState = new GlobalState();

export const initializeServices = () => {
  logger.info("Initializing configuration state...");
  return globalState.config;
};
