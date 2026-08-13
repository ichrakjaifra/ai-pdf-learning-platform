import type { NextConfig } from "next";

const DJANGO_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "").replace(/\/api$/, "") ||
  "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // API Proxy Rewrites (local dev)
  // Requests from the browser to /api/* are forwarded by the Next.js dev
  // server to Django on 127.0.0.1:8000, making them same-origin from the
  // browser's perspective and eliminating CORS entirely during development.
  // ---------------------------------------------------------------------------
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${DJANGO_URL}/api/:path*`,
      },
    ];
  },

  // Silence noisy hydration warnings originating from browser extensions
  // (those inject classes/attributes before React hydration runs).
  // This is a dev-only quality-of-life setting; it has no effect in prod.
};

export default nextConfig;
