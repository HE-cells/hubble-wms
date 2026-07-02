# Repo Transfer Checklist — `hubble-wms` + `hubble-wms-backups` → new GitHub account

> **Scope:** transferring BOTH repos — `HE-cells/hubble-wms` (the app, served by GitHub Pages)
> and `HE-cells/hubble-wms-backups` (private; receives the nightly encrypted DB dumps) —
> to a new GitHub account. **Supabase stays the same** (`sjkggguedgtynktymzes.supabase.co`),
> and the repo names stay the same; only the account changes.
>
> Replace every `<new-account>` below with the actual new account name.

## Key GitHub transfer facts

- Git remote URLs **redirect** automatically after a transfer; issues/PRs/stars/watchers,
  webhooks, deploy keys, and **repo-level Actions secrets & variables transfer** with the repo.
- **GitHub Pages URLs do NOT redirect** — `https://he-cells.github.io/hubble-wms/` stops
  working the moment the transfer completes; the site re-serves at
  `https://<new-account>.github.io/hubble-wms/`.
- Scheduled Actions workflows can silently stall after a transfer; a commit to the default
  branch resyncs them.
- GitHub **App installations do not transfer** (e.g. the Claude Code GitHub integration) —
  reinstall on the new account.

---

## A. Required — outside the repo (this is what breaks login if missed)

1. **Supabase Dashboard → Authentication → URL Configuration** (immediately after transfer):
   - Site URL: `https://he-cells.github.io/hubble-wms` → `https://<new-account>.github.io/hubble-wms`
   - Redirect URLs: replace `https://he-cells.github.io/hubble-wms/app.html` with the
     new-account equivalent; **keep** `http://localhost:3030/app.html` for local dev.
   - If missed, Google login falls back to the dev Site URL — the exact failure seen in
     R24-03 (PENDING_TASKS.md).
2. **Google Cloud OAuth client — verify only.** The OAuth redirect URI is Supabase's callback
   (`…supabase.co/auth/v1/callback`), which doesn't change. But check Authorized JavaScript
   origins: if `https://he-cells.github.io` is listed, add/replace the new origin.
   (R24-03 notes Google origins were not the login blocker — likely nothing to do; verify.)
3. **Supabase Edge Functions (7 deployed; source not in this repo):** check whether any has a
   CORS allowed-origins list or an `APP_URL`-style env/secret pinned to the old Pages origin;
   if so, add the new origin. (The client CSP `connect-src` already allows
   `*.functions.supabase.co` — unchanged.)
4. **GitHub Pages on the transferred app repo:** Settings → Pages — confirm still enabled
   (main / root). Push any commit to force a rebuild at the new URL, then verify assets load.
5. **`hubble-wms-backups` repo (nightly DB backup pipeline):**
   - Transfer it in the same operation window as the app repo.
   - Repo secret `SUPABASE_DB_URL` and repo variable `AGE_PUBLIC_KEY` are repo-level →
     they transfer with it. The workflow commits via the default `GITHUB_TOKEN`
     (`permissions: contents: write`) → no PAT to rotate.
   - After transfer: Actions tab → confirm the `nightly-db-backup` workflow is **enabled**
     (transfers can stall cron schedules); trigger a manual run if it has `workflow_dispatch`,
     otherwise push a trivial commit to resync, then check the next 01:00 ICT run committed a
     fresh `daily/wms_YYYYMMDD.sql.gz.age`.
   - The dump connects **directly to Supabase** (session-pooler string in the secret) —
     the account change doesn't touch it.
   - Re-do the still-pending "Watch → All Activity" (R26-04 #3) **from the new account** so
     failed nightly runs email the owner.
   - The `age` private key is offline with the owner — unaffected.
6. **New-account plumbing:**
   - Local machine: `git remote set-url origin https://github.com/<new-account>/hubble-wms.git`
     (old URLs redirect, but the redirect breaks if the old account ever recreates a repo with
     the same name — update explicitly). Same for the backups repo clone if one exists.
   - Re-auth `gh` CLI as the new account.
   - Reinstall the Claude Code GitHub App (and any other GitHub Apps) on the new account and
     re-grant repo access — app installations do not transfer.
   - New account must support private repos + Actions minutes for the backups repo
     (free tier is fine: private repos unlimited; nightly ~1-min runs are well under
     2,000 min/month).
7. **Tell users the URL changed.** Old Pages bookmarks will 404 with no redirect.
   (Optional: leave a tiny redirect page in a new `hubble-wms` repo on the old account —
   only if the old account survives.)

## B. Explicitly NOT needed (verified in code)

- `js/config.js` (Supabase URL / anon key) — unchanged.
- `js/auth.js` OAuth `redirectTo` — dynamic (`new URL('app.html', window.location.href)`),
  auto-adapts to the new origin.
- CSP meta tags (`index.html` / `app.html`) — only Supabase/jsdelivr/gstatic origins;
  `'self'` covers whatever the Pages origin is.
- All asset/module paths — relative; hash-route nav; no root-absolute or
  repo-name-prefixed paths.
- Probe scripts (`f01_prod_client_probe.sh` / `.ps1`, `supabase/probes/*.ps1`) — Supabase-only.
- CI workflow (`.github/workflows/ci.yml`) — localhost-only, no account references.
- No CNAME, no service worker, no PWA manifest, no `emailRedirectTo` / password-reset
  redirects.

## C. Verification (after the transfer + config changes)

1. Open `https://<new-account>.github.io/hubble-wms/` — assets load, **0 CSP violations in
   the console** (this also closes the pending R50 live-check).
2. Google login round-trips to `app.html` on the new URL (proves the Supabase
   redirect-allowlist edit).
3. Run `f01_prod_client_probe.sh` — still all-PASS (proves Supabase untouched).
4. Backups repo: next nightly run (01:00 ICT) commits a fresh `daily/*.sql.gz.age`;
   workflow shows enabled/green.
5. Add-Member modal: the "App link" reads
   `https://<new-account>.github.io/hubble-wms/index.html` (subpath fix shipped with v=115).
