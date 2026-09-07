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
    <div className="space-y-8 max-w-5xl">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Mail className="text-red-400" size={32} /> Send Notifications
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Config */}
        <div className="space-y-6">
          {/* Template picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">1. Choose Notification Type</label>
            <div className="space-y-2">
              {templates.map(t => (
                <button key={t.key} onClick={() => setNotifType(t.key)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    notifType === t.key ? "border-red-500/50 bg-red-500/10 text-red-300" : "border-white/10 bg-surface hover:bg-white/5 text-gray-400"
                  }`}>
                  {TEMPLATE_LABELS[t.key] ?? t.subject}
                </button>
              ))}
            </div>
          </div>

          {/* Custom fields */}
          {notifType === "custom" && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-300">Custom Subject</label>
              <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary" />
              <label className="block text-sm font-semibold text-gray-300">Message Body</label>
              <textarea value={customBody} onChange={e => setCustomBody(e.target.value)}
                placeholder="Write your message here..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary min-h-[120px]" />
            </div>
          )}

          {/* Preview toggle */}
          {notifType !== "custom" && (
            <button onClick={() => setPreview(p => !p)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <Eye size={14} /> {preview ? "Hide preview" : "Preview message"}
            </button>
          )}

          {/* Recipient selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-300">2. Select Recipients ({selectedIds.size} selected)</label>
              <button onClick={toggleAll} className="text-xs text-gray-500 hover:text-white transition-colors">
                {selectedIds.size === users.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2">
              {users.map(u => (
                <label key={u.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedIds.has(u.id) ? "bg-red-500/10" : "hover:bg-white/5"
                }`}>
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleUser(u.id)}
                    className="accent-red-500 w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{u.username}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleSend} disabled={sending || selectedIds.size === 0}
            className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50">
            {sending ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : <><Send size={18} /> Dispatch to {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""}</>}
          </button>
        </div>

        {/* Right: Preview + Results */}
        <div className="space-y-6">
          {preview && notifType !== "custom" && (
            <div className="bg-surface border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Eye size={14} /> Message Preview</h3>
              <div className="text-xs text-gray-400 mb-1">Subject:</div>
              <div className="text-sm font-medium text-white mb-3">{currentTemplate?.subject}</div>
              <div className="text-xs text-gray-400 mb-1">Body (example for first recipient):</div>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans bg-black/30 p-3 rounded-lg">
                {`Bonjour ${users[0]?.username ?? "<username>"},\n\n...`}
              </pre>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-surface border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Users size={14} /> Dispatch Results
                <span className="ml-auto text-green-400">{results.filter(r => r.status === 'sent').length} sent</span>
                {results.some(r => r.status !== 'sent') && (
                  <span className="text-red-400">{results.filter(r => r.status !== 'sent').length} failed</span>
                )}
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {results.map(r => (
                  <div key={r.user_id} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                    r.status === 'sent' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <span>{r.username} <span className="text-gray-500">({r.email})</span></span>
                    <span className={`flex items-center gap-1 font-medium ${r.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>
                      {r.status === 'sent' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {r.status === 'sent' ? 'Sent' : `Failed: ${r.detail}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send History */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Mail size={18} className="text-yellow-400" /> Notification History
        </h2>
        <div className="bg-surface border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Sent by</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Action</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {history.map(log => {
                const isFailed = log.details?.toLowerCase().includes("failed");
                return (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="p-3 text-yellow-400">{log.admin}</td>
                    <td className="p-3 text-gray-300">{log.target_user}</td>
                    <td className="p-3 text-gray-400 max-w-xs truncate" title={log.action}>{log.action}</td>
                    <td className="p-3">
                      <span className={`flex items-center gap-1 ${isFailed ? 'text-red-400' : 'text-green-400'}`}>
                        {isFailed ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        {isFailed ? "Failed" : "Sent"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                  </tr>
                );
              })}
              {history.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No emails sent yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


interface User {
  id: number;
  username: string;
  email: string;
}

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/admin/users/");
      setUsers(res.data);
    } catch (err: any) {
      setError("Failed to load users for dispatch.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !subject || !message) return;
    
    setSending(true);
    try {
      await api.post("/users/admin/send-email/", {
        user_id: selectedUser,
        subject,
        message
      });
      alert("Email sent successfully!");
      setSubject("");
      setMessage("");
    } catch (err) {
      alert("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-6 bg-red-500/10 text-red-400 rounded-xl">
        <AlertCircle size={24} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Mail className="text-primary" size={32} />
        Email Dispatch
      </h1>
      
      <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-2xl">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select User</label>
            <select 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 focus:border-primary focus:outline-none"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="">-- Choose a user --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input 
              type="text"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 focus:border-primary focus:outline-none"
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Content</label>
            <textarea 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 focus:border-primary focus:outline-none min-h-[200px]"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={sending}
            className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {sending ? "Sending..." : "Dispatch Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
