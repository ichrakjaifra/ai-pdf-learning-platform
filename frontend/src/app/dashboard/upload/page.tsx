"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle } from "lucide-react";
import clsx from "clsx";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "ready">("idle");
  const [progress, setProgress] = useState(0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setStatus("uploading");
    
    // Simulate upload and processing
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStatus("processing");
        setTimeout(() => setStatus("ready"), 3000);
      }
    }, 300);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <h1 className="text-3xl font-bold mb-8">Upload Document</h1>
      
      <div 
        className={clsx(
          "glass-card p-12 border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
          file ? "border-primary bg-primary/5" : "border-white/20 hover:border-white/40"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadCloud size={48} className={clsx("mb-4", file ? "text-primary" : "text-gray-400")} />
        <h3 className="text-xl font-semibold mb-2">
          {file ? file.name : "Drag & Drop your PDF here"}
        </h3>
        <p className="text-gray-400 mb-6">
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Supports PDF files up to 50MB"}
        </p>
        
        {!file && (
          <label className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer font-medium transition-colors">
            Browse Files
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        )}
      </div>

      {file && status === "idle" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex justify-end">
          <button onClick={handleUpload} className="px-8 py-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20">
            Start Upload
          </button>
        </motion.div>
      )}

      {status !== "idle" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">
              {status === "uploading" ? "Uploading to secure storage..." : status === "processing" ? "AI is processing and generating vectors..." : "Ready!"}
            </span>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden mb-4">
            <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          
          {status === "ready" && (
            <div className="flex items-center gap-2 text-accent bg-accent/10 p-4 rounded-xl">
              <CheckCircle size={20} />
              <span className="font-medium">Document vectorized successfully. You can now chat or generate a quiz.</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
