/* =========================================================================
   Key2Nest — Testimonials data + expand-drawer behavior.
   Loaded by both /index.html (editorial featured+grid layout) and
   /careers.html (6-equal grid). One source of truth; both pages' drawers
   open from the same six reviews.

   To add a review: append an entry to TESTIMONIALS below. The on-page card
   pulls its excerpt and attribution from the `excerpt` field; the drawer
   shows `full` plus the Key2Nest `response` (owner reply) and date.

   When the Google review count changes: update the number in each page's
   `.google-stats-meta` block (homepage + careers). Cards cycle in the array
   order, so Prev/Next inside the drawer walks through them left-to-right.
   ========================================================================= */

(function () {
  'use strict';

  const GOOGLE_PROFILE_URL = 'https://maps.app.goo.gl/bovhtUGU9RqtTmoa8';

  const TESTIMONIALS = [
    {
      id: 'manju-h',
      name: 'Manju H',
      badge: null,
      initial: 'M',
      date: '3 days ago',
      full: "I had an excellent experience working with Key2Nest Home Loans LLC. The entire team was professional, knowledgeable, and highly responsive throughout the process. They patiently answered all my questions, explained every step clearly, and made sure I was comfortable with the decisions being made. Their dedication and customer-focused approach made the loan process smooth and stress-free. Thank you.",
      response: "Thank you, Manju, for your kind words! We're so glad our team's guidance and clear communication helped you feel comfortable with each decision. We appreciate you trusting Key2Nest Home Loans and taking the time to share your experience. It was a pleasure working with you, and we're always here whenever you need us!",
    },
    {
      id: 'naveen',
      name: 'Naveen',
      badge: null,
      initial: 'N',
      date: '6 days ago',
      full: "We had an excellent experience working with Sai Vivek at Key2Nest Home Loans LLC. He was extremely patient, professional, and knowledgeable throughout the entire mortgage loan process. No matter how many questions we had, Vivek always took the time to explain everything clearly and made sure we felt comfortable and confident at every step.\n\nHis experience, dedication, and attention to detail truly stood out. He genuinely cared about understanding our needs and helping us make the best possible decisions. He was always responsive, transparent, and readily available whenever we needed guidance or had questions.\n\nWe truly appreciate Vivek's support and the excellent service provided by Key2Nest Home Loans LLC. If you are looking for a reliable, honest, and trustworthy mortgage loan officer, we highly recommend Sai Vivek and Key2Nest Home Loans LLC.\n\nWorking with Vivek made our entire mortgage experience smooth, seamless, and stress-free. Thank you for making the journey such a wonderful experience!",
      response: "Thank you so much, Naveen, for your thoughtful review and for trusting me and Key2Nest Home Loans with your mortgage journey. I'm glad I could answer your questions and help you feel comfortable and confident throughout the process. It was a pleasure working with you.",
    },
    {
      id: 'shravan',
      name: 'Shravan Kumar Amjala',
      badge: 'Local Guide',
      initial: 'S',
      date: '2 days ago',
      full: "I recently refinanced my home with Key2Nest Home Loans, and the entire experience was excellent! The process was smooth, quick, and hassle-free from start to finish. The team was very professional, knowledgeable, and always available to answer my questions.\n\nThey kept me informed every step of the way and made sure everything went smoothly through closing. I really appreciate their transparency, dedication, and excellent customer service.\n\nI highly recommend Key2Nest Home Loans to anyone looking to refinance or purchase a home. Thank you for making the refinancing process so easy and stress-free!",
      response: "Thank you, Shravan, for your thoughtful review and for trusting Key2Nest Home Loans with your refinance! We're happy to hear that you felt informed and supported throughout the process. Your recognition of our team's transparency and dedication means a lot to us.",
    },
    {
      id: 'anik-das',
      name: 'Anik Das',
      badge: null,
      initial: 'A',
      date: '1 week ago',
      full: "I had a great experience working with Key2Nest Home Loans for my home purchase. The team was very responsive, professional, and easy to work with throughout the entire loan process. They communicated clearly, answered all my questions, and took the time to explain everything in detail. The loan process was also very quick and smooth, which made the whole experience much less stressful. I would highly recommend Key2Nest Home Loans to anyone looking to finance a home.",
      response: "Thank you, Anik, for your kind words and recommendation! We're glad our team could make the home loan process clear and smooth. We appreciate you choosing Key2Nest Home Loans and wish you all the best in your new home!",
    },
    {
      id: 'amrth-ganapathy',
      name: 'Amrth Ganapathy',
      badge: null,
      initial: 'A',
      date: '1 week ago',
      full: "Recommend mortgage lenders. Worked with Rj twice and both has been exceptional experience. Quick connect with reasonable solutions.",
      response: "Thank you, Amrth, for recommending Key2Nest Home Loans and for sharing your experience working with RJ. We're glad both of your experiences were exceptional and that our team could provide helpful, prompt service. We truly appreciate your trust and support!",
    },
    {
      id: 'amruth-reddy',
      name: 'Amruth Reddy',
      badge: 'Local Guide',
      initial: 'A',
      date: '1 week ago',
      full: "I have used key2nest for my refinance and they are very good and help you to understand every line item and walk you through all possible options and make your finance/refinance process seem less. Love to recommend their services for anyone interested.",
      response: null, // this review has no owner reply on Google — drawer skips the block
    },
  ];

  /* -------------------- Drawer -------------------- */

  const drawer = document.getElementById('testimonial-drawer');
  if (!drawer) return; // page didn't include the drawer markup

  const panel      = drawer.querySelector('.testimonial-drawer-panel');
  const overlay    = drawer.querySelector('.testimonial-drawer-overlay');
  const initialEl  = drawer.querySelector('[data-td-initial]');
  const nameEl     = drawer.querySelector('[data-td-name]');
  const badgeEl    = drawer.querySelector('[data-td-badge]');
  const dateEl     = drawer.querySelector('[data-td-date]');
  const quoteEl    = drawer.querySelector('[data-td-quote]');
  const responseEl = drawer.querySelector('[data-td-response]');
  const responseWrap = drawer.querySelector('[data-td-response-wrap]');
  const linkEl     = drawer.querySelector('[data-td-link]');
  const countEl    = drawer.querySelector('[data-td-count]');
  const prevBtn    = drawer.querySelector('[data-td-prev]');
  const nextBtn    = drawer.querySelector('[data-td-next]');
  const closeBtns  = drawer.querySelectorAll('[data-td-close]');

  let currentIndex = 0;
  let lastFocused = null;

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // Preserve paragraph breaks in long reviews.
  const renderParagraphs = (text) =>
    text.split(/\n+/).map((p) => `<p>${escapeHtml(p.trim())}</p>`).join('');

  function render(index) {
    const t = TESTIMONIALS[index];
    if (!t) return;
    currentIndex = index;

    initialEl.textContent = t.initial;
    nameEl.textContent = t.name;
    dateEl.textContent = t.date;
    quoteEl.innerHTML = renderParagraphs(t.full);

    if (t.badge) {
      badgeEl.textContent = '· ' + t.badge;
      badgeEl.hidden = false;
    } else {
      badgeEl.hidden = true;
    }

    if (t.response) {
      responseEl.innerHTML = renderParagraphs(t.response);
      responseWrap.hidden = false;
    } else {
      responseWrap.hidden = true;
    }

    linkEl.href = GOOGLE_PROFILE_URL;
    countEl.textContent = (index + 1) + ' of ' + TESTIMONIALS.length;
  }

  function open(id, triggerEl) {
    const index = TESTIMONIALS.findIndex((t) => t.id === id);
    if (index < 0) return;
    lastFocused = triggerEl || document.activeElement;
    render(index);
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Next frame so the transition class applies
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    // Focus the close button for keyboard users
    setTimeout(() => drawer.querySelector('.testimonial-drawer-close')?.focus(), 60);
  }

  function close() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      drawer.hidden = true;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }, 220);
  }

  function next() { render((currentIndex + 1) % TESTIMONIALS.length); }
  function prev() { render((currentIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length); }

  // Wire up cards: event delegation so cards added later also work.
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-testimonial-id]');
    if (!card) return;
    // Links inside the card (e.g. "via Google" might link out one day) still work normally
    if (e.target.closest('a')) return;
    e.preventDefault();
    open(card.getAttribute('data-testimonial-id'), card);
  });

  // Keyboard accessibility on cards (Enter / Space opens, since cards are role="button")
  document.addEventListener('keydown', (e) => {
    const card = e.target.closest('[data-testimonial-id]');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      open(card.getAttribute('data-testimonial-id'), card);
    }
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); }
    if (e.key === 'ArrowRight') { next(); }
    if (e.key === 'ArrowLeft') { prev(); }
  });

  closeBtns.forEach((b) => b.addEventListener('click', close));
  overlay?.addEventListener('click', close);
  nextBtn?.addEventListener('click', next);
  prevBtn?.addEventListener('click', prev);
})();
