import { STORAGE_KEYS, STORAGE_VERSION, DEFAULT_DATA, DEFAULT_QUESTIONS, ROLES } from '../config/appConfig.js';
import { ValidationRules } from './storageValidation.js';
import { uuid, now } from '../utils/id.js';

const ENTITY_DEFAULTS = { ...DEFAULT_DATA };
const MEM = {};
function store() {
  return typeof localStorage !== 'undefined' && localStorage ? localStorage : null;
}
ENTITY_DEFAULTS[STORAGE_KEYS.QUESTIONS] = DEFAULT_QUESTIONS;
ENTITY_DEFAULTS[STORAGE_KEYS.USERS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.QUIZZES] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.QUIZ_QUESTIONS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.QUIZ_RESULTS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.POINTS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.XP] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.USER_BADGES] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.CHALLENGE_PROGRESS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.LEADERBOARD] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.ADMIN] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.AUDIT_LOGS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.COMPETITION_ROOMS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.COMPETITION_PARTICIPANTS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.COMPETITION_ROOM_QUESTIONS] = [];
ENTITY_DEFAULTS[STORAGE_KEYS.QUESTION_REVIEW] = [];

export const StorageManager = {
  version: STORAGE_VERSION,

  getData(key) {
    const s = store();
    if (s) {
      try {
        const raw = s.getItem(key);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : parsed;
      } catch (e) {
        console.warn(`Storage read error for ${key}`, e);
        return null;
      }
    }
    return key in MEM ? MEM[key] : null;
  },

  saveData(key, data) {
    const s = store();
    if (s) {
      try {
        s.setItem(key, JSON.stringify(data));
        return { ok: true };
      } catch (e) {
        if (e.name === 'QuotaExceededError') return { ok: false, error: 'QUOTA_EXCEEDED' };
        return { ok: false, error: e.message };
      }
    }
    MEM[key] = data;
    return { ok: true };
  },

  updateData(key, id, updates) {
    const list = this.getData(key) || [];
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
    list[idx] = { ...list[idx], ...updates, id, updatedAt: now() };
    return this.saveData(key, list);
  },

  deleteData(key, id) {
    const list = this.getData(key) || [];
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length === list.length) return { ok: false, error: 'NOT_FOUND' };
    return this.saveData(key, filtered);
  },

  clearData(key) {
    const s = store();
    if (s) { try { s.removeItem(key); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }
    delete MEM[key];
    return { ok: true };
  },

  async initializeStorage() {
    const storedVersion = Number(this.getData(STORAGE_KEYS.VERSION) || 0);
    if (storedVersion < STORAGE_VERSION) {
      for (const [key, def] of Object.entries(ENTITY_DEFAULTS)) {
        const existing = this.getData(key);
        if (existing === null) this.saveData(key, Array.isArray(def) ? def : []);
      }
      this.saveData(STORAGE_KEYS.VERSION, STORAGE_VERSION);
      await this.seedAdmin();
      return { ok: true, initialized: true, version: STORAGE_VERSION };
    }
    return { ok: true, initialized: false, version: storedVersion };
  },

  async seedAdmin() {
    const { sha256 } = await import('../utils/crypto.js');
    const users = this.getData(STORAGE_KEYS.USERS) || [];
    if (users.some((u) => u.role === ROLES.ADMIN)) return;
    const admin = {
      id: uuid(),
      username: 'admin',
      passwordHash: await sha256('Admin@123456'),
      age: 30,
      ageGroupId: 'ag3',
      role: ROLES.ADMIN,
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
    users.push(admin);
    this.saveData(STORAGE_KEYS.USERS, users);
    this.logAudit(null, 'SEED_ADMIN', 'user', admin.id, { note: 'Default admin created' });
  },

  validateStoredData() {
    const issues = [];
    const nonArrayKeys = [STORAGE_KEYS.VERSION, STORAGE_KEYS.CURRENT_USER];
    for (const key of Object.values(STORAGE_KEYS)) {
      if (nonArrayKeys.includes(key)) continue;
      const data = this.getData(key);
      if (data === null) continue;
      if (!Array.isArray(data)) issues.push({ key, issue: 'NOT_ARRAY' });
    }
    return { valid: issues.length === 0, issues };
  },

  async migrateStorage() {
    const { migrateStorage } = await import('./migrations.js');
    const data = {};
    for (const key of Object.values(STORAGE_KEYS)) data[key] = this.getData(key);
    return migrateStorage(data);
  },

  logAudit(userId, action, entity, entityId, details = {}) {
    const logs = this.getData(STORAGE_KEYS.AUDIT_LOGS) || [];
    logs.push({ id: uuid(), userId, action, entity, entityId, details, createdAt: now() });
    this.saveData(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  exportData() {
    const data = {};
    for (const key of Object.values(STORAGE_KEYS)) data[key] = this.getData(key);
    return { ok: true, data };
  },

  importData(payload, replace = false) {
    try {
      if (!payload || typeof payload !== 'object') return { ok: false, error: 'INVALID_FORMAT' };
      let applied = 0;
      for (const [key, value] of Object.entries(payload)) {
        if (!Object.values(STORAGE_KEYS).includes(key)) continue;
        const arr = Array.isArray(value) ? value : [];
        if (replace) this.saveData(key, arr);
        else {
          const existing = this.getData(key) || [];
          this.saveData(key, [...existing, ...arr]);
        }
        applied++;
      }
      return { ok: true, applied };
    } catch (e) { return { ok: false, error: e.message }; }
  },

  resetData() {
    const s = store();
    if (s) { for (const key of Object.values(STORAGE_KEYS)) s.removeItem(key); }
    else { for (const key of Object.values(STORAGE_KEYS)) delete MEM[key]; }
    return { ok: true };
  },
};

if (typeof window !== 'undefined') window.StorageManager = StorageManager;
export default StorageManager;
