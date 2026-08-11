"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, FileText, Loader2, AlertCircle, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  documents: number[];
}

export default function ChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get("/chat/");
        setSessions(res.data);
      } catch {
        setError("Failed to load chat sessions.");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this chat session?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/chat/${id}/`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete session.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Chat Sessions</h1>
          <p className="text-gray-400 mt-1">Your conversations with the AI Tutor</p>
        </div>
        <Link
          href="/dashboard/documents"
          className="flex items-center gap-2 px-5 py-3 bg-secondary/20 text-secondary border border-secondary/30 rounded-xl font-semibold transition-all hover:bg-secondary/30"
        >
          <Plus size={18} />
          New Chat
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-6 glass-card text-red-400">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-16 text-center text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg mb-2">No chat sessions yet.</p>
          <p className="text-sm mb-6">Upload a PDF and start chatting with the AI Tutor.</p>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            <FileText size={16} />
            Go to Documents
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card p-6 flex items-center justify-between group hover:border-white/20 transition-all"
              >
                <Link href={`/chat/${session.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-secondary/20 rounded-xl shrink-0">
                    <MessageSquare size={20} className="text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{session.title || `Chat Session #${session.id}`}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {session.documents.length} document{session.documents.length !== 1 ? "s" : ""} · {session.created_at}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <Link
                    href={`/chat/${session.id}`}
                    className="px-4 py-2 bg-secondary/20 text-secondary rounded-lg text-sm font-medium hover:bg-secondary/30 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Continue →
                  </Link>
                  <button
                    onClick={() => handleDelete(session.id)}
                    disabled={deletingId === session.id}
                    className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === session.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
