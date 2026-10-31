import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS, ROLES } from '../config/appConfig.js';
import { sha256 } from '../utils/crypto.js';
import { ValidationRules, sanitizeText } from '../storage/storageValidation.js';
import { uuid, now } from '../utils/id.js';

export const AuthService = {
  async register({ username, password, age }) {
    if (!ValidationRules.username(username)) return { ok: false, error: 'INVALID_USERNAME' };
    if (!ValidationRules.password(password)) return { ok: false, error: 'INVALID_PASSWORD' };
    if (!ValidationRules.age(age)) return { ok: false, error: 'INVALID_AGE' };

    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    if (users.find((u) => u.username === username)) return { ok: false, error: 'USER_EXISTS' };

    const groups = StorageManager.getData(STORAGE_KEYS.AGE_GROUPS) || [];
    const ageGroup = groups.find((g) => age >= g.minAge && age <= g.maxAge);

    const user = {
      id: uuid(),
      username: sanitizeText(username),
      passwordHash: await sha256(password),
      age: Number(age),
      ageGroupId: ageGroup ? ageGroup.id : null,
      role: ROLES.USER,
      avatarUrl: null,
      language: 'ar',
      theme: 'light',
      totalPoints: 0,
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      createdAt: now(),
      updatedAt: now(),
    };

    users.push(user);
    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users);
    if (!saveRes.ok) return saveRes;

    StorageManager.logAudit(user.id, 'REGISTER', 'user', user.id, { username });
    const sessionUser = { ...user, passwordHash: undefined };
    return { ok: true, user: sessionUser };
  },

  async login({ username, password }) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const user = users.find((u) => u.username === username);
    if (!user) return { ok: false, error: 'INVALID_CREDENTIALS' };
    if (await sha256(password) !== user.passwordHash) return { ok: false, error: 'INVALID_CREDENTIALS' };

    const sessionUser = { ...user, passwordHash: undefined };
    const saveRes = StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, sessionUser);
    if (!saveRes.ok) return saveRes;

    StorageManager.logAudit(user.id, 'LOGIN', 'user', user.id);
    return { ok: true, user: sessionUser };
  },

  logout() {
    StorageManager.clearData(STORAGE_KEYS.CURRENT_USER);
    StorageManager.logAudit(null, 'LOGOUT', 'system', null);
    return { ok: true };
  },

  getCurrentUser() {
    return StorageManager.getData(STORAGE_KEYS.CURRENT_USER);
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const u = this.getCurrentUser();
    return u && u.role === ROLES.ADMIN;
  },

  async updateProfile(userId, updates) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
    delete updates.role;

    users[idx] = { ...users[idx], ...updates, updatedAt: now() };
    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users);
    if (!saveRes.ok) return saveRes;

    const cu = this.getCurrentUser();
    if (cu && cu.id === userId) {
      StorageManager.saveData(STORAGE_KEYS.CURRENT_USER, { ...users[idx], passwordHash: undefined });
    }

    StorageManager.logAudit(userId, 'UPDATE_PROFILE', 'user', userId, updates);
    return { ok: true, user: { ...users[idx], passwordHash: undefined } };
  },

  async changePassword(userId, currentPassword, newPassword) {
    if (!ValidationRules.password(newPassword)) return { ok: false, error: 'INVALID_PASSWORD' };
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const user = users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: 'NOT_FOUND' };
    if (await sha256(currentPassword) !== user.passwordHash) return { ok: false, error: 'INVALID_CURRENT_PASSWORD' };

    user.passwordHash = await sha256(newPassword);
    user.updatedAt = now();
    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users);
    if (!saveRes.ok) return saveRes;

    StorageManager.logAudit(userId, 'CHANGE_PASSWORD', 'user', userId);
    return { ok: true };
  },

  async deleteAccount(userId, password) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const user = users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: 'NOT_FOUND' };
    if (user.role === ROLES.ADMIN) return { ok: false, error: 'CANNOT_DELETE_ADMIN' };
    if (await sha256(password) !== user.passwordHash) return { ok: false, error: 'INVALID_PASSWORD' };

    const saveRes = StorageManager.saveData(STORAGE_KEYS.USERS, users.filter((u) => u.id !== userId));
    if (!saveRes.ok) return saveRes;

    const cu = this.getCurrentUser();
    if (cu && cu.id === userId) this.logout();

    StorageManager.logAudit(userId, 'DELETE_ACCOUNT', 'user', userId);
    return { ok: true };
  },
};

if (typeof window !== 'undefined') window.AuthService = AuthService;
export default AuthService;
