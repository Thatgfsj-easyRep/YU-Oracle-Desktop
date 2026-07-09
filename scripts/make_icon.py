"""为 oracle-desktop 生成图标（256x256 PNG，再转多尺寸 ICO）。

运行方式：在本脚本所在目录的父目录执行 `python scripts/make_icon.py`，
或在仓库根目录执行 `python scripts/make_icon.py`。输出位于
`src-tauri/icons/`。
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

# 输出目录：相对本脚本所在位置定位到 src-tauri/icons
_HERE = os.path.dirname(os.path.abspath(__file__))
# 既兼容 scripts/make_icon.py，也兼容仓库根目录直接放置的旧位置
if os.path.basename(_HERE) == "scripts":
    out_dir = os.path.join(os.path.dirname(_HERE), "src-tauri", "icons")
else:
    out_dir = os.path.join(_HERE, "src-tauri", "icons")
os.makedirs(out_dir, exist_ok=True)

# 256x256 RGBA 画布
S = 256
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 紫色圆形背景（深紫）
bg_purple = (40, 16, 90, 255)
bg_dark = (4, 2, 20, 255)
gold = (212, 175, 55, 255)
gold2 = (245, 231, 160, 255)
paper = (245, 231, 200, 255)

# 渐变背景：用一个简单径向渐变模拟
for r in range(S // 2, 0, -1):
    alpha = int(255 * (r / (S / 2)) ** 1.5)
    color = (60, 18, 110, alpha)
    d.ellipse([S//2 - r, S//2 - r, S//2 + r, S//2 + r], fill=color)

# 中心塔罗牌轮廓
card_w, card_h = 110, 160
cx, cy = S // 2, S // 2
x0, y0 = cx - card_w // 2, cy - card_h // 2
x1, y1 = cx + card_w // 2, cy + card_h // 2

# 牌面深色填充
d.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=(20, 10, 35, 255), outline=gold, width=3)

# 牌面内部装饰：五角星
def draw_star(d, cx, cy, r_out, r_in, n=5, color=gold):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = -math.pi / 2 + i * math.pi / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=color)

draw_star(d, cx, cy + 4, 36, 14, color=gold)

# 顶部小字
try:
    f = ImageFont.truetype("arial.ttf", 16)
    f2 = ImageFont.truetype("arial.ttf", 12)
except OSError:
    f = ImageFont.load_default()
    f2 = ImageFont.load_default()

# 保存 256 PNG
png_path = os.path.join(out_dir, "icon.png")
img.save(png_path, "PNG")
print(f"saved {png_path}")

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
