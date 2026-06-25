# CLIENT-01 — Client-Account Management — Implementation Plan

> Drafted 2026-06-16 (R38). Goal: wire the dormant 5th `client` role into login +
> provisioning, with RLS scoping a client to ONLY its own projects / timesheets /
> expenses / documents. Spec: HE_WMS_Specification.md §3/§14; PENDING_TASKS.md → CLIENT-01.
> **Status: ✅ SHIPPED — LIVE in prod 2026-06-17 (R39, commits `c0e7fdc` + `6690861`).** Phases 0–5 complete: migrations `20260706` (id + scoping) + `20260707` (Phase-5 read-hardening) applied in Studio; `provision-client` (NEW, 7th Edge Fn) + `login` (`--no-verify-jwt`, `identifier`-based) deployed; frontend at JS v=98. Phase-5 audit = anon 45/45, client probe 0 FAIL. **Last gate: in-app client smoke before provisioning a real client.** See PENDING_TASKS.md → Round 39.

---

## What already exists (the dormant foundation)

| Piece | Where | State |
|---|---|---|
| `'client'` in role CHECK | `schema.sql:35` | ✅ present |
| `profiles.client_id` FK → clients | `schema.sql:38` | ✅ present ("client role only") |
| `get_my_role()` / `my_client_id()` | `schema.sql:224,245` | ✅ `my_client_id()` returns `profiles.client_id` |
| `isClientRole()` + `ROLE_LEVELS.client=1` | `js/auth.js:108,115` | ✅ present |
| Client **read** RLS on `clients` (own row) | `schema.sql:348-350` | ✅ `get_my_role()='client' AND id=my_client_id()` |
| Client **read** RLS on `projects` (own projects) | `schema.sql:360-363` | ✅ `client_id=my_client_id()` |
| UI gates clients out of employee views | `calendar.js:58-67`, dashboard | ✅ "not available for client accounts" empty-states |

**So a client could already authenticate (if given an account) and read their own `clients` row + `projects` — but nothing downstream, and there's no way to create the account or any page for them to land on.**

> **Spec reconciliation note (`HE_WMS_Specification.md:762`):** the WMS roadmap envisions a different 5-role HR matrix; the *current* app's `client` is an external read-only portal user. CLIENT-01 implements the **current-app** client role, not the future HR matrix.

---

## The gap → 5 build phases (+ audit)

### Phase 0 — Client data model additions (DB migration, part of 20260706)
- **`clients.client_code`** — human-friendly synthetic ID (e.g. `CL-NNN`, generated like employee IDs via a sequence/trigger). Shown in the client's profile + used by admin in the backend; the admin **Clients search box uses `empSelect` style** (hyphen-tolerant), per house convention. Backfill existing clients.
- Multiple client users per company is already supported: many `profiles` rows → one `client_id`. No schema change beyond `client_code`.

### Phase 1 — Client-scoped read access (DB migration 20260706)
The only client read policies today are on `clients` + `projects`. Split by D2:

