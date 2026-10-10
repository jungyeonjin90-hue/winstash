import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_og_image():
    W, H = 1200, 630
    
    # 1. Base Dark Canvas
    base = Image.new("RGBA", (W, H), (9, 9, 13, 255))

    # 2. Rich Aurora Glows
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    # Major Indigo Glow behind card
    g_draw.ellipse([580, -50, 1320, 580], fill=(79, 70, 229, 95))
    # Deep Violet glow
    g_draw.ellipse([780, 180, 1280, 680], fill=(124, 58, 237, 75))
    # Subtle Cyan highlight
    g_draw.ellipse([920, -80, 1240, 220], fill=(56, 189, 248, 50))
    # Soft Left-side accent glow
    g_draw.ellipse([0, -100, 420, 320], fill=(79, 70, 229, 40))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(85))
    base = Image.alpha_composite(base, glow_layer)

    # 3. Ambient Dot Grid (right side)
    dot_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(dot_layer)
    for x in range(30, W, 26):
        for y in range(20, H, 26):
            d_draw.ellipse([x, y, x + 2, y + 2], fill=(255, 255, 255, 18))
    
    dot_mask = Image.new("L", (W, H), 0)
    m_draw = ImageDraw.Draw(dot_mask)
    m_draw.rectangle([560, 0, W, H], fill=80)
    m_draw.ellipse([630, -50, 1300, 680], fill=110)
    dot_mask = dot_mask.filter(ImageFilter.GaussianBlur(35))
    dot_layer.putalpha(dot_mask)
    base = Image.alpha_composite(base, dot_layer)

    draw = ImageDraw.Draw(base)

    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"

    f_pill = ImageFont.truetype(font_bold, 13)
    f_title = ImageFont.truetype(font_bold, 48)
    f_sub = ImageFont.truetype(font_reg, 19)
    f_tag = ImageFont.truetype(font_bold, 12)
    f_card_sub = ImageFont.truetype(font_reg, 13)
    f_code = ImageFont.truetype(font_reg, 13)
    f_url = ImageFont.truetype(font_bold, 17)

    # ================= LEFT SIDE: Hero Typography =================
    left_x = 75

    # Pill Badge: "WINSTASH / AI CAREER MEMORY"
    pill_y = 75
    draw.rounded_rectangle([left_x, pill_y, left_x + 265, pill_y + 34], radius=17, fill=(30, 27, 75, 220), outline=(99, 102, 241, 160), width=1)
    draw.ellipse([left_x + 14, pill_y + 12, left_x + 22, pill_y + 20], fill=(129, 140, 248, 255))
    draw.text((left_x + 32, pill_y + 8), "WINSTASH  /  AI CAREER MEMORY", font=f_pill, fill=(224, 231, 255, 255))

    # Main Bold Headlines
    draw.text((left_x, 140), "Never lose track of", font=f_title, fill=(255, 255, 255, 255))
    draw.text((left_x, 202), "what you achieved.", font=f_title, fill=(165, 180, 252, 255))

    # Subtext (Problem & Solution)
    draw.text((left_x, 290), "Dump 1 minute of raw notes on Friday.", font=f_sub, fill=(244, 244, 245, 240))
    draw.text((left_x, 322), "Instantly get manager-ready reports & brag sheets.", font=f_sub, fill=(161, 161, 170, 230))

    # 3 Clean Feature Badges (Matched with actual service tab names)
    badge_y = 390
    badges = [
        ("WEEKLY SNIPPETS", (30, 27, 75, 240), (99, 102, 241, 180), (238, 242, 255, 255), (129, 140, 248, 255)),
        ("PERFORMANCE REVIEW", (24, 24, 32, 240), (63, 63, 70, 180), (228, 228, 231, 255), (52, 211, 153, 255)),
        ("CAREER PORTFOLIO", (24, 24, 32, 240), (63, 63, 70, 180), (228, 228, 231, 255), (251, 191, 36, 255)),
    ]
    cur_x = left_x
    for text, bg_col, border_col, txt_col, dot_col in badges:
        bbox = draw.textbbox((0, 0), text, font=f_tag)
        bw = (bbox[2] - bbox[0]) + 38
        bh = 34
        draw.rounded_rectangle([cur_x, badge_y, cur_x + bw, badge_y + bh], radius=8, fill=bg_col, outline=border_col, width=1)
        draw.ellipse([cur_x + 12, badge_y + 13, cur_x + 18, badge_y + 19], fill=dot_col)
        draw.text((cur_x + 26, badge_y + 9), text, font=f_tag, fill=txt_col)
        cur_x += bw + 10

    # Domain Tag (bottom left)
    draw.text((left_x, 485), "winstash.net", font=f_url, fill=(165, 180, 252, 255))
    draw.text((left_x + 125, 487), "— Free to start · Pro $5.99/mo", font=f_card_sub, fill=(113, 113, 122, 255))

    # ================= RIGHT SIDE: Precision Glassmorphism Card =================
    card_x, card_y, card_w, card_h = 600, 65, 545, 500

    # Card Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([card_x - 10, card_y - 5, card_x + card_w + 10, card_y + card_h + 25], radius=24, fill=(0, 0, 0, 230))
    shadow = shadow.filter(ImageFilter.GaussianBlur(35))
    base = Image.alpha_composite(base, shadow)
    draw = ImageDraw.Draw(base)

    # Card Background Glass
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=16, fill=(17, 17, 24, 245), outline=(63, 63, 70, 170), width=1)

    # Header Bar
    header_h = 52
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + header_h], radius=16, fill=(24, 24, 34, 255))
    draw.rectangle([card_x, card_y + 30, card_x + card_w, card_y + header_h], fill=(24, 24, 34, 255))
    draw.line([(card_x, card_y + header_h), (card_x + card_w, card_y + header_h)], fill=(39, 39, 42, 220), width=1)

    # 3 Window Buttons
    draw.ellipse([card_x + 18, card_y + 20, card_x + 28, card_y + 30], fill=(239, 68, 68, 220))
    draw.ellipse([card_x + 36, card_y + 20, card_x + 46, card_y + 30], fill=(234, 179, 8, 220))
    draw.ellipse([card_x + 54, card_y + 20, card_x + 64, card_y + 30], fill=(34, 197, 94, 220))

    # Tabs (DashboardTabsEn.tsx)
    tab_x = card_x + 85
    # Tab 1: Weekly Snippets (Active)
    draw.rounded_rectangle([tab_x, card_y + 11, tab_x + 130, card_y + 41], radius=6, fill=(79, 70, 229, 230), outline=(129, 140, 248, 160), width=1)
    draw.text((tab_x + 14, card_y + 18), "Weekly Snippets", font=ImageFont.truetype(font_bold, 11), fill=(255, 255, 255, 255))
    # Tab 2: Performance Review
    draw.rounded_rectangle([tab_x + 138, card_y + 11, tab_x + 280, card_y + 41], radius=6, fill=(30, 30, 42, 140))
    draw.text((tab_x + 150, card_y + 18), "Performance Review", font=ImageFont.truetype(font_reg, 11), fill=(161, 161, 170, 220))
    # Tab 3: Career Portfolio
    draw.rounded_rectangle([tab_x + 288, card_y + 11, tab_x + 410, card_y + 41], radius=6, fill=(30, 30, 42, 140))
    draw.text((tab_x + 300, card_y + 18), "Career Portfolio", font=ImageFont.truetype(font_reg, 11), fill=(113, 113, 122, 200))

    # Input Box: Raw Notes
    in_x, in_y, in_w, in_h = card_x + 20, card_y + 72, card_w - 40, 95
    draw.rounded_rectangle([in_x, in_y, in_x + in_w, in_y + in_h], radius=8, fill=(11, 11, 16, 240), outline=(39, 39, 42, 180), width=1)
    draw.text((in_x + 14, in_y + 12), "FRIDAY RAW INPUT (1-MIN BRAIN DUMP)", font=ImageFont.truetype(font_bold, 10), fill=(113, 113, 122, 255))
    draw.text((in_x + 14, in_y + 36), "> emergency hotfix on payment gateway timeout spike during flash sale", font=f_code, fill=(212, 212, 216, 240))
    draw.text((in_x + 14, in_y + 60), "> tuned HikariCP pool, added Redis L2 cache, latency cut from 1.2s to 85ms", font=f_code, fill=(161, 161, 170, 220))

    # Divider & "STRUCTURED OUTPUT" label
    trans_y = in_y + in_h + 16
    draw.text((card_x + 22, trans_y), "AUTOMATICALLY STRUCTURED: WEEKLY SNIPPETS", font=ImageFont.truetype(font_bold, 11), fill=(129, 140, 248, 255))

    # Output Box (Matching Weekly Snippets format: DONE, IN PROGRESS, NEXT WEEK)
    out_x, out_y, out_w, out_h = card_x + 20, trans_y + 24, card_w - 40, 215
    draw.rounded_rectangle([out_x, out_y, out_x + out_w, out_y + out_h], radius=10, fill=(22, 22, 30, 220), outline=(79, 70, 229, 90), width=1)

    items = [
        ("DONE", (16, 185, 129, 255), (6, 78, 59, 200), "Slashed P99 payment latency by 93% (1,200ms -> 85ms) with 0% error."),
        ("DONE", (16, 185, 129, 255), (6, 78, 59, 200), "Resolved HikariCP pool starvation & deployed Redis distributed L2 cache."),
        ("IN PROGRESS", (251, 191, 36, 255), (69, 26, 3, 200), "Configuring Prometheus alert thresholds for pool saturation warnings."),
        ("NEXT WEEK", (129, 140, 248, 255), (30, 27, 75, 200), "Deploy real-time Grafana APM dashboard for finance stakeholders."),
    ]
    
    cur_row_y = out_y + 16
    for tag, tag_color, tag_bg, desc in items:
        tag_w = 95 if len(tag) > 7 else (82 if len(tag) > 4 else 54)
        draw.rounded_rectangle([out_x + 14, cur_row_y, out_x + 14 + tag_w, cur_row_y + 25], radius=4, fill=tag_bg, outline=tag_color, width=1)
        draw.text((out_x + 22, cur_row_y + 5), tag, font=ImageFont.truetype(font_bold, 10), fill=tag_color)
        draw.text((out_x + 22 + tag_w, cur_row_y + 5), desc, font=ImageFont.truetype(font_reg, 12), fill=(228, 228, 231, 240))
        cur_row_y += 46

    # Save to public and app
    root = os.path.dirname(os.path.abspath(__file__))
    for rel in ("public/og-image.png", "app/opengraph-image.png", "app/twitter-image.png"):
        base.save(os.path.join(root, rel), "PNG", optimize=True)
    print("New Open Graph image (1200x630) generated successfully with 100% matched service data!")

create_og_image()
