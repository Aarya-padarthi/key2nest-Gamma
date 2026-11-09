# Key2Nest — Frontend Acceptance (Phase C)

**Release candidate under test:** `release/project-1-frontend` at commit `de93d89f65647f5d72b70e02449e83e20b7c6e98`.
**Testing mode:** **static code-level only.** Browser-side dynamic validation is **BLOCKED** because no Preview exists for this candidate (see `netlify-verification.md §4` and `preview-isolation-report.md`).

Every row records: expected behaviour · actual observed behaviour · **Pass / Fail / Blocked / Not Tested** · evidence · severity of any issue.

---

## 1. Visual and layout (dynamic — would need live browser render)

| # | Scenario | Expected | Actual | Result | Evidence | Severity |
|---|---|---|---|---|---|---|
| V1 | Careers page desktop rendering | Life at Key2Nest section renders with stats row + team strip + testimonials grid | — | **Blocked** | No Preview to render | n/a |
| V2 | Mobile responsive layout (≤ 640 px) | Quick-interest form collapses to single column; stats row stacks; drawer becomes bottom sheet | — | **Blocked** | No Preview | n/a |
| V3 | Layout consistency across themes | Dark/light theme both render correctly with brass-tinted Turnstile-unavailable panel | — | **Blocked** | No Preview | n/a |
| V4 | Navigation + header behaviour | Site nav, team dropdown, contact CTA unchanged | — | **Blocked** | No Preview. Phase 3 did not touch header or nav markup/CSS. | n/a |
| V5 | Recruiter contact visibility | Phone `+1 (972) 565-2199` and `admin@key2nesthomeloans.com` visible at top of /careers and in closing contact card | **PASS (static)** | Markup diff vs baseline shows both values present at `careers.html:310-317` (top card) and `careers.html:823-830` (closing card), unchanged by Phase 3. | **PASS** | grep | Low |
| V6 | Application CTA behaviour | `data-role-apply` buttons relocate `#apply-panel` under the clicked role card | Unchanged by Phase 3 | **PASS (static)** | `careers.js:69-71` unchanged (no diff from baseline). | **PASS** | diff | Low |
| V7 | Job role labels + dropdown options | Interest form role `<option>` values exactly match the role-card `data-role-apply` values | **PASS** — all 5 role options match, 3 legacy values removed from dropdown | `tests/role-compat.spec.js` → 15/15 PASS | **PASS** | Automated spec |
| V8 | Visual regressions on unrelated components | Testimonials section (homepage), social footer, team strip — unchanged | **PASS (static)** | `git diff 66efe6a...de93d89 -- index.html testimonials.js main.js` is empty. | **PASS** | diff | n/a |
| V9 | Accessibility | ARIA roles, labels, `aria-describedby`, focus management, keyboard-only reachability | — on dynamic; **PASS** on code review | New `role="alert"` on `.careers-interest-ts-unavailable` panel; `aria-live="polite"` retained on success panel; new `<button>` retains keyboard semantics; no new elements with only mouse affordances. | **PASS (static)** | Code review | Low |

**Visual/layout summary:** 5 Blocked (require Preview), 4 Pass (static code-level evidence is sufficient — no functional change where Blocked would be meaningful).

---

## 2. Client-side form validation + behaviour

