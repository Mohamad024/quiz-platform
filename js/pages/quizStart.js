import { QuestionService } from '../services/questionService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }

export function renderQuizStart(container, user, onStart) {
  const cats = QuestionService.getCategories();
  const diffs = QuestionService.getDifficulties();
  const ageGroupId = QuestionService.getAgeGroupId(user.age);
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-6">${t('start_quiz') || 'بدء مسابقة'}</h1>
      <form id="quiz-form" class="space-y-4 card p-6">
        <div>
          <label class="block text-sm font-medium mb-1">${t('category') || 'التصنيف'}</label>
          <select name="categoryId" class="w-full px-3 py-2 rounded border">
            ${cats.map((c) => `<option value="${c.id}">${label(c.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">${t('difficulty') || 'الصعوبة'}</label>
          <select name="difficultyId" class="w-full px-3 py-2 rounded border">
            ${diffs.map((d) => `<option value="${d.id}">${label(d.label)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">${t('count') || 'عدد الأسئلة'}</label>
          <select name="limit" class="w-full px-3 py-2 rounded border">
            ${[5,10,15,20].map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <p class="text-xs text-gray-500">الفئة العمرية: ${label(QuestionService.getAgeGroups().find((g) => g.id === ageGroupId)?.name)}</p>
        <button type="submit" class="btn-primary w-full">${t('start') || 'بدء'}</button>
      </form>
      <div id="quiz-msg" class="hidden text-sm text-center mt-3"></div>
    </div>
  `;
  const form = container.querySelector('#quiz-form');
  const m = container.querySelector('#quiz-msg');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const limit = Number(fd.get('limit'));
    const qs = QuestionService.getQuestions({
      categoryId: fd.get('categoryId'),
      ageGroupId,
      difficultyId: fd.get('difficultyId'),
      limit,
    });
    if (qs.length === 0) { m.textContent = 'لا توجد أسئلة معتمدة لهذه الخيارات'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); return; }
    const quiz = { id: 'q-' + Date.now(), userId: user.id, categoryId: fd.get('categoryId'), difficultyId: fd.get('difficultyId'), questions: qs.map((q) => q.id), currentIndex: 0, answers: {}, score: 0, startedAt: new Date().toISOString(), completed: false };
    sessionStorage.setItem('active_quiz', JSON.stringify(quiz));
    m.classList.add('hidden');
    onStart(quiz, qs);
  };
}
