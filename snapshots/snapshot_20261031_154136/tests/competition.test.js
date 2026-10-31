import { describe, it, assertEqual, assertOk, assertNot } from './testUtils.js';
import { CompetitionService } from '../js/services/competitionService.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

async function freshWithQuestions() {
  await StorageManager.resetData();
  await StorageManager.initializeStorage();
  const users = StorageManager.getData(STORAGE_KEYS.USERS);
  const admin = users.find((u) => u.role === 'admin');
  const host = { id: 'host1', username: 'hostuser', role: 'user', age: 25, ageGroupId: 'ag3', totalPoints: 0, totalXP: 0, level: 1, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
  users.push(host);
  StorageManager.saveData(STORAGE_KEYS.USERS, users);
  const qs = [];
  for (let i = 0; i < 5; i++) {
    qs.push({
      id: 'cq' + i, text: { ar: 'س' + i, en: 'Q' + i }, categoryId: 'cat1', ageGroupId: 'ag3', difficultyId: 'df1',
      correctAnswer: 'a', options: [{ id: 'oa' + i, text: { ar: 'أ', en: 'A' }, isCorrect: true, order: 1 }, { id: 'ob' + i, text: { ar: 'ب', en: 'B' }, isCorrect: false, order: 2 }],
      explanation: { ar: '', en: '' }, source: 'admin', status: 'approved', isAiGenerated: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  }
  const existing = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
  StorageManager.saveData(STORAGE_KEYS.QUESTIONS, [...existing, ...qs]);
  return host;
}

describe('CompetitionService', () => {
  it('ينشئ غرفة وينضم مشارك ويبدأ ويجيب وينتهي', async () => {
    const host = await freshWithQuestions();
    const r = await CompetitionService.createRoom({ hostId: host.id, categoryId: 'cat1', questionCount: 3, timePerQuestion: 10 });
    assertOk(r, 'create room ok');
    assertNot(r.room.code, undefined, 'has code');
    assertEqual(r.questions.length, 3, '3 questions');

    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    const guest = users.find((u) => u.id !== host.id) || host;
    const j = await CompetitionService.joinRoom(r.room.id, guest.id);
    assertOk(j, 'join ok');

    const s = await CompetitionService.startRoom(r.room.id, host.id);
    assertOk(s, 'start ok');
    assertEqual(s.room.status, 'active', 'room active');

    const q = r.questions[0];
    const ans = await CompetitionService.answer(r.room.id, host.id, q.id, q.options.find((o) => o.isCorrect).id, 2);
    assertOk(ans, 'answer ok');
    assertEqual(ans.correct, true, 'correct answer');

    const nxt = await CompetitionService.nextQuestion(r.room.id, host.id);
    assertOk(nxt, 'next ok');
    assertEqual(nxt.finished, false, 'not finished');

    const results = CompetitionService.getResults(r.room.id);
    assertEqual(results.length, 2, '2 participants');
    assertEqual(results[0].username, host.username, 'host first');
  });

  it('يمنع الانضمام مرتين وبدء غير المضيف', async () => {
    const host = await freshWithQuestions();
    const r = await CompetitionService.createRoom({ hostId: host.id, categoryId: 'cat1', questionCount: 1, timePerQuestion: 10 });
    const j1 = await CompetitionService.joinRoom(r.room.id, host.id);
    assertEqual(j1.error, 'ALREADY_JOINED', 'already joined');
    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    const guest = users.find((u) => u.id !== host.id) || host;
    const j2 = await CompetitionService.joinRoom(r.room.id, guest.id);
    assertOk(j2, 'guest join');
    const badStart = await CompetitionService.startRoom(r.room.id, guest.id);
    assertEqual(badStart.error, 'NOT_HOST', 'only host can start');
  });
});
