# Key2Nest — Project 1 Preview Deployment Approval Packet

**Date:** 2026-11-09
**Status:** awaiting explicit authorization for (a) isolated Apps Script creation and (b) Netlify branch deploy. **No external action taken.**
**Production at this point:** `main` = `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` (unchanged). Netlify current deploy = `6aed0771bc2340cb535a91f6` (ready, context production).

---

## 1. Independent security-review verdict

Two fresh independent reviewers (no shared context with the author) were engaged in parallel.

| Reviewer | Scope | Verdict |
|---|---|---|
| Preview branch code review | 412 inserted lines across `careers.html`, `careers.js`, `preview-config.js`, `tests/preview-fail-closed.spec.js` | **PASS-WITH-NOTES** → remediated → **PASS** |
| Isolated Apps Script template | `isolated-apps-script-template.gs` and its call paths | **PASS-WITH-NOTES** → remediated → **PASS** |

### Remediations applied (preview branch, commit `6c833c8`)

- **MED-1 banner-never-renders.** `<script src="preview-config.js">` moved into `<head>` (previously at the bottom of `<body>`, which ran after the inline banner-display script). Verified by extended test `T12-preview-config-in-head` (preview-config.js at char 1028, real `<body>` at char 10270).
- **LOW-3 open-ended `/exec`.** Validator replaced with a full-shape regex `^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{40,}\/exec(\?[^\s]*)?$`. Hostile URL `…/exec/x?r=https://attacker/` now rejected (new test `T3d-exec-not-terminator-rejected`).
- **LOW-5 dead diagnostics.** Removed `window.__k2nPreviewConfigDiagnostics` (unused surface).
- **LOW-6 stale comment.** Rewrote the inline-handler doc block that still described the now-removed hard-coded production fallback.
- **INFO-8 crawler indexing.** Preview-branch `robots.txt` set to `Disallow: /` (production-branch robots.txt is unchanged).
- **Netlify-review finding.** Preview-branch `_redirects` rule: `/tests/*` → 404 so the fail-closed test fixture is not web-reachable at the branch-deploy URL.

### Remediations applied (Apps Script template, audit-branch update below)

- **AS-LOW-1 isolation-guard-inside-try/catch.** Moved `assertIsolated()` outside the try block in `doPost` so an isolation violation surfaces as a real failure (matching the behaviour of `doGet` / `setup`) instead of being swallowed as `{ok:false, code:'server_error'}`.
- **AS-LOW-2 MIME-type bypass.** Strict preview MIME policy — the resume's declared `Content-Type` must appear in `ALLOWED_MIME`. A hostile upload named `payload.pdf` with any MIME string can no longer stage bytes in the operator's Drive folder.
- Deferred (documented, not urgent, preview-folder is throwaway): AS-LOW-3 (rate limiting absent — Turnstile always-pass test key is the trade-off), AS-LOW-4 (no interest-form duplicate guard), AS-LOW-5 (`assertIsolated` is equality-only — covers the three documented production constants, no sibling-production identifiers exist to enumerate).

### Fail-closed matrix now passes 16/16

```
[PASS] T1-placeholder-null           [PASS] T9-careers-html-no-prod-url
[PASS] T2-production-id-blocked      [PASS] T10-careers-js-guard
[PASS] T3a-no-exec-rejected          [PASS] T11-careers-html-guard
[PASS] T3b-wrong-host-rejected       [PASS] T12-preview-config-in-head
[PASS] T3c-empty-rejected            [PASS] T13-ga4-loader-disabled
[PASS] T3d-exec-not-terminator-rejected
[PASS] T4-valid-published            [PASS] T7-isPreview-true
[PASS] T5-overwrite-throws           [PASS] T8-careers-js-no-prod-url
[PASS] T6-redefine-throws
```

---

## 2. Exact Preview branch SHA

**Branch:** `release/project-1-frontend-preview`
**HEAD after remediation:** `6c833c8d215c62f621cba538e85c5387fc675aa6`
**Parent (previous HEAD):** `36545108ad4f6af6889fc24b0601a9dec82ffac2`
**Base release-candidate:** `release/project-1-frontend` @ `de93d89f65647f5d72b70e02449e83e20b7c6e98`
**Base production:** `main` @ `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` (frozen; unchanged by this work)

