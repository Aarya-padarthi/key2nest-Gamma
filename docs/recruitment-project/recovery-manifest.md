# Key2Nest — Project 1 Recovery Manifest

**Project:** Recruitment Infrastructure audit / remediation
**Baseline:** Live production, 2026-11-09, pre-Project-1
**Prepared:** 2026-11-09

This manifest is the recovery contract for Project 1. If anything goes wrong at any later phase, the commands and references here restore the production website and backend to the exact state live at the time of preparation.

---

## A. Production source baseline

| Field | Value |
|---|---|
| Hosting provider | Netlify (git auto-deploy from `main`) |
| Production branch | `main` on `github.com/Aarya-padarthi/key2nest-Gamma` |
| Production commit SHA | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` |
| Production tree SHA | `e29358e69129b6026b5e87c37299e2466ee1de35` |
| Commit subject | `Release: Life at Key2Nest, Google Reviews testimonials, careers refinements` |
| Commit author date | 2026-11-05 22:47:10 +0000 |
| Remote URL | `https://github.com/Aarya-padarthi/key2nest-Gamma` |
| Working tree at time of baseline | Clean — no uncommitted changes, no untracked files, no stash |
| Local HEAD vs `origin/main` | Both resolved to `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` |

### Backup references (created this session)

| Ref kind | Name | Points at | Where |
|---|---|---|---|
| Local annotated tag | `pre-project-1-prod-2026-11-09-66efe6a` | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | Local only — **tag push to origin returned HTTP 403** (git-over-proxy denies raw-tag writes). |
| Backup branch (local + remote) | `backup/project-1-prod-2026-11-09-66efe6a` | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | Local **and** pushed to `origin/backup/project-1-prod-2026-11-09-66efe6a` — durable on GitHub. |

#### Remote verification (recorded)

```
$ git ls-remote origin refs/heads/backup/project-1-prod-2026-11-09-66efe6a
66efe6a3466503747f7f3495ac6ffa6b661cf5ba  refs/heads/backup/project-1-prod-2026-11-09-66efe6a
```

**Policy on this ref:** `backup/project-1-prod-2026-11-09-66efe6a` must not be deleted, reset, moved, or force-pushed by any process until Project 1 is signed off as complete and a subsequent post-release baseline is preserved. If it needs to be rotated, create a new dated backup branch pointing at the same commit before removing the old one.

### Recovery archive (git bundle)

| Field | Value |
|---|---|
| **Durable location (authoritative)** | Orphan branch `origin/backup/project-1-bundle-archive`, path `backups/key2nest-prod-2026-11-09-66efe6a.bundle` + `.sha256` |
| Branch head SHA | `b87232ffa102942997bcdb79212d1cf584a7ac5b` (verified by `git ls-remote origin refs/heads/backup/project-1-bundle-archive` on 2026-11-09) |
| Size | 33,022,730 bytes |
| Hash algorithm (bundle internal) | SHA-1 |
| SHA-256 of bundle file | `dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b` |
| Refs contained | `refs/heads/main`, `refs/heads/claude/key2nest-review-d0ywn8`, `refs/heads/backup/project-1-prod-2026-11-09-66efe6a` |
| Bundle verification | `git bundle verify`: *"The bundle records a complete history. The bundle is okay."* |

#### Durable storage — on GitHub, outside any release branch's working tree

The bundle and its checksum live on a dedicated **orphan branch** `backup/project-1-bundle-archive` (root commit `b87232f…`). An orphan branch shares no history with `main`, `audit/project-1-recruitment`, or the split release candidates, so merges never drag the 33 MB binary into a release-candidate tree. The branch itself is a durable storage location on GitHub — no deletion policy applies to branches on this repository, and the branch is excluded from the Phase 3 release branches.

Three independent durability layers now stand behind this baseline:

1. **Primary (always available)** — the named backup ref `origin/backup/project-1-prod-2026-11-09-66efe6a` points at commit `66efe6a` directly (no bundle required).
2. **Secondary (offline-capable)** — the bundle on `origin/backup/project-1-bundle-archive` provides a self-contained restore that does not require history traversal through any other branch.
3. **Tertiary (platform)** — the Netlify deploy of `66efe6a` can be re-published via the dashboard without touching the repo.

#### Independent recovery verification (recorded 2026-11-09)

```
git clone --branch backup/project-1-bundle-archive --single-branch --depth 1 \
    https://github.com/Aarya-padarthi/key2nest-Gamma.git k2n-indep-verify
# Clone succeeded.

cd k2n-indep-verify
sha256sum -c backups/key2nest-prod-2026-11-09-66efe6a.bundle.sha256
# Result: key2nest-prod-2026-11-09-66efe6a.bundle: OK

git bundle verify backups/key2nest-prod-2026-11-09-66efe6a.bundle
# Result: "The bundle records a complete history. The bundle is okay."

git clone backups/key2nest-prod-2026-11-09-66efe6a.bundle restored
cd restored
git checkout 66efe6a3466503747f7f3495ac6ffa6b661cf5ba
git rev-parse HEAD^{tree}
# Result: e29358e69129b6026b5e87c37299e2466ee1de35   (matches baseline tree SHA)

ls -la careers.html careers.js careers-apps-script.gs testimonials.js
# Result: all four Project 1 files restored at their baseline byte sizes.
```

