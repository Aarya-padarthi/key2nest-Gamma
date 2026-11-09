# Key2Nest — Project 1 Phase 5 Preview Deployment Validation

**Preview source:** branch `audit/project-1-recruitment` on `github.com/Aarya-padarthi/people/key2nest-Gamma`
**Preview target:** Netlify branch-deploy for the audit branch
**Production domain:** `www.key2nesthomeloans.com` — **unchanged by this preview**
**Phase 3 head commit SHA:** recorded at commit time below once pushed

---

## 1. Isolation posture

| Dimension | Status |
|---|---|
| Production branch (`main`) | **Unchanged** — see "Source-side isolation" below |
| Production Netlify deploy | **Unchanged** — the current live deploy continues serving `www.key2nesthomeloans.com` |
| Netlify branch-deploy of `audit/project-1-recruitment` | Renders the Phase 3 content at an auto-generated preview URL (if branch deploys are enabled) |
| Production Google Apps Script | **Not redeployed** — the live `/exec` URL still points at the pre-Phase 3 code. Phase 3 changes to `careers-apps-script.gs` are in the repo only and will not take effect until the client manually pastes-and-deploys per `recruitment-admin.md §4`. |
| Production Applications sheet | Schema unchanged. The preview page WILL submit to the live sheet if a synthetic form is posted from the preview URL — see "Preview data posture" below. |
| Production Drive folder | Schema unchanged. The preview WILL upload resumes to the live folder if the full-application form is used from the preview URL. |

### Source-side isolation

Preview branch state verified before preview request:

```
$ git rev-parse origin/main
66efe6a3466503747f7f3495ac6ffa6b661cf5ba

$ git rev-parse origin/audit/project-1-recruitment
<Phase 3 commit SHA — recorded below>

$ git diff --name-only 66efe6a3466503747f7f3495ac6ffa6b661cf5ba origin/audit/project-1-recruitment
careers-apps-script.gs
careers.html
careers.js
docs/recruitment-project/<5 markdown files>
styles.css

$ git diff --stat 66efe6a3466503747f7f3495ac6ffa6b661cf5ba origin/audit/project-1-recruitment -- \
    index.html main.js apps-script.gs team.html testimonials.js \
    privacy.html terms.html accessibility.html licensing-disclaimer.html \
    styleguide.html _redirects sitemap.xml robots.txt cards/ assets/
(empty — no non-scope file was modified)
```

Phase 3 changes are confined to Project 1 scope. Nothing else in the repo was touched.

---

## 2. Preview data posture — IMPORTANT

**The preview page is a copy of the Project 1 recruitment UI. It POSTs to the LIVE careers Apps Script endpoint.** This is the standard behavior of a static-site preview against a managed backend — there is no separate backend for the branch deploy.

Consequences:

- Any form submission made from the preview URL will land as a real row in the live Applications sheet.
- Any resume uploaded from the preview URL will land as a real file in the live Drive folder.
- Any submission notification will land as a real email in the `admin@key2nesthomeloans.com` inbox.

**Rule for preview testing:** use the synthetic-test prefix convention below for every submission, so rows and files are trivially distinguishable from real applicants and can be cleaned up afterward.

### Synthetic-test naming convention

| Field | Required marker |
|---|---|
| Name | starts with `QA-PREVIEW-` (e.g. `QA-PREVIEW-Alice`) |
| Email | add `+qa-preview-YYYYMMDD` to the local part (e.g. `aarya.2.padarthi+qa-preview-20261109@gmail.com`) |
| Phone | any 10-digit test number — `+1 555 555 1212` is standard |
| City & State | `Preview, QA` |
| Role | the role being tested |
| Resume (full-app only) | `QA-PREVIEW-dummy.pdf` — a 1-page synthetic PDF |

After the preview-validation window is closed:

1. Delete the `QA-PREVIEW-*` rows from the Applications sheet.
2. Delete the `QA-PREVIEW-*` files from the Drive folder (resumes/) and empty Drive Trash.
3. Delete the `QA-PREVIEW-*` notification emails from the `admin@` inbox.

---

## 3. Finding the preview URL

Netlify branch deploys generate a URL of the form:

```
https://audit-project-1-recruitment--<netlify-site-slug>.netlify.app/
```

To locate the exact URL:

1. Open `https://app.netlify.com` → the Key2Nest site.
2. **Deploys** tab.
3. Locate the most recent deploy for branch `audit/project-1-recruitment`.
4. The URL appears at the top of the deploy detail.

If no deploy appears, branch deploys are not enabled for `audit/*`. Enable them in **Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys → Deploy all branches** (or add `audit/*` to the allow-list).

---

## 4. Preview smoke tests

Run these on the preview URL, not on production. Record the result in the Phase 7 release report.

### 4.1 Rendering