```bash
git log --oneline release/project-1-frontend-preview -3
# 6c833c8 preview-isolation: address independent-review findings
# 3654510 preview-isolation: fail-closed endpoint config + banner + GA4 disabled
# de93d89 release-frontend: move release notes off web-reachable path
```

---

## 3. Explanation of the 412 (now 472 after remediation) insertions

Six touched files on the preview branch vs the approved frontend candidate (`de93d89`):

| File | Lines | Why necessary |
|---|---|---|
| `preview-config.js` (NEW) | ~100 | The only place the isolated `/exec` URL is declared. Publishes `window.__k2nCareersEndpoint` via `Object.defineProperty({writable:false, configurable:false})` so no later script can overwrite it. Validator checks placeholder, production-ID substring, and full URL shape; a null is published on any invalid configuration. Also publishes `__k2nIsPreview = true` for the banner. |
| `careers.html` (modified) | ~60 net | Four changes: (a) GA4 loader replaced with a no-op `gtag` stub to prevent synthetic events reaching the production GA4 property; (b) `preview-config.js` loaded SYNCHRONOUSLY in `<head>` so the published globals exist before `<body>` parsing; (c) sticky red PREVIEW banner at top of `<body>`, gated on `window.__k2nIsPreview === true`, with special text if the endpoint is null; (d) inline interest-form handler's `CAREERS_ENDPOINT_FALLBACK` production literal removed, replaced with a getter + hard guard that throws `endpoint-not-configured` when the global is null. |
| `careers.js` (modified) | ~24 net | Production URL literal removed; the `window.__k2nCareersEndpoint` assignment removed (the preview-config now owns publication). Submit path reads via `getCareersEndpoint()` and guards `if (!CAREERS_ENDPOINT) throw new Error('endpoint-not-configured');` before any `fetch`. |
| `tests/preview-fail-closed.spec.js` (NEW) | ~240 | 16-case Node-only harness that exercises every fail-closed path: placeholder, production-id substring, malformed shape, overwrite attempts, redefine attempts, both submit paths' guards, GA4 absent, preview-config in `<head>`. No npm dependencies. Not web-reachable (see below). |
| `robots.txt` (modified) | 10 | Preview-only `Disallow: /`. Prevents search engines from indexing the preview branch deploy URL. |
| `_redirects` (modified) | 6 | Adds a single preview-only rule: `/tests/* → 404`. Prevents the fail-closed spec from being served at `<preview-url>/tests/preview-fail-closed.spec.js`. |

### Why each line is necessary
Every line falls into one of five buckets:
1. **Immutability of the global** (`Object.defineProperty` + fallback-to-null on definition failure).
2. **Fail-closed guards** (null-check before fetch in both submit paths).
3. **Visible safety signalling** (banner, 404 on test fixture, no GA4).
4. **Production-routing prevention** (strict validator, blocklist, no literal production URLs anywhere).
5. **Automated proof** (16-case spec).

No "nice to have" code remains. The dead-code diagnostics surface flagged by the reviewer was removed.

### What is NOT in the diff
No copy changes. No feature changes. No change to third-party loaders (Turnstile, Tailwind, fonts) other than GA4 being replaced by a no-op stub.

---

## 4. Apps Script isolation assessment

**Template path:** `docs/recruitment-project/preview-isolation/isolated-apps-script-template.gs` on `audit/project-1-recruitment` (reference only — NOT deployed).

### Hard isolation guarantees proven by code review

- `assertIsolated()` runs unguarded at the top of every entry point: `doGet`, `doPost`, `handleInterest`, `setup`. It throws when:
  - `SHEET_ID === PRODUCTION_SHEET_ID` (`1CsqHDqz…`)
  - `NOTIFY_EMAIL === PRODUCTION_NOTIFY_EMAIL` (`admin@key2nesthomeloans.com`)
  - `FOLDER_NAME === PRODUCTION_FOLDER_NAME` (`Key2Nest – Resumes`)
  - Any placeholder (`<YOUR-TEST-EMAIL>`, `<YOUR-TEST-SHEET-ID>`) survives.
