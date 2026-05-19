# Applying Migrations to Supabase

This file describes how to apply the repository migration SQL files to your Supabase instance.

Prerequisites
- You have access to the Supabase project and can open the SQL Editor.
- If using the `supabase` CLI, you have it installed and authenticated.

Files to apply
- `supabase/migrations/20260519_add_rules_and_regulations.sql`
- `supabase/migrations/20260519_optimize_performance.sql`

Recommended steps (SQL Editor)
1. Open your Supabase project dashboard.
2. Go to `SQL` -> `New query`.
3. Open `supabase/migrations/20260519_add_rules_and_regulations.sql` from this repo, paste its contents into the editor, and run.
4. Repeat for `supabase/migrations/20260519_optimize_performance.sql`.

Verify
- Run:

  SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY indexname;

- Confirm expected indexes are present and no errors were thrown during migration.

Automated (supabase CLI)
- If you prefer the CLI and have it configured:

  supabase db query supabase/migrations/20260519_add_rules_and_regulations.sql
  supabase db query supabase/migrations/20260519_optimize_performance.sql

Notes
- The `optimize_performance` SQL file is written defensively and checks for table/column existence before creating indexes.
- If you previously attempted to run the migration and got errors about missing columns, this guarded version should be safe.
