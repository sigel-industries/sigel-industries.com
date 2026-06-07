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

    if (rect.top <= 150 && rect.bottom >= 150) {
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

function updateHeaderState() {
  if (!header) return;

  if (window.scrollY > 20) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }

  updateActiveNav();
}

window.addEventListener("scroll", updateHeaderState, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);

    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 18, 180)}ms`;
  revealObserver.observe(item);
});

interactiveCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  });
});

if (!reduceMotion) {
  let raf = null;

  window.addEventListener(
    "pointermove",
    (event) => {
      if (raf) return;

      raf = requestAnimationFrame(() => {
        const x = Math.round((event.clientX / window.innerWidth) * 100);
        const y = Math.round((event.clientY / window.innerHeight) * 100);

        document.documentElement.style.setProperty("--mx", `${x}%`);
        document.documentElement.style.setProperty("--my", `${y}%`);

        raf = null;
      });
    },
    { passive: true }
  );

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  magneticButtons.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();

      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

(function initModals() {
  const layer = document.getElementById("sigel-modal-layer");

  if (!layer) return;

  const body = document.body;
  let activeModal = null;
  let lastTrigger = null;

  function openModal(id, trigger) {
    const modal = document.getElementById(id);

    if (!modal) return;

    lastTrigger = trigger || null;
    activeModal = modal;

    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");

    document.querySelectorAll(".sigel-modal").forEach((item) => {
      item.classList.remove("is-open");
    });

    modal.classList.add("is-open");
    body.classList.add("modal-opened");

    const close = modal.querySelector("[data-modal-close]");

    if (close) {
      close.focus({ preventScroll: true });
    }
  }

  function closeModal() {
    if (!activeModal) return;

    activeModal.classList.remove("is-open");
    activeModal = null;

    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-opened");

    if (lastTrigger) {
      lastTrigger.focus({ preventScroll: true });
    }
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
    if (event.key === "Escape" && layer.classList.contains("is-open")) {
      closeModal();
    }
  });
})();

document.querySelectorAll(".lang-switch a").forEach((link) => {
  link.addEventListener("click", () => {
    const text = link.textContent.trim().toLowerCase();

    if (text === "en") {
      localStorage.setItem("sigelLang", "en");
    }

    if (text === "cz" || text === "cs") {
      localStorage.setItem("sigelLang", "cs");
    }
  });
});

updateHeaderState();
