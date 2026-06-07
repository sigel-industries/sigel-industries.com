
// SIGEL V10 interaction layer. Keeps routing/localStorage and inline modal logic intact.
const header = document.querySelector('.site-header');
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const revealItems = document.querySelectorAll('.reveal');
const interactiveCards = document.querySelectorAll('.interactive-card');
const tiltCards = document.querySelectorAll('.tilt-card');
const buttons = document.querySelectorAll('.btn');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress = document.querySelector('.sigel-progress');
const indicator = document.querySelector('.v10-section-indicator span');
const indicatorLabel = document.querySelector('.v10-section-indicator b');

function currentSection() {
  let current = null;
  document.querySelectorAll('main section').forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 160 && rect.bottom >= 160) current = section;
  });
  return current;
}

function updateUi() {
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);

  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
  }

  const active = currentSection();
  const id = active && active.id ? active.id : '';
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));

  if (active && indicator) {
    indicator.textContent = active.dataset.v10Num || '00';
    if (indicatorLabel) indicatorLabel.textContent = active.dataset.v10Label || 'SYS';
  }
}

window.addEventListener('scroll', updateUi, { passive: true });
window.addEventListener('resize', updateUi, { passive: true });

// Smooth anchors with sticky header offset handled by scroll-margin CSS-ish through JS.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    document.body.classList.remove('nav-opened');
    const toggle = document.querySelector('.menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    const y = target.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

// Mobile menu uses existing nav. No duplicated links, no broken language logic. Civilized, shockingly.
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-opened');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Reveal animation.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 6 * 45, 220)}ms`;
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Pointer glow + card light position.
if (!reduceMotion) {
  let raf = null;
  window.addEventListener('pointermove', (event) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const xPct = Math.round((event.clientX / window.innerWidth) * 100);
      const yPct = Math.round((event.clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty('--mx', `${xPct}%`);
      document.documentElement.style.setProperty('--my', `${yPct}%`);
      raf = null;
    });
  }, { passive: true });

  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--y', `${event.clientY - rect.top}px`);
    });
  });

  tiltCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y - rect.height / 2) / (rect.height / 2)) * -3.2;
      const ry = ((x - rect.width / 2) / (rect.width / 2)) * 3.2;
      card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  buttons.forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.055}px, ${y * 0.08}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

// Make metric bars re-trigger when snapshot enters view.
const bars = document.querySelectorAll('.metric-bar i, .screen-bar i');
if ('IntersectionObserver' in window && bars.length) {
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.animation = 'none';
      entry.target.offsetHeight;
      entry.target.style.animation = '';
    });
  }, { threshold: 0.4 });
  bars.forEach((bar) => barObserver.observe(bar));
}

// Language links still set localStorage via inline onclick. We do not touch them. See, restraint is possible.
updateUi();
