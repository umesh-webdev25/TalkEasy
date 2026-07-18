import { logger } from '../config/logger.js';
import { customWebSearchService } from './webSearch.service.js';
import { newsService } from './news.service.js';

class SkillsManager {
  constructor() {
    this.skills = new Map([
      ["news", newsService],
      ["web_search", customWebSearchService]
    ]);
    logger.info("🛠 Skills Manager initialized with available skills: news, web_search");
  }

  getSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (skill) {
      logger.info(`Retrieved skill: ${skillName}`);
      return skill;
    } else {
      logger.warn(`Skill not found: ${skillName}`);
      return null;
    }
  }

  listSkills() {
    return Array.from(this.skills.keys());
  }
}

export const skillsManager = new SkillsManager();
