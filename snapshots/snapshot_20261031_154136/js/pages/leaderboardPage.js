import { LeaderboardService } from '../services/leaderboardService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }

export function renderLeaderboard(container) {
  const ageGroups = LeaderboardService.getAgeGroups();
  container.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">لوحة المتصدرين (محلية)</h1>
      <div class="flex gap-2 mb-4">
        <button id="tab-overall" class="tab-btn px-4 py-2 rounded border bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400">العام</button>
        <button id="tab-weekly" class="tab-btn px-4 py-2 rounded border">الأسبوعي</button>
        <button id="tab-monthly" class="tab-btn px-4 py-2 rounded border">الشهري</button>
      </div>
      <div class="mb-4">
        <label class="text-sm block mb-1">تصفية حسب الفئة العمرية</label>
        <select id="f-age" class="w-full md:w-64 px-3 py-2 rounded border">
          <option value="all">جميع الفئات</option>${ageGroups.map((g) => `<option value="${g.id}">${g.name[lang] || g.name}</option>`).join('')}
        </select>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr><th class="p-3">#</th><th class="p-3">المستخدم</th><th class="p-3">المستوى</th><th class="p-3">النقاط</th><th class="p-3">الفوز</th></tr>
          </thead>
          <tbody id="lb-body"></tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 mt-2">ملاحظة: الترتيب محلي على هذا الجهاز فقط، ليس عالمياً.</p>
    </div>
  `;

  let period = 'overall';
  let ageId = null;
  const render = () => {
    const list = period === 'overall' ? LeaderboardService.overall() : LeaderboardService.period(period, ageId);
    const body = container.querySelector('#lb-body');
    body.innerHTML = list.slice(0, 50).map((x, i) => `
      <tr class="border-b ${i === 0 ? 'bg-amber-50 dark:bg-amber-900/20' : ''}">
        <td class="p-2 font-bold">${i + 1}</td>
        <td class="p-2">${x.username}</td>
        <td class="p-2">${x.level}</td>
        <td class="p-2">${x.points}</td>
        <td class="p-2">${x.wins}</td>
      </tr>
    `).join('') || '<tr><td class="p-4 text-center text-gray-500" colspan="5">لا توجد نتائج.</td></tr>';
  };
  container.querySelector('#tab-overall').onclick = () => { period = 'overall'; setActive('tab-overall'); render(); };
  container.querySelector('#tab-weekly').onclick = () => { period = 'weekly'; setActive('tab-weekly'); render(); };
  container.querySelector('#tab-monthly').onclick = () => { period = 'monthly'; setActive('tab-monthly'); render(); };
  container.querySelector('#f-age').onchange = (e) => { ageId = e.target.value === 'all' ? null : e.target.value; render(); };
  const setActive = (id) => {
    ['tab-overall','tab-weekly','tab-monthly'].forEach((i) => {
      const b = container.querySelector('#' + i);
      b.className = i === id ? 'tab-btn px-4 py-2 rounded border bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400' : 'tab-btn px-4 py-2 rounded border';
    });
  };
  render();
}
