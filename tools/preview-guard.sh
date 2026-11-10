#!/usr/bin/env bash
# =============================================================================
# Key2Nest — Preview-contamination guard for production builds.
#
# Exits non-zero (and prints a labelled failure) if the CURRENT working tree
# contains any artefact that is only supposed to live on the preview branch
# `release/project-1-frontend-preview`. Intended to run:
#
#   1. Locally, before a merge to `main` is proposed:
#        bash tools/preview-guard.sh
#
#   2. In CI, on every push/PR targeting `main` (requires the script to be
#      present on `main`; adding it there is a separate one-time approved
#      change, out of scope for the preview preparation).
#
#   3. As a pre-commit hook on any branch that intends to be merged to main.
#
# The script is PURELY READ-ONLY. It modifies no files, contacts no services,
# consults no secrets. It fails closed: any detected contaminant is reported
# with its file/line and the overall exit status is 1.
#
# USAGE
#   bash tools/preview-guard.sh                # scan the current working tree
#   bash tools/preview-guard.sh --ref <sha>    # scan the tree at <sha> instead
#   bash tools/preview-guard.sh --json         # machine-readable output
# =============================================================================

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 2

JSON=0
REF=""
while [ $# -gt 0 ]; do
  case "$1" in
    --json) JSON=1; shift ;;
    --ref)  REF="$2"; shift 2 ;;
    -h|--help)
      sed -n '1,30p' "$0"
      exit 0
      ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

# readfile <path>  — prints the file's contents as of either the given --ref
# or the working tree. Prints nothing (silently) if the path does not exist
# at that revision/tree.
readfile() {
  local p="$1"
  if [ -n "$REF" ]; then
    git show "$REF:$p" 2>/dev/null || true
  else
    [ -f "$p" ] && cat "$p" || true
  fi
}

# fileexists <path> — true iff the path exists at the chosen revision/tree.
fileexists() {
  local p="$1"
  if [ -n "$REF" ]; then
    git cat-file -e "$REF:$p" 2>/dev/null
  else
    [ -f "$p" ]
  fi
}

FAILURES=()
record_fail() {
  FAILURES+=("$1")
}

# -----------------------------------------------------------------------------
# Check 1 — preview-config.js must NOT exist at the repo root.
# -----------------------------------------------------------------------------
if fileexists "preview-config.js"; then
  record_fail 'preview-config.js|preview-only config file present at repo root'
fi

# -----------------------------------------------------------------------------
# Check 2 — careers.html must NOT reference preview-config.js.
# -----------------------------------------------------------------------------
HTML="$(readfile careers.html)"
if printf '%s' "$HTML" | grep -qF 'preview-config.js'; then
  record_fail 'careers.html|preview-config.js script tag found'
fi

# -----------------------------------------------------------------------------
# Check 3 — careers.html must NOT contain the PREVIEW banner markup.
# -----------------------------------------------------------------------------
if printf '%s' "$HTML" | grep -qF 'k2n-preview-banner'; then
  record_fail 'careers.html|k2n-preview-banner element present'
fi
if printf '%s' "$HTML" | grep -qF '__k2nIsPreview'; then
  record_fail 'careers.html|__k2nIsPreview reference present'
fi

# -----------------------------------------------------------------------------
# Check 4 — careers.html must NOT carry the GA4 no-op stub (preview-only).
# Production uses the real GA4 loader.
# -----------------------------------------------------------------------------
if printf '%s' "$HTML" | grep -qF 'preview: no-op (GA4 disabled)'; then
  record_fail 'careers.html|preview GA4 no-op stub present (production must use real loader)'
fi

# -----------------------------------------------------------------------------
# Check 5 — careers.js must contain the production CAREERS_ENDPOINT literal
# or an obvious equivalent. On the preview branch this literal is removed
# and the forms depend entirely on preview-config.js.
# (A production build that lost the literal would mean the preview branch
# was accidentally promoted.)
# -----------------------------------------------------------------------------
JS="$(readfile careers.js)"
if ! printf '%s' "$JS" | grep -qE "const CAREERS_ENDPOINT = 'https://script\\.google\\.com/macros/s/.*/exec';"; then
  record_fail 'careers.js|CAREERS_ENDPOINT literal missing — likely a preview-branch tree'
fi
if printf '%s' "$JS" | grep -qE "const getCareersEndpoint = \\(\\) => \\{"; then
  # The preview-style fail-closed getter.
  record_fail 'careers.js|preview-style getCareersEndpoint() getter present'
fi

# -----------------------------------------------------------------------------
# Check 6 — robots.txt must NOT globally Disallow (preview setting).
# Production robots.txt welcomes crawlers.
# -----------------------------------------------------------------------------
ROBOTS="$(readfile robots.txt)"
if printf '%s' "$ROBOTS" | grep -qE '^Disallow: /\s*$'; then
  record_fail 'robots.txt|preview-only "Disallow: /" present — production must allow crawling'
fi

# -----------------------------------------------------------------------------
# Check 7 — _redirects must NOT contain the preview-only /tests/* → 404 rule.
# -----------------------------------------------------------------------------
REDIR="$(readfile _redirects)"
if printf '%s' "$REDIR" | grep -qE '^/tests/\*'; then
  record_fail '_redirects|preview-only /tests/* rule present'
fi

# -----------------------------------------------------------------------------
# Check 8 — tests/preview-fail-closed.spec.js must NOT be in the published
# publish root. Its presence does not break production, but it indicates a
# preview-tree got promoted.
# -----------------------------------------------------------------------------
if fileexists "tests/preview-fail-closed.spec.js"; then
  record_fail 'tests/preview-fail-closed.spec.js|preview-only fail-closed spec present in publish root'
fi

# -----------------------------------------------------------------------------
# Report
# -----------------------------------------------------------------------------
if [ "$JSON" = "1" ]; then
  n=${#FAILURES[@]}
  # Minimal JSON escape for quoted field values: backslash then double-quote.
  json_escape() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    printf '%s' "$s"
  }
  printf '{"ref":"%s","failures":[' "$(json_escape "${REF:-WORKING_TREE}")"
  if [ $n -gt 0 ]; then
    i=0
    for f in "${FAILURES[@]}"; do
      [ $i -gt 0 ] && printf ','
      file="${f%%|*}"; msg="${f#*|}"
      printf '{"file":"%s","message":"%s"}' "$(json_escape "$file")" "$(json_escape "$msg")"
      i=$((i+1))
    done
  fi
  printf '],"count":%d,"pass":%s}\n' "$n" "$([ $n -eq 0 ] && echo true || echo false)"
else
  if [ "${#FAILURES[@]}" -eq 0 ]; then
    echo "preview-guard: PASS (tree=${REF:-working} — no preview contamination detected)"
  else
    echo "preview-guard: FAIL (tree=${REF:-working})"
    for f in "${FAILURES[@]}"; do
      file="${f%%|*}"; msg="${f#*|}"
      echo "  - ${file}: ${msg}"
    done
  fi
fi

[ "${#FAILURES[@]}" -eq 0 ] || exit 1
exit 0
