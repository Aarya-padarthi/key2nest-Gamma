# Key2Nest — Project 1 Rollback Runbook

**For:** operational responder on production incident tied to any Project 1 change.
**Baseline to restore to:** commit `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` ("Release: Life at Key2Nest, Google Reviews testimonials, careers refinements"), live 2026-11-09.
**Durable backup ref:** `origin/backup/project-1-prod-2026-11-09-66efe6a` on GitHub.
**Supplementary bundle:** see `recovery-manifest.md` — scratchpad-stored and SHA-256-verified.

---

## 0. Decide whether to roll back

Roll back **if and only if** at least one of the following is true on live production:

- The quick-interest form is returning the failure box on all synthetic submissions (indicating transport or backend break).
- The full application form is returning the failure box on all synthetic submissions.
- Applicant data is being written to the wrong sheet, the wrong Drive folder, or the wrong email recipient.
- The site is serving a broken page (console errors blocking the form), broken layout on the Life at Key2Nest / Google Reviews sections, or a WCAG-blocking regression (focus trap, keyboard inaccessibility).
- The site is serving regulated content (licensing claim, state list) that is now incorrect or risks a regulator inquiry.

**Do not roll back** for:

- Visual nits that do not block form use.
- Expected non-blocking Apps Script errors that are already surfaced via the existing failure box + email/phone fallback.
- Analytics/attribution issues that do not affect applicant submission or routing.

---

## 1. Fastest path — Netlify "Publish deploy" (preferred when applicable)

**Time to restore:** ≤ 1 minute of user action; ≤ 30 seconds Netlify propagation.
**Pre-requisite:** Netlify dashboard access with the Key2Nest site role of Owner or Developer.

1. Open `https://app.netlify.com` and select the Key2Nest site.
2. Click the **Deploys** tab.
3. Locate the deploy whose commit is `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` ("Release: Life at Key2Nest, Google Reviews testimonials, careers refinements"). It will be the most recent deploy published before the Project 1 release.
4. On that row, click **⋯ → Publish deploy**.
5. Netlify confirms; new serving version takes ~30 seconds to propagate.
6. **Verification (from a logged-out browser, in incognito):**
   - `curl -I https://www.key2nesthomeloans.com/careers.html` returns `200 OK`.
   - View page source → `<link rel="stylesheet" href="styles.css?v=rev69" />` is present (rev69 is the baseline cache-bust rev).
   - Both `#careers-interest-form` and `#careers-form` render.
   - Submit a synthetic quick-interest row with `Name: QA-ROLLBACK-TEST`, `Email: aarya.2.padarthi+rollback@gmail.com`. Confirm row in sheet with Role prefix `Interest — …` and admin@ email received.

**No repo write is required to perform this rollback.** `main` stays as whatever it was before.

---

## 2. Audit-trail path — `git revert` on main (recommended for compliance)

**Time to restore:** ≤ 2 minutes of operator action + ~60 seconds Netlify rebuild.
**Pre-requisite:** write access to `aarya-padarthi/key2nest-gamma`, clean local clone.

Replace `<project-1-release-sha>` with the SHA of the Project 1 production release commit (the commit this runbook needs to undo; not yet created — will be the squash-release commit landed on `main` after Phase 3 is authorised and Phase 5 Preview is approved).

```bash
git fetch origin main
git checkout main
git reset --hard origin/main                        # Only if the local main is dirty or behind
git revert --no-edit <project-1-release-sha>        # Creates a new commit that undoes the release
git push origin main
```

Netlify auto-builds. The old prod commit (`66efe6a`) remains in history for forensics. The new HEAD commit's tree should match `e29358e69129b6026b5e87c37299e2466ee1de35`.

**Verification:**

```bash
git rev-parse HEAD^{tree}      # Expect: e29358e69129b6026b5e87c37299e2466ee1de35
```

Plus the user-side verification from Section 1 step 6.

---

## 3. Emergency path — reset `main` to the backup branch (destructive — explicit approval only)

**Use only if:** `main` contains unknown or compromised commits that cannot be safely reverted and the only way to restore known-good state is to overwrite `main`.

**Prerequisite — written approval from the project owner before executing.** This operation is destructive to any unmerged work on `main`.

```bash
git fetch origin backup/project-1-prod-2026-11-09-66efe6a
git checkout main
git reset --hard origin/backup/project-1-prod-2026-11-09-66efe6a
git push origin main --force-with-lease
```

**Verification:** `git rev-parse origin/main` = `66efe6a3466503747f7f3495ac6ffa6b661cf5ba`, then user-side verification from Section 1 step 6.

---

## 4. Offline path — restore from the recovery bundle

**Use only if:** GitHub is unreachable and a fresh clone is required.

Before any restore from the bundle, re-verify its integrity:

