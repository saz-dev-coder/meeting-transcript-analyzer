import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';
import type {
  Profile,
  Meeting,
  Task,
  Decision,
  Discussion,
  DiscussionReply,
  Submission,
  TaskStatus,
  DiscussionStatus,
} from './types';

const LOCAL_KEY = 'mta_workspace_v1';

interface LocalWorkspace {
  profiles: Profile[];
  meetings: Meeting[];
  tasks: Task[];
  decisions: Decision[];
  discussions: Discussion[];
  discussion_replies: DiscussionReply[];
  submissions: Submission[];
}

const emptyWorkspace: LocalWorkspace = {
  profiles: [],
  meetings: [],
  tasks: [],
  decisions: [],
  discussions: [],
  discussion_replies: [],
  submissions: [],
};

function readLocal(): LocalWorkspace {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return structuredClone(emptyWorkspace);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(emptyWorkspace), ...parsed };
  } catch {
    return structuredClone(emptyWorkspace);
  }
}

function writeLocal(ws: LocalWorkspace) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ws));
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nowISO(): string {
  return new Date().toISOString();
}

export async function fetchWorkspace(): Promise<LocalWorkspace> {
  if (!isSupabaseConfigured || !supabase) {
    return readLocal();
  }
  const [profiles, meetings, tasks, decisions, discussions, replies, submissions] =
    await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('meetings').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('decisions').select('*').order('created_at', { ascending: false }),
      supabase.from('discussions').select('*').order('updated_at', { ascending: false }),
      supabase.from('discussion_replies').select('*').order('created_at', { ascending: true }),
      supabase.from('submissions').select('*').order('submitted_at', { ascending: false }),
    ]);

  return {
    profiles: (profiles.data as Profile[]) ?? [],
    meetings: (meetings.data as Meeting[]) ?? [],
    tasks: (tasks.data as Task[]) ?? [],
    decisions: (decisions.data as Decision[]) ?? [],
    discussions: (discussions.data as Discussion[]) ?? [],
    discussion_replies: (replies.data as DiscussionReply[]) ?? [],
    submissions: (submissions.data as Submission[]) ?? [],
  };
}

export async function createTask(
  input: Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<Task | null> {
  const task: Task = {
    ...input,
    id: uid(),
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    ws.tasks = [task, ...ws.tasks];
    writeLocal(ws);
    return task;
  }
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      meeting_id: input.meeting_id,
      title: input.title,
      description: input.description,
      category: input.category,
      assignee_id: input.assignee_id,
      assignee_name: input.assignee_name,
      assignee_initials: input.assignee_initials,
      status: input.status,
      deadline: input.deadline,
      confidence: input.confidence,
      proof_of_work: input.proof_of_work,
      deliverable_link: input.deliverable_link,
    })
    .select()
    .single();
  if (error) {
    console.error('createTask error', error.message);
    return null;
  }
  return data as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<Task>
): Promise<Task | null> {
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    const idx = ws.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    ws.tasks[idx] = { ...ws.tasks[idx], ...patch, updated_at: nowISO() };
    writeLocal(ws);
    return ws.tasks[idx];
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...patch, updated_at: nowISO() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateTask error', error.message);
    return null;
  }
  return data as Task;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    ws.tasks = ws.tasks.filter((t) => t.id !== id);
    ws.submissions = ws.submissions.filter((s) => s.task_id !== id);
    writeLocal(ws);
    return true;
  }
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    console.error('deleteTask error', error.message);
    return false;
  }
  return true;
}

export async function createDiscussion(
  input: Pick<Discussion, 'title' | 'content' | 'author_id' | 'author_name'>
): Promise<Discussion | null> {
  const discussion: Discussion = {
    id: uid(),
    title: input.title,
    content: input.content,
    author_id: input.author_id,
    author_name: input.author_name,
    status: 'open',
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    ws.discussions = [discussion, ...ws.discussions];
    writeLocal(ws);
    return discussion;
  }
  const { data, error } = await supabase
    .from('discussions')
    .insert({
      title: input.title,
      content: input.content,
      author_id: input.author_id,
      author_name: input.author_name,
    })
    .select()
    .single();
  if (error) {
    console.error('createDiscussion error', error.message);
    return null;
  }
  return data as Discussion;
}

