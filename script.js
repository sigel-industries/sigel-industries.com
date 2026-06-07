// SIGEL V8 interactions.
// Preserves: language routing in HTML, localStorage language switch, modals, Tally, original HTML content.
(function () {
  const doc = document.documentElement;
  const header = document.querySelector('.site-header');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  const revealItems = document.querySelectorAll('.reveal');
  const interactiveCards = document.querySelectorAll('.interactive-card');
  const tiltCards = document.querySelectorAll('.tilt-card');
  const magneticButtons = document.querySelectorAll('.btn');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createProgressBar() {
    if (document.querySelector('.sigel-progress')) return;
    const progress = document.createElement('div');
    progress.className = 'sigel-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
  }

  function createTelemetry() {
    if (reduceMotion || document.querySelector('.sigel-telemetry')) return;
    const telemetry = document.createElement('div');
    telemetry.className = 'sigel-telemetry';
    telemetry.setAttribute('aria-hidden', 'true');
    telemetry.innerHTML = [
      '<span>Cursor X <b data-sigel-x>0</b></span>',
      '<span>Cursor Y <b data-sigel-y>0</b></span>',
      '<span>Scroll <b data-sigel-scroll>0%</b></span>',
      '<span>Time <b data-sigel-time>0.0s</b></span>'
    ].join('');
    document.body.appendChild(telemetry);
  }

  function createMobileMenuButton() {
    if (!header || document.querySelector('.sigel-mobile-menu-toggle')) return;
    const langSwitch = header.querySelector('.lang-switch');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sigel-mobile-menu-toggle';
    button.setAttribute('aria-label', 'Otevřít menu');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = 'Menu';

    if (langSwitch) {
      langSwitch.insertAdjacentElement('beforebegin', button);
    } else {
      header.querySelector('.header-inner')?.appendChild(button);
    }

    button.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        button.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function createIntelTicker() {
    if (document.querySelector('.sigel-intel-ticker')) return;
    const hero = document.querySelector('.hero');
    if (!hero || !hero.parentNode) return;

    const labels = [
      'TECHNICAL SCAN', 'SEO SIGNAL', 'UX FRICTION', 'BRAND ARCHETYPE',
      'CUSTOMER LOGIC', 'CONVERSION RISK', 'PDF REPORT', 'ROADMAP',
      'AGENCY INPUT', 'BATCH BENCHMARK'
    ];

    const ticker = document.createElement('section');
    ticker.className = 'sigel-intel-ticker';
    ticker.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'sigel-intel-track';

    const html = labels.map((label) => `<span>${label}</span><i></i>`).join('');
    track.innerHTML = html + html;
    ticker.appendChild(track);
    hero.insertAdjacentElement('afterend', ticker);
  }

  function updateProgress() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
    doc.style.setProperty('--scroll', `${value}%`);

    const scrollNode = document.querySelector('[data-sigel-scroll]');
    if (scrollNode) scrollNode.textContent = `${Math.round(value)}%`;
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
    updateActiveNav();
    updateProgress();
  }

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

  function setupSmoothScroll() {
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
  }

  function setupReveal() {
    if (!revealItems.length) return;

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -42px 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 14, 150)}ms`;
      observer.observe(item);
    });
  }

  function setupInteractiveCards() {
    interactiveCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--y', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  function setupMotion() {
    if (reduceMotion) return;

    let pointerRaf = null;
    const xNode = document.querySelector('[data-sigel-x]');
    const yNode = document.querySelector('[data-sigel-y]');

    window.addEventListener('pointermove', (event) => {
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        const px = Math.round((event.clientX / window.innerWidth) * 100);
        const py = Math.round((event.clientY / window.innerHeight) * 100);
        doc.style.setProperty('--mx', `${px}%`);
        doc.style.setProperty('--my', `${py}%`);
        if (xNode) xNode.textContent = String(event.clientX);
        if (yNode) yNode.textContent = String(event.clientY);
        pointerRaf = null;
      });
    }, { passive: true });

    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        if (window.innerWidth < 900) return;
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -2.6;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 2.6;
        card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });

    magneticButtons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        if (window.innerWidth < 900) return;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.05}px, ${y * 0.075}px)`;
      }, { passive: true });

      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  function setupLanguageMemory() {
    document.querySelectorAll('.lang-switch a').forEach((link) => {
      link.addEventListener('click', () => {
        const label = link.textContent.trim().toLowerCase();
        if (label === 'en') localStorage.setItem('sigelLang', 'en');
        if (label === 'cz' || label === 'cs') localStorage.setItem('sigelLang', 'cs');
      });
    });
  }

  function setupTelemetryClock() {
    if (reduceMotion) return;
    const start = performance.now();
    const timeNode = document.querySelector('[data-sigel-time]');
    if (!timeNode) return;

    function tick(now) {
      timeNode.textContent = `${((now - start) / 1000).toFixed(1)}s`;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  createProgressBar();
  createTelemetry();
  createMobileMenuButton();
  createIntelTicker();
  setupSmoothScroll();
  setupReveal();
  setupInteractiveCards();
  setupMotion();
  setupLanguageMemory();
  setupTelemetryClock();

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });
  updateHeader();
})();