- No `ScriptApp.newTrigger`, no installable triggers, no time-driven functions. The only entry points are the web-app `doGet`/`doPost`. Clean teardown = delete the Apps Script project, the test Sheet, the test Drive folder, and the `TURNSTILE_SECRET_KEY` script property.
- Every outbound email: subject `[PREVIEW TEST] …`, body prefix `[PREVIEW TEST — this submission did NOT reach production]`. Operator can instantly tell an email that leaked past isolation from a production one.
- `doGet` returns `service: 'key2nest-careers-PREVIEW-TEST'` — distinguishable from production via one curl.
- No production Turnstile secret is ever pasted into the template; the documented value is Cloudflare's public always-pass test secret `1x0000000000000000000000000000000AA`.

### Compatibility with the Preview frontend

The frontend sends `POST` with `Content-Type: text/plain;charset=utf-8` and a JSON body. This qualifies as a CORS "simple request" so there is no OPTIONS preflight; Apps Script web apps answer same-origin and simple-cross-origin POSTs correctly with `Access-Control-Allow-Origin: *` after the standard 302 redirect to `script.googleusercontent.com`. `fetch` with default options (`redirect: 'follow'`, `credentials: 'same-origin'`) follows the redirect and reads the JSON body successfully. Field names consumed by the template (`role`, `name`, `email`, `phone`, `location`, `nmls`, `message`, `resumeName`, `resumeType`, `resumeData`, `turnstileToken`, `submissionType`, `source`) match the fields the preview frontend sends. **Compatibility confirmed.**

### Residual Apps Script notes (preview-only, acceptable)

- No application-level rate limiter (Turnstile is a pass-through test key by design). Abuse risk is bounded to the operator's own throwaway inbox / sheet / folder; Apps Script daily mail quota (100 for consumer accounts) is the backstop.
- No duplicate guard on `handleInterest`. Interest-form submission replays accumulate rows in the test sheet but never reach production.

---

## 5. Netlify single-branch deployment plan

**Site:** `0b000aea-f79e-4bc3-ab81-53e4f692b632` (`gilded-peony-fba821.netlify.app`, custom domain `www.key2nesthomeloans.com`).
**Current configuration (confirmed on 2026-11-09 via `netlify-open-deployments` MCP):** branch deploys DISABLED, deploy previews DISABLED. All five recent deploys are context `production`, branch `main`.

### Required single-branch configuration change

| Setting | Current value | Required value for preview | Who changes it |
|---|---|---|---|
| Site configuration → Build & deploy → Production branch | `main` | **`main` (unchanged)** | — |
| Site configuration → Build & deploy → Build command | (empty — static site) | **(empty, unchanged)** | — |
| Site configuration → Build & deploy → Publish directory | `/` (repo root) | **`/` (unchanged)** | — |
| Branches and deploy contexts → Branch deploys | None | **Add individual branches → `release/project-1-frontend-preview`** (that one branch only — NOT "Deploy all branches", NOT "Let Netlify add branches") | Operator (Netlify UI) |
| Branches and deploy contexts → Deploy previews | Off (or whatever is set) | **Unchanged** | — |
| Context env vars: `branch-deploy` | None | **Unchanged** (no env var is required; preview-config.js is self-contained) | — |
| Password protection (if plan supports it) | Off | **ON for the branch deploy** if available | Operator |

### Build & publish correctness

- No `netlify.toml` exists at any branch. Netlify therefore uses the UI-set build/publish values. The static-file set under the repo root (HTML, CSS, JS, assets/) is already the correct publish set — the flat layout works unchanged on the preview branch.
- `preview-config.js` and `tests/preview-fail-closed.spec.js` are at the repo root on the preview branch, so they would be web-reachable. Mitigations in place: the preview branch's `_redirects` 404s `/tests/*`; `preview-config.js` is loaded by the HTML, so it must remain reachable (no secrets in it — the one production-id string it carries is already public in production `careers.js`).
- Preview branch's `robots.txt` is `Disallow: /`, so even if the preview URL is public, search engines are instructed not to index it.

### Side effects of enabling the single branch deploy

