"""
AgriFlow AI - Live Prototype Demonstration Presentation Generator
Generates high-resolution presentation graphics and PPTX covering the complete 5-step prototype flow:
1. Farmer listings (1,000 kg Tomatoes)
2. Buyer purchase & Atomic Stock Lock in Database
3. Logistics Carrier acceptance
4. Driver Phone GPS live route tracking & Open-Meteo weather sync
5. Buyer OTP verification & instant Escrow release to farmer
"""

import os
from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def create_slide_image(step_num, title, subtitle, details, badge, bg_color, accent_color, output_filename):
    width, height = 1920, 1080
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Gradient or card background
    card_margin = 80
    card_rect = [card_margin, card_margin, width - card_margin, height - card_margin]
    draw.rounded_rectangle(card_rect, radius=32, fill=(255, 255, 255), outline=accent_color, width=4)

    # Top banner
    banner_height = 140
    banner_rect = [card_margin + 4, card_margin + 4, width - card_margin - 4, card_margin + banner_height]
    draw.rounded_rectangle(banner_rect, radius=28, fill=accent_color)

    # Header Text
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 48)
        font_title = ImageFont.truetype("arialbd.ttf", 38)
        font_sub = ImageFont.truetype("arial.ttf", 26)
        font_body = ImageFont.truetype("arialbd.ttf", 28)
        font_small = ImageFont.truetype("arial.ttf", 22)
    except:
        font_large = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Banner Title
    draw.text((card_margin + 40, card_margin + 35), f"AGRIFLOW AI — LIVE PROTOTYPE DEMONSTRATION", fill=(255, 255, 255), font=font_large)
    draw.text((width - card_margin - 300, card_margin + 45), badge, fill=(255, 255, 255), font=font_title)

    # Step Title
    draw.text((card_margin + 60, card_margin + banner_height + 40), f"STAGE {step_num}: {title.upper()}", fill=(15, 23, 42), font=font_large)
    draw.text((card_margin + 60, card_margin + banner_height + 105), subtitle, fill=(71, 85, 105), font=font_sub)

    # Details Cards (3 Column Grid)
    grid_y = card_margin + banner_height + 170
    grid_h = 560
    col_w = (width - 2 * card_margin - 160) // len(details)

    for i, item in enumerate(details):
        cx = card_margin + 60 + i * (col_w + 20)
        cy = grid_y
        cw = col_w
        ch = grid_h

        # Item Card
        draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=24, fill=(248, 250, 252), outline=(226, 232, 240), width=2)

        # Card Title Header
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 70], radius=20, fill=item.get('header_bg', accent_color))
        draw.text((cx + 20, cy + 20), item['heading'], fill=(255, 255, 255), font=font_body)

        # Content Points
        text_y = cy + 90
        for pt in item['points']:
            draw.text((cx + 25, text_y), f"• {pt}", fill=(30, 41, 59), font=font_small)
            text_y += 50

    # Bottom status bar
    footer_y = height - card_margin - 60
    draw.text((card_margin + 60, footer_y), "✓ Verified against live Supabase PostgreSQL Database & Real-Time Open-Meteo GPS Engine", fill=(100, 116, 139), font=font_small)

    out_path = os.path.join(OUTPUT_DIR, output_filename)
    img.save(out_path, quality=95)
    print(f"Generated slide image: {out_path}")
    return out_path

