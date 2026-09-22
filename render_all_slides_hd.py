import os
import sys
from PIL import Image, ImageDraw, ImageFont

# 3840 x 2160 (4K UHD 16:9)
W, H = 3840, 2160

BG_COLOR = (10, 15, 29)          # #0A0F1D
CARD_BG = (17, 24, 39)           # #111827
BORDER_EMERALD = (16, 185, 129)  # #10B981
BORDER_CYAN = (6, 182, 212)      # #06B6D4
BORDER_AMBER = (245, 158, 11)    # #F59E0B
BORDER_ROSE = (244, 63, 94)      # #F43F5E
BORDER_PURPLE = (168, 85, 247)   # #A855F7
BORDER_PINK = (236, 72, 153)     # #EC4899

TEXT_WHITE = (255, 255, 255)
TEXT_MINT = (52, 211, 153)
TEXT_CYAN = (56, 189, 248)
TEXT_AMBER = (251, 191, 36)
TEXT_ROSE = (251, 113, 133)
TEXT_PURPLE = (192, 132, 252)
TEXT_SLATE300 = (203, 213, 225)
TEXT_SLATE400 = (148, 163, 184)

def get_font(size, bold=False):
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

def draw_header(draw, cat_text, title_text):
    font_cat = get_font(34, bold=True)
    font_title = get_font(60, bold=True)
    draw.text((230, 115), cat_text.upper(), font=font_cat, fill=TEXT_MINT)
    draw.text((230, 190), title_text, font=font_title, fill=TEXT_WHITE)

def draw_rounded_card(draw, x, y, w, h, border_col, fill_col=CARD_BG, r=28, border_w=4):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=fill_col, outline=border_col, width=border_w)

def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
    if current_line:
        lines.append(" ".join(current_line))
    return lines

def render_all_slides():
    os.makedirs("slides_hd", exist_ok=True)
    print("Rendering high-res slide images...")

    # Slide 1
    im1 = Image.new("RGB", (W, H), BG_COLOR)
    d1 = ImageDraw.Draw(im1)
    draw_rounded_card(d1, 345, 288, 3150, 1584, BORDER_EMERALD, border_w=6, r=40)
    
    font_hero_cat = get_font(38, bold=True)
    font_hero_title = get_font(120, bold=True)
    font_hero_sub = get_font(48, bold=True)
    font_hero_desc = get_font(36)
    font_hero_badge = get_font(34, bold=True)
    
    t_cat = "SMART INDIA HACKATHON 2026 • PROBLEM STATEMENT 33"
    bbox = d1.textbbox((0, 0), t_cat, font=font_hero_cat)
    d1.text(((W - (bbox[2] - bbox[0])) // 2, 440), t_cat, font=font_hero_cat, fill=TEXT_MINT)
    
    t_title = "AgriFlow AI"
    bbox = d1.textbbox((0, 0), t_title, font=font_hero_title)
    d1.text(((W - (bbox[2] - bbox[0])) // 2, 560), t_title, font=font_hero_title, fill=TEXT_WHITE)
    
    t_sub = "Decentralized Smart Agri-Logistics & Direct Procurement Protocol"
    bbox = d1.textbbox((0, 0), t_sub, font=font_hero_sub)
    d1.text(((W - (bbox[2] - bbox[0])) // 2, 780), t_sub, font=font_hero_sub, fill=TEXT_CYAN)
    
    desc_lines = wrap_text("Empowering 140M+ Indian Farmers with AI Cold-Chain IoT Telematics, Direct Institutional Sourcing, and Guaranteed Above-MSP T+0 Bank Payouts.", font_hero_desc, 2600, d1)
    y_text = 940
    for line in desc_lines:
        bbox = d1.textbbox((0, 0), line, font=font_hero_desc)
        d1.text(((W - (bbox[2] - bbox[0])) // 2, y_text), line, font=font_hero_desc, fill=TEXT_SLATE300)
        y_text += 60
        
    t_badge = "🌾 Multi-Stakeholder Ecosystem   •   🌐 11 Indian Languages   •   ❄️ 0-4°C Active Cold Chain   •   ⚡ T+0 RBI Escrow"
    bbox = d1.textbbox((0, 0), t_badge, font=font_hero_badge)
    d1.text(((W - (bbox[2] - bbox[0])) // 2, 1420), t_badge, font=font_hero_badge, fill=TEXT_AMBER)
    
    im1.save("slides_hd/slide_1.png")
    print("Slide 1 rendered.")

    # Slide 8: Completed IoT
    im8 = Image.new("RGB", (W, H), BG_COLOR)
    d8 = ImageDraw.Draw(im8)
    draw_header(d8, "Smart India Hackathon 2026 • Problem Statement 33", "AI Cold-Chain Telematics & Active Perishable Preservation")
    
    cards_s8 = [
        ("HARDWARE SENSORS", "❄️ 0-4°C Multi-Sensor IoT Telematics", "Microcontroller Hardware Telemetry Pipeline", "Continuous sampling via ESP32 / Teltonika FMB920 gateways: DS18B20 digital temperature probe (±0.1°C), DHT22 relative humidity sensor (85-90% RH), and MQ-4 ethylene gas ppm sensor.", BORDER_CYAN),
        ("PREDICTIVE AI", "📉 Arrhenius Kinetic Decay Modeling", "AI Spoilage Risk & Shelf-Life Calculation", "Real-time shelf-life loss computation (k = A·e^(-Ea/RT)) comparing ambient storage degradation (3-4 days) vs active cold-chain stabilization (18-21 days) with automatic quality alerts.", BORDER_EMERALD),
        ("SMART ROUTING", "🗺️ Dynamic Cold-Corridor GPS Routing", "Autonomous Heat & Congestion Avoidance", "Live PostGIS GPS telemetry streams trigger automatic re-routing away from urban heat islands and road gridlocks, preserving cooling compressor battery cycles and cargo integrity.", BORDER_AMBER),
        ("QC PROVENANCE", "📱 Cryptographic QR Cold Waybill", "Tamper-Proof Farm-to-Fork Provenance", "Generates immutable SHA-256 digital waybills encoding farm origin, continuous reefer temperature compliance, and driver GPS timestamps for buyer receipt sign-off.", BORDER_PURPLE),
    ]
    
    w_card = 1630
    h_card = 680
    gap_x = 115
    gap_y = 70
    top_y = 520
    left_x = 230
    
    font_badge = get_font(28, bold=True)
    font_title = get_font(38, bold=True)
    font_sub = get_font(30, bold=True)
    font_desc = get_font(28)
    
    for i, (badge, title, sub, desc, border_col) in enumerate(cards_s8):
        col = i % 2
        row = i // 2
        x = left_x + col * (w_card + gap_x)
        y = top_y + row * (h_card + gap_y)
        
        draw_rounded_card(d8, x, y, w_card, h_card, border_col)
        
        d8.text((x + 60, y + 50), badge, font=font_badge, fill=TEXT_MINT)
        d8.text((x + 60, y + 105), title, font=font_title, fill=TEXT_WHITE)
        d8.text((x + 60, y + 175), sub, font=font_sub, fill=TEXT_CYAN)
        
        lines = wrap_text(desc, font_desc, w_card - 120, d8)
        dy = y + 250
        for l in lines:
            d8.text((x + 60, dy), l, font=font_desc, fill=TEXT_SLATE300)
            dy += 45
            
    im8.save("slides_hd/slide_8.png")
    print("Slide 8 rendered.")

if __name__ == "__main__":
    render_all_slides()
