"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Trash2, MessageSquare, BookOpen, Loader2, AlertCircle, Filter, UploadCloud, RefreshCw } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import clsx from "clsx";
import QuizConfigModal from "@/components/QuizConfigModal";

interface Document {
  id: number;
  title: string;
  status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  created_at: string;
  file_size: number;
}

const STATUS_CONFIG = {
  READY:      { label: "READY",      className: "bg-accent/20 text-accent" },
  PROCESSING: { label: "PROCESSING", className: "bg-yellow-500/20 text-yellow-400" },
  UPLOADED:   { label: "UPLOADED",   className: "bg-secondary/20 text-secondary" },
  FAILED:     { label: "FAILED",     className: "bg-red-500/20 text-red-400" },
};

const ALL_STATUSES = ["ALL", "READY", "PROCESSING", "UPLOADED", "FAILED"] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [quizDoc, setQuizDoc] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents/");
      setDocuments(res.data);
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // Only poll if there's a document in UPLOADED or PROCESSING state
    const needsPolling = documents.some((d) => d.status === "PROCESSING" || d.status === "UPLOADED");
    if (!needsPolling) return;

    const interval = setInterval(() => {
      // Background fetch without showing full loader
      api.get("/documents/").then((res) => setDocuments(res.data)).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [documents]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}/`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (id: number) => {
    setRetryingId(id);
    try {
      await api.post(`/documents/${id}/notify-ready/`);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "PROCESSING" } : d))
      );
    } catch {
      alert("Failed to queue processing.");
    } finally {
      setRetryingId(null);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-gray-400 mt-1">{documents.length} document{documents.length !== 1 ? "s" : ""} in your library</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 rounded-xl font-semibold text-white transition-all shadow-lg shadow-primary/20"
        >
          <UploadCloud size={18} />
          Upload PDF
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                statusFilter === s ? "bg-primary text-white" : "bg-surface text-gray-400 hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-6 glass-card text-red-400">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg mb-2">{search || statusFilter !== "ALL" ? "No documents match your filters." : "No documents uploaded yet."}</p>
          {!search && statusFilter === "ALL" && (
            <Link href="/dashboard/upload" className="text-secondary hover:underline text-sm">
              Upload your first PDF →
            </Link>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface border-b border-white/10">
              <tr>
                <th className="p-4 font-semibold text-gray-400">Name</th>
                <th className="p-4 font-semibold text-gray-400">Size</th>
                <th className="p-4 font-semibold text-gray-400">Status</th>
                <th className="p-4 font-semibold text-gray-400">Date</th>
                <th className="p-4 font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((doc) => {
                  const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.UPLOADED;
                  return (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-primary shrink-0" />
                          <span className="truncate max-w-xs font-medium" title={doc.title}>
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{formatBytes(doc.file_size)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{doc.created_at}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {doc.status === "READY" && (
                            <>
                              <Link
                                href={`/chat/${doc.id}`}
                                className="flex items-center gap-1 text-secondary hover:text-secondary/80 text-sm font-medium transition-colors"
                              >
                                <MessageSquare size={14} /> Chat
                              </Link>
                              <button
                                onClick={() => setQuizDoc(doc)}
                                className="flex items-center gap-1 text-accent hover:text-accent/80 text-sm font-medium transition-colors"
                              >
                                <BookOpen size={14} /> Quiz
                              </button>
                            </>
                          )}
                          {doc.status === "PROCESSING" && (
                            <span className="text-yellow-400 text-xs flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> Processing…
                            </span>
                          )}
                          {(doc.status === "UPLOADED" || doc.status === "FAILED") && (
                            <button
                              onClick={() => handleRetry(doc.id)}
                              disabled={retryingId === doc.id}
                              className="text-secondary hover:text-secondary/80 text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Retry AI Processing"
                            >
                              {retryingId === doc.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            className="ml-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete document"
                          >
                            {deletingId === doc.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Quiz config modal triggered from table */}
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
