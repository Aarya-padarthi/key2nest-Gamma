# Key2Nest — Project 1 Recruitment Infrastructure — Environment Inventory

**Scope:** Project 1 only (Recruitment Infrastructure). Non-recruitment code, pages, branding, and design are out of scope and listed for context only.
**Generated:** 2026-11-09
**Prepared by:** Lead engineer / release manager session (Claude Opus 4.7, `session_015JnAvTJGVjoQYvvK3UdKNk`)
**Working directory:** `/home/user/key2nest-Gamma`

---

## 1. Repository

| Field | Value | Evidence |
|---|---|---|
| Remote (origin) | `https://github.com/Aarya-padarthi/key2nest-Gamma` | `git remote -v` |
| Default branch | `main` | `git branch -a`, HEAD reflog |
| Active working branch | `main` | `git branch --show-current` |
| Local HEAD commit | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | `git log -1 --format=%H` |
| Local HEAD tree | `e29358e69129b6026b5e87c37299e2466ee1de35` | `git log -1 --format=%T` |
| `origin/main` commit | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | `git fetch origin main && git rev-parse origin/main` |
| Local vs origin | **In sync** — local HEAD == `origin/main` HEAD | both SHAs match |
| Working tree | **Clean** (no uncommitted changes, no untracked files, no stash) | `git status --short`, `git stash list` |
| Existing tags | **None** on the repo | `git tag -l` returned empty |
| Last 8 commits on main | 66efe6a, fba5b84, 4557650, 2f135f3, 807d903, 99b022a, 011762d, 883f5d6 | `git log --oneline origin/main -8` |

### Branch inventory

- `main` — production branch
- `claude/key2nest-review-d0ywn8` — long-lived dev/staging branch (all improvements shipped through here, squash-merged into main). Still contains the pre-release per-change commits (`44a7dc4`, `6290093`, `f75df87`, etc.) that were squashed into the Project 1 **precursor** release `66efe6a`. **Not to be touched during Project 1.**

### Head commit meaning (Project 1 context)

Commit `66efe6a` ("Release: Life at Key2Nest, Google Reviews testimonials, careers refinements") is the current live production state. It is the baseline all Project 1 work must be measured against.

---

## 2. Application framework and build

| Item | Finding |
|---|---|
| Framework | **Static HTML + vanilla JS + CSS**. No React/Vue/Next.js. |
| Package manager | **None.** No `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb` at repo root. |
| Build step | **None.** Site deploys HTML/CSS/JS as-is. |
| Node version | Not applicable at site level. |
| Dependencies (runtime, via CDN only) | Tailwind CDN (`cdn.tailwindcss.com`), GSAP 3.12.5 (jsdelivr), Google Fonts, Cloudflare Turnstile (`challenges.cloudflare.com/turnstile/v0/api.js`). All loaded directly in HTML; no npm inventory. |
| CI/CD workflows | **None in repo.** No `.github/workflows/` directory. Deployment is Netlify's auto-build-on-push from `main`. |

### Static pages at root (recruitment-relevant + context)

```
careers.html              61,969 B   — /careers page (Project 1 primary)
careers.js                10,583 B   — careers full-application form handler (Project 1 primary)
careers-apps-script.gs    12,176 B   — Google Apps Script backend (Project 1 primary)
testimonials.js           10,583 B   — shared testimonials data + drawer (Project 1-adjacent; last changed in 66efe6a)

index.html               101,415 B   — homepage                      (OUT OF SCOPE for Project 1)
main.js                   51,330 B   — homepage + legacy contact form (OUT OF SCOPE)
styles.css               167,994 B   — SHARED stylesheet              (shared; minimal touches only if essential)
apps-script.gs             7,547 B   — contact form backend           (OUT OF SCOPE)
team.html                 34,222 B   — /team                          (OUT OF SCOPE)
privacy / terms / accessibility / licensing-disclaimer .html          (OUT OF SCOPE)
styleguide.html                                                       (OUT OF SCOPE, noindex)
sitemap.xml, robots.txt, _redirects                                   (OUT OF SCOPE)
```

### Support scripts / tools

- `cards/build.py` — Python generator for /team digital business cards. **Not a runtime site dependency.**