| Check | Expected | Pass/fail |
|---|---|---|
| `/careers.html` loads without console errors | No red console output | |
| Hero + state badge render, licensing list reads `AR, AZ, CO, CT, FL, GA, KS, NJ, OK, TN and TX` (11 states) | Pass |  |
| Life at Key2Nest section renders (stats row + team strip + Google Reviews) | Pass |  |
| Role cards render, each with an "Apply for this role" button | Pass |  |
| Apply panel renders when a role card is clicked and relocates under the clicked role | Pass |  |
| Footer renders with LinkedIn + Instagram icons | Pass |  |

### 4.2 Quick-interest form (H-02, H-03, L-01, L-02, L-03, M-02)

| Step | Expected outcome | Pass/fail |
|---|---|---|
| Submit with name empty | Failure banner reads "Please enter your name before sending." Banner scrolls into view. | |
| Submit with email = "foo" | Failure banner reads "Please enter a valid email address so we can reach you." | |
| In DevTools console: `window.__k2nTs = { failed: true }` then click submit | Turnstile-unavailable panel (brass-tinted box) appears with phone + email + "Try reloading the security check" button | |
| Click "Try reloading" while Turnstile is reachable | Turnstile widget re-renders in place | |
| Role dropdown — each option value matches a role-card data-role-apply value | Confirmed by viewing page source | |
| Submit valid Name/Email/Turnstile — observe payload in Network tab (`/exec`) | `payload.phone` is digits-only (L-01); `role` matches full-application role title | |

### 4.3 Full application form (unchanged logic except M-02 endpoint)

| Step | Expected outcome | Pass/fail |
|---|---|---|
| Click "Apply" on each role card → panel moves under clicked role | Pass |  |
| Submit with missing resume | Inline "Please attach your resume." error |  |
| Submit with a 6 MB file | "That file is over 5 MB" inline error |  |
| Submit valid synthetic payload with `QA-PREVIEW-*` markers | Success panel; sheet row appears; admin email arrives |  |
| Re-submit the same email + role combination | Duplicate panel shown; no second row / email / Drive file |  |

### 4.4 Apps Script changes — NOT yet live

The following apply only AFTER the client follows `recruitment-admin.md §4` to redeploy the script. **These are explicitly not verified by the Netlify preview.**

| Change | Verification after redeploy |
|---|---|
| H-01 generic error response | Trigger a server-side exception (e.g. force Mail quota) — client receives `{ok:false, code:'server_error'}` instead of a raw message |
| M-01 Unicode-safe sanitiser | Submit a synthetic application with name `José López-李雷` — sheet row preserves the name |
| M-04 setSharing (**after Drive-sharing-validation.md procedure**) | Open the resulting Drive file URL in an incognito window — "You need access" page |
| M-05 scan reminder | Admin email body contains the "scan by Google Drive at download time" line |

### 4.5 Accessibility spot checks

| Check | Expected |
|---|---|
| Keyboard-only tab through the interest form | Every field reachable; focus visible; success + failure banners announced via `role="status"` / `role="alert"` |
| macOS VoiceOver reads each form label correctly | `aria-describedby` wiring intact (no changes in Phase 3) |
| Theme toggle still swaps Turnstile widget theme on quick-interest form | `renderTs()` passes `theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'` on each render |

---

## 5. Items the Netlify preview CANNOT verify

Listed explicitly so Phase 7 can mark them "unverified, not passed":

1. **Real backend behavior for H-01 / M-01 / M-04 / M-05** — these require the Apps Script to be redeployed, which Project 1 authorisation explicitly withholds from this run.
2. **Real Drive sharing behavior under M-04** — must be validated separately via `drive-sharing-validation.md` using an isolated test Apps Script project.
3. **Real email delivery** — the Netlify preview still uses the live Apps Script, so emails DO fire if a synthetic form is submitted; the "production mail delivery is unchanged" guarantee comes from the deliberate decision not to redeploy.
4. **Production rollback execution** — rehearsal is documented in `rollback-runbook.md` §7; live rollback is deliberately not executed.

---

## 6. Preview rejection criteria (abort, do not promote)

Reject the preview and roll back changes in the repo (not production) if any of the following occur:

- Console errors on `/careers.html` load beyond known-good baseline.
- A visual regression on any Life at Key2Nest section (team strip, stats row, testimonials) that did not exist before Phase 3.
- Any JS exception thrown by `testimonials.js` or `main.js` that was not present on the production baseline (impossible by inspection — Phase 3 does not touch those files).
- The quick-interest form will submit successfully even when Turnstile has failed (a true H-03 regression — bypass is forbidden).
- The full-application form will accept a resume over 5 MB or an extension outside `.pdf/.doc/.docx` (a true regression — these checks were not modified by Phase 3).
