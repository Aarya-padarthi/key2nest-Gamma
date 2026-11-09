# Key2Nest — Project 1 Apps Script Release Safety Matrix

**Target release candidate:** `release/project-1-apps-script` at `91fb1ed9…`
**Baseline backend:** careers Apps Script `/exec` `AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg`
**Prepared:** 2026-11-09

This document covers the six items the final hardening instruction requires before an Apps Script redeploy is authorised:

- Current deployed version — how to identify it.
- Compatible target version — this release candidate.
- Approved deployment procedure.
- Previous-version restoration procedure.
- Form submission behaviour before and after deployment.
- M-04 validation result.

---

## 1. Current deployed version

The careers Apps Script project's active version **cannot be determined from this session** (no network access to `script.google.com` and no MCP tool available for Apps Script dashboards). The operator must identify it from the Apps Script editor:

1. Open the careers Sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` → **Extensions → Apps Script**.
2. **Deploy → Manage deployments.**
3. The active Web App row shows the current **Version** number and the deployment description. Record both values.
4. **Project history** (icon in the left rail) shows every saved version with a timestamp. Confirm the active deployment matches an entry in that list.

**Record the current state here before deploying this candidate:**

```
Current deployed Version number:  _________
Current deployed description:     _________
Date deployed:                     _________
Observed by:                       _________
```

If the active deployment does not match any entry in Project history, the operator should pause the redeploy and investigate — this means someone has deployed from an unrecorded source.

---

## 2. Compatible target version

The target code for this release is `careers-apps-script.gs` at commit `91fb1ed9…` on branch `release/project-1-apps-script`.

The file is **not a drop-in binary**. Operators retrieve the content via:

```bash
git fetch origin release/project-1-apps-script
git show origin/release/project-1-apps-script:careers-apps-script.gs > /tmp/careers-apps-script_new.gs
```

The content of `/tmp/careers-apps-script_new.gs` is what gets pasted into the Apps Script editor.

**Diff vs baseline (for operator eyeball review):**

```bash
git diff origin/main..origin/release/project-1-apps-script -- careers-apps-script.gs | less
```

Summary of the diff (+67 / -4):

- Adds `sanitiseCell()` (M-01) — shared cell sanitiser with Unicode support + formula-leader apostrophe-prefix defence.
- Two `safe = sanitiseCell;` adapter lines inside `doPost` and `handleInterest` so the existing `safe(...)` call sites keep working.
- Adds `code: 'turnstile_failed'` to the Turnstile-rejection response (while keeping the existing `error` field — not a breaking change for the baseline frontend).
- Replaces the `doPost` catch's raw-exception return with `{ok:false, code:'server_error'}` plus a bounded `console.error` log (H-01).
- Adds a two-line Drive-scan reminder to the admin email body (M-05).
- Records a short code-level comment near `createFile(blob)` explaining that M-04 (`file.setSharing`) is **not** present in this candidate.

### Expected behavioural impact

| Behaviour | Before | After |
|---|---|---|
| Interest form submission (happy path) | Row + email delivered | Row + email delivered (unchanged) |
| Full application (happy path) | Row + email delivered, resume in Drive | Row + email delivered, resume in Drive (unchanged) |
| Candidate submits "José López" or "अर्जुन" | Row shows corrupted name (non-ASCII → spaces) | Row shows intact Unicode name |
| Candidate submits a string starting with `=` | Sheet may render as formula | Written with leading apostrophe; sheet shows literal text |
| Backend throws an unexpected exception | Response returns `{ok:false, error:"Server error: TypeError: ..."}` leaked to client | Response returns `{ok:false, code:'server_error'}`; detailed error logged in Apps Script "Executions" only |
| Drive file created from resume | File inherits folder sharing | **Unchanged — no permission change in this release**. (M-04 is intentionally not deployed; see §6.) |
| Admin notification email body | Fields + resume link | Fields + resume link + two-line scan-reminder note |

---

## 3. Approved deployment procedure

Follow exactly. The `/exec` URL does not change at any point.

1. Record the current deployed Version + description in §1.
2. Open the careers Sheet → **Extensions → Apps Script**.
3. Click the `careers-apps-script.gs` file in the left rail (or whatever the file is named in your project — it is a single-file project).
4. **Select all (⌘A / Ctrl+A) → Delete.**
5. Paste the content of the new file (from §2).
6. **Save (⌘S / Ctrl+S).** The editor shows "Saved" in the status bar.
7. **Deploy → Manage deployments.**
8. On the existing Web App row, click the **✏️ (edit)** icon.
9. Change **Version** to **New version**.
10. In the description, type something like `Project 1 — H-01, M-01, M-05 (ref release/project-1-apps-script 91fb1ed9)`.
11. Click **Deploy**.
12. Confirm the Web App URL at the bottom of the confirmation dialog still ends in `AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg/exec`. If it changed (should not), stop and investigate.
13. Click **Done**.

### Post-deployment verification (run within 10 minutes of deploy)

Use the synthetic-test convention from `preview-validation.md §2`:

- Submit a synthetic quick-interest row: name `QA-POSTDEPLOY-Alice`, email `aarya.2.padarthi+qa-postdeploy-20261109@gmail.com`, phone `5555551212`, role `Entry-Level Mortgage Loan Originator`.
- Submit a synthetic full application with the same markers + a 1-page synthetic PDF resume named `QA-POSTDEPLOY-dummy.pdf`.
- For **each** submission, verify:
  - Returns `{ok: true}` (on the browser Network tab).
  - A new row appears in the Applications sheet within 30 seconds.
  - For the interest row, Role prefix is `Interest — Entry-Level Mortgage Loan Originator`.
  - For the full application, the Resume cell holds a Drive URL that opens the uploaded PDF (for the submitting operator — folder access unchanged in this release).
  - `admin@key2nesthomeloans.com` receives the notification email with the Drive-scan reminder line visible.

Delete the synthetic rows and files after verification.

### What to watch for (would indicate a bad deployment)

- Submissions returning `{ok:false, code:'server_error'}` — then check Apps Script **Executions** → look at the most-recent failure log for the root cause.
- Submissions returning `{ok:false, error:'Server misconfigured: TURNSTILE_SECRET_KEY not set.'}` — the Script Property was accidentally cleared during the deployment. Restore it from Cloudflare dashboard and redeploy.
- Rows appearing with corrupted Role column — indicates the operator pasted the wrong file. Roll back immediately per §4.

---

## 4. Previous-version restoration procedure (rollback)

1. Apps Script editor → **Deploy → Manage deployments**.
2. On the active Web App row, click **✏️ (edit)**.
3. Change **Version** back to the value you recorded in §1.
4. Click **Deploy**.
5. The `/exec` URL is unchanged; no frontend update needed.
6. Confirm with a synthetic submission per the same procedure in §3.

### Fallback — if the Apps Script Project history is missing the prior version

Paste the baseline file back into the editor manually:

```bash
# From a clean clone of main at baseline:
git fetch origin main
git show 66efe6a3466503747f7f3495ac6ffa6b661cf5ba:careers-apps-script.gs > /tmp/careers-apps-script_baseline.gs
```

Copy `/tmp/careers-apps-script_baseline.gs` into the editor; Save; Deploy → Manage deployments → ✏️ → New version → Deploy.

---

## 5. Form submission behaviour — Before vs After deployment matrix

Deployment order A (updated FE + baseline BE) and deployment order B (baseline FE + updated BE) are both covered by the automated `response-contract.spec.js` tests (41/41 PASS). Here is the compact operator-facing behaviour matrix:

| Scenario | Baseline BE (today) | This release (after redeploy) |
|---|---|---|
| Valid interest submission | Row + email ✓ | Row + email ✓ (identical) |
| Valid full application | Row + email + Drive file ✓ | Row + email + Drive file ✓ (identical) |
| Duplicate full app (same email + role) | `{ok:false, code:'duplicate', error:'…'}` → candidate sees duplicate panel | Same (unchanged) |
| Missing resume | `{ok:false, error:'Missing field: resumeData'}` → generic failure panel | Same (unchanged) |
| Oversized resume | `{ok:false, error:'Resume over 5 MB.'}` → generic failure panel | Same (unchanged) |
| Turnstile verify fails | `{ok:false, error:'Security verification failed: …'}` → generic failure | **New:** `{ok:false, code:'turnstile_failed', error:'…'}`. Baseline FE still shows generic failure because it only reads `out.ok`. Updated FE additionally could distinguish. |
| Unexpected backend exception | `{ok:false, error:'Server error: TypeError: …'}` (leaks internals) | `{ok:false, code:'server_error'}` (no leak). Operator finds detail in Apps Script Executions. |
| Devanagari / Arabic name in applicant Name field | Name corrupted to spaces, row recorded with wrong name | Name preserved intact |
| Applicant payload starting with `=`/`+`/`-`/`@` | Written to sheet as-is — may render as formula | Written with leading apostrophe — forces text interpretation |

---

## 6. M-04 validation result

**Status: NOT YET VALIDATED. Release candidate excludes M-04 behaviourally.**

- The `drive-sharing-validation.md` isolated-test procedure has not been executed by the client as of the preparation date of this doc.
- `release/project-1-apps-script` deliberately does **not** contain the `file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE)` call. The `createFile(blob)` region is immediately followed by a short comment explaining the deliberate exclusion.
- The operator cannot inadvertently deploy M-04 from this candidate.
- A future release that re-introduces M-04 must:
  1. Execute `drive-sharing-validation.md §2` in an isolated test Apps Script project.
  2. Fill in `drive-sharing-validation.md §4` "Record of outcome" block.
  3. Branch from `release/project-1-apps-script` (not from the audit branch) so the base already has H-01/M-01/M-05 but not M-04.
  4. Re-insert the `try { file.setSharing(...) }` block exactly where the exclusion comment currently sits.
  5. Open a new release candidate branch (e.g., `release/project-1-apps-script-m04`) and re-run the full test suite + preview validation.

---

## 7. Operator sign-off (fill in before deploying)

```
Deployment date:                   _________
Deployed by:                       _________
Version number recorded (pre):     _________
Version number created (post):     _________
Synthetic QA submission done:      ☐ interest  ☐ full application
QA rows cleaned up afterwards:     ☐
Admin email contains scan note:    ☐
Issues observed (or "none"):       _________
```
