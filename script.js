const header = document.querySelector(".site-header");
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav a");
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll(".tilt-card");
const interactiveCards = document.querySelectorAll(".interactive-card");
const magneticButtons = document.querySelectorAll(".btn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }

  updateActiveNav();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

function updateActiveNav() {
  let currentId = "";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 140 && rect.bottom >= 140) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href === `#${currentId}`) {
      link.classList.add("active");
    }
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interactiveCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  });
});

if (!reduceMotion) {
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  magneticButtons.forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

updateActiveNav();


// SIGEL Level 3 premium cinematic helper
// Visual-only: mouse ambient position + soft reveal staggering.
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    let raf = null;
    window.addEventListener("pointermove", (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = Math.round((event.clientX / window.innerWidth) * 100);
        const y = Math.round((event.clientY / window.innerHeight) * 100);
        root.style.setProperty("--mx", `${x}%`);
        root.style.setProperty("--my", `${y}%`);
        raf = null;
      });
    }, { passive: true });
  }

  document.querySelectorAll(".feature-grid, .solution-grid, .service-grid, .signal-grid").forEach((grid) => {
    Array.from(grid.children).forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 28, 180)}ms`;
    });
  });
})();


// SIGEL V4 art-direction helpers
// Visual-only: scroll progress, cursor glow, premium stagger.
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.querySelector(".sigel-progress")) {
    const progress = document.createElement("div");
    progress.className = "sigel-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
  }

  function updateScrollProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    root.style.setProperty("--sigel-scroll", `${value}%`);
  }

  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);

  if (!reduceMotion && !document.querySelector(".sigel-cursor-glow")) {
    const glow = document.createElement("div");
    glow.className = "sigel-cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    let raf = null;
    window.addEventListener("pointermove", (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = `${event.clientX}px`;
        const y = `${event.clientY}px`;
        root.style.setProperty("--cursor-x", x);
        root.style.setProperty("--cursor-y", y);
        root.style.setProperty("--mx", `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
        root.style.setProperty("--my", `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
        raf = null;
      });
    }, { passive: true });
  }

  const staggerGroups = document.querySelectorAll(
    ".signal-grid, .core-grid, .solution-grid, .feature-grid, .service-grid, .report-grid, .process-mini, .faq-list"
  );

  staggerGroups.forEach((grid) => {
    Array.from(grid.children).forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 42, 260)}ms`;
    });
  });
})();
