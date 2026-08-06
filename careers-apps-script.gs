/**
 * Key2Nest — CAREERS application pipeline (separate from the contact-form
 * script on purpose: different sheet, different permissions (Drive), and a
 * careers bug must never be able to break lead capture).
 *
 * What it does per application:
 *   1. Verifies the Cloudflare Turnstile token (fails closed).
 *   2. Saves the uploaded resume to a Drive folder ("Key2Nest – Resumes").
 *   3. Appends a row to the "Applications" tab of the careers sheet.
 *   4. Emails a summary + resume link to NOTIFY_EMAIL.
 *   5. Returns JSON {ok:true} — careers.js reads this real verdict, so the
 *      applicant only sees success when the application actually landed.
 *
 * SETUP (one time). The script targets the careers sheet by its SHEET_ID below,
 * so it writes to that exact spreadsheet whether you bind the script to the
 * sheet or run it as a standalone project. Binding is simplest:
 *   1. Open the sheet (SHEET_ID below) → Extensions → Apps Script.
 *   2. Replace the default code with this file's contents. Save.
 *   3. Project Settings (gear) → Script Properties → Add property:
 *        TURNSTILE_SECRET_KEY = <the Cloudflare Turnstile secret>
 *      (Same secret as the contact-form script.)
 *   4. In the editor, select the function `setup` → Run. Grant the
 *      Sheets/Drive/Mail permissions when prompted. This creates the
 *      "Applications" tab, headers, status dropdown, and the resume folder.
 *   5. Deploy → New deployment → type "Web app":
 *        Execute as: Me · Who has access: Anyone
 *      Copy the /exec URL.
 *   6. Paste that URL into CAREERS_ENDPOINT at the top of careers.js,
 *      commit, and deploy the site.
 *
 * To change the notification email later: edit NOTIFY_EMAIL below, then
 * Deploy → Manage deployments → edit → New version (the /exec URL keeps).
 */

const NOTIFY_EMAIL = 'admin@key2nesthomeloans.com';
// Careers applications land in THIS specific spreadsheet, opened by ID so the
// script targets it whether it is bound to the sheet or a standalone project:
// https://docs.google.com/spreadsheets/d/1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc/edit
const SHEET_ID = '1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc';
const SHEET_NAME = 'Applications';
const FOLDER_NAME = 'Key2Nest – Resumes';
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

const HEADERS = [
  'Timestamp', 'Role', 'Full Name', 'Email', 'Phone', 'City, State',
  'NMLS ID', 'Resume', 'Message', 'Source', 'Status', 'Reviewed by', 'Notes'
];
const STATUS_VALUES = ['New', 'Reviewed', 'Interview', 'Offer', 'Hired', 'Declined'];

/** Run once manually after pasting the script: builds the tab + folder. */
function setup() {
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
  getResumeFolder(); // creates the Drive folder if missing
}

function getResumeFolder() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function doGet() {
  return json({ ok: true, service: 'key2nest-careers' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ts = verifyTurnstile(data.turnstileToken);
    if (!ts.ok) return json({ ok: false, error: ts.error });

    const required = ['role', 'name', 'email', 'phone', 'location', 'resumeName', 'resumeData'];
    for (const k of required) {
      if (!data[k] || typeof data[k] !== 'string') {
        return json({ ok: false, error: 'Missing field: ' + k });
      }
    }

    // Open the sheet up front and reject duplicates BEFORE storing anything, so a
    // duplicate never creates an orphan Drive file or notification email. Same
    // applicant (email) + same role is a duplicate; other roles are allowed.
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: false, error: 'Sheet not set up — run setup() first.' });
    if (isDuplicate(sheet, data.email, data.role)) {
      return json({ ok: false, code: 'duplicate', error: 'We have already received your application for this role.' });
    }

    // Resume: decode, size- and type-check server-side (never trust the client).
    const bytes = Utilities.base64Decode(data.resumeData);
    if (bytes.length > MAX_RESUME_BYTES) return json({ ok: false, error: 'Resume over 5 MB.' });
    const ext = ALLOWED_MIME[data.resumeType];
    const nameExt = String(data.resumeName).toLowerCase().replace(/^.*(\.[a-z0-9]+)$/, '$1');
    if (!ext && !['.pdf', '.doc', '.docx'].includes(nameExt)) {
      return json({ ok: false, error: 'Resume must be PDF or Word.' });
    }

    const safe = (s) => String(s).replace(/[^\w .,'@()+-]/g, ' ').trim().slice(0, 200);
    const parts = safe(data.name).split(/\s+/);
    const fileName = (parts[parts.length - 1] || 'Applicant') + '_' + (parts[0] || '') +
      '_' + safe(data.role).replace(/\s+/g, '-') + (ext || nameExt);
    const blob = Utilities.newBlob(bytes, data.resumeType || 'application/octet-stream', fileName);
    const file = getResumeFolder().createFile(blob);
    const resumeUrl = file.getUrl();

    sheet.appendRow([
      new Date(), safe(data.role), safe(data.name), safe(data.email), safe(data.phone),
      safe(data.location), safe(data.nmls || ''), resumeUrl,
      String(data.message || '').slice(0, 2000), safe(data.source || 'Careers page'), 'New', '', ''
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New Key2Nest Application — ' + safe(data.role) + ' — ' + safe(data.name),
      name: 'Key2Nest Careers',
      replyTo: safe(data.email),
      attachments: [blob], // resume attached for convenience; also saved to Drive + linked in the sheet
      body:
        'New application received.\n\n' +
        'Role:      ' + safe(data.role) + '\n' +
        'Name:      ' + safe(data.name) + '\n' +
        'Email:     ' + safe(data.email) + '\n' +
        'Phone:     ' + safe(data.phone) + '\n' +
        'Location:  ' + safe(data.location) + '\n' +
        'NMLS ID:   ' + safe(data.nmls || '—') + '\n' +
        'Resume:    ' + resumeUrl + '  (also attached to this email)\n\n' +
        'Message:\n' + String(data.message || '—').slice(0, 2000) + '\n\n' +
        'Sheet: ' + ss.getUrl()
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Server error: ' + err.message });
  }
}

/**
 * Duplicate guard. The same applicant (identified by email) applying to the
 * SAME role is a duplicate; the same person applying to a DIFFERENT role is
 * allowed. Compares the Email and Role columns case-insensitively.
 */
function isDuplicate(sheet, email, role) {
  const last = sheet.getLastRow();
  if (last < 2) return false; // header only, no applications yet
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

/** Cloudflare Turnstile siteverify — fails closed, token never stored. */
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
