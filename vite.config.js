import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The browser bundle never sees Telegraph Cloud credentials. Every remote read
// or write goes through the Pages Function adapter under /api/*.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Sandbox/preview hosts (…e2b.app) must not be rejected by the host check.
    allowedHosts: true,
    // The Vite dev server proxies the BFF routes so the preview origin works
    // exactly like production without exposing any secret to the browser.
    proxy: {
      "/api": {
        target: process.env.PMR_API_PROXY || "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },
});
