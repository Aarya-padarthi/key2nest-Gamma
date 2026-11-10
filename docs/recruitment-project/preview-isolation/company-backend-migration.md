# Key2Nest — Company-owned backend migration (Project 1)

Keeps the reviewed Careers improvements but moves the backend `/exec` off the
personal-account Apps Script onto a new company-Workspace Apps Script. No
new audit cycle. No change to any page other than `/careers`.

## 1. What each party does

### Operator — Google (3 steps)

1. Create a new blank Google Sheet in the company Workspace Drive. Suggested title:
   `Key2Nest — Applications`. Copy its ID from the URL between `/d/` and `/edit`.
2. Open `docs/recruitment-project/preview-isolation/production-apps-script-READY-TO-PASTE.gs`,
   substitute `<COMPANY-PRODUCTION-SHEET-ID>` with the ID from step 1.
   script.google.com (signed in as `admin@key2nesthomeloans.com`) → New project →
   paste the whole file → Save.
3. Project Settings (gear) → Script Properties → add
   `TURNSTILE_SECRET_KEY = <production Cloudflare Turnstile SECRET>`.
   **Use the real production secret, never the public test secret.** Editor →
   function `setup` → Run → grant Sheets / Drive / Mail permissions. Deploy →
   New deployment → Web app → Execute as **Me**, Who has access **Anyone**.
   **Record both the Web App deployment ID and the Version number** (both are
   rollback references for the new backend). Reply in chat with the `/exec`
   URL.

### Session — repo (automatic on `/exec` receipt)

4. On `release/project-1-frontend` @ `de93d89`, create a new branch
   `release/project-1-frontend-companybackend` with a one-file endpoint swap:
   - `careers.js:20` `CAREERS_ENDPOINT = '<new /exec URL>'`
   - `careers.html:957` `CAREERS_ENDPOINT_FALLBACK = '<new /exec URL>'`
   - Nothing else changes. Turnstile site key stays the production value
     `0x4AAAAAADvDb65eLmlL1DhS`. No preview configs. No GA4 changes.
5. Preview-guard against the new branch → must PASS.
6. Push the branch. Operator approves then the session fast-forwards `main` to
   the new frontend SHA and Netlify auto-builds. Production push is behind an
   explicit `APPROVE_PROJECT_1_COMPANYBACKEND_RELEASE` reply, not this prep.

## 2. Backend template guards (preserved)

The ready-to-paste template refuses to run on any of these misconfigurations:

- `SHEET_ID` still equals the placeholder `<COMPANY-PRODUCTION-SHEET-ID>`.
- `SHEET_ID` equals the isolated preview test sheet
  (`1IXMHU8hKZaMgqyRR9TeX_jevb3PvuH8Kb3yFtnvar9g`).
- `SHEET_ID` equals the legacy personal-account sheet
  (`1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc`).
- `TURNSTILE_SECRET_KEY` Script Property equals Cloudflare's public test
  secret (`1x0000000000000000000000000000000AA`).

`assertNotTestResources()` runs at the top of `setup`, `doGet`, and `doPost`.
A violation surfaces as an explicit error, not as the generic
`{ok:false, code:'server_error'}` shape.

All the reviewed Project-1 hardening is preserved verbatim:

- H-01 safe error contract on the public endpoint.
- M-01 Unicode-aware sanitiser + apostrophe-prefix formula-injection defence.
- M-05 recipient-side scan reminder in notification emails.
- M-04 (`file.setSharing`) remains deliberately excluded per the approved
  release gate.
- Resume MIME + size checks, duplicate guard, duplicate `code:'duplicate'`
  response, Turnstile verify fails closed.

## 3. Compatibility / "existing historical applications remain accessible"

- The **legacy personal-account sheet** `1CsqHDqz…` and its Drive folder
  `Key2Nest – Resumes` remain untouched. Historical applicant records stay
  where they are; nothing is copied, moved, or re-written.
- The **legacy `/exec`** (`AKfycbzY…mg/exec`) remains deployed in the
  personal account and continues to answer requests. It is the rollback
  target for the frontend endpoint change (see §5), so the account that
  owns it should NOT retire it until the new deployment has been verified in
  production for at least one business day.
- The new `/exec` writes to the new company sheet and the new Drive folder
  only. Role selection, interest vs. full application routing, resume
  upload, Turnstile validation, and candidate acknowledgement are identical
  to the preview-tested behaviour (preview matrix 17/17 PASS, backend
  response-contract matrix 41/41 PASS, sanitise-cell matrix 37/37 PASS).

## 4. Deployment sequence (pending explicit approval)

Order: backend first, then frontend. The approved frontend improvements
(`de93d89`) continue to work against the old `/exec`, so if backend
deployment fails, we simply do not advance to the frontend push.

1. Operator runs §1 steps 1-3 → reply with `/exec` URL.
2. Session runs §1 steps 4-5 (patch frontend branch, run preview-guard, push).
3. Operator smokes the new `/exec`:
   `curl -sS '<new /exec>'` → expect `{"ok":true,"service":"key2nest-careers"}`.
4. Operator replies `APPROVE_PROJECT_1_COMPANYBACKEND_RELEASE` with the
   new deployment ID + Version number.
5. Session runs: `git fetch`, `git merge --ff-only <new frontend SHA>`,
   `git push origin main`. Netlify auto-builds.
6. Session polls Netlify MCP for the new production deploy. Operator smokes
   `https://www.key2nesthomeloans.com/careers.html` in incognito → one
   synthetic quick-interest submit → row in NEW company sheet, email to
   `admin@key2nesthomeloans.com`.

## 5. Rollback

### Frontend-only rollback (fastest; recovers from a bad frontend push)

- Netlify Deploys → `6aed0771bc2340cb535a91f6` → ⋯ → Publish deploy.
  Restores `main`'s then-live page in ≤ 1 min. Current production deploy
  before migration is preserved as this exact deploy ID.

### Endpoint rollback (new backend bad; old backend still good)

- On `main` after the migration frontend SHA lands, revert the one-line
  endpoint change:
  `git revert --no-edit <migration-frontend-sha> && git push origin main`.
  Netlify auto-builds; the frontend goes back to targeting the legacy
  `/exec` (`AKfycbzY…mg/exec`), which is still deployed in the personal
  account. **Do not retire that legacy deployment until this rollback
  window is closed.**

### Apps Script rollback (new backend bad, want prior company version)

- Company Apps Script → Deploy → Manage deployments → ✏️ → Version
  dropdown → previous version (if any) → Deploy. On a brand-new company
  project, there is no prior version, so use the endpoint rollback above.

### Preserving in-flight submissions

- Nothing in these rollbacks modifies or deletes any sheet row or Drive
  file. Submissions already written to the new company sheet / new Drive
  folder stay there even after rollback. No destructive git operations
  (no force-push, no reset). Backups preserved: `backup/project-1-prod-
  2026-11-09-66efe6a` and `backup/project-1-bundle-archive`.

## 6. What is NOT in this migration

- No changes to any page other than `/careers`.
- No changes to the production Turnstile *site key* (frontend still ships
  `0x4AAAAAADvDb65eLmlL1DhS`).
- No preview-only files. The preview-guard script (`tools/preview-guard.sh`)
  will be run against the new frontend branch before any push to `main`.
- No copying or modification of historical applicant records.
- No Project 2 or Project 3 work.
- No modification of the existing isolated preview Apps Script
  (`AKfycbwN…/exec`). That remains available for future test runs.
