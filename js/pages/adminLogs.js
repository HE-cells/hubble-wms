// js/pages/adminLogs.js — Admin Audit Log viewer (#admin-logs)
// Admin-only. Shows all audit_log rows with filters + pagination.

import { supabase } from '../config.js';
import { esc, attr } from '../format.js';

const PAGE_SIZE = 50;

let _entityFilter = '';
let _actorFilter  = '';
let _dateFrom     = '';
let _dateTo       = '';
let _page         = 0;
let _rows         = [];
let _hasMore      = false;

export async function render(profile) {
  _entityFilter = '';
  _actorFilter  = '';
  _dateFrom     = '';
  _dateTo       = '';
  _page         = 0;

  document.getElementById('topbar-left').innerHTML =
    `<span class="topbar-title">Admin Logs</span>`;

  document.getElementById('content').innerHTML = `
    <div class="filter-bar" style="flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:var(--sp-4);">
      <select id="al-entity-filter" style="min-width:180px;">
        <option value="">All entity types</option>
        <option value="client">Client</option>
        <option value="employee">Employee</option>
        <option value="leave_request">Leave Request</option>
        <option value="flex_swap">Flex Swap</option>
        <option value="expense">Expense</option>
        <option value="travel_claim">Travel Claim</option>
        <option value="trip_request">Trip Request</option>
        <option value="deletion_request">Deletion Request</option>
        <option value="name_change">Name Change</option>
        <option value="job_title_change">Job Title Change</option>
      </select>
      <select id="al-actor-filter" style="min-width:180px;">
        <option value="">All actors</option>
      </select>
      <input type="date" id="al-date-from" style="width:150px;">
      <input type="date" id="al-date-to"   style="width:150px;">
      <button class="btn btn-ghost btn-sm" id="al-apply">Apply</button>
      <button class="btn btn-ghost btn-sm" id="al-reset" style="color:var(--text-muted);">Reset</button>
    </div>
    <div id="al-table-wrap">
      <div class="empty-state"><div class="empty-state-title">Loading…</div></div>
    </div>
    <div id="al-pagination" style="display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:var(--sp-3);">
      <button class="btn btn-ghost btn-sm" id="al-prev" disabled>← Prev</button>
      <span id="al-page-label" style="font-size:var(--font-sm);color:var(--text-muted);">Page 1</span>
      <button class="btn btn-ghost btn-sm" id="al-next" disabled>Next →</button>
    </div>`;

  _wireControls();
  await _loadActors();
  await _load();
}

function _wireControls() {
  document.getElementById('al-apply').addEventListener('click', async () => {
    _entityFilter = document.getElementById('al-entity-filter').value;
    _actorFilter  = document.getElementById('al-actor-filter').value;
    _dateFrom     = document.getElementById('al-date-from').value;
    _dateTo       = document.getElementById('al-date-to').value;
    _page = 0;
    await _load();
  });

  document.getElementById('al-reset').addEventListener('click', async () => {
    _entityFilter = ''; _actorFilter = ''; _dateFrom = ''; _dateTo = ''; _page = 0;
    document.getElementById('al-entity-filter').value = '';
    document.getElementById('al-actor-filter').value  = '';
    document.getElementById('al-date-from').value = '';
    document.getElementById('al-date-to').value   = '';
    await _load();
  });

  document.getElementById('al-prev').addEventListener('click', async () => {
    if (_page > 0) { _page--; await _load(); }
  });
  document.getElementById('al-next').addEventListener('click', async () => {
    if (_hasMore) { _page++; await _load(); }
  });
}

async function _loadActors() {
  try {
    const { data } = await supabase
      .from('audit_log').select('actor_id, actor_name')
      .not('actor_id', 'is', null).order('actor_name');
    if (!data) return;
    const seen = new Set();
    const actors = data.filter(r => { if (seen.has(r.actor_id)) return false; seen.add(r.actor_id); return true; });
    const sel = document.getElementById('al-actor-filter');
    if (!sel) return;
    sel.innerHTML = `<option value="">All actors</option>` +
      actors.map(a => `<option value="${attr(a.actor_id)}">${esc(a.actor_name || a.actor_id)}</option>`).join('');
  } catch (err) {
    console.warn('[adminLogs] could not load actors:', err.message);
  }
}

