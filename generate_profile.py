import os
from PIL import Image, ImageDraw

def render_profile_pic(bg_color, fg_color, accent_color, output_path, size=1000):
    # Render at 4x resolution for super-sampling antialiasing
    scale_factor = 4
    canvas_size = size * scale_factor
    img = Image.new("RGBA", (canvas_size, canvas_size), bg_color)
    draw = ImageDraw.Draw(img)

    # Original coordinates centered around (513.5, 518.5)
    orig_cx = 513.5
    orig_cy = 518.5

    # Target: max radius 325 on a 1000x1000 canvas -> radius * scale_factor
    target_radius = 320.0 * scale_factor
    orig_max_radius = 407.4
    s = target_radius / orig_max_radius

    canvas_cx = canvas_size / 2.0
    # Slightly nudge up visually by 10px (scaled) because the key extends at top
    canvas_cy = (canvas_size / 2.0) - (8.0 * scale_factor)

    def tx(x):
        return canvas_cx + (x - orig_cx) * s

    def ty(y):
        return canvas_cy + (y - orig_cy) * s

    def draw_rect(x, y, w, h, rx, fill):
        x0, y0 = tx(x), ty(y)
        x1, y1 = tx(x + w), ty(y + h)
        rad = rx * s
        draw.rounded_rectangle([x0, y0, x1, y1], radius=rad, fill=fill)

    # 1. Outer Vault Frame
    # Top Left Segment
    draw_rect(233, 263, 102, 16, 3, fg_color)
    # Top Right Segment
    draw_rect(393, 263, 401, 16, 3, fg_color)
    # Left Pillar
    draw_rect(233, 263, 16, 551, 3, fg_color)
    # Right Pillar
    draw_rect(778, 263, 16, 551, 3, fg_color)
    # Base Floor
    draw_rect(233, 798, 561, 16, 3, fg_color)

    # 2. Inner Chamber
    # Inner Left
    draw_rect(282, 311, 16, 455, 3, fg_color)
    # Inner Right
    draw_rect(730, 311, 16, 455, 3, fg_color)
    # Inner Top Left
    draw_rect(282, 311, 53, 16, 3, fg_color)
    # Inner Top Right
    draw_rect(393, 311, 353, 16, 3, fg_color)
    # Inner Floor
    draw_rect(282, 750, 464, 16, 3, fg_color)

    # 3. Drawer Dividers
    # Divider 1
    draw_rect(282, 457, 464, 16, 2, fg_color)
    # Divider 2
    draw_rect(282, 604, 464, 16, 2, fg_color)

    # 4. Drawer Handles
    draw_rect(430, 311, 166, 36, 4, fg_color)
    draw_rect(430, 457, 166, 36, 4, fg_color)
    draw_rect(430, 604, 166, 36, 4, fg_color)

    # 5. Stylus / Key (Accent Color)
    # Points: 355,223 371,223 371,552 363,571 355,552
    poly_points = [
        (tx(355), ty(223)),
        (tx(371), ty(223)),
        (tx(371), ty(552)),
        (tx(363), ty(571)),
        (tx(355), ty(552)),
    ]
    draw.polygon(poly_points, fill=accent_color)

    # Resize with high-quality downsampling
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save(output_path, "PNG", optimize=True)
    print(f"Generated: {output_path}")

os.makedirs("c:/Project/SP_2/public", exist_ok=True)

# 1. Dark Edition (Very popular on Tech Twitter / X)
render_profile_pic(
    bg_color=(15, 15, 18, 255),       # Dark Zinc #0f0f12
    fg_color=(255, 255, 255, 255),   # Pure White
    accent_color=(99, 102, 241, 255), # Indigo #6366f1
    output_path="c:/Project/SP_2/public/x-profile-dark.png"
)

# 2. Brand Indigo Edition (WinStash brand theme)
render_profile_pic(
    bg_color=(79, 70, 229, 255),     # WinStash Indigo #4f46e5
    fg_color=(255, 255, 255, 255),   # White
    accent_color=(199, 210, 254, 255),# Light Indigo #c7d2fe
    output_path="c:/Project/SP_2/public/x-profile-indigo.png"
)

# 3. Clean Light Edition (Minimalist)
render_profile_pic(
    bg_color=(255, 255, 255, 255),   # Pure White
    fg_color=(17, 17, 19, 255),      # Charcoal #111113
    accent_color=(79, 70, 229, 255),  # Indigo #4f46e5
    output_path="c:/Project/SP_2/public/x-profile-light.png"
)
