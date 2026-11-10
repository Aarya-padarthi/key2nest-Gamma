/**
 * Key2Nest — CAREERS isolated preview backend — READY TO PASTE
 * ==============================================================
 *
 * Operator: Aarya Padarthi (deploying under the company Workspace account
 *   admin@key2nesthomeloans.com).
 * Prepared: 2026-11-10 for the isolated Preview of Project 1.
 * Test sheet: 1IXMHU8hKZaMgqyRR9TeX_jevb3PvuH8Kb3yFtnvar9g
 * Test mailbox: admin+k2n-preview@key2nesthomeloans.com (plus-aliased to
 *   admin@key2nesthomeloans.com; delivered there, filterable by the
 *   +k2n-preview tag in the To: header).
 * Test resume folder: K2N-Preview-Test-Resumes (auto-created on setup)
 * Turnstile secret: Cloudflare public always-pass test key
 *                   `1x0000000000000000000000000000000AA`
 *                   (set as the Script Property TURNSTILE_SECRET_KEY)
 *
 * This Apps Script will refuse to serve if any production identifier
 * is accidentally pasted in: assertIsolated() guards every entry
 * point (doGet, doPost, handleInterest, setup) and throws before any
 * write. The guard is unconditional, cannot be bypassed from the
 * payload, and is the first line of defence against cross-wiring to
 * the production applicants sheet, Drive folder, or recruiter inbox.
 *
 * DEPLOYMENT (3 steps — operator Google account only):
 *   1. script.google.com → New project → paste this whole file as Code.gs.
 *   2. Project Settings (gear) → Script Properties → Add
 *        TURNSTILE_SECRET_KEY = 1x0000000000000000000000000000000AA
 *   3. Editor → function `setup` → Run (grant permissions when prompted)
 *      → Deploy → New deployment → type Web app
 *        · Execute as: Me
 *        · Who has access: Anyone
 *      → Copy the /exec URL and paste it in chat.
 *
 * After the /exec URL is provided, the frontend preview branch
 * (release/project-1-frontend-preview) will be patched to send both
 * forms exclusively to this endpoint, and the single-branch Netlify
 * preview deploy will be enabled. Production remains untouched.
 */

// ⚠ TEST-ONLY CONSTANTS — baked in for the Key2Nest Workspace preview.
// SHEET_ID below is the company-Workspace test sheet created on 2026-11-10.
// NOTIFY_EMAIL uses Gmail Workspace plus-aliasing so delivery lands in the
// `admin@key2nesthomeloans.com` inbox (as requested) while the To: header
// carries a filterable `+k2n-preview` tag that cleanly distinguishes test
// email from genuine applicant mail. assertIsolated() still refuses to run
// if NOTIFY_EMAIL is set to the bare production literal, preserving the
// isolation guard against an accidental equality-match configuration.
const NOTIFY_EMAIL = 'admin+k2n-preview@key2nesthomeloans.com';
const SHEET_ID     = '1IXMHU8hKZaMgqyRR9TeX_jevb3PvuH8Kb3yFtnvar9g';
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
  // Isolation guard runs OUTSIDE the try/catch so a violation is
  // surfaced as a real HTTP-level error (and a legible execution-log
  // entry with "ISOLATION VIOLATION…"), not silently absorbed into
  // {ok:false, code:'server_error'}. This matches the behaviour of
  // doGet() and setup() where assertIsolated is also unguarded.
  assertIsolated();
  try {
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
    // Preview-template MIME policy is strict: the declared Content-Type
    // MUST be one of the known resume MIME types. This differs from the
    // production release candidate (which falls back to filename
    // extension) so a link-holder cannot stage arbitrary bytes into the
    // operator's Drive under a .pdf extension and a hostile MIME.
    const ext = ALLOWED_MIME[data.resumeType];
    if (!ext) {
      return json({ ok: false, error: 'Resume must be a PDF or Word document (strict preview MIME check).' });
    }
    const nameExt = String(data.resumeName).toLowerCase().replace(/^.*(\.[a-z0-9]+)$/, '$1');

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
