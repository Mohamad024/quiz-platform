import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS } from '../config/appConfig.js';
import { now, uuid } from '../utils/id.js';

export const GamificationService = {
  getLevels() {
    return StorageManager.getData(STORAGE_KEYS.LEVELS) || [];
  },
  getLevelForXP(xp) {
    const levels = this.getLevels().sort((a, b) => a.level - b.level);
    let current = levels[0];
    for (const l of levels) {
      if (xp >= (l.minXP ?? 0) && (l.maxXP === null || xp <= l.maxXP)) current = l;
    }
    return current;
  },
  getBadges() {
    return StorageManager.getData(STORAGE_KEYS.BADGES) || [];
  },
  getAchievements() {
    return StorageManager.getData(STORAGE_KEYS.ACHIEVEMENTS) || [];
  },
  getUserBadges(userId) {
    return (StorageManager.getData(STORAGE_KEYS.USER_BADGES) || []).filter((ub) => ub.userId === userId);
  },
  getChallenges() {
    return StorageManager.getData(STORAGE_KEYS.CHALLENGES) || [];
  },
  getChallengeProgress(userId) {
    return (StorageManager.getData(STORAGE_KEYS.CHALLENGE_PROGRESS) || []).filter((cp) => cp.userId === userId);
  },

  async awardPoints(userId, amount, reason) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
    users[idx].totalPoints = (users[idx].totalPoints || 0) + amount;
    users[idx].updatedAt = now();
    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users);
    if (!saveRes.ok) return saveRes;

    const points = StorageManager.getData(STORAGE_KEYS.POINTS) || [];
    points.push({ id: uuid(), userId, amount, reason, createdAt: now() });
    StorageManager.saveData(STORAGE_KEYS.POINTS, points);

    const cu = StorageManager.getData(STORAGE_KEYS.CURRENT_USER);
    if (cu && cu.id === userId) {
      StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { ...users[idx], passwordHash: undefined });
    }
    return { ok: true, totalPoints: users[idx].totalPoints };
  },

  async awardXP(userId, amount, reason) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
    users[idx].totalXP = (users[idx].totalXP || 0) + amount;
    const newLevel = this.getLevelForXP(users[idx].totalXP);
    users[idx].level = Number(newLevel.level);
    users[idx].updatedAt = now();
    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users);
    if (!saveRes.ok) return saveRes;

    const xp = StorageManager.getData(STORAGE_KEYS.XP) || [];
    xp.push({ id: uuid(), userId, amount, reason, createdAt: now() });
    StorageManager.saveData(STORAGE_KEYS.XP, xp);

    const cu = StorageManager.getData(STORAGE_KEYS.CURRENT_USER);
    if (cu && cu.id === userId) {
      StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { ...users[idx], passwordHash: undefined });
    }
    return { ok: true, totalXP: users[idx].totalXP, level: users[idx].level, leveledUp: cu.level !== users[idx].level };
  },

  async updateStreak(userId) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
    const today = new Date().toISOString().slice(0, 10);
    const u = users[idx];
    if (u.lastActivityDate === today) return { ok: true, streak: u.currentStreak || 0 };
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = u.lastActivityDate === yesterday ? (u.currentStreak || 0) + 1 : 1;
    u.currentStreak = newStreak;
    if (newStreak > (u.longestStreak || 0)) u.longestStreak = newStreak;
    u.lastActivityDate = today;
    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users);
    if (!saveRes.ok) return saveRes;
    const cu = StorageManager.getData(STORAGE_KEYS.CURRENT_USER);
    if (cu && cu.id === userId) StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { ...u, passwordHash: undefined });
    return { ok: true, streak: newStreak, longest: u.longestStreak };
  },

  async checkBadges(userId) {
    const badges = this.getBadges();
    const userBadges = this.getUserBadges(userId);
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const u = users.find((x) => x.id === userId);
    const streak = u ? u.currentStreak : 0;
    const results = StorageManager.getData(STORAGE_KEYS.QUIZ_RESULTS) || [];
    const userResults = results.filter((r) => r.userId === userId);
    const newBadges = [];

    for (const b of badges) {
      if (userBadges.some((ub) => ub.badgeId === b.id)) continue;
      let earned = false;
      const c = b.criteria || {};
      if (c.type === 'quiz_count' && userResults.length >= (c.value || 1)) earned = true;
      if (c.type === 'streak_correct' && streak >= (c.value || 1)) earned = true;
      if (earned) {
        userBadges.push({ id: uuid(), userId, badgeId: b.id, earnedAt: now() });
        newBadges.push(b);
      }
    }
    if (newBadges.length) {
      const all = StorageManager.getData(STORAGE_KEYS.USER_BADGES) || [];
      all.push(...userBadges.filter((ub) => newBadges.some((nb) => nb.id === ub.badgeId)));
      StorageManager.saveData(STORAGE_KEYS.USER_BADGES, all);
    }
    return newBadges;
  },

  async checkAchievements(userId) {
    const achievements = this.getAchievements();
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const u = users.find((x) => x.id === userId);
    const answersCount = u.totalXP ? Math.floor(u.totalXP / 5) : 0;
    const newOnes = [];

    for (const a of achievements) {
      let earned = false;
      const c = a.criteria || {};
      if (c.type === 'answers_count' && answersCount >= (c.value || 1)) earned = true;
      if (earned) newOnes.push(a);
    }
    return newOnes;
  },

  async completeChallenge(userId, challengeId, amount = 1) {
    const challenges = this.getChallenges();
    const ch = challenges.find((c) => c.id === challengeId);
    if (!ch || !ch.isActive) return { ok: false, error: 'NOT_ACTIVE' };
    const progress = StorageManager.getData(STORAGE_KEYS.CHALLENGE_PROGRESS) || [];
    let cp = progress.find((p) => p.userId === userId && p.challengeId === challengeId);
    if (!cp) {
      cp = { id: uuid(), userId, challengeId, current: 0, completed: false, completedAt: null };
      progress.push(cp);
    }
    if (cp.completed) return { ok: true, already: true };
    cp.current = Math.min((cp.current || 0) + amount, ch.target);
    if (cp.current >= ch.target) {
      cp.completed = true;
      cp.completedAt = now();
      await this.awardXP(userId, ch.rewardXp, `challenge:${ch.title}`);
      await this.awardPoints(userId, ch.rewardPoints, `challenge:${ch.title}`);
    }
    StorageManager.saveData(STORAGE_KEYS.CHALLENGE_PROGRESS, progress);
    return { ok: true, progress: cp };
  },
};

if (typeof window !== 'undefined') window.GamificationService = GamificationService;
export default GamificationService;
export { freshTestStorage };
function freshTestStorage() {}
