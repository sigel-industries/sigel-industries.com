SIGEL mobile/legal fix

Changed files:
- style.css
- script.js

Main fixes:
- Legal pages (terms / GDPR / privacy) are visible even if mobile JS reveal fails.
- Reveal animations now have IntersectionObserver fallback in script.js.
- Added final responsive CSS overrides for mobile layouts, legal pages, modal, footer, grids, buttons, cookie bar and sticky CTA spacing.
- Added overflow protection for long legal URLs/emails and narrow screens.

Local test:
cd sigel-industries.com-main-mobile-fixed
python3 -m http.server 8080
open http://localhost:8080/
