import { StorageManager } from '../storage/storageManager.js';
import { QuestionService } from '../services/questionService.js';
import { STORAGE_KEYS } from '../config/appConfig.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }

export function renderQuizPlay(container, quiz, questions, onFinish) {
  let idx = quiz.currentIndex;
  const render = () => {
    const q = questions[idx];
    const allQ = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
    const qObj = allQ.find((x) => x.id === q);
    if (!qObj) { onFinish(quiz); return; }
    const answered = quiz.answers[qObj.id];
    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm font-medium">${t('question')} ${idx + 1} / ${questions.length}</span>
          <span class="text-sm">${t('category') || ''}: ${label(QuestionService.getCategories().find((c) => c.id === qObj.categoryId)?.name)}</span>
        </div>
        <div class="card p-6 mb-4">
          <div class="text-lg font-bold mb-4">${label(qObj.text)}</div>
          <div class="space-y-2" id="options">
            ${(qObj.options || []).sort((a, b) => a.order - b.order).map((o) => `
              <label class="block p-3 rounded border cursor-pointer ${answered === o.id ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}" onclick="appSelectOption('${o.id}')">
                <input type="radio" name="opt" value="${o.id}" ${answered === o.id ? 'checked' : ''} class="mr-2" disabled>
                ${label(o.text)}
              </label>
            `).join('')}
          </div>
          ${answered ? `<div class="mt-3 text-sm ${qObj.correctAnswer === qObj.options.find((x) => x.id === answered)?.text ? 'text-green-600' : 'text-red-600'}">${answered === qObj.correctAnswer ? t('correct') || 'صحيح' : t('wrong') || 'خطأ'}</div>` : ''}
          ${!answered ? `<button id="btn-next" class="mt-4 btn-primary w-full disabled:opacity-50 disabled:pointer-events-none">${t('next') || 'التالي'}</button>` : `<button id="btn-next" class="mt-4 btn-primary w-full">${idx === questions.length - 1 ? t('finish') || 'إنهاء' : t('next') || 'التالي'}</button>`}
        </div>
        <div id="play-msg" class="hidden text-sm text-center"></div>
      </div>
    `;
    window.appSelectOption = (id) => {
      quiz.answers[qObj.id] = id;
      sessionStorage.setItem('active_quiz', JSON.stringify(quiz));
      render();
    };
    container.querySelector('#btn-next').onclick = () => {
      if (!answered) { const m = container.querySelector('#play-msg'); m.textContent = 'يرجى اختيار إجابة'; m.className = 'mt-2 text-sm text-center text-red-600'; m.classList.remove('hidden'); return; }
      if (idx === questions.length - 1) { finishQuiz(); }
      else { quiz.currentIndex++; sessionStorage.setItem('active_quiz', JSON.stringify(quiz)); render(); }
    };
  };
  const finishQuiz = () => {
    const allQ = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
    let correct = 0;
    questions.forEach((qid) => {
      const q = allQ.find((x) => x.id === qid);
      if (q && quiz.answers[q.id] === q.options.find((o) => o.isCorrect)?.id) correct++;
    });
    quiz.score = correct;
    quiz.completed = true;
    quiz.completedAt = new Date().toISOString();
    sessionStorage.setItem('active_quiz', JSON.stringify(quiz));
    onFinish(quiz, questions);
  };
  render();
}
