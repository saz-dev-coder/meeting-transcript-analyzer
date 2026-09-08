import { Settings, Download, Database, Zap, Info } from 'lucide-react';
import type { Task, Meeting, Profile } from '@/lib/types';
import { exportTasksCSV } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SettingsViewProps {
  tasks: Task[];
  meetings: Meeting[];
  profiles: Profile[];
}

export function SettingsView({ tasks, meetings, profiles }: SettingsViewProps) {
  function handleExportTasksCSV() {
    exportTasksCSV(tasks);
  }

  function handleExportMeetingsCSV() {
    const headers = ['Title', 'Created At', 'Summary', 'Transcript Length'];
    const rows = meetings.map((m) => [
      m.title,
      new Date(m.created_at).toLocaleString(),
      m.summary ?? '',
      String(m.transcript.length),
    ]);
    const escape = (val: string): string => {
      const needsQuote = val.includes(',') || val.includes('"') || val.includes('\n');
      const cleaned = val.replace(/"/g, '""');
      return needsQuote ? `"${cleaned}"` : cleaned;
    };
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meetings_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-400" />
          Settings
        </h1>
        <p className="text-sm text-ink-400 mt-1">Workspace configuration and data export</p>
      </div>

      {/* Connection status */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Connection Status</h2>
        </div>
        <div className="space-y-3">
          <Row label="Backend" value={isSupabaseConfigured ? 'Supabase (Connected)' : 'Local Storage (Offline)'} />
          <Row label="Realtime" value={isSupabaseConfigured ? 'Postgres Changes Active' : 'Disabled'} />
          <Row label="Data persistence" value={isSupabaseConfigured ? 'Cloud database' : 'Browser localStorage'} />
        </div>
        {!isSupabaseConfigured && (
          <div className="mt-4 flex items-start gap-2.5 text-xs text-warning-300 bg-warning-500/10 rounded-lg p-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Running in local mode. Data is stored in your browser and will not sync across devices.
              Connect Supabase to enable real-time collaboration.
            </span>
          </div>
        )}
      </div>

      {/* Data export */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-success-400" />
          <h2 className="text-sm font-semibold text-white">Data Export</h2>
        </div>
        <p className="text-sm text-ink-400 mb-4">
          Export your workspace data as spreadsheets for reporting or backup.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportTasksCSV}
            disabled={tasks.length === 0}
            className="flex items-center gap-3 p-4 rounded-xl bg-ink-800/60 border border-ink-800 hover:border-ink-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-success-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">Export Tasks (CSV)</div>
              <div className="text-xs text-ink-500 mt-0.5">{tasks.length} records</div>
            </div>
          </button>
          <button
            onClick={handleExportMeetingsCSV}
            disabled={meetings.length === 0}
            className="flex items-center gap-3 p-4 rounded-xl bg-ink-800/60 border border-ink-800 hover:border-ink-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">Export Meetings (CSV)</div>
              <div className="text-xs text-ink-500 mt-0.5">{meetings.length} records</div>
            </div>
          </button>
        </div>
      </div>

      {/* Workspace info */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-white">Workspace Stats</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Meetings" value={meetings.length} />
          <StatBox label="Tasks" value={tasks.length} />
          <StatBox label="Team Members" value={profiles.length} />
          <StatBox
            label="Completed"
            value={tasks.filter((t) => t.status === 'done').length}
          />
        </div>
      </div>

      {/* About */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-ink-400" />
          <h2 className="text-sm font-semibold text-white">About</h2>
        </div>
        <p className="text-sm text-ink-400 leading-relaxed">
          TranscriptIQ analyzes meeting transcripts to extract action items, decisions, and summaries.
          Tasks are tracked on a Kanban board with confidence scoring, team discussions, and proof-of-work
          submissions. All data syncs in real time through Supabase Postgres Changes.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-800 last:border-0">
      <span className="text-sm text-ink-400">{label}</span>
      <span className="text-sm font-medium text-ink-200">{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </div>
  );
}