export async function updateDiscussionStatus(
  id: string,
  status: DiscussionStatus
): Promise<Discussion | null> {
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    const idx = ws.discussions.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    ws.discussions[idx] = { ...ws.discussions[idx], status, updated_at: nowISO() };
    writeLocal(ws);
    return ws.discussions[idx];
  }
  const { data, error } = await supabase
    .from('discussions')
    .update({ status, updated_at: nowISO() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateDiscussionStatus error', error.message);
    return null;
  }
  return data as Discussion;
}

export async function createReply(
  discussionId: string,
  authorId: string | null,
  authorName: string,
  content: string
): Promise<DiscussionReply | null> {
  const reply: DiscussionReply = {
    id: uid(),
    discussion_id: discussionId,
    author_id: authorId,
    author_name: authorName,
    content,
    created_at: nowISO(),
  };
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    ws.discussion_replies = [...ws.discussion_replies, reply];
    const dIdx = ws.discussions.findIndex((d) => d.id === discussionId);
    if (dIdx !== -1) ws.discussions[dIdx].updated_at = nowISO();
    writeLocal(ws);
    return reply;
  }
  const { data, error } = await supabase
    .from('discussion_replies')
    .insert({
      discussion_id: discussionId,
      author_id: authorId,
      author_name: authorName,
      content,
    })
    .select()
    .single();
  if (error) {
    console.error('createReply error', error.message);
    return null;
  }
  return data as DiscussionReply;
}

export async function createSubmission(
  taskId: string,
  submitterId: string | null,
  submitterName: string,
  proofDescription: string,
  projectLink: string | null
): Promise<Submission | null> {
  const submission: Submission = {
    id: uid(),
    task_id: taskId,
    submitter_id: submitterId,
    proof_description: proofDescription,
    project_link: projectLink,
    submitted_at: nowISO(),
  };
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    ws.submissions = [submission, ...ws.submissions];
    writeLocal(ws);
    return submission;
  }
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      task_id: taskId,
      submitter_id: submitterId,
      proof_description: proofDescription,
      project_link: projectLink,
    })
    .select()
    .single();
  if (error) {
    console.error('createSubmission error', error.message);
    return null;
  }
  return data as Submission;
}

export async function createMeeting(
  title: string,
  transcript: string,
  summary: string
): Promise<Meeting | null> {
  const meeting: Meeting = {
    id: uid(),
    title,
    transcript,
    summary,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  if (!isSupabaseConfigured || !supabase) {
    const ws = readLocal();
    ws.meetings = [meeting, ...ws.meetings];
    writeLocal(ws);
    return meeting;
  }
  const { data, error } = await supabase
    .from('meetings')
    .insert({ title, transcript, summary })
    .select()
    .single();
  if (error) {
    console.error('createMeeting error', error.message);
    return null;
  }
  return data as Meeting;
}

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export function subscribeToWorkspace(
  callback: () => void,
  onStatusChange?: (status: RealtimeStatus) => void
): (() => void) | null {
  if (!isSupabaseConfigured || !supabase) return null;
  onStatusChange?.('connecting');
  const channel = supabase
    .channel('workspace-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'discussions' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'discussion_replies' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submissions' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetings' },
      callback
    )
    .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
      if (status === 'SUBSCRIBED') {
        onStatusChange?.('connected');
      } else {
        onStatusChange?.('disconnected');
      }
    });
  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}

export function cycleStatus(status: TaskStatus): TaskStatus {
  if (status === 'todo') return 'in_progress';
  if (status === 'in_progress') return 'done';
  return 'todo';
}

export function statusLabel(status: TaskStatus): string {
  if (status === 'todo') return 'To Do';
  if (status === 'in_progress') return 'In Progress';
  return 'Done';
}

export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const escape = (val: string): string => {
    const needsQuote = val.includes(',') || val.includes('"') || val.includes('\n');
    const cleaned = val.replace(/"/g, '""');
    return needsQuote ? `"${cleaned}"` : cleaned;
  };
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTasksCSV(tasks: Task[]): void {
  const headers = ['Title', 'Category', 'Assignee', 'Status', 'Deadline', 'Confidence', 'Description'];
  const rows = tasks.map((t) => [
    t.title,
    t.category,
    t.assignee_name,
    statusLabel(t.status),
    t.deadline ?? '',
    String(t.confidence),
    t.description,
  ]);
  downloadCSV('tasks_export.csv', headers, rows);
}
