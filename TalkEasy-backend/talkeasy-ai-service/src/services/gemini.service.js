import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { logger } from 'shared';
import { customWebSearchService as webSearchService } from './webSearch.service.js';
import { skillsManager } from './skills.service.js';
import { createCircuitBreaker } from '../utils/circuitBreaker.js';
import { cacheService } from './cache/cache.service.js';

const PERSONA_PROMPTS = {
  "default": "a helpful AI assistant",
  "pirate": "a friendly pirate who speaks with nautical terms and pirate slang like 'Arrr', 'matey', 'shiver me timbers', and 'yo ho ho'",
  "developer": "a knowledgeable software developer who explains technical concepts clearly and uses programming examples when appropriate",
  "cowboy": "an old west cowboy who speaks with western slang like 'howdy partner', 'yeehaw', 'varmint', and 'rootin' tootin'",
  "robot": "a logical robot who speaks with technical precision, uses binary references, and says 'beep boop' occasionally"
};

class LLMService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelName = "gemini-2.5-flash";
    this.persona = PERSONA_PROMPTS[env.AGENT_PERSONA] || PERSONA_PROMPTS["default"];
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    
    this.generateContentBreaker = createCircuitBreaker(
      async (promptOrParts) => {
        return await this.model.generateContent(promptOrParts);
      },
      { timeout: 15000 },
      () => {
        throw new Error("The AI service is currently experiencing high load or connectivity issues. Please try again in a few moments.");
      }
    );

    this.generateContentStreamBreaker = createCircuitBreaker(
      async (promptOrParts) => {
        return await this.model.generateContentStream(promptOrParts);
      },
      { timeout: 15000 },
      () => {
        throw new Error("The AI streaming service is currently down or busy. Please try again later.");
      }
    );

    logger.info(`🤖 LLM Service initialized with model: ${this.modelName}, persona: ${this.persona}`);
  }

  setPersona(persona) {
    this.persona = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS["default"];
    logger.info(`🤖 Persona switched to: ${this.persona}`);
  }

  _detectLanguage(text) {
    if (!text) return "en";
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0900 && code <= 0x097F) {
        return "hi";
      }
    }
    return "en";
  }

  formatChatHistoryForLLM(messages) {
    if (!messages || messages.length === 0) return "";
    let formattedHistory = "\n\nPrevious conversation context:\n";
    for (const msg of messages) {
      const role = msg.role === "user" ? "User" : "Assistant";
      formattedHistory += `${role}: ${msg.content}\n`;
    }
    return formattedHistory;
  }

  _shouldPerformWebSearch(userMessage) {
    const userMessageLower = userMessage.toLowerCase();
    const triggers = ['search for', 'search google for', 'search google', 'find information about', 'look up', 'tell me about'];
    if (triggers.some(t => userMessageLower.includes(t))) return true;
    
    const questions = ['what is', 'who is', 'when is', 'where is', 'how to'];
    if (questions.some(q => userMessageLower.startsWith(q))) return true;
    
    const currentInfoTopics = ['news', 'weather', 'stock', 'price', 'recent', 'latest', 'current', 'today', 'now'];
    if (currentInfoTopics.some(topic => userMessageLower.includes(topic))) return true;
    
    return false;
  }

  _extractSearchQuery(userMessage) {
    const userMessageLower = userMessage.toLowerCase();
    const searchPhrases = [
        'search for', 'search google for', 'search google', 'find information about', 'look up', 
        'what is', 'who is', 'when is', 'where is', 'how to',
        'tell me about', 'information on', 'details about'
    ];
    for (const phrase of searchPhrases) {
      if (userMessageLower.includes(phrase)) {
        return userMessageLower.split(phrase)[1].trim();
      }
    }
    return userMessage.trim();
  }

  _extractNewsCategory(userMessage) {
    const userMessageLower = userMessage.toLowerCase();
    const categories = {
        'business': ['business', 'finance', 'economy', 'market', 'stock'],
        'technology': ['technology', 'tech', 'ai', 'artificial intelligence', 'computer'],
        'sports': ['sports', 'football', 'basketball', 'soccer', 'baseball'],
        'entertainment': ['entertainment', 'movie', 'music', 'celebrity', 'hollywood'],
        'health': ['health', 'medical', 'medicine', 'covid', 'pandemic'],
        'science': ['science', 'research', 'discovery', 'space', 'nasa']
    };
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => userMessageLower.includes(keyword))) {
        return category;
      }
    }
    return "general";
  }

  _formatNewsResponse(newsData, category, locale = 'en') {
    const cacheKey = cacheService.generateKey('news_fragment', category, locale);
    
    let cachedTemplate = cacheService.cache.get(cacheKey)?.value;
    
    if (!cachedTemplate) {
      const articles = newsData.articles || [];
      if (articles.length === 0) {
        return "No news articles found for this category.";
      }
      const topArticles = articles.slice(0, 3);
      let template = `{{PERSONA_GREETING}}\n\nHere are the latest ${category} news headlines:\n\n`;
      topArticles.forEach((article, i) => {
        const title = article.title || "No title available";
        const source = (article.source && article.source.name) || "Unknown source";
        template += `${i + 1}. ${title} - ${source}\n`;
      });
      template += "\nWould you like me to read any of these articles in detail?";
      
      cachedTemplate = template;
      cacheService.set(cacheKey, template, 15 * 60, { isFragment: true });
    }

    const personaGreeting = `[Assistant Persona: ${this.persona}]`;
    return cacheService.hydrateHoles(cachedTemplate, { PERSONA_GREETING: personaGreeting });
  }

  async generateResponse(userMessage, chatHistory, language = "auto", systemPromptOverride = null, attachments = []) {
    const startTime = Date.now();
    try {
      if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in backend configuration.");
      }

      let lang = language;
      if (language === "auto") {
        lang = this._detectLanguage(userMessage);
      }

      let languageInstruction = "";
      // Do not impose English restrictions when a system prompt override exists (e.g. Translator or Code tool)
      if (!systemPromptOverride) {
        if (lang === "both") {
          languageInstruction = "Provide the answer in BOTH English and Hindi. First provide the English version, then the Hindi translation separated by '---'.\n";
        } else if (lang === "hi") {
          languageInstruction = "Respond in Hindi only.\n";
        }
      }

      if (this._shouldPerformWebSearch(userMessage) && !systemPromptOverride) {
        const query = this._extractSearchQuery(userMessage);
        logger.info(`🔍 Performing web search for query: ${query}`);
        
        try {
          const searchResults = await webSearchService.searchWeb(query);
          const formattedResults = webSearchService.formatSearchResults(searchResults, query);
          
          const historyContext = this.formatChatHistoryForLLM(chatHistory);
          const currentPersona = this.persona;
          
          let enhancedPrompt = `You are ${currentPersona}. Based on the following search results, provide a comprehensive answer to the user's question.\n\nSEARCH RESULTS FOR "${query}":\n${formattedResults}\n\nUSER'S ORIGINAL QUESTION: "${userMessage}"\n\n${historyContext}\n\nPlease provide a helpful, accurate answer based on the search results.\nSummarize the key information and cite relevant sources if appropriate.`;
          enhancedPrompt = `${languageInstruction}\n${enhancedPrompt}`;
          
          const result = await this.generateContentBreaker.fire(enhancedPrompt);
          const responseText = result.response.text();
          
          if (responseText && responseText.trim()) {
            logger.info(`⚡ Gemini response generated in ${Date.now() - startTime}ms`);
            return responseText.trim();
          }
          return formattedResults;
        } catch (error) {
          logger.error(`Web search failed: ${error.message}`);
        }
      }

      if (['news', 'headlines', 'latest news', 'current events', 'breaking news'].some(k => userMessage.toLowerCase().includes(k)) && !systemPromptOverride) {
        const category = this._extractNewsCategory(userMessage);
        logger.info(`📰 Fetching news for category: ${category} (locale: ${lang})`);
        const newsServiceSkill = skillsManager.getSkill("news");
        if (newsServiceSkill) {
          const newsData = await newsServiceSkill.getNewsHeadlines(category, lang);
          if (!newsData.error && newsData.articles && newsData.articles.length > 0) {
            return this._formatNewsResponse(newsData, category, lang);
          } else {
            return "I couldn't fetch the latest news at the moment. Please try again later.";
          }
        }
      }

      const historyContext = this.formatChatHistoryForLLM(chatHistory);
      const currentPersona = systemPromptOverride || `You are ${this.persona}. Please respond directly and accurately to the user's input.`;
      
      const llmPrompt = `${languageInstruction}${currentPersona}\n\nIMPORTANT: Provide a complete, comprehensive, and well-formatted answer without cutting off or abbreviating your solution.\n\nUser Input: "${userMessage}"\n${historyContext}`;
      
      const parts = [];
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          let absPath = att.filePath;
          if (!absPath && att.fileUrl) {
            absPath = path.join(process.cwd(), att.fileUrl.startsWith('/') ? att.fileUrl.substring(1) : att.fileUrl);
          }
          if (absPath && fs.existsSync(absPath)) {
            const ext = path.extname(absPath).toLowerCase();
            const isImageOrPdf = ['image', 'pdf'].includes(att.fileType) || ['.png', '.jpg', '.jpeg', '.webp', '.pdf'].includes(ext);
            if (isImageOrPdf) {
              const buffer = fs.readFileSync(absPath);
              let mime = att.mimeType || 'application/octet-stream';
              if (ext === '.png') mime = 'image/png';
              else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
              else if (ext === '.webp') mime = 'image/webp';
              else if (ext === '.pdf') mime = 'application/pdf';
              logger.info(`📎 Attaching multimodal file (${absPath}, ${mime}) directly to Gemini prompt`);
              parts.push({
                inlineData: {
                  data: buffer.toString('base64'),
                  mimeType: mime
                }
              });
            }
          }
        }
      }
      parts.push({ text: llmPrompt });

      logger.info(`🤖 Sending generateContent request to Gemini (${parts.length} content parts)...`);
      const result = await this.generateContentBreaker.fire(parts.length > 1 ? parts : llmPrompt);
      const responseText = result.response.text();
      
      if (!responseText || !responseText.trim()) {
        throw new Error("Received empty response text from Gemini API.");
      }
      
      logger.info(`✅ Gemini generateContent completed in ${Date.now() - startTime}ms (${responseText.length} chars)`);
      return responseText.trim();
    } catch (error) {
      logger.error(`❌ LLM response generation error in ${Date.now() - startTime}ms: ${error.message}`);
      if (error.message.toLowerCase().includes("quota") || error.message.includes("429")) {
        throw new Error("API rate limit or quota exceeded for Google Gemini. Please retry in a few moments or verify your API billing.");
      } else if (error.message.includes("403") || error.message.toLowerCase().includes("unauthorized") || error.message.includes("API_KEY")) {
        throw new Error("Google Gemini API key is missing, invalid, or unauthorized.");
      }
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async *generateStreamingResponse(userMessage, chatHistory, webSearchResults = null, language = "auto", systemPromptOverride = null, attachments = []) {
    const startTime = Date.now();
    try {
      if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in backend configuration.");
      }

      let lang = language;
      if (language === "auto") {
        lang = this._detectLanguage(userMessage);
      }

      let languageInstruction = "";
      if (!systemPromptOverride) {
        if (lang === "both") {
          languageInstruction = "Provide the answer in BOTH English and Hindi. First provide the English version, then the Hindi translation separated by '---'.\n";
        } else if (lang === "hi") {
          languageInstruction = "Respond in Hindi only.\n";
        }
      }

      const historyContext = this.formatChatHistoryForLLM(chatHistory);
      const currentPersona = systemPromptOverride || `You are ${this.persona}. Please respond directly to the user's request.`;
      
      let llmPrompt = `${languageInstruction}${currentPersona}\n\nIMPORTANT: Provide a complete, comprehensive, and well-formatted answer without cutting off your response.\n\nUser Input: "${userMessage}"\n${historyContext}`;
      if (webSearchResults) {
        llmPrompt += `\n\nWEB SEARCH RESULTS:\n${webSearchResults}`;
      }

      const parts = [];
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          let absPath = att.filePath;
          if (!absPath && att.fileUrl) {
            absPath = path.join(process.cwd(), att.fileUrl.startsWith('/') ? att.fileUrl.substring(1) : att.fileUrl);
          }
          if (absPath && fs.existsSync(absPath)) {
            const ext = path.extname(absPath).toLowerCase();
            const isImageOrPdf = ['image', 'pdf'].includes(att.fileType) || ['.png', '.jpg', '.jpeg', '.webp', '.pdf'].includes(ext);
            if (isImageOrPdf) {
              const buffer = fs.readFileSync(absPath);
              let mime = att.mimeType || 'application/octet-stream';
              if (ext === '.png') mime = 'image/png';
              else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
              else if (ext === '.webp') mime = 'image/webp';
              else if (ext === '.pdf') mime = 'application/pdf';
              parts.push({
                inlineData: {
                  data: buffer.toString('base64'),
                  mimeType: mime
                }
              });
            }
          }
        }
      }
      parts.push({ text: llmPrompt });

      const result = await this.generateContentStreamBreaker.fire(parts.length > 1 ? parts : llmPrompt);
      let accumulatedResponse = "";

      for await (const chunk of result.stream) {
        const text = chunk.text();
        accumulatedResponse += text;
        yield text;
      }

      if (!accumulatedResponse.trim()) {
        throw new Error("Empty streaming response from Gemini API.");
      }
      
      logger.info(`✅ LLM streaming completed in ${Date.now() - startTime}ms (${accumulatedResponse.length} chars)`);
    } catch (error) {
      logger.error(`❌ LLM streaming error: ${error.message}`);
      throw new Error(`AI streaming failed: ${error.message}`);
    }
  }
}

