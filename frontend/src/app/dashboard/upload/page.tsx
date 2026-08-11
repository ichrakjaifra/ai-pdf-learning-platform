"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import clsx from "clsx";

type UploadStatus = "idle" | "requesting" | "uploading" | "notifying" | "ready" | "error";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const resetState = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMsg(null);
    setDocumentId(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setErrorMsg("Only PDF files are supported.");
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setErrorMsg(null);
    setProgress(0);

    try {
      // Step 1: Get a presigned URL from the backend (also creates the DB record)
      setStatus("requesting");
      const { data } = await api.post("/documents/generate-upload-url/", {
        filename: file.name,
        file_size: file.size,
      });

      const { upload_url, document_id } = data;
      setDocumentId(document_id);
      setProgress(10);

      // Step 2: PUT the file directly to MinIO/S3 using the presigned URL
      setStatus("uploading");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 80) + 10; // 10 → 90
            setProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));

        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", "application/pdf");
        xhr.send(file);
      });

      setProgress(90);

      // Step 3: Notify backend that upload is done → triggers AI pipeline
      setStatus("notifying");
      await api.post(`/documents/${document_id}/notify-ready/`);
      setProgress(100);
      setStatus("ready");

    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Upload failed. Please try again.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const statusLabel: Record<UploadStatus, string> = {
    idle:       "",
    requesting: "Preparing secure upload...",
    uploading:  "Uploading to secure storage...",
    notifying:  "Queuing AI processing pipeline...",
    ready:      "Document uploaded & queued for AI processing!",
    error:      "Upload failed",
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Upload Document</h1>
      </div>

      {/* Drop Zone */}
      <div
        className={clsx(
          "glass-card p-12 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer relative",
          isDragging && "border-primary bg-primary/10 scale-[1.01]",
          !isDragging && file ? "border-primary bg-primary/5" : !isDragging && "border-white/20 hover:border-white/40"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {file && status === "idle" && (
          <button
            onClick={(e) => { e.stopPropagation(); resetState(); }}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        )}

        <UploadCloud size={52} className={clsx("mb-4 transition-colors", file ? "text-primary" : "text-gray-400")} />

        <h3 className="text-xl font-semibold mb-2">
          {file ? file.name : "Drag & Drop your PDF here"}
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB · PDF`
            : "Supports PDF files up to 50MB"}
        </p>

        {!file && (
          <label className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer font-medium transition-colors text-sm">
            Browse Files
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {/* Upload Button */}
      {file && status === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-end"
        >
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20"
          >
            <UploadCloud size={18} />
            Start Upload
          </button>
        </motion.div>
      )}

      {/* Progress Panel */}
      {status !== "idle" && status !== "error" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">{statusLabel[status]}</span>
            <span className="text-sm text-gray-400 font-mono">{progress}%</span>
          </div>

          <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden mb-6">
            <motion.div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            {["Requesting", "Uploading", "Processing"].map((step, i) => {
              const thresholds = [10, 90, 100];
              const active = progress >= thresholds[i];
              return (
                <div key={step} className={clsx("flex items-center gap-1.5", active && "text-primary")}>
                  <div className={clsx("w-2 h-2 rounded-full", active ? "bg-primary" : "bg-surface border border-white/10")} />
                  {step}
                </div>
              );
            })}
          </div>

          {status === "ready" && (
            <div className="flex items-start gap-3 bg-accent/10 border border-accent/20 p-4 rounded-xl">
              <CheckCircle size={20} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-accent">Upload successful!</p>
                <p className="text-sm text-gray-400 mt-0.5 mb-3">
                  Your document is now being vectorized by the AI pipeline. This usually takes 1–3 minutes.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/documents"
                    className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
                  >
                    <ExternalLink size={14} /> View Documents
                  </Link>
                  <button
                    onClick={resetState}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Upload another
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Panel */}
      {status === "error" && errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-start gap-3 glass-card p-5 border border-red-500/30 bg-red-500/5"
        >
          <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Upload failed</p>
            <p className="text-sm text-gray-400 mt-0.5 mb-3">{errorMsg}</p>
            <button
              onClick={resetState}
              className="text-sm text-secondary hover:underline"
            >
              Try again
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
