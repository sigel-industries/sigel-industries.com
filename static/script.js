(() => {
  const doc = document;
  const body = doc.body;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, root = doc) => root.querySelector(sel);
  const $$ = (sel, root = doc) => Array.from(root.querySelectorAll(sel));

  // Page data rendered by the build from src/i18n/<lang>.yaml and src/site.yaml
  const site = JSON.parse($('#siteData')?.textContent || '{}');
  const lang = site.lang || body?.dataset.lang || 'cs';

  // Analytics events; gtag exists only after cookie consent
  function track(name, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  // Header, progress and mobile nav
  const header = $('#siteHeader');
  const progress = $('#progress');
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  let scrollTicking = false;

  function updateScrollState() {
    const st = window.scrollY || 0;
    const max = doc.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--progress', `${max > 0 ? (st / max) * 100 : 0}%`);
    if (header) header.classList.toggle('scrolled', st > 10);
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollState);
  }, { passive: true });
  updateScrollState();

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = !mainNav.classList.contains('open');
      mainNav.classList.toggle('open', open);
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      body.classList.toggle('menu-open', open);
    });
  }

  // Smooth anchors and menu close
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      mainNav?.classList.remove('open');
      menuToggle?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Active nav
  const navLinks = $$('.main-nav a[href^="#"]');
  const navTargets = navLinks.map((link) => $(link.getAttribute('href'))).filter(Boolean);
  if (navTargets.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === id));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    navTargets.forEach((target) => navObserver.observe(target));
  }

  // Reveal animation + count-up
  const scoreEl = $('#scoreNum');
  let countedScore = false;

  function countUp(el, target, duration = 1200) {
    if (!el) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const smooth = p * p * (3 - 2 * p);
      el.textContent = Math.round(smooth * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };
    requestAnimationFrame(tick);
  }

  function revealNow(el) {
    if (!el) return;
    el.classList.add('visible');
    if (el.classList.contains('hero-visual') && !countedScore) {
      countedScore = true;
      setTimeout(() => countUp(scoreEl, Number(site.report?.technika?.score || scoreEl?.dataset.score || 0), 1200), 160);
    }
    if (el.id === 'flow' || el.id === 'reportWrap') el.classList.add('visible');
  }

  const revealTargets = $$('.reveal, #flow, #reportWrap');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach(revealNow);
  }

  const diagList = $('#diagList');
  if (diagList) {
    if ('IntersectionObserver' in window) {
      const diagObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          $$('.diag-row', entry.target).forEach((row, i) => {
            setTimeout(() => row.classList.add('visible'), i * 80);
          });
          diagObserver.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      diagObserver.observe(diagList);
    } else {
      $$('.diag-row', diagList).forEach((row) => row.classList.add('visible'));
    }
  }

  // Report tabs (copy from site.report)
  const reportScore = $('#reportScore');
  const reportKicker = $('#reportKicker');
  const reportTitle = $('#reportTitle');
  const reportText = $('#reportText');
  const reportItems = $('.report-mini-grid');
  const reportShell = $('#reportWrap');
  const reportBars = $$('.report-bars i');
  $$('.report-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.report-tab').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      $('#reportPanel')?.setAttribute('aria-labelledby', tab.id);
      const data = site.report?.[tab.dataset.reportTab];
      if (!data) return;
      if (reportScore) reportScore.textContent = data.score;
      if (reportKicker) reportKicker.textContent = data.kicker;
      if (reportTitle) reportTitle.textContent = data.title;
      if (reportText) reportText.textContent = data.text;
      if (reportItems && data.items) reportItems.innerHTML = data.items.map((item) => `<span>${item}</span>`).join('');
      if (data.bars && reportBars.length) {
        if (reportShell) reportShell.classList.add('switching');
        reportBars.forEach((bar, i) => {
          bar.style.height = `${data.bars[i] || 60}%`;
          bar.style.transform = 'scaleY(.12)';
        });
        window.setTimeout(() => {
          reportBars.forEach((bar) => { bar.style.transform = 'scaleY(1)'; });
          if (reportShell) reportShell.classList.remove('switching');
        }, 80);
      }
    });
  });

  // Cursor
  const cursor = $('#cursor');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.classList.add('on');
    });
    $$('a, button, .interactive-card, .problem-card, .use-card, .agency-card, summary').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('big'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
    });
  }


  // V18.9 hero motion preview: subtle desktop parallax only
  const heroScene = $('.hero-monolith');
  const heroVisual = $('.hero-visual', heroScene || doc);
  if (heroScene && heroVisual && !prefersReduced && window.matchMedia('(hover:hover)').matches) {
    let heroMotionFrame = 0;
    let heroTargetX = 0;
    let heroTargetY = 0;

    function applyHeroMotion() {
      heroVisual.style.setProperty('--hero-x', heroTargetX.toFixed(3));
      heroVisual.style.setProperty('--hero-y', heroTargetY.toFixed(3));
      heroMotionFrame = 0;
    }

    heroScene.addEventListener('pointermove', (e) => {
      const rect = heroScene.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
      heroTargetX = Math.max(-1, Math.min(1, x));
      heroTargetY = Math.max(-1, Math.min(1, y));
      if (!heroMotionFrame) heroMotionFrame = requestAnimationFrame(applyHeroMotion);
    }, { passive: true });

    heroScene.addEventListener('pointerleave', () => {
      heroTargetX = 0;
      heroTargetY = 0;
      if (!heroMotionFrame) heroMotionFrame = requestAnimationFrame(applyHeroMotion);
    }, { passive: true });
  }

  // Hero canvas
  function initParticleCanvas(canvas, opts = {}) {
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const count = opts.count || 56;
    const maxDistance = opts.maxDistance || 112;
    const palettes = opts.palettes || [[77,223,200], [123,159,255], [126,107,255], [255,140,71]];
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.7 + .45,
      vx: (Math.random() - .5) * .00034,
      vy: (Math.random() - .5) * .00034,
      opacity: Math.random() * .5 + .15,
      col: palettes[Math.floor(Math.random() * palettes.length)]
    }));

    let mouseX = .55;
    let mouseY = .28;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      const gx = width * (opts.gx || .54);
      const gy = height * (opts.gy || .42);
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, width * .58);
      grad.addColorStop(0, 'rgba(77,223,200,.032)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const [r, g, bl] = a.col;
            ctx.beginPath();
            ctx.moveTo(a.x * width, a.y * height);
            ctx.lineTo(b.x * width, b.y * height);
            ctx.strokeStyle = `rgba(${r},${g},${bl},${.18 * (1 - dist / maxDistance)})`;
            ctx.lineWidth = .65;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx + (mouseX - .5) * .00007;
        p.y += p.vy + (mouseY - .5) * .00007;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        const [r, g, b] = p.col;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / Math.max(1, width);
      mouseY = (e.clientY - rect.top) / Math.max(1, height);
    });

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) draw();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    visibility.observe(canvas);
    draw();
  }

  initParticleCanvas($('#heroCanvas'), { count: window.innerWidth < 760 ? 34 : 58, maxDistance: 115, gx: .62, gy: .42 });
  initParticleCanvas($('#signalCanvas'), { count: window.innerWidth < 760 ? 24 : 34, maxDistance: 96, gx: .5, gy: .5 });


  // Detail modals for problem cards and system/product layers (copy from site.modal)
  const modal = $('#infoModal');
  const modalKicker = $('#modalKicker');
  const modalTitle = $('#modalTitle');
  const modalLead = $('#modalLead');
  const modalGrid = $('#modalGrid');
  const modalCta = $('#modalCta');
  const modalNote = $('#modalNote');
  let lastModalTrigger = null;

  function openInfoModal(key, trigger) {
    const data = site.modal?.[key];
    if (!modal || !data) return;
    lastModalTrigger = trigger || null;
    const theme = key === 'system-process' ? 'system' : (key.startsWith('use-') ? 'use' : 'problem');
    modal.dataset.theme = theme;
    modal.dataset.key = key;
    if (modalKicker) modalKicker.textContent = data.kicker || 'Detail';
    if (modalTitle) modalTitle.textContent = data.title || '';
    if (modalLead) modalLead.textContent = data.lead || '';
    if (modalCta) modalCta.textContent = data.cta || site.modalDefaults?.cta || '';
    if (modalGrid) {
      modalGrid.innerHTML = (data.items || []).map(([title, text], index) => `
        <article class="${index === 0 ? 'is-featured' : ''}">
          <span class="modal-step">${String(index + 1).padStart(2, '0')}</span>
          <strong>${title}</strong>
          <p>${text}</p>
        </article>
      `).join('');
    }
    if (modalNote) {
      modalNote.textContent = data.note || site.modalDefaults?.note || '';
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    $('.modal-close', modal)?.focus();
  }

  function closeInfoModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    lastModalTrigger?.focus?.();
  }

  $$('[data-modal-target]').forEach((btn) => {
    btn.addEventListener('click', () => openInfoModal(btn.getAttribute('data-modal-target'), btn));
  });
  $$('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeInfoModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeInfoModal();
  });

  // Detail CTA: products sold directly open the order form, cooperation topics open the contact form
  modalCta?.addEventListener('click', () => {
    const topic = site.modal?.[modal?.dataset.key]?.inquiry;
    if (topic) openContactModal(topic);
    else openOrderModal(modal?.dataset.key || 'detail');
  });

  // Contact form for non-order requests (agency pilot, lead research, benchmark)
  const contactModal = $('#contactModal');
  const contactForm = $('#contactForm');
  function openContactModal(topic) {
    if (!contactModal || !contactForm) return;
    if (modal && !modal.hidden) { modal.hidden = true; modal.setAttribute('aria-hidden', 'true'); }
    contactForm.dataset.inquiry = topic;
    const label = site.contactTopics?.[topic];
    const topicEl = $('#contactTopic', contactModal);
    if (topicEl && label) topicEl.textContent = label;
    contactModal.classList.add('is-open');
    contactModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    track('contact_open', { topic });
    setTimeout(() => $('#contactEmail', contactModal)?.focus(), 40);
  }
  function closeContactModal() {
    contactModal?.classList.remove('is-open');
    contactModal?.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }
  $$('[data-contact-close]', contactModal || doc).forEach((el) => el.addEventListener('click', closeContactModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && contactModal?.classList.contains('is-open')) closeContactModal(); });


  // Order modal. Markup and copy are rendered by the build in the page language (src/i18n).
  // Backend: Google Apps Script (apps-script/Code.gs) answering JSON {ok, id}.
  // An order is shown as accepted only after the backend confirms it.
  const orderModal = $('#orderModal');
  const orderForm = $('#orderForm');
  const orderSummaryStatus = $('#summaryStatus');
  const orderSummaryCard = $('#summaryCard');
  const orderDoneMeta = $('#doneMeta');
  const orderMailFallback = $('#orderMailFallback');
  const orderConfirm = $('#confirmOrder');
  const T = site.order || {};
  let pendingOrderPayload = null;
  let orderSending = false;

  function orderEsc(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function orderPrice(currency) { return T.prices?.[currency] || ''; }
  function updateOrderPrice() {
    const price = orderPrice($('#orderCurrency', orderModal)?.value || T.defaultCurrency);
    const priceEl = $('[data-order-price]', orderModal);
    if (priceEl) priceEl.textContent = price;
    if (orderConfirm) orderConfirm.textContent = String(T.submitOrder || '').replace('{price}', price);
  }
  function setOrderStep(step) {
    $$('.sigel-order-view', orderModal).forEach((el) => el.classList.toggle('is-active', el.dataset.view === step));
    const order = ['form', 'summary', 'done'];
    const activeIndex = order.indexOf(step);
    $$('.sigel-order-dot', orderModal).forEach((dot) => {
      const dotIndex = order.indexOf(dot.dataset.stepDot);
      dot.classList.toggle('is-active', dot.dataset.stepDot === step);
      dot.classList.toggle('is-done', dotIndex < activeIndex);
    });
    $('.sigel-order-dialog', orderModal).scrollTop = 0;
  }
  function clearOrderErrors() { $$('[data-error-for]', orderModal).forEach((el) => { el.textContent = ''; }); }
  function setOrderError(name, message) {
    const el = $(`[data-error-for="${name}"]`, orderModal);
    if (el) el.textContent = message;
  }
  function resetOrderStatus() {
    if (orderSummaryStatus) { orderSummaryStatus.className = 'sigel-order-status'; orderSummaryStatus.textContent = ''; }
    if (orderMailFallback) orderMailFallback.hidden = true;
  }
  function showOrderStatus(type, message) {
    if (!orderSummaryStatus) return;
    orderSummaryStatus.className = `sigel-order-status ${type === 'ok' ? 'is-ok' : 'is-bad'}`;
    orderSummaryStatus.textContent = message;
  }
  function normalizeOrderWebsite(value) {
    const raw = String(value || '').trim();
    if (!raw || /\s/.test(raw) || /^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  }
  function validateOrderUrl(value) {
    try {
      const url = new URL(normalizeOrderWebsite(value));
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.') && /^[a-z0-9.-]+$/i.test(url.hostname);
    } catch { return false; }
  }
  function validOrderEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
  }
  function validOrderPhone(value) {
    const v = String(value || '').trim();
    return !v || /^[+()0-9\s.-]{7,22}$/.test(v);
  }
  function validOrderCompanyId(value) {
    const v = String(value || '').trim();
    if (/^\d+$/.test(v)) return /^\d{8}$/.test(v); // CZ/SK IČO
    return /^[A-Za-z0-9 .\-_/]{3,32}$/.test(v);
  }
  function createOrderId(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `SIGEL-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${rand}`;
  }
  function formatOrderLocalDateTime(date) {
    return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date).replace(' ', 'T');
  }
  function orderPayloadFromForm() {
    const data = Object.fromEntries(new FormData(orderForm).entries());
    const now = new Date();
    const currency = data.currency || T.defaultCurrency;
    return {
      kind: 'order',
      id: createOrderId(now),
      createdAt: now.toISOString(),
      createdAtLocal: formatOrderLocalDateTime(now),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      source: 'sigel-industries-web',
      page: location.pathname,
      language: lang,
      customerType: 'company',
      status: 'new_order',
      paymentStatus: 'invoice_pending',
      deliveryStatus: 'waiting_for_payment',
      price: orderPrice(currency),
      currency,
      website: normalizeOrderWebsite(data.website || ''),
      company: data.company?.trim() || '',
      ico: data.ico?.trim() || '',
      dic: data.dic?.trim() || '',
      billing: data.billing?.trim() || '',
      contactPerson: data.contactPerson?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      reportLanguage: data.reportLanguage || '',
      note: data.note?.trim() || '',
      termsConsent: Boolean(orderForm.termsConsent.checked),
      privacyConsent: Boolean(orderForm.privacyConsent.checked),
      website_extra: data.website_extra || ''
    };
  }
  function validateOrderForm(payload) {
    clearOrderErrors(); resetOrderStatus();
    if (payload.website_extra) return false;
    let ok = true;
    if (!validateOrderUrl(orderForm.website.value)) { setOrderError('website', T.websiteError); ok = false; }
    if (!payload.company || payload.company.length < 2) { setOrderError('company', T.requiredError); ok = false; }
    if (!payload.ico || !validOrderCompanyId(payload.ico)) { setOrderError('ico', T.icoRequired); ok = false; }
    if (!payload.billing || payload.billing.length < 8) { setOrderError('billing', T.requiredError); ok = false; }
    if (!validOrderEmail(payload.email)) { setOrderError('email', T.emailError); ok = false; }
    if (!validOrderPhone(payload.phone)) { setOrderError('phone', T.phoneError); ok = false; }
    if (!payload.termsConsent || !payload.privacyConsent) { setOrderError('consents', T.consentsError); ok = false; }
    return ok;
  }
  function orderSummaryRows(payload) {
    const L = T.summaryLabels || {};
    return [
      ['website', payload.website], ['company', payload.company], ['ico', payload.ico], ['dic', payload.dic || '—'],
      ['contactPerson', payload.contactPerson || '—'], ['email', payload.email], ['phone', payload.phone || '—'],
      ['billing', payload.billing, true], ['reportLanguage', payload.reportLanguage],
      ['price', `${payload.price} · ${payload.currency}`], ['note', payload.note || '—', true]
    ].map(([key, value, wide]) => ({ label: L[key] || key, value, wide }));
  }
  function renderOrderSummary(payload) {
    orderSummaryCard.innerHTML = orderSummaryRows(payload).map(({ label, value, wide }) => `
      <div class="sigel-summary-item ${wide ? 'is-wide' : ''}">
        <span>${orderEsc(label)}</span>
        <strong>${orderEsc(value)}</strong>
      </div>
    `).join('');
  }
  function prepareMailFallback(payload) {
    if (!orderMailFallback) return;
    const lines = orderSummaryRows(payload).map(({ label, value }) => `${label}: ${value}`);
    lines.unshift(`ID: ${payload.id}`);
    orderMailFallback.href = `mailto:${site.email}?subject=${encodeURIComponent(`${T.mailSubject} ${payload.id}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    orderMailFallback.hidden = false;
  }
  function renderOrderDone(payload) {
    orderDoneMeta.innerHTML = `<strong>${orderEsc(payload.id)}</strong><br>${orderEsc(payload.createdAtLocal)} · ${orderEsc(payload.price)} · ${orderEsc(payload.website)}<br>${orderEsc(payload.email)}`;
  }

  // ARES autofill: a valid Czech IČO fills company, DIČ and address via the backend (?action=ares).
  // Only fields that are empty or were filled by a previous lookup are overwritten.
  function validCzIco(value) {
    if (!/^\d{8}$/.test(value)) return false;
    const d = value.split('').map(Number);
    const sum = d.slice(0, 7).reduce((acc, n, i) => acc + n * (8 - i), 0);
    const r = sum % 11;
    return d[7] === (r === 0 ? 1 : r === 1 ? 0 : 11 - r);
  }
  function initAresLookup() {
    const ico = $('#orderIco', orderModal);
    const status = $('[data-ares-status]', orderModal);
    if (!ico || !status) return;
    const hint = status.textContent;
    const targets = { company: $('#orderCompany', orderModal), dic: $('#orderDic', orderModal), address: $('#orderBilling', orderModal) };
    let requested = '';
    const setStatus = (text) => { status.textContent = text; };
    async function lookup() {
      const value = ico.value.replace(/\s+/g, '');
      if (!validCzIco(value)) { if (!value) setStatus(hint); return; }
      if (value === requested) return;
      requested = value;
      setStatus(T.aresLoading);
      try {
        const response = await fetch(`${site.endpoint}?action=ares&ico=${encodeURIComponent(value)}`, { redirect: 'follow' });
        const result = await response.json();
        if (requested !== value) return; // a newer lookup started
        if (result?.ok && result.found) {
          Object.entries(targets).forEach(([key, field]) => {
            if (!field || !result[key]) return;
            if (!field.value.trim() || field.dataset.ares === 'filled') { field.value = result[key]; field.dataset.ares = 'filled'; }
          });
          setStatus(T.aresFilled);
          track('ares_autofill', { found: true });
        } else if (result?.ok && result.found === false) {
          setStatus(T.aresNotFound);
          track('ares_autofill', { found: false });
        } else {
          setStatus(hint); // backend without ARES support: stay silent, manual entry works
        }
      } catch (error) {
        if (requested === value) setStatus(hint);
      }
    }
    ico.addEventListener('input', () => { if (ico.value.replace(/\s+/g, '').length === 8) lookup(); });
    ico.addEventListener('blur', lookup);
    Object.values(targets).forEach((field) => field?.addEventListener('input', () => { delete field.dataset.ares; }));
    orderForm.addEventListener('reset', () => { requested = ''; setStatus(hint); Object.values(targets).forEach((f) => f && delete f.dataset.ares); });
  }

  // POST as text/plain: a CORS "simple request" (no preflight, which Apps Script cannot answer),
  // yet the JSON response is readable, so success is only shown when the backend confirms it.
  async function postToBackend(payload) {
    const response = await fetch(site.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result || result.ok !== true) throw new Error(result?.error || 'backend_rejected');
    return result;
  }

  function openOrderModal(source) {
    if (!orderModal || !orderForm) return;
    const info = $('#infoModal');
    if (info && !info.hidden) { info.hidden = true; info.setAttribute('aria-hidden', 'true'); }
    clearOrderErrors(); resetOrderStatus();
    if (!orderSending) pendingOrderPayload = null;
    setOrderStep('form');
    orderModal.classList.add('is-open');
    orderModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    track('order_open', { source: source || 'button', page_path: location.pathname });
    setTimeout(() => $('#orderWebsite', orderModal)?.focus(), 40);
  }
  function closeOrderModal() {
    orderModal?.classList.remove('is-open');
    orderModal?.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (orderModal && orderForm) {
    updateOrderPrice();
    $$('[data-order-close]', orderModal).forEach((el) => el.addEventListener('click', closeOrderModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && orderModal.classList.contains('is-open')) closeOrderModal(); });
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = orderPayloadFromForm();
      if (!validateOrderForm(payload)) return;
      pendingOrderPayload = payload;
      renderOrderSummary(payload);
      setOrderStep('summary');
      track('order_summary', { currency: payload.currency });
    });
    $('#backToForm', orderModal)?.addEventListener('click', () => setOrderStep('form'));
    orderConfirm?.addEventListener('click', async () => {
      if (!pendingOrderPayload || orderSending) return;
      orderSending = true;
      orderConfirm.disabled = true;
      resetOrderStatus();
      showOrderStatus('ok', T.sending);
      const payload = pendingOrderPayload;
      try {
        const result = await postToBackend(payload);
        payload.id = result.id || payload.id;
        renderOrderDone(payload);
        setOrderStep('done');
        orderForm.reset();
        updateOrderPrice();
        pendingOrderPayload = null;
        track('generate_lead', { currency: payload.currency, value: payload.currency === 'CZK' ? 4980 : 199, lead_source: 'order_form' });
      } catch (error) {
        console.error('Order not accepted by backend:', error);
        showOrderStatus('bad', T.sendError);
        prepareMailFallback(payload);
        track('order_error', { error: String(error.message || error).slice(0, 90) });
      } finally {
        orderSending = false;
        orderConfirm.disabled = false;
      }
    });
    $('#newOrder', orderModal)?.addEventListener('click', () => {
      pendingOrderPayload = null;
      clearOrderErrors(); resetOrderStatus(); orderForm.reset(); updateOrderPrice(); setOrderStep('form');
      setTimeout(() => $('#orderWebsite', orderModal)?.focus(), 40);
    });
    $('#orderCurrency', orderModal)?.addEventListener('change', updateOrderPrice);
    initAresLookup();
    orderMailFallback?.addEventListener('click', () => track('order_mail_fallback'));
    $$('[data-order-open]').forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openOrderModal(btn.dataset.track || btn.closest('section')?.id || 'button');
    }));
  }

  // Inquiry forms (e.g. Company Intelligence pilot) share the same backend
  $$('form[data-inquiry]').forEach((form) => {
    const status = $('[data-inquiry-status]', form);
    const submit = $('button[type="submit"]', form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.website_extra) return;
      $$('[data-error-for]', form).forEach((el) => { el.textContent = ''; });
      let ok = true;
      $$('[required]', form).forEach((field) => {
        const value = field.type === 'checkbox' ? field.checked : String(field.value || '').trim();
        const invalid = !value || (field.type === 'email' && !validOrderEmail(field.value));
        if (invalid) { ok = false; const err = $(`[data-error-for="${field.name}"]`, form); if (err) err.textContent = form.dataset.errorRequired || ''; }
      });
      if (!ok) return;
      const now = new Date();
      const payload = { kind: 'inquiry', product: form.dataset.inquiry, id: createOrderId(now).replace('SIGEL-', 'INQ-'), createdAt: now.toISOString(), createdAtLocal: formatOrderLocalDateTime(now), page: location.pathname, language: lang, ...data, privacyConsent: Boolean(form.privacyConsent?.checked) };
      submit.disabled = true;
      status.className = 'sigel-order-status is-ok';
      status.textContent = form.dataset.sending || '';
      try {
        await postToBackend(payload);
        form.reset();
        status.textContent = form.dataset.done || '';
        track('generate_lead', { lead_source: `inquiry_${form.dataset.inquiry}` });
      } catch (error) {
        console.error('Inquiry not accepted by backend:', error);
        status.className = 'sigel-order-status is-bad';
        status.innerHTML = `${orderEsc(form.dataset.error || '')} <a href="mailto:${orderEsc(site.email)}">${orderEsc(site.email)}</a>`;
        track('inquiry_error', { error: String(error.message || error).slice(0, 90) });
      } finally {
        submit.disabled = false;
      }
    });
  });

  // Demo report downloads
  $$('a[href$=".pdf"]').forEach((a) => a.addEventListener('click', () => {
    track('demo_report_click', { file: a.getAttribute('href'), source: a.dataset.track || a.closest('section, footer')?.id || 'link' });
  }));

  // Cookie consent + GA4 lazy load
  const cookieBar = $('#cookieBar');
  const consentKey = 'sigel_cookie_consent_v1';
  const gaId = site.gaId || '';
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };

  function loadGA() {
    if (!gaId || window.__sigelGaLoaded) return;
    window.__sigelGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });

    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    doc.head.appendChild(script);
  }

  const savedConsent = storage.get(consentKey);
  if (savedConsent === 'accepted') {
    loadGA();
  } else if (!savedConsent && cookieBar) {
    cookieBar.hidden = false;
  }

  $$('[data-cookie-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-cookie-choice');
      storage.set(consentKey, choice === 'accept' ? 'accepted' : 'denied');
      if (cookieBar) cookieBar.hidden = true;
      if (choice === 'accept') loadGA();
    });
  });
})();
