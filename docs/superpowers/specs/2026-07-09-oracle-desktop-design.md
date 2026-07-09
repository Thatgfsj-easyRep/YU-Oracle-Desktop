# Oracle Desktop 设计文档

> **代号**: `oracle-desktop`
> **日期**: 2026-07-09
> **状态**: P0/P1 全部完成，等待 Tauri build 验证

## 1. 目标

将 `Thatgfsj/tarot-oracle`（塔罗）与 `Thatgfsj/iching-oracle`（易经）这两个 **Android 原生**应用，参考 `Thatgfsj/XXGCXY-CampusNet-AutoLogin`（**Tauri 2** 桌面应用）的**技术栈**，重写为**单 Windows 桌面应用**，含两个 Tab：

- **塔罗镜**（78 张 Rider-Waite 完整韦特塔罗）
- **易经卜卦**（64 卦周易，含卦辞 / 象传）

核心差异 vs Android 原版：

| 行为 | Android 原版 | 桌面端 |
|---|---|---|
| 分享到 DeepSeek | `Intent.ACTION_SEND` + `setPackage("com.deepseek.chat")` 唤起 App | 调起系统**默认浏览器**打开 `https://chat.deepseek.com` |
| 复制占卜结果 | 无 | 复制为 **Markdown** 到剪贴板（按钮："复制占卜结果"） |
| 唤起 AI | 唤起 App | 按钮："打开 DeepSeek"（= 浏览器跳转） |

## 2. 技术栈

| 项 | 选型 | 备注 |
|---|---|---|
| 桌面壳 | **Tauri 2.x** | 复用 `XXGCXY-CampusNet-AutoLogin` 的栈 |
| 前端 | **原生 HTML/JS/CSS** | 不引入 Vue/React，与原项目一致 |
| 构建工具 | Vite 5.4 | 同 `XXGCXY` 项目 |
| 后端 | Rust 1.93 (D:\Rust) | 已迁移 |
| MSVC | VS 2022 Community (cl 19.44) | 系统已装 |
| Windows SDK | 10.0.26100 | 系统已装 |
| Node | v22.18.0 | 系统已装 |

## 3. 架构

```
oracle-desktop/
├─ src/                         ← Vite 源码
│   ├─ index.html               ← Tab 壳
│   ├─ main.js                  ← Tab 切换 + 装载两个模块
│   ├─ styles.css               ← 全局 + 塔罗样式
│   ├─ tarot.js                 ← 塔罗镜模块
│   └─ iching.js                ← 易经卜卦模块
├─ public/                      ← 静态资源（被 Vite 拷贝到 dist/）
│   ├─ tarot/
│   │   ├─ cards.json           ← 78 张牌元数据（从原 Android assets 抽）
│   │   └─ cards/*.jpg          ← 78 张 Rider-Waite 牌图（从 drawable-nodpi 抽）
│   └─ iching/
│       └─ hexagrams.json       ← 64 卦元数据（从原 Android assets 抽）
├─ src-tauri/                   ← Rust 后端
│   ├─ Cargo.toml
│   ├─ tauri.conf.json          ← 窗口配置 + bundle target
│   ├─ build.rs
│   ├─ src/main.rs
│   ├─ src/lib.rs               ← 装载 opener + clipboard-manager 插件
│   ├─ icons/icon.ico           ← 应用图标（程序生成）
│   └─ capabilities/default.json ← ACL：opener + clipboard
├─ dist/                        ← Vite build 产物（Tauri 加载这里）
├─ package.json
├─ vite.config.js
├─ make_icon.py                 ← 图标生成脚本
├─ download_tarot.py            ← 牌图批量下载脚本（用 gh-proxy 镜像）
└─ docs/superpowers/specs/2026-07-09-oracle-desktop-design.md
```

## 4. 塔罗镜模块

### 4.1 数据
- 复用 `tarot-oracle/app/src/main/assets/cards.json`（version=1.0，count=78）
- 复用 `tarot-oracle/app/src/main/res/drawable-nodpi/*.jpg`（78 张 jpg，1.1MB 总）

### 4.2 状态机（参照 `TarotScreen.kt` v0.2.1）

```
Home (家)
 ├─ 按钮"点击抽取" → 抽 1 张 → Single (牌面朝下)
 └─ 按钮"三卡阵 · 过去/现在/未来" → 抽 3 张 → Spread (3 张牌面朝下)

Single
 └─ 点击牌面 → 0°→360° flip 0.8s, 同时 rotationX=180 if 逆位
              → 提示"点击翻牌"淡出
              → 显示卡名/英文/顺逆位
              → 按钮组：返回首页 / 复制占卜结果 / 打开 DeepSeek

Spread
 └─ 每张牌独立点击翻转（无 stacked）
 └─ 按钮组：返回首页 / 复制占卜结果 / 打开 DeepSeek
```

### 4.3 Markdown 模板（与 Android 原版 `DeepSeekShare.kt` 一致）

单卡：
```
我抽取了塔罗牌，这是我抽到的卡牌：

愚人（The Fool）顺位

我要问的问题是：
```

三卡阵：
```
我抽取了塔罗牌，这是我抽到的卡牌：

过去：愚人（The Fool）顺位
现在：魔术师（The Magician）逆位
未来：女皇（The Empress）顺位

我要问的问题是：
```

### 4.4 顺位 / 逆位

