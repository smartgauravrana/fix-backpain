"""Generate SpineFlow app icons (PNG + SVG) with the Python stdlib only.
Run: python3 dev/make_icons.py  (from the project root)"""
import math, struct, zlib, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
# vertebrae along a gentle S-curve: (cx, cy, rx, ry) in a 0..1 unit square
VERTS = []
for i in range(6):
    t = i / 5
    cy = 0.2 + t * 0.6
    cx = 0.5 + 0.07 * math.sin(t * math.pi * 1.6 - 0.6)
    w = 0.13 + 0.05 * t
    VERTS.append((cx, cy, w, 0.042))

def inside_rrect(x, y, cx, cy, rx, ry, r):
    dx, dy = abs(x - cx) - (rx - r), abs(y - cy) - (ry - r)
    return math.hypot(max(dx, 0), max(dy, 0)) <= r

def pixel(u, v, full_bleed):
    # background: rounded square (or full bleed for apple icon / maskable)
    if not full_bleed and not inside_rrect(u, v, 0.5, 0.5, 0.5, 0.5, 0.22):
        return (0, 0, 0, 0)
    g = v
    bg = (int(18 + (8 - 18) * g), int(170 + (110 - 170) * g), int(124 + (80 - 124) * g))
    for cx, cy, rx, ry in VERTS:
        if inside_rrect(u, v, cx, cy, rx, ry, ry * 0.95):
            return (245, 252, 248, 255)
    return bg + (255,)

def png(size, path, full_bleed=False, ss=3):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    p = pixel((x + (sx + .5) / ss) / size, (y + (sy + .5) / ss) / size, full_bleed)
                    a = p[3]
                    acc[0] += p[0] * a; acc[1] += p[1] * a; acc[2] += p[2] * a; acc[3] += a
            n = ss * ss
            a = acc[3] / n
            if a == 0: row += bytes(4)
            else: row += bytes([int(acc[0] / acc[3]), int(acc[1] / acc[3]), int(acc[2] / acc[3]), int(a)])
        rows.append(bytes(row))
    raw = zlib.compress(b''.join(rows), 9)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', raw) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

png(180, os.path.join(OUT, 'apple-touch-icon.png'), full_bleed=True)
png(192, os.path.join(OUT, 'icon-192.png'))
png(512, os.path.join(OUT, 'icon-512.png'), full_bleed=True, ss=2)

rects = ''.join(
    f'<rect x="{(cx-rx)*100:.1f}" y="{(cy-ry)*100:.1f}" width="{2*rx*100:.1f}" height="{2*ry*100:.1f}" rx="{ry*95:.1f}" fill="#f5fcf8"/>'
    for cx, cy, rx, ry in VERTS)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12aa7c"/><stop offset="1" stop-color="#086e50"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#g)"/>{rects}</svg>'''
open(os.path.join(OUT, 'icon.svg'), 'w').write(svg)
print('icons written')
