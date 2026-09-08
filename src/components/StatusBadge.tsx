import type { TaskStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

const config: Record<TaskStatus, { label: string; classes: string; dot: string }> = {
  todo: {
    label: 'To Do',
    classes: 'bg-ink-700/60 text-ink-300 ring-ink-600/50',
    dot: 'bg-ink-400',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
    dot: 'bg-brand-400',
  },
  done: {
    label: 'Done',
    classes: 'bg-success-500/15 text-success-300 ring-success-500/30',
    dot: 'bg-success-400',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = config[status];
  const sizeCls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${sizeCls} ${c.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
