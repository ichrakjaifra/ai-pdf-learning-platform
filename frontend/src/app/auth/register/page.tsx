"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";

/**
 * Parses DRF validation error responses into a flat list of human-readable strings.
 * DRF errors can be either:
 *  - { field: ["message"] }  (field-level)
 *  - { detail: "message" }   (non-field)
 */
function parseDrfErrors(data: Record<string, any>): string[] {
  const messages: string[] = [];
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (Array.isArray(value)) {
      for (const msg of value) {
        if (key === "non_field_errors" || key === "detail") {
          messages.push(String(msg));
        } else {
          // Capitalise the field name: "username" → "Username"
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          messages.push(`${label}: ${msg}`);
        }
      }
    } else if (typeof value === "string") {
      messages.push(value);
    }
  }
  return messages.length ? messages : ["Registration failed. Please try again."];
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      await api.post("/users/register/", {
        username,
        email,
        password,
        role: "APPRENANT",
      });

      setSuccess(true);
      // Redirect after a brief moment so the success message is visible
      setTimeout(() => router.push("/auth/login?registered=1"), 1800);
    } catch (err: any) {
      if (!err.response) {
        // Network-level error (server not reachable)
        setErrors([
          "Unable to reach the server. Please ensure the Django backend is running at http://127.0.0.1:8000.",
        ]);
      } else if (err.response.status === 400 && err.response.data) {
        setErrors(parseDrfErrors(err.response.data));
      } else {
        setErrors([`Server error (${err.response.status}). Please try again later.`]);
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
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Create Account</h1>

        {/* Success banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 mb-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400"
            >
              <CheckCircle size={20} className="shrink-0" />
              <span className="text-sm font-medium">
                Account created! Redirecting you to login…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banners */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              key="errors"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-4 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <ul className="space-y-1 list-none">
                  {errors.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="reg-username" className="block text-sm text-gray-400 mb-1">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              autoComplete="username"
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account…
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-secondary hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
