#!/usr/bin/env node
/*
 * Test harness for sanitiseCell(s) extracted verbatim from
 * careers-apps-script.gs. Runs under plain Node so the CI-friendly
 * exit code reflects pass/fail. No external deps.
 *
 * Covers (per final hardening step 2):
 *   - Unicode input (accented, Scandinavian, CJK, curly apostrophe)
 *   - Spreadsheet formula-injection defence (=, +, -, @ leaders)
 *   - Allowlist preservation (hyphen, parentheses, email-like, phone-like)
 *   - Length cap at 200 chars
 *   - Whitespace collapse and trim
 *   - Null / undefined inputs
 *   - HTML / backtick / control characters stripped
 */

'use strict';

// Verbatim copy of the function under test from careers-apps-script.gs
function sanitiseCell(s) {
  var v = String(s == null ? '' : s)
    .replace(/[^\p{L}\p{M}\p{N} .,'’@()+\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

const CASES = [
  // --- Unicode name preservation ---
  ['unicode:ascii',         'John Smith',            'John Smith'],
  ['unicode:accented-es',   'José López',            'José López'],
  ['unicode:scandi',        'André Søren',           'André Søren'],
  ['unicode:cjk',           '李雷',                   '李雷'],
  ['unicode:hindi',         'अर्जुन',                  'अर्जुन'],
  ['unicode:curly-apost',   'O’Málley',              'O’Málley'],
  ['unicode:mixed',         'André O\'Málley-李雷',   'André O\'Málley-李雷'],

  // --- Allowlist characters survive ---
  ['allow:hyphen',          'Smith-Jones',           'Smith-Jones'],
  ['allow:parens',          'Alias (Nickname)',      'Alias (Nickname)'],
  ['allow:apostrophe',      "O'Brien",               "O'Brien"],
  ['allow:period',          'Dr. Watson',            'Dr. Watson'],
  ['allow:comma',           'Smith, Jr.',            'Smith, Jr.'],

  // --- Email-like + phone-like (role / contact overrides can carry these) ---
  ['edge:email',            'foo.bar@example.com',   'foo.bar@example.com'],
  ['edge:phone-plus',       '+15555551234',          "'+15555551234"],
  ['edge:phone-paren',      '(972) 565-2199',        '(972) 565-2199'],

  // --- Formula injection defences ---
  // "=" and ":" and """ and "/" are all outside the allowlist, so they become spaces.
  // The result cannot begin with a formula leader, so the apostrophe-prefix is not
  // applied and is not needed (the "=" would also have been the injection vector).
  ['inject:eq-hyperlink',   '=HYPERLINK("http://evil","x")', 'HYPERLINK( http evil , x )'],
  ['inject:plus-sum',       '+SUM(A1)',              "'+SUM(A1)"],
  ['inject:at-at',          '@admin',                "'@admin"],
  ['inject:minus-neg',      '-1234',                 "'-1234"],
  // Tab is stripped first, "=" is then stripped, leaving "1+1" — not a formula leader.
  ['inject:tab-leading',    '\t=1+1',                '1+1'],

  // --- Dangerous chars stripped ---
  ['strip:angle-brackets',  '<script>alert(1)</script>', 'script alert(1) script'],
  ['strip:backtick',        'a`b',                   'a b'],
  ['strip:curly-brace',     'a{b}c',                 'a b c'],
  ['strip:semicolon',       'a;b',                   'a b'],
  ['strip:null-byte',       'a\u0000b',              'a b'],
  ['strip:control',         'a\u0007b',              'a b'],

  // --- Whitespace normalisation ---
  ['ws:collapse-spaces',    'a   b',                 'a b'],
  ['ws:tab-collapse',       'a\t\tb',                'a b'],
  ['ws:newline-collapse',   'a\nb',                  'a b'],
  ['ws:trim-leading',       '   a',                  'a'],
  ['ws:trim-trailing',      'a   ',                  'a'],

  // --- Length cap at 200 chars ---
  ['len:cap-exact',         'x'.repeat(200),         'x'.repeat(200)],
  ['len:cap-over',          'x'.repeat(500),         'x'.repeat(200)],

  // --- null / undefined / empty ---
  ['nil:empty',             '',                      ''],
  ['nil:null',              null,                    ''],
  ['nil:undefined',         undefined,               ''],
  ['nil:just-spaces',       '     ',                 ''],
];

function brief(v) {
  const s = JSON.stringify(v === undefined ? 'undefined' : v);
  return s.length > 36 ? s.slice(0, 33) + '...' : s;
}

let passed = 0, failed = 0;
const failures = [];
for (const [label, input, expected] of CASES) {
  const actual = sanitiseCell(input);
  if (actual === expected) {
    passed++;
    process.stdout.write(`  PASS  ${label.padEnd(26)} ${brief(input)} → ${brief(actual)}\n`);
  } else {
    failed++;
    failures.push({ label, input, expected, actual });
    process.stdout.write(`  FAIL  ${label.padEnd(26)} ${brief(input)}\n`);
    process.stdout.write(`        expected: ${brief(expected)}\n`);
    process.stdout.write(`        actual:   ${brief(actual)}\n`);
  }
}

process.stdout.write(`\n  sanitiseCell: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
