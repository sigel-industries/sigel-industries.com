/* =========================================================
   SIGEL INDUSTRIES
   Final interaction layer
   File: script.js
   ========================================================= */

(function () {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;

  const header = doc.querySelector(".site-header");
  const progress = doc.querySelector(".site-progress");
  const nav = doc.querySelector(".nav");
  const menuToggle = doc.querySelector(".menu-toggle");
  const navLinks = Array.from(doc.querySelectorAll(".nav a"));
  const sections = Array.from(doc.querySelectorAll("main section[id]"));
  const revealItems = Array.from(doc.querySelectorAll(".reveal"));
  const interactiveCards = Array.from(doc.querySelectorAll(".interactive-card"));
  const buttons = Array.from(doc.querySelectorAll(".btn"));
  const reportTabs = Array.from(doc.querySelectorAll(".report-tab"));

  const modalLayer = doc.getElementById("sigel-modal-layer");
  const modalTriggers = Array.from(doc.querySelectorAll("[data-modal]"));
  const closeTriggers = modalLayer ? Array.from(modalLayer.querySelectorAll("[data-modal-close]")) : [];
  const modals = modalLayer ? Array.from(modalLayer.querySelectorAll(".sigel-modal")) : [];
  const modalMap = new Map(modals.map((modal) => [modal.id, modal]));

  const supportsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  let activeModal = null;
  let lastModalTrigger = null;
  let scrollTicking = false;
  let pointerTicking = false;

  /* -----------------------------
     Header / progress / active nav
  ----------------------------- */

  function updateScrollState() {
    const scrollTop = window.scrollY || doc.documentElement.scrollTop || 0;
    const scrollHeight = doc.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 12);
    }

    if (progress) {
      progress.style.setProperty("--progress", `${Math.min(100, Math.max(0, percentage))}%`);
    }

    updateActiveNav();
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;

    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateScrollState();
      scrollTicking = false;
    });
  }

  function updateActiveNav() {
    if (!sections.length || !navLinks.length) return;

    let currentId = "";

    for (const section of sections) {
      const rect = section.getBoundingClientRect();

      if (rect.top <= 140 && rect.bottom >= 140) {
        currentId = section.id;
        break;
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", Boolean(currentId && href === `#${currentId}`));
    });
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });

  /* -----------------------------
     Smooth anchors
  ----------------------------- */

  function getHeaderOffset() {
    const value = getComputedStyle(root).getPropertyValue("--header-h").trim();
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 78;
  }

  function scrollToTarget(target) {
    if (!target) return;

    const offset = getHeaderOffset() + 18;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: supportsReducedMotion ? "auto" : "smooth"
    });
  }

  doc.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;

    const target = doc.querySelector(href);
    if (!target) return;

    event.preventDefault();

    closeMobileMenu();
    closeModal(false);
    scrollToTarget(target);
  });

  /* -----------------------------
     Mobile menu
  ----------------------------- */

  function openMobileMenu() {
    if (!nav || !menuToggle) return;

    nav.classList.add("is-open");
    menuToggle.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    body.classList.add("menu-open");
  }

  function closeMobileMenu() {
    if (!nav || !menuToggle) return;

    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  }

  function toggleMobileMenu() {
    if (!nav || !menuToggle) return;

    if (nav.classList.contains("is-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMobileMenu);
  }

  doc.addEventListener("click", (event) => {
    if (!nav || !menuToggle || !nav.classList.contains("is-open")) return;

    const clickedInsideNav = event.target.closest(".nav");
    const clickedToggle = event.target.closest(".menu-toggle");

    if (!clickedInsideNav && !clickedToggle) {
      closeMobileMenu();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  /* -----------------------------
     Reveal observer
  ----------------------------- */

  function initReveal() {
    if (!revealItems.length) return;

    if (supportsReducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 18, 160)}ms`;
      observer.observe(item);
    });
  }

  /* -----------------------------
     Interactive card glow
  ----------------------------- */

  function initInteractiveCards() {
    if (isTouchDevice || !interactiveCards.length) return;

    interactiveCards.forEach((card) => {
      card.addEventListener(
        "pointermove",
        (event) => {
          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          card.style.setProperty("--x", `${x}px`);
          card.style.setProperty("--y", `${y}px`);
        },
        { passive: true }
      );
    });
  }

  /* -----------------------------
     Ambient pointer glow
  ----------------------------- */

  function initPointerGlow() {
    if (supportsReducedMotion || isTouchDevice) return;

    window.addEventListener(
      "pointermove",
      (event) => {
        if (pointerTicking) return;

        pointerTicking = true;

        window.requestAnimationFrame(() => {
          const x = Math.round((event.clientX / window.innerWidth) * 100);
          const y = Math.round((event.clientY / window.innerHeight) * 100);

          root.style.setProperty("--mx", `${x}%`);
          root.style.setProperty("--my", `${y}%`);

          pointerTicking = false;
        });
      },
      { passive: true }
    );
  }

  /* -----------------------------
     Soft magnetic buttons
  ----------------------------- */

  function initMagneticButtons() {
    if (supportsReducedMotion || isTouchDevice || !buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener(
        "pointermove",
        (event) => {
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;

          button.style.transform = `translate(${x * 0.055}px, ${y * 0.075}px)`;
        },
        { passive: true }
      );

      button.addEventListener("pointerleave", () => {
        button.style.transform = "";
      });
    });
  }

  /* -----------------------------
     Modals
  ----------------------------- */

  function openModal(id, trigger) {
    if (!modalLayer || !id) return;

    const modal = modalMap.get(id);
    if (!modal) return;

    lastModalTrigger = trigger || null;
    activeModal = modal;

    modals.forEach((item) => {
      item.classList.toggle("is-open", item === modal);
    });

    modalLayer.classList.add("is-open");
    modalLayer.setAttribute("aria-hidden", "false");
    body.classList.add("modal-opened");

    const closeButton = modal.querySelector("[data-modal-close]");

    if (closeButton) {
      window.requestAnimationFrame(() => {
        closeButton.focus({ preventScroll: true });
      });
    }
  }

  function closeModal(restoreFocus = true) {
    if (!modalLayer || !activeModal) return;

    activeModal.classList.remove("is-open");
    activeModal = null;

    modalLayer.classList.remove("is-open");
    modalLayer.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-opened");

    if (restoreFocus && lastModalTrigger) {
      window.requestAnimationFrame(() => {
        lastModalTrigger.focus({ preventScroll: true });
        lastModalTrigger = null;
      });
    } else {
      lastModalTrigger = null;
    }
  }

  function initModals() {
    if (!modalLayer || !modalTriggers.length) return;

    modalTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const id = trigger.getAttribute("data-modal");
        openModal(id, trigger);
      });
    });

    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        closeModal(true);
      });
    });

    modalLayer.addEventListener("click", (event) => {
      const clickedBackdrop = event.target.classList.contains("modal-backdrop");
      if (clickedBackdrop) closeModal(true);
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeModal) {
        closeModal(true);
      }
    });
  }

  /* -----------------------------
     Report tabs
  ----------------------------- */

  const reportContent = {
    dashboard: {
      label: "Dashboard",
      titleCs: "Celkový obraz webu",
      titleEn: "Overall website picture",
      textCs: "Skóre oblastí, hlavní rizika, silné stránky a doporučený další postup na první pohled.",
      textEn: "Area scores, main risks, strengths and recommended next steps at a glance.",
      score: "94",
      bars: ["82%", "94%", "70%", "88%"]
    },
    technika: {
      labelCs: "Technika",
      labelEn: "Technical",
      titleCs: "Výkon a technické základy",
      titleEn: "Performance and technical basics",
      textCs: "Lighthouse, indexace, sitemap, robots a technické signály, které tvoří základ použitelného webu.",
      textEn: "Lighthouse, indexation, sitemap, robots and technical signals that form the foundation of a usable website.",
      score: "99",
      bars: ["99%", "92%", "88%", "84%"]
    },
    komunikace: {
      labelCs: "Komunikace",
      labelEn: "Communication",
      titleCs: "Jasnost nabídky",
      titleEn: "Offer clarity",
      textCs: "Jestli web rychle vysvětluje hodnotu, buduje důvěru a vede návštěvníka k dalšímu kroku.",
      textEn: "Whether the website quickly explains value, builds trust and leads the visitor to the next step.",
      score: "82",
      bars: ["82%", "76%", "69%", "88%"]
    },
    archetypy: {
      labelCs: "Archetypy",
      labelEn: "Archetypes",
      titleCs: "Značka a zákaznické typy",
      titleEn: "Brand and customer types",
      textCs: "Jak firma působí, koho pravděpodobně oslovuje a jaký tón komunikace dává smysl.",
      textEn: "How the company feels, whom it probably addresses and what tone of communication makes sense.",
      score: "86",
      bars: ["86%", "78%", "90%", "74%"]
    },
    roadmapa: {
      labelCs: "Roadmapa",
      labelEn: "Roadmap",
      titleCs: "Priority 30 / 60 / 90 dní",
      titleEn: "30 / 60 / 90 day priorities",
      textCs: "Co řešit teď, co potom a co má největší obchodní dopad.",
      textEn: "What to solve now, what comes later and what has the highest business impact.",
      score: "90",
      bars: ["90%", "84%", "80%", "72%"]
    }
  };

  function getCurrentLanguage() {
    return doc.documentElement.lang === "en" ? "en" : "cs";
  }

  function initReportTabs() {
    if (!reportTabs.length) return;

    const screen = doc.querySelector(".report-screen");
    if (!screen) return;

    const scoreEl = screen.querySelector(".screen-score");
    const labelEl = screen.querySelector(".preview-label");
    const titleEl = screen.querySelector(".screen-copy h3");
    const textEl = screen.querySelector(".screen-copy p");
    const bars = Array.from(screen.querySelectorAll(".screen-bars i"));

    reportTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const key = tab.getAttribute("data-report-tab");
        const content = reportContent[key];

        if (!content) return;

        reportTabs.forEach((item) => item.classList.remove("is-active"));
        tab.classList.add("is-active");

        const lang = getCurrentLanguage();

        if (scoreEl) scoreEl.textContent = content.score || "94";

        if (labelEl) {
          labelEl.textContent =
            lang === "en"
              ? content.labelEn || content.label || "Dashboard"
              : content.labelCs || content.label || "Dashboard";
        }

        if (titleEl) {
          titleEl.textContent = lang === "en" ? content.titleEn : content.titleCs;
        }

        if (textEl) {
          textEl.textContent = lang === "en" ? content.textEn : content.textCs;
        }

        bars.forEach((bar, index) => {
          const width = content.bars[index] || "70%";
          bar.style.width = width;
          bar.style.animation = "none";

          window.requestAnimationFrame(() => {
            bar.style.animation = "";
          });
        });
      });
    });
  }

  /* -----------------------------
     Details UX
  ----------------------------- */

  function initDetails() {
    const detailsItems = Array.from(doc.querySelectorAll("details"));
    if (!detailsItems.length) return;

    detailsItems.forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;

        detailsItems.forEach((other) => {
          if (other !== details && other.closest(".faq-list") === details.closest(".faq-list")) {
            other.open = false;
          }
        });
      });
    });
  }

  /* -----------------------------
     Language persistence helpers
  ----------------------------- */

  function initLanguagePersistence() {
    const langLinks = Array.from(doc.querySelectorAll(".lang-switch a"));

    langLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const text = (link.textContent || "").trim().toLowerCase();

        if (text === "cz" || text === "cs") {
          localStorage.setItem("sigelLang", "cs");
        }

        if (text === "en") {
          localStorage.setItem("sigelLang", "en");
        }
      });
    });
  }

  /* -----------------------------
     Tally helper fallback
  ----------------------------- */

  function initTallyFallback() {
    const tallyButtons = Array.from(doc.querySelectorAll("[data-tally-open]"));
    if (!tallyButtons.length) return;

    tallyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tallyId = button.getAttribute("data-tally-open");

        window.setTimeout(() => {
          const hasTally = typeof window.Tally !== "undefined";
          if (hasTally || !tallyId) return;

          window.open(`https://tally.so/r/${tallyId}`, "_blank", "noopener,noreferrer");
        }, 500);
      });
    });
  }

  /* -----------------------------
     Init
  ----------------------------- */

  function init() {
    updateScrollState();
    initReveal();
    initInteractiveCards();
    initPointerGlow();
    initMagneticButtons();
    initModals();
    initReportTabs();
    initDetails();
    initLanguagePersistence();
    initTallyFallback();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
