"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, MessageSquare, BrainCircuit, Loader2, AlertCircle, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import QuizConfigModal from "@/components/QuizConfigModal";

interface Document {
  id: number;
  title: string;
  status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  created_at: string;
  file_size: number;
}

interface DashboardStats {
  total_documents: number;
  total_chats: number;
  quizzes_passed: number;
  recent_documents: Document[];
}

const STATUS_CONFIG = {
  READY:       { label: "READY",       className: "bg-accent/20 text-accent" },
  PROCESSING:  { label: "PROCESSING",  className: "bg-yellow-500/20 text-yellow-400" },
  UPLOADED:    { label: "UPLOADED",    className: "bg-secondary/20 text-secondary" },
  FAILED:      { label: "FAILED",      className: "bg-red-500/20 text-red-400" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizDoc, setQuizDoc] = useState<Document | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users/stats/");
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.status === 401 ? "Please log in to view your dashboard." : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 15 seconds (for PROCESSING status updates)
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-6 glass-card text-red-400">
        <AlertCircle size={24} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <button
          onClick={fetchStats}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <Loader2 size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatsCard
          icon={<FileText className="text-primary" size={24} />}
          title="Total Documents"
          value={String(stats?.total_documents ?? 0)}
          href="/dashboard/documents"
        />
        <StatsCard
          icon={<MessageSquare className="text-secondary" size={24} />}
          title="Chats Initiated"
          value={String(stats?.total_chats ?? 0)}
          href="/dashboard/chats"
        />
        <StatsCard
          icon={<BrainCircuit className="text-accent" size={24} />}
          title="Quizzes Passed"
          value={String(stats?.quizzes_passed ?? 0)}
        />
      </div>

      {/* Recent Documents Table */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Recent Documents</h2>
        <Link href="/dashboard/documents" className="text-sm text-secondary hover:underline">
          View all →
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {stats?.recent_documents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No documents yet.</p>
            <Link href="/dashboard/upload" className="mt-4 inline-block text-secondary hover:underline text-sm">
              Upload your first PDF →
            </Link>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface border-b border-white/10">
              <tr>
                <th className="p-4 font-semibold text-gray-400">Name</th>
                <th className="p-4 font-semibold text-gray-400">Status</th>
                <th className="p-4 font-semibold text-gray-400">Date</th>
                <th className="p-4 font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_documents.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.UPLOADED;
                return (
                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-primary shrink-0" />
                        <span className="truncate max-w-xs" title={doc.title}>{doc.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{doc.created_at}</td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        {doc.status === "READY" && (
                          <>
                            <Link
                              href={`/chat/${doc.id}`}
                              className="flex items-center gap-1 text-secondary hover:underline text-sm"
                            >
                              <ExternalLink size={13} /> Chat
                            </Link>
                            <button
                              onClick={() => setQuizDoc(doc)}
                              className="flex items-center gap-1 text-accent hover:text-accent/80 text-sm font-medium transition-colors"
                            >
                              <BookOpen size={13} /> Quiz
                            </button>
                          </>
                        )}
                        {doc.status === "PROCESSING" && (
                          <span className="text-yellow-400 text-sm flex items-center gap-1">
                            <Loader2 size={13} className="animate-spin" /> Processing…
                          </span>
                        )}
                        {doc.status === "FAILED" && (
                          <span className="text-red-400 text-sm">Failed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quiz config modal triggered from overview table */}
      {quizDoc && (
        <QuizConfigModal
          documentId={quizDoc.id}
          documentTitle={quizDoc.title}
          onClose={() => setQuizDoc(null)}
        />
      )}
    </div>
  );
}

function StatsCard({
  icon, title, value, href
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  const card = (
    <motion.div whileHover={{ y: -5 }} className="glass-card p-6 flex items-center gap-6 cursor-pointer">
      <div className="p-4 bg-surface rounded-2xl">{icon}</div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
    </motion.div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
