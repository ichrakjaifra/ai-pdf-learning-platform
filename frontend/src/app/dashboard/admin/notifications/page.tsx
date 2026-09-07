"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Loader2, AlertCircle, Send, Eye, CheckCircle, XCircle, Users } from "lucide-react";
import api from "@/lib/axios";

interface User { id: number; username: string; email: string; }
interface Template { key: string; subject: string; }
interface SendResult { user_id: number; username: string; email: string; status: string; detail: string; }
interface HistoryEntry { id: number; admin: string; action: string; target_user: string; timestamp: string; details: string; }

const TEMPLATE_LABELS: Record<string, string> = {
  revision_reminder: "📚 Rappel de révision",
  new_document: "📄 Nouveau document disponible",
  quiz_result: "🎯 Résultat de quiz",
  pedagogical_recommendation: "💡 Recommandation pédagogique",
  custom: "✍️ Message personnalisé",
};

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [notifType, setNotifType] = useState("revision_reminder");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, templatesRes, historyRes] = await Promise.all([
        api.get("/users/admin/users/"),
        api.get("/users/admin/notification-templates/"),
        api.get("/users/admin/audit-log/"),
      ]);
      setUsers(usersRes.data);
      setTemplates(templatesRes.data);
      setHistory(historyRes.data.filter((l: HistoryEntry) => l.action.includes("Email dispatch")));
    } catch (err: any) {
      setError(err.response?.status === 403 ? "Access denied. Admin only." : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleUser = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === users.length ? new Set() : new Set(users.map(u => u.id)));
  };

  const currentTemplate = templates.find(t => t.key === notifType);
  const previewSubject = notifType === "custom" ? customSubject : (currentTemplate?.subject ?? "");

  const handleSend = async () => {
    if (selectedIds.size === 0) { alert("Please select at least one recipient."); return; }
    if (notifType === "custom" && (!customSubject.trim() || !customBody.trim())) {
      alert("Custom messages require a subject and body."); return;
    }
    setSending(true);
    setResults([]);
    try {
      const res = await api.post("/users/admin/send-email/", {
        user_ids: Array.from(selectedIds),
        notification_type: notifType,
        subject: customSubject,
        message: customBody,
      });
      setResults(res.data.results);
      fetchData();
    } catch {
      alert("Failed to dispatch notifications.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (error) return <div className="flex items-center gap-3 p-6 bg-red-500/10 text-red-400 rounded-xl"><AlertCircle size={24} /><span>{error}</span></div>;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Mail className="text-red-400" size={32} /> Send Notifications
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Config */}
        <div className="space-y-6">
          {/* Step 1: Template picker */}
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-300 mb-4">1. Choose Notification Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(t => (
                <button key={t.key} onClick={() => setNotifType(t.key)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    notifType === t.key ? "border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/10 bg-black/20 hover:bg-white/5 text-gray-400"
                  }`}>
                  {TEMPLATE_LABELS[t.key] ?? t.subject}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Recipient selection */}
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-300">2. Select Recipients ({selectedIds.size} selected)</label>
              <button onClick={toggleAll} className="text-xs text-gray-500 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10">
                {selectedIds.size === users.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2 bg-black/20">
              {users.map(u => (
                <label key={u.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  selectedIds.has(u.id) ? "bg-red-500/10 border border-red-500/20" : "border border-transparent hover:bg-white/5"
                }`}>
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleUser(u.id)}
                    className="accent-red-500 w-4 h-4 rounded" />
                  <div>
                    <div className="text-sm font-medium">{u.username}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Preview, Custom Inputs, & Dispatch */}
        <div className="space-y-6">
          {/* Custom fields (only if custom is selected) */}
          {notifType === "custom" && (
            <div className="bg-surface border border-white/10 rounded-2xl p-5 space-y-4">
              <label className="block text-sm font-semibold text-gray-300 mb-1">Message Content</label>
              <div className="space-y-3">
                <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50 transition-colors" />
                <textarea value={customBody} onChange={e => setCustomBody(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50 min-h-[160px] transition-colors resize-none" />
              </div>
            </div>
          )}

          {/* Message Preview Panel (always show, but content differs) */}
          <div className="bg-surface border border-white/10 rounded-2xl p-5 flex flex-col h-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Eye size={16} /> Live Preview</h3>
            </div>
            
            <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-4 overflow-y-auto min-h-[120px]">
              <div className="text-xs text-gray-500 mb-1">Subject:</div>
              <div className="text-sm font-medium text-white mb-4 border-b border-white/10 pb-3">
                {notifType === "custom" ? (customSubject || "No subject") : currentTemplate?.subject}
              </div>
              <div className="text-xs text-gray-500 mb-2">Body (example format):</div>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                {notifType === "custom" 
                  ? (customBody || "No message body...")
                  : `Bonjour <username>,\n\n...`
                }
              </pre>
            </div>
          </div>

          {/* Action Panel & Results */}
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
             <button onClick={handleSend} disabled={sending || selectedIds.size === 0}
               className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-red-600">
               {sending ? <><Loader2 className="animate-spin" size={18} /> Dispatching...</> : <><Send size={18} /> Dispatch to {selectedIds.size} recipient{selectedIds.size !== 1 ? "s" : ""}</>}
             </button>

            {results.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Users size={14} /> Dispatch Results</div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-400 font-medium">{results.filter(r => r.status === 'sent').length} sent</span>
                    {results.some(r => r.status !== 'sent') && (
                      <span className="text-red-400 font-medium">{results.filter(r => r.status !== 'sent').length} failed</span>
                    )}
                  </div>
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {results.map(r => (
                    <div key={r.user_id} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
                      r.status === 'sent' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <span className="truncate mr-2">{r.username} <span className="text-gray-500 hidden sm:inline">({r.email})</span></span>
                      <span className={`flex items-center gap-1.5 font-medium shrink-0 ${r.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>
                        {r.status === 'sent' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {r.status === 'sent' ? 'Sent' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send History */}
      <div className="mt-8 bg-surface border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Mail size={20} className="text-yellow-400" /> Notification History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Sent by</th>
                <th className="p-4 font-semibold">Recipient</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {history.map(log => {
                const isFailed = log.details?.toLowerCase().includes("failed");
                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-yellow-400 font-medium">{log.admin}</td>
                    <td className="p-4 font-medium">{log.target_user}</td>
                    <td className="p-4 text-gray-400 max-w-md truncate" title={log.action}>{log.action}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isFailed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {isFailed ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        {isFailed ? "Failed" : "Sent"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-right">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Mail size={32} className="opacity-20" />
                      No emails sent yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
