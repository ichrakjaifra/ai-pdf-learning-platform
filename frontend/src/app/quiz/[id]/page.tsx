"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";

interface Question {
  id: number;
  question_text: string;
  question_type: "MCQ" | "TF" | "OPEN";
  options: string[];
  difficulty: string;
  source_chunk_ids: number[];
}

interface QuizData {
  id: number;
  title: string;
  difficulty: string;
  scope: string;
  total_questions: number;
  questions: Question[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
  ADAPTIVE: "text-purple-400",
};

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/`);
        setQuiz(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuiz();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background text-primary">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={40} />
        <p className="text-gray-400">Loading your quiz...</p>
      </div>
    </div>
  );

  if (error || !quiz) return (
    <div className="flex items-center justify-center h-screen bg-background text-red-400 gap-3">
      <AlertCircle size={30} />
      <span>{error || "Quiz not found."}</span>
    </div>
  );

  const questions = quiz.questions;
  const q = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex) / totalQuestions) * 100;
  const currentAnswer = answers[String(q.id)] || "";
  const isAnswered = currentAnswer.trim() !== "";
  const isLast = currentIndex === totalQuestions - 1;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [String(q.id)]: value }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${quiz.id}/submit`, { answers });
      router.push(`/quiz/${quiz.id}/results?score=${res.data.score}&total=${res.data.total}&correct=${res.data.correct}&feedback=${encodeURIComponent(JSON.stringify(res.data.evaluation_feedback))}`);
    } catch (err: any) {
      console.error("Quiz submission error:", err.response?.data || err);
      alert(err.response?.data?.error || "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold truncate max-w-sm">{quiz.title}</h1>
            <p className={clsx("text-sm font-medium mt-1", DIFFICULTY_COLORS[quiz.difficulty])}>
              {quiz.difficulty} · {quiz.scope === "FULL" ? "Full Document" : quiz.scope === "CHAPTER" ? "Chapter Focus" : "Complex Concepts"}
            </p>
          </div>
          <div className="px-4 py-2 glass rounded-xl text-sm font-semibold">
            {currentIndex + 1} / {totalQuestions}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface rounded-full h-1.5 mb-10">
          <motion.div
            className="bg-primary h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 md:p-10 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-md bg-surface border border-white/10 text-gray-400">
                {q.question_type === "MCQ" ? "Multiple Choice" : q.question_type === "TF" ? "True / False" : "Open Ended"}
              </span>
              <span className={clsx("text-xs font-medium", DIFFICULTY_COLORS[q.difficulty])}>{q.difficulty}</span>
            </div>

            <h2 className="text-xl font-semibold mb-8 leading-relaxed">{q.question_text}</h2>

            {/* MCQ Options */}
            {q.question_type === "MCQ" && (
              <div className="space-y-3">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className={clsx(
                      "w-full text-left px-6 py-4 rounded-xl border transition-all",
                      currentAnswer === opt
                        ? "border-primary bg-primary/10 text-white"
                        : "border-white/10 bg-surface/50 text-gray-300 hover:bg-surface hover:border-white/20"
                    )}
                  >
                    <span className="font-medium mr-3 text-gray-500">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* True/False Options */}
            {q.question_type === "TF" && (
              <div className="grid grid-cols-2 gap-4">
                {["True", "False"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={clsx(
                      "py-5 rounded-xl border font-bold text-lg transition-all",
                      currentAnswer === opt
                        ? opt === "True"
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-red-500 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-surface/50 text-gray-300 hover:bg-surface"
                    )}
                  >
                    {opt === "True" ? "✓ True" : "✗ False"}
                  </button>
                ))}
              </div>
            )}

            {/* Open Ended */}
            {q.question_type === "OPEN" && (
              <textarea
                value={currentAnswer}
                onChange={(e) => handleSelect(e.target.value)}
                placeholder="Write your answer here..."
                rows={5}
                className="w-full bg-surface border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-primary transition-colors"
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-10">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-surface disabled:opacity-30 transition-colors text-sm"
              >
                ← Previous
              </button>

              {!isLast ? (
                <button
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-all"
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isAnswered || submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-all"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Grading...</>
                  ) : (
                    <>Submit Quiz ✓</>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Answer progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          {questions.map((question, idx) => (
            <button
              key={question.id}
              onClick={() => setCurrentIndex(idx)}
              className={clsx(
                "w-3 h-3 rounded-full transition-all",
                idx === currentIndex ? "bg-primary scale-125" :
                answers[String(question.id)] ? "bg-accent" : "bg-white/20"
              )}
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          {Object.keys(answers).length} of {totalQuestions} answered
        </p>
      </div>
    </div>
  );
}
