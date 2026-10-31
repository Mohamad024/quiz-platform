import { QuestionService } from '../services/questionService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }

export function renderCategories(container, onSelectCategory) {
  const cats = QuestionService.getCategories();
  container.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">${t('categories') || 'التصنيفات'}</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cats.map((c) => `
          <div class="card p-5 cursor-pointer hover:shadow-md transition group" onclick="appSelectCategory('${c.id}')">
            <div class="text-lg font-bold">${label(c.name)}</div>
            <div class="text-sm text-gray-500 mt-1">${c.description || ''}</div>
          </div>
        `).join('')}
      </div>
      <div id="cat-msg" class="mt-4 text-center text-sm hidden"></div>
    </div>
  `;
  window.appSelectCategory = (id) => {
    const m = container.querySelector('#cat-msg');
    m.textContent = 'جاري فتح التصنيف...';
    m.className = 'mt-4 text-center text-sm text-indigo-600';
    m.classList.remove('hidden');
    onSelectCategory(id);
  };
}
