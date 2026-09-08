/*
# Create Meeting Transcript Analyzer workspace

1. New Tables
- `profiles`: fictional team members used for assignment and analytics.
- `meetings`: analyzed transcripts and their summaries.
- `tasks`: extracted work items with ownership, status, dates, and confidence.
- `decisions`: decisions captured from meetings.
- `discussions`: open or resolved team questions.
- `discussion_replies`: nested replies belonging to discussions.
- `submissions`: proof-of-work records linked to tasks.
2. Security
- Row Level Security is enabled on every table.
- This is a single-tenant workspace without sign-in, so anon and authenticated roles receive CRUD access.
3. Notes
- Status fields use database checks for safe values.
- Foreign keys and indexes keep related records consistent and queries responsive.
- Seed records are fictional and exist only to make the first workspace understandable.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'Member',
  avatar_initials text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  transcript text NOT NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Operations',
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assignee_name text NOT NULL DEFAULT 'Unassigned',
  assignee_initials text NOT NULL DEFAULT 'UN',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  deadline date,
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  proof_of_work text,
  deliverable_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Workspace member',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Workspace member',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submitter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  proof_description text NOT NULL,
  project_link text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks(deadline);
CREATE INDEX IF NOT EXISTS discussions_status_idx ON discussions(status);
CREATE INDEX IF NOT EXISTS discussion_replies_discussion_id_idx ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS submissions_task_id_idx ON submissions(task_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_profiles_select" ON profiles;
CREATE POLICY "workspace_profiles_select" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_profiles_insert" ON profiles;
CREATE POLICY "workspace_profiles_insert" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_profiles_update" ON profiles;
CREATE POLICY "workspace_profiles_update" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_profiles_delete" ON profiles;
CREATE POLICY "workspace_profiles_delete" ON profiles FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_meetings_select" ON meetings;
CREATE POLICY "workspace_meetings_select" ON meetings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_meetings_insert" ON meetings;
CREATE POLICY "workspace_meetings_insert" ON meetings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_meetings_update" ON meetings;
CREATE POLICY "workspace_meetings_update" ON meetings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_meetings_delete" ON meetings;
CREATE POLICY "workspace_meetings_delete" ON meetings FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_tasks_select" ON tasks;
CREATE POLICY "workspace_tasks_select" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_tasks_insert" ON tasks;
CREATE POLICY "workspace_tasks_insert" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_tasks_update" ON tasks;
CREATE POLICY "workspace_tasks_update" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_tasks_delete" ON tasks;
CREATE POLICY "workspace_tasks_delete" ON tasks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_decisions_select" ON decisions;
CREATE POLICY "workspace_decisions_select" ON decisions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_decisions_insert" ON decisions;
CREATE POLICY "workspace_decisions_insert" ON decisions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_decisions_update" ON decisions;
CREATE POLICY "workspace_decisions_update" ON decisions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_decisions_delete" ON decisions;
CREATE POLICY "workspace_decisions_delete" ON decisions FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_discussions_select" ON discussions;
CREATE POLICY "workspace_discussions_select" ON discussions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_discussions_insert" ON discussions;
CREATE POLICY "workspace_discussions_insert" ON discussions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_discussions_update" ON discussions;
CREATE POLICY "workspace_discussions_update" ON discussions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_discussions_delete" ON discussions;
CREATE POLICY "workspace_discussions_delete" ON discussions FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_replies_select" ON discussion_replies;
CREATE POLICY "workspace_replies_select" ON discussion_replies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_replies_insert" ON discussion_replies;
CREATE POLICY "workspace_replies_insert" ON discussion_replies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_replies_update" ON discussion_replies;
CREATE POLICY "workspace_replies_update" ON discussion_replies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_replies_delete" ON discussion_replies;
CREATE POLICY "workspace_replies_delete" ON discussion_replies FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_submissions_select" ON submissions;
CREATE POLICY "workspace_submissions_select" ON submissions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_submissions_insert" ON submissions;
CREATE POLICY "workspace_submissions_insert" ON submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_submissions_update" ON submissions;
CREATE POLICY "workspace_submissions_update" ON submissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_submissions_delete" ON submissions;
CREATE POLICY "workspace_submissions_delete" ON submissions FOR DELETE TO anon, authenticated USING (true);

INSERT INTO profiles (full_name, email, role, avatar_initials)
SELECT seed.full_name, seed.email, seed.role, seed.avatar_initials
FROM (VALUES
  ('Alex Morgan', 'alex.morgan@example.com', 'Product lead', 'AM'),
  ('Jordan Lee', 'jordan.lee@example.com', 'Engineering', 'JL'),
  ('Taylor Smith', 'taylor.smith@example.com', 'Operations', 'TS')
) AS seed(full_name, email, role, avatar_initials)
WHERE NOT EXISTS (SELECT 1 FROM profiles);

INSERT INTO meetings (title, transcript, summary)
SELECT 'Q3 Platform Readiness',
'Alex: We need the deployment checklist ready before Friday.\nJordan: I can finalize the API integration notes, but the authentication issue is still returning a 401 in staging.\nTaylor: Let us make Thursday the internal deadline so we have room to review.\nAlex: Agreed. We should also validate the production build and document the rollback path.\nJordan: I will investigate the API issue and post the findings in the discussion thread.\nTaylor: I will prepare the release notes and the handoff checklist.',
'The team aligned on a Thursday internal readiness deadline, with a focus on authentication, release documentation, and production validation.'
WHERE NOT EXISTS (SELECT 1 FROM meetings);

INSERT INTO tasks (meeting_id, title, description, category, assignee_id, assignee_name, assignee_initials, status, deadline, confidence)
SELECT m.id, seed.title, seed.description, seed.category, p.id, p.full_name, p.avatar_initials, seed.status, seed.deadline, seed.confidence
FROM meetings m
CROSS JOIN (VALUES
  ('Investigate API authentication issue', 'Trace the staging 401 response and document the root cause.', 'Engineering', 'Jordan Lee', 'in_progress', '2026-09-16'::date, 97),
  ('Prepare deployment documentation', 'Finalize the release checklist, rollback steps, and handoff notes.', 'Documentation', 'Taylor Smith', 'todo', '2026-09-17'::date, 91),
  ('Validate production build', 'Run the final build validation and attach the results to the release record.', 'QA', 'Alex Morgan', 'todo', '2026-09-18'::date, 84),
  ('Finalize project requirements', 'Review the transcript decisions and capture the agreed readiness criteria.', 'Product', 'Alex Morgan', 'done', '2026-09-12'::date, 88)
) AS seed(title, description, category, assignee, status, deadline, confidence)
JOIN profiles p ON p.full_name = seed.assignee
WHERE m.title = 'Q3 Platform Readiness'
AND NOT EXISTS (SELECT 1 FROM tasks);

INSERT INTO decisions (meeting_id, content)
SELECT m.id, decision.content
FROM meetings m
CROSS JOIN (VALUES
  ('Thursday is the internal deadline for platform readiness.'),
  ('The release must include an authentication root-cause note and rollback path.')
) AS decision(content)
WHERE m.title = 'Q3 Platform Readiness'
AND NOT EXISTS (SELECT 1 FROM decisions);

INSERT INTO discussions (title, content, author_id, author_name, status)
SELECT 'Staging authentication returning 401', 'The authentication endpoint started returning a 401 after the latest deployment. Has anyone seen the same behavior in the release candidate?', p.id, p.full_name, 'open'
FROM profiles p
WHERE p.full_name = 'Jordan Lee'
AND NOT EXISTS (SELECT 1 FROM discussions);

INSERT INTO discussion_replies (discussion_id, author_id, author_name, content)
SELECT d.id, p.id, p.full_name, 'I can reproduce this in staging. I am checking the token audience and environment configuration now.'
FROM discussions d
JOIN profiles p ON p.full_name = 'Alex Morgan'
WHERE d.title = 'Staging authentication returning 401'
AND NOT EXISTS (SELECT 1 FROM discussion_replies);
