# sigel-industries.com

Statický web generovaný z `src/` do `_site/` a nasadzovaný cez GitHub Actions na GitHub Pages.

## Štruktúra

| Cesta | Čo tam je |
|---|---|
| `src/pages/**.html` | Stránky: YAML front matter (URL, jazyk, title, description, hreflang alternates) + Jinja bloky `main` a `jsonld` |
| `src/templates/` | Spoločný layout: hlavička, navigácia, prepínač jazykov, pätička, cookie lišta, objednávkový modal |
| `src/i18n/<jazyk>.yaml` | Texty UI pre CS/SK/EN/DE: navigácia, pätička, objednávka, ukážka reportu, detailné modaly. Tie isté dáta číta aj `script.js` |
| `src/site.yaml` | Doména, e-mail, GA ID, URL objednávkového backendu, jazyky |
| `static/` | Kopíruje sa 1:1: `style.css`, `script.js`, fonty, obrázky, PDF, `CNAME`, `robots.txt` |
| `apps-script/` | Backend objednávok (Google Apps Script) + návod na nasadenie |

## Lokálne

```bash
pip install -r requirements.txt
python src/build.py            # -> _site/
python -m http.server -d _site 8000
```

Build zlyhá pri rozbitom internom odkaze, neexistujúcej hreflang alternatíve alebo neznámom kľúči vo front matter.
`sitemap.xml` (vrátane hreflang) sa generuje automaticky zo stránok.

## Nová stránka

1. Vytvor `src/pages/<cesta>/index.html` s front matter (`url`, `lang`, `title`, `description`, voliteľne `alternates`).
2. Ak má jazykové verzie, uveď `alternates` vo všetkých verziách.
3. `{% extends "base.html" %}` a obsah do `{% block main %}`.

## Nasadenie

Push do `main` → workflow `.github/workflows/pages.yml` zostaví a nasadí web.
Jednorazovo: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
