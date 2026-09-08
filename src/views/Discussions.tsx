import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import type { Discussion, DiscussionReply, Profile } from '@/lib/types';
import { createDiscussion, createReply, updateDiscussionStatus } from '@/lib/api';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';

interface DiscussionsProps {
  discussions: Discussion[];
  replies: DiscussionReply[];
  profiles: Profile[];
  onChanged: () => void;
}

export function Discussions({ discussions, replies, profiles, onChanged }: DiscussionsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(discussions[0]?.id ?? null);
  const [showNew, setShowNew] = useState(false);
  const [replyText, setReplyText] = useState('');

  const selected = discussions.find((d) => d.id === selectedId) ?? null;
  const selectedReplies = useMemo(
    () => replies.filter((r) => r.discussion_id === selectedId),
    [replies, selectedId]
  );

  async function handleSendReply() {
    if (!selected || !replyText.trim()) return;
    const author = profiles[0];
    await createReply(selected.id, author?.id ?? null, author?.full_name ?? 'Workspace member', replyText.trim());
    setReplyText('');
    onChanged();
  }

  async function handleToggleStatus(d: Discussion) {
    await updateDiscussionStatus(d.id, d.status === 'open' ? 'resolved' : 'open');
    onChanged();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-400" />
            Discussions
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {discussions.filter((d) => d.status === 'open').length} open ·{' '}
            {discussions.filter((d) => d.status === 'resolved').length} resolved
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Discussion
        </button>
      </div>

      {discussions.length === 0 ? (
        <div className="bg-ink-900/50 border border-dashed border-ink-700 rounded-xl p-12 text-center">
          <MessageCircle className="w-8 h-8 text-ink-600 mx-auto mb-3" />
          <p className="text-sm text-ink-400 mb-1">No discussions yet.</p>
          <p className="text-xs text-ink-600">Create one to start a conversation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="lg:col-span-1 space-y-2">
            {discussions.map((d) => {
              const count = replies.filter((r) => r.discussion_id === d.id).length;
              const isActive = d.id === selectedId;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-ink-800/80 border-brand-500/30 ring-1 ring-brand-500/20'
                      : 'bg-ink-900/60 border-ink-800 hover:border-ink-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-medium text-ink-100 leading-snug line-clamp-2">{d.title}</h3>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        d.status === 'open'
                          ? 'bg-accent-500/15 text-accent-300'
                          : 'bg-success-500/15 text-success-300'
                      }`}
                    >
                      {d.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 line-clamp-2 mb-2">{d.content}</p>
                  <div className="flex items-center justify-between text-[11px] text-ink-500">
                    <span>{d.author_name}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Thread */}
          <div className="lg:col-span-2 bg-ink-900 border border-ink-800 rounded-xl flex flex-col min-h-[400px] max-h-[calc(100vh-220px)]">
            {selected ? (
              <>
                <div className="px-5 py-4 border-b border-ink-800">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-semibold text-white leading-snug">{selected.title}</h2>
                    <button
                      onClick={() => handleToggleStatus(selected)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                        selected.status === 'open'
                          ? 'bg-success-500/15 text-success-300 hover:bg-success-500/25'
                          : 'bg-accent-500/15 text-accent-300 hover:bg-accent-500/25'
                      }`}
                    >
                      {selected.status === 'open' ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved</>
                      ) : (
                        <><RotateCcw className="w-3.5 h-3.5" /> Reopen</>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <Avatar
                      initials={profiles.find((p) => p.id === selected.author_id)?.avatar_initials ?? 'WS'}
                      size="sm"
                    />
                    <span>{selected.author_name}</span>
                    <span>·</span>
                    <span>{formatRelative(selected.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink-300 mt-3 leading-relaxed">{selected.content}</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
                  {selectedReplies.length === 0 ? (
                    <p className="text-sm text-ink-600 text-center py-8">No replies yet. Be the first to respond.</p>
                  ) : (
                    selectedReplies.map((reply) => (
                      <div key={reply.id} className="flex gap-3 animate-slide-in-right">
                        <Avatar
                          initials={profiles.find((p) => p.id === reply.author_id)?.avatar_initials ?? reply.author_name.slice(0, 2).toUpperCase()}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-ink-200">{reply.author_name}</span>
                            <span className="text-[11px] text-ink-600">{formatRelative(reply.created_at)}</span>
                          </div>
                          <p className="text-sm text-ink-300 leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-5 py-3.5 border-t border-ink-800">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Write a reply... (Enter to send, Shift+Enter for newline)"
                      rows={1}
                      className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 disabled:bg-ink-700 disabled:text-ink-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-ink-600">Select a discussion to view the thread.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showNew && (
        <NewDiscussionModal
          profiles={profiles}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function NewDiscussionModal({
  profiles,
  onClose,
  onCreated,
}: {
  profiles: Profile[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorId, setAuthorId] = useState(profiles[0]?.id ?? '');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const author = profiles.find((p) => p.id === authorId);
    await createDiscussion({
      title: title.trim(),
      content: content.trim(),
      author_id: authorId || null,
      author_name: author?.full_name ?? 'Workspace member',
    });
    setSaving(false);
    onCreated();
  }

  return (
    <Modal open={true} onClose={onClose} title="New Discussion">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the topic?"
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Details</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Provide context for the discussion..."
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Author</label>
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brand-500 transition-colors"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm text-ink-400 hover:text-ink-200 px-4 py-2 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || !content.trim()}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-ink-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Creating...' : 'Create Discussion'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
