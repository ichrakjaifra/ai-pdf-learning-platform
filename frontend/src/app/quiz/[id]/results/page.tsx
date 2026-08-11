"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw, ArrowLeft, FileText, Trophy } from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";

interface QuestionDetail {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_chunk_ids: number[];
}

interface FeedbackEntry {
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  score?: number;
  feedback?: string;
  explanation: string;
  source_chunk_ids: number[];
}

interface ChunkInfo {
  id: number;
  page_number: number;
  content: string;
}

export default function QuizResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const score = parseFloat(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "0");
  const correct = parseFloat(searchParams.get("correct") || "0");
  const feedbackRaw = searchParams.get("feedback");

  const [evaluationFeedback, setEvaluationFeedback] = useState<Record<string, FeedbackEntry>>({});
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [chunks, setChunks] = useState<Record<number, ChunkInfo>>({});
  const [documentId, setDocumentId] = useState<number | null>(null);

  useEffect(() => {
    if (feedbackRaw) {
      try {
        setEvaluationFeedback(JSON.parse(decodeURIComponent(feedbackRaw)));
      } catch {}
    }
    // Fetch quiz with full question details
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/`);
        setQuestions(res.data.questions || []);
        // Extract the linked document ID so we can navigate back to the chat
        if (res.data.documents && res.data.documents.length > 0) {
          setDocumentId(res.data.documents[0]);
        }
      } catch {}
    };
    if (id) fetchDetails();
  }, [id, feedbackRaw]);

  const scoreColor = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const scoreBg = score >= 80 ? "bg-green-500/10 border-green-500/30" : score >= 60 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30";
  const scoreEmoji = score >= 80 ? "🏆" : score >= 60 ? "📚" : "💪";
  const scoreMessage = score >= 80 ? "Excellent work!" : score >= 60 ? "Good job! Keep studying." : "Keep practicing — you'll get there!";

  const questionIds = Object.keys(evaluationFeedback);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Score Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx("glass-card rounded-2xl p-8 mb-10 border text-center", scoreBg)}
        >
          <div className="text-5xl mb-3">{scoreEmoji}</div>
          <h1 className="text-3xl font-bold mb-1">
            <span className={scoreColor}>{score}%</span>
          </h1>
          <p className="text-gray-300 text-lg mb-2">{scoreMessage}</p>
          <p className="text-gray-500 text-sm">
            You answered <span className="text-white font-semibold">{Math.round(correct)}</span> out of{" "}
            <span className="text-white font-semibold">{total}</span> questions correctly
          </p>
        </motion.div>

        {/* Per-Question Review */}
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Question Review
        </h2>

        <div className="space-y-5">
          {questionIds.map((qid, idx) => {
            const fb = evaluationFeedback[qid];
            const question = questions.find((q) => String(q.id) === qid);
            const isCorrect = fb.is_correct;
            const isOpen = question?.question_type === "OPEN";

            return (
              <motion.div
                key={qid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-2xl p-6 border border-white/5"
              >
                {/* Question header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                  )}>
                    {isCorrect ? (
                      <CheckCircle2 size={18} className="text-green-400" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">Question {idx + 1}</span>
                      {question && (
                        <span className="text-xs px-2 py-0.5 rounded bg-surface border border-white/10 text-gray-400">
                          {question.question_type === "MCQ" ? "Multiple Choice" :
                           question.question_type === "TF" ? "True/False" : "Open Ended"}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-200">
                      {question?.question_text || `Question ID: ${qid}`}
                    </p>
                  </div>
                </div>

                {/* Answer comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className={clsx(
                    "p-3 rounded-xl border text-sm",
                    isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                  )}>
                    <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                    <p className={clsx("font-medium", isCorrect ? "text-green-300" : "text-red-300")}>
                      {fb.user_answer || <span className="italic text-gray-600">Not answered</span>}
                    </p>
                  </div>
                  {!isCorrect && (
                    <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/5 text-sm">
                      <p className="text-xs text-gray-500 mb-1">Correct Answer</p>
                      <p className="font-medium text-green-300">{fb.correct_answer}</p>
                    </div>
                  )}
                </div>

                {/* Open question AI feedback */}
                {isOpen && fb.feedback && (
                  <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm">
                    <p className="text-xs text-purple-400 mb-1 font-semibold">AI Feedback</p>
                    <p className="text-gray-300">{fb.feedback}</p>
                    {fb.score !== undefined && (
                      <p className="text-purple-400 text-xs mt-1">Score: {(fb.score * 100).toFixed(0)}%</p>
                    )}
                  </div>
                )}

                {/* Explanation */}
                <div className="p-3 rounded-xl bg-surface border border-white/5 text-sm">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Explanation</p>
                  <p className="text-gray-300 leading-relaxed">{fb.explanation}</p>
                </div>

                {/* Source chunk reference */}
                {fb.source_chunk_ids && fb.source_chunk_ids.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <FileText size={12} className="text-primary" />
                    <span>Source: Chunk{fb.source_chunk_ids.length > 1 ? "s" : ""} #{fb.source_chunk_ids.join(", #")}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => documentId ? router.push(`/chat/${documentId}`) : router.push('/dashboard/documents')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-surface transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Back to Chat
          </button>
          <button
            onClick={() => router.push(`/quiz/${id}`)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
          >
            <RotateCcw size={16} /> Retry Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
