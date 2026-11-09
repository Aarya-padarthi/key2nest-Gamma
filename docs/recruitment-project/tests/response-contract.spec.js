#!/usr/bin/env node
/*
 * Deployment-order compatibility tests (Project 1 final hardening step 2).
 *
 * Verifies that frontend code at version F and backend code at version B
 * can interoperate for every (F, B) in {baseline, Phase-3} × {baseline, Phase-3}.
 *
 * Simulates both:
 *   Order A: Updated frontend + existing (baseline) Apps Script
 *   Order B: Existing (baseline) frontend + updated Apps Script
 *
 * The frontend contracts are modeled from careers.js and the inline
 * careers-interest-form handler in careers.html; the backend response
 * shapes are modeled from the two versions of careers-apps-script.gs.
 */

'use strict';

/* ----------------- Backend response shapes ----------------- */

const BASELINE_BE = {
  success:          { ok: true },
  duplicate:        { ok: false, code: 'duplicate', error: 'We have already received your application for this role.' },
  missing_role:     { ok: false, error: 'Missing field: role' },
  resume_too_big:   { ok: false, error: 'Resume over 5 MB.' },
  bad_resume_type:  { ok: false, error: 'Resume must be PDF or Word.' },
  no_ts_token:      { ok: false, error: 'Missing security verification token.' },
  ts_failed:        { ok: false, error: 'Security verification failed: internal-error' },
  server_misconfig: { ok: false, error: 'Server misconfigured: TURNSTILE_SECRET_KEY not set.' },
  server_exception: { ok: false, error: 'Server error: TypeError: Cannot read properties of undefined (reading \'foo\')' },
};

const PHASE3_BE = {
  success:          { ok: true },
  duplicate:        { ok: false, code: 'duplicate', error: 'We have already received your application for this role.' },
  missing_role:     { ok: false, error: 'Missing field: role' },
  resume_too_big:   { ok: false, error: 'Resume over 5 MB.' },
  bad_resume_type:  { ok: false, error: 'Resume must be PDF or Word.' },
  no_ts_token:      { ok: false, code: 'turnstile_failed', error: 'Missing security verification token.' },
  ts_failed:        { ok: false, code: 'turnstile_failed', error: 'Security verification failed: internal-error' },
  server_misconfig: { ok: false, code: 'turnstile_failed', error: 'Server misconfigured: TURNSTILE_SECRET_KEY not set.' },
  server_exception: { ok: false, code: 'server_error' }, // no 'error' field — intentional (H-01 anti-leak)
};

/* ----------------- Frontend behavior (full application) ----------------- */
// Returns the UI state the FE will enter after reading `out`.

function BASELINE_FE_apply(out) {
  // Baseline careers.js:216-225
  if (out && out.code === 'duplicate') return 'duplicate_panel';
  if (!out || out.ok !== true) {
    // throw new Error((out && out.error) || 'server-rejected')
    // caught, sets failureBox hidden=false. Does NOT display the message text.
    return 'generic_failure_panel';
  }
  return 'success_panel';
}

function PHASE3_FE_apply(out) {
  // Phase 3 careers.js unchanged structurally from baseline on the response read;
  // only the endpoint resolution moved to window.__k2nCareersEndpoint.
  // So behavior on reading `out` is identical.
  return BASELINE_FE_apply(out);
}

/* ----------------- Frontend behavior (quick-interest) ----------------- */

function BASELINE_FE_interest(out) {
  // Baseline inline handler:  if (!out || out.ok !== true) throw new Error('rejected');
  if (!out || out.ok !== true) return 'generic_failure_panel';
  return 'success_panel';
}

function PHASE3_FE_interest(out) {
  // Phase 3 inline handler: same test — if (!out || out.ok !== true) throw new Error('rejected'); then showFailure("Couldn't send that right now.")
  if (!out || out.ok !== true) return 'generic_failure_panel';
  return 'success_panel';
}

/* ----------------- Matrix executor ----------------- */

