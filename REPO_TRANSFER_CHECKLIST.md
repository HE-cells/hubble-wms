# Repo Transfer Runbook — `hubble-wms` + `hubble-wms-backups` → new GitHub account

> **Scope:** transferring BOTH repos — `HE-cells/hubble-wms` (the app, served by GitHub Pages)
> and `HE-cells/hubble-wms-backups` (private; receives the nightly encrypted DB dumps) —
> to a new GitHub account. **Supabase stays the same** (`sjkggguedgtynktymzes.supabase.co`),
> and the repo names stay the same; only the account changes.
>
> Replace every `<new-account>` below with the actual new account name before you start.
> Steps are numbered in the order to execute them — follow top to bottom.

## Key GitHub transfer facts (background)

- Git remote URLs **redirect** automatically after a transfer; issues/PRs/stars/watchers,
  webhooks, deploy keys, and **repo-level Actions secrets & variables transfer** with the repo.
- **GitHub Pages URLs do NOT redirect** — `https://he-cells.github.io/hubble-wms/` stops
  working the moment the transfer completes; the site re-serves at
  `https://<new-account>.github.io/hubble-wms/`.
- Scheduled Actions workflows can silently stall after a transfer; a commit to the default
  branch resyncs them.
- GitHub **App installations do not transfer** (e.g. the Claude Code GitHub integration) —
  reinstall on the new account.
- A **personal account** can always receive a repo transfer. An **organization** target
  needs the transferring user to have repo-creation rights in that org, and depending on
  org settings may require an owner to approve the incoming transfer before it completes.

---

## 0. Pre-transfer prep (do this before touching anything)

- [ ] Confirm the new GitHub account exists and you can sign in to it.
- [ ] Record current settings as a rollback reference (copy/paste the exact strings
      somewhere safe, or screenshot):
  - Supabase → Authentication → URL Configuration → current `Site URL` and full
    `Redirect URLs` list.
  - `hubble-wms` → Settings → Pages → current source (should be `main` / `/ (root)`).
  - `hubble-wms-backups` → Settings → Secrets and variables → Actions → confirm
    `SUPABASE_DB_URL` (secret) and `AGE_PUBLIC_KEY` (variable) are listed (names only —
    values are never visible again once set).
- [ ] On your local machine: `cd` into the `hubble-wms` clone and run `git status` —
      confirm it's clean (no uncommitted work) before the remote URL changes under you.
      Do the same for any local `hubble-wms-backups` clone.
- [ ] Pick a low-traffic window — Pages will be briefly unreachable at the old URL and
      not yet reachable at the new one during the transfer itself.

## 1. Transfer `hubble-wms`

1. Go to `https://github.com/HE-cells/hubble-wms/settings` (must be signed in as an
   owner/admin of `HE-cells`).
2. Scroll to the bottom → **Danger Zone** → click **Transfer ownership**.
3. In the confirmation dialog, type the repository name (`hubble-wms`) exactly to confirm.
4. Enter the new owner — the new account's username (or org name).
5. Click **I understand, transfer this repository**.
6. If the new owner is a **personal account you also control**, the transfer completes
   immediately. If it's an **organization**, an invite/confirmation may be required from
   the org side before it finalizes — complete that step now if prompted.
7. Confirm: reload `https://github.com/<new-account>/hubble-wms` — the repo should now
   show the new owner in the URL and breadcrumb.

## 2. Fix Supabase Auth URLs (do this immediately after step 1 — this is what breaks login if delayed)

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) → select the
   `sjkggguedgtynktymzes` project → **Authentication** (left sidebar) → **URL
   Configuration**.
2. **Site URL** field: change
   `https://he-cells.github.io/hubble-wms` → `https://<new-account>.github.io/hubble-wms`
   (no trailing slash, matching the existing format).
3. **Redirect URLs** list:
   - Remove `https://he-cells.github.io/hubble-wms/app.html`.
   - Add `https://<new-account>.github.io/hubble-wms/app.html`.
   - **Leave `http://localhost:3030/app.html` in place** — local dev still needs it.
4. Click **Save**. This takes effect immediately; there is nothing to redeploy on
   Supabase's side.
