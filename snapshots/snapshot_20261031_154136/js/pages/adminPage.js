import { StorageManager } from '../storage/storageManager.js';
import { QuestionService } from '../services/questionService.js';
import { STORAGE_KEYS, QUESTION_STATUS } from '../config/appConfig.js';
import { AuthService } from '../auth/authService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }
function label(obj) { return (obj && obj[lang]) || obj || ''; }
const statusLabel = { draft: 'مسودة', review: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' };

export function renderAdmin(container) {
  if (!AuthService.isAdmin()) { container.innerHTML = `<div class="text-center py-20 text-red-600">${t('adminOnly')}</div>`; return; }

  container.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h1 class="text-2xl font-bold">إدارة المنصة</h1>
        <div class="flex gap-2">
          <button id="btn-add-q" class="btn-primary">إضافة سؤال</button>
          <button id="btn-refresh" class="btn-ghost">تحديث</button>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <input id="f-search" type="text" placeholder="البحث في الأسئلة" class="px-3 py-2 rounded border w-full md:w-80">
        <select id="f-status" class="px-3 py-2 rounded border">
          <option value="all">الحالة: جميعها</option>
          <option value="draft">مسودة</option><option value="review">قيد المراجعة</option><option value="approved">معتمد</option><option value="rejected">مرفوض</option>
        </select>
        <select id="f-cat" class="px-3 py-2 rounded border"><option value="all">جميع التصنيفات</option></select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr><th class="p-2 text-left">#</th><th class="p-2 text-left">النص</th><th class="p-2 text-left">التصنيف</th><th class="p-2 text-left">العمر</th><th class="p-2 text-left">الصعوبة</th><th class="p-2 text-left">الحالة</th><th class="p-2 text-left">العمليات</th></tr>
          </thead>
          <tbody id="admin-questions"></tbody>
        </table>
      </div>
      <div id="admin-msg" class="mt-3 text-center text-sm hidden"></div>

      <!-- تعديل سؤال -->
      <div id="edit-modal" class="fixed inset-0 bg-black/50 hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
          <h3 class="font-bold mb-4">تعديل السؤال</h3>
          <div class="space-y-3">
            <input id="eq-text" class="w-full px-3 py-2 rounded border" placeholder="نص السؤال">
            <select id="eq-status" class="w-full px-3 py-2 rounded border">
              <option value="draft">مسودة</option><option value="review">قيد المراجعة</option><option value="approved">معتمد</option><option value="rejected">مرفوض</option>
            </select>
            <div class="flex justify-end gap-2">
              <button id="eq-cancel" class="btn-ghost">إلغاء</button>
              <button id="eq-save" class="btn-primary">حفظ</button>
            </div>
          </div>
          <div id="eq-msg" class="text-sm text-center hidden"></div>
        </div>
      </div>
    </div>
  `;

  const cats = QuestionService.getCategories();
  const fCat = container.querySelector('#f-cat');
  fCat.innerHTML = '<option value="all">جميع التصنيفات</option>' + cats.map((c) => `<option value="${c.id}">${label(c.name)}</option>`).join('');

  let questions = [];
  let editingId = null;

  const load = () => {
    const search = container.querySelector('#f-search').value.toLowerCase();
    const status = container.querySelector('#f-status').value;
    const cat = container.querySelector('#f-cat').value;
    const tbody = container.querySelector('#admin-questions');
    questions = (StorageManager.getData(STORAGE_KEYS.QUESTIONS) || []).filter((q) => {
      if (search && !label(q.text).toLowerCase().includes(search)) return false;
      if (status !== 'all' && q.status !== status) return false;
      if (cat !== 'all' && q.categoryId !== cat) return false;
      return true;
    });
    tbody.innerHTML = questions.map((q, i) => `
      <tr class="border-b">
        <td class="p-2">${i + 1}</td>
        <td class="p-2 max-w-[300px] truncate">${label(q.text)}</td>
        <td class="p-2">${label(QuestionService.getCategories().find((c) => c.id === q.categoryId)?.name)}</td>
        <td class="p-2">${q.ageGroupId}</td>
        <td class="p-2">${q.difficultyId}</td>
        <td class="p-2"><span class="badge ${q.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}">${statusLabel[q.status] || q.status}</span></td>
        <td class="p-2">
          <button class="btn-ghost text-xs mr-2" onclick="appAdminEdit('${q.id}')">تعديل</button>
          <button class="btn-ghost text-xs text-red-600" onclick="appAdminDelete('${q.id}')">حذف</button>
        </td>
      </tr>
    `).join('');
  };

  window.appAdminEdit = (id) => {
    editingId = id;
    const q = questions.find((x) => x.id === id);
    container.querySelector('#eq-text').value = label(q.text);
    container.querySelector('#eq-status').value = q.status;
    container.querySelector('#edit-modal').classList.remove('hidden');
    container.querySelector('#eq-msg').classList.add('hidden');
  };
  window.appAdminDelete = async (id) => {
    if (!confirm('هل أنت متأكد؟')) return;
    const r = StorageManager.deleteData(STORAGE_KEYS.QUESTIONS, id);
    if (r.ok) { StorageManager.logAudit(AuthService.getCurrentUser().id, 'DELETE_QUESTION', 'question', id); load(); }
  };

  container.querySelector('#btn-refresh').onclick = load;
  container.querySelector('#btn-add-q').onclick = () => {
    editingId = null;
    container.querySelector('#eq-text').value = '';
    container.querySelector('#eq-status').value = 'draft';
    container.querySelector('#edit-modal').classList.remove('hidden');
    container.querySelector('#eq-msg').classList.add('hidden');
  };
  container.querySelector('#eq-cancel').onclick = () => container.querySelector('#edit-modal').classList.add('hidden');
  container.querySelector('#eq-save').onclick = async () => {
    const m = container.querySelector('#eq-msg');
    const text = container.querySelector('#eq-text').value.trim();
    const status = container.querySelector('#eq-status').value;
    if (!text) { m.textContent = 'نص السؤال مطلوب'; m.className = 'text-sm text-center text-red-600'; m.classList.remove('hidden'); return; }
    const cats2 = QuestionService.getCategories();
    const diffs = QuestionService.getDifficulties();
    const ags = QuestionService.getAgeGroups();
    const q = {
      id: editingId || 'q-' + Date.now(),
      text: { ar: text, en: text },
      categoryId: cats2[0]?.id || '',
      ageGroupId: ags[0]?.id || '',
      difficultyId: diffs[0]?.id || '',
      correctAnswer: '',
      options: [{ id: 'o1', text: { ar: 'أ', en: 'A' }, isCorrect: true, order: 1 }],
      explanation: { ar: '', en: '' },
      source: 'admin', status, isAiGenerated: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const r = editingId ? StorageManager.updateData(STORAGE_KEYS.QUESTIONS, editingId, q) : StorageManager.saveData(STORAGE_KEYS.QUESTIONS, [(StorageManager.getData(STORAGE_KEYS.QUESTIONS) || []), q].flat());
    if (!r.ok) { m.textContent = 'فشل الحفظ'; m.className = 'text-sm text-center text-red-600'; m.classList.remove('hidden'); return; }
    StorageManager.logAudit(AuthService.getCurrentUser().id, editingId ? 'EDIT_QUESTION' : 'ADD_QUESTION', 'question', q.id, { status });
    container.querySelector('#edit-modal').classList.add('hidden');
    load();
    m.textContent = 'تم الحفظ'; m.className = 'text-sm text-center text-green-600'; m.classList.remove('hidden');
    setTimeout(() => m.classList.add('hidden'), 1500);
  };

  [container.querySelector('#f-search'), container.querySelector('#f-status'), container.querySelector('#f-cat')].forEach((el) => el.oninput = load);
  load();
}
