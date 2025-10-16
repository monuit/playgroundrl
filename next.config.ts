import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = (isDev
  ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'"]
  : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'"]
).join(" ");

const securityHeaders = [
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "require-corp",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; script-src ${scriptSrc}; worker-src 'self' blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none';`,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disabled to prevent Scene unmount/remount
  outputFileTracingRoot: __dirname,
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
  experimental: {
    serverSourceMaps: true,
  },
};

export default nextConfig;
