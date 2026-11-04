# Objednávkový backend (Google Apps Script)

`Code.gs` je produkčný skript objednávok (Sheet `SIGEL Web Audit Orders`, notifikácie na sigelsro@gmail.com,
CRM export `?action=orders`), doplnený o:

- **dopyty** (`kind: "inquiry"`, napr. Company Intelligence) → vlastný hárok `SIGEL Inquiries`, nemiešajú sa s objednávkami ani s CRM,
- **honeypot**: vyplnené pole `website_extra` (boty) sa neuloží,
- **CRM token zo Script Properties** (`EXPORT_TOKEN`) namiesto hodnoty v kóde. Repo je verejné, token v ňom nesmie byť. Bez nastaveného tokenu je export vypnutý,
- záložné ceny 4 980 Kč / 199 € namiesto starých 2 490 / 99.

Web posiela POST s JSON (`Content-Type: text/plain`) a objednávku ukáže ako prijatú iba po odpovedi `{"ok": true}`.

## Nasadenie

1. Apps Script projekt → ⚙️ **Project Settings → Script Properties → Add script property**:
   `EXPORT_TOKEN` = nový náhodný reťazec (napr. 32 znakov). Rovnaký token nastav v CRM importe.
2. Editor → obsah `Code.gs` nahraď týmto súborom → Uložiť.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL ostane rovnaká).

## Overenie

- `…/exec` v prehliadači → `{"ok":true,"service":"SIGEL Web Audit Orders",…}`
- `…/exec?action=orders&token=STARÝ_TOKEN` → `unauthorized`; s novým tokenom → zoznam objednávok.
- Testovacia objednávka na webe → riadok v `SIGEL Web Audit Orders` + mail.
