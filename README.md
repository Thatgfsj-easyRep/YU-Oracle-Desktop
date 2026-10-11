# 神谕 · Oracle Desktop

> **塔罗镜 + 易经卜卦** — Tauri 2 单应用双 Tab 离线占卜，同一个代码库出 Windows 桌面包与 iOS 包

将 [`Thatgfsj/tarot-oracle`](https://github.com/Thatgfsj/tarot-oracle)（Android 塔罗）与 [`Thatgfsj/iching-oracle`](https://github.com/Thatgfsj/iching-oracle)（Android 易经）整合为一个 Tauri 2 桌面应用，统一窗体、共享样式、相同离线体验。

## 下载

[Releases](../../releases) 页面提供 NSIS 安装包（`Oracle-Desktop-Setup.exe`）。双击安装即可，桌面上生成 **神谕 · Oracle Desktop** 快捷方式。

## 主要功能

### 塔罗镜

- **78 张完整韦特塔罗牌**（Rider-Waite，22 大阿卡那 + 56 小阿卡那）
- **三种占卜方式**：
  - 单卡（默认）
  - 三卡阵 · 过去 / 现在 / 未来
- **手点翻牌**：抽到牌后牌面朝下，点一下 0°→360° 翻过来
- **顺位 / 逆位** 视觉差异：逆位翻过来上下颠倒
- **复制占卜结果**：一键复制 Markdown 格式到剪贴板
- **打开 DeepSeek**：唤起系统默认浏览器到 chat.deepseek.com

### 易经卜卦

- **64 卦完整周易**（含卦辞、象传）
- **首页 64 卦字云**：64 卦名作为半透明字云缓慢飘动
- **抽签动画**：
  - 六爻从下往上逐爻出现（240ms / 爻）
  - 卦名（中 / 拼音 / 英文）淡入
  - 卦辞淡入 → 象传淡入
- **再算一卦**：弹"提醒"模态（占卜传统：同一问题反复测算会破坏）
- **复制 / 打开 DeepSeek**：同塔罗

## 离线运行

- ✅ 无网络请求
- ✅ 无后台 service
- ✅ 78 张牌图 + 64 卦数据 baked 进包内

## 技术栈

| 项 | 选型 |
|---|---|
| 桌面壳 | Tauri 2.x |
| 移动壳 | Tauri 2.x iOS（WKWebView，同一套 `src/` 前端） |
| 前端 | 原生 HTML / JS / CSS |
| 构建 | Vite 5.4 |
| 后端 | Rust 1.70+ |
| 牌图 | 神婆网 Rider-Waite |

## 项目结构

```
oracle-desktop/
├─ src/                         前端源码
│  ├─ index.html                Tab 壳
│  ├─ main.js                   Tab 切换 + 装载两个模块
│  ├─ styles.css
│  ├─ tarot.js                  塔罗镜
│  └─ iching.js                 易经卜卦
├─ public/                      静态资源
│  ├─ tarot/
│  │  ├─ cards.json             78 张牌元数据
│  │  └─ cards/*.jpg            78 张牌图
│  └─ iching/
│     └─ hexagrams.json         64 卦元数据
├─ src-tauri/                   Rust 后端
│  ├─ Cargo.toml
│  ├─ tauri.conf.json
│  ├─ build.rs
│  ├─ src/
│  │  ├─ main.rs
│  │  └─ lib.rs
│  ├─ icons/                    应用图标
│  └─ capabilities/default.json
├─ scripts/                     工具脚本
│  └─ make_icon.py              重新生成应用图标
├─ .github/
│  ├─ workflows/ios.yml          iOS 构建（未签名默认开，签名作业按 Variables 开关）
│  └─ IOS_SIGNING.md             签名与装机指南
├─ docs/                        设计文档
├─ package.json
├─ vite.config.js
├─ README.md
├─ LICENSE                      MIT
└─ .gitignore
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（启动 Tauri 窗口 + DevTools）
npx tauri dev

# 构建 NSIS 安装包（产物在 src-tauri/target/release/bundle/nsis/）
npx tauri build
```

构建产物不进入版本控制（见 `.gitignore`）。

## iOS

同一份代码用 Tauri 2 的移动端能力出 iOS 包，不需要重写前端：

```bash
# 需要 macOS + Xcode（Tauri 的 iOS 命令只能在 macOS 上跑）
npm ci
npm run build
npx tauri ios init --ci        # 用 xcodegen 生成 src-tauri/gen/apple/（含 .xcodeproj，已在 .gitignore）
npx tauri ios dev              # 连着手机/模拟器热重载调试
npx tauri ios build --export-method release-testing   # 需要签名，见下
```

CI（本仓库 Actions）默认跑 **未签名** 构建：`static` 作业先把前端与配置过一遍，
`ios-unsigned` 作业在 `macos-15` 上用 `xcodebuild ... CODE_SIGNING_ALLOWED=NO` 真机架构编出 `.app`，
再打包成 `.ipa` 上传 artifact。未签名包**装不进手机**，它只证明工程能编出来。
仓库是 public，GitHub 托管 macOS runner 对 public 仓库不计费
（GitHub 定价页原文："Minutes are free for public repositories."）。

为 iPhone 做过的适配（`src/styles.css`、`src/tarot.js`、`src/iching.js`）：

- 三卡阵原来是 `3×200px + 2×32px = 664px` 宽，390pt 的 iPhone 上必然溢出 →
  卡宽改成 `min(200px, 27vw)` 这类派生变量，牌面 ✦ 与文字随牌缩放
- 刘海与底部横条：`viewport-fit=cover` + `env(safe-area-inset-*)` 让位
- 触摸：`touch-action: manipulation` 去掉 300ms 点击延迟，可点区域抬到 44pt
- 复制到剪贴板 / 打开 DeepSeek：改走 `clipboard-manager` 与 `opener` 插件。
  WKWebView 里 `window.open()` 没有 new-window 委托会被静默丢弃，
  `navigator.clipboard` 在自定义协议下常直接 reject，纯 Web API 在 iOS 上不可靠
- Vite 出码目标从 `chrome120` 改为 `["es2020","safari15"]`（iOS 是 Safari 内核）
- 图标补 `src-tauri/icons/ios/` 全套 AppIcon，且不透明铺满方形
  （含透明像素会被 App Store 以 ITMS-90704 拒绝）

要真正装进手机需要签名：见 [.github/IOS_SIGNING.md](.github/IOS_SIGNING.md)
（免费 Apple ID / $99 开发者账号 / CI Secrets 接线三条路）。

## 数据来源与致谢

本项目所使用素材与数据来自下列来源，仅供学习与个人占卜娱乐使用：

- **塔罗 78 张牌图**：神婆网（<https://www.shenpowang.com/taluopai/jieshi/>）
- **塔罗牌名 / 英文名**：神婆网元数据
- **64 卦卦辞 / 象传**：通行本《周易》王弼注
- **姊妹项目**：
  - [`Thatgfsj/tarot-oracle`](https://github.com/Thatgfsj/tarot-oracle)（Android 端塔罗镜）
  - [`Thatgfsj/iching-oracle`](https://github.com/Thatgfsj/iching-oracle)（Android 端易经卜卦）

牌图与卦辞版权归原作者所有；本仓库仅以打包形式整合分发，不主张任何原创版权。如相关权利人希望调整使用方式，请通过 Issues 联系。

## 许可

本仓库代码使用 MIT 协议发布，详见 [LICENSE](LICENSE)。

> 注意：上述"数据来源与致谢"中提到的牌图与卦辞数据遵循各自来源的版权状态，本 MIT 许可仅适用于本仓库内的源代码与编排。