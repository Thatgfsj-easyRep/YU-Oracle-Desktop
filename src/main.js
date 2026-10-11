// 神谕 · Oracle Desktop 入口
// Tab 切换 + 装载两个占卜模块

import "./styles.css";
import { initTarot } from "./tarot.js";
import { initIching } from "./iching.js";

const tabs = document.querySelectorAll(".tab");
const panels = {
  tarot: document.getElementById("tab-tarot"),
  iching: document.getElementById("tab-iching"),
};

// 共享：复制 Markdown + 唤起 DeepSeek
//
// iOS/WKWebView 里两条 Web API 都不可靠：
//   - window.open() 没有 new-window 委托会被静默丢弃 → 必须走 opener 插件
//   - navigator.clipboard 需要安全上下文 + 用户手势，自定义协议下常直接 reject
//     → 必须走 clipboard-manager 插件
// 桌面端（Tauri）同样走插件；纯浏览器开发模式（vite 直开）才退回 Web API。
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";

const inTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const DEEPSEEK_URL = "https://chat.deepseek.com";

async function copyMarkdown(md) {
  if (inTauri()) {
    try {
      await writeText(md);
      showToast("已复制 Markdown");
      return;
    } catch (e) {
      console.warn("clipboard-manager 插件写入失败，退回 Web API：", e);
    }
  }
  try {
    await navigator.clipboard.writeText(md);
    showToast("已复制 Markdown");
  } catch (e) {
    console.warn("复制失败：", e);
    showToast("复制失败");
  }
}

async function openDeepSeek() {
  if (inTauri()) {
    try {
      await openUrl(DEEPSEEK_URL);
      return;
    } catch (e) {
      console.warn("opener 插件打开失败，退回 window.open：", e);
    }
  }
  window.open(DEEPSEEK_URL, "_blank", "noopener");
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1500);
}
window.showToast = showToast;

function showTab(name) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  Object.entries(panels).forEach(([k, el]) => {
    el.classList.toggle("active", k === name);
  });
}

tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

// 启动两个模块（双 Tab，但 DOM 都常驻 = 状态保留）
initTarot(panels.tarot, { onCopy: copyMarkdown, onAI: openDeepSeek });
initIching(panels.iching, { onCopy: copyMarkdown, onAI: openDeepSeek });

// 默认塔罗
showTab("tarot");