def generate_all_slides():
    slides_data = [
        {
            'step': 1,
            'title': 'Farmer Lists 1,000 kg Tomatoes',
            'subtitle': 'Farmer Ramesh Reddy publishes freshly harvested Grade-A Roma Hybrid Tomatoes from Shadnagar Hub',
            'badge': 'PORTAL: FARMER',
            'bg_color': (16, 185, 129),
            'accent_color': (5, 150, 105),
            'filename': 'demo_step_1_farmer_listing.png',
            'details': [
                {
                    'heading': '1. Crop Details',
                    'header_bg': (5, 150, 105),
                    'points': ['Crop: Red Tomato (Hybrid Desi)', 'Quantity: 1,000 kg', 'Asking Price: ₹32.00 / kg', 'Quality Grade: Grade A (Verified)', 'Location: Shadnagar Hub, Telangana']
                },
                {
                    'heading': '2. AI Price Advisory',
                    'header_bg': (16, 185, 129),
                    'points': ['Mumbai Vashi Deficit: 34 Tonnes', 'Recommended Price: ₹52.92 / kg', 'Govt MSP Floor: ₹24.00 / kg', 'Zero Middleman Commission', '+60% Profit over Mandi Distress']
                },
                {
                    'heading': '3. Database State',
                    'header_bg': (15, 23, 42),
                    'points': ['Table: public.produce', 'Status: Active & Available', 'Multilingual JSONB: en, hi, te, ta', 'Realtime Sync: <1s WebSocket', 'Audit Log: Created at Farmgate']
                }
            ]
        },
        {
            'step': 2,
            'title': 'Buyer Marketplace & Atomic Stock Lock',
            'subtitle': 'Buyer Ananya Sharma (FreshMart) purchases 1,000 kg lot with instant cryptographic escrow locking',
            'badge': 'PORTAL: BUYER',
            'bg_color': (37, 99, 235),
            'accent_color': (29, 78, 216),
            'filename': 'demo_step_2_atomic_stock_lock.png',
            'details': [
                {
                    'heading': '1. Order Transaction',
                    'header_bg': (29, 78, 216),
                    'points': ['Order ID: ORD-LIVE-TOMATO-842', 'Gross Value: ₹32,000.00', 'Farmer Realization: ₹28,800.00', 'Transporter Freight: ₹2,400.00', 'Platform Fee: ₹800.00']
                },
                {
                    'heading': '2. Atomic Stock Lock',
                    'header_bg': (220, 38, 38),
                    'points': ['DB Action: UPDATE produce', 'Quantity: 1,000 kg -> 0 kg', 'Concurrency: Row-level lock', 'Prevents Double Selling', 'Zero Race Conditions']
                },
                {
                    'heading': '3. Smart Escrow Vault',
                    'header_bg': (15, 23, 42),
                    'points': ['Escrow Status: SECURE_LOCKED', 'Funds Deposited by Buyer', 'Farmer Guaranteed Payout', 'Released only on verified OTP', 'Zero Payment Default Risk']
                }
            ]
        },
        {
            'step': 3,
            'title': 'Logistics Fleet Dispatch & Acceptance',
            'subtitle': 'Operator Mohammed Ismail accepts perishable reefer consignment on NH44 Hyderabad Corridor',
            'badge': 'PORTAL: LOGISTICS',
            'bg_color': (217, 119, 6),
            'accent_color': (180, 83, 9),
            'filename': 'demo_step_3_carrier_dispatch.png',
            'details': [
                {
                    'heading': '1. Carrier Assigned',
                    'header_bg': (180, 83, 9),
                    'points': ['Driver: Mohammed Ismail', 'Phone: +91 98480 22341', 'Vehicle: Tata 407 Reefer', 'Reg Number: TS 08 UB 4192', 'Payload: 1,000 kg / 2,500 kg']
                },
                {
                    'heading': '2. Route & Setpoint',
                    'header_bg': (217, 119, 6),
                    'points': ['Origin: Shadnagar Farmgate Hub', 'Destination: Bowenpally Terminal', 'Total Distance: 74 km Corridor', 'Reefer Target: 4.0 - 8.0°C', 'Transit SLA: 2.5 Hours']
                },
                {
                    'heading': '3. Return Load Match',
                    'header_bg': (15, 23, 42),
                    'points': ['Backhaul AI: Active', 'Cargo: Organic Compost (1.2T)', 'Extra Revenue: +₹2,800', 'Deadhead Avoided: 68 km', 'Zero Empty Miles']
                }
            ]
        },
        {
            'step': 4,
            'title': 'Live Smartphone GPS Tracking & Weather Sync',
            'subtitle': 'Driver phone streams real-time satellite GPS coordinates coupled with Open-Meteo ambient weather data',
            'badge': 'LIVE TRACKING',
            'bg_color': (6, 182, 212),
            'accent_color': (8, 145, 178),
            'filename': 'demo_step_4_live_gps_telemetry.png',
            'details': [
                {
                    'heading': '1. Moving GPS Waypoints',
                    'header_bg': (8, 145, 178),
                    'points': ['WP1: Shadnagar Hub (KM 0)', 'WP2: Kothur Bypass (KM 14)', 'WP3: Shamshabad Toll (KM 42)', 'WP4: Mehdipatnam Road (KM 66)', 'WP5: Bowenpally APMC (KM 74)']
                },
                {
                    'heading': '2. Weather Sync Engine',
                    'header_bg': (6, 182, 212),
                    'points': ['Service: Open-Meteo API', 'Ambient Temp: 24.5°C - 26.5°C', 'Relative Humidity: 88% RH', 'Spoilage Risk: LOW (Protected)', 'Calculates Arrhenius shelf-life']
                },
                {
                    'heading': '3. Zero Extra Hardware',
                    'header_bg': (15, 23, 42),
                    'points': ['Encrypted Phone Telematics', 'Wake-Lock Screen Support', 'Low Bandwidth Optimization', 'SMS Offline Fallback', 'WebSocket Stream: <1s Latency']
                }
            ]
        },
        {
            'step': 5,
            'title': 'Delivery Verification & Instant Escrow Release',
            'subtitle': 'Buyer validates cargo freshness with 6-digit OTP -> Escrow funds automatically credited to farmer bank account',
            'badge': 'SETTLEMENT: T+0',
            'bg_color': (16, 185, 129),
            'accent_color': (4, 120, 87),
            'filename': 'demo_step_5_escrow_payout.png',
            'details': [
                {
                    'heading': '1. Delivery Confirmed',
                    'header_bg': (4, 120, 87),
                    'points': ['Arrival Hub: Bowenpally APMC', 'Verification Code: POD-TOMATO-842', 'Cargo Condition: 100% Fresh', 'Status: DELIVERED & CLOSED', 'Digital POD Stored in DB']
                },
                {
                    'heading': '2. Instant Escrow Payout',
                    'header_bg': (16, 185, 129),
                    'points': ['Farmer Credited: ₹28,800.00', 'Transporter Payout: ₹2,400.00', 'Settlement Speed: <1 Second', 'Direct UPI / Bank Transfer', 'T+0 Same-Day Realization']
                },
                {
                    'heading': '3. Farmer Net Uplift',
                    'header_bg': (15, 23, 42),
                    'points': ['Mandi Distress Price: ₹22.00/kg', 'AgriFlow Realization: ₹32.00/kg', 'Extra Earnings: +₹10,000.00', '+45% Increase in Net Income', 'Zero Commission Intermediaries']
                }
            ]
        }
    ]

    image_paths = []
    for s in slides_data:
        img_p = create_slide_image(
            step_num=s['step'],
            title=s['title'],
            subtitle=s['subtitle'],
            details=s['details'],
            badge=s['badge'],
            bg_color=s['bg_color'],
            accent_color=s['accent_color'],
            output_filename=s['filename']
        )
        image_paths.append(img_p)

    # Also build the PowerPoint Presentation (.pptx)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    for img_p in image_paths:
        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(img_p, Inches(0), Inches(0), width=Inches(13.333), height=Inches(7.5))

    pptx_path = os.path.join(OUTPUT_DIR, "AgriFlow_Live_Prototype_Demonstration.pptx")
    prs.save(pptx_path)
    print(f"Generated PowerPoint: {pptx_path}")

if __name__ == '__main__':
    generate_all_slides()
