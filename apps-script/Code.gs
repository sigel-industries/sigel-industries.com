/**
 * SIGEL Web Audit order form backend + CRM export endpoint.
 *
 * What this does:
 * - doPost(e): receives orders from the website form and writes them into Google Sheets.
 * - sends internal notification e-mail to NOTIFY_EMAIL.
 * - doGet(e): 
 *    - without action: health check
 *    - with ?action=orders&token=... : exports orders as JSON for SIGEL CRM / invoicing lab.
 *
 * Deployment:
 * 1. Deploy as Web app.
 * 2. Execute as: Me
 * 3. Who has access: Anyone
 * 4. Copy /exec URL into website FORM_ENDPOINT for doPost.
 * 5. For CRM import use:
 *    https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=orders
 *    and set the same token in CRM settings.
 */

function myFunction() {}

/* =========================
   BASIC SETTINGS
========================= */

const SHEET_ID = "1fQcEAnoB4OCjLCuJ1CCJkquQpjiQLvT51Z_h5hBQN9I";
const SHEET_NAME = "SIGEL Web Audit Orders";
const NOTIFY_EMAIL = "sigelsro@gmail.com";

/**
 * CRM export token is read from Script Properties (Project Settings -> Script Properties -> EXPORT_TOKEN),
 * so it is not stored in the code / public repository. Put the same token into CRM import settings.
 * Without the property the export is disabled.
 */
const EXPORT_TOKEN = PropertiesService.getScriptProperties().getProperty("EXPORT_TOKEN") || "";

/** Non-order requests from the website (e.g. Company Intelligence inquiries) go to their own sheet. */
const INQUIRY_SHEET_NAME = "SIGEL Inquiries";

/**
 * Main order columns.
 * Keep these stable because existing website submissions use them.
 */
const HEADERS = [
  "id",
  "createdAt",
  "createdAtUtc",
  "createdAtLocal",
  "timezone",
  "language",
  "customerType",
  "status",
  "paymentStatus",
  "deliveryStatus",
  "website",
  "company",
  "ico",
  "dic",
  "billing",
  "contactPerson",
  "email",
  "phone",
  "reportLanguage",
  "currency",
  "price",
  "note",
  "termsConsent",
  "privacyConsent",
  "source",

  // CRM/import helper columns. Existing rows can stay empty.
  "crmImportedAt",
  "crmImportStatus",
  "crmNote"
];

/* =========================
   WEBSITE FORM RECEIVER
========================= */

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Honeypot field filled by bots: accept silently, store nothing.
    if (payload.website_extra) {
      return json_({ ok: true, id: payload.id || "" });
    }

    if (payload.kind === "inquiry") {
      return handleInquiry_(payload);
    }

    const normalized = normalizeIncomingPayload_(payload);

    const sheet = getOrCreateSheet_();
    ensureHeaders_(sheet);

    const headers = getHeaders_(sheet);
    const row = headers.map((key) => normalized[key] ?? "");

    sheet.appendRow(row);

    sendNotification_(normalized);

    return json_({
      ok: true,
      id: normalized.id || "",
      message: "Order received"
    });

  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

/* =========================
   INQUIRIES (not orders)
========================= */

function handleInquiry_(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(INQUIRY_SHEET_NAME) || ss.insertSheet(INQUIRY_SHEET_NAME);
  const row = Object.assign({ receivedAt: new Date().toISOString() }, payload);
  delete row.website_extra;

  const lastColumn = sheet.getLastColumn();
  const headers = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map((h) => String(h || "").trim()) : [];
  const added = Object.keys(row).filter((k) => headers.indexOf(k) === -1);
  if (added.length) {
    sheet.getRange(1, headers.length + 1, 1, added.length).setValues([added]);
    sheet.setFrozenRows(1);
  }
  const allHeaders = headers.concat(added);
  sheet.appendRow(allHeaders.map((h) => (row[h] === undefined || row[h] === null) ? "" : row[h]));

  if (NOTIFY_EMAIL) {
    const body = Object.keys(row).map((k) => `${k}: ${row[k]}`).join("\n");
    MailApp.sendEmail(NOTIFY_EMAIL, `Nová poptávka SIGEL: ${payload.product || ""} ${payload.ico || ""}`, body);
  }

  return json_({ ok: true, id: payload.id || "", message: "Inquiry received" });
}

/* =========================
   CRM EXPORT ENDPOINT
========================= */

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = String(params.action || "").trim();

    if (action === "orders") {
      if (!EXPORT_TOKEN || params.token !== EXPORT_TOKEN) {
        return json_({
          ok: false,
          error: "unauthorized"
        });
      }

      const orders = readOrdersForCrm_();

      return json_({
        ok: true,
        count: orders.length,
        orders: orders
      });
    }

    return json_({
      ok: true,
      service: "SIGEL Web Audit Orders",
      message: "Web app is alive",
      time: new Date().toISOString()
    });

  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

