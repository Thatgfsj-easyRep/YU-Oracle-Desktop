import { defineConfig } from "vite";

// Tauri expects a fixed port + no clearScreen so it can hook into the dev server.
export default defineConfig({
  publicDir: "../public",    // public/ at project root, copied to dist/ root
  root: "src",                // source: src/index.html + src/main.js
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    target: "chrome120",
    rollupOptions: { output: { manualChunks: undefined } }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1"
  },
  clearScreen: false
});