5. Why this matters now: if a user tries Google sign-in before this is saved, Supabase
   will reject the `redirectTo` (it's not in the allow-list yet) and silently fall back
   to the `Site URL` — which, until this step, is still the old dead Pages URL. This
   exact failure mode happened once before during the original go-live (see
   `PENDING_TASKS.md` Round 24, item R24-03) — it is not hypothetical.

## 3. Verify GitHub Pages came back up on the new account

1. `https://github.com/<new-account>/hubble-wms/settings/pages` — confirm **Source** is
   still `Deploy from a branch` → `main` → `/ (root)`. Repo transfers normally preserve
   Pages settings, but verify rather than assume.
2. If it shows "Your site is not published" or similar, push any commit to `main`
   (a trivial one is fine, or just proceed to step 5's cache-bump commit) to trigger a
   fresh Pages build.
3. Hard-refresh `https://<new-account>.github.io/hubble-wms/` (Ctrl/Cmd+Shift+R) in a
   private/incognito window (avoids any stale service-worker-less browser cache).
4. Open DevTools → **Console**: confirm **zero CSP violations** and **zero 404s** on any
   `.js`/`.css` asset. (This also closes the previously-pending "post-push CSP
   spot-check" noted in `PENDING_TASKS.md` Round 50 — this container never had network
   access to verify it live.)
5. Open DevTools → **Network**, reload, confirm `app.html`/`index.html` and all
   `js/*.js` requests return `200`, not `404`.

## 4. Verify Google Sign-In still works

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services**
   → **Credentials** → open the OAuth 2.0 Client ID used by this Supabase project's
   Google provider (check Supabase → Authentication → Providers → Google for the Client
   ID to match it by).
2. Under **Authorized JavaScript origins**: if `https://he-cells.github.io` is listed,
   **add** `https://<new-account>.github.io` (add, don't replace yet — keep the old one
   until you're confident the old account/repo won't be reused, in case you need to roll
   back quickly).
3. **Authorized redirect URIs** should already be Supabase's own callback
   (`https://sjkggguedgtynktymzes.supabase.co/auth/v1/callback`) — this does **not**
   change, since it never referenced GitHub Pages. Leave it as-is.
4. Save.
5. Live test: open `https://<new-account>.github.io/hubble-wms/`, click Google sign-in,
   complete the flow, confirm you land on `app.html` logged in (not bounced back to
   `index.html` with an error, and not redirected to `localhost:3030`).

## 5. Transfer `hubble-wms-backups`

1. Same procedure as step 1: `https://github.com/HE-cells/hubble-wms-backups/settings` →
   **Danger Zone** → **Transfer ownership** → confirm repo name → enter new owner →
   confirm.
2. Do this in the same session as step 1 where practical — the backups repo doesn't
   depend on the app repo's Pages URL, but keeping both transfers close together avoids
   confusion about which account currently owns what.

## 6. Verify the nightly backup cron survived the transfer

1. `https://github.com/<new-account>/hubble-wms-backups/actions` → find the
   `nightly-db-backup` workflow in the left sidebar.
2. Confirm it is **not** shown as "This scheduled workflow is disabled because there
   hasn't been activity in this repository for at least 60 days" — transfers can
   occasionally cause a scheduled workflow to appear stalled even on an active repo.
3. If the workflow has a `workflow_dispatch` trigger, click **Run workflow** now to force
   an immediate test run rather than waiting for 01:00 ICT. Watch it complete green.
4. If it does **not** have `workflow_dispatch`, push a trivial commit to the repo's
   default branch to resync the schedule, then check back after the next scheduled
   01:00 ICT window that a new `daily/wms_YYYYMMDD.sql.gz.age` file was committed by the
   bot account.
5. `https://github.com/<new-account>/hubble-wms-backups/settings/secrets/actions` —
   confirm `SUPABASE_DB_URL` (secret) and `AGE_PUBLIC_KEY` (variable) both still appear
   in the list (existence only — a successful workflow run in step 3/4 is the real proof
   the values are intact and correct, since secret values are never re-displayable).
6. Note: the backup connects **directly to Supabase** via the pooler connection string
   in `SUPABASE_DB_URL` — the GitHub account change has no bearing on that connection.

## 7. Re-arm failure notifications on the backups repo

1. On `https://github.com/<new-account>/hubble-wms-backups`, click **Watch** (top of the
   repo page) → **Custom** → check **Actions** (or choose **All Activity**) → **Apply**.
2. This must be re-done from the new account — a Watch setting on the old account does
   not carry over meaningfully once you're operating from the new one. Without this, a
   failed nightly run fails silently.

## 8. Local machine + CLI tooling

Run these for every local clone of either repo:

```bash
git remote set-url origin https://github.com/<new-account>/hubble-wms.git
git remote -v   # confirm it now shows <new-account>
```

```bash
git remote set-url origin https://github.com/<new-account>/hubble-wms-backups.git
git remote -v
```

If you use the `gh` CLI:

```bash
gh auth login          # re-auth as the new account if it's a different login
gh repo set-default <new-account>/hubble-wms
```

Old remote URLs will redirect for a while after the transfer, but don't rely on that —
if the old account ever creates a new repo named `hubble-wms`, the redirect breaks
silently and pushes would start going to the wrong place.

## 9. Reinstall GitHub Apps

1. On the **old** account, visit `https://github.com/settings/installations` and note
   every app installed against `hubble-wms` / `hubble-wms-backups` (e.g. the Claude Code
   GitHub integration, any CI status-check apps). App installations do **not** follow a
   repo transfer.
2. On the **new** account, install each of those apps and grant it access to the
   transferred repos.

## 10. Communicate the URL change

- Old Pages bookmarks (`https://he-cells.github.io/hubble-wms/`) will 404 permanently —
  there is no automatic redirect for GitHub Pages. Tell users the new URL before or
  immediately after the cutover.
- Optional: if the old `HE-cells` account will keep existing, you can create a new,
  empty `hubble-wms` repo there with just a static `index.html` that redirects to
  `https://<new-account>.github.io/hubble-wms/`, to soften the transition. Skip this if
  the old account is being retired.

## 11. Explicitly NOT needed (already verified safe in code — don't waste time re-checking)

- `js/config.js` (Supabase URL / anon key) — unchanged.
- `js/auth.js` OAuth `redirectTo` — dynamic (`new URL('app.html', window.location.href)`),
  auto-adapts to the new origin, no edit needed.
- CSP meta tags (`index.html` / `app.html`) — only Supabase/jsdelivr/gstatic origins;
  `'self'` covers whatever the Pages origin is.
- All asset/module paths in the app — relative; hash-route nav; no root-absolute or
  repo-name-prefixed paths.
- Probe scripts (`f01_prod_client_probe.sh`, `.ps1`, `supabase/probes/*.ps1`) —
  Supabase-only, no app/Pages URL referenced.
- CI workflow (`.github/workflows/ci.yml`) — localhost-only, no account references.
- No CNAME, no service worker, no PWA manifest, no `emailRedirectTo` / password-reset
  redirects anywhere in the app.

## 12. Troubleshooting / rollback

| Symptom | Likely cause | Fix |
|---|---|---|
| Google login succeeds at Google but lands back on a broken/blank page, or redirects to `localhost:3030` | Step 2 (Supabase Redirect URLs) wasn't saved, or was done before Pages was live at the new URL | Re-check Supabase → Authentication → URL Configuration; if the new Pages URL genuinely isn't serving yet, temporarily revert `Site URL` to a URL that IS live (even `localhost` for a quick local test) rather than leaving it pointed at a dead URL |
| `nightly-db-backup` shows "disabled due to inactivity" | Transfers can reset GitHub's internal activity clock for schedule purposes | Push any commit to the repo's default branch; scheduled runs resume on the next window |
| Browser console shows CSP violations after the transfer | Old cached `app.html`/`index.html` served from before a needed fix, or a genuinely new blocked origin | Hard-refresh in a private window first (rules out cache); if violations persist, check the CSP `connect-src`/`script-src` list in `app.html`/`index.html` against what's actually being requested |
| `f01_prod_client_probe.sh` starts failing after the transfer | Should be impossible — the probe only talks to Supabase, which didn't move | Re-run against `sjkggguedgtynktymzes.supabase.co` directly to confirm it's a probe-environment issue, not a real regression; nothing about a GitHub transfer can affect Supabase RLS |
| Nightly backup workflow runs but produces no new commit / errors | Not transfer-related in the typical case — check `SUPABASE_DB_URL` secret still resolves (i.e. wasn't accidentally edited during the checklist walk-through) | Re-run the workflow with debug logging; verify the secret value if you have it recorded outside the repo |

## 13. Final verification checklist

- [ ] `https://<new-account>.github.io/hubble-wms/` loads, 0 CSP violations, 0 404s on assets.
- [ ] Google sign-in round-trips all the way to a logged-in `app.html` on the new URL.
- [ ] `f01_prod_client_probe.sh` (or `.ps1`) — all checks PASS (proves Supabase/RLS untouched).
- [ ] `hubble-wms-backups` Actions tab shows `nightly-db-backup` enabled and green on its
      most recent run, with a fresh `daily/wms_YYYYMMDD.sql.gz.age` committed.
- [ ] Watch is re-armed on the backups repo from the new account.
- [ ] Add-Member modal (Team page, admin) → the displayed "App link" reads
      `https://<new-account>.github.io/hubble-wms/index.html` (the `/hubble-wms/` subpath
      fix shipped with cache `v=115` — confirms this fix is live, not just present in source).
- [ ] Local git remotes and `gh` default repo point at `<new-account>`.
- [ ] GitHub Apps (Claude Code integration, etc.) reinstalled on the new account.
- [ ] Users notified of the URL change.
