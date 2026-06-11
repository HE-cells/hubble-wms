// config.js — Supabase client setup
//
// SETUP INSTRUCTIONS:
//   1. Go to https://app.supabase.com → your project → Settings → API
//   2. Copy "Project URL" → replace YOUR_SUPABASE_URL
//   3. Copy "anon public" key → replace YOUR_SUPABASE_ANON_KEY
//   4. Enable Google OAuth: Authentication → Providers → Google
//      (you'll need a Google Cloud OAuth 2.0 client ID + secret)
//   5. Add redirect URL in Supabase: Authentication → URL Configuration
//      Add: http://localhost:PORT/app.html  (for local dev)
//           https://YOUR_GITHUB_PAGES_URL/app.html  (for production)

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL      = 'https://sjkggguedgtynktymzes.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_ZO6nGx_2VNMO9dK_fN72Cg_LlprwmWQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
