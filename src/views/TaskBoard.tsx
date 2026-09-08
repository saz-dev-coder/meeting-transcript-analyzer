import { useState, useMemo } from 'react';
import {
  KanbanSquare,
  Plus,
  Trash2,
  Calendar,
  MoreVertical,
  X,
  GripVertical,
  Link2,
  FileCheck,
  FileSpreadsheet,
} from 'lucide-react';
import type { Task, Profile, Submission, TaskStatus } from '@/lib/types';
import { createTask, updateTask, deleteTask, cycleStatus, statusLabel, exportTasksCSV } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';

interface TaskBoardProps {
  tasks: Task[];
  profiles: Profile[];
  submissions: Submission[];
  onTasksChanged: () => void;
  onNavigateSubmissions: () => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-t-ink-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-brand-500' },
  { id: 'done', label: 'Done', color: 'border-t-success-500' },
];

const CATEGORIES = ['Engineering', 'Product', 'QA', 'Documentation', 'Design', 'Operations', 'Marketing'];

export function TaskBoard({
  tasks,
  profiles,
  submissions,
  onTasksChanged,
  onNavigateSubmissions,
}: TaskBoardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  const filtered = useMemo(() => {
    if (filterAssignee === 'all') return tasks;
    if (filterAssignee === 'unassigned') return tasks.filter((t) => !t.assignee_id);
    return tasks.filter((t) => t.assignee_id === filterAssignee);
  }, [tasks, filterAssignee]);

  const byStatus = (status: TaskStatus) => filtered.filter((t) => t.status === status);

  async function handleCycleStatus(task: Task) {
    const newStatus = cycleStatus(task.status);
    await updateTask(task.id, { status: newStatus });
    onTasksChanged();
  }

  async function handleDelete(task: Task) {
    await deleteTask(task.id);
    onTasksChanged();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-brand-400" />
            Task Board
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} · Click a card's status badge to advance it
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <button
            onClick={() => exportTasksCSV(tasks)}
            disabled={tasks.length === 0}
            className="inline-flex items-center gap-1.5 bg-ink-800 hover:bg-ink-700 disabled:opacity-50 text-ink-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = byStatus(col.id);
          return (
            <div
              key={col.id}
              className={`bg-ink-900/60 border border-ink-800 rounded-xl border-t-2 ${col.color} flex flex-col min-h-[200px]`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">{col.label}</h2>
                  <span className="text-xs text-ink-500 tabular-nums">{colTasks.length}</span>
                </div>
              </div>
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto scrollbar-thin">
                {colTasks.length === 0 ? (
                  <div className="text-xs text-ink-600 text-center py-8">No tasks</div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      submissionCount={submissions.filter((s) => s.task_id === task.id).length}
                      onCycleStatus={() => handleCycleStatus(task)}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDelete(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <TaskFormModal
          mode="add"
          profiles={profiles}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            onTasksChanged();
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          mode="edit"
          task={editingTask}
          profiles={profiles}
          submissions={submissions.filter((s) => s.task_id === editingTask.id)}
          onClose={() => setEditingTask(null)}
          onSaved={() => {
            setEditingTask(null);
            onTasksChanged();
          }}
          onNavigateSubmissions={onNavigateSubmissions}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  submissionCount: number;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskCard({ task, submissionCount, onCycleStatus, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      className="group bg-ink-800/60 border border-ink-800 rounded-lg p-3 hover:border-ink-700 transition-all cursor-pointer hover:shadow-lg hover:shadow-black/20"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-ink-100 leading-snug">{task.title}</h3>
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded text-ink-500 hover:text-ink-200 hover:bg-ink-700 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 bg-ink-800 border border-ink-700 rounded-lg shadow-xl py-1 w-36">
                <button
                  onClick={() => {
                    onCycleStatus();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
                >
                  Advance to {statusLabel(cycleStatus(task.status))}
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-error-400 hover:bg-error-500/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-ink-500 line-clamp-2 mb-2.5">{task.description}</p>
      )}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink-700/80 text-ink-300">
          {task.category}
        </span>
        {task.deadline && (
          <span className="flex items-center gap-1 text-[10px] text-ink-400 font-mono">
            <Calendar className="w-3 h-3" />
            {formatDate(task.deadline)}
          </span>
        )}
        {submissionCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-success-400">
            <FileCheck className="w-3 h-3" />
            {submissionCount}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-700/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar initials={task.assignee_initials} size="sm" />
          <span className="text-xs text-ink-400 truncate">{task.assignee_name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCycleStatus();
          }}
          className="shrink-0"
        >
          <StatusBadge status={task.status} size="sm" />
        </button>
      </div>
      <div className="mt-2">
        <ConfidenceMeter value={task.confidence} showLabel={false} />
      </div>
    </div>
  );
}

interface TaskFormModalProps {
  mode: 'add' | 'edit';
  task?: Task;
  profiles: Profile[];
  submissions?: Submission[];
  onClose: () => void;
  onSaved: () => void;
  onNavigateSubmissions?: () => void;
}

function TaskFormModal({
  mode,
  task,
  profiles,
  submissions = [],
  onClose,
  onSaved,
  onNavigateSubmissions,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState(task?.category ?? 'Operations');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [deadline, setDeadline] = useState(task?.deadline ?? '');
  const [confidence, setConfidence] = useState(task?.confidence ?? 50);
  const [proofOfWork, setProofOfWork] = useState(task?.proof_of_work ?? '');
  const [deliverableLink, setDeliverableLink] = useState(task?.deliverable_link ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const profile = profiles.find((p) => p.id === assigneeId);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      assignee_id: assigneeId || null,
      assignee_name: profile?.full_name ?? 'Unassigned',
      assignee_initials: profile?.avatar_initials ?? 'UN',
      status,
      deadline: deadline || null,
      confidence: Number(confidence),
      proof_of_work: proofOfWork.trim() || null,
      deliverable_link: deliverableLink.trim() || null,
    };
    if (mode === 'add') {
      await createTask({ ...payload, meeting_id: null });
    } else if (task) {
      await updateTask(task.id, payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={mode === 'add' ? 'Add Task' : 'Edit Task'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="What needs to be done?"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="form-input resize-y"
            placeholder="Add context or details..."
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="form-input">
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="form-input">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </Field>
          <Field label="Deadline">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="form-input"
            />
          </Field>
        </div>
        <Field label={`Confidence: ${confidence}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </Field>
        <Field label="Proof of work (optional)">
          <textarea
            value={proofOfWork}
            onChange={(e) => setProofOfWork(e.target.value)}
            rows={2}
            className="form-input resize-y"
            placeholder="Describe what was done or attach a summary..."
          />
        </Field>
        <Field label="Deliverable link (optional)">
          <input
            type="url"
            value={deliverableLink}
            onChange={(e) => setDeliverableLink(e.target.value)}
            className="form-input"
            placeholder="https://..."
          />
        </Field>

        {mode === 'edit' && (
          <div className="pt-3 border-t border-ink-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-ink-300">Submissions ({submissions.length})</h3>
              {onNavigateSubmissions && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateSubmissions();
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" /> Go to submissions
                </button>
              )}
            </div>
            {submissions.length === 0 ? (
              <p className="text-xs text-ink-600">No submissions yet for this task.</p>
            ) : (
              <div className="space-y-2">
                {submissions.map((s) => (
                  <div key={s.id} className="text-xs bg-ink-800/60 rounded-lg p-2.5">
                    <div className="text-ink-200">{s.proof_description}</div>
                    {s.project_link && (
                      <a
                        href={s.project_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300 mt-1 inline-flex items-center gap-1"
                      >
                        <Link2 className="w-3 h-3" /> View deliverable
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <div className="text-xs text-error-400 bg-error-500/10 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm text-ink-400 hover:text-ink-200 px-4 py-2 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-ink-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          background: #1a1f2e;
          border: 1px solid #3f485b;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #eceef2;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input::placeholder { color: #647189; }
        .form-input:focus {
          outline: none;
          border-color: #3380ff;
          box-shadow: 0 0 0 1px rgba(51, 128, 255, 0.3);
        }
      `}</style>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