export const llmService = new LLMService();

class GeminiDocumentService {
  constructor() {
    this.apiKey = env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY is not defined in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.fileManager = new GoogleAIFileManager(this.apiKey);
    this.modelName = 'gemini-2.5-flash';

    this.analyzeBreaker = createCircuitBreaker(
      async (args) => {
        const model = this.genAI.getGenerativeModel({ model: this.modelName });
        return await model.generateContent(args);
      },
      { timeout: 20000 },
      () => {
        throw new Error("Document analysis service is currently experiencing high load. Please try again later.");
      }
    );
  }

  async uploadFile(filePath, mimeType) {
    try {
      const displayName = path.basename(filePath);
      logger.info(`Uploading file to Gemini File API: ${filePath} (${mimeType})`);
      
      const uploadResult = await this.fileManager.uploadFile(filePath, {
        mimeType,
        displayName,
      });
      
      logger.info(`Successfully uploaded to Gemini File API: ${uploadResult.file.uri}`);
      return uploadResult.file;
    } catch (error) {
      logger.error(`Failed to upload file to Gemini File API: ${error.message}`);
      throw error;
    }
  }

  async analyzeDocumentWithUri(fileUri, prompt, mimeType) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const result = await this.analyzeBreaker.fire([
        {
          fileData: {
            mimeType,
            fileUri
          }
        },
        { text: prompt }
      ]);
      
      return result.response.text();
    } catch (error) {
      logger.error(`Gemini failed to analyze document with URI: ${error.message}`);
      throw error;
    }
  }

  async analyzeDocumentWithText(text, prompt) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const fullPrompt = `Below is the content extracted from a document:\n\n${text}\n\nBased on the document content above, please fulfill the following request: ${prompt}`;
      
      const result = await this.analyzeBreaker.fire(fullPrompt);
      
      return result.response.text();
    } catch (error) {
      logger.error(`Gemini failed to analyze document with text fallback: ${error.message}`);
      throw error;
    }
  }
}

export const geminiService = new GeminiDocumentService();
