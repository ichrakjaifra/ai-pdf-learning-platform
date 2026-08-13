"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, AlertCircle, Send } from "lucide-react";
import api from "@/lib/axios";

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
