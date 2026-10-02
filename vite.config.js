import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleAdminRequest } from "./functions/_lib/admin-handler.js";
import { loadSiteData, publicContentFrom } from "./functions/_lib/content-store.js";
import { error, json } from "./functions/_lib/response.js";

/**
 * Plugin dev-only: menjalankan Pages Functions yang sama di `vite dev`
 * sehingga Portal Admin bisa dicoba tanpa `wrangler pages dev`.
 * Membaca .env (termasuk TELEGRAPH_*) bila ada; tanpa itu berjalan di mode demo.
 */
function devApiPlugin() {
  return {
    name: "pmr-dev-api",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) return next();

        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks);

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === "string") headers.set(key, value);
          else if (Array.isArray(value)) headers.set(key, value.join(", "));
        }

        const request = new Request(url, {
          method: req.method,
          headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : rawBody,
        });
        const context = { request, env, waitUntil() {}, params: {} };
        const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
        const route = parts[0] || "content";

        let response;
        try {
          if (route === "admin") {
            response = await handleAdminRequest(context, parts.slice(1).join("/") || "data");
          } else if (route === "health") {
            response = json(
              {
                ok: true,
                database: Boolean(env.TELEGRAPH_URL && env.TELEGRAPH_API_KEY),
                source: env.TELEGRAPH_URL && env.TELEGRAPH_API_KEY ? "telegraph" : "demo",
                backend: "telegraph-cloud",
                timestamp: new Date().toISOString(),
              },
              200,
              request,
            );
          } else if (route === "media") {
            response = error("Object storage hanya aktif di runtime Cloudflare Pages.", 503, request);
          } else if (["content", "gallery", "events"].includes(route)) {
            const site = await loadSiteData(env);
            const content = publicContentFrom(site);
            response = json(route === "content" ? content : content[route], 200, request);
          } else {
            response = error("Endpoint tidak ditemukan.", 404, request);
          }
        } catch (cause) {
          response = error(cause.message || "Kesalahan server dev.", 500, request);
        }

        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  build: {
    target: "es2022",
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true, // pratinjau Arena memakai host dinamis
  },
});
