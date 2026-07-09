# 神谕 · Oracle Desktop

> **塔罗镜 + 易经卜卦** — 单 Windows 桌面应用，双 Tab 离线占卜

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