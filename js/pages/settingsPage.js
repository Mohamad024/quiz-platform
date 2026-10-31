import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS } from '../config/appConfig.js';
import { AuthService } from '../auth/authService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }

export function renderSettings(container) {
  const user = AuthService.getCurrentUser();
  if (!user) { container.innerHTML = '<div class="text-center py-10">يرجى تسجيل الدخول</div>'; return; }

  const version = StorageManager.getData(STORAGE_KEYS.VERSION) || 1;
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-6">الإعدادات والنسخ الاحتياطي</h1>
      <div class="card p-6 mb-6">
        <h3 class="font-bold mb-3">النسخ الاحتياطي</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">إصدار البيانات: ${version}</p>
        <button id="btn-export" class="btn-primary w-full mb-3">تصدير بياناتي (JSON)</button>
        <div class="flex gap-2">
          <label class="flex-1">
            <input id="file-input" type="file" accept=".json" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300 cursor-pointer">
          </label>
          <button id="btn-import" class="btn-ghost">استيراد</button>
        </div>
        <div id="import-hint" class="mt-2 text-xs text-gray-500">استبدال البيانات الحالية عند الاستيراد.</div>
      </div>
      <div class="card p-6 mb-6 bg-red-50 dark:bg-red-900/20">
        <h3 class="font-bold text-red-800 dark:text-red-400 mb-3">إعادة الضبط</h3>
        <p class="text-sm text-red-600 dark:text-red-400 mb-3">سيتم مسح جميع البيانات المحلية نهائيًا ولا يمكن استرجاعها.</p>
        <button id="btn-reset" class="btn-ghost text-red-600">إعادة ضبط كل البيانات</button>
      </div>
      <div id="settings-msg" class="mt-3 text-center text-sm hidden"></div>
    </div>
  `;

  const m = container.querySelector('#settings-msg');
  container.querySelector('#btn-export').onclick = () => {
    const exp = StorageManager.exportData();
    if (!exp.ok) { m.textContent = 'فشل التصدير'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); return; }
    const blob = new Blob([JSON.stringify(exp.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    m.textContent = 'تم التصدير'; m.className = 'mt-3 text-sm text-center text-green-600'; m.classList.remove('hidden');
  };
  container.querySelector('#btn-import').onclick = () => {
    const input = container.querySelector('#file-input');
    if (!input.files[0]) { m.textContent = 'اختر ملفًا أولاً'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); return; }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!confirm('تأكيد استبدال جميع البيانات الحالية؟')) return;
        const imp = StorageManager.importData(payload, true);
        if (imp.ok) { m.textContent = 'تم الاستيراد (' + imp.applied + ' مفتاح)'; m.className = 'mt-3 text-sm text-center text-green-600'; m.classList.remove('hidden'); location.reload(); }
        else { m.textContent = 'ملف غير صالح'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); }
      } catch (err) { m.textContent = 'ملف غير صالح'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden'); }
    };
    reader.readAsText(file);
    input.value = '';
  };
  container.querySelector('#btn-reset').onclick = () => {
    if (!confirm('تأكيد مسح جميع البيانات نهائيًا؟')) return;
    StorageManager.resetData();
    AuthService.logout();
    m.textContent = 'تم إعادة الضبط'; m.className = 'mt-3 text-sm text-center text-red-600'; m.classList.remove('hidden');
    setTimeout(() => location.reload(), 800);
  };
}
