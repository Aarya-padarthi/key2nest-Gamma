/**
 * Key2Nest — CAREERS application pipeline — ISOLATED TEST TEMPLATE
 * =================================================================
 *
 * REFERENCE ONLY. This file is NOT deployed by any build. It is a code
 * review artifact: a copy of the release candidate
 *   `release/project-1-apps-script` @ 91fb1eddeb05ffd94c3d82eae17a780b925f5a0d
 *   (careers-apps-script.gs)
 * with four isolation substitutions applied, so an operator can paste it
 * into a BRAND-NEW Apps Script project (never the production one) and
 * deploy it against a BRAND-NEW test Google Sheet and Drive folder.
 *
 * The purpose of this template is to produce an alternative `/exec` URL
 * whose downstream effects (sheet rows, resume files, admin email) can
 * be seen and discarded without ever touching production data.
 *
 * ------------------------------------------------------------------
 * REQUIRED SUBSTITUTIONS BEFORE DEPLOYMENT
 * ------------------------------------------------------------------
 *
 *   1. NOTIFY_EMAIL
 *      Replace '<YOUR-TEST-EMAIL>' with a mailbox YOU control that is
 *      NOT admin@key2nesthomeloans.com. Suggested:
 *        aarya.2.padarthi+k2n-preview@gmail.com
 *      Every test submission will email this address.
 *
 *   2. SHEET_ID
 *      Replace '<YOUR-TEST-SHEET-ID>' with the ID of a NEW Google
 *      Sheet that you create specifically for preview tests.
 *        - Create a new blank Sheet: https://sheets.new
 *        - Rename it to e.g. "Key2Nest — PREVIEW TEST — Applications"
 *        - Copy the ID from the URL between `/d/` and `/edit`
 *        - MUST NOT be `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc`
 *          (that is the production sheet — hard check below will reject).
 *
 *   3. FOLDER_NAME
 *      Already set to 'K2N-Preview-Test-Resumes' (string differs from
 *      production folder name 'Key2Nest – Resumes' so the Apps Script
 *      cannot accidentally resolve to the production folder via name
 *      lookup).
 *
 *   4. Script Property TURNSTILE_SECRET_KEY
 *      In the Apps Script editor: Project Settings (gear) → Script
 *      Properties → Add property with these exact values for an
 *      isolated test (Cloudflare's PUBLISHED always-pass TEST secret):
 *        Name:  TURNSTILE_SECRET_KEY
 *        Value: 1x0000000000000000000000000000000AA
 *      Pairing the matching PUBLIC test site key
 *      (1x00000000000000000000AA) in the frontend lets any Turnstile
 *      response succeed without ever hitting the real production key.
 *      Never paste the production Turnstile secret into this project.
 *
 * ------------------------------------------------------------------
 * DEPLOYMENT (Phase D external action — NOT YET AUTHORIZED)
 * ------------------------------------------------------------------
 *
 *   a. Create a new standalone Apps Script project (NOT bound to the
 *      production sheet). script.google.com → New project.
 *   b. Paste this file's contents (after substitutions) as Code.gs.
 *   c. Save. Run the `setup` function manually; grant Sheets / Drive /
 *      Mail permissions when prompted.
 *   d. Deploy → New deployment → type "Web app":
 *        Execute as: Me
 *        Who has access: Anyone
 *      Copy the /exec URL.
 *   e. Paste that URL into `preview-config.js` on the preview-only
 *      frontend branch (release/project-1-frontend-preview), replacing
 *      the placeholder 'PLACEHOLDER-ISOLATED-TEST-ENDPOINT-HERE'.
 *   f. Commit on the preview branch only. Never merge to main.
 *
 * ------------------------------------------------------------------
 * HARD GUARDS — refuse to run if these look like production
 * ------------------------------------------------------------------
 *
 * The constants below and the `assertIsolated` function abort the
 * Apps Script execution on the first sight of a production-looking
 * identifier. These checks run before every doPost / doGet / setup
 * invocation, so a misconfiguration surfaces as an explicit error
 * rather than a silent cross-wire.
 */

// ⚠ TEST-ONLY CONSTANTS — must be set by the operator before `setup` is run.
const NOTIFY_EMAIL = '<YOUR-TEST-EMAIL>';
const SHEET_ID     = '<YOUR-TEST-SHEET-ID>';
const SHEET_NAME   = 'Applications';
const FOLDER_NAME  = 'K2N-Preview-Test-Resumes';
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

