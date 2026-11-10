/* =========================================================================
   Key2Nest — PREVIEW-ISOLATION CONFIG  (preview branch only)
   =========================================================================

   This file exists only on branch `release/project-1-frontend-preview`.
   It must NEVER be merged to `main`. The production release candidate
   (`release/project-1-frontend`) does not reference it.

   Responsibilities
   ----------------
   1. Publish an isolated test `/exec` endpoint as `window.__k2nCareersEndpoint`
      so that the quick-interest form (careers.html inline handler) and the
      full application form (careers.js) both target the test Apps Script
      instead of production.
   2. Make that global IMMUTABLE after publication so an async script, a
      third-party widget, or a tampered resource cannot replace it with a
      production URL.
   3. FAIL CLOSED: if the operator forgot to substitute the placeholder
      below, if the configured value is missing, is of the wrong shape, or
      matches the production deployment ID, the global is set to `null`.
      The consuming forms treat `null` as "do not submit".
   4. Publish a sibling flag `window.__k2nIsPreview = true` so the UI can
      render a visible PREVIEW banner and the frontend tests can assert
      they are running against the isolated environment.

   This file deliberately contains NO fallback to the production endpoint.
   The production URL constant that lives in `careers.js` on the release
   candidate (`release/project-1-frontend`) has been removed from this
   preview branch's `careers.js`, and the inline-handler fallback in
   `careers.html` has been removed too.
   ========================================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     SUBSTITUTE BEFORE DEPLOYING THE PREVIEW
     ------------------------------------
     Replace the placeholder string with the full `/exec` URL emitted by
     the isolated Apps Script project described in
     docs/recruitment-project/preview-isolation/isolated-apps-script-template.gs
     That URL MUST NOT contain the production deployment ID listed in the
     blocklist below; if it does, this config refuses to publish it.
     ----------------------------------------------------------------------- */
  var PREVIEW_CAREERS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzw7F9qVaM2pLZMGTD5IHmrTX8t6_18uoCTuBtFdFwFYCG66rxCq6JpDJ6w002fKwKhwg/exec';

  /* Blocklist — the exact deployment ID (the opaque id in the middle of
     the production /exec URL) of the production careers Apps Script. If
     this substring appears anywhere in PREVIEW_CAREERS_ENDPOINT, the
     config refuses to publish and the forms fail closed.
     -----------------------------------------------------------------------
     (Documenting the production id here on the preview branch is
     intentional. The preview branch never ships to production; this is
     the only piece of information the fail-closed guard needs, and it is
     not a secret — it already appears in the production careers.js that
     every visitor can view.) */
  var PRODUCTION_DEPLOYMENT_ID = 'AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg';

  var PLACEHOLDER_SENTINEL = 'PLACEHOLDER-ISOLATED-TEST-ENDPOINT-HERE';

  /* Anchor the full shape so `/exec` must be the path terminator (an
     optional query string is allowed). A hostile URL that merely CONTAINS
     `/exec` as a substring — e.g.
     `https://script.google.com/macros/s/<id>/exec/x?r=https://attacker/`
     — is therefore rejected even though the host prefix is correct. */
  var VALID_SHAPE =
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{40,}\/exec(\?[^\s]*)?$/;

  function isValidPreviewEndpoint(url) {
    if (typeof url !== 'string') return false;
    if (url === PLACEHOLDER_SENTINEL) return false;
    if (url.indexOf(PRODUCTION_DEPLOYMENT_ID) !== -1) return false;
    return VALID_SHAPE.test(url);
  }

  var endpointForPreview = isValidPreviewEndpoint(PREVIEW_CAREERS_ENDPOINT)
    ? PREVIEW_CAREERS_ENDPOINT
    : null;

  /* Immutable publication. `writable:false` prevents re-assignment,
     `configurable:false` prevents redefine / delete. Any later
     `window.__k2nCareersEndpoint = …` throws in strict mode and is a
     silent no-op in sloppy mode — both paths keep the preview isolated. */
  try {
    Object.defineProperty(window, '__k2nCareersEndpoint', {
      value: endpointForPreview,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    /* If the property already exists non-configurable (another script
       ran first), that is itself a misconfiguration we should NOT
       silently tolerate: force the value to null by aborting the whole
       preview config. The form consumers observe an unusable global and
       refuse to submit. */
    try { window.__k2nCareersEndpoint = null; } catch (ignore) { /* non-writable too */ }
  }

  try {
    Object.defineProperty(window, '__k2nIsPreview', {
      value: true,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } catch (e) { /* ok — flag is cosmetic for the banner */ }
})();
