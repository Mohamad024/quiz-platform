import { AuthService } from '../auth/authService.js';
import { MESSAGES } from '../config/appConfig.js';

let lang = 'ar';
export function setLang(l) { lang = l; }
function t(k) { return (MESSAGES[lang] || MESSAGES.ar)[k] || k; }

function msg(el, text, type = 'error') {
  el.textContent = text;
  el.className = `text-sm text-center ${type === 'error' ? 'text-red-600' : 'text-green-600'}`;
  el.classList.remove('hidden');
}

export function renderLogin(container, onAuth) {
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-8 mx-auto">
        <h1 class="text-2xl font-bold mb-6 text-center">${t('login')}</h1>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
            <input type="text" name="username" required class="w-full px-3 py-2 rounded border" placeholder="أدخل اسم المستخدم">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">كلمة المرور</label>
            <input type="password" name="password" required class="w-full px-3 py-2 rounded border" placeholder="أدخل كلمة المرور">
          </div>
          <button type="submit" class="btn-primary w-full">${t('login')}</button>
        </form>
        <p class="text-center text-sm text-gray-600 mt-4">ليس لديك حساب؟ <a href="#register" class="text-indigo-600 font-medium">إنشاء حساب</a></p>
        <div id="login-msg" class="hidden"></div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const m = container.querySelector('#login-msg');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const res = await AuthService.login({ username: fd.get('username'), password: fd.get('password') });
    if (res.ok) { m.classList.add('hidden'); onAuth(); }
    else msg(m, t(res.error) || res.error);
  };
}

export function renderRegister(container, onAuth) {
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-8 mx-auto">
        <h1 class="text-2xl font-bold mb-6 text-center">${t('register')}</h1>
        <form id="register-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
            <input type="text" name="username" required class="w-full px-3 py-2 rounded border" minlength="3">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">كلمة المرور</label>
            <input type="password" name="password" required class="w-full px-3 py-2 rounded border" minlength="6">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">العمر</label>
            <input type="number" name="age" required class="w-full px-3 py-2 rounded border" min="6" max="100" value="18">
          </div>
          <button type="submit" class="btn-primary w-full">${t('register')}</button>
        </form>
        <p class="text-center text-sm text-gray-600 mt-4">لديك حساب؟ <a href="#login" class="text-indigo-600 font-medium">تسجيل الدخول</a></p>
        <div id="register-msg" class="hidden"></div>
      </div>
    </div>
  `;

  const form = container.querySelector('#register-form');
  const m = container.querySelector('#register-msg');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const res = await AuthService.register({ username: fd.get('username'), password: fd.get('password'), age: Number(fd.get('age')) });
    if (res.ok) { m.classList.add('hidden'); onAuth(); }
    else msg(m, t(res.error) || res.error);
  };
}
