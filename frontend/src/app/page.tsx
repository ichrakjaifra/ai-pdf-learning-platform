"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, BrainCircuit, LineChart } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl"
      >
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8">
          Transform PDFs into <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Interactive Learning
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Upload your documents, chat with our AI tutor, and auto-generate quizzes to test your knowledge. No more passive reading.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/register" className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
            Get Started <ArrowRight size={20} />
          </Link>
          <Link href="/auth/login" className="px-8 py-4 rounded-xl glass hover:bg-surface transition-all font-semibold">
            Login
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-6xl z-10"
      >
        <FeatureCard 
          icon={<FileText className="text-primary" size={32} />}
          title="Smart RAG Upload"
          description="Upload your PDFs and let our system process and vectorize the content for instant recall."
        />
        <FeatureCard 
          icon={<BrainCircuit className="text-secondary" size={32} />}
          title="AI Tutor Chat"
          description="Ask questions about your documents and get answers strictly based on the text to avoid hallucinations."
        />
        <FeatureCard 
          icon={<LineChart className="text-accent" size={32} />}
          title="Auto-Generated Quizzes"
          description="Test your knowledge with automatically generated MCQs and open-ended questions."
        />
      </motion.div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
      <div className="p-4 rounded-2xl bg-surface/50 mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
