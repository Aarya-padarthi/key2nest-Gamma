# Key2Nest — Project 1 Isolated Preview Readiness Report

**Scope:** local preparation only, per the authorization "KEY2NEST — PROJECT 1 ISOLATED PREVIEW PREPARATION" (2026-11-09).
**Not executed:** any external deployment or configuration change (Netlify branch-deploys, Apps Script deploys, triggered Preview builds, merges to main).
**Production at summary time:** unchanged. `main` HEAD = `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`. Netlify current deploy = `6aed0771bc2340cb535a91f6`, context `production`, state `ready`.

---

## 1. Deliverable (1 of 6) — Preview-only branch, exact SHA, exact diff

**Branch:** `release/project-1-frontend-preview` (new, local only until pushed).
**Base:** `release/project-1-frontend` @ `de93d89f65647f5d72b70e02449e83e20b7c6e98` (the frontend release candidate approved under Phase C).
**Preview HEAD:** `36545108ad4f6af6889fc24b0601a9dec82ffac2`.
**Single commit:** `preview-isolation: fail-closed endpoint config + banner + GA4 disabled`.
**NEVER merged to `main`:** this branch is a terminal preview-only artifact. No PR for it will be opened.

### Diff summary

```
careers.html                      |  60 ++++++++--
careers.js                        |  24 ++--
preview-config.js                 | 120 ++++++++++++++++++++
tests/preview-fail-closed.spec.js | 230 ++++++++++++++++++++++++++++++++++++++
4 files changed, 412 insertions(+), 22 deletions(-)
```

### Surgical change list

- **`preview-config.js` (NEW, 120 lines, root)** — loaded synchronously as the FIRST script in `careers.html`. Publishes `window.__k2nCareersEndpoint` via `Object.defineProperty({writable:false, configurable:false})`. Explicitly null when:
  - the placeholder sentinel `'PLACEHOLDER-ISOLATED-TEST-ENDPOINT-HERE'` is left in place,
  - the configured string contains the production deployment id `AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg` anywhere,
  - the configured string is not a string, is shorter than 40 chars, does not start with `https://script.google.com/macros/s/`, or does not contain `/exec`.
  Also publishes `window.__k2nIsPreview = true` (immutable) and a non-enumerable `window.__k2nPreviewConfigDiagnostics` for QA harnesses.

- **`careers.js`** — removed production endpoint literal and its unconditional `window` assignment. Replaced with `const getCareersEndpoint = () => window.__k2nCareersEndpoint || null;` and added a null-guard `const CAREERS_ENDPOINT = getCareersEndpoint(); if (!CAREERS_ENDPOINT) throw new Error('endpoint-not-configured');` immediately before the `fetch(CAREERS_ENDPOINT, …)` call.

- **`careers.html`** — three edits:
  1. GA4 loader (`googletagmanager.com/gtag/js?id=G-TLH3F0F15H`) replaced with a stub that sets `window.gtag` to a no-op. Synthetic test events cannot reach the production GA4 property.
  2. `<script src="preview-config.js"></script>` added as the FIRST (non-deferred, synchronous) script tag, placed above `main.js`, `careers.js`, and `testimonials.js`. preview-config.js therefore runs and publishes the immutable global before any script that reads it.
  3. Sticky red `#k2n-preview-banner` added at the top of `<body>`, gated on `window.__k2nIsPreview === true`. Banner text changes to call out a missing endpoint if `window.__k2nCareersEndpoint == null`.
  4. In the inline quick-interest handler: `CAREERS_ENDPOINT_FALLBACK` production literal removed. `careersEndpoint()` returns null on bad config; the submit path now does `const endpoint = careersEndpoint(); if (!endpoint) throw new Error('endpoint-not-configured');` before `fetch(endpoint, …)`.

- **`tests/preview-fail-closed.spec.js` (NEW, 230 lines)** — 15-case Node-only VM harness (no dependencies). Currently passes **15/15** on the preview branch.

### Non-diff properties observed
- `careers.js` on the preview branch contains **zero** occurrences of the production deployment ID string (verified by `grep`).
- `careers.html` on the preview branch contains **zero** occurrences of the production deployment ID string (verified by `grep`).
- `preview-config.js` contains the string exactly once, inside the blocklist constant (see T2 below).
- Static scope boundary: `styles.css`, `main.js`, `testimonials.js`, `index.html`, every other file byte-for-byte identical to `release/project-1-frontend` — no unauthorised files changed.

