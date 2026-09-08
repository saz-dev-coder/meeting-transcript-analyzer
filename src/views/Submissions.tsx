import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Plus,
  Link2,
  FileCheck,
  Loader2,
  Inbox,
} from 'lucide-react';
import type { Task, Submission, Profile, TaskStatus } from '@/lib/types';
import { createSubmission, updateTask } from '@/lib/api';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';

interface SubmissionsProps {
  tasks: Task[];
  submissions: Submission[];
  profiles: Profile[];
  onChanged: () => void;
}

export function Submissions({ tasks, submissions, profiles, onChanged }: SubmissionsProps) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [filterTaskId, setFilterTaskId] = useState<string>('all');

  const taskSubmissions = useMemo(() => {
    const filtered = filterTaskId === 'all' ? submissions : submissions.filter((s) => s.task_id === filterTaskId);
    return [...filtered].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  }, [submissions, filterTaskId]);

  const pendingReview = tasks.filter(
    (t) => t.status !== 'done' && submissions.some((s) => s.task_id === t.id)
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-success-400" />
            Submissions
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} ·{' '}
            {pendingReview.length} pending review
          </p>
        </div>
        <button
          onClick={() => setShowSubmit(true)}
          className="inline-flex items-center gap-1.5 bg-success-600 hover:bg-success-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Submit Work
        </button>
      </div>

      {/* Pending review banner */}
      {pendingReview.length > 0 && (
        <div className="bg-warning-500/10 border border-warning-500/20 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-warning-300 mb-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Pending Review ({pendingReview.length})
          </h2>
          <div className="space-y-2">
            {pendingReview.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-ink-900/40">
                <Avatar initials={task.assignee_initials} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-100 truncate">{task.title}</div>
                  <div className="text-xs text-ink-500">{task.assignee_name}</div>
                </div>
                <StatusBadge status={task.status} size="sm" />
                <ApproveButton
                  task={task}
                  onApprove={async () => {
                    await updateTask(task.id, { status: 'done' as TaskStatus });
                    onChanged();
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-ink-400">Filter by task:</span>
        <select
          value={filterTaskId}
          onChange={(e) => setFilterTaskId(e.target.value)}
          className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-sm text-ink-200 focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="all">All tasks</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      {/* Submissions list */}
      {taskSubmissions.length === 0 ? (
        <div className="bg-ink-900/50 border border-dashed border-ink-700 rounded-xl p-12 text-center">
          <Inbox className="w-8 h-8 text-ink-600 mx-auto mb-3" />
          <p className="text-sm text-ink-400 mb-1">No submissions yet.</p>
          <p className="text-xs text-ink-600">Submit proof of work for a task to get it reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taskSubmissions.map((sub) => {
            const task = tasks.find((t) => t.id === sub.task_id);
            const submitter = profiles.find((p) => p.id === sub.submitter_id);
            return (
              <div
                key={sub.id}
                className="bg-ink-900 border border-ink-800 rounded-xl p-4 hover:border-ink-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    initials={submitter?.avatar_initials ?? task?.assignee_initials ?? 'UN'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-ink-100">
                        {submitter?.full_name ?? 'Workspace member'}
                      </span>
                      <span className="text-xs text-ink-500">submitted for</span>
                      <span className="text-sm text-brand-300 font-medium truncate">
                        {task?.title ?? 'Unknown task'}
                      </span>
                    </div>
                    <p className="text-sm text-ink-300 leading-relaxed mb-2">{sub.proof_description}</p>
                    <div className="flex items-center gap-3">
                      {sub.project_link && (
                        <a
                          href={sub.project_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          View deliverable
                        </a>
                      )}
                      <span className="text-xs text-ink-600">{formatRelative(sub.submitted_at)}</span>
                      {task && <StatusBadge status={task.status} size="sm" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSubmit && (
        <SubmitModal
          tasks={tasks}
          profiles={profiles}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => {
            setShowSubmit(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function ApproveButton({ task, onApprove }: { task: Task; onApprove: () => Promise<void> }) {
  const [approving, setApproving] = useState(false);
  return (
    <button
      onClick={async () => {
        setApproving(true);
        await onApprove();
        setApproving(false);
      }}
      disabled={approving}
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-success-500/15 text-success-300 hover:bg-success-500/25 transition-colors flex items-center gap-1.5 shrink-0"
    >
      {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      Approve
    </button>
  );
}

function SubmitModal({
  tasks,
  profiles,
  onClose,
  onSubmitted,
}: {
  tasks: Task[];
  profiles: Profile[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? '');
  const [submitterId, setSubmitterId] = useState(profiles[0]?.id ?? '');
  const [proof, setProof] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!taskId) {
      setError('Select a task to submit for.');
      return;
    }
    if (!proof.trim()) {
      setError('Describe what was done.');
      return;
    }
    setSaving(true);
    setError(null);
    const submitter = profiles.find((p) => p.id === submitterId);
    await createSubmission(taskId, submitterId || null, submitter?.full_name ?? 'Workspace member', proof.trim(), link.trim() || null);
    setSaving(false);
    onSubmitted();
  }

  return (
    <Modal open={true} onClose={onClose} title="Submit Work" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Task</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brand-500 transition-colors"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Submitter</label>
          <select
            value={submitterId}
            onChange={(e) => setSubmitterId(e.target.value)}
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brand-500 transition-colors"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Proof description</label>
          <textarea
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            rows={4}
            placeholder="Describe what was accomplished, how it was tested, and any results..."
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Project / deliverable link (optional)</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        {error && <div className="text-xs text-error-400 bg-error-500/10 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm text-ink-400 hover:text-ink-200 px-4 py-2 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-success-600 hover:bg-success-500 disabled:bg-ink-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Submitting...' : 'Submit Work'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
