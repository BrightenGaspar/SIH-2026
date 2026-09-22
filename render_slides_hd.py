import os
import sys
from PIL import Image, ImageDraw, ImageFont

# 3840 x 2160 4K UHD Canvas
W, H = 3840, 2160

# Palette
BG_COLOR = (10, 15, 29)          # Deep Navy
CARD_BG = (17, 24, 39)           # Rich Slate
BORDER_EMERALD = (16, 185, 129)  # Emerald
BORDER_CYAN = (6, 182, 212)      # Cyan
BORDER_AMBER = (245, 158, 11)    # Amber
BORDER_ROSE = (244, 63, 94)      # Rose
BORDER_PURPLE = (168, 85, 247)   # Purple
BORDER_PINK = (236, 72, 153)     # Pink

TEXT_WHITE = (255, 255, 255)
TEXT_MINT = (52, 211, 153)
TEXT_CYAN = (56, 189, 248)
TEXT_AMBER = (251, 191, 36)
TEXT_ROSE = (251, 113, 133)
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
    font_title = get_font(64, bold=True)
    draw.text((200, 100), cat_text.upper(), font=font_cat, fill=TEXT_MINT)
    draw.text((200, 160), title_text, font=font_title, fill=TEXT_WHITE)

def draw_card(draw, x, y, w, h, border_col, fill_col=CARD_BG, r=32):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=fill_col, outline=border_col, width=4)

print("Slide rendering library initialized.")
