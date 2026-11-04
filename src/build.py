#!/usr/bin/env python3
"""Static site build for sigel-industries.com.

src/pages/**/*.html  YAML front matter + Jinja blocks (extends base.html)
src/templates/       shared layout and partials (header, footer, order modal, ...)
src/i18n/<lang>.yaml UI strings shared by templates and script.js (rendered into #siteData)
static/              copied verbatim (css, js, fonts, images, pdf, CNAME)

Output: _site/ (deployed by .github/workflows/pages.yml). The build fails on broken
internal links, missing hreflang targets or unknown front matter keys.
"""
import datetime
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path
from xml.sax.saxutils import escape

import rcssmin
import rjsmin
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
OUT = ROOT / '_site'
FRONT_MATTER_KEYS = {
    'url', 'lang', 'title', 'description', 'robots', 'alternates', 'og_type', 'og_title',
    'og_description', 'og_image_alt', 'twitter_title', 'twitter_description', 'hero_preload',
}


def load_yaml(path):
    return yaml.safe_load(path.read_text(encoding='utf-8'))


def split_front_matter(path):
    text = path.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---\n(.*)', text, re.S)
    if not m:
        raise SystemExit(f'{path}: missing front matter')
    meta = yaml.safe_load(m.group(1))
    unknown = set(meta) - FRONT_MATTER_KEYS
    if unknown:
        raise SystemExit(f'{path}: unknown front matter keys {sorted(unknown)}')
    for key in ('url', 'lang', 'title', 'description'):
        if not meta.get(key):
            raise SystemExit(f'{path}: front matter needs "{key}"')
    return meta, m.group(2)


def out_path(url):
    rel = url.lstrip('/')
    return OUT / (rel + 'index.html' if rel == '' or rel.endswith('/') else rel)


def main():
    site = load_yaml(SRC / 'site.yaml')
    i18n = {lang: load_yaml(SRC / 'i18n' / f'{lang}.yaml') for lang in site['langs']}

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / 'static', OUT)
    # Ship minified CSS/JS; sources in static/ stay readable.
    for name, minify in (('style.css', rcssmin.cssmin), ('script.js', rjsmin.jsmin)):
        path = OUT / name
        path.write_text(minify(path.read_text(encoding='utf-8')), encoding='utf-8')

    def asset(path):
        digest = hashlib.sha256((OUT / path.lstrip('/')).read_bytes()).hexdigest()[:10]
        return f'{path}?v={digest}'

    env = Environment(loader=FileSystemLoader(SRC / 'templates'), undefined=StrictUndefined,
                      autoescape=False, keep_trailing_newline=True)
    def inline_css(path):
        # Inlined so @font-face rules need no extra render-blocking request; font URLs get absolute, versioned paths.
        css = (OUT / path.lstrip('/')).read_text(encoding='utf-8')
        base = path.rsplit('/', 1)[0]
        return re.sub(r"url\(\./([^)]+)\)", lambda m: f"url({asset(base + '/' + m.group(1))})", css)

    env.globals.update(site=site, i18n=i18n, asset=asset, inline_css=inline_css, year=datetime.date.today().year)

    pages = []
    for path in sorted((SRC / 'pages').rglob('*.html')):
        meta, body = split_front_matter(path)
        pages.append((path, meta, body))
    urls = {meta['url'] for _, meta, _ in pages}

    for path, meta, body in pages:
        lang = meta['lang']
        for alt in (meta.get('alternates') or {}).values():
            if alt not in urls:
                raise SystemExit(f'{path}: alternate {alt} is not a built page')
        t = i18n[lang]
        client = {
            'lang': lang,
            'gaId': site['ga_id'],
            'endpoint': site['order_endpoint'],
            'email': site['email'],
            'order': t['order'],
            'modalDefaults': t['chrome']['modal'],
            'contactTopics': t['contact']['topics'],
        }
        if 'report-tab' in body:
            client['report'] = t['report']
        if 'data-modal-target' in body:
            client['modal'] = t['modal']
        page = {key: meta.get(key) for key in FRONT_MATTER_KEYS}
        html = env.from_string(body).render(page=page, lang=lang, t=t, client_data=client)
        dest = out_path(meta['url'])
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html, encoding='utf-8')

    write_sitemap(site, pages)
    check_links()
    print(f'built {len(pages)} pages -> {OUT.relative_to(ROOT)}')


def write_sitemap(site, pages):
    today = datetime.date.today().isoformat()
    rows = []
    for _, meta, _ in sorted(pages, key=lambda p: p[1]['url']):
        if 'noindex' in (meta.get('robots') or ''):
            continue
        links = ''.join(
            f'\n    <xhtml:link rel="alternate" hreflang="{lang}" href="{escape(site["origin"] + url)}"/>'
            for lang, url in (meta.get('alternates') or {}).items())
        rows.append(f'  <url>\n    <loc>{escape(site["origin"] + meta["url"])}</loc>\n    <lastmod>{today}</lastmod>{links}\n  </url>')
    (OUT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + '\n'.join(rows) + '\n</urlset>\n', encoding='utf-8')


def check_links():
    broken = []
    for page in OUT.rglob('*.html'):
        text = page.read_text(encoding='utf-8')
        ids = set(re.findall(r'\bid="([^"]+)"', text))
        for href in re.findall(r'(?:href|src)="([^"]+)"', text):
            if href.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:', '//')):
                continue
            target, _, frag = href.split('?')[0].partition('#')
            if not target:
                if frag and frag not in ids:
                    broken.append((page, href))
                continue
            resolved = (OUT / target.lstrip('/')) if target.startswith('/') else (page.parent / target)
            if resolved.is_dir():
                resolved = resolved / 'index.html'
            if not resolved.exists():
                broken.append((page, href))
    if broken:
        for page, href in broken:
            print(f'BROKEN {page.relative_to(OUT)} -> {href}', file=sys.stderr)
        raise SystemExit(f'{len(broken)} broken internal links')


if __name__ == '__main__':
    main()
