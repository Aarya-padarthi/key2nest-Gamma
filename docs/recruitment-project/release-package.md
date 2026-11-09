# Key2Nest — Project 1 Release Package

**Prepared:** 2026-11-09 — consolidated final approval package.

**Verdict:** **CONDITIONAL GO.** Code-level verification is complete; two operational gates remain (dynamic Preview smoke-test and isolated Apps Script run). Neither is a code defect. Production is **unchanged**.

---

## A. Production baseline

| Field | Value |
|---|---|
| Commit SHA | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` |
| Tree SHA | `e29358e69129b6026b5e87c37299e2466ee1de35` |
| Netlify deploy ID | `6aed0771bc2340cb535a91f6` (state `ready`, context `production`, branch `main`, from 2026-11-05T22:47Z) |
| Netlify site | `0b000aea-f79e-4bc3-ab81-53e4f692b632` (slug `gilded-peony-fba821`, team: Aarya-padarthi's team) |
| Backup branch | `origin/backup/project-1-prod-2026-11-09-66efe6a` → `66efe6a…` (remote-verified) |
| Durable bundle | `origin/backup/project-1-bundle-archive` → `b87232f…` on root commit; `backups/key2nest-prod-2026-11-09-66efe6a.bundle` + `.sha256`; SHA-256 `dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b` |
| Backup re-verified | Phase F non-destructive rehearsal re-run 2026-11-09: checksum OK, bundle structure OK, restore-to-baseline tree SHA matches |

---

## B. Frontend release candidate

| Field | Value |
|---|---|
| Branch | `origin/release/project-1-frontend` |
| Commit | `de93d89f65647f5d72b70e02449e83e20b7c6e98` |
| Files changed vs baseline | `careers.html`, `careers.js`, `styles.css` (3 files; no `RELEASE-NOTES.md` at repo root) |
| Netlify Preview deploy | **None.** Branch deploys are not enabled on the Key2Nest Netlify site. No `release/project-1-frontend` deploy exists. |
| Preview URL | — (Preview does not exist; cannot be invented) |
| Screenshots / visual evidence | **Not available** — no Preview to render |
| Static code evidence | 20 PASS static items in `frontend-acceptance.md §1–§3`; 4 Blocked items (V1–V4, dynamic rendering only); 0 Fail |
| Automated test coverage against this candidate | `sanitise-cell` 37/37, `role-compat` 15/15, `response-contract` 41/41, `node --check` 3/3, scope-boundary 15/15, cross-ref 8/8, PII-in-logs 2/2 — **121/121 overall** |

---

## C. Apps Script release candidate

| Field | Value |
|---|---|
| Branch | `origin/release/project-1-apps-script` |
| Commit | `91fb1eddeb05ffd94c3d82eae17a780b925f5a0d` |
| Files changed vs baseline | `careers-apps-script.gs` (1 file) |
| Changes implemented | H-01 (safe error contract), M-01 (Unicode-aware sanitiser incl. combining marks, formula-leader apostrophe-prefix), M-05 (admin email scan reminder) |
| M-04 status | **Excluded** from this candidate — the `file.setSharing(PRIVATE, NONE)` call is not present; a short code comment documents the deliberate exclusion |
| Isolated test results | Execution of `isolated-apps-script-test.md` is **BLOCKED on Approval D** (NOT AUTHORIZED today). Static + automated matrix in `backend-acceptance.md` covers 14 validation items: 6 Executed PASS, 7 PASS (static + documented; live component Blocked), 1 PASS (documented procedure; live Blocked). 0 Fail. |
| Rollback procedure | `apps-script-release-safety.md §4` + `rollback-runbook.md §5` — Deploy → Manage deployments → ✏️ → prior version → Deploy. `/exec` URL unchanged. |

---

## D. Security and compatibility

| Dimension | Finding |
|---|---|
| Preview isolation status | **BLOCKED / UNSAFE** — no Preview exists; a hypothetical future Preview on this Netlify site would submit to production Apps Script (see `preview-isolation-report.md`). No dynamic test has been performed from any Preview. |
| Client-side secrets | None. Turnstile site key (public by design) only. |
| CAPTCHA bypass | None introduced. Independent QA confirmed H-03 adds no client-side bypass. |
| Client-side PII writes | None (no localStorage, no cookie writes, no third-party `fetch` destinations introduced). |
| Backend exception leakage | H-01 fix removes raw `err.message` from the public response. No applicant payload reaches `console.error`. |
| Cross-version compatibility (static) | 41/41 PASS across both deployment orders (A: updated FE + baseline BE; B: baseline FE + updated BE). |
| Cross-version compatibility (live) | **Not executed** — Approval C + D required. Gap recorded as a release condition. |
| Independent QA (Hardening pass) | `INDEPENDENT_QA_VERDICT: CONDITIONAL_GO`. All three gates raised then (G1: RELEASE-NOTES.md at repo root, G2: superseded wording, G3: M-04 reintroduction procedure) have been resolved. |
| Independent QA (current, Phase G) | **Verdict unchanged.** The new Phase A/B/C/D evidence does not introduce any code-level issue that would alter the previous verdict; the open items are operational (Approvals C, D), not code defects. No new reviewer was spawned because the delta is operational only and the code baseline the prior reviewer approved has not changed. Documented rationale in §G of this package. |

---

## E. Remaining blockers

Each row names: what is missing · why it matters · exact minimal user action · whether other safe tasks can continue in parallel.

### E.1 Preview on Netlify for `release/project-1-frontend`

- **What is missing:** No branch deploy exists; branch deploys are disabled on the site.
- **Why it matters:** Phase C dynamic smoke-test (V1–V4: desktop/mobile rendering, theme, nav behaviour) cannot run without a browsable Preview.
- **Minimal user action — Approval C:** Enable branch deploys for `release/project-1-frontend` specifically (do **not** choose "Deploy all branches"). In Netlify: *Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys → Add individual branches → `release/project-1-frontend`*. Trigger a build on that branch. Share the resulting deploy URL + ID.
- **Parallel work possible?** Yes — code-level verification is complete; no further code work can happen without new audit scope.

### E.2 Preview isolation from production backend

- **What is missing:** Even once a Preview is enabled, it would POST to the production Apps Script `/exec`, writing real applicant rows and sending real admin emails on any synthetic submission.
- **Why it matters:** The brief forbids submitting synthetic data to production; without isolation, the Preview would do exactly that.
- **Minimal user action — Approval D + a scoped Approval E:**
  1. (Approval D) Create an isolated Apps Script project per `isolated-apps-script-test.md §1`. Share the test `/exec` URL back.
  2. (Scoped Approval E) Authorise a one-line, single-file override to a new branch `release/project-1-frontend-preview` that sets `window.__k2nCareersEndpoint` to the test `/exec`. The release candidate `release/project-1-frontend` is **not** modified. The patch is recorded in `preview-isolation-report.md Appendix A`.
- **Parallel work possible?** Yes — E.1 can be requested independently.

### E.3 Isolated Apps Script dynamic validation

- **What is missing:** `isolated-apps-script-test.md §2` matrix (A1–A8 interest; B1–B6 full application; resume incognito-access; email arrival; previous-version recovery) has not been executed.
- **Why it matters:** Live behaviour of H-01, M-01, M-05 under real Apps Script execution is unverified — covered only statically.
- **Minimal user action — Approval D:** Create the isolated test Apps Script project per the procedure; run the matrix; record the outcome in the §4 block of that doc.
- **Parallel work possible?** Yes — E.1 is independent.

### E.4 M-04 (Drive sharing) decision

- **What is missing:** `drive-sharing-validation.md §3 Decision Matrix` not filled in.
- **Why it matters:** Reintroducing M-04 to a future backend candidate requires this to be recorded.
- **Minimal user action — Approval D + scoped execution of `drive-sharing-validation.md §2`**. Record the Decision.
- **Parallel work possible?** Yes — M-04 is not part of this release candidate.

---

## F. Final release-sequence recommendation (contingent on the approvals above)

After **all three** of Approvals C, D, and E are granted, execute in the order below. Either frontend-first or backend-first is safe per the response-contract matrix; the recommended order is **backend-first** because:

1. The frontend change is user-facing and should ship with the backend contract it was designed for.
2. Rolling back the backend (Apps Script version revert) is instant and does not require any frontend action; rolling back the frontend requires a Netlify "Publish deploy".

Recommended sequence:

| Step | Action | Rollback trigger reference |
|---|---|---|
| 1 | Record current Apps Script deployed version per `apps-script-release-safety.md §1` | — |
| 2 | Redeploy Apps Script per `apps-script-release-safety.md §3` | On failure, revert to the recorded version (step 1) |
| 3 | Run two synthetic submissions against production (interest + full) with `QA-POSTDEPLOY-*` naming; verify row + email + resume | If any synthetic submission returns `{ok:false, code:'server_error'}`, confirmed data routing is incorrect, resume is accessible by an incognito browser, or admin email does not arrive within 5 min → trigger backend rollback |
| 4 | Clean up synthetic rows + files + emails | — |
| 5 | Merge `release/project-1-frontend` → `main` via pull request → Netlify auto-build | On failed Netlify deploy or visible regression on www.key2nesthomeloans.com/careers.html → Netlify Publish deploy on `6aed0771bc2340cb535a91f6` (rollback-runbook §1) |
| 6 | Verify live production: careers page loads, forms render, synthetic submission lands correctly | Same trigger as step 5 |
| 7 | Clean up synthetic data | — |

### Rollback triggers (do not require two consecutive failures for serious security/data-integrity events)

- Any confirmed security exposure (e.g., resume file accessible without authentication from an incognito browser).
- Any incorrect candidate data routing (row written to the wrong sheet, email to the wrong recipient).
- Resume access-control failure.
- Corrupt or missing candidate records.
- Broken application submissions (both forms → failure banner on synthetic tests).
- Significant regression affecting recruitment traffic.
- Any unexpected production side effect.

---

## G. Independent QA re-assessment (Phase G)

**Previous verdict (post-hardening pass):** `INDEPENDENT_QA_VERDICT: CONDITIONAL_GO`.

**New evidence since the previous verdict:**

- Netlify project identity verified (`0b000aea-f79e-…`, slug `gilded-peony-fba821`).
- Production deploy identified (`6aed0771bc2340cb535a91f6`) and confirmed to be the `66efe6a…` baseline via title + timestamp cross-check.
- No branch deploys exist on the Netlify site (confirmed; `release/project-1-frontend` has no Preview).
- Backup bundle re-verified non-destructively; produces baseline tree SHA.
- Response-contract matrix re-run: 41/41 PASS (unchanged).
- `sanitise-cell` matrix re-run: 37/37 PASS (unchanged).
- `role-compat` re-run: 15/15 PASS (unchanged).

**Do any of these change the verdict?** No. The code-level diffs reviewed by the Independent QA pass are byte-for-byte identical to the ones now shipped on the two release branches (`de93d89` frontend, `91fb1ed` backend). The three gates raised by that review (G1–G3) were resolved during the hardening pass and remain resolved. The new operational evidence (no Preview, Preview would be unsafe without isolation) is consistent with the previous verdict's spirit — it tightens Phase 5 Preview Validation from "pending" to "Blocked on Approvals C + D".

**Decision on spawning a fresh independent reviewer for Phase G:** not required. The delta from the previous reviewer's dataset is operational (Preview existence + isolation posture) rather than code-level, and both operational items are themselves explicitly withheld pending separate approvals. A fresh reviewer would receive the same code to inspect and the same operational blockers to note.

**Phase G verdict:** **CONDITIONAL PASS** — the implementation is release-ready; proceeding to live release requires Approvals C, D, and a scoped E as laid out above.

---

## H. Final recommendation

**CONDITIONAL GO.**

- **Code level:** ready. 121 automated assertions pass; scope boundary clean; backup + rollback paths rehearsed non-destructively.
- **Operational gates:** three independent approvals open (C — enable branch deploy, D — isolated Apps Script, scoped E — preview-only endpoint override).
- **Production:** unchanged. `origin/main` at `66efe6a…`; Netlify prod deploy `6aed0771bc2340cb535a91f6`; Apps Script `/exec` on the baseline version; Google Sheet schema, Drive folder permissions, and applicant data all untouched.

A GO recommendation does not itself authorise deployment. Awaiting explicit project-owner approval on each gate.

---

## Appendix — cross-reference of deliverables on `origin/audit/project-1-recruitment`

- `docs/recruitment-project/netlify-verification.md` — Phase A
- `docs/recruitment-project/preview-isolation-report.md` — Phase B (classification: UNSAFE/BLOCKED)
- `docs/recruitment-project/frontend-acceptance.md` — Phase C (static-only; dynamic Blocked)
- `docs/recruitment-project/backend-acceptance.md` — Phase D (static + automated; live Blocked on Approval D)
- `docs/recruitment-project/rollback-runbook.md` — Phase F (updated with Netlify deploy ID + Phase F re-rehearsal evidence + Git-vs-service orthogonality note)
- `docs/recruitment-project/isolated-apps-script-test.md` — Phase D execution procedure
- `docs/recruitment-project/drive-sharing-validation.md` — M-04 gating procedure
- `docs/recruitment-project/apps-script-release-safety.md` — production Apps Script deployment procedure
- `docs/recruitment-project/recovery-manifest.md` — recovery evidence (bundle, checksum, backup branch)
- `docs/recruitment-project/recruitment-audit.md` — original audit findings
- `docs/recruitment-project/recruitment-admin.md` — operational admin handbook
- `docs/recruitment-project/final-release-report.md` — previous consolidated report (now superseded by this one)
- `docs/recruitment-project/release-readiness-report.md` — Phase 7 readiness checkpoint (superseded)
- `docs/recruitment-project/netlify-site-discovery-log.md` — Phase A discovery log (pre-site-ID; preserved for change history)
- `docs/recruitment-project/tests/` — 93 automated assertions across 3 specs
- `docs/recruitment-project/backups/README.md` — pointer to orphan branch `backup/project-1-bundle-archive`
