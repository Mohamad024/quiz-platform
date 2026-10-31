import { describe, it, assertEqual, assertOk, assertNot } from './testUtils.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

async function fresh() {
  await StorageManager.resetData();
  await StorageManager.initializeStorage();
}

describe('Admin', () => {
  it('إضافة وتعديل وحذف سؤال', async () => {
    await fresh();
    const existing = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
    const before = existing.length;

    const q = {
      id: 'qa1', text: { ar: 'سؤال اختبار', en: 'Test question' }, categoryId: 'cat1',
      ageGroupId: 'ag3', difficultyId: 'df1', correctAnswer: 'أ',
      options: [{ id: 'oa1', text: { ar: 'أ', en: 'A' }, isCorrect: true, order: 1 }],
      explanation: { ar: '', en: '' }, source: 'admin', status: 'draft', isAiGenerated: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const r1 = StorageManager.saveData(STORAGE_KEYS.QUESTIONS, [...existing, q]);
    assertOk(r1, 'add ok');
    assertEqual(StorageManager.getData(STORAGE_KEYS.QUESTIONS).length, before + 1, 'added');

    const r2 = StorageManager.updateData(STORAGE_KEYS.QUESTIONS, 'qa1', { status: 'approved' });
    assertOk(r2, 'update ok');
    assertEqual(StorageManager.getData(STORAGE_KEYS.QUESTIONS).find((x) => x.id === 'qa1').status, 'approved', 'status updated');

    const r3 = StorageManager.deleteData(STORAGE_KEYS.QUESTIONS, 'qa1');
    assertOk(r3, 'delete ok');
    assertEqual(StorageManager.getData(STORAGE_KEYS.QUESTIONS).length, before, 'removed');
  });

  it('سجل التدقيق يُسجل العمليات', () => {
    fresh();
    StorageManager.logAudit('u1', 'TEST_ACTION', 'test', 'x1', { note: 'hi' });
    const logs = StorageManager.getData(STORAGE_KEYS.AUDIT_LOGS);
    assertEqual(logs.length, 1, 'one log');
    assertEqual(logs[0].action, 'TEST_ACTION', 'action recorded');
  });
});
