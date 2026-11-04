/**
 * SIGEL order + inquiry backend (Google Apps Script web app).
 *
 * Receives JSON from the website (POST, Content-Type text/plain), writes it into
 * a Google Sheet, e-mails a notification and answers JSON:
 *   success  {"ok": true,  "id": "SIGEL-..."}
 *   failure  {"ok": false, "error": "..."}
 * The website shows "order accepted" only after {"ok": true}.
 *
 * Setup: see apps-script/README.md
 */

const CONFIG = {
  // Notification recipient
  notifyEmail: 'info@sigel-industries.com',
  // Sheet tabs (created automatically if missing)
  sheets: { order: 'Objednavky', inquiry: 'Poptavky' },
  // Optional: Script Properties -> SHEET_ID. Without it the spreadsheet this script is bound to is used.
  sheetIdProperty: 'SHEET_ID',
};

const REQUIRED = {
  order: ['id', 'website', 'company', 'ico', 'billing', 'email', 'currency', 'price'],
  inquiry: ['id', 'product', 'email'],
};

function doGet() {
  return json_({ ok: true, service: 'sigel-orders' });
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || '');
  } catch (err) {
    return json_({ ok: false, error: 'invalid_json' });
  }

  const kind = payload.kind === 'inquiry' ? 'inquiry' : 'order';
  if (payload.website_extra) return json_({ ok: true, id: payload.id || '' }); // honeypot: pretend success to bots
  const missing = REQUIRED[kind].filter((key) => !String(payload[key] || '').trim());
  if (missing.length) return json_({ ok: false, error: 'missing:' + missing.join(',') });
  if (kind === 'order' && (!payload.termsConsent || !payload.privacyConsent)) return json_({ ok: false, error: 'missing_consent' });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sheet = sheet_(CONFIG.sheets[kind]);
    const row = Object.assign({ receivedAt: new Date().toISOString() }, payload);
    delete row.website_extra;

    const headers = ensureHeaders_(sheet, Object.keys(row));
    const idCol = headers.indexOf('id') + 1;
    if (sheet.getLastRow() > 1 && sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues().some((r) => r[0] === row.id)) {
      return json_({ ok: true, id: row.id, duplicate: true }); // retry of an already stored submission
    }
    sheet.appendRow(headers.map((h) => cell_(row[h])));
    SpreadsheetApp.flush();
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'storage_failed' });
  } finally {
    lock.releaseLock();
  }

  try {
    notify_(kind, payload);
  } catch (err) {
    console.error('notification failed', err); // the submission is stored; do not fail the request
  }
  return json_({ ok: true, id: payload.id });
}

function sheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.sheetIdProperty);
  const book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('No spreadsheet: bind the script to a Sheet or set Script Property ' + CONFIG.sheetIdProperty);
  return book.getSheetByName(name) || book.insertSheet(name);
}

// Columns are matched by header name; new payload keys become new columns at the end.
function ensureHeaders_(sheet, keys) {
  const lastCol = sheet.getLastColumn();
  const headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  const added = keys.filter((k) => headers.indexOf(k) === -1);
  if (added.length) {
    sheet.getRange(1, headers.length + 1, 1, added.length).setValues([added]);
    sheet.setFrozenRows(1);
  }
  return headers.concat(added);
}

function cell_(value) {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text; // block formula injection from form input
}

function notify_(kind, p) {
  const subject = kind === 'order'
    ? `Nová objednávka ${p.id}: ${p.website} (${p.price})`
    : `Nová poptávka ${p.id}: ${p.product}`;
  const body = Object.keys(p)
    .filter((k) => k !== 'website_extra')
    .map((k) => `${k}: ${typeof p[k] === 'object' ? JSON.stringify(p[k]) : p[k]}`)
    .join('\n');
  MailApp.sendEmail({ to: CONFIG.notifyEmail, subject, body, replyTo: p.email || CONFIG.notifyEmail });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
