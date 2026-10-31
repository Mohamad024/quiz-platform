export const ValidationRules = {
  username: (v) => typeof v === 'string' && v.trim().length >= 3 && v.trim().length <= 24 && /^[a-zA-Z0-9_\u0600-\u065F\u0660-\u0669\u06F0-\u06F9]+$/.test(v.trim()),
  password: (v) => typeof v === 'string' && v.length >= 6,
  age: (v) => Number.isInteger(v) && v >= 6 && v <= 100,
  questionText: (v) => typeof v === 'string' && v.trim().length >= 5,
};
export function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  const el = document.createElement('div');
  el.textContent = str;
  return el.textContent;
}
