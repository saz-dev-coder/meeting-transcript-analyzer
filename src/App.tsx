import { useState, useEffect, useCallback } from 'react';
import type { WorkspaceSnapshot } from '@/lib/types';
import { fetchWorkspace, subscribeToWorkspace } from '@/lib/api';
import type { RealtimeStatus } from '@/lib/api';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import type { ViewId } from '@/components/Sidebar';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { Dashboard } from '@/views/Dashboard';
import { Analyzer } from '@/views/Analyzer';
import { TaskBoard } from '@/views/TaskBoard';
import { TeamAnalytics } from '@/views/TeamAnalytics';
import { Discussions } from '@/views/Discussions';
import { Submissions } from '@/views/Submissions';
import { History } from '@/views/History';
import { SettingsView } from '@/views/SettingsView';
import { Loader2, AudioLines } from 'lucide-react';

function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>({
    profiles: [],
    meetings: [],
    tasks: [],
    decisions: [],
    discussions: [],
    discussion_replies: [],
    submissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [rtStatus, setRtStatus] = useState<RealtimeStatus>('connecting');

  const refresh = useCallback(async () => {
    const ws = await fetchWorkspace();
    setSnapshot(ws);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    const unsub = subscribeToWorkspace(
      () => {
        refresh();
      },
      (status) => {
        setRtStatus(status);
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, [refresh]);

  const pendingSubmissions = snapshot.tasks.filter(
    (t) => t.status !== 'done' && snapshot.submissions.some((s) => s.task_id === t.id)
  ).length;

  const handleNavigate = (v: ViewId) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/40">
            <AudioLines className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2 text-ink-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      <Sidebar
        current={view}
        onNavigate={handleNavigate}
        taskCount={snapshot.tasks.filter((t) => t.status !== 'done').length}
        openDiscussions={snapshot.discussions.filter((d) => d.status === 'open').length}
        pendingSubmissions={pendingSubmissions}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar with realtime indicator */}
        <div className="sticky top-0 z-30 bg-ink-950/80 backdrop-blur-md border-b border-ink-800/50">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 max-w-7xl w-full mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <AudioLines className="w-4 h-4 text-white" size={16} />
              </div>
              <span className="text-sm font-semibold text-white">TranscriptIQ</span>
            </div>
            {/* Desktop spacer to push indicator right */}
            <div className="hidden lg:block" />
            <RealtimeIndicator status={rtStatus} />
          </div>
        </div>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {view === 'dashboard' && (
            <Dashboard
              tasks={snapshot.tasks}
              discussions={snapshot.discussions}
              submissions={snapshot.submissions}
              profiles={snapshot.profiles}
              meetings={snapshot.meetings}
              onNavigate={handleNavigate}
            />
          )}
          {view === 'analyzer' && (
            <Analyzer
              tasks={snapshot.tasks}
              profiles={snapshot.profiles}
              meetings={snapshot.meetings}
              onTasksChanged={refresh}
              onMeetingChanged={refresh}
            />
          )}
          {view === 'tasks' && (
            <TaskBoard
              tasks={snapshot.tasks}
              profiles={snapshot.profiles}
              submissions={snapshot.submissions}
              onTasksChanged={refresh}
              onNavigateSubmissions={() => handleNavigate('submissions')}
            />
          )}
          {view === 'analytics' && (
            <TeamAnalytics
              tasks={snapshot.tasks}
              profiles={snapshot.profiles}
            />
          )}
          {view === 'discussions' && (
            <Discussions
              discussions={snapshot.discussions}
              replies={snapshot.discussion_replies}
              profiles={snapshot.profiles}
              onChanged={refresh}
            />
          )}
          {view === 'submissions' && (
            <Submissions
              tasks={snapshot.tasks}
              submissions={snapshot.submissions}
              profiles={snapshot.profiles}
              onChanged={refresh}
            />
          )}
          {view === 'history' && (
            <History
              meetings={snapshot.meetings}
              tasks={snapshot.tasks}
              decisions={snapshot.decisions}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              tasks={snapshot.tasks}
              meetings={snapshot.meetings}
              profiles={snapshot.profiles}
            />
          )}
        </main>
      </div>
      <MobileNav current={view} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