---

## 3. Hosting

| Item | Finding | Evidence |
|---|---|---|
| Provider | **Netlify** (confirmed via `HANDOFF.md` and session history) | `HANDOFF.md:6`, user confirmation earlier in session |
| Netlify site slug (HANDOFF.md) | `gilded-peony-fba821.netlify.app` | `HANDOFF.md:6` |
| Netlify site slug (current, confirmed live) | **Unverified from this session.** Branch-deploy preview at `claude-key2nest-review-d0ywn8--gilded-peony-fba821.netlify.app` returned 404 ("Site not found") when tested on 2026-11-05, suggesting the Netlify site may have been renamed when the custom domain was mapped. User action required to confirm. | Earlier screenshot of 404 page from the user |
| Production domain | `www.key2nesthomeloans.com` and `key2nesthomeloans.com` | HANDOFF.md, canonical URLs in HTML, HTTPS cert live per user screenshots |
| Deployment mechanism | Git-push → Netlify auto-build from `main` | HANDOFF.md, observed behavior each Release in session |
| Build command | None — static passthrough | No `netlify.toml` in repo; no build scripts |
| Deploy history / rollback UI | Netlify "Deploys" dashboard — supports "Publish this version" one-click rollback to any prior deploy | Netlify platform behavior |
| `_redirects` | 5 rewrites for `/team/<slug>` → `/cards/<slug>/index.html` (digital business cards). Not recruitment-related. | `_redirects` |

**Production reachability from this session:** `www.key2nesthomeloans.com` is **not resolvable** from the cloud session's network policy (`ENOTFOUND` on WebFetch). Direct end-to-end live verification of production HTML from this session is therefore **not possible**. Mitigation: visual confirmation happens via the user-side (browser screenshots).

---

## 4. Recruitment infrastructure components

### 4.1 Pages / files in Project 1 scope

