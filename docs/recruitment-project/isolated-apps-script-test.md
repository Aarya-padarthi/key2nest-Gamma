# Key2Nest — Isolated Apps Script Validation Procedure

**Purpose.** Validate the backend release candidate (`release/project-1-apps-script` at `91fb1ed9…`) in a fully isolated Apps Script project that posts to a throwaway test Sheet + test Drive folder. The production careers Apps Script / Sheet / Drive folder are not touched.

**Why this matters.** The final hardening instruction requires the Apps Script behaviour to be verified before any production redeploy is authorised. The deployment procedure in `apps-script-release-safety.md` already covers how to redeploy production; this document covers how to verify the candidate **without** redeploying production.

---

## 1. Create the isolated test environment (one-time, ~5 min)

**Important:** perform this signed in to a Google account you are willing to use for QA. Resumes you upload during tests will land in that account's Drive.

1. In Google Drive, create a folder `K2N-Project1-Test` (not shared).
2. Inside, create:
   - A new Google Sheet named `K2N-Test-Applications`.
   - (The script will create its own test Drive folder named `K2N-Test-Resumes` on first submission.)
3. Open `K2N-Test-Applications` → **Extensions → Apps Script**. This creates a bound Apps Script project that cannot reach the production script.
4. In the editor, replace the default `Code.gs` content with the release-candidate file. From a clean clone:
   ```bash
   git fetch origin release/project-1-apps-script
   git show origin/release/project-1-apps-script:careers-apps-script.gs | pbcopy   # macOS
   ```
   then paste into the editor.
5. Before saving, change three constants at the top of the file so the isolated script targets the **test** Sheet and folder:
   ```js
   const NOTIFY_EMAIL = '<your personal email>';                        // instead of admin@…
   const SHEET_ID     = '<paste the K2N-Test-Applications sheet id>';   // from its URL
   const FOLDER_NAME  = 'K2N-Test-Resumes';                             // test folder name
   ```
6. **Save (⌘S / Ctrl+S).**
7. In Project Settings (gear icon) → Script Properties, add:
   ```
   TURNSTILE_SECRET_KEY = 1x0000000000000000000000000000000AA
   ```
   (`1x…` is Cloudflare's "always-passes" test secret so every synthetic submission's Turnstile check succeeds without a real widget.)
8. **Deploy → New deployment → Type: Web app.** Execute as: Me. Who has access: Anyone.
9. Copy the test `/exec` URL (ends in `/exec`). This is distinct from the production `/exec`.

---

## 2. Run the test matrix

For each row below, submit a synthetic request to the **test** `/exec` URL (not production). Use `curl` or a tiny HTML test page you host locally. Each request payload is JSON, posted as `text/plain` to avoid CORS preflight (the same shape the site uses).

### 2.1 Interest-form matrix (submissionType: "interest")

| Test | Payload (synthetic) | Expected |
|---|---|---|
| A1. Happy path | `{submissionType:"interest",name:"QA Alice",email:"qa.alice@example.com",phone:"5555551212",role:"Senior Mortgage Loan Originator",source:"test",turnstileToken:"XXXX.DUMMY.TOKEN.XXXX"}` | `{ok: true}` in response; a new row appears in `K2N-Test-Applications` with Role prefix `Interest — Senior Mortgage Loan Originator`; test email to `NOTIFY_EMAIL` arrives |
| A2. Missing name | Same but `name:""` | `{ok: false, error: "Missing field: name"}`; no row; no email |
| A3. Malformed email | Same but `email:"not-an-email"` | `{ok: false, error: "Missing field: email"}`; no row; no email |
| A4. Missing Turnstile token | Same but omit `turnstileToken` | `{ok: false, code: "turnstile_failed", error: "Missing security verification token."}`; no row; no email |
| A5. Unicode name (accented) | Same but `name:"André López"` | `{ok: true}`; row shows name intact (not corrupted to "Andr  L pez"); |
| A6. Unicode name (Devanagari) | Same but `name:"अर्जुन सिंह"` | `{ok: true}`; row shows name intact |
| A7. Formula leader `=` | Same but `name:"=HYPERLINK(\"evil\")"` | `{ok: true}`; row shows the `=` stripped (name reads `HYPERLINK( evil )`); cell does NOT render as a formula |
| A8. Formula leader `+` | Same but `name:"+COUNT()"`  | `{ok: true}`; row shows `'+COUNT()` (apostrophe prefixed); cell renders as literal text |

