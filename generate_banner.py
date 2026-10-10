import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_stunning_twitter_banner():
    W, H = 1500, 500
    
    # 1. Base Dark Canvas
    base = Image.new("RGBA", (W, H), (9, 9, 13, 255))

    # 2. Rich Aurora Gradient Glows
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    g_draw.ellipse([800, -80, 1600, 480], fill=(79, 70, 229, 90))
    g_draw.ellipse([1050, 180, 1550, 560], fill=(124, 58, 237, 70))
    g_draw.ellipse([1200, -50, 1480, 250], fill=(56, 189, 248, 45))
    g_draw.ellipse([40, -120, 500, 280], fill=(79, 70, 229, 35))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(80))
    base = Image.alpha_composite(base, glow_layer)

    # 3. Soft Dot Grid Pattern (fades gracefully)
    dot_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(dot_layer)
    for x in range(30, W, 28):
        for y in range(20, H, 28):
            d_draw.ellipse([x, y, x + 2, y + 2], fill=(255, 255, 255, 18))
    
    dot_mask = Image.new("L", (W, H), 0)
    m_draw = ImageDraw.Draw(dot_mask)
    m_draw.rectangle([750, 0, W, H], fill=90)
    m_draw.ellipse([800, -50, 1600, 550], fill=120)
    dot_mask = dot_mask.filter(ImageFilter.GaussianBlur(30))
    dot_layer.putalpha(dot_mask)
    base = Image.alpha_composite(base, dot_layer)

    draw = ImageDraw.Draw(base)

    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"

    f_pill = ImageFont.truetype(font_bold, 13)
    f_title = ImageFont.truetype(font_bold, 45)
    f_sub = ImageFont.truetype(font_reg, 19)
    f_tag = ImageFont.truetype(font_bold, 12)
    f_card_sub = ImageFont.truetype(font_reg, 13)
    f_code = ImageFont.truetype(font_reg, 13)
    f_url = ImageFont.truetype(font_bold, 16)

    # ================= LEFT SIDE: Hero Typography & Value Prop =================
    icon_x, icon_y = 90, 60
    pill_w = 260
    draw.rounded_rectangle([icon_x, icon_y, icon_x + pill_w, icon_y + 32], radius=16, fill=(30, 27, 75, 200), outline=(99, 102, 241, 160), width=1)
    draw.ellipse([icon_x + 14, icon_y + 11, icon_x + 22, icon_y + 19], fill=(129, 140, 248, 255))
    draw.text((icon_x + 32, icon_y + 7), "WINSTASH  /  AI CAREER MEMORY", font=f_pill, fill=(224, 231, 255, 255))

    # Bold Headlines
    draw.text((90, 118), "Never lose track of", font=f_title, fill=(255, 255, 255, 255))
    draw.text((90, 174), "what you achieved.", font=f_title, fill=(165, 180, 252, 255))

    # Subtext (Problem & Solution)
    draw.text((90, 252), "Dump 1 minute of raw notes on Friday.", font=f_sub, fill=(244, 244, 245, 240))
    draw.text((90, 282), "Automatically turns into manager-ready updates & brag sheets.", font=f_sub, fill=(161, 161, 170, 230))

    # 3 Clean Feature Badges (Matched with actual service tab names)
    badge_y = 345
    badges = [
        ("WEEKLY SNIPPETS", (30, 27, 75, 240), (99, 102, 241, 180), (238, 242, 255, 255), (129, 140, 248, 255)),
        ("PERFORMANCE REVIEW", (24, 24, 32, 240), (63, 63, 70, 180), (228, 228, 231, 255), (52, 211, 153, 255)),
        ("CAREER PORTFOLIO", (24, 24, 32, 240), (63, 63, 70, 180), (228, 228, 231, 255), (251, 191, 36, 255)),
    ]
    cur_x = 90
    for text, bg_col, border_col, txt_col, dot_col in badges:
        bbox = draw.textbbox((0, 0), text, font=f_tag)
        bw = (bbox[2] - bbox[0]) + 38
        bh = 32
        draw.rounded_rectangle([cur_x, badge_y, cur_x + bw, badge_y + bh], radius=8, fill=bg_col, outline=border_col, width=1)
        draw.ellipse([cur_x + 12, badge_y + 12, cur_x + 18, badge_y + 18], fill=dot_col)
        draw.text((cur_x + 26, badge_y + 8), text, font=f_tag, fill=txt_col)
        cur_x += bw + 10

    # Domain Tag (bottom left)
    draw.text((92, 412), "winstash.net", font=f_url, fill=(165, 180, 252, 255))
    draw.text((205, 414), "— Free to start · Pro $5.99/mo", font=f_card_sub, fill=(113, 113, 122, 255))

    # ================= RIGHT SIDE: Precision Glassmorphism UI Mockup =================
    card_x, card_y, card_w, card_h = 820, 60, 600, 380

    # Outer Ambient Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([card_x - 10, card_y - 5, card_x + card_w + 10, card_y + card_h + 25], radius=24, fill=(0, 0, 0, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(35))
    base = Image.alpha_composite(base, shadow)
    draw = ImageDraw.Draw(base)

    # Card Background Glass
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=16, fill=(17, 17, 24, 240), outline=(63, 63, 70, 160), width=1)

    # Card Top Navigation Bar
    header_h = 50
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + header_h], radius=16, fill=(24, 24, 34, 255))
    draw.rectangle([card_x, card_y + 30, card_x + card_w, card_y + header_h], fill=(24, 24, 34, 255))
    draw.line([(card_x, card_y + header_h), (card_x + card_w, card_y + header_h)], fill=(39, 39, 42, 220), width=1)

    # 3 Window Buttons
    draw.ellipse([card_x + 18, card_y + 19, card_x + 28, card_y + 29], fill=(239, 68, 68, 220))
    draw.ellipse([card_x + 36, card_y + 19, card_x + 46, card_y + 29], fill=(234, 179, 8, 220))
    draw.ellipse([card_x + 54, card_y + 19, card_x + 64, card_y + 29], fill=(34, 197, 94, 220))

    # Actual 3 Tabs in WinStash (DashboardTabsEn.tsx)
    tab_x = card_x + 85
    # Tab 1: Weekly Snippets (Active)
    draw.rounded_rectangle([tab_x, card_y + 11, tab_x + 130, card_y + 39], radius=6, fill=(79, 70, 229, 230), outline=(129, 140, 248, 160), width=1)
    draw.text((tab_x + 14, card_y + 17), "Weekly Snippets", font=ImageFont.truetype(font_bold, 11), fill=(255, 255, 255, 255))
    
    # Tab 2: Performance Review
    draw.rounded_rectangle([tab_x + 138, card_y + 11, tab_x + 275, card_y + 39], radius=6, fill=(30, 30, 42, 140))
    draw.text((tab_x + 150, card_y + 17), "Performance Review", font=ImageFont.truetype(font_reg, 11), fill=(161, 161, 170, 220))

    # Tab 3: Career Portfolio
    draw.rounded_rectangle([tab_x + 283, card_y + 11, tab_x + 400, card_y + 39], radius=6, fill=(30, 30, 42, 140))
    draw.text((tab_x + 295, card_y + 17), "Career Portfolio", font=ImageFont.truetype(font_reg, 11), fill=(113, 113, 122, 200))

    # Input Box: "FRIDAY RAW INPUT (1-MIN BRAIN DUMP)"
    in_x, in_y, in_w, in_h = card_x + 20, card_y + 66, card_w - 40, 68
    draw.rounded_rectangle([in_x, in_y, in_x + in_w, in_y + in_h], radius=8, fill=(11, 11, 16, 240), outline=(39, 39, 42, 180), width=1)
    draw.text((in_x + 14, in_y + 9), "FRIDAY RAW INPUT (1-MIN BRAIN DUMP)", font=ImageFont.truetype(font_bold, 10), fill=(113, 113, 122, 255))
    draw.text((in_x + 14, in_y + 28), "> emergency hotfix on payment gateway timeout spike during flash sale", font=f_code, fill=(212, 212, 216, 240))
    draw.text((in_x + 14, in_y + 46), "> tuned HikariCP pool, added Redis L2 cache, latency cut from 1.2s to 85ms", font=f_code, fill=(161, 161, 170, 220))

    # Divider & "STRUCTURED OUTPUT" label
    trans_y = in_y + in_h + 10
    draw.text((card_x + 22, trans_y), "AUTOMATICALLY STRUCTURED: WEEKLY SNIPPETS", font=ImageFont.truetype(font_bold, 11), fill=(129, 140, 248, 255))

    # Transformed Result Box (Matching actual app format: DONE, IN PROGRESS, NEXT WEEK)
    out_x, out_y, out_w, out_h = card_x + 20, trans_y + 22, card_w - 40, 150
    draw.rounded_rectangle([out_x, out_y, out_x + out_w, out_y + out_h], radius=10, fill=(22, 22, 30, 220), outline=(79, 70, 229, 90), width=1)

    items = [
        ("DONE", (16, 185, 129, 255), (6, 78, 59, 200), "Slashed P99 payment latency by 93% (1,200ms -> 85ms) with 0% error."),
        ("DONE", (16, 185, 129, 255), (6, 78, 59, 200), "Resolved HikariCP pool starvation & deployed Redis distributed L2 cache."),
        ("NEXT WEEK", (129, 140, 248, 255), (30, 27, 75, 200), "Deploy real-time Grafana APM dashboard for finance stakeholders."),
    ]
    
    cur_row_y = out_y + 16
    for tag, tag_color, tag_bg, desc in items:
        # Tag pill
        tag_w = 88 if len(tag) > 4 else 56
        draw.rounded_rectangle([out_x + 14, cur_row_y, out_x + 14 + tag_w, cur_row_y + 24], radius=4, fill=tag_bg, outline=tag_color, width=1)
        draw.text((out_x + 22, cur_row_y + 5), tag, font=ImageFont.truetype(font_bold, 10), fill=tag_color)
        draw.text((out_x + 24 + tag_w, cur_row_y + 4), desc, font=ImageFont.truetype(font_reg, 12), fill=(228, 228, 231, 240))
        cur_row_y += 42

    # Save
    root = os.path.dirname(os.path.abspath(__file__))
    base.save(os.path.join(root, "public", "x-header.png"), "PNG", optimize=True)
    print("Header successfully regenerated with 100% matched service data!")

create_stunning_twitter_banner()
