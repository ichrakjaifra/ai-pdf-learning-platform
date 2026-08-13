"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, AlertCircle, Trash2, Mail } from "lucide-react";
import api from "@/lib/axios";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  date_joined: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/admin/users/");
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.status === 403 ? "Forbidden. You are not an administrator." : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/admin/users/${id}/`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Failed to delete user.");
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
        <Users className="text-primary" size={32} />
        User Management
      </h1>
      
      <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-sm text-gray-400">
            <tr>
              <th className="p-4 font-medium">Username</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Joined</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium">{u.username}</td>
                <td className="p-4 text-gray-400">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${u.role === 'ADMIN' ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-gray-400">{new Date(u.date_joined).toLocaleDateString()}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
