// passwordPolicy.js — shared password rules, validation, and strength scoring.
// One source of truth for every password-creation point (forced change in
// index.html, self-service change in prefsModal). Rules (user-defined 2026-06-14):
//   12–64 chars · ≥1 uppercase · ≥1 lowercase · ≥1 number · ≥1 symbol
//   · no leading/trailing spaces · must not contain the user's ID / email / name.
// NOTE: 64 cap because Supabase/GoTrue hashes with bcrypt (ignores bytes past 72).
// TODO (Supabase Pro): enable HaveIBeenPwned breached-password protection.

export const PW_MIN = 12;
export const PW_MAX = 64;

const STRENGTH_META = [
  { label: 'Very weak', color: '#ef5350' },
  { label: 'Weak',      color: '#ff9800' },
  { label: 'Fair',      color: '#ffca28' },
  { label: 'Good',      color: '#9ccc65' },
  { label: 'Strong',    color: '#66bb6a' },
];

function forbiddenTerms(ctx = {}) {
  const out = [];
  if (ctx.employeeId) {
    const digits = String(ctx.employeeId).replace(/\D/g, '');
    if (digits.length >= 4) out.push(digits);
    const raw = String(ctx.employeeId).toLowerCase();
    if (raw.length >= 4) out.push(raw);
  }
  if (ctx.email) {
    const local = String(ctx.email).split('@')[0].toLowerCase();
    if (local.length >= 3) out.push(local);
  }
  if (ctx.name) {
    String(ctx.name).toLowerCase().split(/\s+/).forEach(p => { if (p.length >= 3) out.push(p); });
  }
  return out;
}

/** Validate a password against the policy. Returns rules[], allMet, strength (0–4). */
export function checkPassword(pw, ctx = {}) {
  pw = pw == null ? '' : String(pw);
  const lower = pw.toLowerCase();
  const forbids = forbiddenTerms(ctx);
  const rules = [
    { key: 'len',    label: `${PW_MIN}–${PW_MAX} characters`,        met: pw.length >= PW_MIN && pw.length <= PW_MAX },
    { key: 'upper',  label: 'An uppercase letter (A–Z)',             met: /[A-Z]/.test(pw) },
    { key: 'lower',  label: 'A lowercase letter (a–z)',              met: /[a-z]/.test(pw) },
    { key: 'number', label: 'A number (0–9)',                        met: /[0-9]/.test(pw) },
    { key: 'symbol', label: 'A symbol (!@#$…)',                      met: /[^A-Za-z0-9]/.test(pw) },
    { key: 'space',  label: 'No leading or trailing spaces',             met: pw.length > 0 && pw === pw.trim() },
    { key: 'noid',   label: 'Not your ID, email, or name',               met: pw.length > 0 && !forbids.some(f => lower.includes(f)) },
  ];
  const allMet = rules.every(r => r.met);

  let score = 0;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= PW_MIN) score++;
  if (pw.length >= 16) score++;
  const strength = pw ? [0, 0, 1, 2, 3, 3, 4][Math.min(6, score)] : 0;

  return {
    rules, allMet, strength,
    strengthLabel: STRENGTH_META[strength].label,
    strengthColor: STRENGTH_META[strength].color,
  };
}

/** Render a strength bar + live rule checklist into `el`. Returns allMet. */
export function renderPwFeedback(el, pw, ctx = {}) {
  if (!el) return false;
  const { rules, allMet, strength, strengthLabel, strengthColor } = checkPassword(pw, ctx);
  const muted = 'var(--text-muted,#8b97a2)';
  const bars = [0, 1, 2, 3, 4].map(i =>
    `<span style="flex:1;height:4px;border-radius:2px;background:${pw && i <= strength ? strengthColor : 'rgba(255,255,255,0.13)'};"></span>`
  ).join('');
  const items = rules.map(r =>
    `<li style="display:flex;align-items:center;gap:6px;margin:3px 0;font-size:12px;color:${r.met ? '#9ccc65' : muted};">
       <span style="width:12px;display:inline-block;text-align:center;">${r.met ? '✓' : '○'}</span>${r.label}</li>`
  ).join('');
  el.innerHTML =
    `<div style="display:flex;gap:4px;margin:8px 0 4px;">${bars}</div>` +
    `<div style="font-size:11px;color:${pw ? strengthColor : muted};margin-bottom:6px;min-height:14px;">${pw ? 'Strength: ' + strengthLabel : ''}</div>` +
    `<ul style="list-style:none;padding:0;margin:0;">${items}</ul>`;
  return allMet;
}
