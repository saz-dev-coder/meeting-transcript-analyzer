interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

const colorPalette = [
  'bg-brand-500/20 text-brand-300 ring-brand-500/30',
  'bg-accent-500/20 text-accent-300 ring-accent-500/30',
  'bg-success-500/20 text-success-300 ring-success-500/30',
  'bg-warning-500/20 text-warning-300 ring-warning-500/30',
  'bg-error-500/20 text-error-300 ring-error-500/30',
];

function hashInitials(initials: string): number {
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = (hash * 31 + initials.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

export function Avatar({ initials, size = 'md', colorClass }: AvatarProps) {
  const cls = colorClass ?? colorPalette[hashInitials(initials) % colorPalette.length];
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold ring-1 ${sizeClasses[size]} ${cls}`}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
