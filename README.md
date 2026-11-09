# Key2Nest — Project 1 Backup Archive (orphan branch)

**Purpose:** Durable on-GitHub storage for the Project 1 pre-audit production recovery bundle. Kept on a dedicated orphan branch so the 33 MB binary never lives in a release-candidate branch's active tree.

## Contents

```
backups/
├── key2nest-prod-2026-11-09-66efe6a.bundle        — complete git bundle
└── key2nest-prod-2026-11-09-66efe6a.bundle.sha256 — SHA-256 checksum
```

## Baseline

- **Commit:** `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`
- **Tree:** `e29358e69129b6026b5e87c37299e2466ee1de35`
- **Live on:** `www.key2nesthomeloans.com` at the time this archive was cut (2026-11-09).

## Bundle integrity

The checksum file records:

```
dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b  key2nest-prod-2026-11-09-66efe6a.bundle
```

## Retrieval

Clone this orphan branch sparsely — the archive is self-contained:

```bash
git clone --branch backup/project-1-bundle-archive --single-branch \
    --depth 1 https://github.com/Aarya-padarthi/key2nest-Gamma.git \
    k2n-backup-archive
cd k2n-backup-archive

# Verify integrity BEFORE using the bundle
sha256sum -c backups/key2nest-prod-2026-11-09-66efe6a.bundle.sha256
# Expect: key2nest-prod-2026-11-09-66efe6a.bundle: OK

# Clone the production baseline from the bundle
git clone backups/key2nest-prod-2026-11-09-66efe6a.bundle restored
cd restored
git checkout 66efe6a3466503747f7f3495ac6ffa6b661cf5ba
git rev-parse HEAD^{tree}   # expect: e29358e69129b6026b5e87c37299e2466ee1de35
```

## Cross-reference — other recovery paths

| Primary path | `origin/backup/project-1-prod-2026-11-09-66efe6a` → 66efe6a… — branch ref on this repository |
| Offline path | This branch's `backups/` directory (works without GitHub once cloned) |
| Platform path | Netlify dashboard → Deploys → the 2026-11-05 deploy of 66efe6a — one-click "Publish deploy" |

## Policy

**Do not delete, rebase, or force-push this branch.** Create a new dated archive branch (e.g. `backup/project-1-bundle-archive-YYYYMMDD`) if a new baseline needs to be captured; retire the old one only after the retirement is logged in `docs/recruitment-project/recovery-manifest.md` on the audit branch.
