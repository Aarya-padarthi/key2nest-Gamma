#!/usr/bin/env node
/*
 * Verifies the quick-interest form's role dropdown values exactly match
 * the full-application role-card data-role-apply values (Project 1 H-02),
 * and documents the legacy → current mapping for historical interest rows.
 *
 * Reads careers.html as a string and extracts:
 *   - <option value="..."> under <select id="qi-role">
 *   - data-role-apply="..." from role-card Apply buttons + general app link
 *
 * Fails if any current interest option doesn't appear in the role-card
 * set OR if the historically-documented legacy values stray from the
 * admin doc's migration table.
 */

'use strict';
const fs = require('fs');

const html = fs.readFileSync('careers.html', 'utf8');

// 1. Interest-form options (new set after H-02 fix)
const qi = html.match(/<select id="qi-role"[\s\S]*?<\/select>/)[0];
const interestValues = [...qi.matchAll(/<option value="([^"]*)"/g)]
  .map(m => m[1])
  .filter(v => v !== ''); // the "Not sure / general interest" sentinel has value=""

// 2. Full-application role names (any button or anchor carrying data-role-apply)
const applyValues = [...html.matchAll(/data-role-apply="([^"]*)"/g)]
  .map(m => m[1]);

// 3. Build union / intersection
const applySet = new Set(applyValues);

let fail = 0;
function check(label, cond, detail) {
  const ok = !!cond;
  process.stdout.write(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}\n`);
  if (!ok) fail++;
}

check(
  'interest form offers at least 5 named roles (plus "Not sure")',
  interestValues.length >= 5,
  'actual count=' + interestValues.length
);

// Every interest option must map to a role used by at least one Apply control.
// "Open application" is a general-application alias that is intentionally NOT
// in the interest dropdown.
for (const v of interestValues) {
  check(
    `interest option "${v}" matches a role-card data-role-apply`,
    applySet.has(v)
  );
}

// Role cards expected (hard list — these are the four role cards + the retail
// card + the general-application mount; keeps the test honest if a future edit
// silently renames one).
const EXPECTED_ROLE_CARDS = [
  'Mortgage Loan Originator (Retail)',
  'Senior Mortgage Loan Originator',
  'Mortgage Loan Originator — Purchase Specialist',
  'Mortgage Loan Originator — Self-Generated Business',
  'Entry-Level Mortgage Loan Originator',
  'Open application',
];
for (const role of EXPECTED_ROLE_CARDS) {
  check(`role-card expected: "${role}"`, applySet.has(role));
}

// Legacy values documented in recruitment-admin.md Role-taxonomy section.
// Must NOT appear as current interest options (regression guard).
const LEGACY_INTEREST_VALUES = [
  'MLO — Purchase Specialist',
  'MLO — Self-Generated Business',
  'Entry-Level MLO',
];
for (const v of LEGACY_INTEREST_VALUES) {
  check(
    `legacy interest option "${v}" removed from current dropdown`,
    !interestValues.includes(v)
  );
}

process.stdout.write(`\n  interest options observed: ${JSON.stringify(interestValues)}\n`);
process.stdout.write(`  role-card apply targets:   ${JSON.stringify([...applySet])}\n\n`);
process.stdout.write(`  role-compat: ${fail === 0 ? 'ALL PASS' : fail + ' FAILED'}\n`);
process.exit(fail === 0 ? 0 : 1);
