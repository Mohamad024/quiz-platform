import { describe, it, assertEqual, assertOk, assertNot } from './testUtils.js';
import { GamificationService } from '../js/services/gamificationService.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

async function fresh() {
  await StorageManager.resetData();
  await StorageManager.initializeStorage();
}

describe('GamificationService', () => {
  it('getLevels و getLevelForXP', () => {
    const levels = GamificationService.getLevels();
    assertNot(levels.length, 0, 'levels exist');
    const l0 = GamificationService.getLevelForXP(0);
    assertEqual(l0.level, 1, 'level 1 at 0 xp');
    const l2 = GamificationService.getLevelForXP(150);
    assertEqual(l2.level, 2, 'level 2 at 150 xp');
  });

  it('awardPoints and awardXP with level up', async () => {
    await fresh();
    await StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { id: 'u1', username: 'u1', role: 'user', level: 1, totalXP: 0, passwordHash: undefined });
    await StorageManager.saveData(STORAGE_KEYS.USERS, [{ id: 'u1', username: 'u1', role: 'user', level: 1, totalXP: 0, totalPoints: 0, updatedAt: '' }]);

    const p = await GamificationService.awardPoints('u1', 50, 'test');
    assertOk(p, 'award points ok');
    assertEqual(p.totalPoints, 50, 'points added');

    const x = await GamificationService.awardXP('u1', 150, 'test');
    assertOk(x, 'award xp ok');
    assertEqual(x.level, 2, 'leveled up to 2');
    assertEqual(x.leveledUp, true, 'leavedUp flag');
  });

  it('updateStreak increments consecutive days', async () => {
    await fresh();
    await StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { id: 'u2', username: 'u2', role: 'user', currentStreak: 0, longestStreak: 0, lastActivityDate: null, passwordHash: undefined });
    await StorageManager.saveData(STORAGE_KEYS.USERS, [{ id: 'u2', username: 'u2', role: 'user', currentStreak: 0, longestStreak: 0, lastActivityDate: null, updatedAt: '' }]);

    const s1 = await GamificationService.updateStreak('u2');
    assertOk(s1, 'streak day1 ok');
    assertEqual(s1.streak, 1, 'streak is 1');

    const s2 = await GamificationService.updateStreak('u2');
    assertOk(s2, 'streak day2 ok');
    assertEqual(s2.streak, 1, 'same day no increment');
  });

  it('checkBadges awards quiz_count badge', async () => {
    await fresh();
    await StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { id: 'u3', username: 'u3', role: 'user', currentStreak: 0, passwordHash: undefined });
    await StorageManager.saveData(STORAGE_KEYS.USERS, [{ id: 'u3', username: 'u3', role: 'user', currentStreak: 0, updatedAt: '' }]);
    await StorageManager.saveData(STORAGE_KEYS.QUIZ_RESULTS, [
      { id: 'r1', userId: 'u3', score: 5, totalQuestions: 5, completedAt: new Date().toISOString() },
      { id: 'r2', userId: 'u3', score: 5, totalQuestions: 5, completedAt: new Date().toISOString() },
    ]);
    const newBadges = await GamificationService.checkBadges('u3');
    assertEqual(newBadges.length, 1, 'one new badge');
    assertEqual(newBadges[0].name.ar, 'بداية جيدة', 'badge name');
  });

  it('completeChallenge awards rewards and completes', async () => {
    await fresh();
    await StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { id: 'u4', username: 'u4', role: 'user', totalXP: 0, totalPoints: 0, passwordHash: undefined });
    await StorageManager.saveData(STORAGE_KEYS.USERS, [{ id: 'u4', username: 'u4', role: 'user', totalXP: 0, totalPoints: 0, updatedAt: '' }]);

    const r = await GamificationService.completeChallenge('u4', 'ch2', 1);
    assertOk(r, 'complete challenge ok');
    assertEqual(r.progress.completed, true, 'challenge completed');
  });

  it('getChallengeProgress returns user progress', () => {
    const p = GamificationService.getChallengeProgress('none');
    assertEqual(p.length, 0, 'no progress for unknown user');
  });
});

describe('GamificationService cleanup', () => {
  it('يعيد التخزين إلى الحالة الأولية', async () => {
    await StorageManager.resetData();
    await StorageManager.initializeStorage();
    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    assertEqual(users.length, 1, 'only admin remains');
  });
});
