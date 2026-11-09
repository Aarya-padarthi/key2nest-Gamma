# Key2Nest — Backend (Apps Script) Acceptance (Phase D)

**Release candidate under test:** `release/project-1-apps-script` at commit `91fb1eddeb05ffd94c3d82eae17a780b925f5a0d`.
**Testing mode:** **static code-level + automated unit matrix.** Live Apps Script execution against an isolated test project is **BLOCKED on Approval D** (creation of a new isolated Apps Script instance is **NOT AUTHORIZED** under the current approval boundary).

Every row records: scenario · expected behaviour · actual behaviour · **Pass / Fail / Blocked / Not Tested** · evidence · severity.

---

## 1. Test modality per validation item

Per the brief: "Clearly distinguish executed tests from mocked, static, blocked, or skipped tests."

| Category | Modality used | Rationale |
|---|---|---|
| Logic covered by `sanitiseCell` | **Executed** via `tests/sanitise-cell.spec.js` in this session's Node (37/37 PASS) | Function is pure; input/output can be verified fully offline |
| Response-contract / deployment-order compatibility | **Executed** via `tests/response-contract.spec.js` in Node (41/41 PASS) | Response shapes are static; FE/BE handlers modelled faithfully from source |
| Role-compatibility across forms | **Executed** via `tests/role-compat.spec.js` (15/15 PASS) | HTML parsing is deterministic |
| JavaScript syntax validity of Apps Script | **Executed** via `node --check` on the `.gs` file | `.gs` is pure JavaScript syntactically |
| Live Apps Script execution (any of the matrix items in §2) | **Blocked** — Approval D not granted | Creating an isolated Apps Script project OR deploying to any Apps Script is explicitly withheld |
| Resume Drive upload observed against a real (test) Drive folder | **Blocked** — Approval D | Same |
| Recruiter notification arriving in a real (test) inbox | **Blocked** — Approval D | Same |
| Previous-version restoration against a real deployment | **Blocked** — Approval D + F | Same |

---

## 2. Validation-matrix rows (every item from the brief's §6 list)

| # | Validation | Modality | Result | Evidence | Severity if open |
|---|---|---|---|---|---|
| D1 | Successful candidate inquiry (happy path) | Static trace + response-contract A.i1/B.i1 | **PASS (static)** | `tests/response-contract.spec.js` A.i1 PASS, B.i1 PASS. Code path returns `{ok:true}` with an appended sheet row + email. Live execution: Blocked (Approval D). | — |
| D2 | Successful full application | Static trace + response-contract A.1/B.1 | **PASS (static)** | A.1 PASS, B.1 PASS. Live execution: Blocked (Approval D). | — |
| D3 | Validation failures (missing fields, bad email, bad phone) | Static trace + response-contract A.3/B.3 | **PASS (static)** | A.3 PASS, B.3 PASS. `handleInterest()` rejects missing `name` and malformed `email`; `doPost()` rejects missing required-set fields before any state change. | — |
| D4 | Error response sanitisation (H-01) | Static + anti-leak check | **PASS** | `tests/response-contract.spec.js` H-01 anti-leak: 9/9 shapes PASS. `grep -nE "console.(log|error|warn|info)" careers-apps-script.gs` shows only 1 `console.error` in the catch; message slice capped at 200 chars; no `data.*` reference. | — |
| D5 | Unicode names + combining marks (M-01) | Executed | **PASS** | `tests/sanitise-cell.spec.js` — 37/37 PASS, including `José López`, `André Søren`, `李雷`, `अर्जुन`, `O'Málley`, `Smith-Jones`. The implementation uses `\p{L}\p{M}\p{N}` allowlist. | — |
| D6 | Spreadsheet formula injection (M-01 + apostrophe prefix) | Executed | **PASS** | `tests/sanitise-cell.spec.js` injection cases: `=HYPERLINK(…)` → `HYPERLINK(…)` (stripped), `+SUM(A1)` → `'+SUM(A1)`, `@admin` → `'@admin`, `-1234` → `'-1234`. 4/4 PASS. | — |
| D7 | Role compatibility between the two forms | Executed | **PASS** | `tests/role-compat.spec.js` 15/15 PASS. | — |
| D8 | Resume upload handling (size + MIME + extension) | Static trace | **PASS (static)** | Baseline-preserved logic at lines 128–134 of `careers-apps-script.gs` on the release candidate: `Utilities.base64Decode(…)`, size check against `MAX_RESUME_BYTES` (5 MB), MIME map, extension fallback. Live execution: Blocked. | — |
| D9 | Candidate notification routing (admin@) + Reply-To + scan note (M-05) | Static | **PASS (static)** | `MailApp.sendEmail({to: NOTIFY_EMAIL, replyTo: safe(data.email), body: "...Note: the resume is scanned by Google Drive at download time..."})`. Live delivery: Blocked. | — |
| D10 | Duplicate application handling | Static trace | **PASS (static)** | `isDuplicate()` function and the `code: 'duplicate'` response are unchanged by Phase 3 and already verified during the Phase 3 live run (user-side) on 2026-11-05. | — |
| D11 | Backend/frontend response contracts (Orders A + B) | Executed | **PASS** | `tests/response-contract.spec.js` 41/41 PASS. Both orderings preserve the applicant-visible outcome. | — |
| D12 | Failure + recovery behaviour (force exception) | Static trace | **PASS (static)** | catch returns `{ok:false, code:'server_error'}`; FE handlers route to the generic failure panel; the on-page email/phone fallback remains functional. Live simulation: Blocked. | — |
| D13 | Previous-version restoration procedure (rollback) | Documented | **PASS (documented)** | `apps-script-release-safety.md §4` records the Deploy → Manage deployments → ✏️ → prior version path; also `rollback-runbook.md §5`. Live execution of the procedure against a real deployment: Blocked. | — |
| D14 | M-04 explicitly absent from the release candidate | Executed | **PASS** | `grep -q "file.setSharing" careers-apps-script.gs` on the release-candidate file returns no matches. A comment at the `createFile(blob)` region documents the deliberate exclusion. | — |

