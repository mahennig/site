#!/usr/bin/env python3
"""Generate a 1200x630 Open Graph image for an article, in the site's style.

Usage:
  python3 tools/og.py "<title>" "<section>" assets/img/og/<slug>.png

Needs Pillow. Fonts: set OG_SERIF / OG_SANS to font files if the defaults below are missing.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG, DOT, FG, MUTED, ACCENT = "#0d0d0b", "#2a2924", "#edebe4", "#8c8a82", "#d7ff3a"
SERIF = os.environ.get("OG_SERIF", "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc")
SANS = os.environ.get("OG_SANS", "/usr/share/fonts/opentype/inter/Inter-Regular.otf")
MONO = os.environ.get("OG_MONO", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf")
X = 84


def wrap(draw, text, font, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    return lines + [line]


def main(title, section, out):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(13, H, 26):
        for x in range(13, W, 26):
            d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=DOT)

    mono = ImageFont.truetype(MONO, 22)
    d.text((X, 72), f"$ cat writing/{section.lower()}", font=mono, fill=ACCENT)

    # Largest title size that fits in four lines.
    for size in range(76, 40, -4):
        font = ImageFont.truetype(SERIF, size)
        lines = wrap(d, title, font, W - 2 * X)
        if len(lines) <= 4:
            break
    y = 150
    for line in lines:
        d.text((X, y), line, font=font, fill=FG)
        y += int(size * 1.18)

    sans = ImageFont.truetype(SANS, 28)
    d.rectangle((X, H - 128, X + 56, H - 124), fill=ACCENT)
    d.text((X, H - 104), "Markus Hennig", font=sans, fill=FG)
    name_w = d.textlength("Markus Hennig  ", font=sans)
    d.text((X + name_w, H - 104), "· markushennig.com", font=sans, fill=MUTED)

    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, optimize=True)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