// ⛔ PRODUCTION BLOCKLIST — if the operator leaves any production identifier
// in place, assertIsolated() throws and the deployment refuses to serve.
const PRODUCTION_SHEET_ID        = '1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc';
const PRODUCTION_NOTIFY_EMAIL    = 'admin@key2nesthomeloans.com';
const PRODUCTION_FOLDER_NAME     = 'Key2Nest – Resumes';
const ISOLATION_PLACEHOLDERS = [
  '<YOUR-TEST-EMAIL>',
  '<YOUR-TEST-SHEET-ID>'
];

function assertIsolated() {
  if (SHEET_ID === PRODUCTION_SHEET_ID) {
    throw new Error('ISOLATION VIOLATION: SHEET_ID points at the production applications sheet. Refusing to run.');
  }
  if (NOTIFY_EMAIL === PRODUCTION_NOTIFY_EMAIL) {
    throw new Error('ISOLATION VIOLATION: NOTIFY_EMAIL is the production admin mailbox. Refusing to run.');
  }
  if (FOLDER_NAME === PRODUCTION_FOLDER_NAME) {
    throw new Error('ISOLATION VIOLATION: FOLDER_NAME is the production resume folder. Refusing to run.');
  }
  if (ISOLATION_PLACEHOLDERS.indexOf(SHEET_ID) !== -1 ||
      ISOLATION_PLACEHOLDERS.indexOf(NOTIFY_EMAIL) !== -1) {
    throw new Error('ISOLATION VIOLATION: SHEET_ID or NOTIFY_EMAIL still carries a placeholder. Fill them in first.');
  }
}

const HEADERS = [
  'Timestamp', 'Role', 'Full Name', 'Email', 'Phone', 'City, State',
  'NMLS ID', 'Resume', 'Message', 'Source', 'Status', 'Reviewed by', 'Notes'
];
const STATUS_VALUES = ['New', 'Reviewed', 'Interview', 'Offer', 'Hired', 'Declined'];

function setup() {
  assertIsolated();
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  const head = sheet.getRange(1, 1, 1, HEADERS.length);
  head.setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  const statusCol = HEADERS.indexOf('Status') + 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_VALUES, true).setAllowInvalid(false).build();
  sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  getResumeFolder();
}

