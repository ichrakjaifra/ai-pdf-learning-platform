"use client";

import { useState } from "react";
import { X, Sliders, BookOpen, Target, Layers } from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface QuizConfigModalProps {
  documentId: number;
  documentTitle: string;
  onClose: () => void;
}

const SCOPE_OPTIONS = [
  { value: "FULL", label: "Entire Document", description: "Covers all content in the document", icon: "📄" },
  { value: "CHAPTER", label: "Chapter Focus", description: "Focuses on a specific section or chapter", icon: "📖" },
  { value: "COMPLEX", label: "Complex Concepts", description: "Focuses on dense, analytical content only", icon: "🔬" },
];

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  { value: "HARD", label: "Hard", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { value: "ADAPTIVE", label: "Adaptive", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "MCQ", label: "Multiple Choice", description: "4-option questions", icon: "☑️" },
  { value: "TF", label: "True / False", description: "Binary judgment questions", icon: "⚖️" },
  { value: "OPEN", label: "Open Ended", description: "AI-graded short answers", icon: "✍️" },
];

export default function QuizConfigModal({ documentId, documentTitle, onClose }: QuizConfigModalProps) {
  const router = useRouter();
  const [scope, setScope] = useState("FULL");
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<string[]>(["MCQ"]);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleType = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (questionTypes.length === 0) {
      setError("Please select at least one question type.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/quizzes/generate/", {
        document_id: documentId,
        scope,
        num_questions: numQuestions,
        question_types: questionTypes,
        difficulty,
      });
      router.push(`/quiz/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 border border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Generate Quiz</h2>
            <p className="text-gray-400 text-sm mt-1 truncate max-w-xs">{documentTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scope */}
        <section className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
            <BookOpen size={16} className="text-primary" /> Quiz Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  scope === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-surface/50 hover:bg-surface"
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-gray-500 text-xs mt-1">{opt.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Number of Questions */}
        <section className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
            <Sliders size={16} className="text-primary" /> Number of Questions:{" "}
            <span className="text-primary font-bold">{numQuestions}</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">5</span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="flex-1 accent-primary h-2 rounded-full cursor-pointer"
            />
            <span className="text-gray-500 text-sm">50</span>
          </div>
        </section>

        {/* Question Types */}
        <section className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
            <Layers size={16} className="text-primary" /> Question Types
          </label>
          <div className="grid grid-cols-3 gap-3">
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleType(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  questionTypes.includes(opt.value)
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-surface/50 hover:bg-surface"
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-gray-500 text-xs mt-1">{opt.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="mb-8">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
            <Target size={16} className="text-primary" /> Difficulty Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                  difficulty === opt.value ? opt.color : "border-white/10 bg-surface/50 text-gray-400 hover:bg-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-surface transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || questionTypes.length === 0}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating with AI...
              </>
            ) : (
              `Generate ${numQuestions} Questions`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
