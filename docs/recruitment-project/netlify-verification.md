# Key2Nest — Netlify Project Verification (Phase A)

**Performed:** 2026-11-09 — read-only MCP `netlify-open-deployments` only.
**Site ID provided by project owner:** `0b000aea-f79e-4bc3-ab81-53e4f692b632`

---

## 1. Project identity

| Field | Value | Source |
|---|---|---|
| Netlify Site ID | `0b000aea-f79e-4bc3-ab81-53e4f692b632` | Provided by project owner |
| Site slug | `gilded-peony-fba821` | MCP `project.name` for the site ID |
| Netlify team name | `Aarya-padarthi's team` | MCP `project.teamName` |
| Netlify team URL | `https://app.netlify.com/teams/aarya-padarthi/overview` | MCP `project.teamUrl` |
| Site admin URL | `https://app.netlify.com/sites/0b000aea-f79e-4bc3-ab81-53e4f692b632/deploys/…` | Derived from admin URL pattern in MCP response |

**Observation.** The slug `gilded-peony-fba821` matches the value recorded in `HANDOFF.md` on 2026-07-04. The slug was **not** renamed when the custom domain was mapped. The earlier 404 on `https://audit-project-1-recruitment--gilded-peony-fba821.netlify.app/` was therefore not a slug issue — it was a branch-deploy configuration issue (see §3 below).

---

## 2. Production deployment identification

| Field | Value | Source |
|---|---|---|
| Current production deploy ID | `6aed0771bc2340cb535a91f6` | MCP (most-recent `context=production` deploy, state `ready`) |
| Production deploy snapshot URL | `https://6aed0771bc2340cb535a91f6--gilded-peony-fba821.netlify.app/` | MCP `deployUrl` |
| Netlify admin URL for this deploy | `https://app.netlify.com/sites/0b000aea-f79e-4bc3-ab81-53e4f692b632/deploys/6aed0771bc2340cb535a91f6` | MCP `adminUrl` |
| Deploy state | `ready` | MCP `state` |
| Deploy created | `2026-11-05T22:47:13.040Z` | MCP `createdAt` |
| Deploy branch | `main` | MCP `branch` |
| Deploy context | `production` | MCP `context` |
| Deploy title (commit subject + body) | `Release: Life at Key2Nest, Google Reviews testimonials, careers refinements` | MCP `title` |

**Deployed-commit identification.** The MCP response does not include an explicit commit SHA for the deploy. Two cross-checks confirm the deploy is built from `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`:

1. **Title match (body):** The deploy's `title` is the complete multi-paragraph commit message of `66efe6a` character-for-character. (Verified by comparing against `git show -s --format=%B 66efe6a3466503747f7f3495ac6ffa6b661cf5ba`.)
2. **Timestamp proximity:** `git show -s --format=%ci 66efe6a` is `2026-11-05 22:47:10 +0000`. The Netlify deploy's `createdAt` is `2026-11-05T22:47:13.040Z` — **three seconds later**, consistent with the auto-build trigger after the push.

Accepted: the current production deploy is built from `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`.

---

## 3. Recent deploy inventory (last 5 from MCP)

| # | Deploy ID | State | Branch | Context | Created | Commit evidence |
|---|---|---|---|---|---|---|
| 1 | `6aed0771bc2340cb535a91f6` | ready | main | production | 2026-11-05 22:47 Z | 66efe6a — "Life at Key2Nest, Google Reviews testimonials, careers refinements" |
| 2 | `6aec8cb5cbfe01717e9300ab` | ready | main | production | 2026-11-05 14:03 Z | fba5b84 — "Release: add New Jersey to the licensed-states footprint" |
| 3 | `6aea5cc9cd51d0beddde930f` | ready | main | production | 2026-11-03 22:14 Z | 4557650 — "Release: add Colorado + Oklahoma to the licensed-states footprint" |
| 4 | `6aea51608750a731d47553e4` | ready | main | production | 2026-11-03 21:25 Z | 2f135f3 — "Release: footer LinkedIn + Instagram social icons" |
| 5 | `6aea45c8de324bddf4cafb9f` | ready | main | production | 2026-11-03 20:36 Z | 807d903 — "Release: careers quick-interest form + admin@ routing fix" |

