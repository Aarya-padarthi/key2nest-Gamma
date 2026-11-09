# Project 1 — Apps Script Release Candidate

**Branch:** `release/project-1-apps-script`
**Baseline:** `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`
**Scope:** `careers-apps-script.gs` only.

## What this release candidate contains

| Finding | Change |
|---|---|
| **H-01** | `doPost` catch returns `{ok:false, code:'server_error'}` instead of raw `err.message`. Internal diagnostics logged via `console.error` with a 200-char message cap and no applicant payload. |
| **M-01** | Shared `sanitiseCell(s)` with Unicode `\p{L}\p{M}\p{N}` allowlist. Preserves accented, non-Latin, and combining-mark (Devanagari, Arabic, Thai) names. Prepends a single apostrophe when the sanitised value starts with `=`, `+`, `-`, or `@` so spreadsheet formula injection is blocked at write time. |
| **M-05** | Admin notification email body appends a brief reminder that Google Drive scans resumes at download time. |

## What this release candidate explicitly DOES NOT contain

| Held change | Why not here |
|---|---|
| **M-04** (`file.setSharing(PRIVATE, NONE)`) | Project 1 release-safety guidance ("do not rely on a conditional code comment as a security gate") requires behavioural changes to Drive permissions be gated on an executed validation. Until `docs/recruitment-project/drive-sharing-validation.md` produces a "deploy" decision, this code path is absent from the release candidate. A short comment marks the location so a future release can re-introduce M-04 cleanly. |
| **H-02, H-03, L-01, L-02, L-03, M-02** | Frontend-only findings — delivered on branch `release/project-1-frontend`. |
| Any Script Property change (e.g., `TURNSTILE_SECRET_KEY`) | Not touched. |
| Any `/exec` deployment URL change | Not touched. The redeployment procedure keeps the existing URL. |

## Verification done on this candidate

- Syntax: `node --check` OK.
- `sanitiseCell` tests (`docs/recruitment-project/tests/sanitise-cell.spec.js` on audit branch): **37/37 PASS**, including Unicode letters, combining marks, formula injection, length cap, null/undef, whitespace normalisation.
- Response-contract matrix (`docs/recruitment-project/tests/response-contract.spec.js`): **41/41 PASS** across both deployment orders (A: updated FE + baseline BE; B: baseline FE + updated BE). H-01 anti-leak: **9/9 PASS** (no shape leaks internal exception text).
- `setSharing` call confirmed absent from this candidate (`grep -q 'file.setSharing' careers-apps-script.gs` → nothing).

## Deployment procedure

Apps Script deployment is **not executed automatically**. Follow:
`docs/recruitment-project/recruitment-admin.md §4` on branch `audit/project-1-recruitment`.

Summary:

1. Open the careers Sheet → Extensions → Apps Script.
2. Replace the file contents with the `careers-apps-script.gs` on this branch.
3. Save.
4. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy.**
5. The `/exec` URL does not change.
6. Confirm with a synthetic submission per `docs/recruitment-project/preview-validation.md`.

## Rollback

If a redeployment of this candidate causes a production issue:

1. **Deploy → Manage deployments → ✏️ → Version: select the prior version → Deploy.**
2. The `/exec` URL does not change; no frontend update needed.
3. Confirm with a synthetic submission.

If no prior version exists in the Apps Script history (unlikely), paste `careers-apps-script.gs` from commit `66efe6a` back into the editor and deploy as a new version:

```bash
# From a clean clone of main at baseline:
git show 66efe6a3466503747f7f3495ac6ffa6b661cf5ba:careers-apps-script.gs > /tmp/careers-apps-script_baseline.gs
```

## Separate authorisation to take live

This branch exists in the repo for review. **No live redeployment** of the Apps Script occurs from a repo merge. The user must execute the deployment steps above in the Apps Script editor.