/* =========================
   SHEET HELPERS
========================= */

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const existing = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map((h) => String(h || "").trim());

  const hasAnyHeader = existing.some(Boolean);

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const missing = HEADERS.filter((h) => existing.indexOf(h) === -1);

  if (missing.length > 0) {
    const startColumn = existing.length + 1;
    sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
  }

  sheet.setFrozenRows(1);
}

function getHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map((h) => String(h || "").trim())
    .filter(Boolean);
}

/* =========================
   NORMALIZATION
========================= */

function normalizeIncomingPayload_(payload) {
  const now = new Date();

  const normalized = Object.assign({}, payload);

  if (!normalized.id) {
    normalized.id = "SIGEL-" + Utilities.formatDate(now, "Europe/Prague", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 10000);
  }

  if (!normalized.createdAt) {
    normalized.createdAt = now.toISOString();
  }

  if (!normalized.createdAtUtc) {
    normalized.createdAtUtc = now.toISOString();
  }

  if (!normalized.createdAtLocal) {
    normalized.createdAtLocal = Utilities.formatDate(now, "Europe/Prague", "yyyy-MM-dd HH:mm:ss");
  }

  if (!normalized.timezone) {
    normalized.timezone = "Europe/Prague";
  }

  if (!normalized.status) {
    normalized.status = "new_order";
  }

  if (!normalized.paymentStatus) {
    normalized.paymentStatus = "invoice_pending";
  }

  if (!normalized.deliveryStatus) {
    normalized.deliveryStatus = "waiting_for_payment";
  }

  if (!normalized.source) {
    normalized.source = "sigel-web-order-form";
  }

  if (!normalized.currency) {
    normalized.currency = detectCurrency_(normalized);
  }

  if (!normalized.language) {
    normalized.language = normalized.currency === "EUR" ? "en" : "cs";
  }

  if (!normalized.reportLanguage) {
    normalized.reportLanguage = normalized.language === "en" ? "EN" : "CZ/SK";
  }

  return normalized;
}

function detectCurrency_(payload) {
  const currency = String(payload.currency || "").trim().toUpperCase();

  if (currency === "EUR" || currency === "CZK") {
    return currency;
  }

  const price = String(payload.price || "").toUpperCase();

  if (price.indexOf("EUR") !== -1 || price.indexOf("€") !== -1) {
    return "EUR";
  }

  return "CZK";
}

/* =========================
   CRM EXPORT NORMALIZATION
========================= */

function readOrdersForCrm_() {
  const sheet = getOrCreateSheet_();
  ensureHeaders_(sheet);

  const values = sheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    return [];
  }

  const headers = values[0].map((h) => String(h || "").trim());
  const orders = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const raw = {};
    let hasValue = false;

    headers.forEach((header, i) => {
      if (!header) return;

      const value = normalizeCell_(row[i]);

      if (value !== "" && value !== null && value !== undefined) {
        hasValue = true;
      }

      raw[header] = value;
    });

    if (!hasValue) continue;

    orders.push(normalizeOrderForCrm_(raw, r + 1));
  }

  return orders;
}

function normalizeOrderForCrm_(raw, sheetRowNumber) {
  const currency = detectCurrency_(raw);
  const language = normalizeLanguage_(raw.language, currency);
  const reportLanguage = String(raw.reportLanguage || (language === "en" ? "EN" : "CZ/SK")).trim();

  const priceAmount = parsePriceAmount_(raw.price, currency);

  return {
    // Primary identity
    orderId: raw.id || ("SHEET-ROW-" + sheetRowNumber),
    id: raw.id || ("SHEET-ROW-" + sheetRowNumber),
    source: raw.source || "google_sheets",
    sheetRow: sheetRowNumber,

    // Time
    createdAt: raw.createdAt || "",
    createdAtUtc: raw.createdAtUtc || "",
    createdAtLocal: raw.createdAtLocal || "",
    timezone: raw.timezone || "",

    // Language / currency
    language: language,
    documentLanguage: language === "en" ? "EN" : "CZ",
    reportLanguage: reportLanguage,
    currency: currency,

    // Customer
    customerType: raw.customerType || "company",
    company: raw.company || "",
    name: raw.company || "",
    contactPerson: raw.contactPerson || "",
    email: raw.email || "",
    phone: raw.phone || "",

    // Audit target
    website: raw.website || "",
    url: raw.website || "",

    // Billing
    ico: raw.ico || "",
    dic: raw.dic || "",
    billing: raw.billing || "",

    // Pricing
    price: raw.price || (currency === "EUR" ? "199" : "4980"),
    priceAmount: priceAmount,
    priceLabel: formatPriceLabel_(priceAmount, currency),

    // Notes and consent
    note: raw.note || "",
    termsConsent: raw.termsConsent || "",
    privacyConsent: raw.privacyConsent || "",

    // Statuses
    status: raw.status || "new_order",
    paymentStatus: raw.paymentStatus || "invoice_pending",
    deliveryStatus: raw.deliveryStatus || "waiting_for_payment",

    // CRM state, if later used
    crmImportedAt: raw.crmImportedAt || "",
    crmImportStatus: raw.crmImportStatus || "",
    crmNote: raw.crmNote || "",

    // Original row data for debugging/mapping
    raw: raw
  };
}

