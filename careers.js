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
    const mount = document.getElementById('apply-mount'); // single mount below the role carousel
    if (!mount || !applyPanel) return;
    resetTurnstile();
    mount.appendChild(applyPanel); // relocate below the carousel; closes it wherever it was
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

/* =========================================================================
   Role carousel — 3D coverflow enhancement for the Loan Originator
   Opportunities. Progressive: only enhances when motion is allowed; without JS
   or under reduced-motion the markup stays an accessible stacked list of cards.
   ========================================================================= */
(function () {
  'use strict';
  const root = document.querySelector('[data-role-carousel]');
  if (!root) return;
  const viewport = root.querySelector('.role-carousel-viewport');
  const slides = Array.prototype.slice.call(root.querySelectorAll('[data-role-slide]'));
  const dots = Array.prototype.slice.call(root.querySelectorAll('[data-carousel-dot]'));
  if (!viewport || slides.length < 2) return;

  // Respect reduced-motion: leave the accessible stacked layout untouched.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('is-enhanced');
  const n = slides.length;
  let active = 0;

  function stepPx() {
    return Math.max(120, Math.min(210, viewport.clientWidth * 0.3));
  }

  function layout() {
    const step = stepPx();
    slides.forEach(function (slide, i) {
      let d = (i - active + n) % n;
      if (d > n / 2) d -= n;
      const abs = Math.abs(d);
      const tx = d * step;
      const tz = d === 0 ? 0 : -160 - (abs - 1) * 40;
      const ry = d === 0 ? 0 : (d < 0 ? 32 : -32);
      const sc = d === 0 ? 1 : Math.max(0.78, 0.9 - abs * 0.06);
      slide.style.transform =
        'translateX(calc(-50% + ' + tx + 'px)) translateZ(' + tz + 'px) rotateY(' + ry + 'deg) scale(' + sc + ')';
      slide.style.opacity = abs > 2 ? '0' : (d === 0 ? '1' : '0.5');
      slide.style.zIndex = String(n - abs);
      slide.style.pointerEvents = abs > 2 ? 'none' : 'auto';
      slide.classList.toggle('is-active', d === 0);
      slide.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      slide.querySelectorAll('button, a, input, textarea').forEach(function (el) {
        el.tabIndex = d === 0 ? 0 : -1;
      });
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  }

  function go(i) { active = ((i % n) + n) % n; layout(); }
  function next() { go(active + 1); }
  function prev() { go(active - 1); }

  // Click a non-active slide (but not its buttons/links) to bring it to centre.
  slides.forEach(function (slide, i) {
    slide.addEventListener('click', function (e) {
      if (i !== active && !e.target.closest('button, a')) go(i);
    });
  });

  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  dots.forEach(function (dot, i) { dot.addEventListener('click', function () { go(i); }); });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  });

  // Touch swipe.
  let startX = 0;
  viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 45) { if (dx > 0) next(); else prev(); }
  }, { passive: true });

  // Hover-tilt on the active slide, applied via CSS vars to its inner layer so
  // it doesn't fight the positioning transition.
  viewport.addEventListener('mousemove', function (e) {
    const slide = slides[active];
    if (!slide) return;
    const r = slide.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    slide.style.setProperty('--tiltY', (px * 9).toFixed(2) + 'deg');
    slide.style.setProperty('--tiltX', (py * -6).toFixed(2) + 'deg');
  });
  viewport.addEventListener('mouseleave', function () {
    slides.forEach(function (s) { s.style.setProperty('--tiltY', '0deg'); s.style.setProperty('--tiltX', '0deg'); });
  });

  let rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });

  layout();
})();