| File | Role | Lines | Last touched |
|---|---|---|---|
| `careers.html` | /careers page: quick-interest form, Life at Key2Nest section, 6-card Google Reviews, full application form, role cards | ~1050 | 2026-11-05 (66efe6a) |
| `careers.js` | Full application form: validation, Turnstile, resume upload, submit | 242 | 2026-11-03 (part of 807d903) |
| `careers-apps-script.gs` | Google Apps Script backend: dual-mode (interest / application), Turnstile verify, sheet append, Drive upload, admin@ email | 265 | 2026-11-05 lineage (through 66efe6a's included rewrites) |
| `testimonials.js` | Shared testimonial drawer + data (loaded by both /careers and /index) | 191 | 2026-11-05 (66efe6a) |

### 4.2 Forms on /careers

Both forms share the same **Cloudflare Turnstile** site key `0x4AAAAAADvDb65eLmlL1DhS` and the **same `/exec` endpoint** on the careers Apps Script (dual-mode via `submissionType`).

| Form id | Purpose | Fields | Endpoint | Rate limit? | Duplicate guard? |
|---|---|---|---|---|---|
| `careers-interest-form` | Quick-interest (lightweight inquiry) | name, email, phone (optional), role (optional), Turnstile | careers Apps Script `?submissionType=interest` | **None** | **None** — any inquirer can submit repeatedly |
| `careers-form` | Full application | name, email, phone, city/state, NMLS id (optional), role (hidden, set by Apply button), resume (required, PDF/DOC/DOCX ≤ 5 MB), message (optional), Turnstile | careers Apps Script (no `submissionType` → defaults to "application") | **None** | **Email + role** case-insensitive, server-side |

### 4.3 Backend (Google Apps Script)

| Field | Value / Note |
|---|---|
| Script | `careers-apps-script.gs` (266 lines) |
| Live Deployment Web App URL | `https://script.google.com/macros/s/AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg/exec` |
| Access control on web app | `Who has access: Anyone` (required for anonymous form POST) + Turnstile upstream |
| Spreadsheet id (Applications) | `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` |
| Sheet tab | `Applications` |
| Drive folder for resumes | `Key2Nest – Resumes` (created on first setup) |
| Notification recipient | `admin@key2nesthomeloans.com` (constant `NOTIFY_EMAIL`) |
| Turnstile secret | Server-side Script Property `TURNSTILE_SECRET_KEY` — not committed, not exposed in the client |
| Resume validation | Server-side base64 decode, MIME-type check against `application/pdf` / `application/msword` / `…wordprocessingml.document`, fallback filename-extension check, size ≤ 5 MB. Rejected before any Drive write or email. |
| Record schema (sheet columns) | Timestamp, Role, Full Name, Email, Phone, City/State, NMLS ID, Resume (URL), Message, Source, Status, Reviewed by, Notes |
| Status dropdown values | New, Reviewed, Interview, Offer, Hired, Declined |

### 4.4 Contact-form backend (for context only — OUT OF SCOPE)

Separate Apps Script `apps-script.gs`, separate spreadsheet `1iRjyfZKua4N1Q6RP0ebwkqTxO8Q-WWnXfpPGNgQ7VpY`, notifies `contact@key2nesthomeloans.com`. Deployment: `AKfycbysqolgKHBm0Vh70-s-kx7_zVsa1__9DXfuGLwpjX4RJdW56RMZfHvJE2W7rLnQ_Oma`. **Not touched by this project.**

### 4.5 Front-end dependencies on shared code

- `careers.html` loads `main.js`, `careers.js`, `testimonials.js`, `styles.css`, GSAP, Tailwind CDN, Cloudflare Turnstile, Google Fonts.
- `main.js` holds the Turnstile widget registry (`window.__k2nTs`, `window.__k2nTsRender`) used by the careers full application form.
- `styles.css` is shared across all pages. Project 1 CSS edits must be scoped so they do not affect unrelated pages.

---

## 5. Environment variables / secrets

| Where | Name | Classification | Notes |
|---|---|---|---|
| Google Apps Script "Script Properties" (careers) | `TURNSTILE_SECRET_KEY` | Secret | Not committed. Set once per Apps Script project. |
| Google Apps Script "Script Properties" (contact) | `TURNSTILE_SECRET_KEY` | Secret | Separate project; out of scope. |
| Client-side (bundled into HTML/JS) | Turnstile **site key** `0x4AAAAAADvDb65eLmlL1DhS` | Public (site keys are deliberately public) | |
| Client-side (bundled into JS) | GA4 Measurement ID `G-TLH3F0F15H` | Public | |
| None found in repo | `.env`, `credentials*`, `token*`, `secret*` | — | Searched top level — none present |

Repository `.gitignore` explicitly excludes `node_modules/`, `.claude/settings.local.json`, `.DS_Store`, `*.log`.

---

## 6. Candidate data flow (end-to-end)

### 6.1 Quick-interest form

```
Visitor fills #careers-interest-form (name, email, phone?, role?)
  → Cloudflare Turnstile widget provides token (client-side)
  → POST JSON to careers Apps Script /exec (text/plain; CORS-safe)
     Body: { submissionType: 'interest', name, email, phone, role, message, source, turnstileToken }
  → Apps Script verifies Turnstile (fail-closed)
  → appendRow to "Applications" tab with Role = "Interest — <role>"
  → MailApp.sendEmail → admin@key2nesthomeloans.com
  → Returns JSON { ok: true }
  → Client shows success panel; GA4 event `generate_lead`
```

### 6.2 Full application

```
Visitor clicks "Apply" on a role card → #apply-panel is moved under that role
  → #careers-form is populated with role (hidden field #c-role)
  → Visitor fills name, email, phone, city/state, NMLS (optional), resume, message
  → Turnstile token obtained
  → File → base64 in browser (FileReader)
  → POST JSON to same /exec (text/plain)
     Body: { role, name, email, phone, location, nmls, message, source: 'Careers page',
             turnstileToken, resumeName, resumeType, resumeData (base64) }
  → Apps Script verifies Turnstile
  → Required-field check
  → Duplicate check (email + role, case-insensitive) — if duplicate, returns { ok: false, code: 'duplicate' }
  → Size + type validation on decoded resume bytes
  → Create file in "Key2Nest – Resumes" Drive folder
  → appendRow to "Applications" sheet
  → MailApp.sendEmail to admin@ with resume attachment + Drive URL
  → Returns JSON { ok: true }
  → Client shows success panel; GA4 event `submit_application`
```

### 6.3 Storage locations

- **Primary applicant record:** Google Sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc`, tab "Applications".
- **Resumes:** Google Drive folder "Key2Nest – Resumes" (visibility inherits creator account defaults; **access control review is a Phase 2 item**).
- **Notification archive:** `admin@key2nesthomeloans.com` inbox (Workspace retention governs).
- **Repo:** Zero applicant data stored in the repo.

---

## 7. Production deployment history & rollback capability

| Item | Finding |
|---|---|
| Deployment provider | Netlify, auto-build on push to `main` |
| Deployment identifier available in this session | Current `main` commit SHA (`66efe6a…`). Netlify deploy IDs can be observed only via the Netlify dashboard. |
| Prior deploys preserved by platform | Yes — Netlify's "Deploys" list retains each prior build with its commit, and each entry exposes a one-click "Publish deploy" rollback. |
| Rollback via code | `git revert <sha>` → push to `main` → Netlify re-builds. Non-destructive. |
| Rollback via platform | Netlify dashboard → Deploys → prior green deploy → "Publish deploy". No repo change required. |
| Backup references in the repo today | None (`git tag -l` returned empty). Phase 1 will add `pre-project-1-prod-2026-11-09-66efe6a`. |

---

## 8. External service dependencies (recruitment-relevant)

| Service | Purpose | Account owner | Managed where |
|---|---|---|---|
| Google Workspace (Apps Script, Sheets, Drive, Mail) | Careers backend | Client (project owner's Google account) | Apps Script console |
| Cloudflare Turnstile | Bot verification on both forms | Client Cloudflare account | dash.cloudflare.com |
| Netlify | Static site hosting + branch previews | Client Netlify account | app.netlify.com |
| GoDaddy / DNS provider for key2nesthomeloans.com | Custom domain | Client | DNS provider |
| Google Analytics 4 (G-TLH3F0F15H) | Analytics | Client | GA4 console |

---

## 9. Known limitations of this session's observational access

The following verifications require either the user's live browser, direct Netlify/Google dashboard access, or an allowlisted network path — none of which are available from this cloud session. These are documented, not inferred:

1. **Live production HTML fetch:** `www.key2nesthomeloans.com` is not resolvable from this network. Production content checks fall back to repo-state inspection + user-side screenshots.
2. **Netlify deploy history / site-slug confirmation:** `app.netlify.com` is not reachable. The HANDOFF.md-recorded slug `gilded-peony-fba821` may be stale — the user reported a 404 on branch-deploy preview URLs on 2026-11-05, which is consistent with a renamed site. User action required to confirm current slug and deploy IDs.
3. **Apps Script console / Script Properties:** `script.google.com` is not reachable. Deployment version and property-key presence can be confirmed only by the user opening the Apps Script editor.
4. **Drive folder permissions / Sheet sharing scope:** `drive.google.com`, `docs.google.com` not reachable. The access-control posture of "Key2Nest – Resumes" and the Applications sheet is **unverified from this session** and will be flagged as a Phase 2 audit item.
5. **Live email delivery:** no SMTP egress and no mail inspection from this session.
6. **Turnstile dashboard / hostname allowlist:** not reachable from this session.

Each of these is flagged in Phase 2 audit and gated accordingly.

---

## 10. Scope boundary (reaffirmed)

Project 1 touches: `careers.html`, `careers.js`, `careers-apps-script.gs`, `testimonials.js` (only the loader/handlers already used by /careers), and — **only when a shared-file change is truly essential** — scoped additions to `styles.css` with before/after evidence that no unrelated page is affected.

Out of scope and not to be modified: `index.html`, `main.js`, `apps-script.gs`, `team.html`, `styleguide.html`, `privacy.html`, `terms.html`, `accessibility.html`, `licensing-disclaimer.html`, `_redirects`, `sitemap.xml`, `robots.txt`, `cards/*`, `assets/*`, `styles.css` edits that affect anything beyond the recruitment components.

If a Project 1 fix is found to require an out-of-scope change, that specific change will be held and reported for explicit authorization per the user's standing instruction.
