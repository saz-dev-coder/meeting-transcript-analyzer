import { TrendingUp, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import type { Task, Discussion, Submission, Profile, Meeting } from '@/lib/types';
import type { ViewId } from '@/components/Sidebar';
import { Avatar } from '@/components/Avatar';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { StatusBadge } from '@/components/StatusBadge';

interface DashboardProps {
  tasks: Task[];
  discussions: Discussion[];
  submissions: Submission[];
  profiles: Profile[];
  meetings: Meeting[];
  onNavigate: (view: ViewId) => void;
}

export function Dashboard({
  tasks,
  discussions,
  submissions,
  profiles,
  meetings,
  onNavigate,
}: DashboardProps) {
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const openDiscussions = discussions.filter((d) => d.status === 'open').length;
  const avgConfidence = tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.confidence, 0) / tasks.length)
    : 0;

  const upcoming = [...tasks]
    .filter((t) => t.status !== 'done' && t.deadline)
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
    .slice(0, 5);

  const recentTasks = [...tasks]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  const stats = [
    {
      label: 'Total Tasks',
      value: tasks.length,
      icon: CheckCircle2,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Clock,
      color: 'text-warning-400',
      bg: 'bg-warning-500/10',
    },
    {
      label: 'Completed',
      value: done,
      icon: CheckCircle2,
      color: 'text-success-400',
      bg: 'bg-success-500/10',
    },
    {
      label: 'Open Discussions',
      value: openDiscussions,
      icon: AlertCircle,
      color: 'text-accent-400',
      bg: 'bg-accent-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Overview</h1>
        <p className="text-sm text-ink-400 mt-1">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} analyzed ·{' '}
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} tracked ·{' '}
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-ink-900 border border-ink-800 rounded-xl p-4 hover:border-ink-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-xs text-ink-400 mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming deadlines */}
        <div className="lg:col-span-2 bg-ink-900 border border-ink-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Upcoming Deadlines</h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-ink-800/40 hover:bg-ink-800/70 transition-colors"
                >
                  <Avatar initials={task.assignee_initials} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-100 truncate">{task.title}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {task.assignee_name} · {task.category}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={task.status} size="sm" />
                    {task.deadline && (
                      <span className="text-[11px] text-ink-400 font-mono">
                        {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confidence summary */}
        <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Extraction Confidence</h2>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-white tabular-nums">{avgConfidence}%</div>
            <div className="text-xs text-ink-400 mt-1">Average across all tasks</div>
          </div>
          <div className="space-y-2.5 mt-4">
            <ConfidenceRow label="High (80+)" count={tasks.filter((t) => t.confidence >= 80).length} total={tasks.length} color="bg-success-400" />
            <ConfidenceRow label="Medium (60-79)" count={tasks.filter((t) => t.confidence >= 60 && t.confidence < 80).length} total={tasks.length} color="bg-brand-400" />
            <ConfidenceRow label="Low (<60)" count={tasks.filter((t) => t.confidence < 60).length} total={tasks.length} color="bg-warning-400" />
          </div>
        </div>
      </div>

      {/* Recent activity + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-ink-900 border border-ink-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              View board <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <Avatar initials={task.assignee_initials} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-100 truncate">{task.title}</div>
                    <div className="text-xs text-ink-500">{task.assignee_name}</div>
                  </div>
                  <StatusBadge status={task.status} size="sm" />
                  <div className="w-16 shrink-0">
                    <ConfidenceMeter value={task.confidence} showLabel={false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Team</h2>
          {profiles.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">No team members.</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => {
                const memberTasks = tasks.filter((t) => t.assignee_id === p.id);
                const memberDone = memberTasks.filter((t) => t.status === 'done').length;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar initials={p.avatar_initials} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-100 truncate">{p.full_name}</div>
                      <div className="text-xs text-ink-500">{p.role}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-white tabular-nums">
                        {memberDone}/{memberTasks.length}
                      </div>
                      <div className="text-[10px] text-ink-500">done</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfidenceRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink-400">{label}</span>
        <span className="text-ink-300 tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