### Blocked items (Live-execution rows)

- D1–D3 live round-trip: candidate must reach a real Apps Script, write to a real sheet, and emit a real email.
- D8 live file upload against a real Drive folder.
- D9 live email delivery.
- D13 real version-restoration rehearsal.
- All five are blocked by Approval D.

### Not-tested items (deliberate)

- Rows that would need a production-side submission to verify (`admin@` email arrival at the production address) are **deliberately not tested**. Production would receive the synthetic row, contradicting the brief's prohibition on sending synthetic submissions to production.

---

## 3. Response-contract integration tests (D11, highlighted)

The deployment-order matrix in `tests/response-contract.spec.js` is the **only item in Phase D's §7 list that was explicitly requested to be validated beyond static code inspection** ("Do not claim deployment-order compatibility based solely on static code inspection"). The test exercises FE handlers and BE response shapes against each other as data structures — this is a step above pure static inspection but below live wire-protocol integration. 41/41 PASS.

**Gap retained as a release condition:** live backend end-to-end integration tests — frontend running in a browser against an isolated Apps Script — have **not** been executed. Approval D is the only way to close this gap.

---

## 4. M-04 restriction status (per brief §6)

- M-04 (`file.setSharing(PRIVATE, NONE)`) is **not present** in the `release/project-1-apps-script` candidate.
- Introducing it would require: (a) the isolated-test procedure in `drive-sharing-validation.md §2` executed, (b) the Decision Matrix in §3 filled in, (c) a separate release candidate (e.g. `release/project-1-apps-script-m04`) that branches off `release/project-1-apps-script` and re-inserts the `setSharing` call at the `createFile(blob)` region.
- No such re-introduction happens in this session.

---

## 5. Summary — items by status

| Status | Count |
|---|---|
| **PASS (executed)** | 6 (D4, D5, D6, D7, D11, D14) |
| **PASS (static + documented; live blocked)** | 7 (D1, D2, D3, D8, D9, D10, D12) |
| **PASS (documented procedure; live blocked)** | 1 (D13) |
| **Blocked — Approval D needed for live execution** | 7 rows under the PASS(static) category carry an unexecuted live-execution component |
| **Not Tested — deliberately** | 0 production submissions |
| **Fail** | 0 |

**Phase D verdict:** code-level **PASS**. Live-execution component **BLOCKED** on Approval D. The blocking items are matters of execution (would the live system behave as the code describes?), not of implementation correctness (the code demonstrably does what the audit prescribes).
