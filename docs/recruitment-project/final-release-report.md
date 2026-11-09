# Key2Nest — Project 1 Final Release Report (post-hardening)

**Prepared:** 2026-11-09
**Session:** `session_015JnAvTJGVjoQYvvK3UdKNk`
**Authoritative report** — supersedes `release-readiness-report.md` on the points marked below. The earlier report is retained for change-history purposes.

**Verdict:** **CONDITIONAL GO** (independent QA matches; gates resolved below).

---

## A. Verified baseline + durable backup

| Item | Value | Verification evidence |
|---|---|---|
| Production commit | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | `git rev-parse origin/main` |
| Production tree | `e29358e69129b6026b5e87c37299e2466ee1de35` | `git rev-parse origin/main^{tree}` |
| Backup branch (named ref on GitHub) | `origin/backup/project-1-prod-2026-11-09-66efe6a` → `66efe6a…` | `git ls-remote origin refs/heads/backup/project-1-prod-2026-11-09-66efe6a` |
| **Durable bundle location** | `origin/backup/project-1-bundle-archive` (orphan branch, root `b87232f…`), path `backups/key2nest-prod-2026-11-09-66efe6a.bundle` | `git ls-remote origin refs/heads/backup/project-1-bundle-archive` → `b87232f…` |
| Bundle SHA-256 | `dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b` | `sha256sum -c` on the bundle inside the orphan clone → `OK` |
| Independent restore rehearsal | Clone orphan branch → clone from bundle → checkout baseline → tree matches | Full log recorded in `recovery-manifest.md §A` |
| Bundle removed from release branches | `release/project-1-frontend` and `release/project-1-apps-script` do not contain the 33 MB binary | Listed below (§C) |
| Previous recovery references preserved | Local tag `pre-project-1-prod-2026-11-09-66efe6a` + remote branch ref both still resolve to `66efe6a…` | Previously verified; unchanged |

Three independent durability layers behind the baseline (named-ref branch, orphan-archive bundle, Netlify platform republish) — each works without the other two.

---

## B. Release candidates (separate, reviewable)

### B.1 Frontend-only candidate

| Field | Value |
|---|---|
| Branch | `origin/release/project-1-frontend` |
| Head commit | `de93d8974879f4094a12feff4e2fec73d41c4ea0` |
| Parent | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` (baseline) |
| Files changed (vs baseline) | `careers.html`, `careers.js`, `styles.css` (3 files total) |
| Findings addressed | H-02 (role dropdown), H-03 (safe Turnstile fallback — **no CAPTCHA bypass**), L-01, L-02, L-03 (quick-interest polish), M-02 (endpoint consolidation) |
| Unapproved / out-of-scope changes | None. The RELEASE-NOTES.md created earlier at repo root was removed (Independent QA G1). |

### B.2 Apps Script-only candidate

| Field | Value |
|---|---|
| Branch | `origin/release/project-1-apps-script` |
| Head commit | `91fb1ed9…` |
| Parent | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` (baseline) |
| Files changed (vs baseline) | `careers-apps-script.gs` (1 file) |
| Findings addressed | H-01 (safe error contract), M-01 (Unicode-aware sanitiser with `\p{L}\p{M}\p{N}` + formula-leader defence), M-05 (admin email scan reminder) |
| **M-04 setSharing** | **Excluded.** Not present as a call, nor as a conditional comment-gate. A short comment at `createFile(blob)` region documents the exclusion rationale. |
| Unapproved / out-of-scope changes | None. The RELEASE-NOTES.md at repo root was removed (Independent QA G1). |

---

## C. Changes vs production baseline

```
origin/release/project-1-frontend vs origin/main:
  careers.html           +167 / -30
  careers.js               +8 / -1
  styles.css              +43 / -0  (new .careers-interest-* selectors only)

origin/release/project-1-apps-script vs origin/main:
  careers-apps-script.gs  +67 / -4
```

