"""Static illustration textures for the story layer (spec, *Art direction*: paper grain and
watercolour washes are static WebP images under the SVG, never live filters).

  site/textures/paper-grain.webp   tileable greyscale grain
  site/textures/paper-<theme>.webp the story pages' paper: the theme background with the grain baked in
  site/textures/wash-<n>.webp      soft watercolour stains as alpha masks, tinted in CSS by the
                                   theme's wash colour (mask-image + background-color)

    uv run python -m generator.textures
"""

import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates

from .paths import ROOT

OUT = ROOT / "site" / "textures"
SEED = 20261005


def tileable_noise(size, sigma, rng):
    """Gaussian-filtered noise with wrap-around, so the tile repeats without seams."""
    n = rng.standard_normal((size, size))
    n = gaussian_filter(n, sigma, mode="wrap")
    return (n - n.min()) / (n.max() - n.min())


def grain(rng, size=384):
    fine = tileable_noise(size, 0.7, rng)
    fibre = tileable_noise(size, (0.8, 6.0), rng)       # faint paper fibres, mostly horizontal
    blotch = tileable_noise(size, 18, rng)
    g = 0.78 * fine + 0.08 * fibre + 0.14 * blotch
    g = (g - g.min()) / (g.max() - g.min())
    # light grain on white: mostly near-white with darker specks, for multiply blending
    v = 1.0 - 0.42 * np.clip((g - 0.45) / 0.55, 0, 1) ** 1.8
    return Image.fromarray((v * 255).astype(np.uint8), "L")


def wash(rng, w=640, h=400):
    """A watercolour stain: an irregular blob with a darker, granulated edge (pigment pools at
    the rim as the water dries) and soft, uneven inside."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * 0.5, h * 0.5
    r = np.hypot((x - cx) / (w * 0.42), (y - cy) / (h * 0.40))
    # warp the radius with low-frequency noise for an irregular outline
    warp = gaussian_filter(rng.standard_normal((h, w)), 32)
    warp = (warp - warp.mean()) / warp.std()
    r = r + 0.12 * warp
    body = np.clip((1.0 - r) / 0.22, 0, 1)                  # soft-ish edge
    rim = np.exp(-((r - 0.96) / 0.035) ** 2) * 0.55         # pigment pooling at the edge
    inside = 0.55 + 0.45 * gaussian_filter(rng.standard_normal((h, w)), 13)
    inside = np.clip((inside - inside.min()) / (inside.max() - inside.min()), 0, 1)
    granule = gaussian_filter(rng.standard_normal((h, w)), 0.8)
    granule = (granule - granule.min()) / (granule.max() - granule.min())
    a = body * (0.45 + 0.4 * inside) + rim * (r < 1.05)
    a = a * (0.82 + 0.18 * granule)
    a = np.clip(a / a.max(), 0, 1)
    # alpha mask: white with alpha, so CSS mask-image uses the alpha channel
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255


def paper(g, bg, strength, dark=False):
    """The page itself: the theme background with grain baked in at the token strength
    (--tex-grain-opacity), so no blending layer is needed."""
    a = np.asarray(g, np.float32)[..., None] / 255          # 1 = no speck
    base = hex_rgb(bg)
    if dark:   # lighter specks on charcoal
        out = base + strength * (1 - a) * (1 - base) * 0.6
    else:      # darker specks on ivory (multiply)
        out = base * (1 - strength * (1 - a))
    return Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGB")


def main() -> int:
    rng = np.random.default_rng(SEED)
    OUT.mkdir(parents=True, exist_ok=True)
    g = grain(rng)
    g.save(OUT / "paper-grain.webp", "WEBP", quality=82, method=6)
    paper(g, "#F0EEE6", 0.22).save(OUT / "paper-light.webp", "WEBP", quality=94, method=6)   # tokens.css --bg, light
    paper(g, "#1F1E1C", 0.12, dark=True).save(OUT / "paper-dark.webp", "WEBP", quality=94, method=6)
    for k in (1, 2):
        wash(rng).save(OUT / f"wash-{k}.webp", "WEBP", quality=80, method=6)
    for f in sorted(OUT.glob("*.webp")):
        print(f"wrote {f.relative_to(ROOT)} ({f.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
