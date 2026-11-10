# tools/

Small operator utilities for the Key2Nest repo. These do not ship in a web
build and are read-only against the working tree (or a named git ref).

## `preview-guard.sh`

Detects preview-contamination in a tree that is destined for production.

The isolated-preview branch `release/project-1-frontend-preview` carries
code and configuration (`preview-config.js`, GA4-stubbed `careers.html`,
`Disallow: /` robots.txt, etc.) that is dangerous if it ever lands on
`main`. This script enumerates every artefact a production tree must not
have and fails with a labelled error for each one it finds.

### Usage

```sh
# Scan the current working tree.
bash tools/preview-guard.sh

# Scan a specific ref (branch or SHA) without touching the working tree.
bash tools/preview-guard.sh --ref main
bash tools/preview-guard.sh --ref release/project-1-frontend
bash tools/preview-guard.sh --ref release/project-1-frontend-preview

# Machine-readable output.
bash tools/preview-guard.sh --ref main --json
```

### Exit codes

- `0` — no preview contamination detected.
- `1` — at least one contaminant found. Prints `preview-guard: FAIL (tree=<ref>)`
  followed by one `file: message` line per detection.
- `2` — invalid arguments.

### What it checks

| # | File | Signal |
|---|------|--------|
| 1 | `preview-config.js` | file exists |
| 2 | `careers.html` | contains `preview-config.js` |
| 3 | `careers.html` | contains `k2n-preview-banner` |
| 4 | `careers.html` | contains `__k2nIsPreview` |
| 5 | `careers.html` | contains the preview GA4 no-op stub |
| 6 | `careers.js` | production `CAREERS_ENDPOINT` literal missing |
| 7 | `careers.js` | preview-style fail-closed `getCareersEndpoint()` present |
| 8 | `robots.txt` | contains `Disallow: /` |
| 9 | `_redirects` | contains `/tests/*` rule |
| 10 | `tests/preview-fail-closed.spec.js` | file exists |

### Expected results against this repo

```
preview-guard.sh --ref main                                → PASS
preview-guard.sh --ref release/project-1-frontend          → PASS
preview-guard.sh --ref release/project-1-frontend-preview  → FAIL (10 items)
```

### How to enforce in CI (requires a separate approved change on `main`)

Add `.github/workflows/no-preview-on-main.yml` on the `main` branch with:

```yaml
name: no-preview-on-main
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash tools/preview-guard.sh
```

This repo does not add that workflow on `main` as part of the preview
preparation; adding it is a one-time production-side change that must be
approved separately. Until it is, the script is still available locally
for a human operator to run before any merge.
