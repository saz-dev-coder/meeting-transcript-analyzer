import { useState } from 'react';
import {
  FileScan,
  Sparkles,
  CheckCircle2,
  ListChecks,
  Lightbulb,
  Loader2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import type { Task, Profile, Meeting } from '@/lib/types';
import { analyzeTranscript, filterNewTasks, analysisToTaskInput } from '@/lib/analyzer';
import { createTask, createMeeting } from '@/lib/api';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { Avatar } from '@/components/Avatar';

interface AnalyzerProps {
  tasks: Task[];
  profiles: Profile[];
  meetings: Meeting[];
  onTasksChanged: () => void;
  onMeetingChanged: () => void;
}

type Phase = 'idle' | 'analyzing' | 'results';

const SAMPLE_TRANSCRIPT = `Alex: We need the deployment checklist ready before Friday.
Jordan: I can finalize the API integration notes, but the authentication issue is still returning a 401 in staging.
Taylor: Let's make Thursday the internal deadline so we have room to review.
Alex: Agreed. We should also validate the production build and document the rollback path.
Jordan: I'll investigate the API issue and post the findings in the discussion thread.
Taylor: I'll prepare the release notes and the handoff checklist.
Alex: We decided that Thursday is the internal deadline for platform readiness.
Alex: The release must include an authentication root-cause note and rollback path.`;

export function Analyzer({ tasks, profiles, meetings, onTasksChanged, onMeetingChanged }: AnalyzerProps) {
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<ReturnType<typeof analyzeTranscript> | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [savedMeeting, setSavedMeeting] = useState(false);

  function handleAnalyze() {
    if (!transcript.trim()) return;
    setPhase('analyzing');
    setImportMsg(null);
    setSavedMeeting(false);
    setTimeout(() => {
      const analysis = analyzeTranscript(transcript);
      setResult(analysis);
      setPhase('results');
    }, 800);
  }

  function handleSample() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setMeetingTitle('Q3 Platform Readiness – Sync');
    setPhase('idle');
    setResult(null);
  }

  async function handleImportAll() {
    if (!result) return;
    setImporting(true);
    setImportMsg(null);
    try {
      if (!savedMeeting && meetingTitle.trim()) {
        await createMeeting(meetingTitle.trim(), transcript, result.summary);
        setSavedMeeting(true);
        onMeetingChanged();
      }
      const newTasks = filterNewTasks(result.tasks, tasks);
      const inputs = analysisToTaskInput(newTasks, profiles);
      let imported = 0;
      for (const input of inputs) {
        const t = await createTask({
          ...input,
          meeting_id: null,
          proof_of_work: null,
          deliverable_link: null,
        });
        if (t) imported++;
      }
      setImportMsg(`Imported ${imported} task${imported !== 1 ? 's' : ''} into the board.`);
      onTasksChanged();
    } catch {
      setImportMsg('Something went wrong while importing tasks.');
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setTranscript('');
    setMeetingTitle('');
    setPhase('idle');
    setResult(null);
    setImportMsg(null);
    setSavedMeeting(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileScan className="w-6 h-6 text-brand-400" />
          Transcript Analyzer
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Paste a meeting transcript to extract tasks, decisions, and a summary.
        </p>
      </div>

      {/* Input panel */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Meeting title (optional)</label>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="e.g. Weekly Engineering Sync – Sept 8"
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-ink-300">Transcript</label>
            <button
              onClick={handleSample}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Load sample
            </button>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              if (phase === 'results') setPhase('idle');
            }}
            placeholder="Paste your meeting transcript here. Speaker labels (e.g. 'Alex:') improve extraction accuracy."
            rows={8}
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-3 text-sm text-ink-100 placeholder:text-ink-600 font-mono leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-y scrollbar-thin"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!transcript.trim() || phase === 'analyzing'}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-ink-700 disabled:text-ink-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {phase === 'analyzing' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {phase === 'analyzing' ? 'Analyzing...' : 'Analyze Transcript'}
          </button>
          {(phase === 'results' || transcript) && (
            <button
              onClick={handleReset}
              className="text-sm text-ink-400 hover:text-ink-200 px-3 py-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {phase === 'results' && result && (
        <div className="space-y-5 animate-slide-up">
          {/* Summary */}
          <div className="bg-gradient-to-br from-brand-500/10 to-ink-900 border border-brand-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-white">Summary</h2>
            </div>
            <p className="text-sm text-ink-200 leading-relaxed">{result.summary}</p>
          </div>

          {/* Key takeaways */}
          {result.keyTakeaways.length > 0 && (
            <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-accent-400" />
                <h2 className="text-sm font-semibold text-white">Key Takeaways</h2>
              </div>
              <ul className="space-y-2">
                {result.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2 shrink-0" />
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted tasks */}
          <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-success-400" />
                <h2 className="text-sm font-semibold text-white">
                  Extracted Tasks ({result.tasks.length})
                </h2>
              </div>
              <button
                onClick={handleImportAll}
                disabled={importing || result.tasks.length === 0}
                className="inline-flex items-center gap-1.5 bg-success-600/90 hover:bg-success-500 disabled:bg-ink-700 disabled:text-ink-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                Import to Board
              </button>
            </div>
            {importMsg && (
              <div className="mb-3 text-xs text-success-300 bg-success-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {importMsg}
              </div>
            )}
            {result.tasks.length === 0 ? (
              <p className="text-sm text-ink-500 py-4 text-center">
                No action items detected. Try adding phrases like "I'll", "we need to", or "let's".
              </p>
            ) : (
              <div className="space-y-2.5">
                {result.tasks.map((task, i) => {
                  const profile = task.assigneeName
                    ? profiles.find(
                        (p) =>
                          p.full_name.toLowerCase().includes(task.assigneeName!.toLowerCase()) ||
                          p.full_name.toLowerCase().startsWith(task.assigneeName!.toLowerCase())
                      )
                    : null;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-ink-800/40 border border-ink-800/60"
                    >
                      <div className="w-7 h-7 rounded-lg bg-ink-700 flex items-center justify-center text-xs font-mono text-ink-400 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink-100">{task.title}</div>
                        <div className="text-xs text-ink-500 mt-1 line-clamp-2">{task.description}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink-700 text-ink-300">
                            {task.category}
                          </span>
                          {task.assigneeName && (
                            <div className="flex items-center gap-1.5">
                              {profile ? (
                                <Avatar initials={profile.avatar_initials} size="sm" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-ink-700 flex items-center justify-center text-[9px] font-semibold text-ink-400">
                                  {task.assigneeName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-ink-400">{task.assigneeName}</span>
                            </div>
                          )}
                          {task.deadline && (
                            <span className="text-xs text-ink-500 font-mono">{task.deadline}</span>
                          )}
                        </div>
                      </div>
                      <div className="w-20 shrink-0 pt-1">
                        <ConfidenceMeter value={task.confidence} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Decisions */}
          {result.decisions.length > 0 && (
            <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                <h2 className="text-sm font-semibold text-white">Decisions ({result.decisions.length})</h2>
              </div>
              <ul className="space-y-2">
                {result.decisions.map((dec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                    {dec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Idle hint */}
      {phase === 'idle' && !transcript && meetings.length === 0 && (
        <div className="bg-ink-900/50 border border-dashed border-ink-700 rounded-xl p-8 text-center">
          <FileScan className="w-8 h-8 text-ink-600 mx-auto mb-3" />
          <p className="text-sm text-ink-400">
            Paste a transcript and click <span className="text-brand-400 font-medium">Analyze</span> to get started.
          </p>
          <button
            onClick={handleSample}
            className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Or try a sample transcript
          </button>
        </div>
      )}
    </div>
  );
}
