-- 20260708_client_block_internal_tables.sql
--
-- F-01 remediation: RESTRICTIVE client-block policies on all internal tables
-- that must be completely invisible to the 'client' role.
--
-- Background: 20260707_client_read_hardening.sql used ALTER POLICY (by name)
-- which silently no-ops when the policy name doesn't match prod. This migration
-- uses CREATE POLICY ... AS RESTRICTIVE instead -- it AND-s with ALL existing
-- permissive policies so it works regardless of policy naming.
--
-- Tables intentionally accessible to the client role (NOT blocked here):
--   profiles          -- client reads own row (id = auth.uid())
--   clients           -- client reads own company row (clients_select policy)
--   projects          -- client reads own projects (is_my_client_project())
--   cash_transactions -- client reads expense rows for own projects
--   travel_requests   -- client reads travel rows for own projects
--
-- After applying in Studio: re-run f01_prod_client_probe.ps1 to verify all
-- section-2 items pass.

BEGIN;

DO $$
DECLARE
  t   TEXT;
  pol TEXT;
  tbl TEXT[] := ARRAY[
    'time_entries',
    'leave_requests',
    'employees',
    'petty_cash_settings',
    'document_templates',
    'group_members',
    'task_assignments',
    'evaluation_cycles',
    'evaluation_questions',
    'evaluation_responses',
    'login_attempts'
  ];
BEGIN
  FOREACH t IN ARRAY tbl LOOP
    pol := 'client_block_' || t;
    -- Drop first in case a previous attempt left a partial policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, t);
    EXECUTE format(
      $p$
        CREATE POLICY %I ON %I
          AS RESTRICTIVE
          FOR ALL
          TO authenticated
          USING (COALESCE(get_my_role(), '') <> 'client')
      $p$,
      pol, t
    );
    RAISE NOTICE 'Created RESTRICTIVE policy % on %', pol, t;
  END LOOP;
END $$;

COMMIT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
