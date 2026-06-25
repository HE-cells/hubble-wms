// pages/expenses-state.js — Shared state + helpers for the Expense & Travel module

import { getDefaultCurrency, toISODate, todayISO, esc } from '../format.js';
import { supabase } from '../config.js';

// ── Mutable shared state ──────────────────────────────────────
export const S = {
  admin:        false,
  manager:      false,
  profile:      null,
  myEmployee:   null,
  categories:   [],
  vehicles:     [],
  projects:     [],
  holidaySet:   new Set(),
  monthlyTopup: 6000,
  ptDailyRate:  550,
  pendingReimb: { txns: [], claims: [] },
  prefillTopupAmt: null,

  primaryTab:   'my-expenses',
  travelSub:    'mileage',
  approvSub:    'pending',
  pendingCat:   'expense',
  pettyCashSub: 'ledger',
  apWeekStart:  null,
  pcWeekStart:  null,
  pendingData:  { exp: [], claims: [], trips: [], settlements: [] },
  reportMode:   'monthly',
  showPastExp:   false,
  showPastClaims: false,
  showPastTrips:  false,
  pendingApprovals: 0,
  historyItems: [],
};

// ── Pure helpers ──────────────────────────────────────────────
export const _fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
export const _money = (a, c) => `${Number(a ?? 0).toLocaleString('en',{minimumFractionDigits:2})} ${esc(c || 'THB')}`;
export const _today = () => todayISO();
export const _isWeekend = d => { const x = new Date(d + 'T00:00:00').getDay(); return x === 0 || x === 6; };
export const _nextWeekday = () => { const d = new Date(); d.setHours(0,0,0,0); while (_isWeekend(toISODate(d))) d.setDate(d.getDate()+1); return toISODate(d); };

export const STATUS_LABELS = { pending:'Pending', manager_approved:'Mgr Approved', approved:'Approved', rejected:'Rejected', completed:'Completed', cancelled:'Cancelled' };
export const STATUS_CLASS  = { pending:'badge-pending', manager_approved:'badge-warning', approved:'badge-approved', rejected:'badge-rejected', completed:'badge-approved', cancelled:'' };
export const _badge   = s => `<span class="badge ${STATUS_CLASS[s]||''}">${esc(STATUS_LABELS[s]||s)}</span>`;
export const _settled = s => ['approved','rejected','completed','cancelled'].includes(s);

// ISO week number
export function _isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return week;
}

// Category helpers — reference S
export const _catIn  = () => S.categories.filter(c => c.applies_to === 'in'  || c.applies_to === 'both');
export const _catOut = () => S.categories.filter(c => c.applies_to === 'out' || c.applies_to === 'both');
export const _otherCatId = () => S.categories.find(c => c.name === 'Other')?.id;

// Office-overhead categories always belong to the in-house "Hubble Engineering Office"
// project; everything else (Import Tax, Shipping & Handling, Other, …) is picked per
// customer project. Names are seeded/stable, so a JS constant suffices (no migration).
export const OFFICE_CAT_NAMES = new Set([
  'Engineering Assistant Wage', 'International wire transfer service charge',
  'Municipal Water', 'Electricity', 'Office Cleaning', 'Drink & Beverages',
  'Travel Expense Reimbursement',
]);
// IN (top-up) sources that always fund the in-house office project; Customer
// Working Budget stays a per-project pick.
export const OFFICE_IN_CAT_NAMES = new Set([
  'Hubble Engineering Working Budget', 'Engineering Assistant Working Budget',
]);
export const _officeProjectId = () => S.projects.find(p => p.name === 'Hubble Engineering Office')?.id || '';

// ── FX conversion (api.frankfurter.dev — free, no key required) ──
export const _fxCache = {};
export async function _fetchFxRate(from, to) {
  if (from === to) return 1;
  const key = `${from}_${to}`;
  if (_fxCache[key]) return _fxCache[key];
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${from}&to=${to}`);
    const j   = await res.json();
    const rate = j.rates?.[to] ?? null;
    if (rate) _fxCache[key] = rate;
    return rate;
  } catch { return null; }
}
export function _wireCurrencyConvert(amtId, curId) {
  const curSel = document.getElementById(curId);
  const amtInp = document.getElementById(amtId);
  if (!curSel || !amtInp) return;
  let prev = curSel.value;
  curSel.addEventListener('change', async () => {
    const amt = parseFloat(amtInp.value);
    if (amt > 0 && prev && prev !== curSel.value) {
      const rate = await _fetchFxRate(prev, curSel.value);
      if (rate) {
        amtInp.value = (amt * rate).toFixed(2);
        window.showToast?.(`Converted at 1 ${prev} = ${rate.toFixed(4)} ${curSel.value}`, 'success');
      } else {
        window.showToast?.('Exchange rate unavailable — amount not converted', 'error');
      }
    }
    prev = curSel.value;
  });
}
// Currency select options. Pre-selects `sel` if provided, otherwise the user's default currency.
export const _curOpts = (sel) => ['THB','USD','EUR','GBP']
  .map(c => `<option ${c === (sel || getDefaultCurrency()) ? 'selected' : ''}>${c}</option>`)
  .join('');

export const _projOptions = (sel) => `<option value="">— Project / Purpose —</option>` +
  S.projects.map(p => `<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.name)}</option>`).join('');
// Required variant: no blank option; auto-selects the first project when sel is absent.
// Use wherever a project selection is mandatory (e.g. Trip Request).
export const _projOptionsReq = (sel) =>
  S.projects.map((p, i) => `<option value="${p.id}" ${(sel ? sel===p.id : i===0)?'selected':''}>${esc(p.name)}</option>`).join('');

// Deadline: the 14th, or the last workday before it if 14th is weekend/holiday.
export function _monthlyDeadline(year, month) {
  let d = new Date(year, month - 1, 14);
  while (_isWeekend(toISODate(d)) || S.holidaySet.has(toISODate(d))) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}
// Next Monday from a given date (or today).
export function _nextMonday(from) {
  const d = from ? new Date(from) : new Date(); d.setHours(0,0,0,0);
  const day = d.getDay();
  const add = day === 1 ? 0 : ((8 - day) % 7 || 7);
  d.setDate(d.getDate() + add);
  return d;
}

// ── Week date-range helpers ────────────────────────────────────
export function _weekRange(monday) {
  const from = new Date(monday + 'T00:00:00');
  const to = new Date(from); to.setDate(to.getDate() + 6);
  return { from: toISODate(from), to: toISODate(to) };
}
// True if no week filter is set, or `dateStr` falls within the filter week.
export function _inWeek(dateStr, monday) {
  if (!monday) return true;
  if (!dateStr) return false;
  const d = String(dateStr).slice(0,10);
  const { from, to } = _weekRange(monday);
  return d >= from && d <= to;
}

// Visible error state for money-critical loads (M-SILENT) — never silently show empty/zero.
export function _loadErrorHtml(retryId, title, sub) {
  return `
    <div class="empty-state" style="margin-top:60px">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-sub">${sub}</div>
      <button class="btn btn-secondary" id="${retryId}" style="margin-top:16px">Retry</button>
    </div>`;
}
