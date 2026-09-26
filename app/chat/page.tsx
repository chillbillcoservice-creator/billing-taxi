'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/ClientShell';
import { ChatMessageInfo } from '@/lib/types';
import {
  Send,
  Image as ImageIcon,
  Video,
  Pin,
  Trash2,
  Flag,
  Reply,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Camera,
} from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageInfo[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessageInfo | null>(null);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportModalMessage, setReportModalMessage] = useState<ChatMessageInfo | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async (isInitial = false) => {
    try {
      const res = await fetch('/api/chat?limit=60');
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setPinnedMessages(data.pinnedMessages || []);
        if (isInitial) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    // Poll every 3 seconds for live message stream
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isSecure', 'false');

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        const isVideo = file.type.startsWith('video/');
        setAttachedMedia({
          url: data.url,
          type: isVideo ? 'VIDEO' : 'IMAGE',
        });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    if (!text.trim() && !attachedMedia) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          mediaUrl: attachedMedia?.url || null,
          mediaType: attachedMedia?.type || 'NONE',
          replyToId: replyingTo?.id || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setText('');
        setAttachedMedia(null);
        setReplyingTo(null);
        fetchMessages(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/chat/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMessages(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = async (msgId: string) => {
    try {
      const res = await fetch(`/api/chat/${msgId}/pin`, { method: 'POST' });
      if (res.ok) {
        fetchMessages(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalMessage) return;

    try {
      const res = await fetch(`/api/chat/${reportModalMessage.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason || 'Inappropriate content' }),
      });
      if (res.ok) {
        setToast('Report submitted for safety marshal review.');
        setReportModalMessage(null);
        setReportReason('');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-130px)] relative">
      {/* Pinned Announcement Bar */}
      {pinnedMessages.length > 0 && (
        <div className="bg-sky-950/90 border-b border-sky-800/80 px-3 py-2 flex items-start gap-2 text-xs">
          <Pin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-300 block text-[10px] uppercase tracking-wider">
              Pinned Launch Safety Announcement
            </span>
            <p className="text-slate-200 line-clamp-2 leading-relaxed">
              {pinnedMessages[0].content}
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute top-12 left-4 right-4 z-30 p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3 py-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = user?.id === msg.senderId;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                {/* Sender Tag */}
                {!isMe && (
                  <div className="flex items-center gap-1 mb-1 ml-1 text-[11px]">
                    <span className="font-bold text-slate-300">{msg.sender.name}</span>
                    <span className="text-[10px] text-slate-500">@{msg.sender.username}</span>
                    {msg.sender.role === 'ADMIN' && (
                      <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                        ADMIN
                      </span>
                    )}
                    {msg.sender.role === 'MODERATOR' && (
                      <span className="px-1 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                        MARSHAL
                      </span>
                    )}
                    {msg.sender.isPilotVerified && (
                      <ShieldCheck className="w-3 h-3 text-sky-400" />
                    )}
                  </div>
                )}

                {/* Replying To preview */}
                {msg.replyTo && (
                  <div
                    className={`text-[10px] px-2.5 py-1 mb-1 rounded-lg border max-w-xs truncate ${
                      isMe
                        ? 'bg-sky-950/60 text-sky-300 border-sky-900'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className="font-semibold text-slate-300">
                      Replying to {msg.replyTo.sender.name}:
                    </span>{' '}
                    {msg.replyTo.content}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Photo or Video Media */}
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-h-56 bg-black/40">
                      {msg.mediaType === 'VIDEO' ? (
                        <video src={msg.mediaUrl} controls className="w-full max-h-56 object-cover" />
                      ) : (
                        <img
                          src={msg.mediaUrl}
                          alt="Attachment"
                          className="w-full max-h-56 object-cover rounded-xl"
                        />
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                    {msg.content}
                  </p>

                  {/* Timestamp & Pin Indicator */}
                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                    {msg.isPinned && <Pin className="w-3 h-3 text-amber-300 fill-amber-300" />}
                    <span>{timeStr}</span>
                  </div>
                </div>

                {/* Quick Action Buttons (Reply, Report, Pin, Delete) */}
                <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-500">
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="hover:text-sky-400 flex items-center gap-0.5"
                    title="Reply"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Reply</span>
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => setReportModalMessage(msg)}
                      className="hover:text-amber-400 flex items-center gap-0.5"
                      title="Report"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  )}

                  {isStaff && (
                    <button
                      onClick={() => handleTogglePin(msg.id)}
                      className={`hover:text-amber-400 flex items-center gap-0.5 ${
                        msg.isPinned ? 'text-amber-400' : ''
                      }`}
                      title={msg.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{msg.isPinned ? 'Unpin' : 'Pin'}</span>
                    </button>
                  )}

                  {(isMe || isStaff) && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="hover:text-rose-400 flex items-center gap-0.5"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            No messages yet. Send a radio check or launch report!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="bg-slate-850 border-t border-slate-700 px-3 py-1.5 flex items-center justify-between text-xs text-sky-300">
          <div className="flex items-center gap-1.5 truncate">
            <Reply className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Replying to <b className="text-white">{replyingTo.sender.name}</b>: "{replyingTo.content}"
            </span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Media Attachment Preview */}
      {attachedMedia && (
        <div className="bg-slate-850 border-t border-slate-700 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Attached {attachedMedia.type}:</span>
            <span className="text-xs text-sky-400 underline max-w-[180px] truncate">{attachedMedia.url}</span>
          </div>
          <button onClick={() => setAttachedMedia(null)} className="p-1 hover:text-rose-400 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2.5 backdrop-blur-md"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-11 w-11 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-sky-400 transition-colors shrink-0 flex items-center justify-center active:scale-95"
          title="Attach photo / video from camera or gallery"
        >
          {uploading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write message... (@username)" : "Sign in to chat"}
          disabled={!user}
          className="flex-1 min-h-[46px] bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-2.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />

        <button
          type="submit"
          disabled={sending || (!text.trim() && !attachedMedia) || !user}
          className="h-11 w-11 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white shadow-md shadow-sky-600/30 active:scale-95 transition-all shrink-0 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Report Modal */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setReportModalMessage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Report Message</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Flag dangerous weather misinformation, spam, or inappropriate behavior to safety marshals.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                rows={3}
                placeholder="Describe reason (e.g. offensive language, fake weather report)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                Submit Report to Safety Marshals
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
