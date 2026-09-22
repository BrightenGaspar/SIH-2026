"""
AgriFlow AI - Standalone Prototype Video & Animated Demo Generator
Renders a complete frame-by-frame video covering:
1. Farmer lists 1,000 kg Tomatoes
2. Buyer sees on marketplace and orders
3. Database Atomic Stock Lock
4. Logistics Partner accepts trip
5. Driver starts Phone GPS -> Live Route Map updates in real-time
6. Buyer verifies with OTP -> Escrow released instantly to farmer
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

WIDTH, HEIGHT = 1280, 720  # 720p HD for fast rendering and smooth playback

try:
    font_hero = ImageFont.truetype("arialbd.ttf", 32)
    font_title = ImageFont.truetype("arialbd.ttf", 26)
    font_subtitle = ImageFont.truetype("arial.ttf", 18)
    font_card_head = ImageFont.truetype("arialbd.ttf", 18)
    font_body = ImageFont.truetype("arial.ttf", 15)
    font_badge = ImageFont.truetype("arialbd.ttf", 14)
    font_big = ImageFont.truetype("arialbd.ttf", 40)
except:
    font_hero = ImageFont.load_default()
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_card_head = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_badge = ImageFont.load_default()
    font_big = ImageFont.load_default()

def draw_header(draw, stage_num, stage_title, portal_name, theme_color):
    # Top navbar
    draw.rectangle([0, 0, WIDTH, 65], fill=(15, 23, 42))
    draw.line([0, 65, WIDTH, 65], fill=theme_color, width=2)

    draw.text((30, 18), "AGRIFLOW AI — LIVE PROTOTYPE DEMONSTRATION", fill=(255, 255, 255), font=font_title)
    
    # Portal Chip
    badge_w = 260
    draw.rounded_rectangle([WIDTH - badge_w - 30, 14, WIDTH - 30, 52], radius=10, fill=theme_color)
    draw.text((WIDTH - badge_w - 15, 22), portal_name, fill=(0, 0, 0), font=font_badge)

    # Stage Banner
    draw.rectangle([0, 67, WIDTH, 125], fill=(30, 41, 59))
    draw.text((30, 75), f"STAGE {stage_num}: {stage_title}", fill=theme_color, font=font_hero)
    draw.line([0, 125, WIDTH, 125], fill=(51, 65, 85), width=1)

def draw_card(draw, x, y, w, h, title, header_color, points):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
    draw.rounded_rectangle([x, y, x + w, y + 40], radius=10, fill=header_color)
    draw.text((x + 14, y + 10), title, fill=(255, 255, 255), font=font_card_head)

    cy = y + 55
    for pt in points:
        draw.text((x + 14, cy), "•", fill=(56, 189, 248), font=font_body)
        draw.text((x + 30, cy), pt, fill=(226, 232, 240), font=font_body)
        cy += 28

def draw_footer(draw, progress_fraction, narration):
    # Bottom Bar
    draw.rectangle([0, HEIGHT - 85, WIDTH, HEIGHT], fill=(15, 23, 42))
    draw.line([0, HEIGHT - 85, WIDTH, HEIGHT - 85], fill=(51, 65, 85), width=2)

    # Progress Bar
    bar_w = WIDTH - 60
    fill_w = int(bar_w * progress_fraction)
    draw.rounded_rectangle([30, HEIGHT - 75, WIDTH - 30, HEIGHT - 67], radius=4, fill=(51, 65, 85))
    if fill_w > 0:
        draw.rounded_rectangle([30, HEIGHT - 75, 30 + fill_w, HEIGHT - 67], radius=4, fill=(16, 185, 129))

    # Narration subtitle
    draw.text((30, HEIGHT - 55), f"🗣️ \"{narration}\"", fill=(203, 213, 225), font=font_subtitle)

def render_frame_stage1(progress):
    img = Image.new('RGB', (WIDTH, HEIGHT), (2, 6, 23))
    draw = ImageDraw.Draw(img)
    draw_header(draw, 1, "FARMER LISTS 1,000 KG TOMATOES", "PORTAL: FARMER (/produce)", (16, 185, 129))

    draw_card(draw,30, 145, 380, 470, "1. Harvest Specification", (5, 150, 105), [
        "Farmer: Ramesh Reddy",
        "Crop: Red Tomato (Hybrid Desi)",
        "Listing Quantity: 1,000 kg",
        "Unit Price: ₹32.00 / kg",
        "Grade: Grade A (Verified)",
        "Origin: Shadnagar Hub, TS",
        "Status: Active Listing"
    ])

    draw_card(draw,440, 145, 400, 470, "2. AI Pricing Engine", (16, 185, 129), [
        "Mumbai Vashi Deficit: 34 Tonnes",
        "AI Advice: Sell Now @ ₹52.92/kg",
        "Govt MSP Floor: ₹24.00 / kg",
        "Mandi Distress: ₹22.00 / kg",
        "Farmer Uplift: +60.5% Gain",
        "Zero Middleman Commission"
    ])

    draw_card(draw,870, 145, 380, 470, "3. Database Synchronization", (37, 99, 235), [
        "Table: public.produce",
        "Multilingual: en, hi, te, ta",
        "WebSocket Sync: <1s Latency",
        "Realtime WebSocket: Connected",
        "Available Stock: 1,000 kg",
        "Ready for Marketplace Orders"
    ])

    draw_footer(draw, 0.05 + progress * 0.15, "Here, a Farmer lists 1,000 kilograms of tomatoes at ₹32/kg on the platform.")
    return img

def render_frame_stage2(progress):
    img = Image.new('RGB', (WIDTH, HEIGHT), (2, 6, 23))
    draw = ImageDraw.Draw(img)
    draw_header(draw, 2, "BUYER ORDER & ATOMIC STOCK LOCK", "PORTAL: BUYER (/marketplace)", (37, 99, 235))

    draw_card(draw,30, 145, 380, 470, "1. Buyer Order Placed", (37, 99, 235), [
        "Buyer: Ananya Sharma (FreshMart)",
        "Order ID: ORD-LIVE-TOMATO-842",
        "Purchased: 1,000 kg Tomatoes",
        "Order Total: ₹32,000.00",
        "Delivery: Bowenpally Terminal",
        "Status: Escrow Locked"
    ])

    # Highlight Atomic Lock with pulse color
    lock_color = (220, 38, 38) if int(progress * 8) % 2 == 0 else (239, 68, 68)
    draw_card(draw,440, 145, 400, 470, "2. ⚡ ATOMIC STOCK LOCK", lock_color, [
        "Action: PostgreSQL UPDATE produce",
        "Stock: 1,000 kg -> 0 kg (RESERVED)",
        "Lock: Row-Level Concurrency Lock",
        "Double Selling: 100% Prevented",
        "Race Conditions: 0% Risk",
        "Status: Lot Reserved for Ananya"
    ])

    draw_card(draw,870, 145, 380, 470, "3. Smart Escrow Vault", (16, 185, 129), [
        "Farmer Share: ₹28,800.00",
        "Logistics Fee: ₹2,400.00",
        "Platform Fee: ₹800.00",
        "Escrow Status: SECURE_LOCKED",
        "Unlock Trigger: Validated Buyer OTP",
        "Zero Default Risk for Farmer"
    ])

    draw_footer(draw, 0.20 + progress * 0.20, "Immediately, a Buyer sees this on the marketplace and places an order. The system performs an Atomic Stock Lock in the database.")
    return img

def render_frame_stage3(progress):
    img = Image.new('RGB', (WIDTH, HEIGHT), (2, 6, 23))
    draw = ImageDraw.Draw(img)
    draw_header(draw, 3, "LOGISTICS PARTNER ACCEPTS TRIP", "PORTAL: LOGISTICS (/dashboard)", (245, 158, 11))

    draw_card(draw,30, 145, 380, 470, "1. Assigned Fleet Carrier", (217, 119, 6), [
        "Carrier: Mohammed Ismail",
        "Phone: +91 98480 22341",
        "Vehicle: Tata 407 Reefer",
        "Reg No: TS 08 UB 4192",
        "Capacity: 1,000 kg / 2,500 kg",
        "Status: Dispatched to Farm"
    ])

    draw_card(draw,440, 145, 400, 470, "2. Cold-Chain Corridor", (6, 182, 212), [
        "Trip Code: TRIP-HYD-TOMATO-842",
        "Origin: Shadnagar Farm Hub (0 km)",
        "Destination: Bowenpally (74 km)",
        "Reefer Setpoint: 4°C - 8°C",
        "Estimated Time: 2.5 Hours",
        "Status: In Transit on NH 44"
    ])

    draw_card(draw,870, 145, 380, 470, "3. Return Load AI Match", (16, 185, 129), [
        "Return Load: Organic Compost (1.2T)",
        "Return Route: Bowenpally -> Shadnagar",
        "Extra Revenue: +₹2,800.00",
        "Deadhead Avoided: 68 km",
        "Carbon Offset: 42 kg CO2",
        "Zero Empty Miles Run"
    ])

    draw_footer(draw, 0.40 + progress * 0.20, "Then, the Logistics Partner accepts the trip.")
    return img

def render_frame_stage4(progress):
    img = Image.new('RGB', (WIDTH, HEIGHT), (2, 6, 23))
    draw = ImageDraw.Draw(img)
    draw_header(draw, 4, "DRIVER PHONE GPS & LIVE MAP", "LIVE TRACKING (/tracking)", (6, 182, 212))

    # Left: Highway Map Simulation Box
    draw.rounded_rectangle([30, 145, 760, 615], radius=12, fill=(15, 23, 42), outline=(6, 182, 212), width=2)
    draw.text((50, 160), "🛰️ LIVE HIGHWAY GPS ROUTE (NH 44)", fill=(6, 182, 212), font=font_title)

    # Highway Line
    x1, y1 = 90, 450
    x2, y2 = 700, 260
    draw.line([x1, y1, x2, y2], fill=(51, 65, 85), width=10)

    # Active Progress on line
    tx = x1 + (x2 - x1) * progress
    ty = y1 + (y2 - y1) * progress
    draw.line([x1, y1, tx, ty], fill=(16, 185, 129), width=10)

    # Waypoints
    draw.ellipse([x1 - 8, y1 - 8, x1 + 8, y1 + 8], fill=(56, 189, 248))
    draw.text((x1 - 40, y1 + 14), "Shadnagar (0 km)", fill=(148, 163, 184), font=font_body)

    mid_x = x1 + (x2 - x1) * 0.5
    mid_y = y1 + (y2 - y1) * 0.5
    draw.ellipse([mid_x - 8, mid_y - 8, mid_x + 8, mid_y + 8], fill=(56, 189, 248))
    draw.text((mid_x - 50, mid_y + 14), "Shamshabad (36 km)", fill=(148, 163, 184), font=font_body)

    draw.ellipse([x2 - 8, y2 - 8, x2 + 8, y2 + 8], fill=(56, 189, 248))
    draw.text((x2 - 50, y2 + 14), "Bowenpally (74 km)", fill=(148, 163, 184), font=font_body)

    # Moving Truck Dot
    draw.ellipse([tx - 14, ty - 14, tx + 14, ty + 14], fill=(245, 158, 11), outline=(255, 255, 255), width=3)
    draw.text((tx - 40, ty - 32), "🚚 TATA 407", fill=(255, 255, 255), font=font_badge)

    # Right: Telemetry Details
    km_done = int(progress * 74)
    temp_now = f"{5.2 + progress * 1.2:.1f}"
    draw_card(draw,780, 145, 470, 470, "Real-Time Telemetry & Weather", (6, 182, 212), [
        f"Completed Distance: {km_done} / 74 km",
        f"GPS Lat/Lng: [17.{int(689 + progress * 316)}, 78.{int(2045 + progress * 282)}]",
        f"Ambient Road Temp: 25.4°C (Open-Meteo)",
        f"Reefer Cargo Temp: {temp_now}°C (Optimal 4-8°C)",
        "Chamber Humidity: 88% RH (Safe)",
        "Hardware: Driver Phone GPS (Zero Added Cost)",
        "Spoilage Risk: LOW (Zero Thermal Loss)"
    ])

    draw_footer(draw, 0.60 + progress * 0.20, "The driver starts their phone’s GPS, and you can see the Live Map updating in real-time.")
    return img

def render_frame_stage5(progress):
    img = Image.new('RGB', (WIDTH, HEIGHT), (2, 6, 23))
    draw = ImageDraw.Draw(img)
    draw_header(draw, 5, "DELIVERY OTP VERIFIED & ESCROW RELEASED", "INSTANT SETTLEMENT (T+0)", (16, 185, 129))

    draw_card(draw,30, 145, 380, 470, "1. Delivery Verification", (16, 185, 129), [
        "Arrival APMC: Bowenpally Terminal",
        "Verification OTP: POD-TOMATO-842",
        "Inspection: 100% Intact Freshness",
        "Proof of Delivery: Signed by Buyer",
        "Trip Status: DELIVERED & CLOSED",
        "Timestamp: Instant Digital POD"
    ])

    # Big Flashy Payout Box
    draw_card(draw,440, 145, 400, 470, "2. 💸 INSTANT SMART ESCROW PAYOUT", (5, 150, 105), [
        "Farmer Payout: ₹28,800.00 RELEASED",
        "Settlement Speed: <1 Second (T+0)",
        "Payment Route: Instant Bank / UPI",
        "Transporter Fee: ₹2,400.00 Credited",
        "Escrow Contract: EXECUTED & CLOSED",
        "Zero Payment Delays or Middlemen"
    ])

    draw_card(draw,870, 145, 380, 470, "3. Total Impact Summary", (139, 92, 246), [
        "Mandi Distress Baseline: ₹22,000",
        "AgriFlow Realization: ₹32,000",
        "Farmer Profit Uplift: +₹10,000 (+45%)",
        "Food Loss Prevented: 0 kg (100% Fresh)",
        "Buyer Savings: -18% vs Broker",
        "Outcome: Complete Multi-User Success"
    ])

    draw_footer(draw, 0.80 + progress * 0.20, "Finally, upon delivery, the buyer verifies with an OTP, and the Escrow payment is instantly released to the farmer.")
    return img

def create_all_video_formats():
    print("=================================================================")
    print("   GENERATING STANDALONE PROTOTYPE DEMONSTRATION VIDEO ASSETS    ")
    print("=================================================================\n")

    frames = []
    
    # 1. Stage 1 Frames (10 frames)
    for i in range(10):
        frames.append(render_frame_stage1(i / 10.0))

    # 2. Stage 2 Frames (10 frames)
    for i in range(10):
        frames.append(render_frame_stage2(i / 10.0))

    # 3. Stage 3 Frames (8 frames)
    for i in range(8):
        frames.append(render_frame_stage3(i / 8.0))

    # 4. Stage 4 Frames (16 frames for smooth truck motion)
    for i in range(16):
        frames.append(render_frame_stage4(i / 16.0))

    # 5. Stage 5 Frames (12 frames)
    for i in range(12):
        frames.append(render_frame_stage5(i / 12.0))

    print(f"Rendered {len(frames)} HD animation frames.")

    # Export 1: High-Definition Animated GIF Video
    gif_path = os.path.join(OUTPUT_DIR, "AgriFlow_Live_Prototype_Demonstration.gif")
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=350,  # 350ms per frame
        loop=0
    )
    print(f"[OK] Generated HD Animated Video GIF: {gif_path}")

    # Check if OpenCV is available to export direct MP4 / AVI
    try:
        import cv2
        import numpy as np

        # Export 2: Direct MP4 Video
        mp4_path = os.path.join(OUTPUT_DIR, "AgriFlow_Live_Prototype_Demonstration.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        video_writer = cv2.VideoWriter(mp4_path, fourcc, 4.0, (WIDTH, HEIGHT))

        for frame in frames:
            cv_img = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
            video_writer.write(cv_img)

        video_writer.release()
        print(f"[OK] Generated Direct MP4 Video: {mp4_path}")

        # Export 3: Direct AVI Video
        avi_path = os.path.join(OUTPUT_DIR, "AgriFlow_Live_Prototype_Demonstration.avi")
        fourcc_avi = cv2.VideoWriter_fourcc(*'XVID')
        video_writer_avi = cv2.VideoWriter(avi_path, fourcc_avi, 4.0, (WIDTH, HEIGHT))

        for frame in frames:
            cv_img = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
            video_writer_avi.write(cv_img)

        video_writer_avi.release()
        print(f"[OK] Generated Direct AVI Video: {avi_path}")

    except Exception as e:
        print(f"[NOTE] OpenCV direct video encoder: {e}")

    print("\n=================================================================")
    print("   ALL VIDEO AND DEMONSTRATION ASSETS GENERATED SUCCESSFULLY!   ")
    print("=================================================================\n")

if __name__ == '__main__':
    create_all_video_formats()