- 各 50% 概率
- 视觉差异：逆位的牌面 `rotationX=180°`（上下颠倒）
- 文案：顺位 / 逆位（Reversed）

## 5. 易经卜卦模块

### 5.1 数据
- 复用 `iching-oracle/app/src/main/assets/hexagrams.json`（64 卦，King Wen 序列）
- `binary` 字段是 bottom-up 6 位（LSB = 第一爻），阳=1 / 阴=0

### 5.2 状态机（参照 `IChingOracleScreen.kt` v1.0.0）

```
Home
 ├─ 64 卦字云缓慢飘动（24s 一次往返漂移，~12px 振幅）
 ├─ 居中"八卦"大标题 + "心诚则灵" + "请在心中默念你的问题"
 └─ 按钮"点击抽取"

Drawing（抽签动画 ~2.4s）
 ├─ 六爻从下往上逐爻出现（240ms / 爻 ≈ 1.44s）
 ├─ 卦名（中/拼音/英文）淡入
 ├─ 卦辞淡入
 ├─ 象传淡入
 └─ 按钮"再算一卦"/"✨ 问 AI" 淡入

Loaded（完整卦象 + 按钮）
 └─ 卦名（中/拼音/英文） + 六爻 + 卦辞 + 象传
 └─ 按钮：再算一卦 / ✨ 问 AI

再算一卦
 └─ 弹"提醒"模态（占卜传统：同一问题反复测算会破坏）
 └─ 取消 / 继续抽取
```

### 5.3 Markdown 模板（与 Android 原版 `DeepSeekShare.kt` 一致）

```
我算到了第 1 卦：乾（Qián / The Creative）

卦辞：元，亨，利，贞。
象传：天行健，君子以自强不息。

我要问的问题是：
```

## 6. Tauri 集成

### 6.1 窗口配置（`tauri.conf.json`）

```json
{
  "title": "神谕 · Oracle Desktop",
  "width": 880,
  "height": 640,
  "minWidth": 720,
  "minHeight": 560,
  "theme": "Dark"
}
```

### 6.2 插件

- `@tauri-apps/plugin-opener`：调起系统默认浏览器打开 `https://chat.deepseek.com`
- `@tauri-apps/plugin-clipboard-manager`：复制 Markdown 到系统剪贴板

### 6.3 Capabilities

`capabilities/default.json` 开启：
- `core:default`
- `opener:default` + `opener:allow-open-url`
- `clipboard-manager:default` + `clipboard-manager:allow-write-text`

## 7. 离线 / 数据来源

| 数据 | 来源 | 许可 |
|---|---|---|
| 塔罗 78 张牌图 | https://www.shenpowang.com/taluopai/jieshi/ | 神婆网（公开） |
| 塔罗牌名/英文 | 神婆网元数据 | 同上 |
| 64 卦卦辞/象传 | 通行本《周易》王弼注 | 公有领域 |

**无网络请求**：所有数据 baked 进包内。**无后台 service**。**无 WorkManager**。

## 8. 痛点 / 难点（开发过程中记录）

1. **GitHub 直连失败**：使用 `https://gh-proxy.com/` 镜像解决。
2. **winget 装 Rust 失败**（源连不上）：用 `rustup-init.exe` + `RUSTUP_HOME` / `CARGO_HOME` 环境变量手动装。
3. **rustup 二次安装半途而废**：原 toolchain 在 `C:\Users\administered\.rustup`（预装），新装到 `D:\Rust` 失败。用 `robocopy /E /MT:8` 把 C 盘 toolchain 拷到 D 盘。
4. **MSVC 链接器**：VS 2022 Community + MSVC 14.44 + Windows SDK 10.0.26100 已预装。
5. **PATH 不持久**（无管理员权限 setx /m）：用 `D:\Rust\rust-msvc.bat` 包装 `vcvars64.bat` + Rust toolchain PATH，每次跑命令前 call 它。
6. **crates.io 直连阻断**（HTTP 403）：首次 `cargo check` 下载索引慢但能通。
7. **塔罗牌图 gh-proxy 偶发 199 字节坏文件**：Python 脚本用 `if size > 1000: skip`，重新跑能自动补齐。
8. **npm 包版本不存在**：`@tauri-apps/plugin-clipboard-manager@2.10.1` 不存在，最高 2.3.2，调整 package.json。

## 9. 待办 / 后续

- [ ] `cargo check --release` 通过（等待中）
- [ ] `tauri dev` 启动验证窗口
- [ ] `tauri build` 出 `.exe` + `.msi`（NSIS 安装包）
- [ ] 子时拦截（23:00-01:00）—— 文化彩蛋，按需启用
- [ ] README + 截图

## 10. 验证清单（端到端）

- [ ] 启动应用 → 默认在「塔罗镜」Tab
- [ ] 点击「点击抽取」→ 牌面朝下，出现「点击翻牌」提示
- [ ] 点击牌面 → 翻牌 0°→360°，显示卡名/顺位或逆位
- [ ] 点击「复制占卜结果」→ 系统剪贴板含 Markdown
- [ ] 点击「打开 DeepSeek」→ 默认浏览器打开 chat.deepseek.com
- [ ] 切换到「易经卜卦」Tab
- [ ] 点击「点击抽取」→ 6 爻逐爻出现 + 卦辞/象传淡入
- [ ] 点击「再算一卦」→ 弹"提醒"模态
- [ ] 关闭窗口 → 进程退出
