// ─────────────────────────────────────────────────────────────────────────────
// HSC OPS HUB SYNC ADDON — Citizen Form Script
//
// SETUP: Add the SYNC_SECRET constant and replace the existing doGet function
// in your citizen form's Apps Script, then redeploy as a new version.
// (Manage Deployments → Edit → New Version → Deploy)
// The deployment URL stays the same — update it in the app's Settings page.
// ─────────────────────────────────────────────────────────────────────────────

// 1. Add this constant anywhere near the top of your script:
const SYNC_SECRET = 'hsc-citizen-sync-2026';

// 2. Replace the existing doGet function with this one:
function doGet(e) {
  try {
    const secret = (e.parameter && e.parameter.secret) || "";
    if (secret !== SYNC_SECRET) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: "unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const since = (e.parameter && e.parameter.since)
      ? new Date(e.parameter.since)
      : new Date(0);

    const ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_TAB);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: "Sheet not found: " + CONFIG.SHEET_TAB }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0].map(h => String(h).trim());
    const rows = data.slice(1)
      .filter(row => row[0] && new Date(row[0]) > since)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          const val = row[i];
          obj[h] = val instanceof Date ? val.toISOString() : val;
        });
        return obj;
      });

    return ContentService
      .createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST: After redeploying, verify with this URL in your browser:
// https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?secret=hsc-citizen-sync-2026&since=2020-01-01T00:00:00Z
// Should return a JSON array of citizen report rows.
// ─────────────────────────────────────────────────────────────────────────────
