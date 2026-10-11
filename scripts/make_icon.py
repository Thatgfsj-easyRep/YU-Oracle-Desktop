"""为 oracle-desktop 生成应用图标。

用法：
    python scripts/make_icon.py                        # 与历史行为一致：256×256，透明圆角
    python scripts/make_icon.py --size 1024 --opaque   # 给 iOS / App Store 用的大图（不透明）

为什么 iOS 需要 --opaque：App Store 会拒绝含透明像素的图标（ITMS-90704），
并且 iOS 自己会把方形图标切成圆角，所以 AppIcon 必须是**铺满整张画布的不透明方图**。
桌面端反过来——透明圆角更好看，因此两套分别生成：

    python scripts/make_icon.py                              # 桌面：icon.png / *x*.png / icon.ico
    python scripts/make_icon.py --size 1024 --opaque          # 得到 icon-1024.png（不透明）
    npx tauri icon src-tauri/icons/icon-1024.png -o src-tauri/icons
    git checkout -- src-tauri/icons/icon.png src-tauri/icons/*.png src-tauri/icons/icon.ico
    # 上一行是为了只保留新产的 icons/ios/，不把桌面图标换成不透明版

几何量全部写成画布尺寸的比例，所以 --size 放大到 1024 时构图与 256 完全一致。
"""
import argparse
import math
import os

from PIL import Image, ImageDraw, ImageFont

_HERE = os.path.dirname(os.path.abspath(__file__))
# 既兼容 scripts/make_icon.py，也兼容仓库根目录直接放置的旧位置
if os.path.basename(_HERE) == "scripts":
    _DEFAULT_OUT = os.path.join(os.path.dirname(_HERE), "src-tauri", "icons")
else:
    _DEFAULT_OUT = os.path.join(_HERE, "src-tauri", "icons")

parser = argparse.ArgumentParser(description="生成应用图标（比例绘制，可放大到任意尺寸）")
parser.add_argument("--size", type=int, default=256, help="主画布边长，默认 256")
parser.add_argument("--opaque", action="store_true",
                    help="用底色铺满整张画布（iOS / App Store 必需），默认保留透明圆角")
parser.add_argument("--out", default=_DEFAULT_OUT, help="输出目录，默认 src-tauri/icons")
args = parser.parse_args()

# RGBA 画布
S = args.size
out_dir = args.out
os.makedirs(out_dir, exist_ok=True)


def u(base):
    """把 256 画布上的原始像素量换算成当前 size 下的量（默认 size=256 时恒等）。"""
    return int(round(base * S / 256))


img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 紫色圆形背景（深紫）
bg_purple = (40, 16, 90, 255)
bg_dark = (4, 2, 20, 255)
gold = (212, 175, 55, 255)
gold2 = (245, 231, 160, 255)
paper = (245, 231, 200, 255)

if args.opaque:
    d.rectangle([0, 0, S - 1, S - 1], fill=bg_dark)

# 渐变背景：用一个简单径向渐变模拟
for r in range(S // 2, 0, -1):
    alpha = int(255 * (r / (S / 2)) ** 1.5)
    color = (60, 18, 110, alpha)
    d.ellipse([S//2 - r, S//2 - r, S//2 + r, S//2 + r], fill=color)

# 中心塔罗牌轮廓
card_w, card_h = u(110), u(160)
cx, cy = S // 2, S // 2
x0, y0 = cx - card_w // 2, cy - card_h // 2
x1, y1 = cx + card_w // 2, cy + card_h // 2

# 牌面深色填充
d.rounded_rectangle([x0, y0, x1, y1], radius=u(10), fill=(20, 10, 35, 255),
                    outline=gold, width=max(1, u(3)))


# 牌面内部装饰：五角星
def draw_star(d, cx, cy, r_out, r_in, n=5, color=gold):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = -math.pi / 2 + i * math.pi / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=color)


draw_star(d, cx, cy + u(4), u(36), u(14), color=gold)

# 顶部小字
try:
    f = ImageFont.truetype("arial.ttf", u(16))
    f2 = ImageFont.truetype("arial.ttf", u(12))
except OSError:
    f = ImageFont.load_default()
    f2 = ImageFont.load_default()

# 主 PNG：默认 256 仍写 icon.png（与历史一致）；其它尺寸另存，避免覆盖桌面图标
png_name = "icon.png" if S == 256 else f"icon-{S}.png"
png_path = os.path.join(out_dir, png_name)
img.save(png_path, "PNG")
print(f"saved {png_path}  ({S}x{S}, opaque={args.opaque})")

# 保存 32, 128, 256 PNG（Tauri 多尺寸用）
for sz in (32, 128, 256):
    img.resize((sz, sz), Image.LANCZOS).save(
        os.path.join(out_dir, f"{sz}x{sz}.png"), "PNG")

# 多尺寸 ICO
ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
imgs = [img.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_path = os.path.join(out_dir, "icon.ico")
imgs[0].save(ico_path, format="ICO", sizes=ico_sizes)
print(f"saved {ico_path}")
