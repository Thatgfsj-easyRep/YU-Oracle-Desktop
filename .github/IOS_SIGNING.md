# iOS 签名与安装

CI 默认只产出**未签名**的 `.app` / `.ipa`（见 `.github/workflows/ios.yml` 的 `ios-unsigned` 作业）。
未签名包能证明"这个工程确实能在 arm64 真机架构上编译打包"，但**装不进任何一台 iPhone**——
iOS 强制校验签名。要真正装到手机上，从下面三条路里选一条。

| 方案 | 费用 | 能装到哪些设备 | 能否在 CI 里做 | 有效期 |
| --- | --- | --- | --- | --- |
| A. 未签名产物 | 免费 | 装不了（只用于验证构建） | ✅ 默认 | — |
| B. 免费 Apple ID（个人团队） | 免费 | 仅你自己登录该 Apple ID 的设备，最多 3 个 App | ❌ 必须在有 Xcode 的 Mac 上 | 7 天，需重新安装 |
| C. Apple Developer Program | $99/年 | TestFlight 最多 1 万台外部测试机 / App Store 全量 | ✅（配 Secrets 后） | Ad Hoc 与 TestFlight 均 90 天 |

> 本文 C 方案的接线方式按 Tauri 官方文档（`distribute/Sign/ios`）整理，
> **本仓库还没有用真实开发者账号跑通过 `ios-signed` 作业**；第一次开启时请把
> 首个失败当作配置问题排查，而不是工程问题。

## C 方案：在 CI 里签名（有 $99 账号时）

### 1. 准备证书材料

自动签名（推荐，Xcode 托管）需要一把 App Store Connect API 密钥：
App Store Connect → 用户和访问 → 集成 → 创建 API 密钥，角色选 **管理员**。
记下三项：

- Issuer ID → `APPLE_API_ISSUER`
- Key ID → `APPLE_API_KEY_ID`
- 下载的 `.p8` 私钥（只能下载一次）→ base64 后存入 `APPLE_API_KEY`

手动签名则改用这三项（从钥匙串导出 .p12、从开发者后台下载 .mobileprovision，各自 base64）：

- `IOS_CERTIFICATE`：`.p12` 的 base64
- `IOS_CERTIFICATE_PASSWORD`：导出 .p12 时设的密码
- `IOS_MOBILE_PROVISION`：`.mobileprovision` 的 base64

证书类型要和导出方式配对：

| `IOS_EXPORT_METHOD` | 需要的证书 | 用途 |
| --- | --- | --- |
| `app-store-connect` | Apple Distribution / iOS Distribution | 上传 App Store Connect |
| `release-testing` | Apple Distribution / iOS Distribution | TestFlight / Ad Hoc 导出 |
| `debugging` | Apple Development / iOS App Development | 自己设备直装 |

### 2. 配好仓库的 Variables 与 Secrets

```bash
cd YU-Oracle-Desktop          # 或用 gh -R Thatgfsj-easyRep/YU-Oracle-Desktop

# 打开签名作业
gh variable set ENABLE_SIGNED_BUILD -b true

# Team ID（开发者后台 Membership 页，10 位字符）
gh variable set APPLE_DEVELOPMENT_TEAM -b XXXXXXXXXX

# 导出方式，默认 app-store-connect；只想要能装机的包就用 release-testing
gh variable set IOS_EXPORT_METHOD -b release-testing

# 自动签名三件套
base64 -i AuthKey_XXXXXXXXXX.p8 | gh secret set APPLE_API_KEY
gh secret set APPLE_API_ISSUER   -b '<Issuer ID>'
gh secret set APPLE_API_KEY_ID   -b '<Key ID>'

# —— 或者手动签名三件套 ——
base64 -i distribution.p12          | gh secret set IOS_CERTIFICATE
gh secret set IOS_CERTIFICATE_PASSWORD -b '<导出密码>'
base64 -i oracle.mobileprovision    | gh secret set IOS_MOBILE_PROVISION
```

`APPLE_DEVELOPMENT_TEAM` 由作业直接作为环境变量传给 Tauri（配置 schema 注明该环境变量会覆盖
`bundle.iOS.developmentTeam`），所以 **不要**把 Team ID 提交进 `tauri.conf.json`。

### 3. 触发

```bash
gh workflow run ios.yml -f configuration=release
```

`ios-signed` 作业会跑 `npx tauri ios build --export-method <方法>`，产物是能装机的 `.ipa`
（artifact 名 `ios-signed-ipa`）。

### 4. 装到手机

- `release-testing` 导出的 `.ipa` → App Store Connect → TestFlight 内部测试组，
  手机上装 TestFlight 即可。
- `debugging` 导出的 `.ipa` → 设备需在 profile 的设备列表里，用 Xcode →
  Window → Devices and Simulators 安装，或 `xcrun devicectl device install app`。

## B 方案：只有免费 Apple ID（没有 $99 账号）

不需要 CI，找一台装了 Xcode 的 Mac：

```bash
git clone https://github.com/Thatgfsj-easyRep/YU-Oracle-Desktop.git
cd YU-Oracle-Desktop
npm ci && npm run build
npx tauri ios init --ci
open src-tauri/gen/apple/*.xcodeproj   # Xcode 里 Signing & Capabilities → Team 选自己的 Apple ID
# 然后 xcodebuild 归档或直接 ⌘R 装到连着的数据线手机
```

代价：签名 7 天过期，过期后 App 打不开，重插数据线再装一次；不能给别人用。

## 其它约束

- `tauri.conf.json` 里的 `identifier`（现为 `com.thatgfsj.oracle-desktop`）必须与
  App ID 注册的 Bundle ID 完全一致；改动它会让已有的 profile 失效。
- 移动端命令只能在 macOS 上跑（Tauri CLI 原文："All iOS commands are only available on macOS hosts."），
  所以 `src-tauri/gen/apple/`（xcodegen 生成的 iOS 工程）列在 `.gitignore` 里，由 CI 每次重新生成。
- iOS 图标必须不透明且铺满方形（App Store 会以 ITMS-90704 拒绝含透明像素的图标）。
  现仓库里的 `icons/ios/` 已按此生成；若要更清晰的大图，用矢量脚本重出 1024 源图：

  ```bash
  python scripts/make_icon.py --size 1024 --opaque
  npx tauri icon src-tauri/icons/icon-1024.png -o src-tauri/icons
  git checkout -- src-tauri/icons/icon.png src-tauri/icons/128x128.png src-tauri/icons/256x256.png \
                 src-tauri/icons/32x32.png src-tauri/icons/icon.ico   # 桌面图标保持透明圆角
  ```

- 想要"把构建放到远端 Mac、本地不装 Xcode"的托管通道，可以看我另一份技能包
  `Thatgfsj/ios-gradle-skills`（MobAI ios-builder）：`builder ios build --unsigned` 走
  GitHub Actions 远端 xcodebuild，签名路径需要 `builder auth apple`。本仓库目前**没有**接入该通道。
