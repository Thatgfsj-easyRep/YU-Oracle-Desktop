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
// 优先使用 Tauri 插件（写系统剪贴板 + 打开默认浏览器），
// 浏览器降级（开发模式或者能力拒绝时）
async function copyMarkdown(md) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("plugin:clipboard-manager|write_text", { text: md, label: null });
    showToast("已复制 Markdown");
    return;
  } catch (e) { /* fall through to web fallback */ }
  try {
    await navigator.clipboard.writeText(md);
    showToast("已复制 Markdown");
  } catch (e) {
    showToast("复制失败");
  }
}

async function openDeepSeek() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("plugin:opener|open_url", { url: "https://chat.deepseek.com" });
    return;
  } catch (e) { /* fall through */ }
  window.open("https://chat.deepseek.com", "_blank", "noopener");
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
