import { useState } from 'react';
import {
  History as HistoryIcon,
  FileText,
  ChevronRight,
  ChevronDown,
  Download,
  Inbox,
  FileSpreadsheet,
} from 'lucide-react';
import type { Meeting, Task, Decision } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { downloadCSV } from '@/lib/api';

interface HistoryProps {
  meetings: Meeting[];
  tasks: Task[];
  decisions: Decision[];
}

export function History({ meetings, tasks, decisions }: HistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);

  const meetingTasks = (id: string) => tasks.filter((t) => t.meeting_id === id);
  const meetingDecisions = (id: string) => decisions.filter((d) => d.meeting_id === id);

  function handleExportCSV(meeting: Meeting) {
    const mt = meetingTasks(meeting.id);
    const md = meetingDecisions(meeting.id);
    const headers = ['Title', 'Status', 'Assignee', 'Category', 'Confidence', 'Deadline'];
    const rows = mt.map((t) => [
      t.title,
      t.status,
      t.assignee_name,
      t.category,
      String(t.confidence),
      t.deadline ?? '',
    ]);
    if (md.length > 0) {
      md.forEach((d, i) => {
        if (i >= rows.length) rows.push(['', '', '', '', '', '']);
      });
    }
    downloadCSV(
      `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tasks.csv`,
      headers,
      rows
    );
  }

  function handleExport(meeting: Meeting) {
    const mt = meetingTasks(meeting.id);
    const md = meetingDecisions(meeting.id);
    const lines: string[] = [];
    lines.push(`# ${meeting.title}`);
    lines.push(`Date: ${new Date(meeting.created_at).toLocaleString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(meeting.summary ?? 'No summary available.');
    lines.push('');
    lines.push('## Transcript');
    lines.push(meeting.transcript);
    lines.push('');
    if (md.length > 0) {
      lines.push('## Decisions');
      md.forEach((d, i) => lines.push(`${i + 1}. ${d.content}`));
      lines.push('');
    }
    if (mt.length > 0) {
      lines.push('## Tasks');
      mt.forEach((t, i) => {
        lines.push(`${i + 1}. [${t.status.toUpperCase()}] ${t.title} — ${t.assignee_name} (${t.confidence}% confidence)`);
        if (t.description) lines.push(`   ${t.description}`);
      });
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-brand-400" />
          Meeting History
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} on record
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="bg-ink-900/50 border border-dashed border-ink-700 rounded-xl p-12 text-center">
          <Inbox className="w-8 h-8 text-ink-600 mx-auto mb-3" />
          <p className="text-sm text-ink-400 mb-1">No meetings recorded yet.</p>
          <p className="text-xs text-ink-600">Analyze a transcript and save it to build your history.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const mt = meetingTasks(meeting.id);
            const md = meetingDecisions(meeting.id);
            const isOpen = expanded === meeting.id;
            return (
              <div
                key={meeting.id}
                className="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden hover:border-ink-700 transition-colors"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : meeting.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{meeting.title}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-ink-500">
                        {new Date(meeting.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-ink-600">·</span>
                      <span className="text-xs text-ink-500">
                        {mt.length} task{mt.length !== 1 ? 's' : ''}, {md.length} decision{md.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(meeting);
                    }}
                    className="text-xs text-ink-400 hover:text-brand-300 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-ink-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Markdown</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportCSV(meeting);
                    }}
                    className="text-xs text-ink-400 hover:text-success-300 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-ink-800"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-ink-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-ink-500 shrink-0" />
                  )}
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-4 animate-slide-up border-t border-ink-800 pt-4">
                    {meeting.summary && (
                      <div>
                        <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Summary</h4>
                        <p className="text-sm text-ink-200 leading-relaxed">{meeting.summary}</p>
                      </div>
                    )}
                    {md.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Decisions</h4>
                        <ul className="space-y-1.5">
                          {md.map((d) => (
                            <li key={d.id} className="text-sm text-ink-300 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                              {d.content}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {mt.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Tasks</h4>
                        <div className="space-y-1.5">
                          {mt.map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-sm">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  t.status === 'done'
                                    ? 'bg-success-500/15 text-success-300'
                                    : t.status === 'in_progress'
                                    ? 'bg-brand-500/15 text-brand-300'
                                    : 'bg-ink-700 text-ink-400'
                                }`}
                              >
                                {t.status === 'done' ? 'DONE' : t.status === 'in_progress' ? 'WIP' : 'TODO'}
                              </span>
                              <span className="text-ink-200 flex-1 truncate">{t.title}</span>
                              <span className="text-xs text-ink-500">{t.assignee_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setViewMeeting(meeting)}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      View full transcript →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMeeting && (
        <Modal
          open={true}
          onClose={() => setViewMeeting(null)}
          title={viewMeeting.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {viewMeeting.summary && (
              <div className="bg-brand-500/10 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-brand-300 uppercase tracking-wide mb-1">Summary</h4>
                <p className="text-sm text-ink-200 leading-relaxed">{viewMeeting.summary}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Transcript</h4>
              <pre className="text-sm text-ink-300 font-mono whitespace-pre-wrap leading-relaxed bg-ink-800/40 rounded-lg p-4 max-h-[50vh] overflow-y-auto scrollbar-thin">
                {viewMeeting.transcript}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
