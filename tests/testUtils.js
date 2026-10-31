const results = [];
const pending = [];
let passed = 0, failed = 0;
export function assertEqual(a, b, msg = '') {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { failed++; results.push({ msg, status: 'fail', detail: `expected ${JSON.stringify(b)} got ${JSON.stringify(a)}` }); }
  else { passed++; results.push({ msg, status: 'pass' }); }
  return ok;
}
export function assertOk(res, msg = '') {
  const ok = res && res.ok === true;
  if (!ok) { failed++; results.push({ msg, status: 'fail', detail: JSON.stringify(res) }); }
  else { passed++; results.push({ msg, status: 'pass' }); }
  return ok;
}
export function assertNot(a, b, msg = '') {
  const ok = a !== b;
  if (!ok) { failed++; results.push({ msg, status: 'fail' }); }
  else { passed++; results.push({ msg, status: 'pass' }); }
  return ok;
}
export function describe(name, fn) { console.log('=== ' + name + ' ==='); fn(); }
export function it(name, fn) { pending.push({ name, fn }); }
export async function flush() {
  for (const { name, fn } of pending) {
    try { await fn(); } catch (e) { results.push({ name, status: 'error', detail: (e.stack || e.message).split('\n').slice(0, 3).join(' | ') }); }
  }
  results.forEach((r) => console.log((r.status === 'pass' ? 'PASS' : 'FAIL') + ' - ' + (r.msg || r.name) + (r.detail ? ' | ' + r.detail : '')));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}
