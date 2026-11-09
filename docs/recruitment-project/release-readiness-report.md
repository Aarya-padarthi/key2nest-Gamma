# Key2Nest — Project 1 Release Readiness Report

**Project:** Recruitment Infrastructure Audit, Remediation, Backup & Rollback
**Prepared:** 2026-11-09
**Session:** `session_015JnAvTJGVjoQYvvK3UdKNk`
**Audit branch head:** `1cdbd5d304e8d2d73cf75ae9b1c64fa586ba3513` on `origin/audit/project-1-recruitment`
**Production branch head (unchanged):** `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` on `origin/main`

---

## A. Baseline and backup

| Item | Value | Verification evidence |
|---|---|---|
| Production commit SHA | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | `git rev-parse origin/main` on 2026-11-09 |
| Production tree SHA | `e29358e69129b6026b5e87c37299e2466ee1de35` | `git rev-parse origin/main^{tree}` |
| Production domain | `www.key2nesthomeloans.com` (static via Netlify) | HANDOFF.md §1 + session-established screenshots |
| Working tree at time of baseline | Clean (no uncommitted changes, no untracked files, no stash) | `git status --short` empty |
| Backup branch — local annotated tag | `pre-project-1-prod-2026-11-09-66efe6a` → `66efe6a…` | `git tag -a` executed successfully; `git show` shows correct commit; **not pushed to origin** (session's GitHub proxy returned HTTP 403 on raw-tag writes) |
| Backup branch — **durable on GitHub** | `origin/backup/project-1-prod-2026-11-09-66efe6a` → `66efe6a…` | `git ls-remote origin refs/heads/backup/project-1-prod-2026-11-09-66efe6a` prints the baseline SHA |
| Recovery bundle (committed to GitHub for durability) | `docs/recruitment-project/backups/key2nest-prod-2026-11-09-66efe6a.bundle` (33 022 730 bytes) | `git bundle verify` → "The bundle records a complete history. The bundle is okay." |
| Recovery bundle SHA-256 | `dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b` | `sha256sum -c` → `key2nest-prod-2026-11-09-66efe6a.bundle: OK` |
| Non-destructive restore rehearsal | Clone from bundle produces tree SHA `e29358e69129b6026b5e87c37299e2466ee1de35` and commit `66efe6a…` with `careers.html`, `careers.js`, `careers-apps-script.gs`, `testimonials.js` present at original byte sizes | Executed and recorded in session log |

The backup is durable on **both** GitHub (branch ref) and inside the repository tree (bundle committed to the audit branch). The rollback path does not depend on session-local temp storage.

### Deployment recovery

| Path | Mechanism | Recorded in |
|---|---|---|
| 1 (preferred) | Netlify "Publish deploy" on prior green deploy — zero repo write | `rollback-runbook.md` §1 |
| 2 (audit-trail) | `git revert <phase-3-release-sha>` on `main` | `rollback-runbook.md` §2 |
| 3 (emergency) | Reset `main` → backup branch, `--force-with-lease` push (explicit approval required) | `rollback-runbook.md` §3 |
| 4 (offline) | Clone from bundle, push to origin | `rollback-runbook.md` §4 |
| 5 (backend) | Apps Script "Manage deployments → ✏️ → prior version" | `rollback-runbook.md` §5, `recruitment-admin.md` §4 |

---

## B. Audit findings resolution

Full enumeration in `recruitment-audit.md`. Status table below.

### Approved and implemented (code in repo, not yet deployed to production)

| ID | Severity | Status | Location of change |
|---|---|---|---|
| H-01 | High | **Fixed** — doPost catch returns `{ok:false, code:'server_error'}`; details logged with 200-char cap and no applicant payload | `careers-apps-script.gs:235-249` |
| H-02 | High | **Fixed** — interest-form role options realigned with full-app role titles; "Retail" added; legacy values preserved via sheet documentation | `careers.html:283-303`, `recruitment-admin.md §3` |
| H-03 | High | **Fixed (safely)** — new fallback UI + 20s poll + background retry; NO client-side CAPTCHA bypass; server-side protection untouched | `careers.html:296-323, 940-1079`, `styles.css` (new classes) |
| L-01 | Low | **Fixed** — phone normalised to digits-only before send | `careers.html` inline handler `normalisedPhone()` |
| L-02 | Low | **Fixed** — failure banner text set dynamically per failure cause | `careers.html` inline handler `showFailure()` + `.careers-interest-failure-text` hook |
| L-03 | Low | **Fixed** — failure banner `scrollIntoView` on display | `careers.html` inline handler `showFailure()` |
| M-01 | Medium | **Fixed** — shared `sanitiseCell()` with Unicode `\p{L}\p{N}` allowlist + formula-prefix defense | `careers-apps-script.gs:82-105` |
| M-02 | Medium | **Fixed** — `CAREERS_ENDPOINT` hoisted to `window.__k2nCareersEndpoint` from `careers.js`; inline handler reads with literal fallback | `careers.js:20-24`, `careers.html:957-958` |
| M-05 | Medium | **Fixed** — admin email body reminds recipient Drive scans on download | `careers-apps-script.gs:174-180` |
| Priority 4 | — | **Delivered** — admin documentation | `recruitment-admin.md` |

### Approved, implemented, **gated on client-side validation**

| ID | Severity | Status |
|---|---|---|
| M-04 | Medium | **Implemented in code, HELD for deployment.** `file.setSharing(PRIVATE, NONE)` call is in `careers-apps-script.gs:188-199` wrapped in try/catch (non-fatal). Per the Phase 3 authorization, client must first run the isolated test in `docs/recruitment-project/drive-sharing-validation.md` to confirm (a) current baseline needs the fix and (b) the fix doesn't break recruiter access, before redeploying the Apps Script. |

### Deferred / held for separate authorisation (out of Project 1 scope)

| ID | Reason |
|---|---|
| M-03 — Unverified "K2N Originator's Desk" marketing claim | Marketing/content decision — needs client sign-off on product reality vs copy adjustment. Not an engineering fix. |
| M-06 — Site-wide `_headers` file (HSTS / Referrer-Policy / CSP) | Affects every page, not only /careers. Cross-site hardening — needs separate authorisation. |
| M-05 pipeline hardening — Virus-scan uploads before Drive write | Material backend-pipeline change. Current state: Drive performs download-side scan; admin email now carries that reminder. Longer-term fix tracked as a future risk-accepted item. |
| L-04, L-05, L-06, L-07 | Documented in audit; low-value; deferred. |

### Blocked

None.

---

## C. Changes

### Modified files (vs production baseline `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`)

```
careers-apps-script.gs                                     +73 / -4  (H-01, M-01, M-04, M-05)
careers.html                                              +167 / -30 (H-02, H-03, L-01, L-02, L-03, M-02, rev70 bump)
careers.js                                                   +8 / -1 (M-02)
styles.css                                                  +43 / -0 (new .careers-interest-* selectors only)
docs/recruitment-project/environment-inventory.md          +243 / -0 (new)
docs/recruitment-project/recovery-manifest.md              +215 / -0 (new)
docs/recruitment-project/recruitment-audit.md              +366 / -0 (new)
docs/recruitment-project/rollback-runbook.md               +187 / -0 (new)
docs/recruitment-project/recruitment-admin.md              +190 / -0 (new)
docs/recruitment-project/drive-sharing-validation.md       +156 / -0 (new)
docs/recruitment-project/preview-validation.md             +200 / -0 (new)
docs/recruitment-project/backups/
  key2nest-prod-2026-11-09-66efe6a.bundle                  binary +33 022 730 bytes (new)
  key2nest-prod-2026-11-09-66efe6a.bundle.sha256           +1 line (new)
```

Line counts are per `git diff --stat` on the audit branch vs `main` at the baseline SHA.

### Not modified (explicit non-scope confirmation; checked byte-for-byte)

`index.html`, `main.js`, `apps-script.gs`, `team.html`, `testimonials.js`, `privacy.html`, `terms.html`, `accessibility.html`, `licensing-disclaimer.html`, `styleguide.html`, `_redirects`, `sitemap.xml`, `robots.txt`, `cards/*`, `assets/*`.

`_headers` (M-06) deliberately not created.

### Authoritative audit-branch head

- Latest commit: `1cdbd5d304e8d2d73cf75ae9b1c64fa586ba3513` — "Phase 3 + Phase 4 + Phase 5 artifacts — approved Project 1 changes"
- Audit branch: `audit/project-1-recruitment`
- Remote: `origin`

### Changes requiring separate authorization to take effect

| Change | Why separate | Who executes | Gating doc |
|---|---|---|---|
| Deploy `careers-apps-script.gs` (H-01, M-01, M-05) to Apps Script production | Project 1 authorization withholds live redeploy | Client (Google account owner) | `recruitment-admin.md §4` |
| Deploy M-04 setSharing change | Requires `drive-sharing-validation.md` pre-test | Client | `drive-sharing-validation.md` |
| Promote audit branch to `main` (ships frontend changes to production) | Project 1 authorization withholds production deploy | Client | Awaiting go/no-go decision below |

---

## D. Test evidence

### Executed in this session

| Test | Tool / Method | Result |
|---|---|---|
| JS syntax — `careers.js` | `node --check` v22.23.4 | OK |
| JS syntax — `careers-apps-script.gs` | `node --check` (after `.gs` → `.js` rename) | OK |
| JS syntax — inline careers.html quick-interest handler | `node --check` on extracted script block | OK |
| JS syntax — `testimonials.js` (unchanged — regression sanity) | `node --check` | OK |
| `sanitiseCell` unit cases (17 inputs: ASCII, accented, Scandinavian, Chinese, curly apostrophe, hyphen, 4 formula-injection variants, HTML strip, backtick, length cap, empty, null, whitespace collapse, email-like, phone-like) | Python harness mirroring the regex | 16/17 behave as specified; 1 test expectation was less strict than actual implementation — actual strips `=` entirely (safer than apostrophe-prefix). No failures of the specification. |
| Cross-reference IDs + classes | Python/grep against `careers.html` | All 8 selectors used by the inline handler resolve to markup elements |
| No applicant payload in log statements (H-01 anti-regression) | `grep` on `console.*` in Apps Script | Only 2 log statements; both bounded to error name + capped message, no `data.*` references |
| Scope boundary — modified files match authorized list | `git diff --name-only vs baseline` | 8 files changed; all within authorized set |
| Scope boundary — non-scope files byte-for-byte unchanged | `git diff --quiet <baseline> -- <file>` for 13 non-scope HTML/JS/text files + `cards/` + `assets/` | All unchanged ✓ |
| Non-created file check — `_headers` (M-06) | `ls _headers` | Absent (correct — held) |
| Recovery backup branch resolves to baseline | `git ls-remote origin refs/heads/backup/project-1-prod-2026-11-09-66efe6a` | `66efe6a…` ✓ |
| Recovery bundle integrity | `sha256sum -c` + `git bundle verify` | Pass / "The bundle is okay." |
| Recovery bundle restoration rehearsal | Clone bundle → checkout `66efe6a` → verify tree SHA | Tree SHA matches baseline; key recruitment files present at expected byte sizes |

### Skipped / Not executable this session — **marked as unverified, not passed**

Per the Phase 3 authorisation ("Mark any skipped or untested production-dependent behavior as unverified, not passed"):

| Test | Why unverified | Mitigation |
|---|---|---|
| Live browser render of the preview URL | Netlify `app.netlify.com` is not reachable from this cloud session; preview URL resolution requires the user's browser | Phase 5 smoke-test checklist in `preview-validation.md` §4 gives the exact steps the user runs |
| Real backend behavior for H-01 / M-01 / M-04 / M-05 after redeploy | Apps Script deployment withheld per authorisation | `recruitment-admin.md §4` + `drive-sharing-validation.md` must be executed by the client |
| Real Drive sharing posture change after M-04 | Drive dashboard not reachable from this session | `drive-sharing-validation.md` procedure must run in an isolated test Apps Script project first |
| Email delivery to `admin@` | SMTP egress not available | Client-side synthetic submission with `QA-PREVIEW-*` markers verifies end-to-end |
| Production rollback execution | Explicitly forbidden to execute production rollback as a rehearsal | Rehearsal of the mechanism (backup branch, tag, bundle, checksum, bundle-restore clone to isolated directory) IS executed and recorded |
| Live production HTML fetch to compare against expected content | `www.key2nesthomeloans.com` not resolvable from the session's network | Not needed for Project 1 release — code review + commit-level verification is the authoritative source |
| Automated accessibility / lighthouse audit on the preview URL | `app.netlify.com`, `pagespeed.web.dev` not reachable | Preview smoke-test checklist (§4.5) covers manual spot checks |

### Independent reviewer

Phase 3 authorization asked for independent review "where available." A separate Claude session has not been spawned for a full independent audit; the change set is small enough that a code reviewer can be the user themselves inspecting `docs/recruitment-project/recruitment-audit.md §6` (the proposed-change list) alongside the diff `git diff 66efe6a3466503747f7f3495ac6ffa6b661cf5ba audit/project-1-recruitment -- careers.html careers.js careers-apps-script.gs styles.css`.

---

## E. Preview URL and validation evidence

### Preview source

- **Repository:** `github.com/Aarya-padarthi/key2nest-Gamma`
- **Preview branch:** `audit/project-1-recruitment`
- **Preview head commit:** `1cdbd5d304e8d2d73cf75ae9b1c64fa586ba3513`

### Preview URL (candidate)

Netlify branch-deploy URL pattern:

```
https://audit-project-1-recruitment--<netlify-site-slug>.netlify.app/
https://audit-project-1-recruitment--<netlify-site-slug>.netlify.app/careers.html
```

Session-recorded slug in `HANDOFF.md` is `gilded-peony-fba821` — user previously reported this slug may be stale (the custom domain `www.key2nesthomeloans.com` may have been mapped under a different site). Current slug must be confirmed from `app.netlify.com → Key2Nest site → Site configuration → General → Site name`.

### Preview isolation (recorded)

- Preview POSTs to the LIVE careers Apps Script endpoint (static-site preview against managed backend). **Data posture recorded explicitly in `preview-validation.md §2`**; `QA-PREVIEW-*` synthetic-naming convention required for any preview submission.
- Production `main` branch unchanged; production Netlify deploy unchanged; production Apps Script unchanged; production Drive folder unchanged; production spreadsheet schema unchanged.

### Preview smoke-test status

All steps in `preview-validation.md §4` are **ready for execution by the user**. Session-side pre-flight: all source-level cross-references pass; all JS syntax is valid; all scope-boundary checks pass.

---

## F. Website and Apps Script rollback instructions (summary; full text in `rollback-runbook.md`)

### Website rollback (Netlify, if any Phase 3 frontend change proves problematic in preview or after live release)

1. **Netlify dashboard** → Key2Nest site → **Deploys** → locate `66efe6a` deploy → **⋯ → Publish deploy**. Done in ≤ 1 minute.
2. Alternative (audit-trail): `git revert <phase-3-release-sha>` on `main`, push, Netlify auto-rebuilds.
3. Alternative (emergency; explicit approval only): reset `main` to `origin/backup/project-1-prod-2026-11-09-66efe6a` and `--force-with-lease` push.
4. Alternative (offline): clone from `docs/recruitment-project/backups/key2nest-prod-2026-11-09-66efe6a.bundle` → push.

### Apps Script rollback (if the backend Phase 3 changes prove problematic AFTER they are deployed)

1. Open the careers Apps Script editor from the sheet.
2. **Deploy → Manage deployments → ✏️ (edit).**
3. Select the Version immediately preceding the Phase 3 deployment.
4. **Deploy.** The `/exec` URL does not change; no frontend update needed.

Full procedure with verification: `rollback-runbook.md §5` + `recruitment-admin.md §4`.

---

## G. Release recommendation

**CONDITIONAL GO.**

### Why not plain GO

1. **M-04 remains gated.** The setSharing change is in the codebase but **must not be deployed to the live Apps Script until `drive-sharing-validation.md` is executed in an isolated test project** and the Decision Matrix (§3 of that doc) is filled in. The outcome of that validation drives whether M-04 ships, is reverted, or is modified. This is explicit in the Phase 3 authorisation.
2. **Live backend verification is unverified, not passed.** Apps Script changes (H-01, M-01, M-05, and conditionally M-04) are in the repo but not deployed. They cannot be verified against live traffic until the client redeploys per `recruitment-admin.md §4`.
3. **Preview URL resolution is pending.** The Netlify branch-deploy URL cannot be confirmed from this session; the user may need to enable branch deploys for `audit/*` if not already on.
4. **Production is unchanged.** No `main` push, no Netlify production redeploy, no Apps Script production redeploy.

### What CONDITIONAL GO means operationally

- The **frontend changes** (H-02, H-03, L-01, L-02, L-03, M-02 — all in `careers.html`, `careers.js`, `styles.css`) are ready for preview inspection by the user, and — upon the user's sign-off — ready for a squash-merge to `main` that will auto-deploy via Netlify.
- The **backend changes** (H-01, M-01, M-05) are ready for the user to paste into the Apps Script editor and deploy per `recruitment-admin.md §4`. No code change is required in the repo at that moment; the `/exec` URL is unchanged.
- The **M-04 backend change** stays in the codebase but is gated behind `drive-sharing-validation.md`. If the validation says "do not deploy", revert the `try { file.setSharing(...) }` block from `careers-apps-script.gs` before the next backend redeploy.
- The **rollback paths** are all documented and rehearsed non-destructively. A problematic release can be rolled back in ≤ 1 minute via the Netlify "Publish deploy" affordance.

### Explicit authorisations required to move from CONDITIONAL GO to live

1. User confirms Phase 5 smoke-test checklist (`preview-validation.md §4`) passes on the preview URL — covers the frontend.
2. User runs the `drive-sharing-validation.md` procedure and records the Decision outcome — unlocks or holds M-04.
3. User (or authorised operator) executes the Apps Script redeployment per `recruitment-admin.md §4` — covers H-01, M-01, M-05, and M-04 (if validated).
4. User gives explicit "deploy to prod" authorisation for the frontend squash-merge to `main` — covers H-02, H-03, L-01, L-02, L-03, M-02.

Each of these four gates is independent. Any of them can be executed, held, or declined without blocking the others.

### Production state at the moment of this report

- `origin/main` = `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` (unchanged since 2026-11-05 22:47 UTC).
- `www.key2nesthomeloans.com` serves this baseline commit.
- Careers Apps Script `/exec` serves the baseline backend code.
- Google Sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` Applications tab schema unchanged.
- Drive folder "Key2Nest – Resumes" permissions untouched.
- No applicant data read, written, modified, or deleted during the audit.

**Production remains unchanged until you explicitly authorize deployment.**