| # | Scenario | Expected | Actual | Result | Evidence | Severity |
|---|---|---|---|---|---|---|
| F1 | Required-field validation on `<form id="careers-interest-form">` | Submit with `name=""` → failure banner text set to "Please enter your name before sending." | **PASS** | Handler path confirmed in `careers.html` inline script; logic trace: if `!name` → `showFailure('Please enter your name before sending.')` → `failureEl.scrollIntoView(...)` | **PASS** | Static trace of the Phase 3 handler |
| F2 | Email validation | Submit with `email=" foo"` → "Please enter a valid email address so we can reach you." | **PASS** | Trace of `!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)` branch | **PASS** | Static trace |
| F3 | Phone normalisation (L-01) | Payload sent with digits-only (no parens/dashes) | **PASS** | `normalisedPhone(raw)` strips `\D`, output digits-only | **PASS** | Static trace |
| F4 | Role selection compatibility (H-02) | Interest-form `<option value>` matches full-application `data-role-apply` | **PASS** | `tests/role-compat.spec.js` 15/15 | **PASS** | Automated |
| F5 | Error-message presentation (L-02) | Three distinct failure texts (validation / Turnstile-missing / transport) | **PASS** | `showFailure(reason)` swaps the `.careers-interest-failure-text` span text per cause | **PASS** | Static trace |
| F6 | Failure-state scrolling (L-03) | On failure, `.careers-interest-failure` or `.careers-interest-ts-unavailable` panel scrolls into view | **PASS** | `showFailure()` and `showTurnstileFallback()` both call `scrollIntoView({behavior:'smooth', block:'nearest'})` | **PASS** | Static trace |
| F7 | Turnstile unavailable / failure handling (H-03) | Shows dedicated `.careers-interest-ts-unavailable` panel. **No server submit without a valid token.** | **PASS** | Independent QA Phase-3 review: "No code path bypasses or weakens the gate." Submit branch always requires `tsToken` or `tsAvailable` before fetch is issued. | **PASS** | Independent QA transcript + static trace |
| F8 | JavaScript runtime errors (code level) | No uninitialised variables, no syntax errors | **PASS** | `node --check` OK on all 3 surfaces | **PASS** | Syntax check |
| F9 | Endpoint configuration (M-02) | `careers.js` publishes `window.__k2nCareersEndpoint`; inline handler reads it; literal fallback remains | **PASS** | `careers.js:24` and `careers.html:957-958` trace | **PASS** | Static trace |
| F10 | Candidate acknowledgement behaviour | On `{ok:true}` → `.careers-interest-success` shown, `form.reset()`, `gtag('generate_lead', …)` | **PASS** | Static trace of the `try` block success branch | **PASS (static)** | Static trace |
| F11 | Full application handler path | Unchanged by Phase 3 except `careers.js:24` endpoint hoist | **PASS** | `git diff 66efe6a...de93d89 -- careers.js` shows only the `window.__k2nCareersEndpoint = …` line added | **PASS** | diff |

**Form behaviour summary:** 11 Pass (static trace + automated). No Blocked items — the code-level evidence is authoritative for these behaviours. The browser-render shape of success/failure panels is covered under V1–V4 (Blocked on Preview).

---

## 3. Security (client-side)

| # | Scenario | Expected | Actual | Result | Evidence | Severity |
|---|---|---|---|---|---|---|
| S1 | No secrets exposed in client code | Only Turnstile *site key* (public by design) appears | **PASS** | `grep -E "secret|token|password|api_key" careers.html careers.js styles.css` on the release candidate returns zero hits beyond `TURNSTILE_SITE_KEY` + `turnstileToken` field-name uses | **PASS** | grep |
| S2 | No CAPTCHA bypass | `tsToken` + `tsAvailable` always required before `fetch()` | **PASS** | Independent QA Phase-3: "No client-side bypass exists." | **PASS** | QA transcript |
| S3 | No unintended production API submissions | The Preview would submit to production `/exec` (see `preview-isolation-report.md`). **No preview submissions have occurred.** | N/A — nothing tested dynamically | **Not Tested** (safe: no actual traffic) | Isolation report | — |
| S4 | No candidate data exposure | No localStorage/indexeddb writes of applicant payload; no cookie writes | **PASS** | Review of inline handler shows `fetch` only; no persistence | **PASS** | Static trace |
| S5 | No unexpected third-party requests introduced | `fetch` targets only Apps Script `/exec`; Turnstile + GA4 + Google Fonts loaded via shared `main.js` / HTML head, unchanged by Phase 3 | **PASS** | diff shows no new `<script src>`, no new `fetch` destination | **PASS** | diff |

---

## 4. Comparison against the frozen production baseline

```
git diff --name-only 66efe6a3466503747f7f3495ac6ffa6b661cf5ba origin/release/project-1-frontend --
careers.html
careers.js
styles.css
```

Three files touched. All within the authorised Phase 3 set. Every other file byte-for-byte identical to production (verified `git diff --quiet` per each non-scope path in the Phase 4 scope-boundary check; recorded in `final-release-report.md §C`).

---

## 5. Summary — items by status

| Status | Count | Notes |
|---|---|---|
| **PASS (static evidence sufficient)** | 20 | Form behaviour, security, scope boundary, role compatibility, syntax |
| **PASS (static-only; dynamic reinforcement helpful but not required)** | 2 | V5, V6 |
| **Blocked** — require dynamic Preview | 4 | V1–V4 (desktop render, mobile layout, theme consistency, nav behaviour) |
| **Not Tested** — blocked by isolation, deliberately not executed | 1 | S3 |
| **Fail** | 0 | — |

**Phase C verdict:** code level — **PASS**. Dynamic Preview smoke-test — **BLOCKED** on Approval C (create Preview) + Approval D (isolate Preview from production backend). The four Blocked items are visual-rendering checks whose code paths have been inspected and found unchanged or additively correct; they carry no known risk, but they are **not claimed as passed**.