**Every one of the 5 most recent deploys has `context=production` and `branch=main`.**

---

## 4. Branch deployments — ❌ **absent**

### 4.1 `release/project-1-frontend` deploy status

**No deploy for branch `release/project-1-frontend` appears in the 5 most recent deploys.** The branch was pushed to `origin` on 2026-11-09 at commit `de93d89f65647f5d72b70e02449e83e20b7c6e98` (plus an earlier commit `0270fa6` at the same session, since reverted). No matching Netlify build ran.

### 4.2 `audit/project-1-recruitment` deploy status

Not present in the recent list either (branch has been receiving commits across several days of this audit).

### 4.3 Any branch deploy at all

**None visible.** The MCP response shows only `branch=main` across the entire visible window, with `context=production` throughout. No `branch-deploy` context, no `deploy-preview` context.

### 4.4 Interpretation

Conclusion: **branch deploys are not enabled on this site.** Only pushes to `main` trigger Netlify builds. The push of `release/project-1-frontend` to GitHub did not automatically create a Preview. This matches the user's earlier observation of a 404 at the branch-preview URL.

**`hasActiveDeploys: false` at the time of this check** — no deploy is currently building.

Enabling branch deploys requires changing Netlify site configuration (**Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys**). Per the instruction set §3: "**Do not enable branch deployments or trigger a build.**" This change is **not** authorised by Approval A or B — it would fall under **Approval C** (NOT AUTHORIZED).

---

## 5. Required-item verification checklist

| Section-3 verification item | Finding | Source |
|---|---|---|
| 1. Project name and identity | `gilded-peony-fba821` under Aarya-padarthi's team | MCP |
| 2. Associated production domain | `www.key2nesthomeloans.com` not returned by this MCP operation. See §6. | — |
| 3. Repository connection | Not returned by this MCP operation. Inferred from HANDOFF.md + commit-subject matches. | HANDOFF.md |
| 4. Production deployment identifier | `6aed0771bc2340cb535a91f6` | MCP |
| 5. Production deployment commit | `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` | Title + timestamp cross-check |
| 6. Available branch deployments | **None visible** | MCP (all 5 deploys = main/production) |
| 7. Existing Preview deployments | **None** | MCP (no branch/deploy-preview context) |
| 8. Deployment URLs and statuses | §3 table | MCP |
| 9. `release/project-1-frontend` deployment | **Does not exist** | MCP + §4.1 |
| 10. Deployed commit matches candidate | N/A (no deployment exists for the candidate) | — |

---

## 6. Items this MCP operation does not expose

The `netlify-open-deployments` tool is one of three available Netlify MCP operations. It returns the fields used above; it does not expose:

- Explicit commit SHA for a deploy (we cross-check via title + timestamp).
- Site's custom domains or domain-mapping state.
- Build settings (branch filter, deploy context allow-list, build command).
- Environment variables defined on the site (including `context=branch-deploy` specifics).
- Repository connection URL.
- Netlify deploy hooks / build hooks.

None of these are needed to produce the verified facts in §1–§4. The Netlify admin dashboard provides them via a user-side browse.

---

## 7. Verdict for Phase A

**Project identity and the production deploy state are fully verified from the authorised read-only MCP tool.** No preview/branch deploy for `release/project-1-frontend` exists on the Netlify side. Phases B and C (preview isolation and frontend browser acceptance) are consequently **BLOCKED** — there is no preview to assess or inspect.

The minimal change required to unblock them (enabling `release/*` branch deploys in Netlify site config, or publishing a one-off manual deploy for the branch) is explicitly withheld under Approval C and must be requested separately.
