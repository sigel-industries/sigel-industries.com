const header = document.querySelector(".site-header");
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav a[href^='#']");
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll(".tilt-card");
const interactiveCards = document.querySelectorAll(".interactive-card");
const magneticButtons = document.querySelectorAll(".btn");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateActiveNav() {
  let currentId = "";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 150 && rect.bottom >= 150) currentId = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
  });
}

function updateHeaderAndProgress() {
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 20);

  const progress = document.querySelector(".sigel-progress");
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
  }

  updateActiveNav();
}

window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });

const menuToggle = document.querySelector(".menu-toggle");
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-opened");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

document.querySelectorAll('.nav a[href^="#"], .mobile-sticky-cta[href^="#"], .snapshot-footer a[href^="#"], .btn[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    document.body.classList.remove("nav-opened");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  });
});

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
  : null;

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 14, 160)}ms`;
  if (revealObserver) revealObserver.observe(item);
  else item.classList.add("is-visible");
});

interactiveCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }, { passive: true });
});

if (!reduceMotion) {
  let raf = null;

  window.addEventListener("pointermove", (event) => {
    if (raf) return;

    raf = requestAnimationFrame(() => {
      const x = Math.round((event.clientX / window.innerWidth) * 100);
      const y = Math.round((event.clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty("--mx", `${x}%`);
      document.documentElement.style.setProperty("--my", `${y}%`);
      raf = null;
    });
  }, { passive: true });

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3.2;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3.2;
      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  magneticButtons.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.075}px, ${y * 0.11}px)`;
    }, { passive: true });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

(function initModals() {
  const layer = document.getElementById("sigel-modal-layer");
  if (!layer) return;

  let activeModal = null;
  let lastTrigger = null;

  function openModal(id, trigger) {
    const modal = document.getElementById(id);
    if (!modal) return;

    lastTrigger = trigger || null;
    activeModal = modal;

    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");

    document.querySelectorAll(".sigel-modal").forEach((item) => item.classList.remove("is-open"));
    modal.classList.add("is-open");
    document.body.classList.add("modal-opened");

    const close = modal.querySelector("[data-modal-close]");
    if (close) close.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!activeModal) return;

    activeModal.classList.remove("is-open");
    activeModal = null;
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-opened");

    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  document.querySelectorAll("[data-modal]").forEach((trigger) => {
    trigger.addEventListener("click", function () {
      openModal(this.getAttribute("data-modal"), this);
    });
  });

  layer.querySelectorAll("[data-modal-close]").forEach((item) => {
    item.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && layer.classList.contains("is-open")) closeModal();
  });
})();

document.querySelectorAll(".lang-switch a").forEach((link) => {
  link.addEventListener("click", () => {
    const text = link.textContent.trim().toLowerCase();
    if (text === "en") localStorage.setItem("sigelLang", "en");
    if (text === "cz" || text === "cs") localStorage.setItem("sigelLang", "cs");
  });
});

updateHeaderAndProgress();
