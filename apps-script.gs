/**
 * Key2Nest — Contact Form → Google Sheet + Internal Email Notification
 *                          + Cloudflare Turnstile bot verification
 *
 * NO email is sent to the customer. The on-page success message handles the
 * customer acknowledgment. This script only:
 *   1. Verifies the Cloudflare Turnstile token (rejects bots before anything
 *      is stored or emailed).
 *   2. Appends a row to the sheet.
 *   3. Emails you (contact@key2nesthomeloans.com) so you see new inquiries
 *      instantly without refreshing the sheet.
 *
 * ── ONE-TIME SETUP: TURNSTILE SECRET KEY (~1 minute) ──────────────────────
 * The secret key is stored in Script Properties — NEVER hardcoded here.
 *   1. In the Apps Script editor, click the gear icon (Project Settings).
 *   2. Scroll to "Script Properties" → click "Add script property".
 *   3. Property name:  TURNSTILE_SECRET_KEY
 *      Value:          (paste the Secret Key from your Cloudflare Turnstile
 *                       dashboard — dash.cloudflare.com → Turnstile → your
 *                       widget → Secret Key)
 *   4. Click "Save script properties".
 *
 * ── DEPLOYMENT (~3 minutes) ───────────────────────────────────────────────
 *   1. Open your Google Sheet:
 *      https://docs.google.com/spreadsheets/d/1iRjyfZKua4N1Q6RP0ebwkqTxO8Q-WWnXfpPGNgQ7VpY/edit
 *   2. Make sure Row 1 of the target tab has these headers (in this exact order):
 *      A: Timestamp  |  B: Name  |  C: Email  |  D: Phone  |  E: Loan Type  |  F: Message  |  G: Source
 *   3. Click Extensions → Apps Script
 *   4. Delete any existing code and paste THIS entire file in.
 *   5. Complete the Script Properties setup above (TURNSTILE_SECRET_KEY).
 *   6. (Optional) Edit the SHEET_NAME constant below if your tab is not named "Sheet1".
 *   7. Click Deploy → New deployment → gear icon → "Web app"
 *        - Description: "Key2Nest contact form"
 *        - Execute as: Me (your gmail)
 *        - Who has access: Anyone
 *      Click Deploy. You may be asked to authorize — accept all scopes.
 *      (The UrlFetchApp scope is new in this version — re-authorization is expected.)
 *   8. Copy the resulting URL (ends in /exec).
 *   9. Paste that URL into main.js, line marked SHEETS_ENDPOINT.
 *
 * IF YOU'VE ALREADY DEPLOYED an older version of this script:
 *   - Replace the code in your Apps Script editor with this entire file.
 *   - Add the TURNSTILE_SECRET_KEY script property (steps above).
 *   - Click Deploy → Manage deployments → pencil/edit icon on your existing
 *     deployment → Version: New version → Deploy. The /exec URL stays the same.
 *
 * SECURITY NOTES
 *   - Requests without a valid Turnstile token are rejected: nothing is
 *     written to the sheet and no email is sent.
 *   - Tokens are single-use and verified server-side against Cloudflare, so a
 *     bot cannot replay a captured token or skip the widget.
 *   - The token itself is never stored in the sheet or included in emails.
 */

const SHEET_NAME = 'Sheet1'; // Change to match the tab name where leads should land.
// Leads land in THIS spreadsheet (opened by ID):
// https://docs.google.com/spreadsheets/d/1iRjyfZKua4N1Q6RP0ebwkqTxO8Q-WWnXfpPGNgQ7VpY/edit
const SHEET_ID = '1iRjyfZKua4N1Q6RP0ebwkqTxO8Q-WWnXfpPGNgQ7VpY';
const NOTIFY_EMAIL = 'contact@key2nesthomeloans.com';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── 1. Turnstile verification — reject bots before touching the sheet ──
    const check = verifyTurnstile(data.turnstileToken);
    if (!check.ok) {
      return jsonOut({ ok: false, error: check.error });
    }
    delete data.turnstileToken; // single-use, never stored

    // ── 2. Append the lead to the sheet ──
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    const row = [
      new Date(),
      data.name || '',
      data.email || '',
      data.phone || '',
      data.loanType || '',
      data.message || '',
      data.source || 'Website',
    ];
    sheet.appendRow(row);

    // ── 3. Internal notification so you see new inquiries without refreshing the sheet ──
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      name: 'Key2Nest Website',
      replyTo: data.email || NOTIFY_EMAIL,
      subject: 'New Key2Nest Inquiry — ' + (data.name || 'Unknown'),
      htmlBody:
        '<p><strong>New inquiry from the Key2Nest website:</strong></p>' +
        '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif">' +
          '<tr><td><b>Name:</b></td><td>' + escapeHtml(data.name || '') + '</td></tr>' +
          '<tr><td><b>Email:</b></td><td><a href="mailto:' + escapeHtml(data.email || '') + '">' + escapeHtml(data.email || '') + '</a></td></tr>' +
          '<tr><td><b>Phone:</b></td><td><a href="tel:' + escapeHtml(data.phone || '') + '">' + escapeHtml(data.phone || '') + '</a></td></tr>' +
          '<tr><td><b>Loan Type:</b></td><td>' + escapeHtml(data.loanType || '') + '</td></tr>' +
          '<tr><td valign="top"><b>Message:</b></td><td style="white-space:pre-wrap">' + escapeHtml(data.message || '') + '</td></tr>' +
        '</table>' +
        '<p style="color:#888;font-size:12px">Verified human via Cloudflare Turnstile. Logged in the sheet automatically. Reach back out within 24 hours.</p>',
    });

    return jsonOut({ ok: true });

  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

/**
 * Verifies a Cloudflare Turnstile token against the siteverify endpoint.
 * Returns { ok: true } for verified humans, { ok: false, error } otherwise.
 * Fails CLOSED: missing secret, missing token, network errors, and
 * unsuccessful verification all reject the request.
 */
function verifyTurnstile(token) {
  const secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET_KEY');
  if (!secret) {
    // Misconfiguration must not silently let traffic through.
    return { ok: false, error: 'Server misconfigured: TURNSTILE_SECRET_KEY script property is not set.' };
  }
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Missing security verification token.' };
  }

  try {
    const response = UrlFetchApp.fetch(TURNSTILE_VERIFY_URL, {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true,
    });
    const result = JSON.parse(response.getContentText());
    if (result.success === true) {
      return { ok: true };
    }
    return {
      ok: false,
      error: 'Security verification failed: ' + ((result['error-codes'] || []).join(', ') || 'unknown'),
    };
  } catch (err) {
    return { ok: false, error: 'Security verification unavailable: ' + String(err) };
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput('Key2Nest contact form endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
