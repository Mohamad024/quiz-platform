import { describe, it, assertEqual, assertOk, assertNot } from './testUtils.js';
import { LeaderboardService } from '../js/services/leaderboardService.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

async function fresh() {
  await StorageManager.resetData();
  await StorageManager.initializeStorage();
}

describe('LeaderboardService', () => {
  it('الترتيب العام حسب النقاط', async () => {
    await fresh();
    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    const u1 = { id: 'u1', username: 'a', role: 'user', ageGroupId: 'ag1', totalPoints: 300, totalXP: 300, level: 3, updatedAt: '' };
    const u2 = { id: 'u2', username: 'b', role: 'user', ageGroupId: 'ag1', totalPoints: 100, totalXP: 100, level: 2, updatedAt: '' };
    users.push(u1, u2);
    StorageManager.saveData(STORAGE_KEYS.USERS, users);
    const list = LeaderboardService.overall();
    assertEqual(list[0].username, 'a', 'top is a');
    assertEqual(list[0].points, 300, 'points 300');
    assertEqual(list.length, 3, 'admin + 2 users');
  });

  it('الترتيب الأسبوعي حسب نتائج الاختبارات', async () => {
    await fresh();
    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    const u1 = users.find((u) => u.role === 'user') || users[0];
    StorageManager.saveData(STORAGE_KEYS.QUIZ_RESULTS, [
      { id: 'r1', userId: u1.id, score: 5, correctAnswers: 5, totalQuestions: 5, completedAt: new Date().toISOString() },
    ]);
    const list = LeaderboardService.period('weekly');
    assertEqual(list[0].username, u1.username, 'weekly top');
    assertEqual(list[0].points, 5, 'weekly points');
  });

  it('التصفية حسب الفئة العمرية', async () => {
    await fresh();
    const list = LeaderboardService.period('overall', 'ag99');
    assertEqual(list.length, 0, 'no users in fake age group');
  });

  it('لقطة leaderboard تُحفظ', () => {
    fresh();
    const snap = LeaderboardService.saveSnapshot('overall');
    assertNot(snap, undefined, 'snapshot returned');
    const logs = StorageManager.getData(STORAGE_KEYS.LEADERBOARD);
    assertEqual(logs.length, 1, 'snapshot saved');
  });
});