- **Time entries = SUMMARY ONLY (no raw rows).** Do NOT give clients row-level `time_entries` RLS. Instead a **client-scoped aggregate RPC** `get_client_project_summary()` (SECURITY DEFINER, guards `get_my_role()='client'`, scopes to `client_id=my_client_id()`) returning per-project totals (hours, maybe by period). This removes per-entry leakage AND employee-identity exposure by construction (D4 satisfied for timesheets automatically).
- **Expenses & travel = DETAILED, employee-masked.** New helper `is_my_client_project(p_project_id UUID)` (SECURITY DEFINER, `search_path=public`): `EXISTS (SELECT 1 FROM projects WHERE id=p_project_id AND client_id=my_client_id())`. Add `OR (get_my_role()='client' AND is_my_client_project(<project col>))` **read-only** branches to `travel_requests`, `travel_claims`, `cash_transactions` (+ `generated_documents`/`document_requests` if project-linked). **Employee identity masked** at the API/view layer for client callers (omit the `employee:employees(full_name)` join; show project/amount/date/description only).
- **Hard-excluded from clients:** `time_entries` raw rows, leave, evaluation, employee PII/comp, petty-cash settings, other clients' anything. READ-ONLY everywhere — no client INSERT/UPDATE/DELETE.
- Migration `20260706_client_scoped_rls.sql`; validate on scratch + extend `anon_probe.ps1`; **authenticated-logged-in-as-client probe is mandatory** (anon probe can't exercise a client session).

### Phase 2 — Client login + provisioning
Clients are NOT in `employees`, so the `login` Edge Fn (employee_id → `employees.contact_email`) can't find them.
- **Login = email + password** (D1). Clients sign in with their email via `signInWithPassword`. Either a branch in the `login` Edge Fn (input looks like an email → skip the employee lookup, sign in directly) or route clients through the existing email/password path. Forced-password-change + optional TOTP reuse the existing gate. Keep the M-RATE limiter intact (key on email/IP for client logins).
- **Provisioning (admin, on the Clients page):** "Add client user" — admin enters the client contact's **existing email** + info → system creates `auth.users` (`email_confirm:true`, `force_password_change:true`), then **UPDATEs** the auto-created profile to `role='client'` + `client_id=<this client>` (+ name), and **generates the temp password** (shown once). Multiple users per client allowed. New admin-guarded `provision-client` Edge Fn (reuse the provision scaffold) or extend `provision-users`. Audit-log it.
  - ⚠️ **Verified on scratch (R38):** an `on_auth_user_created` trigger auto-creates a `profiles` row (`role='member'`) the instant the auth user is created. So provisioning **UPDATEs** that row to `client` (NOT a fresh INSERT — that dupes the pkey). The `compute_client_code` trigger fires `BEFORE INSERT OR UPDATE`, so it assigns the `XX-0-NNN-CC` on that UPDATE. The `guard_profile_self_update` trigger does not block it because the Edge Fn runs as service role (`auth.uid()` NULL).

### Phase 3 — Client portal (UI)
Read-only portal `js/pages/clientPortal.js`. Per D2:
- **Project summary** — the client's projects with **summary hours** (from `get_client_project_summary()`), status, totals. No line-item timesheets.
- **Expense & travel detail** — detailed rows for their projects, **employee names masked**.
- **Documents** — their generated documents (if in scope).
- **Export** — export the portal view as **plain text + charts** (e.g. a printable/exportable summary with simple charts; reuse any existing chart/report helper, else a lightweight render). Client's profile shows their `client_code`.

### Phase 4 — Nav + routing gating
- `app.html`: hide all employee/admin nav for `client` role; show only the client view; auth-gate routes a `client` session to the client landing page (today they'd hit "not available" everywhere).
- Confirm every employee page either renders a client-safe empty-state or is unreachable for clients (defense in depth on top of RLS).

### Phase 5 — AUDIT (user-requested, after build) — ✅ DONE 2026-06-17 (R39)
**Result:** ran on scratch — `20260706` scoping verified correct (own-scope exact, 0 cross-client, all writes denied). Found 2 pre-existing blanket-auth leaks the client role reached (**CLIENT-PROF** profiles, **CLIENT-PCS** petty_cash_settings) → fixed in `20260707_client_read_hardening.sql`. Re-probe: anon 45/45, authenticated-client probe **0 FAIL**; member access unchanged. Report: `AUDIT_2026-06-16_CLIENT01_PHASE5.md`.
Full security + correctness pass focused on the new boundary:
- **RLS blast-radius:** confirm a client can read ONLY their own client/projects/timesheets/expenses/docs and NOTHING else (especially no other clients' data, no employee PII/leave/eval/comp). Adversarial: can a client forge `client_id`, read cross-client rows, or write anything?
- Re-run `anon_probe.ps1` (extended) + a new **authenticated-client probe** (log in as a seeded test client, hit every table, expect own-scope-only).
- Login/provisioning review (no enumeration, admin-guarded, audit-logged, no privilege escalation to non-client roles).
- Validate every migration on the scratch project first.

---

## Resolved decisions (2026-06-16)

- **D1 — Login = email + password.** Admin adds the client's existing email + info, then generates the temp password. **Multiple users per client company** (many profiles → one client_id). A **synthetic `client_code` ID** is shown in the client's profile + used by admin in the backend; admin Clients **search box = `empSelect` style** (hyphen-tolerant).
- **D2 — Visible surface:** time entries = **summary only** (aggregate RPC, no line items); expenses & travel = **detailed**; **export to plain text + charts**. Documents in scope if project-linked.
- **D3 — Read-only v1.** Clients never write.
- **D4 — Employee identity masked** on all client-visible rows (and summary-only timesheets mask it by construction).
- **D5 — Multiple contacts per client** (confirmed by D1).
- **D6 — Fully ship before the roster swap** — CLIENT-01 is live + provisionable as part of go-live.

### Residual sub-questions (can default; flag if you disagree)
- Client `client_code` scheme: `CL-NNN` sequential (default) vs. something else.
- Export format: a printable HTML/text summary + simple inline charts (default), vs. CSV/PDF.
- Summary granularity for hours: per-project total (default) vs. also per-period (weekly/monthly) breakdown.

---

## Risk / blast radius
- **Highest risk = RLS leakage.** Clients are external; a missing/over-broad policy leaks another client's or employees' data. Mitigation: read-only branches only, a dedicated `is_my_client_project()` helper, scratch validation, an authenticated-client probe, and the Phase-5 audit before any client account is provisioned in prod.
- Touches the just-hardened login path (M-RATE) — keep the limiter intact.
- Reversible: all changes are additive (new helper, new policy branches, new page, new provision action). Rollback = drop the client branches + don't provision client accounts.
