"use client";

import { motion } from "framer-motion";
import { FileText, MessageSquare, BrainCircuit } from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatsCard icon={<FileText className="text-primary" size={24} />} title="Total Documents" value="12" />
        <StatsCard icon={<MessageSquare className="text-secondary" size={24} />} title="Chats Initiated" value="34" />
        <StatsCard icon={<BrainCircuit className="text-accent" size={24} />} title="Quizzes Passed" value="8" />
      </div>

      <h2 className="text-xl font-bold mb-6">Recent Documents</h2>
      <div className="glass-card overflow-hidden">
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
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-4 flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                Machine_Learning_Notes.pdf
              </td>
              <td className="p-4">
                <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-semibold">READY</span>
              </td>
              <td className="p-4 text-gray-400">Oct 24, 2026</td>
              <td className="p-4">
                <button className="text-secondary hover:underline">Chat</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatsCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex items-center gap-6"
    >
      <div className="p-4 bg-surface rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
    </motion.div>
  );
}
