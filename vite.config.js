import { defineConfig } from "vite";

// Tauri expects a fixed port + no clearScreen so it can hook into the dev server.
export default defineConfig({
  publicDir: "../public",    // public/ at project root, copied to dist/ root
  root: "src",                // source: src/index.html + src/main.js
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // 目标运行时是 WKWebView（iOS Safari 内核），不是 Chrome：按 Safari 出码，
    // 免得 chrome120 放行某些 iOS 上还没有的语法/特性。
    target: ["es2020", "safari15"],
    rollupOptions: { output: { manualChunks: undefined } }
  },
  server: {
    port: 5173,
    strictPort: true,
    // iOS 真机调试时 devUrl 必须能从手机访问，127.0.0.1 只监听回环会连不上；
    // 真机开发请把 devUrl 换成本机局域网 IP（release 构建把 dist/ 打进包里，不受影响）。
    host: true
  },
  clearScreen: false
});