const MATRIX = [
  ['A.1 updated FE / baseline BE — happy apply',           PHASE3_FE_apply,    BASELINE_BE.success,          'success_panel'],
  ['A.2 updated FE / baseline BE — duplicate',             PHASE3_FE_apply,    BASELINE_BE.duplicate,        'duplicate_panel'],
  ['A.3 updated FE / baseline BE — missing role',          PHASE3_FE_apply,    BASELINE_BE.missing_role,     'generic_failure_panel'],
  ['A.4 updated FE / baseline BE — resume too big',        PHASE3_FE_apply,    BASELINE_BE.resume_too_big,   'generic_failure_panel'],
  ['A.5 updated FE / baseline BE — bad resume type',       PHASE3_FE_apply,    BASELINE_BE.bad_resume_type,  'generic_failure_panel'],
  ['A.6 updated FE / baseline BE — missing TS token',      PHASE3_FE_apply,    BASELINE_BE.no_ts_token,      'generic_failure_panel'],
  ['A.7 updated FE / baseline BE — TS verify failed',      PHASE3_FE_apply,    BASELINE_BE.ts_failed,        'generic_failure_panel'],
  ['A.8 updated FE / baseline BE — server misconfig',      PHASE3_FE_apply,    BASELINE_BE.server_misconfig, 'generic_failure_panel'],
  ['A.9 updated FE / baseline BE — server exception leak', PHASE3_FE_apply,    BASELINE_BE.server_exception, 'generic_failure_panel'],

  ['B.1 baseline FE / updated BE — happy apply',           BASELINE_FE_apply,  PHASE3_BE.success,            'success_panel'],
  ['B.2 baseline FE / updated BE — duplicate',             BASELINE_FE_apply,  PHASE3_BE.duplicate,          'duplicate_panel'],
  ['B.3 baseline FE / updated BE — missing role',          BASELINE_FE_apply,  PHASE3_BE.missing_role,       'generic_failure_panel'],
  ['B.4 baseline FE / updated BE — resume too big',        BASELINE_FE_apply,  PHASE3_BE.resume_too_big,     'generic_failure_panel'],
  ['B.5 baseline FE / updated BE — bad resume type',       BASELINE_FE_apply,  PHASE3_BE.bad_resume_type,    'generic_failure_panel'],
  ['B.6 baseline FE / updated BE — missing TS (new code)', BASELINE_FE_apply,  PHASE3_BE.no_ts_token,        'generic_failure_panel'],
  ['B.7 baseline FE / updated BE — TS verify failed',      BASELINE_FE_apply,  PHASE3_BE.ts_failed,          'generic_failure_panel'],
  ['B.8 baseline FE / updated BE — server misconfig',      BASELINE_FE_apply,  PHASE3_BE.server_misconfig,   'generic_failure_panel'],
  ['B.9 baseline FE / updated BE — server_error no msg',   BASELINE_FE_apply,  PHASE3_BE.server_exception,   'generic_failure_panel'],

  // Quick-interest matrix (narrower surface — only success/failure)
  ['A.i1 updated FE-interest / baseline BE — happy',       PHASE3_FE_interest, BASELINE_BE.success,          'success_panel'],
  ['A.i2 updated FE-interest / baseline BE — TS missing',  PHASE3_FE_interest, BASELINE_BE.no_ts_token,      'generic_failure_panel'],
  ['B.i1 baseline FE-interest / updated BE — happy',       BASELINE_FE_interest, PHASE3_BE.success,          'success_panel'],
  ['B.i2 baseline FE-interest / updated BE — TS code set', BASELINE_FE_interest, PHASE3_BE.no_ts_token,      'generic_failure_panel'],
  ['B.i3 baseline FE-interest / updated BE — server_err',  BASELINE_FE_interest, PHASE3_BE.server_exception, 'generic_failure_panel'],
];

let fail = 0;
for (const [label, feFn, out, expected] of MATRIX) {
  const actual = feFn(out);
  const ok = actual === expected;
  if (!ok) fail++;
  process.stdout.write(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(60)} → ${actual}${ok ? '' : `  (expected ${expected})`}\n`);
}

/* ----------------- H-01 anti-leak assertion ----------------- */
// The updated BE must NOT return raw exception text in any response path.
process.stdout.write('\n  H-01 anti-leak check (updated BE never includes raw \'err.message\' in response):\n');
for (const [key, shape] of Object.entries(PHASE3_BE)) {
  const leaks = shape && typeof shape.error === 'string' && /TypeError|ReferenceError|SyntaxError|undefined|stack/i.test(shape.error);
  const ok = !leaks;
  if (!ok) fail++;
  process.stdout.write(`  ${ok ? 'PASS' : 'FAIL'}  shape "${key}" does not leak internal exception text\n`);
}

/* ----------------- Phase 3 response key consistency ----------------- */
// Phase 3 explicitly added 'code' for server_error. 'code' for duplicate was pre-existing.
// Confirm no accidental removal of 'ok' key anywhere.
for (const [key, shape] of Object.entries(PHASE3_BE)) {
  const ok = shape && Object.prototype.hasOwnProperty.call(shape, 'ok');
  if (!ok) fail++;
  process.stdout.write(`  ${ok ? 'PASS' : 'FAIL'}  shape "${key}" has 'ok' key\n`);
}

process.stdout.write(`\n  response-contract: ${fail === 0 ? 'ALL PASS' : fail + ' FAILED'}\n`);
process.exit(fail === 0 ? 0 : 1);