**Verification result: PASS** — the production baseline is fully recoverable from the orphan archive branch alone, without any dependency on temporary session storage, the audit branch, or the live `main`.

#### Previous bundle location (superseded)

The bundle was briefly committed to `docs/recruitment-project/backups/` on the audit branch between commits `1cdbd5d` → `<the removal commit>`. It is removed from the audit branch starting with that commit. Earlier commits on the audit branch that contain the blob are preserved (no history rewrite); they are no longer required for recovery since the orphan branch is authoritative.

---

## B. Deployment recovery

| Item | Value |
|---|---|
| Hosting provider | Netlify |
| Production site (custom domain) | `key2nesthomeloans.com` and `www.key2nesthomeloans.com` |
| Netlify site slug (per HANDOFF.md) | `gilded-peony-fba821.netlify.app` — **unverified this session**; may have been renamed when the custom domain was mapped |
| Netlify deploy ID (current prod) | **Unknown from this session** — visible only in the Netlify dashboard (`app.netlify.com` → Site → Deploys) |
| Netlify project / team | Owned by client Netlify account — not accessible from this session |
| Build command | None (static passthrough; no build step required) |
| Publish directory | Repo root |
| Netlify-held rollback mechanism | Each prior successful deploy is retained; any entry in the Deploys list can be re-published via **"Publish deploy"** without a new build. **This is the preferred rollback.** |

### Rollback procedures (ordered: least-risk → most-invasive)

#### Option 1 — Netlify "Publish deploy" (fastest, zero repo change)

1. User opens `app.netlify.com` → Key2Nest site → **Deploys** tab.
2. Locates the deploy associated with commit `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` ("Release: Life at Key2Nest, Google Reviews testimonials, careers refinements").
3. Clicks **⋯ → Publish deploy**.
4. Production is served from `66efe6a` within ~30 seconds. Repo `main` is unchanged.

Use when: a Project 1 release looks wrong on production and must be reverted immediately without waiting for a repo push to rebuild.

#### Option 2 — `git revert` on `main` (full audit trail in repo)

Executed from a clean workstation on `main`:

```bash
git fetch origin
git checkout main
git reset --hard origin/main                      # Only if local main is behind / dirty
git revert --no-edit <release-commit-sha>         # Creates a new commit undoing the release
git push origin main
```

Netlify auto-builds the new HEAD. Prior prod commit (`66efe6a`) still exists in history.

Use when: platform-level rollback is not available, or an audited revert is required for compliance.

#### Option 3 — Restore from backup branch (invasive, use only if main is corrupted)

```bash
git fetch origin backup/project-1-prod-2026-11-09-66efe6a
git checkout main
git reset --hard origin/backup/project-1-prod-2026-11-09-66efe6a   # Local reset only
git push origin main                              # This is the ONLY case that may require force-with-lease
```

**Only perform Option 3 with explicit written approval.** Force pushing to `main` is destructive to any contributor's unmerged work and should be a last resort.

#### Option 4 — Restore from the recovery bundle (offline, GitHub unavailable)

```bash
git clone key2nest-prod-2026-11-09-66efe6a.bundle key2nest-recovered
cd key2nest-recovered
git checkout 66efe6a3466503747f7f3495ac6ffa6b661cf5ba
# Push to a fresh remote or restore history as required
```

Before using the bundle, re-verify its checksum:

```bash
sha256sum -c key2nest-prod-2026-11-09-66efe6a.bundle.sha256
```

Expected: `key2nest-prod-2026-11-09-66efe6a.bundle: OK`

---

## C. Data & configuration recovery

### C.1 Candidate submissions

