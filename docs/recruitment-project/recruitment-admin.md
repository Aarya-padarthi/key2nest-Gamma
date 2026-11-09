# Key2Nest — Recruitment Administration

**Owner:** Sai Vivek Boddu (President & CEO)
**Operational contact:** `admin@key2nesthomeloans.com`
**Phone:** +1 (972) 565-2199

This doc is the operational handbook for the recruitment flow. If you are a new team member picking up recruiting responsibilities, read this first.

---

## 1. Where candidate data lands

| Submission type | Destination | Notification |
|---|---|---|
| Quick-interest form (`#careers-interest-form`) | Google Sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` — tab **Applications** — Role prefixed `Interest — <role>` | Email to `admin@key2nesthomeloans.com`, Reply-To the applicant's email |
| Full application (`#careers-form`) | Same sheet, Role = exact role name | Email to `admin@key2nesthomeloans.com`, Reply-To the applicant's email, resume attached, Drive URL in the body |

Resumes also land in the Drive folder **"Key2Nest – Resumes"** (owned by the Apps Script account).

---

## 2. Ownership and escalation

| Responsibility | Primary | Backup | Notes |
|---|---|---|---|
| Daily triage of new rows | Recruiting owner | Sai Vivek | Target: same business day for interest rows, within 24 h for application rows |
| Duplicate review (same email + role) | Recruiting owner | — | The backend already blocks duplicate full applications, but duplicate interest rows can accumulate; use the `Status` column (New / Reviewed / Interview / Offer / Hired / Declined) to track |
| Apps Script deployment, Script Property changes | Script project owner (currently Sai Vivek's Google account) | RJ | Changes require a New version via Deploy → Manage deployments |
| Netlify rollback / redeploy | Site admin | — | See `rollback-runbook.md` |
| Recovery execution | Site admin + script owner | — | See `rollback-runbook.md` + §5 below |

### When to escalate

| Signal | Response |
|---|---|
| Both forms returning the failure banner on synthetic tests | Check Apps Script dashboard "Executions" → look for recent failures. If the script is red, consider rolling back to a prior deployment (see `rollback-runbook.md` §5). |
| Admin email stops arriving but Sheet rows still appear | Workspace Mail quota exhausted (`MailApp` limit) OR mailbox routing changed. Check Workspace Admin → Email logs. |
| Drive upload failing but Sheet shows rows | Drive quota or sharing posture changed. Check Drive "Storage" view. |
| Netlify site returning 404 or unstyled | Netlify build broken or branch misconfigured. Revert the most recent deploy. |

---

## 3. Role taxonomy — current and legacy

The quick-interest form's role dropdown and the full-application role cards now use identical role names. This matters for anyone filtering the Applications sheet by Role column.

### Current role names (both forms, from 2026-11-09 onward)

| Value stored in `Role` column |
|---|
| `Mortgage Loan Originator (Retail)` |
| `Senior Mortgage Loan Originator` |
| `Mortgage Loan Originator — Purchase Specialist` |
| `Mortgage Loan Originator — Self-Generated Business` |
| `Entry-Level Mortgage Loan Originator` |
| For interest rows: prefixed with `Interest — ` (e.g. `Interest — Senior Mortgage Loan Originator`) |

### Legacy interest-row values (before 2026-11-09)

Interest rows written before this release use the earlier abbreviated labels. When filtering or reporting, treat the following as equivalent:

| Legacy (pre-2026-11-09, interest rows only) | Current (both forms, 2026-11-09+) |
|---|---|
| `Interest — Senior Mortgage Loan Originator` | (same — unchanged across the migration) |
| `Interest — MLO — Purchase Specialist` | `Interest — Mortgage Loan Originator — Purchase Specialist` |
| `Interest — MLO — Self-Generated Business` | `Interest — Mortgage Loan Originator — Self-Generated Business` |
| `Interest — Entry-Level MLO` | `Interest — Entry-Level Mortgage Loan Originator` |
| (no legacy Retail interest option existed) | `Interest — Mortgage Loan Originator (Retail)` |

Legacy sheet rows are not altered. When counting applicants or conversions for a role, include both legacy and current values.

---

## 4. Apps Script deployment procedure

Any code change to `careers-apps-script.gs` must be deployed before it is live. The web app `/exec` URL stays the same across deployments; only "New version" bumps are needed.

### Deploying an updated script

1. Open the careers sheet: `https://docs.google.com/spreadsheets/d/1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc/edit`
2. **Extensions → Apps Script.**
3. Paste the full contents of `careers-apps-script.gs` from the audit branch (or main, once released) into the editor, replacing the current file.
4. **Save** (⌘S / Ctrl+S).
5. **Deploy → Manage deployments.**
6. On the existing Web App row, click the **✏️ (edit)** icon.
7. **Version: New version.** Type an optional description (e.g. "Project 1 Phase 3 — safer error handling, Unicode sanitiser, M-05 note").
8. Click **Deploy**.
9. Confirm the Web app URL at the bottom still ends with `AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg/exec`. If it has changed (should not), update `CAREERS_ENDPOINT` in `careers.js` and bump the cache-rev on `careers.html`.

### Rolling back a bad script deployment

1. Open the Apps Script editor as above.
2. **Deploy → Manage deployments → ✏️ (edit).**
3. Change **Version** to the prior version that was known good (versions are listed chronologically).
4. **Deploy.** The `/exec` URL stays the same; no site change is needed.
5. Confirm with a synthetic submission and verify a row + email appears.

### Script Property management (`TURNSTILE_SECRET_KEY`)

- **Required** — if missing, every submission is rejected with `Server misconfigured`.
- Rotate via the **Cloudflare dashboard** first (generate a new secret). Update **both** the contact Apps Script and the careers Apps Script in the same window to avoid outage.
- Never commit the secret to the repo; never share it by email.

---

## 5. Failure modes and expected behavior

| Symptom | Likely cause | Expected behavior |
|---|---|---|
| Submission returns the on-page failure banner | Any backend exception, or client-side validation failure | Candidate directed to admin@ + phone. No data loss on backend-exception path — the error is logged in Apps Script "Executions" but no partial row/file is created (Turnstile and required-field checks run before any state change). |
| Quick-interest form shows "security check couldn't load" panel | Cloudflare Turnstile blocked by browser extension, corporate network, or temporary CDN outage | Candidate directed to admin@ + phone. No bypass of server-side protection. |
| Duplicate full application for same email + role | Candidate already applied for the role | On-page duplicate panel renders; no Drive file, no second email, no second sheet row. |
| Resume rejected (size / type) | File exceeds 5 MB or is not PDF/DOC/DOCX | On-page error, no backend state change. |
| Admin email in spam | Workspace routing | Add filter in `admin@` inbox: `subject:"New Key2Nest Application"` or `"New Career Inquiry"` → Never send to Spam. |

---

## 6. Where to find everything

| Item | Location |
|---|---|
| This document | `docs/recruitment-project/recruitment-admin.md` |
| Audit report | `docs/recruitment-project/recruitment-audit.md` |
| Environment inventory | `docs/recruitment-project/environment-inventory.md` |
| Recovery manifest (backup refs, bundle checksums) | `docs/recruitment-project/recovery-manifest.md` |
| Rollback runbook | `docs/recruitment-project/rollback-runbook.md` |
| Drive sharing validation procedure (M-04 pre-deploy test) | `docs/recruitment-project/drive-sharing-validation.md` |
| Recovery bundle archive | `docs/recruitment-project/backups/key2nest-prod-2026-11-09-66efe6a.bundle` + `.sha256` |
| Backup branch on GitHub | `origin/backup/project-1-prod-2026-11-09-66efe6a` → `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` |
| Production branch | `origin/main` |
| Dev/staging branch | `origin/claude/key2nest-review-d0ywn8` |
| Project 1 audit branch (contains these docs + Phase 3 code) | `origin/audit/project-1-recruitment` |
