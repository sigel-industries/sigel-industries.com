// SIGEL interactions: preserves language routing, modals in HTML, Tally and original structure.
(function () {
  const header = document.querySelector('.site-header');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  const revealItems = document.querySelectorAll('.reveal');
  const interactiveCards = document.querySelectorAll('.interactive-card');
  const tiltCards = document.querySelectorAll('.tilt-card');
  const magneticButtons = document.querySelectorAll('.btn');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateActiveNav() {
    if (!navLinks.length || !sections.length) return;

    let currentId = '';

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 145 && rect.bottom >= 145) currentId = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
    updateActiveNav();
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -42px 0px' }
    );

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 16, 160)}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  if (!reduceMotion) {
    let pointerRaf = null;

    window.addEventListener('pointermove', (event) => {
      if (pointerRaf) return;

      pointerRaf = requestAnimationFrame(() => {
        const x = Math.round((event.clientX / window.innerWidth) * 100);
        const y = Math.round((event.clientY / window.innerHeight) * 100);

        document.documentElement.style.setProperty('--mx', `${x}%`);
        document.documentElement.style.setProperty('--my', `${y}%`);
        pointerRaf = null;
      });
    }, { passive: true });

    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -2.8;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 2.8;

        card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });

    magneticButtons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.055}px, ${y * 0.08}px)`;
      }, { passive: true });

      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  // Preserve existing language behavior. The redirect logic lives in HTML;
  // this only stores explicit user choice when clicking the switch.
  document.querySelectorAll('.lang-switch a').forEach((link) => {
    link.addEventListener('click', () => {
      const label = link.textContent.trim().toLowerCase();
      if (label === 'en') localStorage.setItem('sigelLang', 'en');
      if (label === 'cz' || label === 'cs') localStorage.setItem('sigelLang', 'cs');
    });
  });

  updateHeader();
})();
