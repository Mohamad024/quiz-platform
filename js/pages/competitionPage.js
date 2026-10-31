import { CompetitionService } from '../services/competitionService.js';
import { QuestionService } from '../services/questionService.js';
import { AuthService } from '../auth/authService.js';
import { STORAGE_KEYS } from '../config/appConfig.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }

export function renderCompetition(container) {
  const user = AuthService.getCurrentUser();
  if (!user) { container.innerHTML = '<div class="text-center py-10">يرجى تسجيل الدخول</div>'; return; }

  const mode = container.dataset.mode || 'lobby';
  if (mode === 'lobby') renderLobby(container, user);
  else if (mode === 'room') renderRoom(container, user);
  else if (mode === 'play') renderPlay(container, user);
  else if (mode === 'results') renderResults(container, user);
}

function renderLobby(container, user) {
  const cats = QuestionService.getCategories();
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-6">المنافسة المحلية</h1>
      <form id="comp-form" class="card p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">التصنيف</label>
          <select name="categoryId" class="w-full px-3 py-2 rounded border">
            <option value="">جميع التصنيفات</option>${cats.map((c) => `<option value="${c.id}">${label(c.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">عدد الأسئلة</label>
          <select name="count" class="w-full px-3 py-2 rounded border"><option>5</option><option>10</option></select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">وقت كل سؤال (ثانية)</label>
          <select name="time" class="w-full px-3 py-2 rounded border"><option>10</option><option>15</option><option>20</option></select>
        </div>
        <button type="submit" class="btn-primary w-full">إنشاء غرفة</button>
      </form>
      <div id="rooms-list" class="mt-6"></div>
      <div id="comp-msg" class="mt-3 text-center text-sm hidden"></div>
    </div>
  `;

  const m = container.querySelector('#comp-msg');
  container.querySelector('#comp-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    CompetitionService.createRoom({ hostId: user.id, categoryId: fd.get('categoryId') || null, questionCount: Number(fd.get('count')), timePerQuestion: Number(fd.get('time')) }).then((r) => {
      if (r.ok) { m.classList.add('hidden'); container.dataset.mode = 'room'; container.dataset.roomId = r.room.id; renderCompetition(container); }
      else { m.textContent = r.error || 'فشل'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); }
    });
  };

  renderRooms(container);
}

function renderRooms(container) {
  const rooms = CompetitionService.getRooms().filter((r) => r.status === 'waiting');
  const el = container.querySelector('#rooms-list');
  el.innerHTML = `
    <h3 class="font-semibold mb-2">الغرف المتاحة</h3>
    <div class="space-y-2">${rooms.map((r) => `
      <div class="card p-3 flex justify-between">
        <div>${r.code} · ${r.questionCount} سؤال</div>
        <button class="btn-ghost text-xs" onclick="appJoinRoom('${r.id}')">انضمام</button>
      </div>
    `).join('') || '<div class="text-sm text-gray-500">لا توجد غرف.</div>'}</div>
  `;
  window.appJoinRoom = async (roomId) => {
    const r = await CompetitionService.joinRoom(roomId, user.id);
    if (r.ok) { container.dataset.mode = 'room'; container.dataset.roomId = roomId; renderCompetition(container); }
    else alert(r.error || 'فشل الانضمام');
  };
}

