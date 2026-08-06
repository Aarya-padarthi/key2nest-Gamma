/* =========================================================================
   Key2Nest — Careers page (careers.html)
   Role pre-fill, validation, resume upload, and submission to the CAREERS
   Apps Script (separate from the contact-form pipeline on purpose — see
   careers-apps-script.gs). Unlike the contact forms, this POST reads the
   server's real response: an application must never silently vanish.
   ========================================================================= */
(function () {
  'use strict';

  /* Paste the /exec URL of the deployed careers Apps Script here.
     Until it is set, submissions show the failure message with the
     email fallback instead of pretending to succeed. */
  const CAREERS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzYJ7nsKdWAEm_Pn0qjowMYxfo__lxgXyQTJ5X-u-NFXwyrdSDcKdalTYcIxqmmBvo-mg/exec';

  const TURNSTILE_SITE_KEY = '0x4AAAAAADvDb65eLmlL1DhS';
  const MAX_RESUME_BYTES = 5 * 1024 * 1024;
  const RESUME_EXTS = ['.pdf', '.doc', '.docx'];

  const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  const isValidPhone = (v) => {
    const d = (v || '').replace(/\D/g, '');
    return d.length === 10 || (d.length === 11 && d[0] === '1');
  };

  const form = document.getElementById('careers-form');
  if (!form) return;

  /* ---------- Role "Apply" buttons → open the form inline under that role ----------
     There is no standalone form with a dropdown. Each role card (and the
     general-application link) carries a mount point; clicking Apply relocates
     the single apply panel into that mount, locked to the role, which closes it
     wherever it was before — so only one form is ever open, always under the
     role being applied to, and the role recorded in the sheet + email matches. */
  const applyPanel = document.getElementById('apply-panel');
  const roleInput = document.getElementById('c-role');
  const roleNameEls = ['apply-role-name', 'apply-role-locked'].map((id) => document.getElementById(id));
  let formRevealed = false;

  /* Turnstile can't survive being reparented (moving an iframe reloads it), so
     the widget is removed before each move and re-rendered in the new location. */
  function resetTurnstile() {
    if (tsWidget !== null && window.turnstile) {
      try { window.turnstile.remove(tsWidget); } catch (e) { /* already gone */ }
    }
    tsWidget = null;
    tsToken = '';
  }

  function revealApply(btn) {
    const role = btn.getAttribute('data-role-apply');
    const mount = btn.parentElement.querySelector('.role-apply-mount');
    if (!mount || !applyPanel) return;
    resetTurnstile();
    mount.appendChild(applyPanel); // relocate under this role; any previous mount is left empty
    roleInput.value = role;
    roleInput.setAttribute('value', role); // keep the role through form.reset()
    roleNameEls.forEach((el) => { if (el) el.textContent = role; });
    applyPanel.querySelectorAll('.form-success, .form-failure, .form-duplicate').forEach((b) => { b.hidden = true; });
    applyPanel.hidden = false;
    formRevealed = true;
    if (window.__k2nTs && window.__k2nTs.ready) window.__k2nTsRender();
    applyPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const first = document.getElementById('c-name');
    if (first) first.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-role-apply]').forEach((btn) => {
    btn.addEventListener('click', () => revealApply(btn));
  });

  const closeBtn = document.getElementById('apply-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      applyPanel.hidden = true;
      resetTurnstile();
    });
  }

  /* ---------- Turnstile (explicit render, theme-aware) ---------- */
  let tsToken = '';
  let tsWidget = null;
  window.__k2nTsRender = function () {
    if (!formRevealed) return; // don't render Turnstile into the still-hidden form
    const slot = document.getElementById('turnstile-careers');
    if (!slot || tsWidget !== null || !window.turnstile) return;
    tsWidget = window.turnstile.render(slot, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
      size: 'flexible',
      'refresh-expired': 'auto',
      callback: (t) => { tsToken = t; setErr('turnstile', ''); },
      'expired-callback': () => { tsToken = ''; },
      'error-callback': () => { tsToken = ''; }
    });
  };
  if (window.__k2nTs && window.__k2nTs.ready) window.__k2nTsRender();

  /* ---------- Inline errors ---------- */
  function setErr(key, msg) {
    const el = form.querySelector('[data-error-for="' + key + '"]');
    if (el) el.textContent = msg;
    const input = { name: 'c-name', email: 'c-email', phone: 'c-phone', location: 'c-location', resume: 'c-resume' }[key];
    if (input) {
      const node = document.getElementById(input);
      if (node) {
        node.classList.toggle('is-invalid', !!msg);
        node.setAttribute('aria-invalid', msg ? 'true' : 'false');
      }
    }
  }

  function resumeError(file) {
    if (!file) return 'Please attach your resume.';
    const dot = file.name.lastIndexOf('.');
    const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
    if (!RESUME_EXTS.includes(ext)) return 'Please attach a PDF or Word document (.pdf, .doc, .docx).';
    if (file.size > MAX_RESUME_BYTES) return 'That file is over 5 MB — please attach a smaller version.';
    return '';
  }

  function validate() {
    let ok = true;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const location = form.location.value.trim();
    const file = form.resume.files[0];

    if (!NAME_RE.test(name)) { setErr('name', 'Please enter your name (letters only).'); ok = false; } else setErr('name', '');
    if (!EMAIL_RE.test(email)) { setErr('email', 'Please enter a valid email address.'); ok = false; } else setErr('email', '');
    if (!isValidPhone(phone)) { setErr('phone', 'Please enter a valid 10-digit phone number.'); ok = false; } else setErr('phone', '');
    if (location.length < 2) { setErr('location', 'Please tell us your city and state.'); ok = false; } else setErr('location', '');
    const rErr = resumeError(file);
    if (rErr) { setErr('resume', rErr); ok = false; } else setErr('resume', '');
    if (!tsToken && !(window.__k2nTs && window.__k2nTs.failed)) {
      setErr('turnstile', 'Please complete the security check above.'); ok = false;
    } else setErr('turnstile', '');
    return ok;
  }

  ['c-name', 'c-email', 'c-phone', 'c-location'].forEach((id) => {
    const node = document.getElementById(id);
    node.addEventListener('blur', () => {
      const v = node.value.trim();
      if (!v) return;
      if (id === 'c-name' && !NAME_RE.test(v)) setErr('name', 'Please enter your name (letters only).');
      if (id === 'c-email' && !EMAIL_RE.test(v)) setErr('email', 'Please enter a valid email address.');
      if (id === 'c-phone' && !isValidPhone(v)) setErr('phone', 'Please enter a valid 10-digit phone number.');
    });
    node.addEventListener('input', () => setErr(id.replace('c-', ''), ''));
  });
  document.getElementById('c-resume').addEventListener('change', () => setErr('resume', ''));

  /* ---------- File → base64 ---------- */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  /* ---------- Submit ---------- */
  const submitBtn = form.querySelector('.form-submit');
  const successBox = form.querySelector('.form-success');
  const failureBox = form.querySelector('.form-failure');
  const duplicateBox = form.querySelector('.form-duplicate');
  let sending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    successBox.hidden = true;
    failureBox.hidden = true;
    if (duplicateBox) duplicateBox.hidden = true;
    if (!validate()) {
      const firstBad = form.querySelector('.is-invalid');
      if (firstBad) firstBad.focus();
      return;
    }

    sending = true;
    form.classList.add('is-sending');
    submitBtn.disabled = true;

    try {
      if (!CAREERS_ENDPOINT) throw new Error('endpoint-not-configured');
      const file = form.resume.files[0];
      const payload = {
        source: 'Careers page',
        role: form.role.value,
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        location: form.location.value.trim(),
        nmls: form.nmls.value.trim(),
        message: form.message.value.trim(),
        turnstileToken: tsToken,
        resumeName: file.name,
        resumeType: file.type || 'application/octet-stream',
        resumeData: await fileToBase64(file)
      };

      /* text/plain avoids a CORS preflight, which Apps Script cannot answer;
         the final response still carries CORS headers, so unlike the contact
         forms we can read the real verdict here. */
      const res = await fetch(CAREERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const out = await res.json();
      if (out && out.code === 'duplicate') {
        if (duplicateBox) {
          const roleSpan = duplicateBox.querySelector('.dup-role');
          if (roleSpan) roleSpan.textContent = roleInput.value ? ('the ' + roleInput.value + ' role') : 'this role';
          duplicateBox.hidden = false;
          duplicateBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return; // not a failure — the applicant already applied to this role
      }
      if (!out || out.ok !== true) throw new Error((out && out.error) || 'server-rejected');

      form.reset();
      successBox.hidden = false;
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      failureBox.hidden = false;
      failureBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      sending = false;
      form.classList.remove('is-sending');
      submitBtn.disabled = false;
      tsToken = '';
      if (tsWidget !== null && window.turnstile) window.turnstile.reset(tsWidget);
    }
  });
})();