### Exact patch available at:
- Repo path: `git diff release/project-1-frontend..release/project-1-frontend-preview`
- Local scratchpad: `/tmp/preview-diff.patch` (505 lines)

---

## 2. Deliverable (2 of 6) — Test environment configuration & required permissions

The isolated Apps Script template lives at `docs/recruitment-project/preview-isolation/isolated-apps-script-template.gs` (reference only — not deployed). It is a copy of `release/project-1-apps-script` @ `91fb1eddeb05ffd94c3d82eae17a780b925f5a0d` with four isolation changes and an `assertIsolated()` guard that aborts execution if any production identifier is left in place.

### Required operator inputs to deploy the isolated test backend

| Placeholder in template | What to substitute | Why |
|---|---|---|
| `NOTIFY_EMAIL = '<YOUR-TEST-EMAIL>'` | A mailbox YOU control, NOT `admin@key2nesthomeloans.com`. Suggested: `aarya.2.padarthi+k2n-preview@gmail.com` | Every preview submission emails this address; must not reach the recruiter inbox. |
| `SHEET_ID = '<YOUR-TEST-SHEET-ID>'` | The ID of a NEW Google Sheet (create via https://sheets.new, title `"Key2Nest — PREVIEW TEST — Applications"`) | Rows written here are explicitly test-only. Must NOT be `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` (production). |
| `FOLDER_NAME = 'K2N-Preview-Test-Resumes'` | Already set — leave as-is. | Different string from production `'Key2Nest – Resumes'`, so Drive folder name resolution cannot accidentally collide. |
| Script Property `TURNSTILE_SECRET_KEY` | `1x0000000000000000000000000000000AA` (Cloudflare's PUBLIC always-pass test secret) | Pairs with the public test site key `1x00000000000000000000AA`. No production Turnstile secret must ever be pasted here. |

### Required Google permissions on the test account (one-time grant)

When the operator runs `setup()` in the Apps Script editor:
- Sheets (read/write) — on the new test sheet only.
- Drive (file create) — on the test account's Drive; the new folder `K2N-Preview-Test-Resumes` is created inside the account's My Drive.
- Mail (send-as) — the test account sends to `NOTIFY_EMAIL`. This is per-user; no domain-wide delegation.

### Hard isolation guards built into the template
- `assertIsolated()` runs at the top of `doGet`, `doPost`, and `setup`. It throws if `SHEET_ID === PRODUCTION_SHEET_ID`, if `NOTIFY_EMAIL === PRODUCTION_NOTIFY_EMAIL`, if `FOLDER_NAME === PRODUCTION_FOLDER_NAME`, or if a placeholder was left in. The deployment refuses to serve rather than silently cross-wiring.
- Subject-line and email-body prefix: `[PREVIEW TEST]` on every outbound mail, so an email that somehow does reach a recruiter is unambiguously flagged.
- `doGet` returns `service: 'key2nest-careers-PREVIEW-TEST'` instead of `'key2nest-careers'`, giving a trivial `curl` smoke test.

---

## 3. Deliverable (3 of 6) — Evidence that both forms fail closed without the isolated endpoint

### Automated matrix (`tests/preview-fail-closed.spec.js`) — 15/15 PASS

```
[PASS] T1-placeholder-null — endpoint with placeholder = null
[PASS] T2-production-id-blocked — production-id endpoint → null
[PASS] T3a-no-exec-rejected — no /exec → null
[PASS] T3b-wrong-host-rejected — wrong host → null
[PASS] T3c-empty-rejected — empty → null
[PASS] T4-valid-published — valid published = "https://script.google.com/macros/s/AKfycbzPREVIEWTESTISOLATEDFAKE…/exec"
[PASS] T5-overwrite-throws — TypeError thrown=true, endpoint still isolated=true
[PASS] T6-redefine-throws — TypeError thrown=true, endpoint still isolated
[PASS] T7-isPreview-true — __k2nIsPreview = true
[PASS] T8-careers-js-no-prod-url — no production deployment id in careers.js
[PASS] T9-careers-html-no-prod-url — no production deployment id in careers.html
[PASS] T10-careers-js-guard — getCareersEndpoint() + throw endpoint-not-configured guard present
[PASS] T11-careers-html-guard — inline interest-form fail-closed guard present
[PASS] T12-preview-config-first — preview-config.js @ 62036 < main.js @ 62080
[PASS] T13-ga4-loader-disabled — no GA4 loader + no GA4 property id in preview careers.html

----- fail-closed matrix: 15/15 PASS -----
```

### What each case proves

- **T1–T3c** — four invalid-endpoint shapes (placeholder, prod-id substring, wrong host, missing `/exec`, empty) all cause `window.__k2nCareersEndpoint` to be published as **null**. The submit paths then throw `endpoint-not-configured` before any `fetch()` call is reached.
- **T4** — a valid-shape isolated URL is published verbatim (round-trip proves no accidental mutation).
- **T5, T6** — late-arriving script attempting to overwrite or redefine the global throws `TypeError`. The isolated endpoint remains in place. This defeats the supply-chain attack where an async third-party widget could repoint the endpoint.
- **T7** — the preview-mode flag is actually set, so the banner renders.
- **T8, T9** — no production URL appears anywhere in the two frontend files on the preview branch. Removing the literal is what makes the fail-closed semantics possible.
- **T10, T11** — the hard guard `if (!CAREERS_ENDPOINT) throw new Error('endpoint-not-configured');` is present in both the careers.js full-apply path AND the inline quick-interest path.
- **T12** — preview-config.js is loaded SYNCHRONOUSLY and BEFORE main.js / careers.js, so the immutable global is set before any consumer can read it.
- **T13** — the GA4 loader is removed and the property id does not appear anywhere.

### Human-check runbook

```bash
git checkout release/project-1-frontend-preview
python3 -m http.server 5175
# Visit http://localhost:5175/careers.html
# Expect: sticky red banner "PREVIEW — endpoint NOT CONFIGURED · both careers forms will refuse to submit"
# Submit the quick-interest form with Name/Email — expect the standard failure panel "Couldn't send that right now."
# (No request to any /exec URL; DevTools Network tab is empty of script.google.com traffic.)
```

After substituting a real isolated `/exec` into preview-config.js, the banner text drops the "endpoint NOT CONFIGURED" clause and submits begin to flow — to the test backend only.

---

## 4. Deliverable (4 of 6) — Verification of no production routing or side effects

### Grep evidence

```
$ git ls-tree -r release/project-1-frontend-preview --name-only \
  | xargs grep -l 'AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg' 2>/dev/null
preview-config.js      ← only in the BLOCKLIST, used to REJECT this id
```

Every other file on the preview branch — including `careers.html`, `careers.js`, every other HTML page — contains zero references to the production deployment ID.

### Production-side effect inventory (confirmed not routable on preview)

| Production effect | Routed to from preview? | Why not |
|---|---|---|
| Appended row in production Applications sheet `1CsqHDqz…` | **NO** | `preview-config.js` publishes a null or test endpoint; the production `/exec` URL does not appear anywhere in the preview branch. Also, the isolated template rejects `SHEET_ID === production` via `assertIsolated()`. |
| Resume uploaded to production Drive folder `Key2Nest – Resumes` | **NO** | Same — no code path on preview targets the production `/exec`. The isolated template uses `FOLDER_NAME = 'K2N-Preview-Test-Resumes'`. |
| Email to `admin@key2nesthomeloans.com` | **NO** | Same — isolated template's `NOTIFY_EMAIL` is a placeholder that `assertIsolated()` requires the operator to substitute before deploying. |
| GA4 `generate_lead` event into property `G-TLH3F0F15H` | **NO** | Loader removed from preview `careers.html`; `window.gtag` is a no-op stub. |
| Cloudflare Turnstile request against the production secret `TURNSTILE_SECRET_KEY` | **NO** | Production secret lives only in the production Apps Script project. The isolated template uses the public always-pass test secret. |
| Netlify production deploy or build | **NO** | No Netlify configuration has been touched. Branch deploys remain disabled on the Netlify site (confirmed via `netlify-open-deployments` on 2026-11-09). |

### Preview isolation contract (summarised)

- Preview has **no** production endpoint string anywhere.
- Preview has **no** writable path from `window` back to a production URL.
- Preview's GA4 is stubbed.
- The isolated backend refuses to run against production identifiers.
- No external action from this session has reached any production system.

---

## 5. Deliverable (5 of 6) — Exact minimal external actions to go live (NOT YET AUTHORIZED)

Each of the following is a step the operator (not this session) takes, in order, to enable live preview smoke testing. None are being executed here.

### 5.1 Deploy the isolated Apps Script
1. Open `docs/recruitment-project/preview-isolation/isolated-apps-script-template.gs` on `audit/project-1-recruitment`.
2. Create a new Google Sheet (https://sheets.new); title it `Key2Nest — PREVIEW TEST — Applications`. Copy the sheet ID.
3. In the template file substitute:
   - `NOTIFY_EMAIL = '<YOUR-TEST-EMAIL>'` → your test mailbox.
   - `SHEET_ID = '<YOUR-TEST-SHEET-ID>'` → the new test sheet ID.
   - Leave `FOLDER_NAME = 'K2N-Preview-Test-Resumes'` unchanged.
4. Create a new standalone Apps Script project at script.google.com (NOT bound to the production sheet). Paste the modified template as Code.gs. Save.
5. Project Settings (gear) → Script Properties → Add property:
   - Name: `TURNSTILE_SECRET_KEY`
   - Value: `1x0000000000000000000000000000000AA`
6. Run the `setup` function manually (Editor → `setup` → Run). Grant Sheets / Drive / Mail permissions on your test account.
7. Deploy → New deployment → type "Web app":
   - Execute as: Me
   - Who has access: Anyone
   Copy the `/exec` URL.

### 5.2 Patch the preview branch with the real isolated URL
```bash
git checkout release/project-1-frontend-preview
sed -i "s|PLACEHOLDER-ISOLATED-TEST-ENDPOINT-HERE|<the /exec URL from step 5.1.7>|" preview-config.js
git commit -am "preview-isolation: substitute isolated /exec URL (local only — do not merge)"
# DO NOT push this commit to origin if the URL carries any sensitivity;
# alternatively, push and keep the branch private.
```

### 5.3 Rotate the frontend Turnstile site key on the preview branch
On the preview branch only, change `TURNSTILE_SITE_KEY` in `careers.html` **and** `careers.js` from the production site key `0x4AAAAAADvDb65eLmlL1DhS` to the public test site key `1x00000000000000000000AA`. Commit on the preview branch. (Not part of this prep step — a separate preview-only commit.)

### 5.4 Enable NARROW branch deploys in Netlify
In the Netlify dashboard for site `0b000aea-f79e-4bc3-ab81-53e4f692b632`:
- Site configuration → Build & deploy → Branches and deploy contexts.
- Production branch: `main` — **do not change**.
- Deploy previews: whatever is currently selected — **do not change**.
- Branch deploys: select **Add individual branches**. Enter exactly one branch name:
  `release/project-1-frontend-preview`.
- **DO NOT** select "All", "Deploy all branches", or "Let me add individual branches" with any other branch listed.
- Save.

### 5.5 Optional — password-protect the preview URL
If the Netlify plan supports "Password protect this site" at the branch-deploy context level, enable it on the branch-deploy for this preview. If not, the preview URL is public; the GA4 is stubbed and the backend is isolated, so the only remaining exposure is that a link-holder can fill a preview form, which routes to the operator's test mailbox and test sheet — still fully isolated.

### 5.6 Trigger the first Netlify build
- Push `release/project-1-frontend-preview` to origin (if not already pushed).
- Netlify: Deploys → Trigger deploy → Deploy site (branch: `release/project-1-frontend-preview`).

### 5.7 Smoke-check from a logged-out browser
- Visit the branch-deploy URL.
- Confirm the red PREVIEW banner at the top of `/careers.html`.
- Submit the quick-interest form (synthetic payload: name `PREVIEW-QA-01`, email `<your-test-mailbox>+qa01@example.com`).
- Confirm the row appears in the TEST sheet, NOT the production sheet.
- Confirm the email appears in the TEST mailbox, NOT `admin@key2nesthomeloans.com`.
- Repeat with the full application form + a small test PDF.

Any smoke-test failure means the operator must stop and re-check isolation before continuing — never fall back to the production backend.

### 5.8 Roll back the preview (when done)
- In Netlify: Site configuration → Branches and deploy contexts → Remove `release/project-1-frontend-preview` from the branch deploys list.
- In Apps Script: optionally Deploy → Manage deployments → archive the Web App deployment.
- Delete the test sheet and the `K2N-Preview-Test-Resumes` Drive folder, or archive them.
- The preview branch remains in git for forensics; it is never merged.

---

## 6. Deliverable (6 of 6) — Remaining risks & rollback

### Residual risks under the preview-live posture (after step 5.6)

| # | Risk | Severity | Mitigation already in place |
|---|---|---|---|
| R1 | Operator leaves the production Turnstile site key on the preview (step 5.3 skipped). | Medium | Turnstile widget would still render; a real visitor's Turnstile token issued against the production site key would be rejected by the isolated backend (which uses the TEST secret), so no submission completes. The failure is visible, not silent. |
| R2 | Operator pastes the production `/exec` URL into `preview-config.js` by mistake. | Low | `preview-config.js` blocklists the production deployment ID substring; the global is published as null and both forms fail closed. |
| R3 | Operator adds additional branches to Netlify "Add individual branches" (step 5.4). | Medium — scope creep | Written warning in step 5.4; `preview-isolation-report.md` already documents the constraint. |
| R4 | A link-holder submits a synthetic form while the isolated backend is live. | Low (test inboxes only) | The submission lands in the operator's test sheet / test mailbox — annoying but not production. |
| R5 | An async third-party widget tries to overwrite `window.__k2nCareersEndpoint`. | Negligible | `Object.defineProperty({writable:false, configurable:false})` makes the overwrite throw `TypeError`. T5+T6 cover this. |
| R6 | Production GA4 contamination. | Negligible | GA4 loader is removed from the preview; `gtag` is a no-op. T13 covers this. |
| R7 | Preview branch is accidentally merged to `main`. | High if it happens | The branch name `release/project-1-frontend-preview` reads as a merge-candidate. Mitigation: NEVER open a PR for it. The commit message explicitly says "Preview-only branch — never merge to main." Rollback (6.1) covers accidental merge. |

### 6.1 Rollback — accidental merge of preview to main

If the preview commit `36545108ad4f6af6889fc24b0601a9dec82ffac2` (or its square) ever lands on `main`:

1. Treat it as a production incident under `rollback-runbook.md`.
2. Fastest path: Netlify "Publish deploy" → `6aed0771bc2340cb535a91f6` (the known-good production deploy).
3. Audit path: `git revert` the merge commit on `main`, push.
4. Backup path: reset `main` to `backup/project-1-prod-2026-11-09-66efe6a` (approval-required, destructive).

### 6.2 Rollback — isolated Apps Script misconfiguration

- The isolated Apps Script lives entirely in the operator's own Google account. Rollback = archive or delete that project (no effect on production, since the production Apps Script project is a different one in a different Drive).
- If any test submissions accidentally reached the production sheet (impossible given the current design, but if the isolation guards were bypassed): delete those rows manually and note the forensic trail in `rollback-runbook.md`.

### 6.3 Rollback — Netlify branch-deploy

- Remove `release/project-1-frontend-preview` from the Netlify "Add individual branches" list.
- The branch-deploy URL stops responding within one minute.
- Production `main` build and current deploy are unaffected (Netlify's branch-deploy is a separate build context).

---

## 7. Summary of what this preparation step did and did not do

### Did (local only)
- Created `release/project-1-frontend-preview` @ `36545108ad4f6af6889fc24b0601a9dec82ffac2` (not pushed yet; see §8).
- Added `preview-config.js` with immutable, fail-closed, production-blocklisted endpoint publication.
- Removed production URL literal from `careers.js` and `careers.html` on the preview branch.
- Added sticky red PREVIEW banner and disabled GA4 on the preview branch.
- Added `tests/preview-fail-closed.spec.js` — 15/15 PASS locally.
- Added `docs/recruitment-project/preview-isolation/isolated-apps-script-template.gs` on the audit branch (reference only — not a deployable artifact).
- Wrote this readiness report.

### Did not (external — explicitly out of scope)
- No new Apps Script project was created.
- No Apps Script was deployed.
- No Netlify configuration was changed.
- No Netlify Preview was triggered.
- No branch was merged to `main`.
- No production applicant record was modified.
- No production email was sent.
- Production remains at `main = 66efe6a3466503747f7f3495ac6ffa6b661cf5ba`, Netlify deploy `6aed0771bc2340cb535a91f6`.

---

## 8. Branches pushed / to be pushed

| Branch | Local HEAD | Pushed? | Purpose |
|---|---|---|---|
| `main` | `66efe6a` | yes (unchanged) | Frozen production |
| `release/project-1-frontend` | `de93d89` | yes | Approved frontend candidate |
| `release/project-1-apps-script` | `91fb1ed` | yes | Approved backend candidate |
| `audit/project-1-recruitment` | will be bumped by this commit | yes | Documentation + template |
| `release/project-1-frontend-preview` | `3654510` | **NOT YET** | Preview-only branch; will be pushed once this report is committed on audit |
| `backup/project-1-prod-2026-11-09-66efe6a` | `66efe6a` | yes | Durable baseline backup |
| `backup/project-1-bundle-archive` | `b87232f` | yes | Offline recovery bundle |
