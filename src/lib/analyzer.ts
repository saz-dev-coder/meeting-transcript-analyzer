import type { Task, Decision } from './types';

export interface AnalysisResult {
  summary: string;
  tasks: Array<{
    title: string;
    description: string;
    category: string;
    confidence: number;
    assigneeName: string | null;
    deadline: string | null;
  }>;
  decisions: string[];
  keyTakeaways: string[];
}

const ACTION_PATTERNS = [
  /\b(?:i'?ll|i will|we'?ll|we will|i can|we can|i need to|we need to|let'?s|let us|action item|todo|to-do|follow up|finalize|prepare|investigate|schedule|send|draft|review|complete|create|update|fix|deploy|validate|document|share|confirm|coordinate)\b/i,
];

const DECISION_PATTERNS = [
  /\b(?:we (?:decided|agreed|concluded|will|should)|decision:|the (?:decision|plan) is|let'?s go with|we'?re going with|agreed(?: that)?|approved|confirmed that|finalized)\b/i,
];

const ASSIGNEE_PATTERN = /\b(?:assign(?:ed)? to|owner:?|@|for\s+([A-Z][a-z]+))\b/;
const DEADLINE_PATTERN = /\b(?:by|before|deadline(?: is)?|due(?: on)?|target(?: is)?)\s+([A-Z][a-z]+day|\w+day|tomorrow|next week|end of (?:week|month|quarter)|\d{1,2}(?:st|nd|rd|th)?|\d{4}-\d{2}-\d{2})\b/i;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Engineering: ['api', 'auth', 'authentication', 'code', 'deploy', 'deployment', 'bug', 'fix', 'build', 'integration', 'server', 'endpoint', 'token', 'staging', 'production'],
  Product: ['requirements', 'roadmap', 'feature', 'user', 'stakeholder', 'spec', 'criteria', 'priority', 'backlog'],
  QA: ['test', 'qa', 'validate', 'validation', 'regression', 'quality', 'verify', 'verification'],
  Documentation: ['document', 'documentation', 'release notes', 'checklist', 'handoff', 'notes', 'guide', 'manual'],
  Design: ['design', 'ui', 'ux', 'mockup', 'prototype', 'wireframe', 'layout', 'visual'],
  Operations: ['ops', 'operations', 'schedule', 'coordinate', 'process', 'workflow', 'logistics'],
  Marketing: ['marketing', 'campaign', 'launch', 'announcement', 'social', 'newsletter', 'content'],
};

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Sam', 'Casey', 'Morgan', 'Riley', 'Jamie', 'Avery', 'Quinn'];

