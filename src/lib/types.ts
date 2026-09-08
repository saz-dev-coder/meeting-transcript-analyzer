export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type DiscussionStatus = 'open' | 'resolved';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_initials: string;
}

export interface Meeting {
  id: string;
  title: string;
  transcript: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  meeting_id: string | null;
  title: string;
  description: string;
  category: string;
  assignee_id: string | null;
  assignee_name: string;
  assignee_initials: string;
  status: TaskStatus;
  deadline: string | null;
  confidence: number;
  proof_of_work: string | null;
  deliverable_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  meeting_id: string;
  content: string;
  created_at: string;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  author_name: string;
  status: DiscussionStatus;
  created_at: string;
  updated_at: string;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Submission {
  id: string;
  task_id: string;
  submitter_id: string | null;
  proof_description: string;
  project_link: string | null;
  submitted_at: string;
}

export interface WorkspaceSnapshot {
  profiles: Profile[];
  meetings: Meeting[];
  tasks: Task[];
  decisions: Decision[];
  discussions: Discussion[];
  discussion_replies: DiscussionReply[];
  submissions: Submission[];
}
