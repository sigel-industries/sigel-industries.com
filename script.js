/* =========================================================
   SIGEL Web Audit — V6 interaction layer
   Drop-in replacement for script.js
   ========================================================= */

(function () {
  const header = document.querySelector('.header, .site-header');
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const interactiveItems = Array.from(document.querySelectorAll('.interactive-card, .tilt-card, .card, .console, .audit-snapshot'));
  const buttons = Array.from(document.querySelectorAll('.btn'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  }

  function updateActiveNav() {
    if (!sections.length || !navLinks.length) return;

    let currentId = '';
    const anchorY = 150;

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchorY && rect.bottom >= anchorY) {
        currentId = section.id;
        break;
      }
    }

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  function onScroll() {
    updateHeader();
    updateActiveNav();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible', 'is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

    revealItems.forEach((item, index) => {
      if (!reduceMotion) item.style.transitionDelay = `${Math.min(index * 18, 140)}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('visible', 'is-visible'));
  }

  if (!reduceMotion) {
    let pointerRaf = null;

    window.addEventListener('pointermove', (event) => {
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
        root.style.setProperty('--my', `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
        pointerRaf = null;
      });
    }, { passive: true });

    interactiveItems.forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        item.style.setProperty('--x', `${x}px`);
        item.style.setProperty('--y', `${y}px`);

        if (!item.classList.contains('tilt-card')) return;

        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -2.1;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 2.1;
        item.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });

      item.addEventListener('pointerleave', () => {
        item.style.removeProperty('--x');
        item.style.removeProperty('--y');
        if (item.classList.contains('tilt-card')) item.style.transform = '';
      });
    });

    buttons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.045}px, ${y * 0.07}px)`;
      });

      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  // Modal compatibility for older SIGEL HTML builds.
  const layer = document.getElementById('sigel-modal-layer');
  if (layer) {
    let activeModal = null;
    let lastTrigger = null;

    function openModal(id, trigger) {
      const modal = document.getElementById(id);
      if (!modal) return;

      lastTrigger = trigger || null;
      activeModal = modal;
      layer.classList.add('is-open');
      layer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-opened');

      document.querySelectorAll('.sigel-modal').forEach((item) => item.classList.remove('is-open'));
      modal.classList.add('is-open');

      const closeButton = modal.querySelector('[data-modal-close], .modal-close');
      if (closeButton) closeButton.focus({ preventScroll: true });
    }

    function closeModal() {
      if (!activeModal) return;

      activeModal.classList.remove('is-open');
      activeModal = null;
      layer.classList.remove('is-open');
      layer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-opened');

      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    }

    document.querySelectorAll('[data-modal]').forEach((trigger) => {
      trigger.addEventListener('click', () => openModal(trigger.getAttribute('data-modal'), trigger));
    });

    layer.querySelectorAll('[data-modal-close], .modal-backdrop').forEach((item) => {
      item.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && layer.classList.contains('is-open')) closeModal();
    });
  }
})();
