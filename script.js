
const root = document.documentElement;
const header = document.querySelector('.site-header');
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const revealItems = document.querySelectorAll('.reveal');
const tiltCards = document.querySelectorAll('.tilt-card');
const interactiveCards = document.querySelectorAll('.interactive-card');
const magneticButtons = document.querySelectorAll('.btn');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
  root.style.setProperty('--scroll', progress.toFixed(2));

  if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);

  let currentId = '';
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 150 && rect.bottom >= 150) currentId = section.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
  });
}

window.addEventListener('scroll', updateScroll, { passive: true });

if (!reduceMotion) {
  let raf = null;
  window.addEventListener('pointermove', event => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      root.style.setProperty('--mx', `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
      root.style.setProperty('--my', `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
      raf = null;
    });
  }, { passive: true });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 18, 180)}ms`;
  observer.observe(item);
});

interactiveCards.forEach(card => {
  card.addEventListener('pointermove', event => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--y', `${event.clientY - rect.top}px`);
  });
});

if (!reduceMotion) {
  tiltCards.forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4;
      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  magneticButtons.forEach(button => {
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

document.querySelectorAll('.lang-switch a').forEach(link => {
  link.addEventListener('click', () => {
    const lang = link.dataset.lang;
    if (lang) localStorage.setItem('sigelLang', lang);
  });
});

updateScroll();
