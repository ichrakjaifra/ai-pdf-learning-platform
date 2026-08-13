"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredBanner, setRegisteredBanner] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  // Show success toast when redirected from registration
  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setRegisteredBanner(true);
      const t = setTimeout(() => setRegisteredBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/users/login", { username, password });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      const userRes = await api.get("/users/me");
      setUser(userRes.data);
      router.push("/dashboard");
    } catch (err: any) {
      if (!err.response) {
        setError("Unable to reach the server. Please ensure the Django backend is running at http://127.0.0.1:8000.");
      } else {
        setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Welcome Back</h1>

        {/* Registration success toast */}
        <AnimatePresence>
          {registeredBanner && (
            <motion.div
              key="reg-success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 mb-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm"
            >
              <CheckCircle size={18} className="shrink-0" />
              <span>Account created successfully! You can now sign in.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="login-username" className="block text-sm text-gray-400 mb-1">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-secondary hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
