interface ConfidenceMeterProps {
  value: number;
  showLabel?: boolean;
}

export function ConfidenceMeter({ value, showLabel = true }: ConfidenceMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 80 ? 'bg-success-400' : pct >= 60 ? 'bg-brand-400' : pct >= 40 ? 'bg-warning-400' : 'bg-error-400';
  const textColor =
    pct >= 80 ? 'text-success-300' : pct >= 60 ? 'text-brand-300' : pct >= 40 ? 'text-warning-300' : 'text-error-300';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-ink-700/60 overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono font-medium tabular-nums ${textColor}`}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
