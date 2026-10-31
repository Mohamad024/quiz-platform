import { QuestionService } from '../services/questionService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }

export function renderHome(container, user, onStartQuiz) {
  const cats = QuestionService.getCategories().slice(0, 6);
  container.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold">${t('welcome') || 'مرحباً'}</h1>
          <p class="text-gray-600 dark:text-gray-400">${user ? `مرحباً، ${user.username}` : t('welcome_sub') || 'اختبر معلوماتك وتحدى نفسك'}</p>
        </div>
        ${user ? `<div class="flex gap-2">
          <button id="btn-quiz" class="btn-primary">${t('start_quiz') || 'ابدأ مسابقة'}</button>
          <button id="btn-cats" class="btn-ghost">${t('categories') || 'التصنيفات'}</button>
        </div>` : `<a href="#login" class="btn-primary">${t('login') || 'تسجيل الدخول'}</a>`}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cats.map((c) => `
          <div class="card p-6 cursor-pointer hover:shadow-md transition group" onclick="appHomeCat('${c.id}')">
            <div class="text-2xl mb-2">📚</div>
            <div class="font-bold">${label(c.name)}</div>
            <div class="text-sm text-gray-500 mt-1">${c.description || ''}</div>
          </div>
        `).join('')}
      </div>
      <div id="home-msg" class="mt-6 text-center text-sm hidden"></div>
    </div>
  `;
  window.appHomeCat = (id) => {
    const m = container.querySelector('#home-msg');
    m.textContent = 'جاري فتح التصنيف...';
    m.className = 'mt-6 text-center text-sm text-indigo-600';
    m.classList.remove('hidden');
    onStartQuiz(id);
  };
  if (user) {
    container.querySelector('#btn-quiz').onclick = () => onStartQuiz(null);
    container.querySelector('#btn-cats').onclick = () => onStartQuiz(null);
  }
}
