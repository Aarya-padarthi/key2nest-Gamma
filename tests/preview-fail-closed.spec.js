#!/usr/bin/env node
/**
 * Fail-closed behaviour matrix for the preview-isolation configuration.
 *
 * Runs with plain Node — no npm dependencies. Loads preview-config.js
 * from the repo working tree (the preview branch must be checked out),
 * executes it inside a VM context with a mocked `window`, and asserts
 * the published global for four scenarios:
 *
 *   T1 — placeholder left in: endpoint must be null
 *   T2 — production deployment ID in the URL: endpoint must be null
 *   T3 — malformed URL (missing /exec or wrong host): endpoint must be null
 *   T4 — valid isolated URL: endpoint is published verbatim
 *   T5 — attempt to overwrite the published endpoint in strict mode:
 *        TypeError (non-writable property)
 *   T6 — attempt to redefine the property: TypeError
 *   T7 — __k2nIsPreview is published as true
 *   T8 — careers.js on the preview branch has NO production URL literal
 *   T9 — careers.html on the preview branch has NO production URL literal
 *       (neither as fallback constant nor anywhere else)
 *   T10 — careers.js submit path: when endpoint is null, the submit
 *        handler would throw 'endpoint-not-configured' before reaching
 *        fetch(). Verified by static scan.
 *   T11 — inline interest-form handler in careers.html: same fail-closed
 *        behaviour. Verified by static scan.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(REPO, 'preview-config.js');
const CAREERS_JS = path.join(REPO, 'careers.js');
const CAREERS_HTML = path.join(REPO, 'careers.html');

const PRODUCTION_DEPLOYMENT_ID =
  'AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg';

const results = [];
function record(id, passed, detail) {
  results.push({ id, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${id} — ${detail}`);
}

function loadConfigWithEndpointOverride(overrideUrl) {
  let src = fs.readFileSync(CONFIG_PATH, 'utf8');
  if (overrideUrl !== null) {
    src = src.replace(
      /var PREVIEW_CAREERS_ENDPOINT = '[^']*';/,
      `var PREVIEW_CAREERS_ENDPOINT = ${JSON.stringify(overrideUrl)};`
    );
  }
  const sandbox = { window: {}, Object, String, console, TypeError };
  sandbox.window.Object = Object;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window;
}

// ---------------------------------------------------------------------------
// T1 — placeholder left in → null
// ---------------------------------------------------------------------------
{
  const w = loadConfigWithEndpointOverride(null); // uses the file's current literal
  const okNull = w.__k2nCareersEndpoint === null;
  record('T1-placeholder-null', okNull,
    `endpoint with placeholder = ${JSON.stringify(w.__k2nCareersEndpoint)}`);
}

// ---------------------------------------------------------------------------
// T2 — production deployment ID appears anywhere in the endpoint → null
// ---------------------------------------------------------------------------
{
  const w = loadConfigWithEndpointOverride(
    `https://script.google.com/macros/s/${PRODUCTION_DEPLOYMENT_ID}/exec`);
  record('T2-production-id-blocked', w.__k2nCareersEndpoint === null,
    `production-id endpoint → ${JSON.stringify(w.__k2nCareersEndpoint)}`);
}

// ---------------------------------------------------------------------------
// T3a — malformed (no /exec)
// ---------------------------------------------------------------------------
{
  const w = loadConfigWithEndpointOverride(
    'https://script.google.com/macros/s/AKfycbzTEST123FAKEISOLATEDTEST/view');
  record('T3a-no-exec-rejected', w.__k2nCareersEndpoint === null,
    `no /exec → ${JSON.stringify(w.__k2nCareersEndpoint)}`);
}

// T3b — wrong host
{
  const w = loadConfigWithEndpointOverride(
    'https://evil.example.com/macros/s/AKfycbzTEST123FAKEISOLATEDTEST/exec');
  record('T3b-wrong-host-rejected', w.__k2nCareersEndpoint === null,
    `wrong host → ${JSON.stringify(w.__k2nCareersEndpoint)}`);
}

// T3c — non-string / empty
{
  const w = loadConfigWithEndpointOverride('');
  record('T3c-empty-rejected', w.__k2nCareersEndpoint === null,
    `empty → ${JSON.stringify(w.__k2nCareersEndpoint)}`);
}

// ---------------------------------------------------------------------------
// T4 — valid isolated URL → published verbatim
// ---------------------------------------------------------------------------
const VALID_ISOLATED =
  'https://script.google.com/macros/s/AKfycbzPREVIEWTESTISOLATEDFAKE1234567890abcdefghij/exec';
{
  const w = loadConfigWithEndpointOverride(VALID_ISOLATED);
  record('T4-valid-published', w.__k2nCareersEndpoint === VALID_ISOLATED,
    `valid published = ${JSON.stringify(w.__k2nCareersEndpoint)}`);
}

// ---------------------------------------------------------------------------
// T5 — attempt to overwrite in strict mode after publication → TypeError
// ---------------------------------------------------------------------------
{
  const w = loadConfigWithEndpointOverride(VALID_ISOLATED);
  let threw = false;
  try {
    // simulate a hostile late script
    (new Function('w', '"use strict"; w.__k2nCareersEndpoint = "https://attacker.example/exec";'))(w);
  } catch (e) { threw = e instanceof TypeError; }
  const stillIsolated = w.__k2nCareersEndpoint === VALID_ISOLATED;
  record('T5-overwrite-throws', threw && stillIsolated,
    `TypeError thrown=${threw}, endpoint still isolated=${stillIsolated}`);
}

// ---------------------------------------------------------------------------
// T6 — attempt to redefine the property → TypeError (configurable:false)
// ---------------------------------------------------------------------------
{
  const w = loadConfigWithEndpointOverride(VALID_ISOLATED);
  let threw = false;
  try {
    Object.defineProperty(w, '__k2nCareersEndpoint', { value: 'https://attacker.example/exec', writable: true, configurable: true });
  } catch (e) { threw = e instanceof TypeError; }
  record('T6-redefine-throws', threw && w.__k2nCareersEndpoint === VALID_ISOLATED,
    `TypeError thrown=${threw}, endpoint still isolated`);
}

// ---------------------------------------------------------------------------
// T7 — __k2nIsPreview published true
// ---------------------------------------------------------------------------
{
  const w = loadConfigWithEndpointOverride(VALID_ISOLATED);
  record('T7-isPreview-true', w.__k2nIsPreview === true,
    `__k2nIsPreview = ${JSON.stringify(w.__k2nIsPreview)}`);
}

// ---------------------------------------------------------------------------
// T8 — careers.js on the preview branch has no production URL literal
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(CAREERS_JS, 'utf8');
  record('T8-careers-js-no-prod-url',
    src.indexOf(PRODUCTION_DEPLOYMENT_ID) === -1,
    'no production deployment id in careers.js');
}

// ---------------------------------------------------------------------------
// T9 — careers.html on the preview branch has no production URL literal
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(CAREERS_HTML, 'utf8');
  record('T9-careers-html-no-prod-url',
    src.indexOf(PRODUCTION_DEPLOYMENT_ID) === -1,
    'no production deployment id in careers.html');
}

// ---------------------------------------------------------------------------
// T10 — careers.js submit guard: endpoint-not-configured on null
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(CAREERS_JS, 'utf8');
  const guard = /const CAREERS_ENDPOINT = getCareersEndpoint\(\);\s*if \(!CAREERS_ENDPOINT\) throw new Error\('endpoint-not-configured'\);/
    .test(src);
  record('T10-careers-js-guard', guard,
    'getCareersEndpoint() + throw endpoint-not-configured guard present');
}

// ---------------------------------------------------------------------------
// T11 — inline interest handler in careers.html: endpoint-not-configured
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(CAREERS_HTML, 'utf8');
  const guard = /const endpoint = careersEndpoint\(\);\s*if \(!endpoint\) throw new Error\('endpoint-not-configured'\);/
    .test(src);
  record('T11-careers-html-guard', guard,
    'inline interest-form fail-closed guard present');
}

// ---------------------------------------------------------------------------
// T12 — preview-config.js is loaded SYNCHRONOUSLY before any defer scripts
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(CAREERS_HTML, 'utf8');
  const previewTag = /<script src="preview-config\.js"><\/script>/;
  const mainTag = /<script src="main\.js\?v=rev69" defer>/;
  const previewIdx = src.search(previewTag);
  const mainIdx = src.search(mainTag);
  record('T12-preview-config-first',
    previewIdx > 0 && mainIdx > previewIdx,
    `preview-config.js @ ${previewIdx} < main.js @ ${mainIdx}`);
}

// ---------------------------------------------------------------------------
// T13 — GA4 production loader removed from the preview careers.html
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(CAREERS_HTML, 'utf8');
  record('T13-ga4-loader-disabled',
    src.indexOf('googletagmanager.com/gtag/js') === -1 &&
      src.indexOf('G-TLH3F0F15H') === -1,
    'no GA4 loader + no GA4 property id in preview careers.html');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const failed = results.filter(r => !r.passed);
console.log('\n----- fail-closed matrix: ' +
  (results.length - failed.length) + '/' + results.length + ' PASS -----');
process.exit(failed.length === 0 ? 0 : 1);
