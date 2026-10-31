import { StorageManager } from './storage/storageManager.js';
import { STORAGE_KEYS, LANG } from './config/appConfig.js';
import { AuthService } from './auth/authService.js';
import { renderLogin, setLang as setAuthLang } from './pages/authPages.js';
import { renderRegister } from './pages/authPages.js';
import { renderDashboard, setLang as setDashLang } from './pages/dashboard.js';
import { renderHome, setLang as setHomeLang } from './pages/homePage.js';
import { renderCategories, setLang as setCatLang } from './pages/categoryPage.js';
import { renderQuizStart, setLang as setQuizStartLang } from './pages/quizStart.js';
import { renderQuizPlay, setLang as setQuizPlayLang } from './pages/quizPlay.js';
import { renderQuizResult, setLang as setQuizResultLang } from './pages/quizResult.js';
import { renderAdmin, setLang as setAdminLang } from './pages/adminPage.js';
import { renderCompetition, setLang as setCompLang } from './pages/competitionPage.js';
import { renderLeaderboard, setLang as setLeaderboardLang } from './pages/leaderboardPage.js';
import { renderSettings, setLang as setSettingsLang } from './pages/settingsPage.js';

const state = { user: null, lang: 'ar', theme: 'light' };

function t(key) {
  const dict = { ar: {}, en: {} };
  return (dict[state.lang] || dict.ar)[key] || key;
}

function setAllLangs(lang) {
  setAuthLang(lang);
  setDashLang(lang);
  setHomeLang(lang);
  setCatLang(lang);
  setQuizStartLang(lang);
  setQuizPlayLang(lang);
  setQuizResultLang(lang);
  setAdminLang(lang);
  setCompLang(lang);
  setLeaderboardLang(lang);
  setSettingsLang(lang);
}

async function init() {
  const res = await StorageManager.initializeStorage();
  console.log('Storage init:', res);
  const issues = StorageManager.validateStoredData();
  if (!issues.valid) console.warn('Storage issues:', issues.issues);
  restoreSession();
  applyTheme(state.theme);
  applyLang(state.lang);
  setupRouter();
  setupThemeToggle();
  setupLangToggle();
  window.addEventListener('storage', () => restoreSession());
  renderRoute();
}

function restoreSession() {
  const cu = StorageManager.getData(STORAGE_KEYS.CURRENT_USER);
  state.user = cu ? { ...cu, passwordHash: undefined } : null;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
}
function applyLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  setAllLangs(lang);
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  btn.onclick = () => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    StorageManager.saveData(STORAGE_KEYS.SETTINGS, [
      { id: 'theme-' + (state.user ? state.user.id : 'global'), key: 'user_theme_' + (state.user ? state.user.id : 'global'), value: next }
    ]);
  };
}

function setupLangToggle() {
  const btn = document.getElementById('lang-toggle');
  btn.onclick = () => {
    const next = state.lang === 'ar' ? 'en' : 'ar';
    applyLang(next);
    StorageManager.saveData(STORAGE_KEYS.SETTINGS, [
      { id: 'lang-' + (state.user ? state.user.id : 'global'), key: 'user_lang_' + (state.user ? state.user.id : 'global'), value: next }
    ]);
  };
}

function renderShell() {
  const links = document.getElementById('nav-links');
  const userArea = document.getElementById('user-area');
  links.innerHTML = state.user
    ? `<a href="#home" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">الرئيسية</a>
       <a href="#dashboard" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">لوحة المستخدم</a>
       <a href="#categories" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">التصنيفات</a>
       <a href="#leaderboard" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">لوحة المتصدرين</a>
       <a href="#competitions" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">المنافسات</a>
       <a href="#settings" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">الإعدادات</a>
       ${state.user.role === 'admin' ? `<a href="#admin" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">إدارة</a>` : ''}`
    : `<a href="#login" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">تسجيل الدخول</a>
       <a href="#register" class="nav-link px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">إنشاء حساب</a>`;
  userArea.innerHTML = state.user
    ? `<span class="text-sm px-2">${state.user.username}</span><button id="btn-logout" class="btn-ghost">تسجيل الخروج</button>`
    : '';
  if (state.user) {
    document.getElementById('btn-logout').onclick = () => {
      AuthService.logout();
      state.user = null;
      renderShell();
      window.location.hash = '#login';
    };
  }
}

function requireAuth(hash) {
  const protected = ['#dashboard', '#home', '#categories', '#quiz/start', '#quiz/play', '#quiz/result'];
  if (protected.includes(hash) && !state.user) { window.location.hash = '#login'; return false; }
  if (hash === '#admin' && !AuthService.isAdmin()) { window.location.hash = '#dashboard'; return false; }
  return true;
}

async function renderRoute() {
  const hash = window.location.hash || (state.user ? '#home' : '#login');
  const out = document.getElementById('router-outlet');
  if (!requireAuth(hash)) return;
  renderShell();

  if (hash === '#login') renderLogin(out, () => { state.user = AuthService.getCurrentUser(); renderShell(); window.location.hash = '#home'; });
  else if (hash === '#register') renderRegister(out, () => { state.user = AuthService.getCurrentUser(); renderShell(); window.location.hash = '#home'; });
  else if (hash === '#home') renderHome(out, state.user, (catId) => { window.location.hash = '#quiz/start'; window.__startCat = catId; });
  else if (hash === '#dashboard') renderDashboard(out);
  else if (hash === '#categories') renderCategories(out, (catId) => { window.location.hash = '#quiz/start'; window.__startCat = catId; });
  else if (hash === '#quiz/start') {
    const catId = window.__startCat || null;
    renderQuizStart(out, state.user, (quiz, questions) => { window.location.hash = '#quiz/play'; window.__quiz = quiz; window.__questions = questions; });
    if (catId) {
      const form = out.querySelector('#quiz-form');
      if (form) form.categoryId.value = catId;
    }
  }
  else if (hash === '#quiz/play') {
    const quiz = window.__quiz;
    const questions = window.__questions;
    if (!quiz || !questions) { window.location.hash = '#quiz/start'; return; }
    const allQ = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
    const qObjs = questions.map((qid) => allQ.find((q) => q.id === qid));
    renderQuizPlay(out, quiz, qObjs, (finishedQuiz, finishedQuestions) => {
      window.__resultQuiz = finishedQuiz;
      window.__resultQuestions = finishedQuestions;
      window.location.hash = '#quiz/result';
    });
  }
  else if (hash === '#quiz/result') {
    const quiz = window.__resultQuiz;
    const questions = window.__resultQuestions;
    if (!quiz || !questions) { window.location.hash = '#quiz/start'; return; }
    renderQuizResult(out, quiz, questions, () => { window.location.hash = '#dashboard'; });
  }
  else if (hash === '#leaderboard') renderLeaderboard(out);
  else if (hash === '#admin') renderAdmin(out);
  else if (hash === '#settings') renderSettings(out);
  else if (hash === '#competitions') renderCompetition(out);
  else window.location.hash = state.user ? '#home' : '#login';
}

function setupRouter() {
  window.addEventListener('hashchange', renderRoute);
}

window.addEventListener('DOMContentLoaded', init);
