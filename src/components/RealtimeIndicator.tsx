import type { RealtimeStatus } from '@/lib/api';

interface RealtimeIndicatorProps {
  status: RealtimeStatus;
}

export function RealtimeIndicator({ status }: RealtimeIndicatorProps) {
  const config: Record<RealtimeStatus, { label: string; dot: string; text: string; ring: string }> = {
    connected: {
      label: 'Live Sync Active',
      dot: 'bg-success-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      text: 'text-success-300',
      ring: 'ring-success-500/20 bg-success-500/10',
    },
    connecting: {
      label: 'Connecting...',
      dot: 'bg-warning-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse',
      text: 'text-warning-300',
      ring: 'ring-warning-500/20 bg-warning-500/10',
    },
    disconnected: {
      label: 'Sync Disconnected',
      dot: 'bg-error-400',
      text: 'text-error-300',
      ring: 'ring-error-500/20 bg-error-500/10',
    },
  };

  const c = config[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ring-1 ${c.ring} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} transition-all duration-300`} />
      <span className="hidden sm:inline">{c.label}</span>
      <span className="sm:hidden">{status === 'connected' ? 'Live' : status === 'connecting' ? '...' : 'Off'}</span>
    </div>
  );
}
