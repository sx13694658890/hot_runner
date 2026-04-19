import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 从「仅含 origin」的 base URL 得到代理 target（不含路径） */
function proxyTargetFromBase(base: string): string | null {
  const t = base.trim().replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  if (!t || t.startsWith("/")) return null;
  try {
    return new URL(t).origin;
  } catch {
    return null;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const explicit = env.VITE_API_PROXY_TARGET?.trim();
  const fromBase = proxyTargetFromBase(env.VITE_API_BASE_URL ?? "");
  const proxyTarget = explicit || fromBase || "http://127.0.0.1:8009";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3679,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/health": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