- A new Netlify build runs when the branch is pushed. Netlify-only concern: build minutes consumed (low — no build step, so near-zero).
- The branch deploy gets a predictable URL `https://release-project-1-frontend-preview--gilded-peony-fba821.netlify.app/` (and an immutable deploy URL per commit).
- **Production domain (`www.key2nesthomeloans.com`) is NOT affected.** The branch deploy answers only on its branch-deploy URL — Netlify custom-domain routing is per-context and only the `production` context serves the custom domain.
- **Production deploy history is NOT touched.** The current production deploy `6aed0771bc2340cb535a91f6` remains the one served at the custom domain until the operator explicitly publishes a different one.

---

## 6. Exact changes requiring approval

All six items below are external actions. **None are being executed by this session.** The operator takes them.

| # | Action | Who | Reversible? | Risk if wrong |
|---|---|---|---|---|
| A | Create a brand-new Google Sheet for preview tests (title `Key2Nest — PREVIEW TEST — Applications`). | Operator in their own Google account. | Yes — delete the sheet. | None — doesn't touch production. |
| B | Create a brand-new standalone Apps Script project with the contents of `isolated-apps-script-template.gs`, after substituting `NOTIFY_EMAIL` and `SHEET_ID`. Add the Script Property `TURNSTILE_SECRET_KEY = 1x0000000000000000000000000000000AA`. Run `setup` to grant Sheets / Drive / Mail permissions on the test account only. Deploy as Web App (Execute as: Me, Who has access: Anyone). | Operator in their own Google account. | Yes — delete the Apps Script project. | Not production-touching; `assertIsolated()` guards against accidentally pointing at the production sheet. |
| C | Substitute the resulting `/exec` URL into `preview-config.js` on `release/project-1-frontend-preview`. Commit on that branch only. | Operator locally (or via a PR explicitly marked never-to-merge). | Yes — revert the commit. | Low — the code refuses any URL containing the production deployment ID. |
| D | (Optional, recommended) Swap the Turnstile site key on `release/project-1-frontend-preview` from the production site key `0x4AAAAAADvDb65eLmlL1DhS` to the public test site key `1x00000000000000000000AA` in `careers.html` and `careers.js`. Commit on preview branch. | Operator locally. | Yes — revert. | Without this, real Turnstile tokens are issued but the test backend's always-pass secret still accepts them. Not a leak, but asymmetric. |
| E | Netlify: add exactly one branch (`release/project-1-frontend-preview`) to the branch-deploy allowlist. Enable password protection on the branch deploy if the plan supports it. | Operator in Netlify UI. | Yes — remove the branch from the list. | Keeping the list narrow prevents future preview branches from auto-deploying. |
| F | Trigger the first branch-deploy build after step C/D have landed on origin. | Operator in Netlify UI (Deploys → Trigger deploy → branch: `release/project-1-frontend-preview`). | Yes — delete the deploy. | The site remains isolated regardless. |

**Not required, do not do:** any commit to `main`, any Apps Script change to the production project, any DNS change, any change to the production GA4 property, any merge of `release/project-1-frontend-preview` into any other branch.

---

## 7. Preview access restrictions & abuse controls

| Control | Mechanism | Strength |
|---|---|---|
| Not search-indexed | `robots.txt` with `Disallow: /` on the preview branch | Advisory — polite crawlers will respect it. |
| Not a published asset listing | `_redirects`: `/tests/*` → 404 on preview branch | Enforced by Netlify. |
| No GA4 contamination | Loader removed, `gtag` stubbed to no-op | Enforced by preview code; verified by test T13. |
| No production endpoint reachable from forms | Production URL literal absent, blocklist in `preview-config.js`, immutable global | Enforced; tests T1-T4, T8, T9. |
| Endpoint can't be redirected mid-page | `Object.defineProperty({writable:false, configurable:false})` | Enforced; tests T5, T6. |
| Visible PREVIEW banner | Sticky red banner driven by `__k2nIsPreview`, loaded in `<head>` | Operator sees it on first paint. |
| Submissions can't reach production sheet / drive / mailbox | Isolated Apps Script with `assertIsolated()` in every entry point | Enforced; failure surfaces as HTTP-level error after MED-1-adjacent fix. |
| Resume upload abuse | Strict preview MIME check (operator Drive only) | Enforced by template. |
| Flood/abuse at the preview URL | Netlify password-gate (if plan supports it), Turnstile always-pass test secret bypasses bot-gate by design | Partial — accepted trade-off because the test backend is throwaway. |

