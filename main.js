/* =========================================================================
   Key2Nest V3 — Interactions, animations, calculators, donut, forms
   ========================================================================= */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = !!(conn && (conn.saveData || /(2g|slow-2g)/.test(conn.effectiveType || '')));

  const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbysqolgKHBm0Vh70-s-kx7_zVsa1__9DXfuGLwpjX4RJdW56RMZfHvJE2W7rLnQ_Oma/exec';

  document.getElementById('footer-year').textContent = new Date().getFullYear();

  /* ------------------- Theme system: system-auto default + manual override -------------------
     First visit follows the OS (prefers-color-scheme) and keeps following it live.
     Clicking the toggle stores a manual choice, which wins from then on. */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const setTheme = (t, persist) => {
    const changed = document.documentElement.dataset.theme !== t;
    document.documentElement.dataset.theme = t;
    if (persist) { try { localStorage.setItem('k2n-theme', t); } catch (e) { /* private mode */ } }
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#F4EFE3' : '#0B1A2E');
    if (changed && window.__k2nReskinTs) window.__k2nReskinTs(); // Turnstile widgets re-render to match
  };
  setTheme(document.documentElement.dataset.theme || 'dark', false); // sync meta with bootstrapped theme — never persists
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true);
  });
  // Follow live OS changes only while the visitor has made no manual choice
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem('k2n-theme'); } catch (err) { /* private mode */ }
    if (!stored) setTheme(e.matches ? 'light' : 'dark', false);
  });

  /* ------------------- Shared field validation ------------------- */
  // Names: letters (incl. accents), spaces, hyphens, apostrophes, periods — no digits
  const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'’-]+$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  const isValidPhone = (v) => {
    const d = v.replace(/\D/g, '');
    return d.length === 10 || (d.length === 11 && d[0] === '1');
  };

  /* ------------------- Program card → contact form pre-fill ------------------- */
  document.querySelectorAll('[data-program-cta]').forEach((link) => {
    link.addEventListener('click', () => {
      const card = link.closest('.program-card');
      const title = card?.querySelector('.program-title')?.textContent.trim();
      const select = document.getElementById('f-loan');
      if (!title || !select) return;
      const t = title.toLowerCase();
      const match = Array.from(select.options).find((o) => o.value.toLowerCase() === t)
        || Array.from(select.options).find((o) => o.value.toLowerCase().includes(t) || t.includes(o.value.toLowerCase()));
      if (match) {
        select.value = match.value;
        // Brief visual pulse so user sees the pre-fill happen. Colour comes from
        // the --prefill-pulse token (Rev10 rule: no literal hexes in components);
        // kept inline so it still wins over the theme's field background.
        select.style.transition = 'background-color 600ms ease';
        select.style.backgroundColor = 'var(--prefill-pulse)';
        setTimeout(() => { select.style.backgroundColor = ''; }, 1400);
      }
    });
  });

  /* ------------------- Mobile nav ------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    mobileNav.hidden = expanded;
  });
  mobileNav?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
    });
  });

  /* ------------------- Nav scroll state ------------------- */
  const nav = document.getElementById('site-nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------- Hero video ------------------- */
  const video = document.getElementById('hero-video');
  if (video && !reduced && !isMobile && !saveData) {
    const source = document.createElement('source');
    source.src = 'assets/home_hero.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();
    video.addEventListener('canplay', () => {
      video.play().then(() => video.classList.add('is-ready')).catch(() => {});
    }, { once: true });
  }

  /* ------------------- GSAP animations -------------------
     Bulletproof: [data-reveal] elements start at opacity:0 in CSS, so if the
     animation system never runs, content would be invisible. This guarantees
     content ALWAYS shows — even if the GSAP CDN is blocked, slow, or down. */

  // Instantly reveal everything, no animation (reduced-motion / GSAP unavailable).
  const revealAllStatic = () => {
    document.body.classList.add('no-anim');
    document.querySelectorAll('[data-reveal]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.querySelectorAll('.hero-line-inner').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.querySelectorAll('[data-count-to]').forEach((el) => { el.textContent = el.dataset.countTo; });
  };

  const runGsapAnimations = () => {
    const { gsap } = window;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTL
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8, delay: 0.2 })
      .to('.hero-line-inner', { y: '0%', opacity: 1, duration: 1.1, stagger: 0.14, ease: 'expo.out' }, '-=0.4')
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7')
      .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6');

    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        if (el.classList.contains('hero-eyebrow') || el.classList.contains('hero-sub') || el.classList.contains('hero-ctas') || el.dataset.reveal === 'split') return;
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      // Hero parallax — scrub:0.5 smooths frame-to-frame jitter; gentler yPercent reduces GPU work
      if (!isMobile) {
        gsap.to('.hero-media', {
          yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true },
        });
      }
      document.querySelectorAll('[data-count-to]').forEach((el) => {
        const target = parseInt(el.dataset.countTo, 10);
        const obj = { v: 0 };
        el.textContent = '0'; // static HTML holds the real number for no-JS / reduced-motion; reset to 0 only when we actually animate
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => { el.textContent = Math.round(obj.v); },
          onComplete: () => { el.textContent = target; }, // guarantee the exact final number
        });
      });
    } else {
      // Core GSAP present but ScrollTrigger missing — keep the hero intro, reveal the rest statically.
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        if (el.classList.contains('hero-eyebrow') || el.classList.contains('hero-sub') || el.classList.contains('hero-ctas') || el.dataset.reveal === 'split') return;
        el.style.opacity = '1'; el.style.transform = 'none';
      });
      document.querySelectorAll('[data-count-to]').forEach((el) => { el.textContent = el.dataset.countTo; });
    }

    if (!isMobile) {
      document.querySelectorAll('.btn-primary').forEach((btn) => {
        let raf = 0;
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.18;
          const y = (e.clientY - r.top - r.height / 2) * 0.18;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            gsap.to(btn, { x, y, duration: 0.4, ease: 'power3.out' });
          });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
        });
      });
    }
  };

  // Choose a path — content is NEVER left hidden.
  if (reduced) {
    revealAllStatic();
  } else if (window.gsap) {
    runGsapAnimations();
  } else {
    // GSAP not ready when main.js ran (deferred CDN still loading, or blocked).
    // Wait for it, but guarantee a reveal so the page can't stay blank.
    let settled = false;
    const decide = () => {
      if (settled) return;
      settled = true;
      if (window.gsap) runGsapAnimations(); else revealAllStatic();
    };
    window.addEventListener('load', decide);   // fires after deferred scripts + assets
    setTimeout(decide, 1200);                  // hard failsafe if 'load' is delayed
  }

  /* =========================================================================
     CALCULATOR INFRASTRUCTURE
     ========================================================================= */

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* Empty-state: every calculator opens blank with its sliders parked at the
     left. Nothing is computed until the visitor has supplied every input the
     formula needs — showing a payment derived from a 0.5% rate they never
     chose would be worse than showing nothing. */
  const EMPTY = '—';
  const isBlank = (el) => !el || String(el.value).trim() === '';
  const anyBlank = (els) => els.some(isBlank);
  const blankOut = (els) => els.forEach((el) => {
    if (!el) return;
    if (el.__k2nTween) { el.__k2nTween.kill(); el.__k2nTween = null; }
    el.textContent = EMPTY;
  });
  const setPanelEmpty = (panelId, empty) => {
    document.getElementById(panelId)?.classList.toggle('is-calc-empty', empty);
  };

  const setRangeFill = (range) => {
    const min = parseFloat(range.min);
    const max = parseFloat(range.max);
    const val = parseFloat(range.value);
    const pct = ((val - min) / (max - min)) * 100;
    range.style.setProperty('--calc-fill', `${pct}%`);
  };

  const syncPair = (numberEl, rangeEl, onChange) => {
    setRangeFill(rangeEl);
    rangeEl.addEventListener('input', () => {
      numberEl.value = rangeEl.value;
      setRangeFill(rangeEl);
      onChange();
    });
    numberEl.addEventListener('input', () => {
      // Cleared field → park the slider back at the left and re-render empty.
      if (isBlank(numberEl)) {
        rangeEl.value = rangeEl.min;
        setRangeFill(rangeEl);
        onChange();
        return;
      }
      const min = parseFloat(rangeEl.min);
      const max = parseFloat(rangeEl.max);
      const v = clamp(parseFloat(numberEl.value) || min, min, max);
      rangeEl.value = v;
      setRangeFill(rangeEl);
      onChange();
    });
    numberEl.addEventListener('blur', () => {
      // Leave an untouched field empty — never auto-fill it with the minimum.
      if (isBlank(numberEl)) { onChange(); return; }
      const min = parseFloat(numberEl.min || 0);
      const max = parseFloat(numberEl.max || Infinity);
      const v = clamp(parseFloat(numberEl.value) || min, min, max);
      numberEl.value = v;
      const rMin = parseFloat(rangeEl.min);
      const rMax = parseFloat(rangeEl.max);
      rangeEl.value = clamp(v, rMin, rMax);
      setRangeFill(rangeEl);
      onChange();
    });
  };

  const monthlyPI = (principal, annualRate, years) => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (principal <= 0 || n <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const tweenNumber = (el, target, format = fmt) => {
    if (!el) return;
    if (window.gsap && !reduced) {
      const prev = parseFloat((el.textContent || '0').replace(/[^\d.-]/g, '')) || 0;
      const obj = { v: prev };
      // Held on the element so blankOut can kill an in-flight tween — otherwise
      // clearing a field mid-tween would let stale numbers overwrite the dash.
      el.__k2nTween = window.gsap.to(obj, {
        v: target, duration: 0.6, ease: 'power2.out',
        onUpdate: () => { el.textContent = format(obj.v); },
      });
    } else {
      el.textContent = format(target);
    }
  };

  /* ------------------- Tabs ------------------- */

  const tabs = document.querySelectorAll('.calc-tab');
  const panels = document.querySelectorAll('.calc-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.calcTab;
      tabs.forEach((t) => {
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        t.tabIndex = t === tab ? 0 : -1;
      });
      panels.forEach((p) => { p.hidden = p.id !== `calc-panel-${id}`; });
      const active = document.getElementById(`calc-panel-${id}`);
      active?.querySelectorAll('.calc-range').forEach(setRangeFill);
      if (id === 'afford') aCalc();
      else if (id === 'refi') rCalc();
      else if (id === 'extra') eCalc();
      else pCalc();
    });
  });

  /* ------------------- Panel 1: Mortgage Payment ------------------- */

  const P = {
    price: $('p-price'), priceR: $('p-price-range'),
    downD: $('p-down-dollar'), downP: $('p-down-pct'), downR: $('p-down-range'),
    term: $('p-term'), termR: $('p-term-range'),
    rate: $('p-rate'), rateR: $('p-rate-range'),
    bpTax: $('p-bp-tax'), bpIns: $('p-bp-ins'), bpHoa: $('p-bp-hoa'),
    outTotal: $('p-total'),
    outDonutTotal: $('p-donut-total'),
    outLoan: $('p-loan-amount'),
    outPiOnly: $('p-pi-only'),
    bpPi: $('p-bp-pi'), bpTotal: $('p-bp-total'),
    segPi: $('d-seg-pi'), segTax: $('d-seg-tax'), segIns: $('d-seg-ins'), segHoa: $('d-seg-hoa'),
    downError: $('p-down-error'),
  };

  const DONUT_CIRC = 2 * Math.PI * 50;
  const setDonutSeg = (el, valuePct, accumulatedPct) => {
    const seg = (valuePct / 100) * DONUT_CIRC;
    const gap = DONUT_CIRC - seg;
    el.setAttribute('stroke-dasharray', `${seg} ${gap}`);
    el.setAttribute('stroke-dashoffset', `${-(accumulatedPct / 100) * DONUT_CIRC}`);
  };

  let pDownLock = 'pct';

  // Down payment is satisfied by EITHER the dollar or the percent field.
  const pIsEmpty = () => anyBlank([P.price, P.term, P.rate]) || (isBlank(P.downD) && isBlank(P.downP));
  const pRenderEmpty = () => {
    blankOut([P.outTotal, P.outDonutTotal, P.outLoan, P.outPiOnly, P.bpPi, P.bpTotal]);
    [P.segPi, P.segTax, P.segIns, P.segHoa].forEach((seg) => setDonutSeg(seg, 0, 0));
    P.downError.textContent = '';
    setPanelEmpty('calc-panel-payment', true);
  };

  const pCalc = () => {
    if (pIsEmpty()) { pRenderEmpty(); return; }
    setPanelEmpty('calc-panel-payment', false);

    const price = clamp(parseFloat(P.price.value) || 0, 0, 5_000_000);
    let downD = parseFloat(P.downD.value) || 0;
    let downP_ = parseFloat(P.downP.value) || 0;

    // Derive from whichever down-payment field the visitor actually filled.
    if (pDownLock === 'dollar' && isBlank(P.downD)) pDownLock = 'pct';
    if (pDownLock === 'pct' && isBlank(P.downP)) pDownLock = 'dollar';

    if (pDownLock === 'dollar') {
      // Validate: down cannot exceed price
      if (downD > price && price > 0) {
        P.downError.textContent = "Down payment can't exceed home price — adjusted to 100%.";
        downD = price;
        P.downD.value = Math.round(downD);
      } else {
        P.downError.textContent = '';
      }
      downP_ = price > 0 ? (downD / price) * 100 : 0;
      P.downP.value = (Math.round(downP_ * 10) / 10).toFixed(1);
    } else {
      P.downError.textContent = '';
      downD = price * (downP_ / 100);
      P.downD.value = Math.round(downD);
    }
    P.downR.value = clamp(downP_, 0, parseFloat(P.downR.max));
    setRangeFill(P.downR);

    const loan = Math.max(0, price - downD);
    const term = clamp(parseInt(P.term.value, 10) || 30, 5, 40);
    const rate = clamp(parseFloat(P.rate.value) || 0, 0.01, 14);

    const pi = monthlyPI(loan, rate, term);
    const tax = Math.max(0, parseFloat(P.bpTax.value) || 0);
    const ins = Math.max(0, parseFloat(P.bpIns.value) || 0);
    const hoa = Math.max(0, parseFloat(P.bpHoa.value) || 0);
    const total = pi + tax + ins + hoa;

    tweenNumber(P.outTotal, total);
    tweenNumber(P.outDonutTotal, total);
    P.outLoan.textContent = '$' + fmt(loan);
    P.outPiOnly.textContent = '$' + fmt(pi);
    P.bpPi.textContent = fmt(pi);
    tweenNumber(P.bpTotal, total);

    if (total > 0) {
      const piPct = (pi / total) * 100;
      const taxPct = (tax / total) * 100;
      const insPct = (ins / total) * 100;
      const hoaPct = (hoa / total) * 100;
      setDonutSeg(P.segPi, piPct, 0);
      setDonutSeg(P.segTax, taxPct, piPct);
      setDonutSeg(P.segIns, insPct, piPct + taxPct);
      setDonutSeg(P.segHoa, hoaPct, piPct + taxPct + insPct);
    }

  };

  syncPair(P.price, P.priceR, () => { pDownLock = 'pct'; pCalc(); });
  P.downD.addEventListener('input', () => { pDownLock = 'dollar'; pCalc(); });
  P.downD.addEventListener('blur', () => { pDownLock = 'dollar'; pCalc(); });
  syncPair(P.downP, P.downR, () => { pDownLock = 'pct'; pCalc(); });
  syncPair(P.term, P.termR, pCalc);
  syncPair(P.rate, P.rateR, pCalc);
  [P.bpTax, P.bpIns, P.bpHoa].forEach((el) => {
    el.addEventListener('input', pCalc);
    el.addEventListener('blur', pCalc);
  });
  pCalc();

  /* ------------------- Panel 2: Affordability ------------------- */

  const A = {
    income: $('a-income'), incomeR: $('a-income-range'),
    debts: $('a-debts'), down: $('a-down'),
    rate: $('a-rate'), rateR: $('a-rate-range'),
    term: $('a-term'), termR: $('a-term-range'),
    outPrice: $('a-out-price'), outMonthly: $('a-out-monthly'), outLoan: $('a-out-loan'),
  };

  const aCalc = () => {
    if (anyBlank([A.income, A.debts, A.down, A.rate, A.term])) {
      blankOut([A.outPrice, A.outMonthly, A.outLoan]);
      setPanelEmpty('calc-panel-afford', true);
      return;
    }
    setPanelEmpty('calc-panel-afford', false);

    const income = Math.max(0, parseFloat(A.income.value) || 0);
    const debts = Math.max(0, parseFloat(A.debts.value) || 0);
    const down = Math.max(0, parseFloat(A.down.value) || 0);
    const rate = clamp(parseFloat(A.rate.value) || 0, 0.01, 14);
    const term = clamp(parseInt(A.term.value, 10) || 30, 5, 40);

    const grossMonthly = income / 12;
    const maxHousingMonthly = Math.max(0, grossMonthly * 0.36 - debts);

    const r = rate / 100 / 12;
    const n = term * 12;
    let maxLoan = 0;
    if (maxHousingMonthly > 0 && r > 0) {
      maxLoan = maxHousingMonthly * (1 - Math.pow(1 + r, -n)) / r;
    } else if (maxHousingMonthly > 0) {
      maxLoan = maxHousingMonthly * n;
    }
    const maxPrice = maxLoan + down;

    tweenNumber(A.outPrice, maxPrice);
    tweenNumber(A.outMonthly, maxHousingMonthly);
    tweenNumber(A.outLoan, maxLoan);

  };
  syncPair(A.income, A.incomeR, aCalc);
  A.debts.addEventListener('input', aCalc);
  A.debts.addEventListener('blur', aCalc);
  A.down.addEventListener('input', aCalc);
  A.down.addEventListener('blur', aCalc);
  syncPair(A.rate, A.rateR, aCalc);
  syncPair(A.term, A.termR, aCalc);
  aCalc();

  /* ------------------- Panel 3: Refinance ------------------- */

  const R = {
    bal: $('r-balance'), balR: $('r-balance-range'),
    rateOld: $('r-rate-old'), rateOldR: $('r-rate-old-range'),
    rateNew: $('r-rate-new'), rateNewR: $('r-rate-new-range'),
    term: $('r-term'), termR: $('r-term-range'),
    outSavings: $('r-out-savings'), outSavingsNote: $('r-out-savings-note'),
    outNew: $('r-out-new'), outOld: $('r-out-old'),
    outLifetime: $('r-out-lifetime'),
  };
  const rCalc = () => {
    if (anyBlank([R.bal, R.rateOld, R.rateNew, R.term])) {
      blankOut([R.outSavings, R.outNew, R.outOld, R.outLifetime]);
      R.outSavingsNote.textContent = 'Enter your loan details to compare rates';
      setPanelEmpty('calc-panel-refi', true);
      return;
    }
    setPanelEmpty('calc-panel-refi', false);

    const balance = Math.max(0, parseFloat(R.bal.value) || 0);
    const rateOld = clamp(parseFloat(R.rateOld.value) || 0, 0.01, 14);
    const rateNew = clamp(parseFloat(R.rateNew.value) || 0, 0.01, 14);
    const term = clamp(parseInt(R.term.value, 10) || 30, 1, 40);

    const oldM = monthlyPI(balance, rateOld, term);
    const newM = monthlyPI(balance, rateNew, term);
    const savings = oldM - newM;
    const lifetime = savings * term * 12;

    tweenNumber(R.outOld, oldM);
    tweenNumber(R.outNew, newM);
    tweenNumber(R.outSavings, Math.max(0, savings));
    tweenNumber(R.outLifetime, Math.max(0, lifetime));

    if (savings > 0) {
      R.outSavingsNote.textContent = `$${fmt(savings)} less every month at the new rate.`;
    } else if (savings < 0) {
      R.outSavingsNote.textContent = `Your new payment would be $${fmt(-savings)} higher — refinance may not pay off.`;
    } else {
      R.outSavingsNote.textContent = 'No monthly change at this rate.';
    }

  };
  syncPair(R.bal, R.balR, rCalc);
  syncPair(R.rateOld, R.rateOldR, rCalc);
  syncPair(R.rateNew, R.rateNewR, rCalc);
  syncPair(R.term, R.termR, rCalc);
  rCalc();

  /* ------------------- Panel 4: Extra Payment ------------------- */

  const E = {
    bal: $('e-balance'), balR: $('e-balance-range'),
    rate: $('e-rate'), rateR: $('e-rate-range'),
    term: $('e-term'), termR: $('e-term-range'),
    extra: $('e-extra'), extraR: $('e-extra-range'),
    outYears: $('e-out-years'), outPayoffDate: $('e-out-payoff-date'),
    outIntSaved: $('e-out-int-saved'), outNewMonthly: $('e-out-new-monthly'),
    outOrigMonthly: $('e-out-orig-monthly'), outMonths: $('e-out-months'),
  };
  const eCalc = () => {
    if (anyBlank([E.bal, E.rate, E.term, E.extra])) {
      blankOut([E.outYears, E.outMonths, E.outIntSaved, E.outNewMonthly, E.outOrigMonthly, E.outPayoffDate]);
      setPanelEmpty('calc-panel-extra', true);
      return;
    }
    setPanelEmpty('calc-panel-extra', false);

    const balance = Math.max(0, parseFloat(E.bal.value) || 0);
    const rate = clamp(parseFloat(E.rate.value) || 0, 0.01, 14);
    const term = clamp(parseInt(E.term.value, 10) || 30, 1, 40);
    const extra = Math.max(0, parseFloat(E.extra.value) || 0);

    const r = rate / 100 / 12;
    const origMonths = term * 12;
    const origMonthly = monthlyPI(balance, rate, term);
    const newMonthly = origMonthly + extra;

    let newMonths = origMonths;
    if (newMonthly > balance * r && r > 0) {
      newMonths = -Math.log(1 - balance * r / newMonthly) / Math.log(1 + r);
      newMonths = Math.ceil(newMonths);
    }
    const monthsSaved = Math.max(0, origMonths - newMonths);
    const yearsSaved = Math.floor(monthsSaved / 12);
    const totalOrig = origMonthly * origMonths;
    const totalNew = newMonthly * newMonths;
    const intSaved = Math.max(0, totalOrig - totalNew);

    tweenNumber(E.outYears, yearsSaved);
    tweenNumber(E.outMonths, monthsSaved);
    tweenNumber(E.outIntSaved, intSaved);
    tweenNumber(E.outNewMonthly, newMonthly);
    tweenNumber(E.outOrigMonthly, origMonthly);

    const payoff = new Date();
    payoff.setMonth(payoff.getMonth() + newMonths);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    E.outPayoffDate.textContent = `${months[payoff.getMonth()]} ${payoff.getFullYear()}`;

  };
  syncPair(E.bal, E.balR, eCalc);
  syncPair(E.rate, E.rateR, eCalc);
  syncPair(E.term, E.termR, eCalc);
  syncPair(E.extra, E.extraR, eCalc);
  eCalc();

  /* =========================================================================
     CLOUDFLARE TURNSTILE — bot protection for both inquiry forms.
     Tokens are single-use: reset after every submission attempt. Expired
     tokens auto-refresh ('refresh-expired': 'auto'), so a form left open
     stays submittable without user action.
     ========================================================================= */

  const TURNSTILE_SITE_KEY = '0x4AAAAAADvDb65eLmlL1DhS';
  const tsTokens = { contact: '', midcap: '' };
  const tsWidgets = { contact: null, midcap: null };

  const clearTsError = (key) => {
    if (key === 'contact') {
      const el = document.querySelector('#contact-form [data-error-for="turnstile"]');
      if (el) el.textContent = '';
    } else {
      const el = document.querySelector('#midcap-form .midcap-error');
      if (el && el.dataset.tsError === '1') { el.hidden = true; el.dataset.tsError = ''; }
    }
  };

  const renderTurnstile = () => {
    if (!window.turnstile) return;
    [['contact', 'turnstile-contact', 'contact-form'], ['midcap', 'turnstile-midcap', 'midcap-form']].forEach(([key, slotId, action]) => {
      const slot = document.getElementById(slotId);
      if (!slot || tsWidgets[key] !== null) return;
      tsWidgets[key] = window.turnstile.render(slot, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        size: 'flexible',
        action,
        'refresh-expired': 'auto',
        callback: (token) => { tsTokens[key] = token; clearTsError(key); },
        'expired-callback': () => { tsTokens[key] = ''; },
        'error-callback': () => { tsTokens[key] = ''; },
      });
    });
  };

  const resetTurnstile = (key) => {
    tsTokens[key] = '';
    if (window.turnstile && tsWidgets[key] !== null) window.turnstile.reset(tsWidgets[key]);
  };

  // Widget theme is fixed at render time — on a theme switch, tear down and
  // re-render both widgets so they match the new surface. Exposed on window
  // because setTheme is declared earlier in the file.
  window.__k2nReskinTs = () => {
    if (!window.turnstile) return;
    ['contact', 'midcap'].forEach((key) => {
      if (tsWidgets[key] !== null) {
        window.turnstile.remove(tsWidgets[key]);
        tsWidgets[key] = null;
        tsTokens[key] = '';
      }
    });
    renderTurnstile();
  };

  const tsMessage = () =>
    (window.__k2nTs && window.__k2nTs.failed) || !window.turnstile
      ? 'Our security check could not load. Please refresh the page — or call +1 469 481 6216 and we’ll take care of you directly.'
      : 'One moment — please complete the security check above, then send again.';

  if (window.__k2nTs && window.__k2nTs.ready) renderTurnstile();
  else if (window.__k2nTs) window.__k2nTs.queue.push(renderTurnstile);

  /* =========================================================================
     CONTACT FORM
     ========================================================================= */

  const form = document.getElementById('contact-form');
  const submitBtn = form.querySelector('.form-submit');
  const successEl = form.querySelector('.form-success');
  const failEl = form.querySelector('.form-failure');

  const setFieldError = (name, msg) => {
    const el = form.querySelector(`[name="${name}"]`);
    const err = form.querySelector(`[data-error-for="${name}"]`);
    if (el) {
      el.classList.toggle('is-invalid', !!msg);
      // The red ring alone is a visual-only signal. aria-invalid exposes the
      // state, and aria-describedby in the markup ties the field to this
      // message so a screen reader reads the reason, not just "invalid".
      if (msg) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
    if (err) err.textContent = msg || '';
  };

  const fieldChecks = {
    name: (v) => {
      if (!v) return 'Please enter your name.';
      if (!NAME_RE.test(v)) return 'Names can only contain letters, spaces, hyphens, and apostrophes.';
      return '';
    },
    email: (v) => {
      if (!v) return 'Please enter your email address.';
      if (!EMAIL_RE.test(v)) return 'Please enter a valid email address (e.g. name@example.com).';
      return '';
    },
    phone: (v) => {
      if (!v) return 'Please enter your phone number.';
      if (!isValidPhone(v)) return 'Please enter a valid 10-digit phone number.';
      return '';
    },
  };

  const validate = () => {
    let ok = true;
    const data = new FormData(form);
    Object.keys(fieldChecks).forEach((field) => {
      const msg = fieldChecks[field]((data.get(field) || '').toString().trim());
      setFieldError(field, msg);
      if (msg) ok = false;
    });
    return ok;
  };

  // Validate each field as the user leaves it — catch mistakes before submit
  Object.keys(fieldChecks).forEach((field) => {
    const el = form.querySelector(`[name="${field}"]`);
    el?.addEventListener('blur', () => {
      if (el.value.trim()) setFieldError(field, fieldChecks[field](el.value.trim()));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.hidden = true;
    failEl.hidden = true;
    clearTsError('contact');
    if (!validate()) {
      form.querySelector('.is-invalid')?.focus();
      return;
    }

    // Turnstile gate — never send without a completed verification token
    if (!tsTokens.contact) {
      const tErr = form.querySelector('[data-error-for="turnstile"]');
      if (tErr) tErr.textContent = tsMessage();
      document.getElementById('turnstile-contact')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.timestamp = new Date().toISOString();
    payload.source = 'Website V3';
    payload.turnstileToken = tsTokens.contact;
    // Fold preferred call time into message body so it lands in the sheet
    if (payload.callTime) {
      payload.message = `${payload.message || ''}\n\n[Preferred call time: ${payload.callTime}]`.trim();
      delete payload.callTime;
    }

    try {
      await fetch(SHEETS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      form.reset();
      successEl.hidden = false;
      successEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    } catch (err) {
      console.error('Form submit failed:', err);
      failEl.hidden = false;
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
      resetTurnstile('contact'); // token consumed — fresh one for any follow-up send
    }
  });

  form.querySelectorAll('input, textarea').forEach((el) => {
    el.addEventListener('input', () => {
      if (el.classList.contains('is-invalid')) setFieldError(el.name, '');
    });
  });

  /* =========================================================================
     MID-PAGE CAPTURE FORM
     ========================================================================= */

  const midForm = document.getElementById('midcap-form');
  if (midForm) {
    const midSuccess = midForm.querySelector('.midcap-success');
    const nameInput = midForm.querySelector('[name="name"]');
    const contactInput = midForm.querySelector('[name="contact"]');
    const submitBtn = midForm.querySelector('button[type="submit"]');

    // Inline error element — inserted before success
    let midError = midForm.querySelector('.midcap-error');
    if (!midError) {
      midError = document.createElement('p');
      midError.className = 'midcap-error';
      midError.setAttribute('role', 'alert');
      midError.hidden = true;
      midSuccess.insertAdjacentElement('beforebegin', midError);
    }
    // Both fields share this single message element, so both point at it.
    if (!midError.id) midError.id = 'midcap-error-msg';
    [nameInput, contactInput].forEach((el) => el.setAttribute('aria-describedby', midError.id));

    const setInvalid = (el, invalid) => {
      el.classList.toggle('is-invalid', invalid);
      if (invalid) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    };

    // Clear invalid styling and any error message as user types
    [nameInput, contactInput].forEach((el) => {
      el.addEventListener('input', () => {
        setInvalid(el, false);
        midError.hidden = true;
      });
    });

    // Flag bad formats as soon as the user leaves the field
    nameInput.addEventListener('blur', () => {
      const v = nameInput.value.trim();
      if (v) setInvalid(nameInput, !NAME_RE.test(v));
    });
    contactInput.addEventListener('blur', () => {
      const v = contactInput.value.trim();
      if (v) setInvalid(contactInput, !EMAIL_RE.test(v) && !isValidPhone(v));
    });

    midForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      midSuccess.hidden = true;
      midError.hidden = true;

      const name = nameInput.value.trim();
      const contact = contactInput.value.trim();
      const contactIsEmail = EMAIL_RE.test(contact);
      const contactIsPhone = isValidPhone(contact);

      setInvalid(nameInput, false);
      setInvalid(contactInput, false);

      const problems = [];
      if (!name) {
        setInvalid(nameInput, true);
        problems.push('your name');
      } else if (!NAME_RE.test(name)) {
        setInvalid(nameInput, true);
        problems.push('a valid name (letters only)');
      }
      if (!contact || (!contactIsEmail && !contactIsPhone)) {
        setInvalid(contactInput, true);
        problems.push('a valid email address or 10-digit phone number');
      }

      if (problems.length) {
        midError.textContent = `Please enter ${problems.join(' and ')} so we can reach out.`;
        midError.hidden = false;
        midForm.querySelector('.is-invalid')?.focus();
        return;
      }

      // Turnstile gate — never send without a completed verification token
      if (!tsTokens.midcap) {
        midError.textContent = tsMessage();
        midError.dataset.tsError = '1';
        midError.hidden = false;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');

      const payload = {
        name,
        email: contactIsEmail ? contact : '',
        phone: contactIsEmail ? '' : contact,
        loanType: 'Mid-page inquiry',
        message: 'Quick inquiry via mid-page form. Borrower wants to know what they qualify for.',
        timestamp: new Date().toISOString(),
        source: 'Website V3 — Mid-page',
        turnstileToken: tsTokens.midcap,
      };

      try {
        await fetch(SHEETS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        midForm.reset();
        midSuccess.hidden = false;
        midSuccess.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      } catch (err) {
        console.error('Mid-page submit failed:', err);
        midError.innerHTML = 'Something went wrong sending your inquiry. Please call <a href="tel:+14694816216" class="link-brass">+1 469 · 481 · 6216</a> or use the full form below.';
        midError.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        resetTurnstile('midcap'); // token consumed — fresh one for any follow-up send
      }
    });
  }
})();

/* ============================================================
   TEAM CARD — split profile modal (photo left · details right)
   Card shows contact lines + "View profile"; the photo and the
   View-profile button open the full profile. Bio lives in the modal.
   ============================================================ */
(() => {
  // Inject modal shell once — horizontal split: rectangular photo left, info right
  document.body.insertAdjacentHTML('beforeend', `
    <div id="team-modal" class="team-modal-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="tm-name">
      <div class="team-modal-card team-modal-card-split">
        <button class="team-modal-close" aria-label="Close profile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div id="tm-photo" class="team-modal-photo-lg"></div>
        <div class="team-modal-info">
          <h3 class="team-modal-name font-display" id="tm-name"></h3>
          <p class="team-modal-title" id="tm-title"></p>
          <div class="team-modal-nmls" id="tm-nmls"></div>
          <div class="team-modal-divider"></div>
          <p class="team-modal-bio" id="tm-bio"></p>
          <div class="team-modal-contact" id="tm-contact"></div>
        </div>
      </div>
    </div>`);

  const overlay  = document.getElementById('team-modal');
  const closeBtn = overlay.querySelector('.team-modal-close');
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lockY = 0;
  let lastTrigger = null; // control that opened the dialog — focus returns here
  let closing = false;

  const openModal = (card, trigger) => {
    const photo    = card.querySelector('.team-photo');
    const initials = card.querySelector('.team-initials');
    const photoEl  = document.getElementById('tm-photo');

    if (photo) {
      photoEl.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" />`;
    } else {
      photoEl.innerHTML = `<span class="team-modal-initials-lg">${initials ? initials.textContent : ''}</span>`;
    }

    document.getElementById('tm-name').textContent  = card.querySelector('.team-name')?.textContent || '';
    document.getElementById('tm-title').textContent = card.querySelector('.team-title')?.textContent || '';
    document.getElementById('tm-nmls').innerHTML    = card.querySelector('.team-nmls')?.innerHTML || '';
    document.getElementById('tm-bio').textContent   = card.querySelector('.team-bio')?.textContent || '';
    // Clone the card's contact lines (phone / email / WhatsApp) into the modal
    document.getElementById('tm-contact').innerHTML = card.querySelector('.team-contact')?.innerHTML || '';

    lastTrigger = trigger || document.activeElement;
    lockY = window.scrollY;
    document.body.style.cssText += `position:fixed;top:-${lockY}px;width:100%;overflow:hidden;`;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    closeBtn.focus();
  };

  const finishClose = () => {
    if (!closing) return;               // idempotent — transitionend or failsafe, whichever lands first
    closing = false;
    overlay.removeEventListener('transitionend', onTransitionEnd);
    overlay.hidden = true;
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.width    = '';
    document.body.style.overflow = '';
    window.scrollTo({ top: lockY, behavior: 'instant' });
    // Focus returns to the button that opened the dialog, so keyboard users
    // resume where they left off instead of at the top of the document.
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  };

  // Only the overlay's own transition counts — the inner card also transitions
  // and its event bubbles up here, which would otherwise close early.
  function onTransitionEnd(e) { if (e.target === overlay) finishClose(); }

  const closeModal = () => {
    if (closing || overlay.hidden) return;
    closing = true;
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', onTransitionEnd);
    // Failsafe: reduced-motion collapses transitions to 0.001ms and a browser
    // may skip the event entirely — never leave the dialog stuck open.
    setTimeout(finishClose, 400);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Escape to close + focus trap. aria-modal alone does not stop the Tab key,
  // so focus is cycled inside the dialog while it is open (WCAG 2.1.2).
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;

    const nodes = Array.from(overlay.querySelectorAll(FOCUSABLE))
      .filter((n) => n.offsetWidth || n.offsetHeight || n.getClientRects().length);
    if (!nodes.length) return;

    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    if (!overlay.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Wire up each card.
  //
  // The card is deliberately left as a plain <article>: no role, no tabindex,
  // no aria-label. A role="button" wrapper would have collapsed the whole card
  // into a single control named "View profile", hiding the advisor's name,
  // title, NMLS and bio from assistive tech, and it nested real links and a
  // real button inside a button. Instead the injected "View profile" button is
  // the one exposed control, and the card content is announced as ordinary
  // structured text. The whole-card click survives as a mouse-only nicety.
  document.querySelectorAll('.team-card').forEach((card) => {
    const advisor = card.querySelector('.team-name')?.textContent.trim() || 'this advisor';

    // The single accessible trigger. Its name starts with the visible label so
    // "click View profile" still matches for speech-input users (WCAG 2.5.3),
    // and carries the advisor's name so the 5 buttons are distinguishable.
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'team-card-hint';
    hint.setAttribute('aria-haspopup', 'dialog');
    hint.setAttribute('aria-label', `View profile — ${advisor}`);
    hint.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>View profile`;
    // Handled directly rather than by bubbling, so the card handler below
    // cannot open the same dialog a second time.
    hint.addEventListener('click', (e) => { e.stopPropagation(); openModal(card, hint); });
    card.appendChild(hint);

    // Mouse convenience: clicking anywhere on the card opens the profile. Not
    // exposed to assistive tech, so it adds no role/name/nested-control issue.
    card.addEventListener('click', () => openModal(card, hint));

    // Contact links (phone / email / WhatsApp) act normally — stop the click from opening the modal
    card.querySelectorAll('.team-contact-line').forEach((link) => {
      link.addEventListener('click', (e) => e.stopPropagation());
    });

    // 3D tilt on hover (visual only)
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();
