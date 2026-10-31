import { describe, it, assertEqual, assertOk, assertNot } from './testUtils.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

describe('StorageManager', () => {
  it('يبدأ التخزين بالقيم الافتراضية', async () => {
    StorageManager.resetData();
    const res = await StorageManager.initializeStorage();
    assertOk(res, 'init ok');
    assertEqual(res.version, 1, 'version');
    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    assertNot(users, null, 'users not null');
    assertEqual(users.length, 1, 'users count');
    assertEqual(users[0].role, 'admin', 'admin role');
  });

  it('دورة الحفظ والقراءة', () => {
    const key = STORAGE_KEYS.SETTINGS;
    const data = [{ id: 'x', key: 'test', value: 'v' }];
    const r = StorageManager.saveData(key, data);
    assertOk(r, 'save ok');
    const got = StorageManager.getData(key);
    assertEqual(got[0].value, 'v', 'roundtrip value');
  });

  it('التحديث حسب المعرف', () => {
    const key = STORAGE_KEYS.SETTINGS;
    StorageManager.saveData(key, [{ id: 'x', key: 'test', value: 'v' }]);
    const r = StorageManager.updateData(key, 'x', { value: 'v2' });
    assertOk(r, 'update ok');
    assertEqual(StorageManager.getData(key)[0].value, 'v2', 'updated value');
  });

  it('الحذف حسب المعرف', () => {
    const key = STORAGE_KEYS.SETTINGS;
    StorageManager.saveData(key, [{ id: 'x', key: 'test', value: 'v' }, { id: 'y', key: 't2', value: 'v2' }]);
    const r = StorageManager.deleteData(key, 'x');
    assertOk(r, 'delete ok');
    assertEqual(StorageManager.getData(key).length, 1, 'remaining count');
  });

  it('التحقق من سلامة البيانات المخزنة', () => {
    const v = StorageManager.validateStoredData();
    assertEqual(v.valid, true, 'validation valid');
  });

  it('التصدير والاستيراد', () => {
    const exp = StorageManager.exportData();
    assertOk(exp, 'export ok');
    const imp = StorageManager.importData(exp.data, true);
    assertOk(imp, 'import ok');
  });

  it('إعادة ضبط البيانات تمسح التخزين', () => {
    StorageManager.saveData(STORAGE_KEYS.SETTINGS, [{ id: 'a', key: 'k', value: 'v' }]);
    StorageManager.resetData();
    assertEqual(StorageManager.getData(STORAGE_KEYS.SETTINGS), null, 'settings cleared');
  });
});