### 2.2 Full-application matrix

For these, build a small 1-page PDF, base64-encode it, and send under `resumeData`. Minimal payload:

```js
{
  role: "Senior Mortgage Loan Originator",
  name: "QA Bob",
  email: "qa.bob@example.com",
  phone: "5555551212",
  location: "Preview, QA",
  nmls: "0000000",
  message: "synthetic test",
  source: "test",
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  resumeName: "QA-dummy.pdf",
  resumeType: "application/pdf",
  resumeData: "<base64 of a tiny 1-page pdf>"
}
```

| Test | Modification | Expected |
|---|---|---|
| B1. Happy path | none | `{ok:true}`; row appears; resume file exists in `K2N-Test-Resumes`; test email with resume attachment arrives |
| B2. Oversized resume | `resumeData` of a file > 5 MB | `{ok:false, error:"Resume over 5 MB."}`; no row; no Drive file; no email |
| B3. Bad resume type | `resumeName:"evil.exe", resumeType:"application/octet-stream"` | `{ok:false, error:"Resume must be PDF or Word."}`; no row; no Drive file |
| B4. Missing resume data | omit `resumeData` | `{ok:false, error:"Missing field: resumeData"}` |
| B5. Duplicate (B1 then B1 again) | repeat B1 | `{ok:false, code:"duplicate", error:"We have already received…"}`; sheet still shows one row from B1; no duplicate email |
| B6. Server exception (force a bad payload) | Set `resumeData:"not-base64-@@@"` to trigger a decode failure | `{ok:false, code:"server_error"}`; **no raw exception text in the response body**; Apps Script "Executions" tab shows the capped internal log |

### 2.3 Resume access restriction

After B1:

- Copy the Drive URL from the test Sheet's Resume column.
- Open it in an incognito browser window (not signed in). You must NOT see the file content — a "You need access" page or a Google sign-in prompt is correct. If you can read the file without signing in, the folder is link-shared — flag this to the operator even though M-04 is NOT in this release candidate.

### 2.4 Recruiter notification

Check the inbox for `NOTIFY_EMAIL`:

- Email arrives within 60 s of each B1/A1 submission.
- Email body ends with the Drive-scan reminder line (M-05): *"Note: the resume is scanned by Google Drive at download time. Prefer opening via the Drive link above so the scan runs."*
- Subject carries the role name.
- `Reply-To` is the synthetic applicant email (not the script's own address).

### 2.5 Frontend ↔ backend compatibility (both deployment orders)

This section covers the live-browser side-check you cannot do from inside the Apps Script test alone; it must run against the Netlify branch preview once the preview URL is available.

- **Order A** (updated FE + baseline BE) — Netlify branch-deploy of `release/project-1-frontend` is pointed at the **production** `/exec` URL (since that's what the FE constants hold). Smoke-test only the happy path to confirm the response is read correctly, using `QA-PREVIEW-` markers and immediate cleanup. No authorised preview URL yet → **skipped, unverified**.
- **Order B** (baseline FE + updated BE) — not safely testable without a preview; skipped. The 41/41 automated response-contract matrix on the audit branch covers this on the code level.

### 2.6 Previous-version recovery

In the isolated Apps Script editor:

1. **Deploy → Manage deployments → ✏️ → Version: select the first version you deployed → Deploy.**
2. Re-submit A1. Response is `{ok:true}`.
3. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** to return to the candidate.

Confirms the version-rollback affordance works in a safe environment before you rely on it in production.

---

## 3. Clean up

Delete `K2N-Project1-Test` folder (contents and bound Apps Script) when done. Empty the Drive Trash.

---

## 4. Record the outcome

```
Isolated test performed by:    ________
Date:                          ________
Google account used:           ________
Test /exec URL:                ________
Interest matrix (A1..A8):      ________
Application matrix (B1..B6):   ________
Resume incognito access:       ("blocked" | "allowed")
Admin email arrived:           ☐
Admin email contains scan note:☐
Version rollback worked:       ☐
Any findings:                  ________
```

Keep this record in your change-management notes. The audit branch can be updated with a redacted summary (no email addresses / applicant data) by committing a copy to `docs/recruitment-project/isolated-test-results-YYYYMMDD.md`.
