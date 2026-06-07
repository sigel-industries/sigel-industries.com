// SIGEL V12 interaction layer
// Preserves existing CZ/EN routing, inline modal logic and Tally embed.
(() => {
  const doc = document.documentElement;
  const body = document.body;
  const header = document.querySelector('.site-header');
  const sections = Array.from(document.querySelectorAll('main section[id], main section[data-v12-num]'));
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

  function getCurrentSection() {
    let current = null;
    const probeY = coarsePointer ? 100 : 150;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom >= probeY) current = section;
    });
    return current;
  }

  let ticking = false;
  function updateUi() {
    ticking = false;

    if (header) header.classList.toggle('is-scrolled', window.scrollY > 16);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }

    const active = getCurrentSection();
    const id = active && active.id ? active.id : '';
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });

    if (active && indicator) {
      indicator.textContent = active.dataset.v12Num || active.dataset.v11Num || active.dataset.v10Num || '00';
      if (indicatorLabel) indicatorLabel.textContent = active.dataset.v12Label || active.dataset.v11Label || active.dataset.v10Label || 'SYS';
    }
  }

  function requestUpdate() {
    if (!ticking) {
      requestAnimationFrame(updateUi);
      ticking = true;
    }
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

      const offset = coarsePointer ? 76 : 92;
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

  // Close mobile nav when clicking outside.
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
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = coarsePointer ? '0ms' : `${Math.min((index % 4) * 38, 150)}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Desktop-only motion. Touch devices get speed, not decorative suffering.
  if (!reduceMotion && !coarsePointer) {
    let pointerRaf = null;
    window.addEventListener('pointermove', (event) => {
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        doc.style.setProperty('--mx', `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
        doc.style.setProperty('--my', `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
        pointerRaf = null;
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
        const rx = ((event.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -1.8;
        const ry = ((event.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 1.8;
        card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      }, { passive: true });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    buttons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.035}px, ${y * 0.045}px)`;
      }, { passive: true });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  // Modal speed helper. Actual modal open/close remains inline in HTML.
  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('pointerdown', () => body.classList.add('modal-prewarm'), { passive: true });
    trigger.addEventListener('click', () => {
      body.classList.add('modal-prewarm');
      setTimeout(() => body.classList.remove('modal-prewarm'), 250);
    }, { passive: true });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('nav-opened')) {
      body.classList.remove('nav-opened');
      const toggle = document.querySelector('.menu-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  updateUi();
})();