async function _load() {
  const wrap = document.getElementById('al-table-wrap');
  if (wrap) wrap.innerHTML = `<div class="empty-state"><div class="empty-state-title">Loading…</div></div>`;
  try {
    let q = supabase
      .from('audit_log')
      .select('id, created_at, actor_name, action, entity_type, entity_id, entity_label, changes, note')
      .order('created_at', { ascending: false })
      .range(_page * PAGE_SIZE, (_page + 1) * PAGE_SIZE);  // +1 row to detect hasMore

    if (_entityFilter) q = q.eq('entity_type', _entityFilter);
    if (_actorFilter)  q = q.eq('actor_id',    _actorFilter);
    if (_dateFrom)     q = q.gte('created_at', _dateFrom + 'T00:00:00Z');
    if (_dateTo)       q = q.lte('created_at', _dateTo   + 'T23:59:59Z');

    const { data, error } = await q;
    if (error) throw error;

    _hasMore = (data || []).length > PAGE_SIZE;
    _rows    = (data || []).slice(0, PAGE_SIZE);
    _renderTable();
    _updatePagination();
  } catch (err) {
    const w = document.getElementById('al-table-wrap');
    if (w) w.innerHTML = `<div class="empty-state"><div class="empty-state-title">Failed to load logs</div><div class="empty-state-sub">${esc(err.message)}</div></div>`;
  }
}

function _renderTable() {
  const wrap = document.getElementById('al-table-wrap');
  if (!wrap) return;
  if (_rows.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="margin-top:40px;"><div class="empty-state-title">No log entries found</div><div class="empty-state-sub">Try adjusting the filters or date range</div></div>`;
    return;
  }
  const fmtTs = ts => ts
    ? new Date(ts).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  wrap.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead><tr>
          <th style="white-space:nowrap;">When</th>
          <th>Actor</th>
          <th>Action</th>
          <th>Type</th>
          <th>Entity</th>
          <th>Details</th>
        </tr></thead>
        <tbody>
          ${_rows.map(r => `
            <tr>
              <td style="white-space:nowrap;font-size:var(--font-xs);">${esc(fmtTs(r.created_at))}</td>
              <td style="font-size:var(--font-sm);">${esc(r.actor_name || '—')}</td>
              <td><span class="${_badgeClass(r.action)}" style="white-space:nowrap;">${esc(r.action)}</span></td>
              <td><span class="text-muted" style="font-size:var(--font-xs);">${esc(r.entity_type)}</span></td>
              <td style="max-width:160px;word-break:break-word;">${esc(r.entity_label || r.entity_id || '—')}</td>
              <td style="max-width:280px;font-size:var(--font-xs);color:var(--text-muted);">${_details(r)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function _badgeClass(action) {
  if (!action) return 'badge';
  if (/^(approve|create|restore|reactivate|provision)/.test(action)) return 'badge badge-approved';
  if (/^(reject|delete|deactivate|clear)/.test(action))              return 'badge badge-rejected';
  return 'badge badge-pending';
}

function _details(r) {
  const parts = [];
  if (r.note) parts.push(esc(r.note));
  const c = r.changes;
  if (c) {
    if (c.status)       parts.push(`${esc(String(c.status.old ?? ''))} → ${esc(String(c.status.new ?? ''))}`);
    if (c.reason)       parts.push(`Reason: ${esc(c.reason)}`);
    if (c.fields)       Object.entries(c.fields).forEach(([k, v]) =>
                          parts.push(`${esc(k)}: ${esc(String(v.old ?? ''))} → ${esc(String(v.new ?? ''))}`));
    if (c.email)        parts.push(`Email: ${esc(c.email)}`);
    if (c.employee_id)  parts.push(`ID: ${esc(c.employee_id)}`);
    if (c.client_code)  parts.push(`Code: ${esc(c.client_code)}`);
    if (c.new_name)     parts.push(`New name: ${esc(c.new_name)}`);
    if (c.new_title)    parts.push(`New title: ${esc(c.new_title)}`);
    if (c.name)         parts.push(`Name: ${esc(c.name)}`);
    if (c.currency)     parts.push(`Currency: ${esc(c.currency)}`);
    if (c.settlement_status) parts.push(`Settlement: ${esc(String(c.settlement_status.old ?? ''))} → ${esc(String(c.settlement_status.new ?? ''))}`);
  }
  return parts.join(' · ') || '—';
}

function _updatePagination() {
  const prevBtn   = document.getElementById('al-prev');
  const nextBtn   = document.getElementById('al-next');
  const pageLabel = document.getElementById('al-page-label');
  if (prevBtn)   prevBtn.disabled   = _page === 0;
  if (nextBtn)   nextBtn.disabled   = !_hasMore;
  if (pageLabel) pageLabel.textContent = `Page ${_page + 1}`;
}
