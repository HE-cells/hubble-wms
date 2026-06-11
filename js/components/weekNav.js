// components/weekNav.js
// Project-standard week-navigation component.
// Use this whenever a page needs week-by-week date navigation.
//
// ── API ────────────────────────────────────────────────────────
//
//   weekNavHtml(idPrefix, monday, opts?)
//     Returns an HTML string. Embed directly in a template literal.
//     idPrefix  — unique string that scopes all element IDs (e.g. 'ts', 'ap', 'pc')
//     monday    — Date | null.  null is only valid when allowAll is true.
//     opts      — { allowAll: false }
//                   allowAll: true  → renders "Showing all / This week" when monday is null,
//                                     and adds a "Show all" button when a week is active.
//                                     Use for list/filter views (expense approvals, petty cash…).
//
//   wireWeekNav(idPrefix, get, set, reload)
//     Wires all interactive elements produced by weekNavHtml().
//     Call once, after the HTML is in the DOM.
//     get()     — returns the current monday Date (or null)
//     set(d)    — stores the new monday Date (or null for "show all")
//     reload()  — re-renders the page section
//
//   updateWeekNavLabel(idPrefix, monday)
//     Updates the visible label text in place (call at the top of _reload()).
//
// ── Examples ───────────────────────────────────────────────────
//
//   // Always-week (Timesheet):
//   wrap.innerHTML = `${weekNavHtml('ts', _monday)} ...rest...`;
//   wireWeekNav('ts', () => _monday, d => { _monday = d; }, _reload);
//   // in _reload(): updateWeekNavLabel('ts', _monday);
//
//   // Filter mode with "Show all" (Expense Approvals, Petty Cash):
//   wrap.innerHTML = `${weekNavHtml('ap', _week, { allowAll: true })} ...rest...`;
//   wireWeekNav('ap', () => _week, v => { _week = v; }, _reload);

import { getMondayOf, formatWeekRange, toISODate, getISOWeek } from '../format.js';

// ── HTML ───────────────────────────────────────────────────────

export function weekNavHtml(idPrefix, monday, { allowAll = false } = {}) {
  // Null state: only valid when allowAll is true
  if (!monday && allowAll) {
    return `<div class="week-nav">
      <span class="week-nav-label" style="min-width:auto;color:var(--text-muted);">Showing all dates</span>
      <button class="btn btn-ghost btn-sm" id="${idPrefix}-wk-this">This week</button>
    </div>`;
  }

  const label = monday ? formatWeekRange(monday) : '—';
  const wkNum = monday ? getISOWeek(monday) : null;
  return `<div class="week-nav">
    <button class="week-nav-btn" id="${idPrefix}-wk-prev" title="Previous week">‹</button>
    <span class="week-nav-label" id="${idPrefix}-wk-label" title="Pick a week" style="cursor:pointer;">${label}</span>
    <input type="date" id="${idPrefix}-wk-picker" aria-label="Pick a week"
           style="width:0;padding:0;margin:0;border:0;opacity:0;">
    <button class="week-nav-btn" id="${idPrefix}-wk-next" title="Next week">›</button>
    ${wkNum !== null ? `<span class="week-nav-wknum" id="${idPrefix}-wk-wknum">Wk ${wkNum}</span>` : ''}
    ${allowAll ? `<button class="btn btn-ghost btn-sm" id="${idPrefix}-wk-all" style="margin-left:4px;">Show all</button>` : ''}
  </div>`;
}

// ── Wiring ─────────────────────────────────────────────────────

export function wireWeekNav(idPrefix, get, set, reload) {
  const $ = id => document.getElementById(id);
  const prev   = $(`${idPrefix}-wk-prev`);
  const next   = $(`${idPrefix}-wk-next`);
  const label  = $(`${idPrefix}-wk-label`);
  const picker = $(`${idPrefix}-wk-picker`);
  const thisWk = $(`${idPrefix}-wk-this`);
  const allWk  = $(`${idPrefix}-wk-all`);

  prev?.addEventListener('click', () => {
    const m = new Date(get()); m.setDate(m.getDate() - 7); set(m); reload();
  });
  next?.addEventListener('click', () => {
    const m = new Date(get()); m.setDate(m.getDate() + 7); set(m); reload();
  });
  thisWk?.addEventListener('click', () => { set(getMondayOf()); reload(); });
  allWk?.addEventListener('click',  () => { set(null); reload(); });

  // Click the label → open the native date picker (zero-size hidden input trick).
  // showPicker() is Chrome 99+ / Safari 16+; older browsers fall back to a visible input.
  label?.addEventListener('click', () => {
    if (!picker) return;
    picker.value = toISODate(get());
    if (typeof picker.showPicker === 'function') {
      try { picker.showPicker(); return; } catch { /* fall through */ }
    }
    picker.style.opacity = '1';
    picker.style.width = 'auto';
    picker.focus();
  });
  picker?.addEventListener('change', () => {
    if (!picker.value) return;
    set(getMondayOf(picker.value));
    // Reset fallback-visible state
    picker.style.opacity = '0';
    picker.style.width = '0';
    reload();
  });
}

// ── Label update ───────────────────────────────────────────────

// Call this at the top of your _reload() to keep the label and week number in sync.
export function updateWeekNavLabel(idPrefix, monday) {
  const label  = document.getElementById(`${idPrefix}-wk-label`);
  const wknum  = document.getElementById(`${idPrefix}-wk-wknum`);
  if (label)  label.textContent  = formatWeekRange(monday);
  if (wknum)  wknum.textContent  = `Wk ${getISOWeek(monday)}`;
}