function getResumeFolder() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function sanitiseCell(s) {
  var v = String(s == null ? '' : s)
    .replace(/[^\p{L}\p{M}\p{N} .,'’@()+\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function doGet() {
  assertIsolated();
  return json({ ok: true, service: 'key2nest-careers-PREVIEW-TEST' });
}

function doPost(e) {
  try {
    assertIsolated();
    const data = JSON.parse(e.postData.contents);

    const ts = verifyTurnstile(data.turnstileToken);
    if (!ts.ok) return json({ ok: false, code: 'turnstile_failed', error: ts.error });

    const submissionType = (data.submissionType === 'interest') ? 'interest' : 'application';
    if (submissionType === 'interest') return handleInterest(data);

    const required = ['role', 'name', 'email', 'phone', 'location', 'resumeName', 'resumeData'];
    for (const k of required) {
      if (!data[k] || typeof data[k] !== 'string') {
        return json({ ok: false, error: 'Missing field: ' + k });
      }
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: false, error: 'Sheet not set up — run setup() first.' });
    if (isDuplicate(sheet, data.email, data.role)) {
      return json({ ok: false, code: 'duplicate', error: 'We have already received your application for this role.' });
    }

    const bytes = Utilities.base64Decode(data.resumeData);
    if (bytes.length > MAX_RESUME_BYTES) return json({ ok: false, error: 'Resume over 5 MB.' });
    const ext = ALLOWED_MIME[data.resumeType];
    const nameExt = String(data.resumeName).toLowerCase().replace(/^.*(\.[a-z0-9]+)$/, '$1');
    if (!ext && !['.pdf', '.doc', '.docx'].includes(nameExt)) {
      return json({ ok: false, error: 'Resume must be PDF or Word.' });
    }

    const safe = sanitiseCell;
    const parts = safe(data.name).split(/\s+/);
    const fileName = (parts[parts.length - 1] || 'Applicant') + '_' + (parts[0] || '') +
      '_' + safe(data.role).replace(/\s+/g, '-') + (ext || nameExt);
    const blob = Utilities.newBlob(bytes, data.resumeType || 'application/octet-stream', fileName);
    const file = getResumeFolder().createFile(blob);
    const resumeUrl = file.getUrl();

    sheet.appendRow([
      new Date(), safe(data.role), safe(data.name), safe(data.email), safe(data.phone),
      safe(data.location), safe(data.nmls || ''), resumeUrl,
      String(data.message || '').slice(0, 2000), safe(data.source || 'PREVIEW TEST'), 'New', '', ''
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: '[PREVIEW TEST] Key2Nest Application — ' + safe(data.role) + ' — ' + safe(data.name),
      name: 'Key2Nest Careers (PREVIEW TEST)',
      replyTo: safe(data.email),
      attachments: [blob],
      body:
        '[PREVIEW TEST — this submission did NOT reach production]\n\n' +
        'Role:      ' + safe(data.role) + '\n' +
        'Name:      ' + safe(data.name) + '\n' +
        'Email:     ' + safe(data.email) + '\n' +
        'Phone:     ' + safe(data.phone) + '\n' +
        'Location:  ' + safe(data.location) + '\n' +
        'NMLS ID:   ' + safe(data.nmls || '—') + '\n' +
        'Resume:    ' + resumeUrl + '\n\n' +
        'Message:\n' + String(data.message || '—').slice(0, 2000) + '\n\n' +
        'Sheet: ' + ss.getUrl()
    });

    return json({ ok: true });
  } catch (err) {
    const errName = (err && err.name) ? String(err.name) : 'Error';
    const errMsg  = (err && err.message) ? String(err.message).slice(0, 200) : '(no message)';
    console.error('[PREVIEW] careers-apps-script doPost failure — ' + errName + ': ' + errMsg);
    return json({ ok: false, code: 'server_error' });
  }
}

function handleInterest(data) {
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    return json({ ok: false, error: 'Missing field: name' });
  }
  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(data.email)) {
    return json({ ok: false, error: 'Missing field: email' });
  }
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return json({ ok: false, error: 'Sheet not set up — run setup() first.' });

  const safe = sanitiseCell;
  const chosenRole = safe(data.role || '').trim() || 'General';
  const roleLabel = 'Interest — ' + chosenRole;

  sheet.appendRow([
    new Date(), roleLabel, safe(data.name), safe(data.email), safe(data.phone || ''),
    safe(data.location || ''), safe(data.nmls || ''), '',
    String(data.message || '').slice(0, 2000),
    safe(data.source || 'PREVIEW TEST — Quick interest'), 'New', '', ''
  ]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '[PREVIEW TEST] Career Inquiry — ' + safe(data.name) + ' — ' + chosenRole,
    name: 'Key2Nest Careers (PREVIEW TEST)',
    replyTo: safe(data.email),
    body:
      '[PREVIEW TEST — this submission did NOT reach production]\n\n' +
      'Role of interest: ' + chosenRole + '\n' +
      'Name:             ' + safe(data.name) + '\n' +
      'Email:            ' + safe(data.email) + '\n' +
      'Phone:            ' + safe(data.phone || '—') + '\n\n' +
      'Message:\n' + String(data.message || '—').slice(0, 2000) + '\n\n' +
      'Sheet: ' + ss.getUrl()
  });

  return json({ ok: true });
}

function isDuplicate(sheet, email, role) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const roleCol = HEADERS.indexOf('Role');
  const emailCol = HEADERS.indexOf('Email');
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const e = String(email || '').trim().toLowerCase();
  const r = String(role || '').trim().toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][emailCol] || '').trim().toLowerCase() === e &&
        String(rows[i][roleCol] || '').trim().toLowerCase() === r) {
      return true;
    }
  }
  return false;
}

function verifyTurnstile(token) {
  const secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET_KEY');
  if (!secret) return { ok: false, error: 'Server misconfigured: TURNSTILE_SECRET_KEY not set.' };
  if (!token || typeof token !== 'string') return { ok: false, error: 'Missing security verification token.' };
  try {
    const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true
    });
    const out = JSON.parse(res.getContentText());
    return out.success ? { ok: true }
      : { ok: false, error: 'Security verification failed: ' + (out['error-codes'] || []).join(', ') };
  } catch (err) {
    return { ok: false, error: 'Security verification unavailable.' };
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
