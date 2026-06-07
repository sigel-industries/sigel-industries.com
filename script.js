// SIGEL V13 interaction layer
// Keeps CZ/EN routing untouched. Handles navigation, reveals, lightweight motion and fast modals.
(() => {
  const doc = document.documentElement;
  const body = document.body;
  const header = document.querySelector('.site-header');
  const sections = Array.from(document.querySelectorAll('main section[id], main section[data-section-num]'));
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const interactiveCards = Array.from(document.querySelectorAll('.interactive-card'));
  const tiltCards = Array.from(document.querySelectorAll('.tilt-card'));
  const buttons = Array.from(document.querySelectorAll('.btn'));
  const progress = document.querySelector('.sigel-progress');
  const indicator = document.querySelector('.v10-section-indicator span, .v11-section-indicator span');
  const indicatorLabel = document.querySelector('.v10-section-indicator b, .v11-section-indicator b');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  function currentSection() {
    const probeY = coarsePointer ? 92 : 140;
    let active = null;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom >= probeY) active = section;
    }
    return active;
  }

  let scrollTicking = false;
  function updateUi() {
    scrollTicking = false;
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);

    if (progress) {
      const max = doc.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }

    const active = currentSection();
    const id = active && active.id ? active.id : '';
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));

    if (active && indicator) {
      indicator.textContent = active.dataset.sectionNum || active.dataset.v12Num || active.dataset.v11Num || active.dataset.v10Num || '00';
      if (indicatorLabel) indicatorLabel.textContent = active.dataset.sectionLabel || active.dataset.v12Label || active.dataset.v11Label || active.dataset.v10Label || 'SYS';
    }
  }

  function requestUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateUi);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      body.classList.remove('nav-opened');
      const toggle = document.querySelector('.menu-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');

      const offset = coarsePointer ? 74 : 88;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = body.classList.toggle('nav-opened');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.addEventListener('click', (event) => {
    if (!body.classList.contains('nav-opened')) return;
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.menu-toggle');
    if (!nav || !toggle) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    body.classList.remove('nav-opened');
    toggle.setAttribute('aria-expanded', 'false');
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = coarsePointer ? '0ms' : `${Math.min((index % 3) * 34, 100)}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Decorative motion only on desktop. Mobile gets speed and dignity.
  if (!reduceMotion && !coarsePointer) {
    let pointerTicking = false;
    window.addEventListener('pointermove', (event) => {
      if (pointerTicking) return;
      pointerTicking = true;
      requestAnimationFrame(() => {
        doc.style.setProperty('--mx', `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
        doc.style.setProperty('--my', `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
        pointerTicking = false;
      });
    }, { passive: true });

    interactiveCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--y', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });

    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const rx = ((event.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -1.35;
        const ry = ((event.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 1.35;
        card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      }, { passive: true });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    buttons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.025}px, ${y * 0.035}px)`;
      }, { passive: true });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  // Lightweight report tabs: visual state only, no heavy DOM animation.
  document.querySelectorAll('.report-tabs').forEach((tabs) => {
    tabs.addEventListener('click', (event) => {
      const btn = event.target.closest('.report-tab');
      if (!btn) return;
      tabs.querySelectorAll('.report-tab').forEach((item) => item.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  // Fast modal controller. Replaces previous inline script, avoids heavy mobile blur.
  const modalLayer = document.getElementById('sigel-modal-layer');
  let activeModal = null;
  let lastTrigger = null;

  function openModal(id, trigger) {
    if (!modalLayer) return;
    const modal = document.getElementById(id);
    if (!modal) return;
    lastTrigger = trigger || null;
    activeModal = modal;

    modalLayer.classList.add('is-open');
    modalLayer.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('.sigel-modal.is-open').forEach((item) => item.classList.remove('is-open'));
    modal.classList.add('is-open');
    body.classList.add('modal-opened');

    const close = modal.querySelector('[data-modal-close]');
    if (close && !coarsePointer) close.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!modalLayer || !activeModal) return;
    activeModal.classList.remove('is-open');
    activeModal = null;
    modalLayer.classList.remove('is-open');
    modalLayer.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-opened');
    if (lastTrigger && !coarsePointer) lastTrigger.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openModal(trigger.getAttribute('data-modal'), trigger);
    });
  });

  if (modalLayer) {
    modalLayer.querySelectorAll('[data-modal-close]').forEach((item) => item.addEventListener('click', closeModal));
    modalLayer.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal-backdrop')) closeModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (activeModal) closeModal();
      if (body.classList.contains('nav-opened')) {
        body.classList.remove('nav-opened');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  updateUi();
})();
