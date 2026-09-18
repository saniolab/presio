/// <reference types="vitest/config" />
import { readFile, writeFile } from "node:fs/promises"
import path from "path"
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Files outside the hashed bundle that the app still needs to open offline.
const SHELL_FILES = [
  "/",
  "/config.js",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icon-192.png",
  "/apple-touch-icon.png",
]

/**
 * Bakes the built file list into public/sw.js, which is otherwise copied
 * verbatim and has no way to know the hashed asset names it must precache.
 */
function precacheServiceWorker(): Plugin {
  let precache: string[] = []
  let buildId = ""

  return {
    name: "presio-precache-sw",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
        .map((file) => `/${file}`)
        .sort()
      const entry = Object.values(bundle).find((output) => output.type === "chunk" && output.isEntry)
      // The entry's content hash changes with every build, so it doubles as the
      // cache version: a deploy lands in a fresh cache and drops the old one.
      buildId = entry ? path.basename(entry.fileName) : String(Date.now())
      precache = [...SHELL_FILES, ...files]
    },
    async closeBundle() {
      const swPath = path.resolve(__dirname, "dist/sw.js")
      const source = await readFile(swPath, "utf8")
      const rewritten = source
        .replace('"__PRESIO_BUILD_ID__"', JSON.stringify(buildId))
        .replace('["__PRESIO_PRECACHE__"]', JSON.stringify(precache))
      // A silently unreplaced placeholder ships a service worker that caches
      // nothing, which only shows up as a broken page offline.
      if (rewritten === source) {
        throw new Error("sw.js is missing its __PRESIO_BUILD_ID__/__PRESIO_PRECACHE__ placeholders")
      }
      await writeFile(swPath, rewritten)
    },
  }
}

export default defineConfig({
  plugins: [react(), precacheServiceWorker()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/config.js": "http://localhost:3001",
      "/api": "http://localhost:3001",
      "/mcp": "http://localhost:3001",
      "/.well-known": "http://localhost:3001",
      "/llms.txt": "http://localhost:3001",
      "/llms-full.txt": "http://localhost:3001",
      "/robots.txt": "http://localhost:3001",
      "/sitemap.xml": "http://localhost:3001",
      "/sitemap.md": "http://localhost:3001",
      "/AGENTS.md": "http://localhost:3001",
      "/api.md": "http://localhost:3001",
      "/openapi.json": "http://localhost:3001",
      "/index.md": "http://localhost:3001",
      "/about.md": "http://localhost:3001",
      "/check.md": "http://localhost:3001",
      "/schema": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
  test: {
    // Default to a node environment; DOM-dependent tests opt in per-file with
    // a `// @vitest-environment happy-dom` comment.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
