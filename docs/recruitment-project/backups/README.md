# Recovery bundle — moved to durable storage

The 33 MB Git bundle previously stored here has been moved to the dedicated
orphan branch `backup/project-1-bundle-archive` to keep this release branch
reviewable.

## Retrieval

```bash
git clone --branch backup/project-1-bundle-archive --single-branch --depth 1 \
    https://github.com/Aarya-padarthi/key2nest-Gamma.git k2n-backup-archive
cd k2n-backup-archive
# backups/key2nest-prod-2026-11-09-66efe6a.bundle              (33 MB)
# backups/key2nest-prod-2026-11-09-66efe6a.bundle.sha256       (checksum)
```

Full restore procedure, integrity verification, and policy notes:
`docs/recruitment-project/recovery-manifest.md` on this branch.
