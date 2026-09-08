/*
# Enable realtime for workspace records

1. Changes
- Adds `tasks`, `discussions`, `discussion_replies`, and `submissions` to Supabase Realtime.
2. Security
- Realtime continues to respect the tables' existing row-level security policies.
3. Notes
- The statements are conditional so the migration can be safely re-run.
*/

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['tasks', 'discussions', 'discussion_replies', 'submissions'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
