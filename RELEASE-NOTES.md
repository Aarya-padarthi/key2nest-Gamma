# Project 1 — Frontend Release Candidate

**Branch:** `release/project-1-frontend`
**Baseline:** `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`
**Scope:** Frontend only — `careers.html`, `careers.js`, `styles.css`. No Apps Script, no production configuration.

## What this release candidate contains

| File | Finding(s) addressed | Short description |
|---|---|---|
| `careers.html` | H-02 | Quick-interest role dropdown values aligned with full-application role titles; "Retail" option added; legacy values preserved in historical sheet rows (no sheet migration) |
| `careers.html` | H-03 | Safe Turnstile-fail fallback UI (new `.careers-interest-ts-unavailable` panel) + extended 20 s poll + manual retry affordance. **No client-side CAPTCHA bypass.** |
| `careers.html` | L-01 | Phone number normalised to digits-only before send |
| `careers.html` | L-02 | Failure banner text set dynamically per failure cause (validation vs transport vs TS-missing) |
| `careers.html` | L-03 | Failure banner `scrollIntoView` on display |
| `careers.html` | M-02 | Inline handler reads `window.__k2nCareersEndpoint` with a hardcoded literal fallback |
| `careers.html` | — | Cache rev bumped to `styles.css?v=rev70` and `careers.js?v=rev70` for this page only |
| `careers.js` | M-02 | Publishes `window.__k2nCareersEndpoint` so the inline quick-interest handler reads from a single authoritative constant |
| `styles.css` | H-03, L-02 | New selectors only: `.careers-interest-failure-text`, `.careers-interest-ts-unavailable`, `.careers-interest-ts-unavailable-list`, `.careers-interest-ts-retry`. Zero existing-rule modifications. |

## What this release candidate deliberately DOES NOT contain

- No change to `careers-apps-script.gs` (backend is a separate release candidate — branch `release/project-1-apps-script`).
- No change to any other HTML, CSS, or JS file.
- No change to `_redirects`, `sitemap.xml`, `robots.txt`, `assets/`, `cards/`.
- No new `_headers` (M-06 held pending separate authorisation).

## Full change manifest

Diff vs baseline (3 files, docs/ excluded):

```
careers.html   | +167 / -30
careers.js     |   +8 / -1
styles.css     |  +43 / -0   (all new .careers-interest-* selectors)
```

## Verification done on this candidate

- `node --check` on both JS files and the extracted inline handler: OK.
- Cross-reference of every ID/class referenced by the inline handler to its markup element: all 8 present.
- Role-compatibility test (`docs/recruitment-project/tests/role-compat.spec.js` on the audit branch): 15/15 PASS.
- Deployment-order matrix (`docs/recruitment-project/tests/response-contract.spec.js`): 41/41 PASS; this frontend reads **both** the baseline backend's response shape and the new (Phase 3) backend's response shape correctly.

## Rollback

| Path | Procedure |
|---|---|
| Netlify "Publish deploy" | Dashboard → Deploys → deploy at commit `66efe6a` → ⋯ → Publish deploy |
| `git revert` | On `main`, `git revert <merge-sha>` → push |
| Last-resort | Reset `main` → `origin/backup/project-1-prod-2026-11-09-66efe6a` with `--force-with-lease` (explicit approval only) |

Full runbook: `docs/recruitment-project/rollback-runbook.md` on branch `audit/project-1-recruitment`.

## Separate authorisation to take live

Pushing `release/project-1-frontend` → `main` auto-deploys via Netlify. Requires explicit user approval per Project 1 authorisation.
