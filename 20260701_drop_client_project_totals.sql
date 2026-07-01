-- 20260701_drop_client_project_totals.sql
--
-- Security Advisor fix: "Security Definer View" ERROR on public.client_project_totals.
--
-- The view was created without security_invoker, so it runs with the view
-- owner's privileges and BYPASSES row-level security on the underlying tables.
-- It aggregates time_entries across ALL clients with no per-tenant filter
-- (GROUP BY p.client_id, ...), so any role holding a SELECT grant on it could
-- read every tenant's project hours -- the F-01 cross-tenant leak class.
--
-- It is safe to DROP: the shipped app never queries this view. Client project
-- summaries come from the get_client_project_summary() RPC (properly scoped to
-- my_client_id()); see js/pages/clientPortal.js and CLIENT-01_PLAN.md. The view
-- is a leftover from the original HE_interactive_timesheet_plan.md design.
--
-- If you would rather KEEP the view for some external/BI consumer, do NOT drop
-- it -- instead recreate it as an invoker-rights view so it respects the
-- caller's RLS:
--   ALTER VIEW public.client_project_totals SET (security_invoker = on);
-- (requires PG 15+, which Supabase is). But note the client role has no direct
-- time_entries RLS, so under security_invoker a client would see zero rows --
-- another reason DROP is the cleaner choice here.

BEGIN;

DROP VIEW IF EXISTS public.client_project_totals;

COMMIT;

NOTIFY pgrst, 'reload schema';