Non-scope files confirmed unchanged on both release branches: `index.html`, `main.js`, `apps-script.gs`, `team.html`, `testimonials.js`, `privacy.html`, `terms.html`, `accessibility.html`, `licensing-disclaimer.html`, `styleguide.html`, `_redirects`, `sitemap.xml`, `robots.txt`, `cards/`, `assets/`. `_headers` absent (M-06 still held).

---

## D. Corrected test results

Automated tests live on `origin/audit/project-1-recruitment` under `docs/recruitment-project/tests/` and were authored to execute against both release candidates.

| Suite | Tests | Pass | Fail | Notes |
|---|---|---|---|---|
| `sanitise-cell.spec.js` | 37 | 37 | 0 | Devanagari regression surfaced → sanitiser updated to include `\p{M}`. All variants (ASCII, accented, Scandinavian, CJK, Hindi, curly apostrophe) now preserve input. Formula injection cases (=, +, -, @ leaders) all mitigated. Length cap, null/undefined, whitespace handled. |
| `role-compat.spec.js` | 15 | 15 | 0 | Every interest-form option value matches a role-card `data-role-apply`. Legacy abbreviated values removed from current dropdown. |
| `response-contract.spec.js` | 41 | 41 | 0 | Deployment order A (updated FE + baseline BE) — 9 cases. Deployment order B (baseline FE + updated BE) — 9 cases. Quick-interest subset — 5 cases. H-01 anti-leak: 9 shapes contain no internal exception text. Response-key consistency: 9 shapes carry the `ok` key. |
| `node --check` syntax | 3 | 3 | 0 | `careers.js`, `careers-apps-script.gs`, extracted inline handler. |
| Scope-boundary checks | 15 | 15 | 0 | 13 non-scope HTML/JS/text files + `cards/` + `assets/` confirmed unchanged on both release branches. |
| Cross-reference | 8 | 8 | 0 | Every ID/class used by inline handler exists in HTML. |
| Anti-regression: PII in logs | 2 | 2 | 0 | Only two `console.error` statements in Apps Script; neither reads applicant payload fields. Validated by `grep`. |

**Total: 121 automated assertions, 0 failures.**

Independent reviewer re-ran `sanitise-cell`, `role-compat`, `response-contract` end-to-end and confirmed the pass counts.

### Tests not executed (unverified, not passed)

Per the hardening instruction: unverified items are **not** claimed as passed.

- **Live browser smoke** against the Netlify branch-deploy preview URL — see §E.
- **Real admin email arrives from a synthetic submission** — relies on the user running the Phase 5 preview smoke test; requires a reachable preview URL.
- **Real Drive upload + resume retrieval** — same.
- **Real Apps Script execution** against the new Apps Script candidate — gated on operator redeployment.
- **Drive-sharing-validation test for M-04** — explicitly deferred; M-04 is excluded from the release candidate until this runs.

---

## E. Preview URL and validation evidence — **BLOCKED**

The Netlify branch-deploy URL cannot be retrieved from this session:

1. The MCP Netlify toolset available to this session exposes only `get-counts / get-topk / get-timeseries / get-request-logs / get-request-detail / open-deployments`. All require a `siteId` UUID that is not recorded anywhere in the repo.
2. There is no `netlify-get-projects` tool available in the current session's MCP toolset to resolve the project name → site UUID.
3. Outbound HTTPS to `app.netlify.com` is blocked by the session's egress policy (`getaddrinfo ENOTFOUND app.netlify.com` on `WebFetch`).

**Documented blocker.** The release report does not claim a preview URL, does not fabricate one, and does not treat the branch push as a successful deployment.

**Unblock steps for the user (not operator-executed from this session):**

