import { describe, it, assertEqual, assertOk, assertNot } from './testUtils.js';
import { AuthService } from '../js/auth/authService.js';
import { StorageManager } from '../js/storage/storageManager.js';
import { sha256 } from '../js/utils/crypto.js';
import { STORAGE_KEYS } from '../js/config/appConfig.js';

async function fresh() {
  await StorageManager.resetData();
  await StorageManager.initializeStorage();
}

describe('AuthService', () => {
  it('זרימת אימות מלאה', async () => {
    await fresh();

    const r1 = await AuthService.register({ username: 'ahmed', password: 'Pass1234', age: 20 });
    assertOk(r1, 'register ok');
    assertNot(r1.user.id, undefined, 'has id');
    assertEqual(r1.user.passwordHash, undefined, 'no hash exposed');

    const r2 = await AuthService.register({ username: 'ahmed', password: 'Pass1234', age: 20 });
    assertEqual(r2.error, 'USER_EXISTS', 'prevents duplicate');

    const lr = await AuthService.login({ username: 'ahmed', password: 'Pass1234' });
    assertOk(lr, 'login ok');
    assertEqual(AuthService.getCurrentUser().username, 'ahmed', 'session user');
    assertEqual(AuthService.isAuthenticated(), true, 'authenticated');
    assertEqual(AuthService.isAdmin(), false, 'not admin');

    const wrong = await AuthService.login({ username: 'ahmed', password: 'WrongPass' });
    assertEqual(wrong.error, 'INVALID_CREDENTIALS', 'rejects wrong password');

    const u = AuthService.getCurrentUser();
    const up = await AuthService.updateProfile(u.id, { username: 'ahmed2' });
    assertOk(up, 'update ok');
    assertEqual(AuthService.getCurrentUser().username, 'ahmed2', 'session updated');

    const cp = await AuthService.changePassword(u.id, 'Pass1234', 'NewPass1234');
    assertOk(cp, 'change pass ok');
    const lr2 = await AuthService.login({ username: 'ahmed2', password: 'NewPass1234' });
    assertOk(lr2, 'login with new password ok');

    await fresh();
    const adminLogin = await AuthService.login({ username: 'admin', password: 'Admin@123456' });
    assertOk(adminLogin, 'admin login');
    const delAdmin = await AuthService.deleteAccount(adminLogin.user.id, 'Admin@123456');
    assertEqual(delAdmin.error, 'CANNOT_DELETE_ADMIN', 'cannot delete admin');

    await fresh();
    await AuthService.register({ username: 'temp', password: 'Temp1234', age: 15 });
    const tempLogin = await AuthService.login({ username: 'temp', password: 'Temp1234' });
    const del = await AuthService.deleteAccount(tempLogin.user.id, 'Temp1234');
    assertOk(del, 'delete ok');
    assertEqual(AuthService.isAuthenticated(), false, 'logged out after delete');

    await fresh();
    assertEqual((await AuthService.register({ username: 'ab', password: 'Pass1234', age: 20 })).error, 'INVALID_USERNAME');
    assertEqual((await AuthService.register({ username: 'validuser1', password: '123', age: 20 })).error, 'INVALID_PASSWORD');
    assertEqual((await AuthService.register({ username: 'validuser2', password: 'Pass1234', age: 5 })).error, 'INVALID_AGE');

    await fresh();
    await AuthService.register({ username: 'kept', password: 'Kept1234', age: 25 });
    const users = StorageManager.getData(STORAGE_KEYS.USERS);
    const kept = users.find((x) => x.username === 'kept');
    assertNot(kept, null, 'user persisted');
    assertEqual(kept.passwordHash.length, 64, 'password hashed');

    const lg = AuthService.logout();
    assertOk(lg, 'logout ok');
    assertEqual(AuthService.isAuthenticated(), false, 'not authenticated after logout');
  });
});
