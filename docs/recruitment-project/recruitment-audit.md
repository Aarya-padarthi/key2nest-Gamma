# Key2Nest — Project 1 Recruitment Infrastructure Audit

**Baseline inspected:** `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` (live production, 2026-11-09)
**Scope:** `careers.html`, `careers.js`, `careers-apps-script.gs`, `testimonials.js`, recruitment-scoped selectors in `styles.css`.
**Audit methodology:** full source review of each in-scope file, end-to-end trace of both submission flows, static checks on markup and JS, cross-file consistency checks.

---

## 1. Executive summary

The recruitment stack is **functionally sound**. Both forms work end-to-end today. End-to-end verification was performed against the live backend on 2026-11-05 (quick-interest submission landed a row in the Applications sheet with `Role = "Interest — Mortgage Loan Officer"` and an email to `admin@`).

Audit identified:

| Severity | Count | Theme |
|---|---|---|
| Critical | 0 | — |
| High | 3 | Backend error-message disclosure; role-taxonomy drift between interest and full-application funnels; quick-interest form has no Turnstile-load fallback |
| Medium | 6 | Resume path sanitisation, ASCII-only name sanitisation, unverified "AI assistant" marketing claim, endpoint duplication across files, no explicit security headers, unverified Drive folder visibility |
| Low | 7 | UX polish, rate-limit observation, small accessibility nits |

**No defect in the audit is blocking production use.** All findings are documented with evidence so the user can authorize scoped fixes in Phase 3 or mark them accepted.

---

## 2. Functional verification

### 2.1 Quick-interest form (`#careers-interest-form`)

| Check | Result | Evidence |
|---|---|---|
| Name field present, required | ✅ `careers.html:269-271` |
| Email field present, required, `type=email`, `autocomplete=email` | ✅ `careers.html:273-275` |
| Phone field present, optional, `type=tel` | ✅ `careers.html:279-281` |
| Role field present, optional (`select` with 5 options) | ✅ `careers.html:283-291` |
| Client-side: email regex `/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/` | ✅ `careers.html:962` |
| Client-side: name non-empty check | ✅ `careers.html:962` (combined guard) |
| Turnstile widget rendered in `#turnstile-careers-interest` | ✅ `careers.html:293`, 926-937 |
| Server-side: Turnstile verify (fail-closed) before any state change | ✅ `careers-apps-script.gs:83-84` |
| Server-side: required name + email, email regex re-check | ✅ `careers-apps-script.gs:182-187` |
| Submission handler | POST → careers Apps Script `/exec`, `submissionType=interest` | `careers.html:977-990` |
| Notification routing | `admin@key2nesthomeloans.com` with `Reply-To` applicant email | `careers-apps-script.gs:203-207` |
| Record | Appends to Applications sheet, Role prefixed `Interest — <role>` | `careers-apps-script.gs:196-201` |
| On-page success panel | `role="status"` + `aria-live="polite"` | `careers.html:296-298` |
| On-page failure panel | `role="alert"` with email + phone fallback | `careers.html:299-301` |
| Mobile responsiveness | Uses `careers-interest-row` 2-column grid that collapses to 1 column on narrow viewports | `styles.css` careers-top-cta-grid |
| Duplicate handling | **Deliberately none** (candidate can inquire about multiple roles); documented in `careers-apps-script.gs:94-99` | ✅ Intentional |
| Spam / abuse protection | Cloudflare Turnstile verification on both ends | ✅ |

**Verdict: operational.** No critical functional defects.

### 2.2 Full application (`#careers-form`)