function renderRoom(container, user) {
  const room = CompetitionService.getRoom(container.dataset.roomId);
  const participants = CompetitionService.getParticipants(room.id);
  const isHost = room.hostId === user.id;
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-6 mb-4">
        <h2 class="font-bold mb-2">غرفة ${room.code}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">الحالة: ${room.status === 'waiting' ? 'في الانتظار' : 'جارية'}</div>
        <h4 class="font-semibold mb-2">المشاركون</h4>
        <ul class="space-y-1">${participants.map((p) => `<li class="p-2 bg-gray-50 dark:bg-gray-700 rounded">${p.username} ${p.isHost ? ' (المضيف)' : ''}</li>`).join('')}</ul>
        ${isHost ? `<button id="btn-start" class="btn-primary w-full mt-4">بدء المنافسة</button>` : `<p class="text-sm text-gray-500">في انتظار المضيف لبدء المنافسة.</p>`}
        <button id="btn-back" class="btn-ghost mt-2">العودة</button>
      </div>
    </div>
  `;
  if (isHost) container.querySelector('#btn-start').onclick = async () => {
    const r = await CompetitionService.startRoom(room.id, user.id);
    if (r.ok) { container.dataset.mode = 'play'; renderCompetition(container); }
    else alert(r.error || 'فشل البدء');
  };
  container.querySelector('#btn-back').onclick = () => { container.dataset.mode = 'lobby'; delete container.dataset.roomId; renderCompetition(container); };
}

function renderPlay(container, user) {
  const room = CompetitionService.getRoom(container.dataset.roomId);
  const qList = CompetitionService.getRoomQuestions(room.id);
  const qi = room.currentQuestionIndex;
  if (qi >= qList.length) { container.dataset.mode = 'results'; renderCompetition(container); return; }
  const roomQ = qList[qi];
  const allQ = StorageManagerGetQuestions();
  const q = allQ.find((x) => x.id === roomQ.questionId);
  const timeLeft = room.timePerQuestion;

  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-6 mb-4">
        <div class="flex justify-between items-center mb-2"><span class="font-bold">السؤال ${qi + 1} / ${qList.length}</span><span id="timer" class="font-mono font-bold">${timeLeft}s</span></div>
        <div class="text-lg font-bold mb-4">${label(q.text)}</div>
        <div class="space-y-2" id="opts">
          ${(q.options || []).sort((a, b) => a.order - b.order).map((o) => `<button class="w-full p-3 rounded border text-left hover:bg-gray-50 dark:hover:bg-gray-700" onclick="appCompAnswer('${o.id}')">${label(o.text)}</button>`).join('')}
        </div>
        <div id="play-msg" class="mt-3 text-sm text-center hidden"></div>
      </div>
    </div>
  `;
  const m = container.querySelector('#play-msg');
  window.appCompAnswer = async (optionId) => {
    const r = await CompetitionService.answer(room.id, user.id, roomQ.questionId, optionId, 0);
    if (r.ok) {
      m.textContent = r.correct ? 'صحيح!' : 'خطأ!';
      m.className = `mt-3 text-sm text-center ${r.correct ? 'text-green-600' : 'text-red-600'}`;
      m.classList.remove('hidden');
      setTimeout(() => {
        CompetitionService.nextQuestion(room.id, user.id).then(() => renderCompetition(container));
      }, 1200);
    } else { m.textContent = r.error || 'فشل'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); }
  };
  // مؤقت بسيط
  let sec = timeLeft;
  const timer = container.querySelector('#timer');
  const iv = setInterval(() => {
    sec -= 1;
    timer.textContent = sec + 's';
    if (sec <= 0) { clearInterval(iv); CompetitionService.nextQuestion(room.id, user.id).then(() => renderCompetition(container)); }
  }, 1000);
}

function renderResults(container, user) {
  const room = CompetitionService.getRoom(container.dataset.roomId);
  const results = CompetitionService.getResults(room.id);
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-6 text-center">
        <h2 class="font-bold mb-2">نتائج المنافسة</h2>
        <div class="space-y-3">${results.map((p, i) => `<div class="p-3 rounded ${i===0?'bg-amber-50 dark:bg-amber-900/20 border-amber-400':'bg-gray-50 dark:bg-gray-700 border'}">${i+1}. ${p.username} — ${p.score} نقطة (${p.correctCount}/${p.answersCount})</div>`).join('')}</div>
        <button id="btn-back2" class="btn-primary w-full mt-4">العودة للقاعات</button>
      </div>
    </div>
  `;
  container.querySelector('#btn-back2').onclick = () => { container.dataset.mode = 'lobby'; delete container.dataset.roomId; renderCompetition(container); };
}

function StorageManagerGetQuestions() {
  return (typeof StorageManager !== 'undefined' ? StorageManager.getData(STORAGE_KEYS.QUESTIONS) : []) || [];
}
