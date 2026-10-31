import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS } from '../config/appConfig.js';
import { now } from '../utils/id.js';

export const LeaderboardService = {
  getUsers() {
    return StorageManager.getData(STORAGE_KEYS.USERS) || [];
  },
  getResults() {
    return StorageManager.getData(STORAGE_KEYS.QUIZ_RESULTS) || [];
  },
  getAgeGroups() {
    return StorageManager.getData(STORAGE_KEYS.AGE_GROUPS) || [];
  },
  periodBounds(period) {
    const now = new Date();
    if (period === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (period === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    return { start: null, end: now.toISOString() };
  },
  overall() {
    const users = this.getUsers();
    return users
      .map((u) => ({ username: u.username, level: u.level || 1, points: u.totalPoints || 0, wins: u.totalPoints ? Math.floor(u.totalPoints / 100) : 0, ageGroupId: u.ageGroupId }))
      .sort((a, b) => b.points - a.points);
  },
  period(period, ageGroupId = null) {
    const { start, end } = this.periodBounds(period);
    const results = this.getResults().filter((r) => {
      if (start && r.completedAt < start) return false;
      return r.completedAt <= end;
    });
    const byUser = {};
    results.forEach((r) => {
      if (!byUser[r.userId]) byUser[r.userId] = { score: 0, correct: 0, total: 0 };
      byUser[r.userId].score += r.score;
      byUser[r.userId].correct += r.correctAnswers;
      byUser[r.userId].total += r.totalQuestions;
    });
    const users = this.getUsers();
    let list = Object.entries(byUser).map(([userId, v]) => {
      const u = users.find((x) => x.id === userId);
      return { username: u ? u.username : 'غير معروف', level: u ? u.level : 1, points: v.score, wins: v.score, ageGroupId: u ? u.ageGroupId : null };
    });
    if (ageGroupId) list = list.filter((x) => x.ageGroupId === ageGroupId);
    return list.sort((a, b) => b.points - a.points);
  },
  saveSnapshot(period) {
    const { start, end } = this.periodBounds(period);
    const list = this.period(period);
    const snapshots = StorageManager.getData(STORAGE_KEYS.LEADERBOARD) || [];
    snapshots.push({ id: 'snap-' + Date.now(), periodType: period, periodStart: start, periodEnd: end, createdAt: now(), entries: list });
    StorageManager.saveData(STORAGE_KEYS.LEADERBOARD, snapshots);
    return list;
  },
};

if (typeof window !== 'undefined') window.LeaderboardService = LeaderboardService;
export default LeaderboardService;