---

## 8. Cleanup & rollback procedures

### Cleanup after preview testing is complete

1. In Netlify: remove `release/project-1-frontend-preview` from "Add individual branches". Branch deploy stops within 60 seconds.
2. In Apps Script: open the test project → Deploy → Manage deployments → Archive the Web App deployment. (Optionally: delete the entire Apps Script project.)
3. In Google Drive: delete the test Sheet (`Key2Nest — PREVIEW TEST — Applications`). Delete the test Drive folder (`K2N-Preview-Test-Resumes`).
4. In the test mailbox: optionally delete the `[PREVIEW TEST]` notification emails.
5. In Git: the preview branch `release/project-1-frontend-preview` remains in origin for forensics and is never merged.

### Rollback if the preview causes an incident

- The preview deploy is served only on its branch-deploy URL. **Removing the branch from the Netlify allowlist (step 1 above) ends the exposure in under one minute.**
- If the branch was accidentally merged to `main`: use `rollback-runbook.md` §1 (Netlify "Publish deploy" → `6aed0771bc2340cb535a91f6`). Known-good production restores in ≤ 1 minute of operator action + ~30 s Netlify propagation.
- If the isolated Apps Script was mis-configured to point at the production sheet: the template's `assertIsolated()` would have prevented it from running; worst case is zero writes. No rollback needed on the Google-side.

---

## 9. Remaining blockers

### Hard blockers (must be resolved before green-light)

- **Operator inputs for steps A–C above have not been supplied** (test email mailbox, test sheet ID). The template refuses to run without them.
- **Explicit approval for steps A–F above has not been granted.** This packet exists to request that approval.

### Known, acknowledged, not-blocking

- **No CI-enforced merge guard against accidental merge of preview to main.** A GitHub Actions workflow that would enforce this must live on `main`; this session is forbidden to modify `main`. Mitigation in place: branch name, commit messages, this packet, the preview-readiness report, and the `preview-config.js` header all explicitly state "do not merge". The remediation for an accidental merge is documented in `rollback-runbook.md`. **Recommendation:** after preview sign-off, as a separate approved change on `main`, add `.github/workflows/no-preview-on-main.yml` that fails CI if `preview-config.js` or the preview `<script>` tag is present on `main`.
- **Preview password protection depends on Netlify plan.** If the plan does not support "Password protect this site" at branch-deploy context, the preview URL is public and link-sharing is the only restriction; the above abuse controls remain in place.
- **Preview Turnstile uses the production site key unless step D is executed.** Non-blocking (tokens issued against production site key will fail the preview's test secret and the submission just fails), but the operator should do it for a clean test matrix.

---

## 10. Reviewer evidence files

- Preview branch code review transcript: in session scratchpad task output (reviewer `a7e6bdbb323eb5e9d`).
- Apps Script template review transcript: in session scratchpad task output (reviewer `a45cd716e2ac7acbe`).
- Fail-closed spec and results: `tests/preview-fail-closed.spec.js` on `release/project-1-frontend-preview`; 16/16 PASS under Node.
- Isolated Apps Script template: `docs/recruitment-project/preview-isolation/isolated-apps-script-template.gs` on `audit/project-1-recruitment`.
- Preview readiness detail: `docs/recruitment-project/preview-isolation/preview-readiness-report.md`.

---

## Authorization prompt for the operator

To proceed, respond with one of:

- **"APPROVED A–F"** — perform all six external actions in order.
- **"APPROVED A–B only, report deploy URL before C–F"** — isolate the backend first, then come back for a frontend-and-Netlify decision.
- **"BLOCK — change <item>"** — specify what needs to change on the preview branch, in the Apps Script template, or in the Netlify plan before approval is given.

Until authorization is received, this session will stop. Production remains at `main = 66efe6a3466503747f7f3495ac6ffa6b661cf5ba`.
