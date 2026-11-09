# Key2Nest — Preview Isolation Report (Phase B)

**Classification: UNSAFE / BLOCKED — no Preview exists; a hypothetical future Preview on this Netlify project would not be isolated.**

Full rationale below. No dynamic test was executed because no Preview exists to execute against.

---

## 1. Current state

Per `netlify-verification.md`: there is no branch deploy or deploy-preview for `release/project-1-frontend` (nor for any branch other than `main`) on the Netlify site `0b000aea-f79e-4bc3-ab81-53e4f692b632`. Branch deploys appear to be disabled.

Therefore the isolation-assessment questions in the brief's Phase B list are answered by **inspection of what a hypothetical future Preview on this site would do**, based on the repository-state of `release/project-1-frontend` + known Netlify behaviour.

---

## 2. Hypothetical-Preview isolation posture (per §4 of the brief)

For each isolation question, this section records what a Netlify branch deploy for `release/project-1-frontend` would look like **if it were enabled**, and the resulting risk.

| Dimension | Hypothetical Preview behaviour | Risk to production |
|---|---|---|
| **Shares production environment variables?** | Netlify branch-deploy contexts inherit production environment variables by default unless the site has deploy-context overrides configured (which this site's config is not visible from here to confirm). **Assume yes.** No Netlify env vars are referenced by the frontend code today. | Low (frontend code has no env-var touches) |
| **Points at production Apps Script `/exec`?** | **Yes.** `careers.js` on `release/project-1-frontend` has the production `/exec` URL hard-coded (`AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg/exec`). The inline quick-interest handler uses the same URL via `window.__k2nCareersEndpoint`. | **HIGH — a form submission from the Preview writes a row to the production Applications sheet and uploads a resume to the production Drive folder** |
| **Can submit data to production Sheets?** | **Yes.** Via the Apps Script endpoint. | **HIGH** |
| **Can upload resumes to production Drive?** | **Yes.** Via the Apps Script endpoint. | **HIGH** |
| **Can send live recruiter notifications?** | **Yes.** The Apps Script emails `admin@key2nesthomeloans.com` on every successful submission. | **HIGH** |
| **Exposes secrets or internal configuration?** | Frontend ships no secrets (Turnstile *site key* is public by design). No API keys, no internal URLs beyond the public Apps Script `/exec`. | None |
| **Access restrictions on the Preview URL?** | Netlify branch deploys on the Starter/Basic plans default to publicly accessible. "Password protect this site" is a paid feature; its state is not visible from the authorised MCP operations. | **MEDIUM** (any link-holder can load the page; abuse surface unchanged vs public site) |
| **Third-party scripts with production side effects?** | Google Analytics 4 (`G-TLH3F0F15H`) fires from the Preview. Cloudflare Turnstile widget renders. Neither has production-destructive side effects, but GA4 events from the Preview would land in the live GA4 property — polluting analytics. | **LOW** (analytics only) |

### Net effect

A Preview for `release/project-1-frontend` on this Netlify project would **not** be an isolated test environment. Any form submitted from it writes real applicant records to production. **No synthetic submission must be made from this Preview without first isolating the backend**, per the brief's Phase B instruction ("Do not submit forms, upload documents, or trigger backend operations until isolation is verified").

---

## 3. Smallest safe isolation method (per brief §4, requires Approval C before any implementation)

The code is already written to make this a one-variable swap: `careers.js:24` publishes `window.__k2nCareersEndpoint = CAREERS_ENDPOINT;`. A Preview-only isolation can be achieved without modifying the release candidate itself. Options, ranked by minimal production-risk:

### Option 1 — Netlify deploy-context override (preferred, zero source change)

- Create a Netlify **context-specific environment variable** `K2N_CAREERS_ENDPOINT` set to a non-production `/exec` URL for `context=branch-deploy` and `context=deploy-preview`. Leave `context=production` with no value (so the production build keeps using the literal in `careers.js`).
- Inject that variable into the rendered HTML via a Netlify Snippet or `_headers`/`_redirects` substitution — **but Netlify snippets require admin UI access that isn't available from the MCP toolset.**
- Configure the `careers.js` endpoint hoist to prefer the env-derived override.

**Status:** requires both (a) Approval C (new Netlify configuration) and (b) a tiny source edit on the release candidate to read an injected script tag. **Non-trivial.** Not recommended for a first isolation attempt.

### Option 2 — Separate isolated Apps Script project (recommended)

- Create an **isolated Apps Script project** bound to a disposable test Sheet and Drive folder per `docs/recruitment-project/isolated-apps-script-test.md`.
- The test Apps Script publishes a **different `/exec` URL**.
- Patch **the isolated Preview branch only** (not the release candidate) to point `window.__k2nCareersEndpoint` at the test URL.
- Deploy only this isolated preview branch.

**Status:** requires Approval C (Preview deployment creation) **and** Approval D (isolated Apps Script creation). **Both are NOT AUTHORIZED today.**

### Option 3 — Local-only validation with client-side override (no Netlify change)

- Operator runs the release-candidate HTML locally (`python -m http.server 5175`) with DevTools overriding `window.__k2nCareersEndpoint` to point at an isolated test Apps Script `/exec`.
- Never any Netlify Preview.

**Status:** requires Approval D only (isolated Apps Script). The Preview itself is not created at all. **This is the cheapest path to dynamic validation if Approval D is granted.**

---

## 4. Required configuration changes (per brief §4, awaiting approval)

For Option 2 — the cleanest isolated Preview:

1. **Approval C — Create a Preview deployment.**
   - Enable branch deploys for `release/*` (or push the specific branch) in Netlify site config: *Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys*. Choose "Add individual branches" and list `release/project-1-frontend` only (narrowest scope). Do **not** choose "Deploy all branches" — that implicitly covers future feature branches.
   - Trigger the first build manually on this branch (Netlify "Trigger deploy" affordance) **after** the isolation patches below are in place.
2. **Approval D — Create an isolated Apps Script project** per `isolated-apps-script-test.md §1`.
3. **Approval E (small, scoped) — Permit a one-line patch to a new preview-only branch** (e.g. `release/project-1-frontend-preview`) that overrides `window.__k2nCareersEndpoint` with the isolated `/exec`. This patch must never be merged to `main`. The patch is recorded in Appendix A below.

Each item above is a distinct approval; all three are required before dynamic Preview testing is safe.

---

## 5. Items not executed because the above approvals are missing

Per the brief: "If Preview currently points to production services: 1. Do not perform dynamic submission tests. … 5. Request approval before implementing those changes."

- No synthetic submission has been made from any Preview during this phase.
- No Netlify configuration has been changed.
- No new Preview branch has been created.
- No isolated Apps Script project has been created.
- No environment variable has been modified.

**Production Applications sheet, Drive folder, and admin mailbox have received zero traffic from this session.**

---

## 6. Classification

- **SAFE FOR ISOLATED TESTING** ← not applicable; no Preview exists
- **READ-ONLY REVIEW ONLY** ← not applicable; nothing to review
- **UNSAFE / BLOCKED** ← ✅ **selected.** No Preview exists; creating one on the current site configuration would not be isolated. Approvals C + D (and a small scoped E) are required before this phase can proceed.

---

## Appendix A — scoped patch for the preview-only branch (not yet applied)

**Do not apply without Approval E.** Documented here so an operator can trivially audit the exact change before approval.

File: `careers.js` on branch `release/project-1-frontend-preview` only.

```diff
   const CAREERS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg/exec';
-  window.__k2nCareersEndpoint = CAREERS_ENDPOINT;
+  // PREVIEW-ISOLATION OVERRIDE — this file exists only on
+  // release/project-1-frontend-preview and MUST NOT be merged to main.
+  // Points the preview at the isolated test Apps Script /exec created
+  // per docs/recruitment-project/isolated-apps-script-test.md, so form
+  // submissions from the preview never reach production backend.
+  window.__k2nCareersEndpoint = '<ISOLATED-TEST-/exec-URL>';
```

The release candidate `release/project-1-frontend` is **not** altered by this patch.
