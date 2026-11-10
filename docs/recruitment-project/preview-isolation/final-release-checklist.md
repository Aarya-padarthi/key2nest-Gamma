# Key2Nest — Project 1 Final Release Checklist

Single-page release plan. No new tests, no new reviews beyond existing evidence.

---

## 1. What is being released

| Component | Candidate SHA | What changes |
|---|---|---|
| Frontend (static site) | `release/project-1-frontend` @ `de93d89f65647f5d72b70e02449e83e20b7c6e98` | 3 files: `careers.html`, `careers.js`, `styles.css`. Quick-interest form hardening (H-02/H-03/L-01/L-02/L-03/M-02), accessibility and UX refinements. |
| Backend (Apps Script) | `release/project-1-apps-script` @ `91fb1eddeb05ffd94c3d82eae17a780b925f5a0d` | 1 file: `careers-apps-script.gs`. Error-response sanitisation (H-01), Unicode-aware sanitiser + formula-injection defence (M-01), recipient-side scan note (M-05). M-04 (`file.setSharing`) deliberately excluded. |

Production baseline (unchanged) — `main` @ `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`.

---

## 2. Existing evidence (reused — not re-run)

| Check | Status | Where |
|---|---|---|
| Fail-closed matrix (frontend) | **17/17 PASS** | `tests/preview-fail-closed.spec.js` on preview branch |
| Sanitise-cell matrix (backend) | 37/37 PASS | `tests/sanitise-cell.spec.js` |
| Response-contract matrix | 41/41 PASS | `tests/response-contract.spec.js` |
| Role-compat matrix | 15/15 PASS | `tests/role-compat.spec.js` |
| Scope boundary check | PASS | `final-release-report.md §C` |
| Independent preview code review (fresh reviewer) | PASS (after remediation) | session scratchpad transcript; findings in `deployment-approval-packet.md §1` |
| Independent Apps Script template review (fresh reviewer) | PASS-WITH-NOTES → PASS (after remediation) | same |
| Preview-contamination guard | PASS on `main`, PASS on `release/project-1-frontend`, FAIL on preview (correct) | `tools/preview-guard.sh` |
| Preview branch-deploy build | `ready`, latest deploy `6af35afc05c4aa0c1da68a17`, SHA `5df8413`, no build error | Netlify |

Preview deploy history (all `ready`, all `branch-deploy`, all on `release/project-1-frontend-preview`):

| Deploy ID | Commit | Content |
|---|---|---|
| `6af35afc05c4aa0c1da68a17` | `5df8413` | **Current** — Workspace-account isolated `/exec` substituted |
| `6af34377a2a1c96d01d1af43` | `998d42e` | Cloudflare test Turnstile site key swap (110200 fix) |
| `6af3405d4f031e5c50b541bf` | `9af286f` | First branch-deploy build (empty commit) |

Isolated backend (Workspace account `admin@key2nesthomeloans.com`):

- `/exec` deployment id: `AKfycbwNyLttEtL03qtwA8FMEAwa3qMzVy0tHqHZYYbPLLH9YemcqvJ0h2SpXD7oE_jeVttz`
- Sheet id: `1IXMHU8hKZaMgqyRR9TeX_jevb3PvuH8Kb3yFtnvar9g`
- Notify mailbox: `admin+k2n-preview@key2nesthomeloans.com` (plus-aliased, delivers to `admin@`)
- Turnstile pair: site `1x00000000000000000000AA` + secret `1x0000000000000000000000000000000AA` (Cloudflare always-pass test pair)

Live operator smoke-tests (visual + 1 inquiry + 1 full application with a dummy PDF) are in progress against the preview URL below.

---

## 3. Release steps

### 3.1 Apps Script backend
1. Open the production careers Apps Script project (bound to sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` — Extensions → Apps Script).
2. Open `release/project-1-apps-script:careers-apps-script.gs` @ `91fb1ed` in another tab. Replace the editor contents in full. Save.
3. Deploy → Manage deployments → ✏️ edit the existing Web App deployment → Version: **New version** → Deploy.
4. Smoke: `curl -sS '<prod /exec URL>'` → expect `{"ok":true,"service":"key2nest-careers"}`. The `/exec` URL is unchanged across versions.

### 3.2 Frontend (Netlify)
1. Before pushing, run the guard: `bash tools/preview-guard.sh --ref release/project-1-frontend` — must print `PASS`.
2. Fast-forward (or cherry-pick) `release/project-1-frontend` @ `de93d89` onto `main`. **Do not** merge `release/project-1-frontend-preview` or anything from it.
3. Push `main`. Netlify auto-builds. Watch the build go green.
4. Smoke from a logged-out incognito browser:
   - Load `https://www.key2nesthomeloans.com/careers.html` — page renders, no console errors.
   - View source — `<link rel="stylesheet" href="styles.css?v=rev70">` present (new cache-bust).
   - Submit quick-interest: synthetic name `QA-PROD-01`, email `aarya.2.padarthi+prodqa01@gmail.com` — green success panel; row in Applications sheet with Role `Interest — <chosen>`; email to `admin@key2nesthomeloans.com`.

### 3.3 Keep production unchanged from here on
- `main` must stay at the new release commit only if steps 3.2.4 pass.
- Preview branch and audit branch are not merged.

---

## 4. Rollback (unchanged from `rollback-runbook.md`)

Trigger a rollback if post-release smoke fails (form returns failure banner for all synthetic submits, wrong sheet, broken page, regulated content error, WCAG-blocking regression).

### 4.1 Fastest — Netlify "Publish deploy"
- Netlify → Deploys → find `6aed0771bc2340cb535a91f6` → **⋯ → Publish deploy**. ~30 s propagation. Full flow in `rollback-runbook.md §1`.

### 4.2 Audit-trail — `git revert`
- `git revert --no-edit <new-main-sha>`; push `main`. Netlify auto-builds. Full flow in `rollback-runbook.md §2`.

### 4.3 Apps Script
- Apps Script editor → Deploy → Manage deployments → ✏️ → Version dropdown → select the version immediately preceding the Project 1 deploy → Deploy. `/exec` URL unchanged. Full flow in `rollback-runbook.md §5`.

### 4.4 Baseline backup available
- `backup/project-1-prod-2026-11-09-66efe6a` → commit `66efe6a` (on origin).
- `backup/project-1-bundle-archive` → SHA-256-verified offline git bundle.

---

## 5. Approval request format (to be filled once operator smoke-tests are in)

```
APPROVE_PROJECT_1_RELEASE:
  - frontend: release/project-1-frontend @ de93d89   -> push to main
  - backend:  release/project-1-apps-script @ 91fb1ed -> new Apps Script version
  - rollback: Netlify publish 6aed0771bc2340cb535a91f6 + Apps Script prior version
  - keep production at 66efe6a only if ANY smoke-test in §3.1.4 or §3.2.4 fails
```

Reply `APPROVED` to proceed. Anything else = hold.

---

## 6. What this release does NOT include (parked)

- M-04 (`file.setSharing(PRIVATE, NONE)`) — deliberately excluded from the Apps Script candidate.
- Any content, licensing, or state-list change.
- Any Project 2 / Project 3 scope.
- Any CI merge-guard workflow on `main` (adding `.github/workflows/no-preview-on-main.yml` is a separate, approved change — the guard script lives on the audit branch and can be invoked manually via `bash tools/preview-guard.sh`).
