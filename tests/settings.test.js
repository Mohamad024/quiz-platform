import { describe, it, assertEqual, assertOk } from './testUtils.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

describe('Settings', () => {
  it('ي reject ملف استيراد غير صالح', () => {
    const r = StorageManager.importData('not json', true);
    assertEqual(r.ok, false, 'rejects string');
    const r2 = StorageManager.importData({ foo: 'bar' }, true);
    assertOk(r2, 'imports unknown keys gracefully');
  });

  it('إعادة الضبط يمسح كل شيء', () => {
    StorageManager.saveData(STORAGE_KEYS.USERS, [{ id: 'x', username: 'x' }]);
    StorageManager.resetData();
    assertEqual(StorageManager.getData(STORAGE_KEYS.USERS), null, 'users cleared');
  });

  it('التصدير ينتج كائنًا بالمفاتيح المتوقعة', () => {
    const exp = StorageManager.exportData();
    assertOk(exp, 'export ok');
    assertEqual(typeof exp.data[STORAGE_KEYS.USERS], 'object', 'has users');
    assertEqual(typeof exp.data[STORAGE_KEYS.VERSION], 'object', 'has version');
  });
});
