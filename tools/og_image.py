#!/usr/bin/env python3
"""Render Open Graph images (1200x630) per language into static/assets/og/.

Uses headless Chrome (Playwright) so the images use the same self-hosted fonts as the site.
Copy comes from src/i18n/<lang>.yaml (og block). Run after changing that copy:

    pip install playwright && python tools/og_image.py
"""
import base64
from pathlib import Path

import yaml
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / 'static'
OUT = STATIC / 'assets' / 'og'


def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def font_faces():
    css = (STATIC / 'fonts' / 'fonts.css').read_text(encoding='utf-8')
    for woff in (STATIC / 'fonts').glob('*.woff2'):
        css = css.replace(f'url(./{woff.name})', f'url({data_uri(woff, "font/woff2")})')
    return css


def page(og, bg, logo, fonts):
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{fonts}
* {{ margin: 0; box-sizing: border-box; }}
body {{ width: 1200px; height: 630px; overflow: hidden; background: #05060A; color: #F0EEE9; font-family: "Space Grotesk", sans-serif; }}
.bg {{ position: absolute; inset: 0; background: url({bg}) right center / cover no-repeat; }}
.fade {{ position: absolute; inset: 0; background: linear-gradient(90deg, #05060A 0%, rgba(5,6,10,.94) 42%, rgba(5,6,10,.35) 72%, rgba(5,6,10,.1) 100%); }}
.copy {{ position: absolute; left: 72px; top: 0; bottom: 0; width: 700px; display: flex; flex-direction: column; justify-content: center; gap: 26px; }}
.brand {{ display: flex; align-items: center; gap: 14px; font-weight: 700; font-size: 20px; letter-spacing: .14em; }}
.brand img {{ width: 46px; height: 46px; }}
h1 {{ font-family: "Fraunces", serif; font-weight: 500; font-size: 64px; line-height: 1.04; letter-spacing: -.025em; }}
h1 em {{ color: #FF8C47; font-weight: 400; }}
.eyebrow {{ font-family: "JetBrains Mono", monospace; font-size: 19px; letter-spacing: .06em; text-transform: uppercase; color: #4DDFC8; }}
.price {{ font-size: 22px; color: #B8BAC4; }}
</style></head><body><div class="bg"></div><div class="fade"></div>
<div class="copy"><div class="brand"><img src="{logo}">SIGEL INDUSTRIES</div>
<h1>{og["title"]}</h1><div class="eyebrow">{og["eyebrow"]}</div><div class="price">{og["meta"]}</div></div></body></html>'''


def main():
    bg = data_uri(STATIC / 'assets' / 'hero' / 'sigel-monolith-desktop.webp', 'image/webp')
    logo = data_uri(STATIC / 'sigel-mark-256.png', 'image/png')
    fonts = font_faces()
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        tab = browser.new_page(viewport={'width': 1200, 'height': 630})
        for i18n in sorted((ROOT / 'src' / 'i18n').glob('*.yaml')):
            lang = i18n.stem
            og = yaml.safe_load(i18n.read_text(encoding='utf-8'))['og']
            tab.set_content(page(og, bg, logo, fonts), wait_until='load')
            tab.evaluate('document.fonts.ready')
            dest = OUT / f'sigel-og-{lang}.jpg'
            tab.screenshot(path=str(dest), type='jpeg', quality=88)
            print(dest.relative_to(ROOT))
        browser.close()


if __name__ == '__main__':
    main()