| Store | Owner | Change class | Rollback-ability |
|---|---|---|---|
| Google Sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc`, tab **Applications** | Client Google Workspace | Code rollback does **not** remove applicant rows written during a preview/live window | `File → Version history → See version history` in Sheets lets the client restore a prior snapshot |
| Drive folder **"Key2Nest – Resumes"** | Client Google Workspace | Code rollback does **not** remove resume files written during a preview/live window | Drive **Trash** (30-day recovery) + Drive version history |
| `admin@key2nesthomeloans.com` inbox | Client Google Workspace | Code rollback does **not** un-send notification emails | Workspace retention policies; manual delete |

### C.2 Backend configuration (Google Apps Script)

| Item | Value | Change class | Rollback |
|---|---|---|---|
| Careers Apps Script project id | Not disclosed from this session (lives in client Google account) | Script code changes create new deployment versions | **Manage deployments → ⋯ → "Edit"** → change to a prior version. The `/exec` URL stays the same. |
| Web App `/exec` URL (constant for this project) | `AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg` | — | Not applicable unless Apps Script is redeployed with a new URL (explicitly avoid this). |
| Script property: `TURNSTILE_SECRET_KEY` | Secret value lives in Script Properties only | Not visible to code review here; **must not be changed without secret rotation plan** | Rotate via Cloudflare dashboard **only** with explicit authorization; update both the contact and careers scripts in one window to avoid an outage. |

### C.3 Access control (to verify; flagged for Phase 2 audit)

| Resource | Current observed access | Verification needed |
|---|---|---|
| Google Sheet (Applications) | Owned by the admin@ account; sharing posture unknown from this session | **Phase 2:** confirm it is not publicly viewable or link-shared beyond the careers team |
| Drive folder (Resumes) | Created by Apps Script (owned by script-owner account) | **Phase 2:** confirm each uploaded file inherits private-by-default (link visibility: "Restricted") |
| Apps Script Web App | `Execute as: Me`, `Who has access: Anyone` | **Required** for anonymous form POST; Turnstile is the upstream abuse gate — audited in Phase 2 |

### C.4 What this project will NOT change (and so has no rollback risk on)

- Schema of the Applications sheet (columns: Timestamp, Role, Full Name, Email, Phone, City/State, NMLS ID, Resume, Message, Source, Status, Reviewed by, Notes). Project 1 will not alter column order, add/remove columns, or mutate data-validation rules.
- Existing applicant rows and resume files. Project 1 will not read, modify, or delete production applicant data at any point.
- Production secrets (`TURNSTILE_SECRET_KEY`). Project 1 will not touch, read, or reference secret values.
- Apps Script deployment URL. No redeploy will be executed under this project; any proposed backend change is a Phase 2 finding requiring explicit authorization.

---

## D. Recovery prerequisites

To execute any of Options 1–4 above, the responder needs:

1. **GitHub access** (for Options 2, 3) — write to the `aarya-padarthi/key2nest-gamma` repository.
2. **Netlify dashboard access** (for Option 1) — client Netlify account, Key2Nest site role: Owner or Developer.
3. **Google Apps Script editor access** (for any backend change, which Project 1 does **not** require) — client Google account that owns the careers script.
4. **A clean local clone** (for Options 2, 3, 4) — not strictly required for Option 1.

### Recovery verification steps (regardless of path chosen)

1. Confirm `www.key2nesthomeloans.com/careers.html` serves the expected HTML (hard refresh in incognito).
2. Confirm cache-bust rev in the HTML source (`styles.css?v=rev69` is the Project-1-baseline value).
3. Submit a synthetic quick-interest form and confirm it lands in the Applications sheet with Role prefix `Interest — …` and an email to `admin@`.
4. Submit a synthetic full application with a 1-page test PDF and confirm the row + resume file + admin email all land.
5. Observe Netlify's Deploys tab: the published deploy should match `66efe6a` (or the post-rollback commit chosen).

---

## E. Remaining recovery risks (declared)

1. **Netlify slug uncertainty.** If `gilded-peony-fba821.netlify.app` has been renamed, operators consulting this manifest should treat the slug as placeholder and locate the current site in the Netlify dashboard by name. This does not affect recovery — the site-level dashboard is the source of truth.
2. **Session-local bundle.** The bundle in the scratchpad is not independently durable; the GitHub `backup/…` branch is the authoritative durable source. If both GitHub and the scratchpad are simultaneously unavailable, recovery options reduce to: a Netlify "Publish deploy" (if the platform is up), or restoration from any other client-held clone or backup.
3. **Turnstile secret is session-opaque.** This project does not touch the secret and does not need to; rotating it is a separate operational task governed by Cloudflare + Apps Script access.
4. **Applicant data retention.** Any code change that silently discards rejections, duplicates, or validation failures could withhold a submission that would otherwise have been captured. Project 1 explicitly commits to never silently discarding an applicant record.

---

## F. Gate 1 — Readiness to proceed to Phase 2 (audit)

| Requirement | Status |
|---|---|
| Deployed production commit SHA identified and documented | ✅ `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` |
| Full tree SHA recorded | ✅ `e29358e69129b6026b5e87c37299e2466ee1de35` |
| Working tree inspected (cleanliness confirmed) | ✅ clean |
| Backup reference created | ✅ branch + annotated tag (local) |
| Backup reference pushed to a durable remote | ✅ branch pushed to `origin/backup/project-1-prod-2026-11-09-66efe6a` — remote-verified |
| Recovery archive (git bundle) built | ✅ `key2nest-prod-2026-11-09-66efe6a.bundle` |
| Bundle verified (`git bundle verify`) | ✅ complete history, all expected refs |
| SHA-256 checksum generated and recorded | ✅ `dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b` |
| Deployment recovery path documented | ✅ 4 ordered options |
| Data/configuration recovery inventoried | ✅ Sheet, Drive, Apps Script, email |
| Items not changed by Project 1 are declared | ✅ (section C.4) |
| Remaining recovery risks declared | ✅ (section E) |
| Tag push to origin | ⚠️ Blocked (HTTP 403 from proxy) — **branch push accepted**, serves same purpose. No release impact. |

**Gate 1 verdict: PASS** — all source-modification prerequisites are in place. Phase 2 (audit) may proceed. No production or applicant data has been touched to reach this point.
