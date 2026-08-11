"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, FileText, Loader2, AlertCircle, Trash2, Sparkles } from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import QuizConfigModal from "@/components/QuizConfigModal";

interface Message {
  id?: number;
  role: "user" | "ai";
  content: string;
  isError?: boolean;
}

export default function ChatPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [showQuizModal, setShowQuizModal] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/chat/${id}/`);
        const session = res.data;
        setSessionId(session.id);
        setMessages(session.messages || []);
        
        if (session.document_details) {
          setPdfUrl(session.document_details.file_url);
          setDocumentId(session.document_details.id);
          setDocumentTitle(session.document_details.title || "Document");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load chat session.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSession();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !sessionId) return;

    const userText = input;
    const userMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await api.post("/chat/message/", {
        chat_session: sessionId,
        content: userText,
        role: "user"
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev, 
        { role: "ai", content: err.response?.data?.error || "An error occurred while generating the response.", isError: true }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;
    if (!confirm("Are you sure you want to clear this chat history?")) return;
    try {
      await api.delete(`/chat/${sessionId}/messages/`);
      setMessages([]);
    } catch {
      alert("Failed to clear chat history.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-red-500 gap-3">
        <AlertCircle size={30} />
        <span className="text-lg">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col border-r border-white/10">
        <header className="p-4 glass border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold">AI Tutor Chat</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClear}
              disabled={messages.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Clear Chat
            </button>
            <button
              onClick={() => setShowQuizModal(true)}
              disabled={!documentId}
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} />
              Generate Quiz
            </button>
          </div>
        </header>

        {showQuizModal && documentId && (
          <QuizConfigModal
            documentId={documentId}
            documentTitle={documentTitle}
            onClose={() => setShowQuizModal(false)}
          />
        )}
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <Bot size={40} className="mx-auto mb-4 opacity-50" />
              <p>Hello! I have analyzed your document. What would you like to know?</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={clsx("flex gap-4 max-w-3xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", msg.role === "user" ? "bg-secondary" : "bg-primary")}>
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={clsx("p-4 rounded-2xl glass-card", msg.role === "user" ? "bg-secondary/10" : "bg-surface/50", msg.isError ? "border-red-500/50 bg-red-500/10 text-red-400" : "")}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary">
                <Bot size={20} />
              </div>
              <div className="p-4 rounded-2xl glass-card bg-surface/50 flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin text-primary" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 glass border-t border-white/10">
          <div className="relative">
            <input 
              type="text" 
              className="w-full bg-surface border border-white/10 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-primary text-sm disabled:opacity-50"
              placeholder="Ask a question about your document..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              disabled={isTyping || !input.trim()}
              className="absolute right-2 top-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
            >
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
        <div className="flex-1 overflow-hidden bg-black/20">
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border-none"
              title="PDF Viewer"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No document available to render.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
