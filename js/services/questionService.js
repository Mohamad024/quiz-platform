import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS } from '../config/appConfig.js';

export const QuestionService = {
  getCategories() {
    return StorageManager.getData(STORAGE_KEYS.CATEGORIES) || [];
  },
  getAgeGroups() {
    return StorageManager.getData(STORAGE_KEYS.AGE_GROUPS) || [];
  },
  getDifficulties() {
    return StorageManager.getData(STORAGE_KEYS.DIFFICULTIES) || [];
  },
  getAgeGroupId(age) {
    const groups = this.getAgeGroups();
    return groups.find((g) => age >= g.minAge && age <= g.maxAge)?.id || null;
  },
  getQuestions({ categoryId, ageGroupId, difficultyId, limit = 10 }) {
    const questions = (StorageManager.getData(STORAGE_KEYS.QUESTIONS) || []).filter((q) => q.status === 'approved');
    const filtered = questions.filter((q) => {
      if (categoryId && q.categoryId !== categoryId) return false;
      if (ageGroupId && q.ageGroupId !== ageGroupId) return false;
      if (difficultyId && q.difficultyId !== difficultyId) return false;
      return true;
    });
    return filtered.slice(0, limit);
  },
};
