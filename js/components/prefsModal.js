// components/prefsModal.js — Preferences modal (§4.2)
// General tab is fully read-only. Name changes are requested from the Profile modal.

import { updateProfile }  from '../api/users.js';
import { setFormatPrefs } from '../format.js';

const ROLE_LABELS = { owner:'Owner', admin:'Admin', manager:'Manager', member:'Member', client:'Client' };

function _esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function openPrefsModal(profile) {
  document.getElementById('modal-mount').innerHTML = `
    <div class="modal-backdrop" id="prefs-modal-backdrop">
      <div class="modal modal-lg">
        <div class="modal-header">
          <span class="modal-title">Preferences</span>
          <button class="modal-close" id="prefs-close">✕</button>
        </div>

        <!-- Tabs -->
        <div class="tabs" style="padding:0 var(--sp-5); margin-bottom:0; border-bottom:1px solid var(--border);">
          <button class="tab-btn active" data-tab="general">General</button>
          <button class="tab-btn" data-tab="timesheet">Timesheet</button>
          <button class="tab-btn" data-tab="format">Format</button>
          <button class="tab-btn" data-tab="apps">Apps</button>
        </div>

        <div class="modal-body" style="padding-top:var(--sp-4);">

          <!-- General tab (read-only) -->
          <div class="tab-panel active" id="tab-general">
            <div style="font-size:var(--font-xs);color:var(--text-muted);text-transform:uppercase;
                        letter-spacing:1px;font-weight:600;margin-bottom:var(--sp-3);">Profile info</div>
            <div class="form-group">
              <label>Name</label>
              <div style="color:var(--text-primary);padding:8px 0;">${_esc(profile.name || '—')}</div>
            </div>
            <div class="form-group">
              <label>Job title</label>
              <div style="color:var(--text-primary);padding:8px 0;">${_esc(profile.job_title || '—')}</div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <div style="color:var(--text-primary);padding:8px 0;">${_esc(profile.email || '—')}</div>
            </div>
            <div class="form-group">
              <label>Access role</label>
              <div style="color:var(--text-primary);padding:8px 0;">
                ${ROLE_LABELS[profile.role] || profile.role}
              </div>
            </div>
          </div>

          <!-- Timesheet tab (placeholder) -->
          <div class="tab-panel" id="tab-timesheet">
            <div class="empty-state" style="padding:var(--sp-6) 0;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              <div class="empty-state-title">Timesheet settings</div>
              <div class="empty-state-sub">Coming in a future update</div>
            </div>
          </div>

          <!-- Format tab -->
          <div class="tab-panel" id="tab-format">
            <div style="font-size:var(--font-xs);color:var(--text-muted);text-transform:uppercase;
                        letter-spacing:1px;font-weight:600;margin-bottom:var(--sp-3);">Date and time format</div>
            <div class="form-group">
              <label>Start of the week</label>
              <select id="pref-weekstart">
                <option value="1" ${(profile.week_start||1)===1?'selected':''}>Monday</option>
                <option value="7" ${profile.week_start===7?'selected':''}>Sunday</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date format</label>
              <select id="pref-datefmt">
                <option value="dd/mm/yyyy" ${(profile.date_format||'dd/mm/yyyy')==='dd/mm/yyyy'?'selected':''}>dd/mm/yyyy</option>
                <option value="mm/dd/yyyy" ${profile.date_format==='mm/dd/yyyy'?'selected':''}>mm/dd/yyyy</option>
                <option value="yyyy-mm-dd" ${profile.date_format==='yyyy-mm-dd'?'selected':''}>yyyy-mm-dd</option>
              </select>
            </div>
            <div class="form-group">
              <label>Time format</label>
              <select id="pref-timefmt">
                <option value="24h" ${(profile.time_format||'24h')==='24h'?'selected':''}>24-hour</option>
                <option value="12h" ${profile.time_format==='12h'?'selected':''}>12-hour (AM/PM)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Duration format</label>
              <select id="pref-durfmt">
                <option value="h:mm"    ${(profile.duration_format||'h:mm')==='h:mm'?'selected':''}>h:mm</option>
                <option value="hh:mm"   ${profile.duration_format==='hh:mm'?'selected':''}>hh:mm</option>
                <option value="decimal" ${profile.duration_format==='decimal'?'selected':''}>Decimal (e.g. 1.50)</option>
              </select>
            </div>
          </div>

          <!-- Apps tab (placeholder) -->
          <div class="tab-panel" id="tab-apps">
            <div class="empty-state" style="padding:var(--sp-6) 0;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <div class="empty-state-title">App integrations</div>
              <div class="empty-state-sub">Coming in a future update</div>
            </div>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" id="prefs-cancel">Cancel</button>
          <button class="btn btn-primary" id="prefs-save">OK</button>
        </div>
      </div>
    </div>`;

  const close = () => document.getElementById('modal-mount').innerHTML = '';
  document.getElementById('prefs-close').onclick   = close;
  document.getElementById('prefs-cancel').onclick  = close;
  document.getElementById('prefs-modal-backdrop').onclick = e => {
    if (e.target === e.currentTarget) close();
  };

  // Only the Format tab has editable fields → SAVE; all others → OK (just close).
  const TAB_IS_EDITABLE = { general: false, timesheet: false, format: true, apps: false };

  function _updateSaveBtn(tab) {
    const btn = document.getElementById('prefs-save');
    if (!btn) return;
    if (TAB_IS_EDITABLE[tab]) {
      btn.textContent = 'SAVE';
      btn.onclick = saveHandler;
    } else {
      btn.textContent = 'OK';
      btn.onclick = close;
    }
  }

  // Tab switching
  document.querySelectorAll('#modal-mount .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modal-mount .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#modal-mount .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
      _updateSaveBtn(btn.dataset.tab);
    });
  });

  // ── SAVE handler (Format tab only) ───────────────────────────
  async function saveHandler() {
    try {
      const updates = {
        week_start:      parseInt(document.getElementById('pref-weekstart')?.value || 1),
        date_format:     document.getElementById('pref-datefmt')?.value           || 'dd/mm/yyyy',
        time_format:     document.getElementById('pref-timefmt')?.value           || '24h',
        duration_format: document.getElementById('pref-durfmt')?.value            || 'h:mm',
      };
      await updateProfile(profile.id, updates);
      setFormatPrefs(updates);
      window.showToast?.('Preferences saved', 'success');
      close();
    } catch (err) {
      window.showToast?.(err.message, 'error');
    }
  }

  // Default button state — General tab is active on open (OK, not SAVE)
  _updateSaveBtn('general');
}