function normalizeLanguage_(value, currency) {
  const lang = String(value || "").trim().toLowerCase();

  if (lang === "en" || lang === "eng" || lang === "english") {
    return "en";
  }

  if (lang === "cs" || lang === "cz" || lang === "sk" || lang === "cz/sk") {
    return "cs";
  }

  return currency === "EUR" ? "en" : "cs";
}

function normalizeCell_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return value;
}

function parsePriceAmount_(price, currency) {
  if (typeof price === "number") return price;

  const text = String(price || "").trim();

  if (!text) {
    return currency === "EUR" ? 199 : 4980;
  }

  const normalized = text
    .replace(/\s/g, "")
    .replace("Kč", "")
    .replace("CZK", "")
    .replace("€", "")
    .replace("EUR", "")
    .replace(",", ".");

  const parsed = Number(normalized);

  if (isNaN(parsed)) {
    return currency === "EUR" ? 199 : 4980;
  }

  return parsed;
}

function formatPriceLabel_(amount, currency) {
  if (currency === "EUR") {
    return amount.toFixed(2) + " EUR";
  }

  return amount.toFixed(2) + " CZK";
}

/* =========================
   NOTIFICATION E-MAIL
========================= */

function sendNotification_(payload) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL.includes("PASTE_")) return;

  const subject = `Nová objednávka SIGEL Web Audit: ${payload.company || payload.email || payload.website || ""}`;

  const body = [
    "Nová objednávka SIGEL Web Audit",
    "",
    `ID: ${payload.id || ""}`,
    `Čas: ${payload.createdAtLocal || payload.createdAt || ""}`,
    `Jazyk webu/formuláře: ${payload.language || ""}`,
    `Typ objednatele: ${payload.customerType || ""}`,
    `Web: ${payload.website || ""}`,
    `Firma / jméno: ${payload.company || ""}`,
    `IČO: ${payload.ico || ""}`,
    `DIČ: ${payload.dic || ""}`,
    `Fakturační adresa: ${payload.billing || ""}`,
    `Kontaktní osoba: ${payload.contactPerson || ""}`,
    `E-mail: ${payload.email || ""}`,
    `Telefon: ${payload.phone || ""}`,
    `Jazyk reportu: ${payload.reportLanguage || ""}`,
    `Cena: ${payload.price || ""} ${payload.currency || ""}`,
    "",
    "Poznámka:",
    payload.note || "—",
    "",
    `Status: ${payload.status || "new_order"}`,
    `Platba: ${payload.paymentStatus || "invoice_pending"}`,
    `Dodání: ${payload.deliveryStatus || "waiting_for_payment"}`
  ].join("\n");

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

/* =========================
   JSON RESPONSE
========================= */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =========================
   MANUAL TEST
========================= */

function testWrite() {
  const now = new Date();

  const payload = {
    id: "TEST-" + now.getTime(),
    createdAt: now.toISOString(),
    createdAtUtc: now.toISOString(),
    createdAtLocal: Utilities.formatDate(now, "Europe/Prague", "yyyy-MM-dd HH:mm:ss"),
    timezone: "Europe/Prague",
    language: "cs",
    customerType: "company",
    status: "new_order",
    paymentStatus: "invoice_pending",
    deliveryStatus: "waiting_for_payment",
    website: "https://sigel-industries.com",
    company: "Test objednávka",
    ico: "",
    dic: "",
    billing: "Testovací fakturační adresa",
    contactPerson: "Daniel Hajduk",
    email: "test@example.com",
    phone: "",
    reportLanguage: "CZ/SK",
    currency: "CZK",
    price: "4 980 Kč",
    note: "Ruční test z Apps Scriptu",
    termsConsent: true,
    privacyConsent: true,
    source: "manual-test"
  };

  const normalized = normalizeIncomingPayload_(payload);
  const sheet = getOrCreateSheet_();
  ensureHeaders_(sheet);

  const headers = getHeaders_(sheet);
  const row = headers.map((key) => normalized[key] ?? "");

  sheet.appendRow(row);
  sendNotification_(normalized);
}