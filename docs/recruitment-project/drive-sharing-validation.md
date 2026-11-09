# Key2Nest — M-04 Drive Sharing Validation Procedure

**Purpose.** Project 1 authorisation for M-04 (`file.setSharing(PRIVATE, NONE)` on resume files) is **gated** on the client first validating current Drive sharing behavior in an isolated test. This document is that procedure.

**Do not deploy the M-04 code change to the live careers Apps Script until the test below confirms: (a) current newly-created files are not already link-shared (so the fix is necessary), and (b) `setSharing(PRIVATE, NONE)` does not block recruiters who already have folder access from opening the file (so the fix is safe).**

The code change is present in the repo at `careers-apps-script.gs` on branch `audit/project-1-recruitment` (search for "M-04" in the file). It is deliberately shipped alongside this validation procedure so you can test with the exact code that would deploy.

---

## 1. Setup — isolated test Apps Script project

1. Open Google Drive (`drive.google.com`) **as the same Google account that owns the live careers Apps Script**.
2. Create a new folder, e.g. `K2N-M04-Test` (not a shared location).
3. New → Google Sheets → open the sheet. Name it `K2N-M04-Test-Sheet`.
4. In the sheet: **Extensions → Apps Script.** This creates a new Apps Script project **bound to this sheet only** — it will not affect the live careers script in any way.
5. In the new script project, paste the following minimal self-contained test (it does not connect to the live script, the live sheet, or the live Drive folder):

```js
/* K2N-M04-Test — Validate Drive sharing behavior for resumes.
 *
 * This script:
 *   1. Creates a tiny test file inside a test folder it also creates.
 *   2. Logs the created file's sharing posture.
 *   3. Optionally forces setSharing(PRIVATE, NONE) and logs the posture
 *      again.
 *
 * NO production Drive folder, sheet, or Apps Script is touched.
 */

const TEST_FOLDER_NAME = 'K2N-M04-Test-Folder';

/** Step A — baseline: what does a freshly-created file look like? */
function testBaselineSharing() {
  const folder = getOrCreateFolder();
  const file = folder.createFile('K2N-M04-baseline.txt', 'test content', MimeType.PLAIN_TEXT);
  Logger.log('BASELINE file created: ' + file.getName());
  Logger.log('  Access:     ' + file.getSharingAccess());
  Logger.log('  Permission: ' + file.getSharingPermission());
  Logger.log('  URL:        ' + file.getUrl());
}

/** Step B — apply the M-04 pin and log the resulting posture. */
function testM04Sharing() {
  const folder = getOrCreateFolder();
  const file = folder.createFile('K2N-M04-pinned.txt', 'test content', MimeType.PLAIN_TEXT);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  Logger.log('PINNED file created: ' + file.getName());
  Logger.log('  Access:     ' + file.getSharingAccess());
  Logger.log('  Permission: ' + file.getSharingPermission());
  Logger.log('  URL:        ' + file.getUrl());
}

/** Cleanup — moves all K2N-M04 test files to Trash. */
function testCleanup() {
  const it = DriveApp.getFoldersByName(TEST_FOLDER_NAME);
  while (it.hasNext()) {
    const f = it.next();
    const files = f.getFiles();
    while (files.hasNext()) files.next().setTrashed(true);
    f.setTrashed(true);
    Logger.log('Trashed folder: ' + f.getName());
  }
}

function getOrCreateFolder() {
  const it = DriveApp.getFoldersByName(TEST_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(TEST_FOLDER_NAME);
}
```

---

## 2. Run the tests

For each function, click **Run** in the Apps Script editor. Grant the Drive permission when prompted on the first run. Then **View → Executions** or **View → Logs** to see the Logger output.

### 2.1 Step A — baseline

Run `testBaselineSharing()`.

Expected output in the Logger:

```
BASELINE file created: K2N-M04-baseline.txt
  Access:     PRIVATE     ← or DOMAIN or ANYONE_WITH_LINK, depending on account defaults
  Permission: NONE        ← or VIEW / EDIT
  URL:        https://docs.google.com/...
```

**Record the exact Access and Permission values.** Then open the URL in an **incognito window** (not signed into any account). If you see the file, the baseline is link-shared — the M-04 fix is clearly necessary. If you see a "You need access" page, the baseline is already restricted.

### 2.2 Step B — apply the pin

Run `testM04Sharing()`.

Expected output:

```
PINNED file created: K2N-M04-pinned.txt
  Access:     PRIVATE
  Permission: NONE
  URL:        https://docs.google.com/...
```

Open the pinned file URL in an **incognito window**. You MUST see a "You need access" page.

Then open the same URL **while signed into a recruiter's account** that has access to the test folder (if applicable in your setup). The recruiter should still be able to open it — folder-level access is what grants recruiter access, not file-level. If the recruiter cannot open it, do **not** proceed with deployment — report the finding.

### 2.3 Cleanup

Run `testCleanup()` to Trash the test files and folder. Then permanently delete them from the Drive Trash.

---

## 3. Decision matrix

Use the results to decide whether to proceed with M-04:

| Baseline Access | Baseline Permission | Recruiter still opens pinned file? | Decision |
|---|---|---|---|
| `PRIVATE` | `NONE` | ✅ yes | Baseline is already private — M-04 is a belt-and-suspenders hardening. **Safe to deploy.** |
| `PRIVATE` | `NONE` | ❌ no | Something unusual — recruiter access depends on file-level sharing. **Do not deploy** without further investigation. |
| `DOMAIN` or `ANYONE_WITH_LINK` | `VIEW` or `EDIT` | ✅ yes | Baseline is over-shared — M-04 is a **necessary** fix. Deploy. |
| `DOMAIN` or `ANYONE_WITH_LINK` | `VIEW` or `EDIT` | ❌ no | Deployment would break recruiter access via the current URL-share path. **Do not deploy.** Instead, grant recruiters explicit folder-level access first, then deploy. |

---

## 4. Record of outcome

After running the test, fill in this block and commit it to the audit branch:

```
Validation performed by:   <name>
Date:                       <YYYY-MM-DD>
Google account:             <admin@key2nesthomeloans.com or similar>
Baseline Access:            <PRIVATE | DOMAIN | ANYONE_WITH_LINK>
Baseline Permission:        <NONE | VIEW | EDIT>
Incognito access to baseline:   <"blocked" | "allowed">
Pinned-file incognito access:   <"blocked" | "allowed">  (expected: blocked)
Recruiter access to pinned:     <"allowed" | "blocked">  (required: allowed if recruiters previously accessed via link)
Decision:                   <"deploy M-04" | "do not deploy M-04">
```

Once the decision is "deploy M-04", follow the Apps Script deployment procedure in `recruitment-admin.md §4`.

If the decision is "do not deploy M-04", revert the two code changes in `careers-apps-script.gs` (the `try { file.setSharing(...) } catch { ... }` block and its M-04 comment) and re-release.