1. Open `app.netlify.com` → select the Key2Nest site → **Site configuration → General → Site details.**
2. Copy the **Site ID** (UUID format) and share it with the next session OR the operator team.
3. Open the **Deploys** tab → locate the deploy for branch `release/project-1-frontend` (if auto-deploys enabled for `release/*`). Record the deploy URL and deploy ID.
4. If no deploy exists for that branch: **Site configuration → Build & deploy → Branches and deploy contexts → Deploy all branches** (or add `release/*` to the allow-list).
5. Once the preview URL resolves, run the smoke-test checklist in `preview-validation.md §4`.

**Until the preview is reachable, the frontend candidate cannot be visually smoke-tested — this is a CONDITIONAL GO gate, not a NO-GO.** The automated tests cover the code-level contract; the preview covers the rendering layer.

---

## F. Deployment compatibility (A + B)

| Order | Scenario | Result |
|---|---|---|
| A — updated FE first (merged to `main` and Netlify deploys), Apps Script still baseline | 9 response-contract cases | All PASS. Updated FE gracefully handles baseline response shapes (no new `code` field expected). |
| B — Apps Script redeploys first, baseline FE still live | 9 response-contract cases | All PASS. Updated Apps Script returns the baseline-shaped `error` key alongside new `code` fields where added (Turnstile paths), and omits `error` only on the `server_error` branch; baseline FE reads `out.ok !== true` → generic failure, no regression. |
| Interest quick-form subset | 5 cases | PASS both orders. |

Either deployment ordering preserves working form submission for in-flight users. This matches the Independent QA finding.

---

## G. Independent QA verdict

Fresh independent reviewer (non-fork subagent) inspected:
- The exact code diffs of both release candidates.
- H-03 Turnstile safety (no bypass).
- M-04 exclusion.
- Candidate PII handling.
- Deployment compatibility matrix.
- Scope boundary.
- Rollback runbook.

**Verdict (verbatim final line of the independent report):**

```
INDEPENDENT_QA_VERDICT: CONDITIONAL_GO
```

### Gates raised by Independent QA and their resolution

| Gate | Resolution |
|---|---|
| **G1** — `RELEASE-NOTES.md` at repo root would be web-reachable at `/RELEASE-NOTES.md` after merge | **Resolved.** Removed from both release branches. New head SHAs: `de93d89` (frontend), `91fb1ed` (apps-script). Each deletion is a single-file commit with explanation. |
| **G2** — Earlier `release-readiness-report.md` wording described M-04 as "Implemented in code, HELD at `careers-apps-script.gs:188-199`" which conflicts with the split RC state | **Resolved** by this report (`final-release-report.md`). The release candidate `release/project-1-apps-script` has **no** `setSharing` call. The `audit/project-1-recruitment` branch still carries the earlier proposal for reference, but is not a release candidate. |
| **G3** — Any future reintroduction of M-04 must be gated on completing `drive-sharing-validation.md §3 Decision Matrix` | **Procedural.** Captured in `apps-script-release-safety.md §6` and in the release-candidate RELEASE-NOTES commit message. |

Independent QA's findings:
- Diff correctness: in scope. Role-value realignment, H-03 fallback UI, L-01/L-02/L-03 handler refinements, M-02 endpoint hoist, five new `.careers-interest-*` selectors — nothing else.
- H-03: No code path bypasses or weakens the Turnstile gate. Server-side `verifyTurnstile` remains required; the client never fabricates a token or lets the server submit proceed without a real token.
- M-04 exclusion: confirmed absent from the release-candidate code — not even as a conditional gate.
- PII handling: payload never reaches `console.error`; `fetch` targets only the Apps Script `/exec`; email `replyTo` sanitised.
- Scope boundary: all non-scope files confirmed unchanged.
- Rollback: All documented paths are complete, non-destructive to applicant data, destructive git operations gated on explicit approval.

---

## H. Rollback steps (summary; full in `rollback-runbook.md`)

### Frontend rollback (if `release/project-1-frontend` merged and the live site regresses)

