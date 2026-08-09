"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Mock data
  const questions = [
    {
      id: 1,
      text: "What is Retrieval-Augmented Generation (RAG)?",
      options: [
        "A method to generate random text.",
        "A technique that enhances LLMs by retrieving relevant information from an external database.",
        "A new programming language.",
        "A type of neural network layer."
      ],
      correct: 1,
      explanation: "RAG retrieves relevant chunks from a vector database and provides them as context to the LLM."
    }
  ];

  const q = questions[currentQuestion];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="flex h-screen bg-background items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Concept Review Quiz</h1>
          <div className="px-4 py-2 bg-surface rounded-lg text-sm font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </header>
        
        <div className="w-full bg-surface rounded-full h-1 mb-12">
          <div className="bg-primary h-full rounded-full" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>

        <motion.div 
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 md:p-12"
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-8">{q.text}</h2>
          
          <div className="space-y-4">
            {q.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = submitted && idx === q.correct;
              const isWrong = submitted && isSelected && idx !== q.correct;
              
              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setSelectedOption(idx)}
                  className={clsx(
                    "w-full text-left p-6 rounded-xl border transition-all flex items-center justify-between",
                    isSelected && !submitted ? "border-primary bg-primary/10" : "border-white/10 bg-surface/50 hover:bg-surface",
                    isCorrect && "border-accent bg-accent/10",
                    isWrong && "border-error bg-error/10"
                  )}
                >
                  <span>{opt}</span>
                  {isCorrect && <CheckCircle2 className="text-accent" />}
                  {isWrong && <XCircle className="text-error" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 p-6 rounded-xl bg-surface border border-white/5"
            >
              <h4 className="font-semibold text-gray-300 mb-2">Explanation</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{q.explanation}</p>
            </motion.div>
          )}

          <div className="mt-12 flex justify-end">
            {!submitted ? (
              <button 
                onClick={handleSubmit} 
                disabled={selectedOption === null}
                className="px-8 py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <button 
                className="px-8 py-4 glass hover:bg-surface font-bold rounded-xl transition-all"
              >
                Next Question
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
