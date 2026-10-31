import { AuthService } from '../auth/authService.js';
import { GamificationService } from '../services/gamificationService.js';
import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { const d = { ar: {}, en: {} }[lang] || {}; return d[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }

export function renderDashboard(container) {
  const user = AuthService.getCurrentUser();
  if (!user) { container.innerHTML = '<div class="text-center py-10">يرجى تسجيل الدخول</div>'; return; }

  const level = GamificationService.getLevelForXP(user.totalXP || 0);
  const next = GamificationService.getLevels().sort((a, b) => a.level - b.level).find((l) => l.level > level.level);
  const pct = next ? Math.min(100, ((user.totalXP || 0) - (level.minXP ?? 0)) / ((next.maxXP ?? (level.minXP ?? 0) + 100) - (level.minXP ?? 0)) * 100) : 100;
  const badges = GamificationService.getUserBadges(user.id);
  const allBadges = GamificationService.getBadges();
  const earned = badges.map((b) => allBadges.find((x) => x.id === b.badgeId));
  const challenges = GamificationService.getChallenges().filter((c) => c.isActive);
  const progress = GamificationService.getChallengeProgress(user.id);

  container.innerHTML = `
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div class="card p-6">
        <h3 class="font-bold mb-2">مرحباً، ${user.username}</h3>
        <p class="text-sm text-gray-500">العمر: ${user.age} · المستوى: ${user.level}</p>
      </div>
      <div class="card p-6 bg-indigo-50 dark:bg-indigo-900/20">
        <div class="text-2xl font-bold">${user.totalPoints || 0}</div>
        <div class="text-sm text-indigo-600 dark:text-indigo-400">نقاط إجمالية</div>
      </div>
      <div class="card p-6 bg-green-50 dark:bg-green-900/20">
        <div class="text-2xl font-bold">${user.totalXP || 0}</div>
        <div class="text-sm text-green-600 dark:text-green-400">خبرة إجمالية</div>
      </div>
      <div class="card p-6 col-span-full">
        <div class="flex justify-between text-sm mb-1"><span>المستوى الحالي</span><span class="font-bold">${label(level.name)} (${level.level})</span></div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2"><div class="bg-indigo-600 h-2 rounded-full" style="width:${pct}%"></div></div>
        <div class="text-xs text-gray-500">${next ? `XP حتى المستوى التالي: ${(next.maxXP === null ? 'الأخير' : (next.minXP ?? 0) - (user.totalXP || 0))}` : 'أعلى مستوى'}</div>
      </div>
      <div class="card p-6 col-span-full">
        <div class="flex justify-between text-sm mb-2"><span>سلسلة النشاط</span><span class="font-bold">${user.currentStreak || 0}</span></div>
        <div class="flex justify-between text-sm"><span>أطول سلسلة</span><span class="font-bold">${user.longestStreak || 0}</span></div>
      </div>
      <div class="card p-6 col-span-full">
        <h4 class="font-semibold mb-3">التحديات النشطة</h4>
        <div class="space-y-2" id="challenges-list">
          ${challenges.map((c) => {
            const cp = progress.find((p) => p.challengeId === c.id);
            const cur = cp ? cp.current : 0;
            const done = cp ? cp.completed : false;
            return `
              <div class="flex justify-between items-center p-3 border rounded bg-gray-50 dark:bg-gray-700/50 ${done ? 'border-green-500' : ''}">
                <div>
                  <div class="font-medium">${label(c.title)}</div>
                  <div class="text-xs text-gray-500">${cur} / ${c.target}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs ${done ? 'text-green-600' : 'text-gray-500'}">${done ? 'تم إنجازه' : 'جاري'}</div>
                  <div class="text-xs">${c.rewardXp} XP + ${c.rewardPoints} نقطة</div>
                </div>
              </div>
            `;
          }).join('') || '<div class="text-sm text-gray-500">لا توجد تحديات نشطة.</div>'}
        </div>
      </div>
      <div class="card p-6 col-span-full">
        <h4 class="font-semibold mb-3">الشارات</h4>
        <div class="flex gap-2 flex-wrap" id="badges-list">
          ${earned.map((b) => `<span class="badge border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">${label(b.name)}</span>`).join('') || '<span class="text-sm text-gray-500">لا توجد شارات بعد.</span>'}
        </div>
      </div>
      <div class="card p-6 col-span-full">
        <button id="btn-update-profile" class="btn-ghost">تعديل الملف الشخصي</button>
        <button id="btn-change-pass" class="btn-ghost ml-2">تغيير كلمة المرور</button>
        <button id="btn-delete-account" class="btn-ghost ml-2 text-red-600">حذف الحساب</button>
        <div id="dashboard-msg" class="mt-3 hidden text-sm text-center"></div>
      </div>
    </div>
  `;

  const m = container.querySelector('#dashboard-msg');
  container.querySelector('#btn-update-profile').onclick = () => {
    const name = prompt('اسم المستخدم الجديد:');
    if (name) AuthService.updateProfile(user.id, { username: name }).then((r) => {
      if (r.ok) { m.textContent = 'تم التحديث'; m.className = 'mt-3 text-sm text-center text-green-600'; m.classList.remove('hidden'); renderDashboard(container); }
    });
  };
  container.querySelector('#btn-change-pass').onclick = () => {
    const cur = prompt('كلمة المرور الحالية:');
    const neu = prompt('كلمة المرور الجديدة:');
    if (cur && neu) AuthService.changePassword(user.id, cur, neu).then((r) => {
      m.textContent = r.ok ? 'تم تغيير كلمة المرور' : (r.error || 'فشل');
      m.className = `mt-3 text-sm text-center ${r.ok ? 'text-green-600' : 'text-red-600'}`;
      m.classList.remove('hidden');
    });
  };
  container.querySelector('#btn-delete-account').onclick = async () => {
    if (!confirm('هل أنت متأكد من حذف الحساب؟')) return;
    const pw = prompt('أدخل كلمة المرور للتأكيد:');
    const res = await AuthService.deleteAccount(user.id, pw || '');
    if (res.ok) { m.textContent = 'تم حذف الحساب'; m.className = 'mt-3 text-sm text-center text-green-600'; m.classList.remove('hidden'); window.location.hash = '#login'; }
    else { m.textContent = res.error || 'فشل'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); }
  };
}