1. Fastest — **Netlify Publish deploy** on the previous production deploy (commit `66efe6a`).
2. Audit trail — `git revert <merge-sha>` on `main`, push.
3. Last resort — `git reset --hard origin/backup/project-1-prod-2026-11-09-66efe6a` on `main`, `--force-with-lease` push. Explicit approval only.
4. Offline — clone from `origin/backup/project-1-bundle-archive` → restore baseline tree → push.

### Apps Script rollback (if `release/project-1-apps-script` deployed and backend regresses)

1. Apps Script editor → **Deploy → Manage deployments → ✏️ → Version: select prior version → Deploy**.
2. If prior version missing from history: paste `careers-apps-script.gs` from commit `66efe6a` into the editor and deploy a new version.

Both rollback paths are rehearsed non-destructively on 2026-11-09:
- Backup branch resolves → `66efe6a` ✓
- Bundle integrity → OK ✓
- Orphan-branch clone → bundle-clone → baseline tree restored ✓
- Live production rollback deliberately **not** executed (would require a production change to rehearse).

---

## I. Remaining risks + approvals required

### Remaining risks (listed honestly, not blocking)

1. **Preview URL unverified from this session.** Code-level tests pass, but no end-to-end live-browser verification has been executed. The user (or an operator with Netlify dashboard access) must run `preview-validation.md §4` smoke-test manually before authorising the frontend merge to `main`.
2. **Apps Script redeploy is manual.** The release candidate is in the repo; the operator pastes-and-deploys. There is no automation that can redeploy for them. Failure to carry the file across verbatim is the single highest residual risk — mitigated by (a) a short diff (+67/-4), (b) the operator-sign-off block in `apps-script-release-safety.md §7`, and (c) one-click version rollback within Apps Script.
3. **Drive folder current sharing posture unverified** (M-04 is excluded for this reason). The audit flagged this as a hardening opportunity; the release deliberately does not change Drive permissions. Follow-up: run `drive-sharing-validation.md` in an isolated test project; if the result says "deploy M-04", branch from `release/project-1-apps-script` and prepare a new release candidate.
4. **Netlify slug confirmation.** `HANDOFF.md` lists `gilded-peony-fba821` but the user previously observed a 404 on that slug after the custom-domain mapping. The release does not depend on the slug value; the Netlify dashboard is the authoritative source.

### Approvals required to go live

Each is an independent gate:

| Gate | Who | What they authorise |
|---|---|---|
| **G-A** | User | Preview smoke test passes on the Netlify branch-deploy of `release/project-1-frontend` → authorises merge of `release/project-1-frontend` → `main`. |
| **G-B** | User | Approves the Apps Script redeploy of `release/project-1-apps-script` per `apps-script-release-safety.md §3`. |
| **G-C** | User | (Optional, future) Authorises M-04 reintroduction **only** after `drive-sharing-validation.md` Decision is recorded. |

None of these gates are satisfied at the time of this report. **Production is unchanged.**

---

## J. Release recommendation

**CONDITIONAL GO.**

- Code level: ready. Both release candidates are minimal, reviewable, scoped, and test-covered.
- Backup + rollback: ready. Durable storage on GitHub, independently verified restoration, documented rollback paths for both the frontend and the Apps Script.
- Independent QA: CONDITIONAL_GO, three gates — G1 resolved, G2 resolved by this report, G3 captured in operational docs.

Outstanding (conditions on moving from CONDITIONAL to live):

1. **G-A** — Preview smoke test of `release/project-1-frontend` via the Netlify branch-deploy URL (user action: enable branch deploys for `release/*` if not already; run `preview-validation.md §4`).
2. **G-B** — Apps Script redeploy per `apps-script-release-safety.md §3` (operator action).

Production state at this moment:

- `origin/main` = `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` — unchanged.
- `www.key2nesthomeloans.com` — unchanged.
- Careers Apps Script `/exec` — unchanged.
- Applications sheet schema — unchanged.
- Drive folder permissions — unchanged.
- Applicant data — untouched.

**No merge into `main`, no redeploy of the Apps Script, no production publish has been performed by this session.**
