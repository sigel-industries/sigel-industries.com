# Odložené stránky

Stránky, ktoré sa nebuildujú (build číta iba `src/pages/`).

- `*financ*`, `company-financial-analysis-en`, `finanzanalyse-unternehmen-de` – Company Intelligence landing (CS/SK/EN/DE).
  Texty sú v `src/i18n/<lang>.yaml` pod `ci`, šablóna `templates/partials/ci_landing.html`.
  Vrátenie: presunúť späť do `src/pages/<cesta>/index.html`, pridať `nav_products` do `chrome` v i18n
  a `{% include "partials/ci_strip.html" %}` do sekcie `#system-map` na homepage.
