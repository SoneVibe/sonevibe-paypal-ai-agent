import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function contentSecurityPolicy(mode: string, env: Record<string, string>): Plugin {
  return {
    name: "sandbox-csp",
    transformIndexHtml(html) {
      const apiBase = env.VITE_API_BASE || "http://localhost:8787/api";
      let apiOrigin = "http://localhost:8787";
      try {
        apiOrigin = new URL(apiBase).origin;
      } catch {
        apiOrigin = "http://localhost:8787";
      }
      const dev = mode !== "production";
      const scriptSrc = ["'self'", "https://www.sandbox.paypal.com", dev ? "'unsafe-inline'" : ""]
        .filter(Boolean)
        .join(" ");
      const connectSrc = [
        "'self'",
        apiOrigin,
        "https://www.sandbox.paypal.com",
        "https://www.paypal.com",
        "https://api-m.sandbox.paypal.com",
        dev ? "ws:" : "",
        dev ? "http://localhost:5173" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const policy = [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        "style-src 'self' 'unsafe-inline'",
        `connect-src ${connectSrc}`,
        "frame-src https://www.sandbox.paypal.com https://www.paypal.com",
        "img-src 'self' data: https://www.sandbox.paypal.com https://www.paypal.com",
        "font-src 'self' https://www.sandbox.paypal.com https://www.paypal.com",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://www.sandbox.paypal.com https://www.paypal.com",
      ].join("; ");
      return html.replaceAll("__CSP__", policy);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  return {
    plugins: [react(), contentSecurityPolicy(mode, env)],
    resolve: {
      alias: {
        "@sonevibe/shared": path.resolve(rootDir, "../shared/src/index.ts"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      env: {
        VITE_API_BASE: "http://localhost:8787/api",
        VITE_USE_MOCK: "false",
      },
    },
  };
});
