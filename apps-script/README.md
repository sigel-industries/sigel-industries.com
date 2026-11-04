# Objednávkový backend (Google Apps Script)

Web posiela objednávky a dopyty na Google Apps Script web app (`order_endpoint` v `src/site.yaml`).
Skript ich zapíše do Google Sheetu, pošle notifikačný e-mail a vráti JSON `{"ok": true, "id": ...}`.
Web zobrazí „Objednávka prijatá“ **iba** po tejto odpovedi; pri chybe ponúkne odoslanie e-mailom.

## Nasadenie (raz)

1. Otvor Google Sheet, do ktorého dnes chodia objednávky → **Rozšírenia → Apps Script**.
   (Alebo na script.google.com nájdi projekt, ktorého web app URL je v `src/site.yaml`.)
2. **Zálohuj** pôvodný kód (skopíruj si ho bokom).
3. Obsah `Code.gs` nahraď súborom `apps-script/Code.gs` z tohto repa. Ulož.
4. Ak skript nie je naviazaný na Sheet: Project Settings → Script Properties → `SHEET_ID` = ID tabuľky.
5. **Deploy → Manage deployments → existujúci deployment → ✏️ Edit → Version: New version → Deploy.**
   Takto ostane rovnaká URL. („New deployment“ by vytvoril novú URL, potom ju treba zmeniť v `src/site.yaml`.)
   Execute as: *Me*, Who has access: *Anyone*.
6. Pri prvom spustení Google vypýta oprávnenia (Sheets + odosielanie e-mailov) – povoľ.

## Overenie

- Otvor URL web appu v prehliadači → musí vrátiť `{"ok":true,"service":"sigel-orders"}`.
- Na webe pošli testovaciu objednávku (poznámka „TEST“) → riadok v hárku `Objednavky`, e-mail na info@.

## Poradie pri nasadení

Najprv nasaď tento skript, potom web. Nový web očakáva JSON odpoveď; so starým skriptom by
ukázal chybu (objednávka by sa pritom mohla uložiť → duplicita).

Stĺpce sa párujú podľa názvov v 1. riadku; chýbajúce stĺpce skript doplní na koniec. Opakované
odoslanie s rovnakým `id` sa druhýkrát nezapíše.