```bash
cd <path-containing-the-bundle>
sha256sum -c key2nest-prod-2026-11-09-66efe6a.bundle.sha256
# Expect: key2nest-prod-2026-11-09-66efe6a.bundle: OK
```

Then:

```bash
git clone key2nest-prod-2026-11-09-66efe6a.bundle key2nest-restored
cd key2nest-restored
git checkout 66efe6a3466503747f7f3495ac6ffa6b661cf5ba -b main
git remote add origin https://github.com/Aarya-padarthi/key2nest-Gamma
git push -u origin main --force-with-lease      # destructive — approval required
```

Netlify auto-builds. User-side verification from Section 1 step 6.

---

## 5. Apps Script rollback (if the backend is the problem, not the frontend)

The `/exec` URL does not change across deployment versions. To revert to the pre-Project-1 backend code:

1. Open the careers Apps Script project (bound to sheet `1CsqHDqzYYPPv35H1szFWd2fo7SACY0xA2kDB_PcrcHc` — Extensions → Apps Script).
2. **Deploy → Manage deployments.**
3. Click **✏️ (edit)** on the Web App deployment.
4. Click the **Version** dropdown → select the version immediately **preceding** the Project 1 deployment.
5. Click **Deploy**. The `/exec` URL is unchanged.
6. **Verification:** run the two synthetic submissions in Section 1 step 6 and confirm successful routing.

**If no prior version is known-good** (the editor keeps a version history), fall back to pasting the archived copy of `careers-apps-script.gs` from commit `66efe6a` into the editor and deploying as a New version:

```bash
# From a clean clone:
git show 66efe6a3466503747f7f3495ac6ffa6b661cf5ba:careers-apps-script.gs > /tmp/careers-apps-script_baseline.gs
# Paste the contents into the Apps Script editor; Deploy → Manage deployments → New version.
```

---

## 6. Rollback-trigger communications

If a rollback is executed, within 30 minutes:

- **Internal:** message the recruiting team (admin@ distribution) with (a) which path was used, (b) which Project 1 changes are now rolled back, (c) expected user-visible symptoms during the rollback window.
- **External:** no external communication required unless the rollback causes a ≥ 10-minute total outage. Candidate traffic is low enough that no banner is required.

---

## 7. Rehearsal evidence

**Non-destructive rehearsal performed in this session (2026-11-09):**

| Step | Result |
|---|---|
| Resolve backup branch on origin | `git ls-remote origin refs/heads/backup/project-1-prod-2026-11-09-66efe6a` → `66efe6a3466503747f7f3495ac6ffa6b661cf5ba refs/heads/backup/project-1-prod-2026-11-09-66efe6a` ✅ |
| Resolve local backup tag | `git rev-parse pre-project-1-prod-2026-11-09-66efe6a^{commit}` → `66efe6a3466503747f7f3495ac6ffa6b661cf5ba` ✅ |
| Verify bundle integrity | `git bundle verify …bundle` → "complete history", "bundle is okay" ✅ |
| Verify bundle checksum | `sha256sum …bundle` → `dd5aad6afc21c3939dc3a43161cce337c64bf8ee5e44cf8b50697cab3212952b` ✅ |
| Verify bundle refs | 3 refs enumerated, including `backup/project-1-prod-2026-11-09-66efe6a` pointing at `66efe6a` ✅ |
| Rehearse restore into isolated workspace | **Not executed** to avoid disk pressure; command sequence recorded in Section 4 and is non-destructive against production. |

**Live rollback rehearsal against the Netlify "Publish deploy" affordance was deliberately not executed** (the brief forbids executing a production rollback to test the mechanism). The documented procedure has been exercised by the operator during previous releases this session (the user's own publish-to-prod and Netlify deployment workflow is well-established).

---

## 8. Irreversible effects — what rollback does NOT undo

| Effect | Notes |
|---|---|
| Applicant rows written to the Applications sheet during the Project 1 preview or live window | Rollback does not delete sheet rows. Operator may manually tag such rows in the Notes column but should not delete them. |
| Resumes uploaded to Drive during the Project 1 window | Rollback does not delete Drive files. Treat them as received. |
| Notification emails already sent | Not retractable. |
| GA4 events already fired | Not retractable. |
| Netlify build logs and deploy history | Not purged; useful for forensics. |

None of these are a reason to avoid a rollback — they are listed so the responder expects them.

---

## 9. Criteria for closing a rollback event

Once rolled back:

1. Both forms submit successfully in a logged-out browser using a synthetic payload. **(Must.)**
2. Applications sheet contains the two synthetic rows with correct Role/column data. **(Must.)**
3. admin@ inbox contains the two synthetic notification emails. **(Must.)**
4. Netlify current deploy is confirmed in the Deploys tab. **(Should.)**
5. A short post-mortem note is appended to `docs/recruitment-project/rollback-runbook.md` capturing (a) which trigger fired, (b) which path was used, (c) time-to-restore, (d) one-line "what to fix forward". **(Should.)**
