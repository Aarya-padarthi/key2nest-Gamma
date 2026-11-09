# Key2Nest — Netlify site discovery log (2026-11-09)

**Objective.** Resolve the Key2Nest Netlify site UUID via supported, read-only methods so the branch-deploy preview URL for `release/project-1-frontend` can be verified from this session.

**Outcome: BLOCKED. No authorised read-only path exposes the site UUID.**

The following discovery paths were tried, in order; each result is recorded verbatim.

---

## Path 1 — Netlify MCP tools in the current session

Available Netlify MCP operations:
- `netlify-open-deployments(siteId: UUID)` — requires a `siteId` UUID as input.
- `netlify-observability-services-reader(siteId: string)` — same.
- `netlify-feedback-services-updater` — write-only, no discovery.

The MCP toolset exposes no `list-projects`, `get-projects`, or `search-sites` operation that would resolve a human-readable project name to a UUID. Verified with `ToolSearch` queries for `"netlify deploy preview"` and `"netlify project site list"`.

**Status:** **cannot proceed without `siteId`.**

---

## Path 2 — Netlify public API (`api.netlify.com`)

Attempted:

```
curl -sS "https://api.netlify.com/api/v1/sites/gilded-peony-fba821.netlify.app"
```

Result:

```
curl: (56) CONNECT tunnel failed, response 403
agent-proxy: api.netlify.com:443 — connect_rejected (the egress proxy refused the connection)
```

**Status:** host blocked by session egress policy.

---

## Path 3 — Netlify dashboard (`app.netlify.com`)

Not reachable from this session (earlier `WebFetch` attempt returned `ENOTFOUND`).

---

## Path 4 — `netlify` CLI

Not installed. Pre-configured proxy CLIs are only `bq`, `gcloud`, `gh`, `gsutil` per `__agentproxy/status`.

---

## Path 5 — GitHub commit statuses on `main` HEAD `66efe6a…`

Netlify's GitHub App, when installed with permissions to post statuses, writes a status with `target_url` pointing at the deploy page. The URL typically contains the site slug.

```
gh api repos/Aarya-padarthi/key2nest-Gamma/commits/66efe6a…/statuses
→ []
```

**Status:** no Netlify statuses found. Either the Netlify ↔ GitHub integration is configured to use the direct Git provider polling (no status writes), or status writes are suppressed. Either way, no site identifier emerges.

---

## Path 6 — GitHub Check Runs on `main` HEAD

```
gh api repos/Aarya-padarthi/key2nest-Gamma/commits/66efe6a…/check-runs
→ { "total_count": 0, "check_runs": [] }
```

**Status:** no Netlify check runs. Same inference as Path 5.

---

## Path 7 — GitHub Deployments API

```
gh api repos/Aarya-padarthi/key2nest-Gamma/deployments
→ []
```

**Status:** empty. The Netlify integration is not creating GitHub Deployments entries.

---

## Path 8 — GitHub Apps installation metadata

```
gh api repos/Aarya-padarthi/key2nest-Gamma/installation
→ 401 "A JSON web token could not be decoded"
```

**Status:** blocked by this session's GitHub token scope.

---

## Path 9 — Repository webhooks (Netlify webhook URL contains the site id)

```
gh api repos/Aarya-padarthi/key2nest-Gamma/hooks
→ 403 "Access to this GitHub API path is not permitted through this proxy."
```

**Status:** blocked by the GitHub proxy policy for this session type.

---

## Path 10 — Repo-side Netlify configuration files

- `netlify.toml` — not present.
- `.netlify/` directory — not present.
- Repository `homepage` field — unset.
- Workflow files (`.github/workflows/`) — none.
- `CODEOWNERS` — none.
- Environment variables — no `NETLIFY_SITE_ID`, no `SITE_ID`, no `NETLIFY_*` variables present in the session environment.

**Status:** repo stores no Netlify site identifier.

---

## Path 11 — `HANDOFF.md`-recorded slug

The repository's `HANDOFF.md` records:

```
Deployed: https://gilded-peony-fba821.netlify.app
```

This slug was last verified by the project owner on 2026-07-04. It may still be live, or it may have been renamed when the custom domain `www.key2nesthomeloans.com` was mapped. The user previously reported a 404 on the branch-deploy preview URL built from this slug pattern:

```
https://audit-project-1-recruitment--gilded-peony-fba821.netlify.app/
→ Site not found (Netlify Internal ID: 01M6PS3271XNWBT0KFPVGS6FPD)
```

A 404 on a branch-deploy URL can mean three things: (a) the slug is wrong, (b) the slug is right but branch deploys are not enabled for this branch name pattern, or (c) the build is still in progress / errored.

**Status:** inconclusive. The slug alone is not a UUID and cannot be used as an input to the Netlify MCP tools.

---

## Minimal user action to unblock Preview verification

Perform **one** of the following and share the result with the next session:

### Option A — Share the site UUID (preferred)

1. Open `https://app.netlify.com`.
2. Select the Key2Nest site.
3. **Site configuration → General → Site details.**
4. Copy the **Site ID** (a UUID, e.g. `12345678-1234-1234-1234-123456789012`).

Once shared, the `netlify-open-deployments` MCP tool can list the branch deploys for `release/project-1-frontend` with their deploy URLs and statuses.

### Option B — Share the current site slug (if B.1 is not available)

1. `https://app.netlify.com` → Key2Nest site → **Site configuration → General → Site details.**
2. Copy the **Site name** (the slug — e.g. `cheerful-llama-abc123`).

With the current slug, I can construct the branch-deploy URL pattern:

```
https://release-project-1-frontend--<slug>.netlify.app/
```

The branch slug is normalised: `/` → `-`, so `release/project-1-frontend` becomes `release-project-1-frontend`. A `404` on that URL means branch deploys are not enabled for the `release/*` pattern — step B.3 below enables them.

### Option B.1 — Enable branch deploys for `release/*`

Required even with a correct slug if the branch deploy still 404s:

1. `app.netlify.com` → Key2Nest site → **Site configuration → Build & deploy → Branches and deploy contexts.**
2. **Branch deploys** → change to **Deploy all branches** (or add `release/*` and `audit/*` to the allow-list).

### Option C — Run the Phase 5 smoke-test manually and share the result

If providing a UUID or slug isn't convenient, the smoke-test in `preview-validation.md §4` can be performed by the user directly in their browser:

1. Open the preview URL (user-side navigation to the Netlify dashboard → Deploys → the deploy for `release/project-1-frontend`).
2. Walk through §4.1 (rendering), §4.2 (quick-interest form behaviour), §4.3 (full application), §4.5 (accessibility).
3. Report results back. The code-level tests on the audit branch already cover the contract side (121/0).

---

## Conclusion

Step 1 (Netlify site discovery) is **BLOCKED** from this session using supported, read-only methods only. Session's egress policy denies access to both `app.netlify.com` and `api.netlify.com`. The GitHub paths that Netlify sometimes populates (statuses, check runs, deployments) are empty on this repository. The repo itself stores no Netlify identifier.

**No alternative was attempted that would bypass denied access, expose credentials, create another production site, or change existing deployment settings.** The minimal user action is documented above.
