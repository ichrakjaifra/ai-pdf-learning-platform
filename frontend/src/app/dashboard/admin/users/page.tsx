"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Trash2, Shield, Search, CheckCircle, XCircle, Edit3, Save, X, ClipboardList } from "lucide-react";
import api from "@/lib/axios";

interface User {
  id: number;
  username: string;
  email: string;
  role: "APPRENANT" | "ADMINISTRATEUR";
  quota_documents: number;
  quota_storage_mb: number;
  is_active: boolean;
  date_joined: string;
}

interface AuditLog {
  id: number;
  admin: string;
  action: string;
  target_user: string;
  timestamp: string;
  details: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, auditRes] = await Promise.all([
        api.get("/users/admin/users/"),
        api.get("/users/admin/audit-log/"),
      ]);
      setUsers(usersRes.data);
      setAudit(auditRes.data);
    } catch (err: any) {
      setError(err.response?.status === 403 ? "Access denied. Admin only." : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditDraft({ role: user.role, quota_documents: user.quota_documents, quota_storage_mb: user.quota_storage_mb, is_active: user.is_active });
  };

  const saveEdit = async (userId: number) => {
    setSaving(true);
    try {
      await api.patch(`/users/admin/users/${userId}/`, editDraft);
      setSuccessMsg("User updated successfully.");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Permanently delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/admin/users/${id}/`);
      setUsers(u => u.filter(x => x.id !== id));
      setSuccessMsg(`User "${username}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      alert("Failed to delete user.");
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (error) return <div className="flex items-center gap-3 p-6 bg-red-500/10 text-red-400 rounded-xl"><AlertCircle size={24} /><span>{error}</span></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-red-400" size={32} /> User Management
          <span className="text-sm font-normal text-gray-500 ml-2">({users.length} users)</span>
        </h1>
        <button onClick={fetchData} className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
          <Loader2 size={14} /> Refresh
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input type="text" placeholder="Search by username or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface border border-white/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Quota Docs</th>
              <th className="p-4">Quota MB</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-medium">{u.username}</div>
                  <div className="text-gray-500 text-xs">{u.email}</div>
                </td>
                <td className="p-4">
                  {editingId === u.id ? (
                    <select value={editDraft.role}
                      onChange={e => setEditDraft(d => ({ ...d, role: e.target.value as any }))}
                      className="bg-black/50 border border-white/20 rounded-lg p-1 text-xs">
                      <option value="APPRENANT">APPRENANT</option>
                      <option value="ADMINISTRATEUR">ADMINISTRATEUR</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ADMINISTRATEUR' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {editingId === u.id
                    ? <input type="number" min={1} max={1000} value={editDraft.quota_documents}
                        onChange={e => setEditDraft(d => ({ ...d, quota_documents: Number(e.target.value) }))}
                        className="w-20 bg-black/50 border border-white/20 rounded-lg p-1 text-xs" />
                    : <span className="text-gray-300">{u.quota_documents}</span>}
                </td>
                <td className="p-4">
                  {editingId === u.id
                    ? <input type="number" min={10} max={50000} value={editDraft.quota_storage_mb}
                        onChange={e => setEditDraft(d => ({ ...d, quota_storage_mb: Number(e.target.value) }))}
                        className="w-24 bg-black/50 border border-white/20 rounded-lg p-1 text-xs" />
                    : <span className="text-gray-300">{u.quota_storage_mb} MB</span>}
                </td>
                <td className="p-4">
                  {editingId === u.id ? (
                    <button onClick={() => setEditDraft(d => ({ ...d, is_active: !d.is_active }))}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${editDraft.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {editDraft.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {editDraft.is_active ? 'Active' : 'Inactive'}
                    </button>
                  ) : (
                    <span className={`flex items-center gap-1 text-xs ${u.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                      {u.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-500 text-xs">{new Date(u.date_joined).toLocaleDateString('fr-FR')}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === u.id ? (
                      <>
                        <button onClick={() => saveEdit(u.id)} disabled={saving}
                          className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No users found.</div>}
      </div>

      {/* Audit Log */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <ClipboardList size={20} className="text-yellow-400" /> Audit Log
          <span className="text-sm font-normal text-gray-500">— last 100 admin actions</span>
        </h2>
        <div className="bg-surface border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Changes</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {audit.map(log => (
                <tr key={log.id} className="hover:bg-white/5">
                  <td className="p-3 text-yellow-400 font-medium">{log.admin}</td>
                  <td className="p-3 text-gray-300">{log.action}</td>
                  <td className="p-3 text-gray-400">{log.target_user}</td>
                  <td className="p-3 text-gray-500 max-w-xs truncate" title={log.details}>{log.details || '—'}</td>
                  <td className="p-3 text-gray-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No audit logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
