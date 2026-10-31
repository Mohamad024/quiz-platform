import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS } from '../config/appConfig.js';
import { AuthService } from '../auth/authService.js';
import { GamificationService } from '../services/gamificationService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }

export function renderQuizResult(container, quiz, questions, onBack) {
  const allQ = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
  let correct = 0;
  questions.forEach((qid) => {
    const q = allQ.find((x) => x.id === qid);
    if (q && quiz.answers[q.id] === q.options.find((o) => o.isCorrect)?.id) correct++;
  });
  const wrong = questions.length - correct;
  const user = AuthService.getCurrentUser();
  const pts = correct * 10;
  const xp = correct * 5;

  const diff = StorageManager.getData(STORAGE_KEYS.DIFFICULTIES).find((d) => d.id === quiz.difficultyId);
  const mult = diff ? (diff.pointMultiplier || 1) : 1;
  const finalPts = Math.floor(pts * mult);
  const finalXp = Math.floor(xp * mult);

  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-8 text-center">
        <h1 class="text-2xl font-bold mb-2">${t('result') || 'النتيجة'}</h1>
        <div class="text-4xl font-bold mb-2">${correct} / ${questions.length}</div>
        <div class="text-gray-600 dark:text-gray-400 mb-6">${t('correct')} ${correct} · ${t('wrong')} ${wrong}</div>
        <div class="mb-6">${t('points_earned')} ${finalPts} · ${t('xp_earned')} ${finalXp}</div>
        <div id="level-msg" class="mb-4 text-sm text-indigo-600 dark:text-indigo-400 hidden"></div>
        <button id="btn-back" class="btn-primary w-full">${t('back') || 'العودة'}</button>
      </div>
      <div id="result-msg" class="mt-4 text-center text-sm hidden"></div>
    </div>
  `;

  const levelMsg = container.querySelector('#level-msg');
  const m = container.querySelector('#result-msg');

  if (user) {
    GamificationService.awardPoints(user.id, finalPts, `quiz:${quiz.id}`).then(() => {
      return GamificationService.awardXP(user.id, finalXp, `quiz:${quiz.id}`);
    }).then((res) => {
      if (res && res.leveledUp) {
        levelMsg.textContent = `🎉 ارتقت إلى المستوى ${res.level}!`;
        levelMsg.classList.remove('hidden');
      }
      return GamificationService.updateStreak(user.id);
    }).then((st) => {
      return GamificationService.checkBadges(user.id);
    }).then((newBadges) => {
      if (newBadges.length) {
        m.textContent = 'شارات جديدة: ' + newBadges.map((b) => b.name[lang] || b.name).join(', ');
        m.className = 'mt-4 text-center text-sm text-green-600';
        m.classList.remove('hidden');
      }
    });
  }

  const results = StorageManager.getData(STORAGE_KEYS.QUIZ_RESULTS) || [];
  const result = { id: 'r-' + Date.now(), userId: user ? user.id : null, quizId: quiz.id, score: correct, totalQuestions: questions.length, correctAnswers: correct, wrongAnswers: wrong, pointsEarned: finalPts, xpEarned: finalXp, completedAt: new Date().toISOString() };
  results.push(result);
  StorageManager.saveData(STORAGE_KEYS.QUIZ_RESULTS, results);

  container.querySelector('#btn-back').onclick = () => {
    sessionStorage.removeItem('active_quiz');
    onBack();
  };
}
