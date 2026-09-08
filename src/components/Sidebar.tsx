import {
  LayoutDashboard,
  FileScan,
  KanbanSquare,
  MessageSquare,
  CheckCircle2,
  History as HistoryIcon,
  AudioLines,
  Settings,
  BarChart3,
} from 'lucide-react';

export type ViewId =
  | 'dashboard'
  | 'analyzer'
  | 'tasks'
  | 'discussions'
  | 'submissions'
  | 'history'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
  taskCount: number;
  openDiscussions: number;
  pendingSubmissions: number;
}

const navItems: Array<{
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyzer', label: 'Analyzer', icon: FileScan },
  { id: 'tasks', label: 'Task Board', icon: KanbanSquare },
  { id: 'analytics', label: 'Team Analytics', icon: BarChart3 },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'submissions', label: 'Submissions', icon: CheckCircle2 },
  { id: 'history', label: 'Meeting History', icon: HistoryIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  current,
  onNavigate,
  taskCount,
  openDiscussions,
  pendingSubmissions,
}: SidebarProps) {
  const badge: Partial<Record<ViewId, number>> = {
    tasks: taskCount,
    discussions: openDiscussions,
    submissions: pendingSubmissions,
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-ink-900 border-r border-ink-800 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-ink-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/40">
          <AudioLines className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white">TranscriptIQ</span>
          <span className="text-[10px] text-ink-400 font-medium tracking-wide uppercase">
            Workspace
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          const count = badge[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/60'
              }`}
            >
              <Icon
                className={`shrink-0 transition-transform ${
                  isActive ? '' : 'group-hover:scale-110'
                }`}
                size={18}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-brand-500/30 text-brand-200'
                      : 'bg-ink-700/80 text-ink-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white text-xs font-semibold ring-1 ring-accent-500/30">
            WS
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-ink-200 truncate">Workspace</span>
            <span className="text-[10px] text-ink-500">Single-tenant</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface MobileNavProps {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
}

export function MobileNav({ current, onNavigate }: MobileNavProps) {
  const mobileItems = navItems.filter((i) =>
    ['dashboard', 'analyzer', 'tasks', 'discussions', 'submissions', 'settings'].includes(i.id)
  );
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-900/95 backdrop-blur-md border-t border-ink-800">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area overflow-x-auto scrollbar-thin">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors shrink-0 ${
                isActive ? 'text-brand-400' : 'text-ink-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
