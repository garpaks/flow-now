"""Genera los iconos de Flow Now! a partir de la ola pixel art (paleta modo oscuro).

Uso: python scripts/make-icon.py  (requiere Pillow)
Escribe build/icon.png, build/icon.ico y resources/icon.png.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Misma ola que ART.wave en src/renderer/src/pixelArt.ts
WAVE = [
    '......wwwww...',
    '....wwbbbbbw..',
    '...wbbbbbbbbw.',
    '..wbbbBBBbbbbw',
    '.wbbB....Bbbbw',
    '.wbw......bbbw',
    '..w.......bbbw',
    '.........bbbbw',
    '.ww....wbbbbbb',
    'wbbwwwbbbbbbbb',
    'BBBBBBBBBBBBBB',
]
COLORS = {
    'w': (232, 230, 225, 255),  # --text
    'b': (110, 168, 247, 255),  # --long
    'B': (74, 132, 212, 255),  # --long-dark
}
PANEL = (30, 37, 48, 255)  # --panel
LINE = (11, 14, 19, 255)  # --line

N = 16
base = Image.new('RGBA', (N, N), (0, 0, 0, 0))
px = base.load()

# Baldosa con contorno y esquinas recortadas (estilo pixel)
for y in range(N):
    for x in range(N):
        if x in (0, N - 1) and y in (0, N - 1):
            continue
        edge = x in (0, N - 1) or y in (0, N - 1)
        px[x, y] = LINE if edge else PANEL

# Ola centrada: 14x11 en x=1..14, y=3..13
for row, line in enumerate(WAVE):
    for col, ch in enumerate(line):
        if ch in COLORS:
            px[1 + col, 3 + row] = COLORS[ch]


def scaled(size: int) -> Image.Image:
    # NEAREST conserva los píxeles nítidos al escalar
    return base.resize((size, size), Image.NEAREST)


big = scaled(256)
big.save(os.path.join(ROOT, 'build', 'icon.png'))
big.save(os.path.join(ROOT, 'resources', 'icon.png'))
sizes = [16, 32, 48, 64, 128, 256]
big.save(
    os.path.join(ROOT, 'build', 'icon.ico'),
    sizes=[(s, s) for s in sizes],
    append_images=[scaled(s) for s in sizes[:-1]],
)
print('Iconos generados en build/ y resources/')