function splitLines(transcript: string): string[] {
  return transcript
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function stripSpeaker(line: string): { speaker: string | null; text: string } {
  const match = line.match(/^([A-Z][a-zA-Z.\s-]+):\s*(.*)$/);
  if (match) {
    return { speaker: match[1].trim(), text: match[2].trim() };
  }
  return { speaker: null, text: line };
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'Operations';
}

function detectAssignee(text: string): string | null {
  const match = text.match(ASSIGNEE_PATTERN);
  if (match && match[1]) return match[1];
  for (const name of FIRST_NAMES) {
    if (new RegExp(`\\b${name}\\b`).test(text)) return name;
  }
  return null;
}

function detectDeadline(text: string): string | null {
  const match = text.match(DEADLINE_PATTERN);
  if (match && match[1]) return match[1];
  return null;
}

function confidenceFor(text: string): number {
  let score = 50;
  for (const pattern of ACTION_PATTERNS) {
    if (pattern.test(text)) score += 20;
  }
  if (ASSIGNEE_PATTERN.test(text) || detectAssignee(text)) score += 15;
  if (DEADLINE_PATTERN.test(text) || detectDeadline(text)) score += 10;
  if (text.length > 30) score += 5;
  return Math.min(99, score);
}

function isActionLine(text: string): boolean {
  return ACTION_PATTERNS.some((p) => p.test(text));
}

function isDecisionLine(text: string): boolean {
  return DECISION_PATTERNS.some((p) => p.test(text));
}

function cleanTaskTitle(text: string): string {
  let t = text.replace(/^(i'?ll|i will|we'?ll|we will|i can|we can|i need to|we need to|let'?s|let us)\s+/i, '');
  t = t.replace(/^(action item|todo|to-do|follow up)[:\s]*/i, '');
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (t.length > 120) t = t.slice(0, 117) + '...';
  return t.trim();
}

function generateSummary(lines: Array<{ speaker: string | null; text: string }>, taskCount: number, decisionCount: number): string {
  const speakers = [...new Set(lines.map((l) => l.speaker).filter(Boolean))];
  const speakerList = speakers.length > 0 ? speakers.join(', ') : 'Participants';
  const actionText = taskCount === 0 ? 'No explicit action items' : `${taskCount} action item${taskCount > 1 ? 's' : ''}`;
  const decisionText = decisionCount === 0 ? 'no recorded decisions' : `${decisionCount} decision${decisionCount > 1 ? 's' : ''}`;

  const firstTwo = lines.slice(0, 2).map((l) => l.text).join(' ');
  const excerpt = firstTwo.length > 140 ? firstTwo.slice(0, 137) + '...' : firstTwo;

  return `${speakerList} discussed ${excerpt ? `"${excerpt}" ` : ''}and captured ${actionText} with ${decisionText}.`;
}

function generateKeyTakeaways(tasks: AnalysisResult['tasks'], decisions: string[]): string[] {
  const takeaways: string[] = [];
  if (decisions.length > 0) {
    takeaways.push(`${decisions.length} decision${decisions.length > 1 ? 's' : ''} documented during the meeting.`);
  }
  if (tasks.length > 0) {
    const highConfidence = tasks.filter((t) => t.confidence >= 80).length;
    takeaways.push(`${tasks.length} task${tasks.length > 1 ? 's' : ''} extracted${highConfidence > 0 ? `, ${highConfidence} with high confidence` : ''}.`);
  }
  const categories = [...new Set(tasks.map((t) => t.category))];
  if (categories.length > 0) {
    takeaways.push(`Work spans ${categories.length} area${categories.length > 1 ? 's' : ''}: ${categories.join(', ')}.`);
  }
  if (takeaways.length === 0) {
    takeaways.push('No structured action items or decisions detected. Consider refining the transcript.');
  }
  return takeaways;
}

export function analyzeTranscript(transcript: string): AnalysisResult {
  const rawLines = splitLines(transcript);
  const lines = rawLines.map(stripSpeaker);

  const tasks: AnalysisResult['tasks'] = [];
  const decisions: string[] = [];
  const seenTaskTitles = new Set<string>();

  for (const line of lines) {
    if (isActionLine(line.text)) {
      const title = cleanTaskTitle(line.text);
      if (title && !seenTaskTitles.has(title.toLowerCase())) {
        seenTaskTitles.add(title.toLowerCase());
        tasks.push({
          title,
          description: line.text,
          category: detectCategory(line.text),
          confidence: confidenceFor(line.text),
          assigneeName: detectAssignee(line.text),
          deadline: detectDeadline(line.text),
        });
      }
    }
    if (isDecisionLine(line.text)) {
      const cleaned = line.text.charAt(0).toUpperCase() + line.text.slice(1);
      if (!decisions.includes(cleaned)) {
        decisions.push(cleaned);
      }
    }
  }

  const summary = generateSummary(lines, tasks.length, decisions.length);
  const keyTakeaways = generateKeyTakeaways(tasks, decisions);

  return { summary, tasks, decisions, keyTakeaways };
}

export interface ExistingTaskContext {
  titles: Set<string>;
}

export function filterNewTasks(
  analyzed: AnalysisResult['tasks'],
  existing: Task[]
): AnalysisResult['tasks'] {
  const existingLower = new Set(existing.map((t) => t.title.toLowerCase()));
  return analyzed.filter((t) => !existingLower.has(t.title.toLowerCase()));
}

export function analysisToTaskInput(
  analyzed: AnalysisResult['tasks'],
  profiles: Array<{ id: string; full_name: string; avatar_initials: string }>
): Array<{
  title: string;
  description: string;
  category: string;
  assignee_id: string | null;
  assignee_name: string;
  assignee_initials: string;
  status: 'todo';
  deadline: string | null;
  confidence: number;
}> {
  return analyzed.map((t) => {
    let assignee_id: string | null = null;
    let assignee_name = 'Unassigned';
    let assignee_initials = 'UN';
    if (t.assigneeName) {
      const profile = profiles.find(
        (p) =>
          p.full_name.toLowerCase().includes(t.assigneeName!.toLowerCase()) ||
          p.full_name.toLowerCase().startsWith(t.assigneeName!.toLowerCase())
      );
      if (profile) {
        assignee_id = profile.id;
        assignee_name = profile.full_name;
        assignee_initials = profile.avatar_initials;
      } else {
        assignee_name = t.assigneeName;
        assignee_initials = t.assigneeName.slice(0, 2).toUpperCase();
      }
    }
    return {
      title: t.title,
      description: t.description,
      category: t.category,
      assignee_id,
      assignee_name,
      assignee_initials,
      status: 'todo' as const,
      deadline: t.deadline,
      confidence: t.confidence,
    };
  });
}

export function tasksToDecisions(analyzed: AnalysisResult): Array<{ content: string }> {
  return analyzed.decisions.map((content) => ({ content }));
}

export type { Decision };