| Check | Result | Evidence |
|---|---|---|
| Applicant information fields | Full Name, Email, Phone, City & State, NMLS ID, Message | `careers.html:731-779` |
| Role selection | Hidden `#c-role` populated by the clicked role card's `data-role-apply` attribute | `careers.js:51-71`, `careers.html:766` |
| NMLS field | Optional, free-text (allows "eligible" for new licensees) | `careers.html:758-760` |
| Resume upload (accepted types) | `accept=".pdf,.doc,.docx"` client hint; server re-validates by MIME + extension | `careers.html:771`, `careers-apps-script.gs:128-134` |
| File-size limit | Client: 5 MiB; server: 5 MiB on decoded bytes — rejected before Drive create | `careers.js:17`, `careers-apps-script.gs:42, 129` |
| Server-side validation (required set) | `role, name, email, phone, location, resumeName, resumeData` | `careers-apps-script.gs:110-115` |
| Server-side sanitisation | `safe()` function strips `[^\w .,'@()+-]` and trims to 200 chars | `careers-apps-script.gs:136` |
| Storage access controls | Script-owner Google Drive (private by default when created by Apps Script) | **Not independently verifiable this session — see M-04** |
| Private download authorization | Resume URL returned by `file.getUrl()` requires the recipient's Google account to have been granted access by the owner. Confirmed in script behaviour; sharing policy of the destination folder must be checked by the user. | **See M-04** |
| File-content validation | Server-side MIME + size + extension; no antivirus scan at upload (relies on Drive's download-side scan) | `careers-apps-script.gs:127-134`; see M-05 |
| Applicant data retention | No automated purge; retention governed by Workspace policy | Policy (not in code) |
| Duplicate detection | **Email + Role (case-insensitive)** — rejects before any Drive/sheet/email side effects | `careers-apps-script.gs:117-125, 226-241` |
| Acknowledgement + internal notification | On-page success panel; admin@ email with resume attachment; GA4 `submit_application` event | `careers.html:794-802`, `careers-apps-script.gs:150-167`, `careers.js:229` |

**Verdict: operational.** No critical functional defects.

### 2.3 Recruiter contact + CTA

| Check | Result | Evidence |
|---|---|---|
| Phone number visible on page | `+1 (972) 565-2199` appears 4 times (interest card, closing card, failure panels) | `careers.html:312, 826` |
| Email visible on page | `admin@key2nesthomeloans.com` appears 4 times (interest card, closing card, failure panels, EEO para) | `careers.html:316, 830, 805, 816` |
| Apply buttons on each role | `button.role-apply-btn` with `data-role-apply="<role name>"` | `careers.html:709` + 3 others |
| Apply panel relocates under clicked role | Single `#apply-panel` moved via `mount.appendChild(applyPanel)` | `careers.js:51-67` |
| Scheduling link functional | No calendar link today; "Not ready to apply? Let's chat." routes through the quick-interest form instead | `careers.html:263` — **by design** |
| Navigation intuitive | Role cards collapse/expand (`<details>`); close button returns the apply panel | `careers.html:724-728` |
| Equal-opportunity statement | Present with reasonable-accommodation contact | `careers.html:816` |
| Accessibility preserved | Labels / `aria-describedby` for errors / `role="alert"` on failure boxes / `role="status"` on success / focus management | `careers.html` multiple, `careers.js:180-181` |

**Verdict: operational.** Minor polish items under §4.

### 2.4 Company licensing representations (recruitment pages only)

| Surface | Representation | Consistency |
|---|---|---|
| Hero badge (careers.html:254) | `Licensed in AR, AZ, CO, CT, FL, GA, KS, NJ, OK, TN and TX` (11 states) | ✅ |
| Lede (careers.html:251) | "growing across **eleven states**" | ✅ matches badge count |
| Role card #2 (Senior) (careers.html:389) | `TX · FL · AR · AZ · TN · Remote · Full-Time` (5-state subset) | ⚠️ Partial list — read as example states where this specific role can be filled; not a licensing claim. Confirmed in copy by context. |
| Senior role hook (careers.html:391) | "Originate across all **eleven states**" | ✅ matches |
| JSON-LD JobPosting ×4 `applicantLocationRequirements` | Each lists 11 states (alphabetised) — verified during the 2026-11-05 release | ✅ per `fba5b84` and `66efe6a` commits |
| Closing contact card | `NMLS Company ID #2819804 · Equal Housing Lender` with link to Consumer Access | ✅ matches licensing-disclaimer page |

**Verdict: consistent.** No action needed within Project 1 scope. (Changes to licensing claims are explicitly out of scope under Rule #11 unless an approved authoritative list is supplied.)

### 2.5 Recruitment technology claims

| Claim (file:line) | Verbatim | Substantiated? |
|---|---|---|
| `careers.html:333` | *"K2N Originator's Desk — Manage client relationships, create branded marketing, and get mortgage-focused guidance from your AI assistant — all in one place."* | **Not verifiable from this session.** No corresponding product page, help article, or launch screen is present in the repo. Flagged as **M-03** below. |
| `careers.html:330` | *"Marketing & technology — Support that helps you build your pipeline, not fight your tools."* | Unfalsifiable framing (ok as is) |
| `careers.html:329` | *"Fast underwriting — Strong lender relationships that keep files moving."* | Supported by downstream "20+ lender relationships" claim; no measurable SLA in the public claim. Within reasonable marketing bounds. |
| `careers.html:328` | *"Competitive compensation — A structure built to reward production."* | Unfalsifiable framing (ok). |
| `careers.html:344` | *"A founder-led team with access to 20+ lenders and one shared standard…"* | "Founder-led" matches founder-CEO data in `/team`. "20+ lenders" is used repeatedly on the main site; audit treats as substantiated. |

### 2.6 Security review

Findings tabled in Section 3.

---

## 3. Findings (ranked)

Every finding carries: description · evidence (file:line) · root cause · business impact · security/compliance implications · proposed correction · affected files · estimated effort · verification method.

### H-01 — Backend `doPost` returns raw server exception text to the client *(HIGH)*

- **Description.** The `doPost` catch-all serializes the caught exception's `message` into the JSON response body: `json({ ok: false, error: 'Server error: ' + err.message });`.
- **Evidence.** `careers-apps-script.gs:170-172`.
- **Root cause.** Lack of error-boundary layer separating internal diagnostics from applicant-visible messaging.
- **Business impact.** On any unanticipated failure (Drive quota, Mail quota, Sheet lock contention, a bug), applicants see internal implementation details in the on-page failure panel. The panel already has a generic fallback with the phone/email contact — leaking the raw error line is unnecessary.
- **Security/compliance implications.** Low-to-moderate. Information disclosure (Drive folder names, Apps Script frame names, quota keys, internal IDs) in rare error paths. Not PII, but it narrows attacker reconnaissance and violates principle of least disclosure.
- **Proposed correction.** Return a stable generic error code and log the detailed message via `console.error` only. Example:
  ```js
  } catch (err) {
    console.error('doPost failure', err && err.stack || err);
    return json({ ok: false, code: 'server_error' });
  }
  ```
  Client treats `code: 'server_error'` identically to any current `out.ok !== true` outcome — already handled.
- **Affected files.** `careers-apps-script.gs`. **Requires Apps Script redeploy** (out-of-code-rollback window — see recovery-manifest C.2).
- **Estimated effort.** 15 min code + user-executed redeploy (3 min).
- **Verification.** Submit a payload that triggers a known server condition (e.g. intentionally oversized synthetic PDF) and confirm the response is `{ok:false, code:'server_error'}`.

### H-02 — Quick-interest form role dropdown values don't match the full-application role names *(HIGH)*

- **Description.** The `#qi-role` `<select>` uses abbreviated labels that do **not** match the exact role titles used elsewhere on the page (and therefore in the Applications sheet).
- **Evidence.**
  - Quick-interest options (`careers.html:286-289`): `Senior Mortgage Loan Originator`, `MLO — Purchase Specialist`, `MLO — Self-Generated Business`, `Entry-Level MLO`.
  - Role card `data-role-apply` values used by the full application (`careers.html` role cards): `Mortgage Loan Originator (Retail)`, `Senior Mortgage Loan Originator`, `Mortgage Loan Originator — Purchase Specialist`, `Mortgage Loan Originator — Self-Generated Business`, `Entry-Level Mortgage Loan Originator`.
- **Root cause.** Two separate authors created the two lists at different times; no shared constant.
- **Business impact.** When the recruiting team filters the Applications sheet by role, interest rows and application rows for the same underlying role sort into **different buckets**. Inflates duplicate-tracking effort and makes conversion attribution (interest → application) impossible to compute reliably.
- **Security/compliance implications.** None.
- **Proposed correction.** Normalise the quick-interest `<option value>`s to match the four role-card titles exactly. The "Retail" role is currently missing from the quick-interest form entirely — add it.
- **Affected files.** `careers.html` (interest form `<select>` only).
- **Estimated effort.** 5 min.
- **Verification.** Submit a synthetic quick-interest row for each role; filter the sheet by Role → each `Interest — <role>` row's suffix now matches a role-card `data-role-apply`.

### H-03 — Quick-interest form has no fallback when Turnstile fails to load *(HIGH)*

- **Description.** The inline quick-interest handler polls for `window.turnstile` for 10 s. If it never appears (CDN outage, ad-blocker suppressing the api.js), `tsToken` stays empty and the form's submit guard (`if (!tsToken) { failureEl.hidden = false; return; }`) silently rejects every submission with only the generic failure panel showing.
- **Evidence.** `careers.html:939-944` (polling), 966-969 (guard). The full-application form in `careers.js:137-139` by contrast respects `window.__k2nTs.failed` and allows submission to proceed without a token when the loader marks itself failed — the shared loader is in `main.js:663-728`.
- **Root cause.** The inline handler was written to be self-contained and does not consult `window.__k2nTs.failed`.
- **Business impact.** Candidates on networks that block Cloudflare Turnstile (corporate firewalls, aggressive privacy extensions) can never submit the quick-interest form. The failure box tells them to call or email — acceptable fallback, but they are entirely locked out of the on-page lead capture.
- **Security/compliance implications.** The fix must not silently remove bot protection. If Turnstile is disabled client-side, the server must still refuse the submission (fail-closed). Currently the backend only runs the Turnstile check against an empty string and returns `Missing security verification token.` — so this is safe: honoring the loader's `failed` flag opens no bypass. The server is still the gate.
- **Proposed correction.** Mirror the pattern already used in `careers.js:137-139` and `main.js:721-725`: if `window.__k2nTs?.failed`, skip the client-side token check but keep the server submit (which will still fail-closed cleanly). Surface a more specific failure message ("Security check could not load — please try again or contact admin@…").
- **Affected files.** `careers.html` (inline script only).
- **Estimated effort.** 15 min.
- **Verification.** With browser DevTools, block the `challenges.cloudflare.com` origin; reload /careers; confirm the submit attempt now reaches the backend and returns the `Missing security verification token` error, which the client surfaces to the user.

### M-01 — `safe()` sanitiser silently corrupts non-ASCII applicant names *(MEDIUM)*

- **Description.** The `safe()` function keeps `[\w .,'@()+-]` (word chars = `[A-Za-z0-9_]`), replacing everything else with a space. Non-ASCII letters (accented characters, non-Latin scripts) are therefore replaced with spaces.
- **Evidence.** `careers-apps-script.gs:136, 192`.
- **Impact.** Applicants named `José López`, `André`, `Søren`, `李雷`, etc. have their names corrupted before being written to the sheet and the notification email. First-row applicants may not even recognise their own name in the recruiter's inbox.
- **Security/compliance implications.** Minor equal-opportunity concern: the corruption is visible, not substantive discrimination, but recruiters typing the corrupted name back to the applicant creates a bad first impression.
- **Proposed correction.** Use a Unicode-aware whitelist that preserves letters in any script while still refusing control characters and sheet-injection prefixes: `/[^\p{L}\p{N} .,'’@()+\-]/gu`. Still trim to 200 chars.
- **Affected files.** `careers-apps-script.gs`. **Requires Apps Script redeploy.**
- **Estimated effort.** 15 min.
- **Verification.** Submit a synthetic application with name `André O'Málley-李雷`; confirm the sheet row preserves the name intact.

### M-02 — Endpoint URL duplicated between `careers.js` and the inline handler in `careers.html` *(MEDIUM)*

- **Description.** `CAREERS_ENDPOINT` is declared twice with the same literal string: `careers.js:14` and `careers.html:920`. A mistaken partial edit will produce an undetected inconsistency.
- **Evidence.** Both locations as above; the inline comment (`careers.html:917-919`) acknowledges the duplication.
- **Impact.** Operational: a future endpoint rotation requires two edits in two files. Historical: already caused one bug in this session that was caught mid-flight.
- **Proposed correction.** Attach the endpoint to `window.__k2nCareersEndpoint` from one of the two files at load time; have the other read it. Non-breaking.
- **Affected files.** `careers.html` + `careers.js`. **Both in scope.**
- **Estimated effort.** 20 min.
- **Verification.** DevTools console: `window.__k2nCareersEndpoint` resolves to the live `/exec` URL; both forms continue to submit successfully with synthetic payloads.

### M-03 — Unverified "K2N Originator's Desk" / AI assistant claim *(MEDIUM)*

- **Description.** The `Why join` perk at `careers.html:333` promises candidates an AI assistant that manages CRM, builds branded marketing, and provides mortgage-focused guidance "all in one place." No corresponding product is linked, screenshot-ed, or otherwise documented on-site.
- **Evidence.** `careers.html:333`.
- **Impact.** Candidates who sign up expecting a working tool and find nothing may feel misled; competitive candidates may screenshot this language in negotiations if the tool turns out to be aspirational.
- **Security/compliance implications.** Advertising-truth: not technically regulated the way lending disclosures are, but still a reputational risk in a small-team recruiting context.
- **Proposed correction.** Two paths — either (a) link the perk to a landing page / short description elsewhere on the site demonstrating the tool, or (b) soften the language to describe what currently exists (e.g. "In-house CRM and a shared marketing library"). **Requires client decision — not a unilateral fix.**
- **Affected files.** `careers.html`.
- **Estimated effort.** 5 min once the client decision is made.
- **Verification.** Reviewer confirms the language matches what Key2Nest actually provides.

### M-04 — Drive folder visibility of "Key2Nest – Resumes" is unverified from code review *(MEDIUM)*

- **Description.** Resumes are written to a Drive folder created on first setup by `getResumeFolder()`. Folders created by Apps Script inherit the owning account's default visibility — typically private, but this is not enforced by the script itself. There is no code that sets the folder or file to `PRIVATE`, nor any guard against the folder being accidentally shared later.
- **Evidence.** `careers-apps-script.gs:70-73`, 141-142.
- **Impact.** If the owning account is later changed, or an admin mistakenly link-shares the folder, applicant resumes may become readable by anyone with the URL. Downstream resume URLs are included in both the notification email body and the Applications sheet.
- **Security/compliance implications.** Direct PII exposure risk if visibility is ever mis-configured.
- **Proposed correction.** Two complementary steps.
  1. **Code (in scope):** on file creation, call `file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE)` to explicitly pin visibility.
  2. **Operational (out of scope — recommend to user):** audit folder sharing settings; ensure it is restricted to the named recruiting team members only.
- **Affected files.** `careers-apps-script.gs`. **Requires Apps Script redeploy.**
- **Estimated effort.** 15 min code + user-executed redeploy + user-executed folder audit.
- **Verification.** Submit a synthetic application; open the returned Drive URL in a logged-out browser — expect "You need permission" page.

### M-05 — No upload-time malware scanning on resumes *(MEDIUM)*

- **Description.** The Apps Script validates size and type but does not scan the uploaded bytes for malware signatures. Google Drive performs a download-time scan on files below a certain threshold, but a resume that triggers at download time is already stored and linked from the sheet and the notification email.
- **Evidence.** `careers-apps-script.gs:127-142` (no scan call), Google Drive virus-scanning behaviour (Workspace docs).
- **Impact.** A hostile applicant could upload a malicious document. Impact is bounded by (a) the recipients being a small internal team who already review resumes carefully, (b) Google Drive flagging the download for recipients.
- **Security/compliance implications.** Moderate for a recruiting flow accepting anonymous uploads.
- **Proposed correction.** Short term — add explicit copy on the admin email noting "Drive will scan on download; verify before opening"; long term — route uploads through a pre-check (e.g. drop into a scanning Drive account that quarantines unknown MIME). The code-level fix is **not low-risk** and would materially change the pipeline. Recommend tracking as a Phase 2 risk-accepted item for Project 1 scope.
- **Affected files.** Email body copy in `careers-apps-script.gs` is low-risk; pipeline changes are out of scope.
- **Estimated effort.** 10 min for the email note; days for pipeline-level change (deferred).
- **Verification.** Admin email includes the scan reminder line.

### M-06 — No explicit security-headers file on the static site *(MEDIUM)*

- **Description.** No `_headers` file in the repo. Netlify's default headers are used. There is no HSTS directive, no `Referrer-Policy`, no `Permissions-Policy`, no `Content-Security-Policy`.
- **Evidence.** Repo root listing — only `_redirects` present, no `_headers`.
- **Impact.** General hardening gap. For a page accepting PII through a submitted form, a baseline set of headers (HSTS min-age 1 year, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and a narrow CSP that whitelists only the CDNs the site uses) is standard practice.
- **Security/compliance implications.** Not a direct vulnerability, but a defense-in-depth gap.
- **Proposed correction.** Add `_headers` with site-wide directives. **This affects every page of the site**, not just /careers — therefore out of strict Project 1 scope. Recommend elevating as a cross-site hardening task.
- **Affected files.** `_headers` (new) — **out of Project 1 scope**; filed for separate authorization.
- **Estimated effort.** 30 min including testing and verifying no header breaks existing pages.
- **Verification.** `curl -I https://www.key2nesthomeloans.com/careers.html` shows the new headers.

### L-01 — Interest-form phone field has no client- or server-side normalization *(LOW)*

- **Description.** Phone is optional. When submitted, it's forwarded as the raw user typed it. The full application normalises phone client-side via `isValidPhone`, but the interest form does not.
- **Evidence.** `careers.html:280` (input), 960-964 (handler ignores phone shape), `careers-apps-script.gs:197` (phone written to sheet as-is after `safe()`).
- **Impact.** Minor data-quality issue (inconsistent phone formats in the Applications sheet).
- **Proposed correction.** Reuse the `isValidPhone` check from `careers.js:22-25`, but keep it non-blocking since the field is optional. Just normalise digits-only before send.
- **Affected files.** `careers.html` inline script.
- **Estimated effort.** 5 min.

### L-02 — Interest-form single generic failure box can't distinguish validation from transport failures *(LOW)*

- **Description.** Both "missing name/email", "no Turnstile token", and "fetch rejected" render the same `.careers-interest-failure` panel.
- **Evidence.** `careers.html:962-998`.
- **Impact.** Users submitting an invalid email (e.g. "me@") see the same generic message as users during a Google Apps Script outage.
- **Proposed correction.** Keep the box but set its message dynamically by failure cause. Minimal effort.
- **Affected files.** `careers.html` inline script.
- **Estimated effort.** 20 min.

### L-03 — No explicit on-submit scroll/focus on interest form failure *(LOW)*

- **Description.** On a validation error, `failureEl.hidden = false` is called but no `scrollIntoView` / `focus()` call fires. On narrow viewports the error can scroll off-screen under the submit button.
- **Evidence.** `careers.html:964` vs the success path `994-995`.
- **Proposed correction.** Add `failureEl.scrollIntoView({behavior:'smooth', block:'nearest'})` on failure, mirroring the success path.
- **Affected files.** `careers.html` inline script.
- **Estimated effort.** 3 min.

### L-04 — `setup()` not protected against accidental re-run clearing data-validation rules *(LOW)*

- **Description.** `setup()` reapplies data-validation rules to the Status column via `getRange(2, statusCol, sheet.getMaxRows() - 1, 1)`. If run twice, this overwrites any per-row annotations a human has added to Status. The function is intended to run once.
- **Evidence.** `careers-apps-script.gs:56-68`.
- **Impact.** Operational caution only. Not reachable by the public web endpoint.
- **Proposed correction.** Add an early return if the sheet already exists and has rules applied. Low-value fix — deferring.

### L-05 — Resume filename passes through the applicant's original extension when MIME is unset *(LOW)*

- **Description.** If `data.resumeType` is missing from the payload (unusual for a modern browser), the extension picked for the saved filename is `nameExt` — the first `.…` suffix of the applicant-supplied filename. The outer guard on 132-134 does reject completely unknown types, so the extension used is always one of `.pdf/.doc/.docx`.
- **Evidence.** `careers-apps-script.gs:131-139`.
- **Analysis.** **Not a vulnerability in practice** — the MIME check on 130 + the extension check on 132 together ensure the ext applied is from the trusted allowlist. Documented here only because the dual-source extension construction is worth a comment.
- **Proposed correction.** Add a comment above line 138 noting that `(ext || nameExt)` is safe because the preceding guard rejects when both are invalid.

### L-06 — No rate limit on the Apps Script endpoint *(LOW)*

- **Description.** Turnstile tokens are single-use, so a typical attacker cannot replay a token. There is still no per-IP or per-session rate limit above Turnstile.
- **Evidence.** No limiter in `careers-apps-script.gs`.
- **Analysis.** Apps Script-level rate limiting is awkward (no durable IP available from `e`), and Turnstile is adequate for the anticipated threat level. Documented for transparency.

### L-07 — EEO statement reasonable-accommodation routing *(LOW)*

- **Description.** EEO statement routes requests for reasonable accommodation to the generic `admin@` + recruiting phone. This is acceptable for a small team but a dedicated accommodations contact is best practice.
- **Evidence.** `careers.html:816`.
- **Proposed correction.** No change required unless the client wants a dedicated contact; noting here for completeness.

---

## 4. Findings categorised by Phase 3 priority

### Priority 1 — Candidate submission reliability

| ID | Action |
|---|---|
| H-02 | Normalise quick-interest role options to match full-application role titles |
| H-03 | Interest-form Turnstile-load fallback (align with `careers.js` pattern) |
| L-01 | Interest-form phone normalization |
| L-02 | Distinguish failure types in the interest-form error box |
| L-03 | ScrollIntoView on interest-form failure |

### Priority 2 — Applicant data security

| ID | Action |
|---|---|
| H-01 | Backend: suppress raw exception message in client response (requires Apps Script redeploy) |
| M-01 | Backend: Unicode-aware name sanitiser (requires Apps Script redeploy) |
| M-04 | Backend: explicitly set Drive file sharing to PRIVATE (requires Apps Script redeploy) |
| M-05 | Add scan reminder to admin email body (requires Apps Script redeploy) |

### Priority 3 — User experience

Addressed by Priority 1 UX items (L-02, L-03) and visual verification during Phase 5 Preview.

### Priority 4 — Administration docs

Produce a one-page `docs/recruitment-project/recruitment-admin.md` describing:

- Candidate submission destinations (sheet id, drive folder, admin@ inbox)
- Ownership + escalation (admin@ → RJ / Sai Vivek)
- Daily/weekly triage expectations (recommended, not binding)
- Failure modes and the correct response (Apps Script redeploy procedure)
- Where to find this manifest

### Out of Project 1 scope (filed for separate authorization)

| ID | Action | Why out of scope |
|---|---|---|
| M-03 | Change "K2N Originator's Desk" marketing copy or build the product | Content decision + marketing posture — requires client decision |
| M-06 | Add site-wide `_headers` file | Affects every page, not just /careers |
| M-05 (pipeline hardening) | Virus-scan resumes before Drive write | Materially changes backend pipeline |

---

## 5. Audit limitations

Documented honestly:

1. **No live production fetch** — this session cannot resolve `www.key2nesthomeloans.com`. Code review is baseline-exact; live-rendering comparison depends on user-side screenshots.
2. **Apps Script console inaccessible** — deployment versions, Script Properties, and execution logs are visible only to the user in the Google account that owns the script.
3. **Drive folder sharing settings unverifiable** — the M-04 finding is based on code behavior; actual folder ACLs must be checked by the user.
4. **No automated SAST / dependency scan** — the site has no `package.json`, so a conventional npm-audit style pass does not apply. CDN dependencies (Tailwind, GSAP, Turnstile) are pinned to specific major versions (`gsap@3.12.5`) or always-latest (`cdn.tailwindcss.com`); the Tailwind CDN is noted but not changeable within scope.
5. **Email delivery not tested in this session** — relies on user-side synthetic submission verification already done on 2026-11-05.

---

## 6. Proposed Phase 3 change list (for pre-implementation review)

Per the user's "Before implementation, provide the exact proposed file-change list" instruction, the complete list of files proposed to change in Phase 3 is:

| File | Change | Finding(s) addressed | Scope confirmation |
|---|---|---|---|
| `careers.html` | Inline interest-form `<select>` option values rewritten to match full-application role titles (+ add Retail option) | H-02 | In scope: Project 1 only |
| `careers.html` | Inline interest-form handler: Turnstile-load failure fallback mirroring `careers.js:137-139` | H-03 | In scope |
| `careers.html` | Inline interest-form handler: phone normalisation to digits-only before send | L-01 | In scope |
| `careers.html` | Inline interest-form handler: differentiate failure messages (validation vs transport) | L-02 | In scope |
| `careers.html` | Inline interest-form handler: scroll failure box into view | L-03 | In scope |
| `careers.html` + `careers.js` | Hoist `CAREERS_ENDPOINT` to `window.__k2nCareersEndpoint` set from `careers.js`; read from inline handler | M-02 | In scope |
| `careers-apps-script.gs` | `doPost` catch returns `{ok:false, code:'server_error'}` instead of raw `err.message` | H-01 | In scope (Apps Script) |
| `careers-apps-script.gs` | `safe()` → Unicode-aware whitelist | M-01 | In scope (Apps Script) |
| `careers-apps-script.gs` | `getResumeFolder()`/upload step: explicit `setSharing(PRIVATE, NONE)` on created file | M-04 | In scope (Apps Script) |
| `careers-apps-script.gs` | Admin email body: append "Drive will scan on download — confirm before opening" | M-05 (operational) | In scope (Apps Script) |
| `docs/recruitment-project/recruitment-admin.md` | NEW — admin documentation | Priority 4 | In scope (docs-only) |
| `docs/recruitment-project/<other deliverables>` | Phase 5 / 6 / 7 reports as the audit workflow proceeds | — | In scope |

**No change proposed to:** `index.html`, `main.js`, `apps-script.gs`, `team.html`, `styleguide.html`, legal pages, `_redirects`, `sitemap.xml`, `robots.txt`, `cards/*`, `assets/*`, or any part of `styles.css` that is not demonstrably recruitment-scoped. **No change proposed to `_headers` within Project 1** — M-06 is filed as a separate authorization request.

**Apps Script deployments** (needed for H-01, M-01, M-04, M-05) are **client-executed**: the file changes land in the repo, and the user pastes the updated script into the Apps Script editor and clicks `Deploy → New version`. The `/exec` URL does not change.

**Awaiting explicit authorization to proceed to Phase 3.** No code outside `docs/recruitment-project/` has been modified at this point.
