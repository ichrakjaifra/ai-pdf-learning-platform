"use client";

import { useState } from "react";
import { Send, User, Bot, FileText } from "lucide-react";
import clsx from "clsx";

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "ai", content: "Hello! I have analyzed your document. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: input };
    setMessages([...messages, userMsg]);
    setInput("");

    // Simulate SSE / Streaming response
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now()+1, role: "ai", content: "Generating response based on your document chunks..." }]);
    }, 500);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col border-r border-white/10">
        <header className="p-4 glass border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold">AI Tutor Chat</h2>
          <button className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/30">
            Generate Quiz
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={clsx("flex gap-4 max-w-3xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", msg.role === "user" ? "bg-secondary" : "bg-primary")}>
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={clsx("p-4 rounded-2xl glass-card", msg.role === "user" ? "bg-secondary/10" : "bg-surface/50")}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 glass border-t border-white/10">
          <div className="relative">
            <input 
              type="text" 
              className="w-full bg-surface border border-white/10 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-primary text-sm"
              placeholder="Ask a question about your document..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* PDF Viewer Side Panel */}
      <div className="w-1/3 hidden lg:flex flex-col bg-surface">
        <header className="p-4 border-b border-white/10 flex items-center gap-2 text-gray-400">
          <FileText size={18} />
          <span className="font-medium text-sm">Document Reference</span>
        </header>
        <div className="flex-1 p-8 flex items-center justify-center text-center text-gray-500">
          PDF viewer will be rendered here.<br/>
          (react-pdf or iframe)
        </div>
      </div>
    </div>
  );
}
