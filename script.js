(() => {
  const doc = document;
  const body = doc.body;
  const lang = body?.dataset.lang || 'cs';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, root = doc) => root.querySelector(sel);
  const $$ = (sel, root = doc) => Array.from(root.querySelectorAll(sel));

  // Header, progress and mobile nav
  const header = $('#siteHeader');
  const progress = $('#progress');
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  let scrollTicking = false;

  function updateScrollState() {
    const st = window.scrollY || 0;
    const max = doc.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--progress', `${max > 0 ? (st / max) * 100 : 0}%`);
    if (header) header.classList.toggle('scrolled', st > 10);
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollState);
  }, { passive: true });
  updateScrollState();

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = !mainNav.classList.contains('open');
      mainNav.classList.toggle('open', open);
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      body.classList.toggle('menu-open', open);
    });
  }

  // Smooth anchors and menu close
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      mainNav?.classList.remove('open');
      menuToggle?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Active nav
  const navLinks = $$('.main-nav a[href^="#"]');
  const navTargets = navLinks.map((link) => $(link.getAttribute('href'))).filter(Boolean);
  if (navTargets.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === id));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    navTargets.forEach((target) => navObserver.observe(target));
  }

  // Reveal animation + count-up
  const scoreEl = $('#scoreNum');
  let countedScore = false;

  function countUp(el, target, duration = 1200) {
    if (!el) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const smooth = p * p * (3 - 2 * p);
      el.textContent = Math.round(smooth * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };
    requestAnimationFrame(tick);
  }

  function revealNow(el) {
    if (!el) return;
    el.classList.add('visible');
    if (el.classList.contains('hero-visual') && !countedScore) {
      countedScore = true;
      setTimeout(() => countUp(scoreEl, 94, 1200), 160);
    }
    if (el.id === 'flow' || el.id === 'reportWrap') el.classList.add('visible');
  }

  const revealTargets = $$('.reveal, #flow, #reportWrap');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach(revealNow);
  }

  const diagList = $('#diagList');
  if (diagList) {
    if ('IntersectionObserver' in window) {
      const diagObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          $$('.diag-row', entry.target).forEach((row, i) => {
            setTimeout(() => row.classList.add('visible'), i * 80);
          });
          diagObserver.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      diagObserver.observe(diagList);
    } else {
      $$('.diag-row', diagList).forEach((row) => row.classList.add('visible'));
    }
  }

  // Report tabs
  const reportCopy = {
    cs: {
      dashboard: { score: '94', kicker: 'Dashboard', title: 'Skóre, rizika a rozhodovací směr.', text: 'První část spojí stav webu, hlavní rizika a obchodní dopad do jedné rychlé orientace.', items: ['Skóre', 'Rizika', 'Obchodní dopad', 'Roadmapa'], bars: [45,70,52,90,75,95,62,82] },
      technika: { score: '99', kicker: 'Technika', title: 'Výkon, indexace a technické limity.', text: 'Tvrdá kontrola základů: rychlost, technické zdraví, metadata, sitemap, robots a mobilní použitelnost.', items: ['Rychlost', 'Indexace', 'Metadata', 'Mobil'], bars: [86,98,76,92,70,88,54,78] },
      komunikace: { score: '82', kicker: 'Komunikace', title: 'Jasnost nabídky a důvěra.', text: 'Vyhodnocení toho, zda návštěvník rychle chápe nabídku, důvody ke koupi a další krok.', items: ['Nabídka', 'Důvěra', 'CTA', 'Důkazy'], bars: [52,74,45,82,64,58,88,70] },
      archetypy: { score: '86', kicker: 'Archetypy', title: 'Značka a zákaznické motivace.', text: 'Interpretace archetypu značky a zákaznických archetypů: kdo potřebuje důkaz, kdo jasnost a kdo vizi.', items: ['Značka', 'Motivace', 'Obavy', 'Tón'], bars: [62,78,88,56,92,66,80,72] },
      roadmapa: { score: '90', kicker: 'Roadmapa', title: 'Co řešit první, druhé a později.', text: 'Prioritní plán, který odděluje kosmetiku od věcí s reálným obchodním dopadem.', items: ['Priorita', 'Dopad', 'Rychlost', 'Další krok'], bars: [92,64,80,70,88,76,58,95] }
    },
    sk: {
      dashboard: { score: '94', kicker: 'Dashboard', title: 'Skóre, riziká a smer rozhodovania.', text: 'Prvá časť spája stav webu, hlavné riziká a obchodný dopad do jednej rýchlej orientácie.', items: ['Skóre', 'Riziká', 'Obchodný dopad', 'Roadmapa'], bars: [45,70,52,90,75,95,62,82] },
      technika: { score: '99', kicker: 'Technika', title: 'Výkon, indexácia a technické limity.', text: 'Tvrdá kontrola základov: rýchlosť, technické zdravie, metadáta, sitemap, robots a mobilná použiteľnosť.', items: ['Rýchlosť', 'Indexácia', 'Metadáta', 'Mobil'], bars: [86,98,76,92,70,88,54,78] },
      komunikace: { score: '82', kicker: 'Komunikácia', title: 'Jasnosť ponuky a dôvera.', text: 'Vyhodnotenie toho, či návštevník rýchlo chápe ponuku, dôvody na nákup a ďalší krok.', items: ['Ponuka', 'Dôvera', 'CTA', 'Dôkazy'], bars: [52,74,45,82,64,58,88,70] },
      archetypy: { score: '86', kicker: 'Archetypy', title: 'Značka a zákaznícke motivácie.', text: 'Interpretácia archetypu značky a zákazníckych archetypov: kto potrebuje dôkaz, jasnosť alebo víziu.', items: ['Značka', 'Motivácie', 'Obavy', 'Tón'], bars: [62,78,88,56,92,66,80,72] },
      roadmapa: { score: '90', kicker: 'Roadmapa', title: 'Čo riešiť ako prvé, druhé a neskôr.', text: 'Prioritný plán oddeľujúci kozmetiku od vecí s reálnym obchodným dopadom.', items: ['Priorita', 'Dopad', 'Rýchlosť', 'Ďalší krok'], bars: [92,64,80,70,88,76,58,95] }
    },
    en: {
      dashboard: { score: '94', kicker: 'Dashboard', title: 'Score, risks and decision direction.', text: 'The first part combines website health, the main risks and business impact into one fast orientation.', items: ['Score', 'Risks', 'Business impact', 'Roadmap'], bars: [45,70,52,90,75,95,62,82] },
      technika: { score: '99', kicker: 'Technical', title: 'Performance, indexability and technical limits.', text: 'A hard check of the foundations: speed, technical health, metadata, sitemap, robots and mobile usability.', items: ['Speed', 'Indexing', 'Metadata', 'Mobile'], bars: [86,98,76,92,70,88,54,78] },
      komunikace: { score: '82', kicker: 'Communication', title: 'Offer clarity and trust.', text: 'Evaluation of whether visitors quickly understand the offer, the reasons to buy and the next step.', items: ['Offer', 'Trust', 'CTA', 'Proof'], bars: [52,74,45,82,64,58,88,70] },
      archetypy: { score: '86', kicker: 'Archetypes', title: 'Brand and customer motivations.', text: 'Interpretation of the brand archetype and customer archetypes: who needs proof, clarity or vision.', items: ['Brand', 'Motives', 'Objections', 'Tone'], bars: [62,78,88,56,92,66,80,72] },
      roadmapa: { score: '90', kicker: 'Roadmap', title: 'What to solve first, second and later.', text: 'A priority plan separating cosmetic changes from things with real business impact.', items: ['Priority', 'Impact', 'Speed', 'Next step'], bars: [92,64,80,70,88,76,58,95] }
    },
    de: {
      dashboard: { score: '94', kicker: 'Dashboard', title: 'Score, Risiken und Entscheidungsrichtung.', text: 'Der erste Teil verbindet Website-Zustand, Hauptrisiken und geschäftliche Wirkung zu einer schnellen Orientierung.', items: ['Score', 'Risiken', 'Geschäftliche Wirkung', 'Roadmap'], bars: [45,70,52,90,75,95,62,82] },
      technika: { score: '99', kicker: 'Technik', title: 'Performance, Indexierbarkeit und technische Grenzen.', text: 'Harte Prüfung der Grundlagen: Geschwindigkeit, technischer Zustand, Metadaten, Sitemap, robots und mobile Nutzbarkeit.', items: ['Geschwindigkeit', 'Indexierung', 'Metadaten', 'Mobil'], bars: [86,98,76,92,70,88,54,78] },
      komunikace: { score: '82', kicker: 'Kommunikation', title: 'Angebotsklarheit und Vertrauen.', text: 'Bewertung, ob Besucher das Angebot, die Kaufgründe und den nächsten Schritt schnell verstehen.', items: ['Angebot', 'Vertrauen', 'CTA', 'Belege'], bars: [52,74,45,82,64,58,88,70] },
      archetypy: { score: '86', kicker: 'Archetypen', title: 'Marke und Kundenmotive.', text: 'Interpretation von Marken- und Kundenarchetypen: Wer benötigt Belege, Klarheit oder Vision.', items: ['Marke', 'Motive', 'Einwände', 'Ton'], bars: [62,78,88,56,92,66,80,72] },
      roadmapa: { score: '90', kicker: 'Roadmap', title: 'Was zuerst, danach und später zu lösen ist.', text: 'Ein priorisierter Plan, der kosmetische Änderungen von Punkten mit echter geschäftlicher Wirkung trennt.', items: ['Priorität', 'Wirkung', 'Tempo', 'Nächster Schritt'], bars: [92,64,80,70,88,76,58,95] }
    }
  };

  const reportScore = $('#reportScore');
  const reportKicker = $('#reportKicker');
  const reportTitle = $('#reportTitle');
  const reportText = $('#reportText');
  const reportItems = $('.report-mini-grid');
  const reportShell = $('#reportWrap');
  const reportBars = $$('.report-bars i');
  $$('.report-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.report-tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      const data = reportCopy[lang]?.[tab.dataset.reportTab] || reportCopy.cs.dashboard;
      if (reportScore) reportScore.textContent = data.score;
      if (reportKicker) reportKicker.textContent = data.kicker;
      if (reportTitle) reportTitle.textContent = data.title;
      if (reportText) reportText.textContent = data.text;
      if (reportItems && data.items) reportItems.innerHTML = data.items.map((item) => `<span>${item}</span>`).join('');
      if (data.bars && reportBars.length) {
        if (reportShell) reportShell.classList.add('switching');
        reportBars.forEach((bar, i) => {
          bar.style.height = `${data.bars[i] || 60}%`;
          bar.style.transform = 'scaleY(.12)';
        });
        window.setTimeout(() => {
          reportBars.forEach((bar) => { bar.style.transform = 'scaleY(1)'; });
          if (reportShell) reportShell.classList.remove('switching');
        }, 80);
      }
    });
  });

  // Cursor
  const cursor = $('#cursor');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.classList.add('on');
    });
    $$('a, button, .interactive-card, .problem-card, .use-card, .agency-card, summary').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('big'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
    });
  }


  // V18.9 hero motion preview: subtle desktop parallax only
  const heroScene = $('.hero-monolith');
  const heroVisual = $('.hero-visual', heroScene || doc);
  if (heroScene && heroVisual && !prefersReduced && window.matchMedia('(hover:hover)').matches) {
    let heroMotionFrame = 0;
    let heroTargetX = 0;
    let heroTargetY = 0;

    function applyHeroMotion() {
      heroVisual.style.setProperty('--hero-x', heroTargetX.toFixed(3));
      heroVisual.style.setProperty('--hero-y', heroTargetY.toFixed(3));
      heroMotionFrame = 0;
    }

    heroScene.addEventListener('pointermove', (e) => {
      const rect = heroScene.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
      heroTargetX = Math.max(-1, Math.min(1, x));
      heroTargetY = Math.max(-1, Math.min(1, y));
      if (!heroMotionFrame) heroMotionFrame = requestAnimationFrame(applyHeroMotion);
    }, { passive: true });

    heroScene.addEventListener('pointerleave', () => {
      heroTargetX = 0;
      heroTargetY = 0;
      if (!heroMotionFrame) heroMotionFrame = requestAnimationFrame(applyHeroMotion);
    }, { passive: true });
  }

  // Hero canvas
  function initParticleCanvas(canvas, opts = {}) {
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const count = opts.count || 56;
    const maxDistance = opts.maxDistance || 112;
    const palettes = opts.palettes || [[77,223,200], [123,159,255], [126,107,255], [255,140,71]];
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.7 + .45,
      vx: (Math.random() - .5) * .00034,
      vy: (Math.random() - .5) * .00034,
      opacity: Math.random() * .5 + .15,
      col: palettes[Math.floor(Math.random() * palettes.length)]
    }));

    let mouseX = .55;
    let mouseY = .28;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      const gx = width * (opts.gx || .54);
      const gy = height * (opts.gy || .42);
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, width * .58);
      grad.addColorStop(0, 'rgba(77,223,200,.032)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const [r, g, bl] = a.col;
            ctx.beginPath();
            ctx.moveTo(a.x * width, a.y * height);
            ctx.lineTo(b.x * width, b.y * height);
            ctx.strokeStyle = `rgba(${r},${g},${bl},${.18 * (1 - dist / maxDistance)})`;
            ctx.lineWidth = .65;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx + (mouseX - .5) * .00007;
        p.y += p.vy + (mouseY - .5) * .00007;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        const [r, g, b] = p.col;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / Math.max(1, width);
      mouseY = (e.clientY - rect.top) / Math.max(1, height);
    });

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) draw();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    visibility.observe(canvas);
    draw();
  }

  initParticleCanvas($('#heroCanvas'), { count: window.innerWidth < 760 ? 34 : 58, maxDistance: 115, gx: .62, gy: .42 });
  initParticleCanvas($('#signalCanvas'), { count: window.innerWidth < 760 ? 24 : 34, maxDistance: 96, gx: .5, gy: .5 });


  // Detail modals for problem cards and system/product layers
  const modalCopy = {
    cs: {
      'problem-leads': {
        kicker: 'Co to řeší', title: 'Málo poptávek z webu',
        lead: 'Web může být technicky v pořádku a přesto nepřesvědčuje. SIGEL hledá místa, kde se návštěvník ztratí, nezíská důvěru nebo nepochopí další krok.',
        items: [
          ['Kdy dává smysl', 'Když web má návštěvnost, ale málo poptávek, objednávek nebo jasných akcí.'],
          ['Co se kontroluje', 'Jasnost nabídky, CTA, důvěryhodnost, mobilní cesta a komunikační bariéry.'],
          ['Typický výstup', 'Prioritní doporučení, která oddělí kosmetiku od míst s reálným dopadem.']
        ], cta: 'Získat Web Intelligence report za 4 980 Kč'
      },
      'problem-marketing': {
        kicker: 'Co to řeší', title: 'Marketing běží, výsledky slabé',
        lead: 'Než se navýší rozpočet, je potřeba zjistit, jestli cílová stránka dokáže návštěvníka vůbec přivést k rozhodnutí.',
        items: [
          ['Kdy dává smysl', 'Před reklamou, při slabé konverzi nebo když kampaně posílají lidi na web bez výsledku.'],
          ['Co se kontroluje', 'Landing sekce, rychlost, CTA, důkazy, důvěra a rozpor mezi reklamou a webem.'],
          ['Typický výstup', 'Seznam bariér, které mohou brzdit výkon ještě před samotnou reklamou.']
        ], cta: 'Prověřit web před reklamou'
      },
      'problem-redesign': {
        kicker: 'Co to řeší', title: 'Redesign bez jasného zadání',
        lead: 'Redesign bez diagnostiky často jen vymění vzhled. SIGEL pomůže určit, co má nový web skutečně opravit.',
        items: [
          ['Kdy dává smysl', 'Před redesignem, briefem pro agenturu nebo rozhodnutím, co na webu měnit.'],
          ['Co se kontroluje', 'Struktura, komunikace nabídky, důvěra, UX, archetyp značky a rozhodovací cesta.'],
          ['Typický výstup', 'Podklad pro redesign, který řeší funkci webu, ne jen dekoraci.']
        ], cta: 'Získat podklad pro redesign'
      },
      'problem-offer': {
        kicker: 'Co to řeší', title: 'Nabídka je dobrá, lidé ji nechápou',
        lead: 'Někdy problém není produkt, ale způsob, jakým je vysvětlený. SIGEL hledá rozdíl mezi tím, co firma nabízí, a tím, co návštěvník opravdu pochopí.',
        items: [
          ['Kdy dává smysl', 'Když zákazníci nerozumí hodnotě, ceně, rozdílu proti konkurenci nebo důvodu pokračovat.'],
          ['Co se kontroluje', 'Jazyk nabídky, důkazy, archetyp značky a zákaznické motivace.'],
          ['Typický výstup', 'Doporučení, jak nabídku zpřesnit pro různé typy zákazníků.']
        ], cta: 'Zpřesnit komunikaci webu'
      },
      'problem-strategy': {
        kicker: 'Co to řeší', title: 'Web už neodpovídá firmě',
        lead: 'Web často zůstane v minulosti, i když se firma posunula. SIGEL ověří, jestli komunikace, nabídka a cílové skupiny ještě odpovídají realitě byznysu.',
        items: [
          ['Kdy dává smysl', 'Při stagnaci, změně nabídky, nové cílovce nebo před zásadnějším obchodním rozhodnutím.'],
          ['Co se kontroluje', 'Soulad nabídky, positioning, archetyp, zákaznické segmenty a prioritní rizika.'],
          ['Typický výstup', 'Roadmapa toho, co změnit první, aby web znovu podporoval směr firmy.']
        ], cta: 'Prověřit strategii webu'
      },
      'problem-agency': {
        kicker: 'Co to řeší', title: 'Rychlý podklad pro rozhodnutí',
        lead: 'Majitel, marketingový tým ani agentura nemusí začínat od dojmů. SIGEL dodá externí diagnostiku jako vstup do konzultace, redesignu, kampaně nebo strategie.',
        items: [
          ['Kdy dává smysl', 'Před konzultací, návrhem úprav, kampaní, redesignem nebo rozhodnutím o dalším rozpočtu.'],
          ['Co se kontroluje', 'Technika, UX, komunikace, důvěra, archetypy a priority v jednom podkladu.'],
          ['Typický výstup', 'Rychlý report použitelný jako interní rozhodovací nebo klientský podklad.']
        ], cta: 'Domluvit pilotní spolupráci'
      },
      'system-process': {
        kicker: 'Analytické jádro', title: 'Jak SIGEL skládá Web Intelligence výstup',
        lead: 'SIGEL Web Intelligence není čistý AI text ani běžný checklist. Je to analytický systém, který sbírá signály z webu, vyhodnocuje je pomocí vlastního scoringu, pravidel, vah a UX heuristik a převádí je do obchodně použitelného reportu.',
        items: [
          ['Sběr signálů', 'Technika, SEO, struktura, obsah, CTA, důvěra a komunikace nabídky.'],
          ['Vlastní analytická logika', 'Systém pracuje s pravidly, váhami, prioritami a scoringem, aby bylo jasné, co má reálný dopad.'],
          ['UX a komunikační heuristiky', 'Systém sleduje, kde návštěvník chápe nabídku, kde váhá a kde může ztrácet důvěru.'],
          ['Interpretační vrstva', 'Nad daty vzniká interpretace značky, zákaznických archetypů a komunikace k různým typům zákazníků.'],
          ['Ruční kontrola výstupu', 'Každý report před odesláním prochází osobní kontrolou, aby měl jasné priority a praktický smysl.']
        ], cta: 'Získat Web Intelligence report za 4 980 Kč'
      },
      'use-web-audit': {
        kicker: 'Dostupné', title: 'Web Intelligence Report',
        lead: 'Základní produkt SIGELu: business intelligence pro jeden konkrétní web před reklamou, redesignem nebo obchodním rozhodnutím.',
        items: [
          ['Obsahuje', 'Desktopové a mobilní Lighthouse metriky, Core Web Vitals, odkazy a CTA, přístupnost, komunikaci nabídky, AI připravenost, archetypový playbook, roadmapu a evidence data.'],
          ['Hodí se pro', 'Firmy, freelancery, menší týmy nebo projekty, které potřebují jasný diagnostický vstup.'],
          ['Výstup', 'Vizuální PDF report s prioritami a doporučeními.']
        ], cta: 'Získat Web Intelligence report'
      },
      'use-agency': {
        kicker: 'Pilotně', title: 'Agenturní podklad',
        lead: 'Stejný diagnostický základ, ale balený pro agenturní použití: klientská konzultace, redesign, SEO nebo obsahová strategie.',
        items: [
          ['Obsahuje', 'Externí pohled na klientský web, priority a podklad pro doporučení.'],
          ['Hodí se pro', 'Agentury, které chtějí rychlejší vstup bez kompletní ruční diagnostiky od nuly.'],
          ['Výstup', 'Report nebo interní podklad podle dohody.']
        ], cta: 'Domluvit pilotní spolupráci'
      },
      'use-lead-research': {
        kicker: 'Pilotně', title: 'Lead Research',
        lead: 'Výzkumná vrstva: hledání relevantních firemních webů a veřejných kontaktů v segmentu, lokalitě nebo vlastním výběru trhu.',
        items: [
          ['Obsahuje', 'Sběr URL, filtrování, základní validaci a přípravu kontaktů pro B2B výzkum.'],
          ['Hodí se pro', 'Obchodní přípravu, segmentaci trhu, seznam potenciálních klientů nebo navazující analýzu.'],
          ['Výstup', 'Strukturovaný seznam webů a kontaktů podle zadání.']
        ], cta: 'Probrat výběr segmentu'
      },
      'use-benchmark': {
        kicker: 'Připravujeme', title: 'Segmentový benchmark',
        lead: 'Porovnání více webů v jednom odvětví, lokalitě nebo tržním výběru. Tohle je navazující vrstva nad jednotlivými reporty.',
        items: [
          ['Obsahuje', 'Srovnání skóre, opakující se vzorce, rozdíly mezi hráči a segmentové signály.'],
          ['Hodí se pro', 'Tržní přehled, interní rozhodování, obchodní výběr nebo přípravu strategie.'],
          ['Výstup', 'Benchmarková mapa a souhrn hlavních zjištění.']
        ], cta: 'Zeptat se na benchmark'
      }
    },
    sk: {
      'problem-leads': { kicker:'Čo to rieši', title:'Málo dopytov z webu', lead:'Web môže byť technicky v poriadku a napriek tomu nepresviedčať. SIGEL hľadá miesta, kde návštevník stráca jasnosť, dôveru alebo ďalší krok.', items:[['Kedy pomáha','Keď má web návštevnosť, ale málo dopytov, objednávok alebo zmysluplných akcií.'],['Čo sa kontroluje','Jasnosť ponuky, CTA, dôvera, mobilná cesta a komunikačné bariéry.'],['Typický výstup','Priority oddeľujúce kozmetiku od vecí s reálnym dopadom.']], cta:'Získať Web Intelligence report za 199 €' },
      'problem-marketing': { kicker:'Čo to rieši', title:'Marketing beží, výsledky sú slabé', lead:'Pred zvýšením rozpočtu sa oplatí overiť, či vstupný web vôbec dokáže podporiť rozhodnutie.', items:[['Kedy pomáha','Pred reklamou, pri slabej konverzii alebo keď kampane posielajú návštevnosť bez výsledku.'],['Čo sa kontroluje','Landing sekcie, rýchlosť, CTA, dôkazy, dôvera a nesúlad medzi reklamou a webom.'],['Typický výstup','Zoznam bariér, ktoré môžu brzdiť výkon ešte pred samotnou kampaňou.']], cta:'Overiť web pred reklamou' },
      'problem-redesign': { kicker:'Čo to rieši', title:'Redizajn bez jasného zadania', lead:'Redizajn bez diagnostiky často zmení iba vzhľad. SIGEL pomôže určiť, čo má nový web skutočne opraviť.', items:[['Kedy pomáha','Pred redizajnom, zadaním pre agentúru alebo rozhodnutím, čo na webe meniť.'],['Čo sa kontroluje','Štruktúra, komunikácia ponuky, dôvera, UX, archetyp značky a rozhodovacia cesta.'],['Typický výstup','Podklad pre redizajn zameraný na funkciu, nie dekoráciu.']], cta:'Získať podklad pre redizajn' },
      'problem-offer': { kicker:'Čo to rieši', title:'Ponuka je dobrá, ľudia jej nerozumejú', lead:'Niekedy nie je problém produkt, ale spôsob, akým sa vysvetľuje jeho hodnota.', items:[['Kedy pomáha','Keď zákazníci nerozumejú hodnote, cene, rozdielu alebo dôvodu pokračovať.'],['Čo sa kontroluje','Jazyk ponuky, dôkazy, archetyp značky a zákaznícke motivácie.'],['Typický výstup','Odporúčania na spresnenie ponuky pre rôzne typy zákazníkov.']], cta:'Spresniť komunikáciu webu' },
      'problem-strategy': { kicker:'Čo to rieši', title:'Web už nezodpovedá firme', lead:'Web často zostane v minulosti, aj keď sa firma posunula. SIGEL overí, či komunikácia, ponuka a cieľové skupiny stále zodpovedajú realite biznisu.', items:[['Kedy pomáha','Pri stagnácii, zmene ponuky, novej cieľovke alebo pred zásadnejším obchodným rozhodnutím.'],['Čo sa kontroluje','Súlad ponuky, positioning, archetyp, zákaznícke segmenty a prioritné riziká.'],['Typický výstup','Roadmapa toho, čo zmeniť ako prvé, aby web znovu podporoval smer firmy.']], cta:'Overiť stratégiu webu' },
      'problem-agency': { kicker:'Čo to rieši', title:'Rýchly podklad pre rozhodnutie', lead:'Majiteľ, marketingový tím ani agentúra nemusia začínať od dojmov. SIGEL dodá externú diagnostiku ako vstup do konzultácie, redizajnu, kampane alebo stratégie.', items:[['Kedy pomáha','Pred konzultáciou, návrhom úprav, kampaňou, redizajnom alebo rozhodnutím o ďalšom rozpočte.'],['Čo sa kontroluje','Technika, UX, komunikácia, dôvera, archetypy a priority v jednom podklade.'],['Typický výstup','Rýchly report použiteľný ako interný rozhodovací alebo klientsky podklad.']], cta:'Dohodnúť pilotnú spoluprácu' },
      'system-process': { kicker:'Analytické jadro', title:'Ako SIGEL skladá Web Intelligence výstup', lead:'SIGEL Web Intelligence nie je čistý AI text ani bežný checklist. Je to analytický systém, ktorý zbiera signály z webu, vyhodnocuje ich vlastným scoringom, pravidlami, váhami a UX heuristikami a prevádza ich do obchodne použiteľného reportu.', items:[['Zber signálov','Technika, SEO, štruktúra, obsah, CTA, dôvera a komunikácia ponuky.'],['Vlastná analytická logika','Systém pracuje s pravidlami, váhami, prioritami a scoringom, aby bolo jasné, čo má reálny dopad.'],['UX a komunikačné heuristiky','Systém sleduje, kde návštevník chápe ponuku, kde váha a kde môže strácať dôveru.'],['Interpretačná vrstva','Nad dátami vzniká interpretácia značky, zákazníckych archetypov a komunikácie pre rôzne typy zákazníkov.'],['Ručná kontrola výstupu','Každý report pred odoslaním prechádza osobnou kontrolou, aby mal jasné priority a praktický zmysel.']], cta:'Získať Web Intelligence report za 199 €' },
      'use-web-audit': { kicker:'Dostupné', title:'Web Intelligence Report', lead:'Základný produkt SIGEL: business intelligence pre jeden konkrétny web pred reklamou, redizajnom alebo obchodným rozhodnutím.', items:[['Obsahuje','Desktopové a mobilné Lighthouse metriky, Core Web Vitals, odkazy a CTA, prístupnosť, komunikáciu ponuky, AI pripravenosť, archetypový playbook, roadmapu a evidence dáta.'],['Hodí sa pre','Firmy, freelancerov, menšie tímy alebo projekty, ktoré potrebujú jasný diagnostický vstup.'],['Výstup','Vizuálny PDF report s prioritami a odporúčaniami.']], cta:'Získať Web Intelligence report' },
      'use-agency': { kicker:'Pilotne', title:'Agentúrny podklad', lead:'Rovnaký diagnostický základ, ale pripravený pre agentúrne použitie: klientsku konzultáciu, redizajn, SEO alebo obsahovú stratégiu.', items:[['Obsahuje','Externý pohľad na klientsky web, priority a podklad pre odporúčanie.'],['Hodí sa pre','Agentúry, ktoré chcú rýchlejší vstup bez kompletnej ručnej diagnostiky od nuly.'],['Výstup','Report alebo interný podklad podľa dohody.']], cta:'Dohodnúť pilotnú spoluprácu' },
      'use-lead-research': { kicker:'Pilotne', title:'Lead Research', lead:'Výskumná vrstva: hľadanie relevantných firemných webov a verejných kontaktov v segmente, lokalite alebo vlastnom výbere trhu.', items:[['Obsahuje','Zber URL, filtrovanie, základnú validáciu a prípravu kontaktov pre B2B výskum.'],['Hodí sa pre','Obchodnú prípravu, segmentáciu trhu, zoznam potenciálnych klientov alebo nadväzujúcu analýzu.'],['Výstup','Štruktúrovaný zoznam webov a kontaktov podľa zadania.']], cta:'Prebrať výber segmentu' },
      'use-benchmark': { kicker:'Pripravujeme', title:'Segmentový benchmark', lead:'Porovnanie viacerých webov v jednom odvetví, lokalite alebo výbere trhu. Ide o nadväzujúcu vrstvu nad jednotlivými reportmi.', items:[['Obsahuje','Porovnanie skóre, opakujúce sa vzorce, rozdiely medzi hráčmi a segmentové signály.'],['Hodí sa pre','Prehľad trhu, interné rozhodovanie, obchodný výber alebo prípravu stratégie.'],['Výstup','Benchmarková mapa a súhrn hlavných zistení.']], cta:'Opýtať sa na benchmark' }
    },
    en: {
      'problem-leads': { kicker:'What it solves', title:'Too few enquiries from the website', lead:'A website can be technically fine and still fail to persuade. SIGEL looks for places where visitors lose clarity, trust or the next step.', items:[['When it helps','When the site has traffic but few enquiries, orders or meaningful actions.'],['What is checked','Offer clarity, CTA, trust, mobile path and communication barriers.'],['Typical output','Priorities separating cosmetic changes from things with real impact.']], cta:'Get the Web Intelligence report for €199' },
      'problem-marketing': { kicker:'What it solves', title:'Marketing is running, results are weak', lead:'Before raising ad spend, it is worth checking whether the landing website can actually support a decision.', items:[['When it helps','Before advertising, during weak conversion or when campaigns send traffic without results.'],['What is checked','Landing sections, speed, CTA, proof, trust and mismatch between ads and the website.'],['Typical output','A list of barriers that may block performance before the campaign itself.']], cta:'Check the website before advertising' },
      'problem-redesign': { kicker:'What it solves', title:'Redesign without a clear brief', lead:'A redesign without diagnostics often only changes visuals. SIGEL helps define what the new website should actually fix.', items:[['When it helps','Before a redesign, agency brief or decision on what to change.'],['What is checked','Structure, offer communication, trust, UX, brand archetype and decision path.'],['Typical output','A redesign input focused on function, not decoration.']], cta:'Get redesign input' },
      'problem-offer': { kicker:'What it solves', title:'The offer is good, people do not get it', lead:'Sometimes the product is not the problem. The problem is how the value is explained.', items:[['When it helps','When customers do not understand the value, price, difference or reason to continue.'],['What is checked','Offer language, proof, brand archetype and customer motivations.'],['Typical output','Recommendations for clarifying the offer for different customer types.']], cta:'Clarify website communication' },
      'problem-strategy': { kicker:'What it solves', title:'The website no longer matches the business', lead:'Websites often stay in the past while the company moves on. SIGEL checks whether the communication, offer and target groups still fit the business direction.', items:[['When it helps','During stagnation, changed offer, new target group or before a strategic decision.'],['What is checked','Offer fit, positioning, archetype, customer segments and priority risks.'],['Typical output','A roadmap of what to change first.']], cta:'Check website strategy' },
      'problem-agency': { kicker:'What it solves', title:'Fast input for a decision', lead:'Owners, marketing teams and agencies do not have to start from opinions. SIGEL provides external diagnostic input for consulting, redesign, campaigns or strategy.', items:[['When it helps','Before consulting, recommendations, campaigns, redesign or the next budget decision.'],['What is checked','Tech, UX, communication, trust, archetypes and priorities in one input.'],['Typical output','A fast report usable as internal decision support or client-facing input.']], cta:'Discuss pilot cooperation' },
      'system-process': { kicker:'Analytical core', title:'How SIGEL builds the Web Intelligence output', lead:'SIGEL Web Intelligence is not pure AI text or a generic checklist. It is an analytical system that collects website signals, evaluates them through its own scoring, rules, weights and UX heuristics, and turns them into a business-ready report.', items:[['Signal collection','Technical, SEO, structure, content, CTA, trust and offer communication signals.'],['Own analytical logic','The system works with rules, weights, priorities and scoring so it is clear what has real impact.'],['UX and communication heuristics','The system checks where visitors understand the offer, hesitate, lose trust or fail to find the next step.'],['Interpretation layer','The data is interpreted through brand, customer archetypes and communication patterns.'],['Human review of the output','Every report is personally reviewed before delivery so it has clear priorities and practical value.']], cta:'Get the Web Intelligence report for €199' },
      'use-web-audit': { kicker:'Available', title:'Web Intelligence Report', lead:'The core SIGEL product: business intelligence for one specific website before advertising, redesign or a business decision.', items:[['Includes','Desktop and mobile Lighthouse metrics, Core Web Vitals, links and CTA, accessibility, offer communication, AI readiness, an archetype playbook, roadmap and evidence data.'],['Useful for','Companies, freelancers, small teams or projects needing clear diagnostic input.'],['Output','A visual PDF report with priorities and recommendations.']], cta:'Get the Web Intelligence report' },
      'use-agency': { kicker:'Pilot', title:'Agency input', lead:'The same diagnostic base packaged for agency use: client consultation, redesign, SEO or content strategy.', items:[['Includes','External view of the client website, priorities and input for recommendations.'],['Useful for','Agencies that want a faster starting point without full manual diagnostics from zero.'],['Output','Report or internal input by agreement.']], cta:'Discuss pilot cooperation' },
      'use-lead-research': { kicker:'Pilot', title:'Lead Research', lead:'A research layer for finding relevant company websites and public contacts in a segment, location or custom market selection.', items:[['Includes','URL collection, filtering, basic validation and contact preparation for B2B research.'],['Useful for','Sales preparation, market segmentation, prospect lists or follow-up analysis.'],['Output','Structured list of websites and contacts based on the brief.']], cta:'Discuss segment selection' },
      'use-benchmark': { kicker:'In preparation', title:'Segment benchmark', lead:'Comparison of multiple websites in one industry, location or market selection. This is a layer above individual reports.', items:[['Includes','Score comparison, recurring patterns, differences between players and segment signals.'],['Useful for','Market overview, internal decision-making, sales selection or strategy preparation.'],['Output','Benchmark map and a summary of key findings.']], cta:'Ask about benchmark' }
    },
    de: {
      'problem-leads': { kicker:'Was es löst', title:'Zu wenige Anfragen über die Website', lead:'Eine Website kann technisch sauber sein und trotzdem nicht überzeugen. SIGEL sucht Stellen, an denen Besucher Klarheit, Vertrauen oder den nächsten Schritt verlieren.', items:[['Wann es hilft','Wenn die Website Traffic hat, aber wenige Anfragen, Bestellungen oder sinnvolle Aktionen erzeugt.'],['Was geprüft wird','Angebotsklarheit, CTA, Vertrauen, mobiler Weg und Kommunikationsbarrieren.'],['Typischer Output','Prioritäten, die Kosmetik von Punkten mit echter Wirkung trennen.']], cta:'Web-Intelligence-Report für 199 € bestellen' },
      'problem-marketing': { kicker:'Was es löst', title:'Marketing läuft, die Ergebnisse bleiben schwach', lead:'Bevor das Werbebudget steigt, sollte geprüft werden, ob die Landingpage eine Entscheidung überhaupt unterstützt.', items:[['Wann es hilft','Vor Werbung, bei schwacher Conversion oder wenn Kampagnen Traffic ohne Ergebnis senden.'],['Was geprüft wird','Landingbereiche, Geschwindigkeit, CTA, Belege, Vertrauen und Abweichungen zwischen Werbung und Website.'],['Typischer Output','Eine Liste von Barrieren, die Leistung schon vor der Kampagne blockieren können.']], cta:'Website vor Werbung prüfen' },
      'problem-redesign': { kicker:'Was es löst', title:'Redesign ohne klares Briefing', lead:'Ein Redesign ohne Diagnostik verändert oft nur die Optik. SIGEL definiert, was die neue Website tatsächlich beheben soll.', items:[['Wann es hilft','Vor Redesign, Agenturbriefing oder der Entscheidung, was geändert werden soll.'],['Was geprüft wird','Struktur, Angebotskommunikation, Vertrauen, UX, Markenarchetyp und Entscheidungsweg.'],['Typischer Output','Eine Redesign-Grundlage mit Fokus auf Funktion statt Dekoration.']], cta:'Grundlage für das Redesign erhalten' },
      'problem-offer': { kicker:'Was es löst', title:'Das Angebot ist gut, wird aber nicht verstanden', lead:'Manchmal ist nicht das Produkt das Problem, sondern die Erklärung seines Werts.', items:[['Wann es hilft','Wenn Kunden Wert, Preis, Unterschied oder Grund zum Fortfahren nicht verstehen.'],['Was geprüft wird','Angebotssprache, Belege, Markenarchetyp und Kundenmotive.'],['Typischer Output','Empfehlungen zur Präzisierung des Angebots für unterschiedliche Kundentypen.']], cta:'Website-Kommunikation präzisieren' },
      'problem-strategy': { kicker:'Was es löst', title:'Die Website passt nicht mehr zum Unternehmen', lead:'Websites bleiben oft in der Vergangenheit, während sich das Unternehmen weiterentwickelt. SIGEL prüft, ob Kommunikation, Angebot und Zielgruppen noch zur Geschäftsrichtung passen.', items:[['Wann es hilft','Bei Stagnation, verändertem Angebot, neuer Zielgruppe oder vor einer strategischen Entscheidung.'],['Was geprüft wird','Angebotspassung, Positionierung, Archetyp, Kundensegmente und prioritäre Risiken.'],['Typischer Output','Eine Roadmap dessen, was zuerst geändert werden sollte.']], cta:'Website-Strategie prüfen' },
      'problem-agency': { kicker:'Was es löst', title:'Schnelle Grundlage für eine Entscheidung', lead:'Inhaber, Marketingteams und Agenturen müssen nicht bei Meinungen beginnen. SIGEL liefert externe Diagnostik als Input für Beratung, Redesign, Kampagnen oder Strategie.', items:[['Wann es hilft','Vor Beratung, Empfehlungen, Kampagnen, Redesign oder der nächsten Budgetentscheidung.'],['Was geprüft wird','Technik, UX, Kommunikation, Vertrauen, Archetypen und Prioritäten in einem Input.'],['Typischer Output','Ein schneller Report als interne Entscheidungsgrundlage oder Kunden-Input.']], cta:'Pilot-Zusammenarbeit besprechen' },
      'system-process': { kicker:'Analytischer Kern', title:'So erstellt SIGEL den Web-Intelligence-Output', lead:'SIGEL Web Intelligence ist weder reiner KI-Text noch eine generische Checkliste. Das Analysesystem sammelt Website-Signale, bewertet sie mit eigenem Scoring, Regeln, Gewichtungen und UX-Heuristiken und übersetzt sie in einen geschäftlich nutzbaren Report.', items:[['Signalerfassung','Technik, SEO, Struktur, Inhalt, CTA, Vertrauen und Angebotskommunikation.'],['Eigene Analyselogik','Regeln, Gewichtungen, Prioritäten und Scoring machen sichtbar, was echte Wirkung hat.'],['UX- und Kommunikationsheuristiken','Das System prüft, wo Besucher das Angebot verstehen, zögern, Vertrauen verlieren oder den nächsten Schritt nicht finden.'],['Interpretationsschicht','Daten werden über Marke, Kundenarchetypen und Kommunikationsmuster interpretiert.'],['Persönliche Prüfung','Jeder Report wird vor der Lieferung geprüft, damit Prioritäten klar und praktisch nutzbar sind.']], cta:'Web-Intelligence-Report für 199 € bestellen' },
      'use-web-audit': { kicker:'Verfügbar', title:'Web-Intelligence-Report', lead:'Das Kernprodukt von SIGEL: Business Intelligence für eine konkrete Website vor Werbung, Redesign oder einer Geschäftsentscheidung.', items:[['Enthält','Lighthouse-Metriken für Desktop und Mobilgeräte, Core Web Vitals, Links und CTA, Barrierefreiheit, Angebotskommunikation, KI-Bereitschaft, Archetypen-Playbook, Roadmap und Evidenzdaten.'],['Geeignet für','Unternehmen, Freelancer, kleine Teams oder Projekte, die einen klaren diagnostischen Input benötigen.'],['Output','Visueller PDF-Report mit Prioritäten und Empfehlungen.']], cta:'Web-Intelligence-Report bestellen' },
      'use-agency': { kicker:'Pilot', title:'Agentur-Input', lead:'Dieselbe diagnostische Basis, verpackt für Agenturnutzung: Kundenberatung, Redesign, SEO oder Content-Strategie.', items:[['Enthält','Externe Sicht auf die Kundenwebsite, Prioritäten und Input für Empfehlungen.'],['Geeignet für','Agenturen, die einen schnelleren Startpunkt ohne vollständige manuelle Diagnostik von null benötigen.'],['Output','Report oder interner Input nach Absprache.']], cta:'Pilot-Zusammenarbeit besprechen' },
      'use-lead-research': { kicker:'Pilot', title:'Lead Research', lead:'Eine Research-Ebene zur Suche relevanter Unternehmenswebsites und öffentlicher Kontakte in Segment, Region oder individueller Marktauswahl.', items:[['Enthält','URL-Sammlung, Filterung, grundlegende Validierung und Kontaktvorbereitung für B2B-Research.'],['Geeignet für','Vertriebsvorbereitung, Marktsegmentierung, Interessentenlisten oder Folgeanalysen.'],['Output','Strukturierte Liste von Websites und Kontakten nach Briefing.']], cta:'Segmentauswahl besprechen' },
      'use-benchmark': { kicker:'In Vorbereitung', title:'Segment-Benchmark', lead:'Vergleich mehrerer Websites in einer Branche, Region oder Marktauswahl. Diese Ebene liegt über einzelnen Reports.', items:[['Enthält','Score-Vergleich, wiederkehrende Muster, Unterschiede zwischen Marktteilnehmern und Segmentsignale.'],['Geeignet für','Marktüberblick, interne Entscheidungen, Vertriebsselektion oder Strategievorbereitung.'],['Output','Benchmark-Karte und Zusammenfassung der wichtigsten Erkenntnisse.']], cta:'Benchmark anfragen' }
    }
  };

  const modal = $('#infoModal');
  const modalKicker = $('#modalKicker');
  const modalTitle = $('#modalTitle');
  const modalLead = $('#modalLead');
  const modalGrid = $('#modalGrid');
  const modalCta = $('#modalCta');
  const modalNote = $('#modalNote');
  let lastModalTrigger = null;

  function openInfoModal(key, trigger) {
    const data = modalCopy[lang]?.[key] || modalCopy.cs[key];
    if (!modal || !data) return;
    lastModalTrigger = trigger || null;
    const theme = key === 'system-process' ? 'system' : (key.startsWith('use-') ? 'use' : 'problem');
    modal.dataset.theme = theme;
    modal.dataset.key = key;
    if (modalKicker) modalKicker.textContent = data.kicker || 'Detail';
    if (modalTitle) modalTitle.textContent = data.title || '';
    if (modalLead) modalLead.textContent = data.lead || '';
    if (modalCta) modalCta.textContent = data.cta || (lang === 'de' ? 'Web-Intelligence-Report bestellen' : (lang === 'en' ? 'Get the Web Intelligence report' : (lang === 'sk' ? 'Získať Web Intelligence report' : 'Získat Web Intelligence report')));
    if (modalGrid) {
      modalGrid.innerHTML = (data.items || []).map(([title, text], index) => `
        <article class="${index === 0 ? 'is-featured' : ''}">
          <span class="modal-step">${String(index + 1).padStart(2, '0')}</span>
          <strong>${title}</strong>
          <p>${text}</p>
        </article>
      `).join('');
    }
    if (modalNote) {
      modalNote.textContent = data.note || (lang === 'de' ? 'Hinweis: Der Report ist eine diagnostische Entscheidungsgrundlage. Er garantiert weder Umsatzwachstum noch bessere Suchpositionen oder Kampagnenergebnisse.' : (lang === 'en' ? 'Note: The report is diagnostic decision support. It does not guarantee revenue growth, search ranking improvements or campaign results.' : (lang === 'sk' ? 'Poznámka: Report je diagnostický podklad pre rozhodnutie. Negarantuje zvýšenie tržieb, pozícií vo vyhľadávaní ani výsledkov kampaní.' : 'Poznámka: Report je diagnostický podklad pro rozhodnutí. Negarantuje zvýšení tržeb, pozic ve vyhledávání ani výsledků kampaní.'))); 
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    $('.modal-close', modal)?.focus();
  }

  function closeInfoModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    lastModalTrigger?.focus?.();
  }

  $$('[data-modal-target]').forEach((btn) => {
    btn.addEventListener('click', () => openInfoModal(btn.getAttribute('data-modal-target'), btn));
  });
  $$('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeInfoModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeInfoModal();
  });


  // Native SIGEL order modal, Google Apps Script backend
  const orderEndpoint = 'https://script.google.com/macros/s/AKfycbxrIL5pXrGT4VLBhlCN6ynTDEw07G7V6D_xzMvUH83aju6bZg6vY0Ahcl2ifzebtzDE/exec';
  const orderStorageKey = 'sigel_order_form_backup_v1';
  const orderModal = $('#orderModal');
  const orderForm = $('#orderForm');
  const orderFormStatus = $('#orderStatus');
  const orderSummaryStatus = $('#summaryStatus');
  const orderSummaryCard = $('#summaryCard');
  const orderDoneMeta = $('#doneMeta');
  let orderActiveLang = ['cs', 'sk', 'en', 'de'].includes(lang) ? lang : 'cs';
  let pendingOrderPayload = null;

  const orderCopy = {
    cs: {
      eyebrow: 'SIGEL Web Intelligence',
      title: 'Objednávka Web Intelligence reportu',
      lead: 'Vyplňte údaje pro objednávku. Před odesláním ještě uvidíte souhrn ke kontrole.',
      priceLabel: 'Startovní cena',
      price: '4 980 Kč',
      customerCompany: 'Firma / podnikatel',
      customerCompanyHint: 'Pro fakturaci na firmu nebo IČO.',
      customerPerson: 'Fyzická osoba',
      customerPersonHint: 'Bez IČO, jen kontaktní a fakturační údaje.',
      companyLabelPerson: 'Jméno objednatele',
      websiteLabel: 'URL webu k analýze',
      websiteHint: 'Stačí zadat doménu, https:// doplníme automaticky.',
      companyLabel: 'Název firmy / objednatele',
      contactLabel: 'Kontaktní osoba',
      icoLabel: 'IČO (volitelné)',
      dicLabel: 'DIČ',
      billingLabel: 'Fakturační adresa',
      emailLabel: 'E-mail pro doručení faktury a reportu',
      phoneLabel: 'Telefon',
      reportLangLabel: 'Jazyk reportu',
      currencyLabel: 'Měna objednávky',
      noteLabel: 'Kontext k analýze (volitelné)',
      termsConsent: 'Souhlasím s obchodními podmínkami služby SIGEL Web Intelligence Audit.',
      privacyConsent: 'Beru na vědomí informace o zpracování osobních údajů.',
      continue: 'Pokračovat na souhrn',
      secureNote: 'Objednávka bude odeslána do systému SIGEL.',
      summaryEyebrow: 'Kontrola objednávky',
      summaryTitle: 'Souhrn před odesláním',
      summaryLead: 'Zkontrolujte údaje. Po potvrzení se vytvoří objednávka a přijde vám faktura.',
      afterSubmitTitle: 'Co bude následovat',
      afterSubmitText: 'Po odeslání objednávky vám brzy dorazí faktura. Po připsání platby začne analýza webu a následně obdržíte PDF report na uvedený e-mail.',
      back: 'Zpět upravit',
      submitOrder: 'Objednat nyní za startovní cenu 4 980 Kč',
      doneEyebrow: 'Objednávka přijata',
      doneTitle: 'Hotovo. Objednávka je v systému.',
      doneText: 'Objednávka byla přijata. Brzy vám dorazí faktura a po připsání platby začne zpracování Web Intelligence reportu.',
      closeDone: 'Zavřít',
      newOrder: 'Nová objednávka',
      websiteError: 'Zadejte platnou URL webu.',
      emailError: 'Zadejte platný e-mail.',
      requiredError: 'Toto pole je povinné.',
      icoError: 'Pokud IČO vyplníte jen čísly, má mít 8 číslic.',
      phoneError: 'Telefon nevypadá jako platný telefon.',
      consentsError: 'Je potřeba potvrdit obchodní podmínky i zpracování osobních údajů.',
      sending: 'Odesílám objednávku…',
      sendError: 'Odeslání se nepodařilo. Zkuste to prosím znovu nebo napište e-mailem.',
      closeLabel: 'Zavřít formulář',
      summaryLabels: { customerType:'Typ objednatele', website:'Web', company:'Firma / objednatel', ico:'IČO', dic:'DIČ', contactPerson:'Kontaktní osoba', email:'E-mail', phone:'Telefon', billing:'Fakturační adresa', reportLanguage:'Jazyk reportu', price:'Cena', note:'Poznámka' }
    },
    sk: {
      eyebrow: 'SIGEL Web Intelligence',
      title: 'Objednávka Web Intelligence reportu',
      lead: 'Vyplňte údaje objednávky. Pred odoslaním ešte uvidíte súhrn na kontrolu.',
      priceLabel: 'Štartovacia cena', price: '199 €',
      customerCompany: 'Firma / podnikateľ', customerCompanyHint: 'Pre fakturáciu na firmu alebo IČO.',
      customerPerson: 'Fyzická osoba', customerPersonHint: 'Bez IČO, iba kontaktné a fakturačné údaje.',
      companyLabelPerson: 'Meno objednávateľa', websiteLabel: 'URL webu na analýzu', websiteHint: 'Stačí zadať doménu. https:// doplníme automaticky.',
      companyLabel: 'Názov firmy / objednávateľa', contactLabel: 'Kontaktná osoba', icoLabel: 'IČO (voliteľné)', dicLabel: 'IČ DPH / DIČ',
      billingLabel: 'Fakturačná adresa', emailLabel: 'E-mail na doručenie faktúry a reportu', phoneLabel: 'Telefón', reportLangLabel: 'Jazyk reportu', currencyLabel: 'Mena objednávky',
      noteLabel: 'Kontext analýzy (voliteľné)', termsConsent: 'Súhlasím s obchodnými podmienkami služby SIGEL Web Intelligence.', privacyConsent: 'Beriem na vedomie informácie o spracúvaní osobných údajov.',
      continue: 'Pokračovať na súhrn', secureNote: 'Objednávka bude odoslaná do systému SIGEL.', summaryEyebrow: 'Kontrola objednávky', summaryTitle: 'Súhrn pred odoslaním',
      summaryLead: 'Skontrolujte údaje. Po potvrdení sa vytvorí objednávka a príde vám faktúra.', afterSubmitTitle: 'Čo bude nasledovať',
      afterSubmitText: 'Po odoslaní objednávky vám čoskoro príde faktúra. Po pripísaní platby začne analýza webu a následne dostanete PDF report na uvedený e-mail.',
      back: 'Späť upraviť', submitOrder: 'Objednať teraz za štartovaciu cenu 199 €', doneEyebrow: 'Objednávka prijatá', doneTitle: 'Hotovo. Objednávka je v systéme.',
      doneText: 'Objednávka bola prijatá. Čoskoro vám príde faktúra a po pripísaní platby sa začne spracovanie Web Intelligence reportu.', closeDone: 'Zavrieť', newOrder: 'Nová objednávka',
      websiteError: 'Zadajte platnú URL webu.', emailError: 'Zadajte platný e-mail.', requiredError: 'Toto pole je povinné.', icoError: 'Ak IČO zadáte iba číslicami, má mať 8 číslic.',
      phoneError: 'Telefónne číslo nevyzerá platne.', consentsError: 'Treba potvrdiť obchodné podmienky aj informácie o osobných údajoch.', sending: 'Odosielam objednávku…',
      sendError: 'Odoslanie sa nepodarilo. Skúste to znova alebo napíšte e-mail.', closeLabel: 'Zavrieť formulár',
      summaryLabels: { customerType:'Typ objednávateľa', website:'Web', company:'Firma / objednávateľ', ico:'IČO', dic:'IČ DPH / DIČ', contactPerson:'Kontaktná osoba', email:'E-mail', phone:'Telefón', billing:'Fakturačná adresa', reportLanguage:'Jazyk reportu', price:'Cena', note:'Poznámka' }
    },
    en: {
      eyebrow: 'SIGEL Web Intelligence',
      title: 'Web Intelligence Report Order',
      lead: 'Fill in the order details. You will see a summary before submitting.',
      priceLabel: 'Launch price',
      price: '€199',
      customerCompany: 'Company / entrepreneur',
      customerCompanyHint: 'For company billing or company ID.',
      customerPerson: 'Individual',
      customerPersonHint: 'No company ID, only contact and billing details.',
      companyLabelPerson: 'Order name',
      websiteLabel: 'Website URL to analyse',
      websiteHint: 'You can enter just the domain. We will add https:// automatically.',
      companyLabel: 'Company / order name',
      contactLabel: 'Contact person',
      icoLabel: 'Company ID (optional)',
      dicLabel: 'VAT ID',
      billingLabel: 'Billing address',
      emailLabel: 'Email for invoice and report delivery',
      phoneLabel: 'Phone',
      reportLangLabel: 'Report language',
      currencyLabel: 'Order currency',
      noteLabel: 'Analysis context (optional)',
      termsConsent: 'I agree with the SIGEL Web Intelligence Audit Terms and Conditions.',
      privacyConsent: 'I acknowledge the information about personal data processing.',
      continue: 'Continue to summary',
      secureNote: 'The order will be sent to the SIGEL system.',
      summaryEyebrow: 'Order check',
      summaryTitle: 'Summary before submission',
      summaryLead: 'Check the details. Confirming this creates the order and you will receive an invoice.',
      afterSubmitTitle: 'What happens next',
      afterSubmitText: 'After submitting the order, you will receive an invoice shortly. Once the payment is received, the website analysis starts and the PDF report will be sent to the email provided.',
      back: 'Back to edit',
      submitOrder: 'Order now for the launch price €199',
      doneEyebrow: 'Order received',
      doneTitle: 'Done. The order is in the system.',
      doneText: 'The order has been received. You will receive an invoice shortly. Once the payment is received, processing of your Web Intelligence report will begin.',
      closeDone: 'Close',
      newOrder: 'New order',
      websiteError: 'Enter a valid website URL.',
      emailError: 'Enter a valid email address.',
      requiredError: 'This field is required.',
      icoError: 'If provided as Czech-style digits, the company ID should have 8 digits.',
      phoneError: 'This phone number does not look valid.',
      consentsError: 'You need to confirm both Terms and Privacy information.',
      sending: 'Sending order…',
      sendError: 'Sending failed. Try again or contact us by email.',
      closeLabel: 'Close form',
      summaryLabels: { customerType:'Customer type', website:'Website', company:'Company / order name', ico:'Company ID', dic:'VAT ID', contactPerson:'Contact person', email:'Email', phone:'Phone', billing:'Billing address', reportLanguage:'Report language', price:'Price', note:'Note' }
    },
    de: {
      eyebrow: 'SIGEL Web Intelligence',
      title: 'Web-Intelligence-Report bestellen',
      lead: 'Füllen Sie die Bestelldaten aus. Vor dem Absenden sehen Sie eine Zusammenfassung.',
      priceLabel: 'Einführungspreis', price: '199 €',
      customerCompany: 'Unternehmen / Gewerbe', customerCompanyHint: 'Für die Rechnungsstellung an ein Unternehmen oder eine USt-IdNr.',
      customerPerson: 'Privatperson', customerPersonHint: 'Ohne USt-IdNr., nur Kontakt- und Rechnungsdaten.',
      companyLabelPerson: 'Name des Auftraggebers', websiteLabel: 'Zu analysierende Website-URL', websiteHint: 'Geben Sie einfach die Domain ein. https:// wird automatisch ergänzt.',
      companyLabel: 'Unternehmen / Auftraggeber', contactLabel: 'Ansprechperson', icoLabel: 'Unternehmensnummer (optional)', dicLabel: 'USt-IdNr.',
      billingLabel: 'Rechnungsadresse', emailLabel: 'E-Mail für Rechnung und Report', phoneLabel: 'Telefon', reportLangLabel: 'Reportsprache', currencyLabel: 'Bestellwährung',
      noteLabel: 'Kontext zur Analyse (optional)', termsConsent: 'Ich stimme den AGB von SIGEL Web Intelligence zu.', privacyConsent: 'Ich habe die Informationen zum Datenschutz und zur Verarbeitung personenbezogener Daten zur Kenntnis genommen.',
      continue: 'Weiter zur Zusammenfassung', secureNote: 'Die Bestellung wird an das SIGEL-System übermittelt.', summaryEyebrow: 'Bestellung prüfen', summaryTitle: 'Zusammenfassung vor dem Absenden',
      summaryLead: 'Prüfen Sie Ihre Angaben. Nach der Bestätigung wird die Bestellung erstellt und eine Rechnung versendet.', afterSubmitTitle: 'Wie es weitergeht',
      afterSubmitText: 'Nach dem Absenden erhalten Sie in Kürze eine Rechnung. Sobald die Zahlung bestätigt ist, beginnt die Website-Analyse und der PDF-Report wird an die angegebene E-Mail-Adresse gesendet.',
      back: 'Zurück zum Bearbeiten', submitOrder: 'Jetzt zum Einführungspreis von 199 € bestellen', doneEyebrow: 'Bestellung eingegangen', doneTitle: 'Erledigt. Ihre Bestellung ist im System.',
      doneText: 'Ihre Bestellung ist eingegangen. Sie erhalten in Kürze eine Rechnung. Nach bestätigtem Zahlungseingang beginnt die Erstellung Ihres Web-Intelligence-Reports.', closeDone: 'Schließen', newOrder: 'Neue Bestellung',
      websiteError: 'Geben Sie eine gültige Website-URL ein.', emailError: 'Geben Sie eine gültige E-Mail-Adresse ein.', requiredError: 'Dieses Feld ist erforderlich.', icoError: 'Prüfen Sie die angegebene Unternehmensnummer.',
      phoneError: 'Die Telefonnummer scheint nicht gültig zu sein.', consentsError: 'AGB und Datenschutzinformationen müssen bestätigt werden.', sending: 'Bestellung wird gesendet …',
      sendError: 'Das Senden ist fehlgeschlagen. Versuchen Sie es erneut oder schreiben Sie uns per E-Mail.', closeLabel: 'Formular schließen',
      summaryLabels: { customerType:'Kundentyp', website:'Website', company:'Unternehmen / Auftraggeber', ico:'Unternehmensnummer', dic:'USt-IdNr.', contactPerson:'Ansprechperson', email:'E-Mail', phone:'Telefon', billing:'Rechnungsadresse', reportLanguage:'Reportsprache', price:'Preis', note:'Notiz' }
    }
  };

  function orderT(key) {
    return orderCopy[orderActiveLang]?.[key] || orderCopy.cs[key] || key;
  }
  function orderLabels() { return orderCopy[orderActiveLang].summaryLabels; }
  function orderEsc(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function updateOrderLegalLinks() {
    const terms = $('[data-legal-link="terms"]', orderModal);
    const privacy = $('[data-legal-link="privacy"]', orderModal);
    if (orderActiveLang === 'de') {
      if (terms) { terms.href = '/en/terms.html'; terms.textContent = 'AGB (Englisch)'; }
      if (privacy) { privacy.href = '/en/privacy-policy.html'; privacy.textContent = 'Datenschutzerklärung (Englisch)'; }
    } else if (orderActiveLang === 'en') {
      if (terms) { terms.href = '/en/terms.html'; terms.textContent = 'Terms and Conditions'; }
      if (privacy) { privacy.href = '/en/privacy-policy.html'; privacy.textContent = 'Privacy Policy'; }
    } else if (orderActiveLang === 'sk') {
      if (terms) { terms.href = '/obchodni-podminky.html'; terms.textContent = 'Obchodné podmienky (české znenie)'; }
      if (privacy) { privacy.href = '/ochrana-osobnich-udaju.html'; privacy.textContent = 'Ochrana osobných údajov (české znenie)'; }
    } else {
      if (terms) { terms.href = '/obchodni-podminky.html'; terms.textContent = 'Obchodní podmínky'; }
      if (privacy) { privacy.href = '/ochrana-osobnich-udaju.html'; privacy.textContent = 'Ochrana osobních údajů'; }
    }
  }
  function getOrderCustomerType() {
    const selected = orderForm?.querySelector('input[name="customerType"]:checked');
    return selected ? selected.value : 'company';
  }
  function updateOrderCustomerTypeUI() {
    const type = getOrderCustomerType();
    $$('[data-type-card]', orderModal).forEach((card) => card.classList.toggle('is-active', card.dataset.typeCard === type));
    $$('.sigel-company-only', orderModal).forEach((el) => el.classList.toggle('is-hidden', type === 'person'));
    const companyLabel = $('#companyFieldLabel', orderModal);
    const companyInput = $('#orderCompany', orderModal);
    if (type === 'person') {
      if (companyLabel) companyLabel.textContent = orderT('companyLabelPerson');
      if (companyInput) companyInput.placeholder = orderActiveLang === 'de' ? 'Vor- und Nachname' : (orderActiveLang === 'en' ? 'Name and surname' : (orderActiveLang === 'sk' ? 'Meno a priezvisko' : 'Jméno a příjmení'));
    } else {
      if (companyLabel) companyLabel.textContent = orderT('companyLabel');
      if (companyInput) companyInput.placeholder = orderActiveLang === 'de' ? 'Unternehmensname' : (orderActiveLang === 'en' ? 'Company name' : (orderActiveLang === 'sk' ? 'Názov firmy' : 'Název firmy'));
    }
  }
  function applyOrderLanguage(nextLang) {
    orderActiveLang = ['cs', 'sk', 'en', 'de'].includes(nextLang) ? nextLang : 'cs';
    $$('[data-i18n]', orderModal).forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = orderT(key);
    });
    $('.sigel-order-close', orderModal)?.setAttribute('aria-label', orderT('closeLabel'));
    const isEn = orderActiveLang === 'en';
    const isSk = orderActiveLang === 'sk';
    const isDe = orderActiveLang === 'de';
    $('#orderWebsite', orderModal).placeholder = (isEn || isDe) ? 'example.com' : 'sigel-industries.com';
    $('#orderEmail', orderModal).placeholder = isDe ? 'kontakt@unternehmen.de' : (isEn ? 'contact@company.com' : (isSk ? 'kontakt@firma.sk' : 'kontakt@firma.cz'));
    $('#orderContactPerson', orderModal).placeholder = isDe ? 'Vor- und Nachname' : (isEn ? 'Name and surname' : (isSk ? 'Meno a priezvisko' : 'Jméno a příjmení'));
    $('#orderIco', orderModal).placeholder = (isEn || isDe) ? 'optional' : (isSk ? 'voliteľné' : 'volitelné');
    $('#orderDic', orderModal).placeholder = isDe ? 'DE123456789 / optional' : (isEn ? 'VAT ID / optional' : (isSk ? 'SK1234567890 / voliteľné' : 'CZ12345678 / volitelné'));
    $('#orderBilling', orderModal).placeholder = isDe ? 'Name, Straße, Ort, PLZ, Land ...' : (isEn ? 'Company name, street, city, ZIP, country...' : (isSk ? 'Názov, ulica, mesto, PSČ, štát...' : 'Název, ulice, město, PSČ, stát...'));
    $('#orderPhone', orderModal).placeholder = isDe ? '+49 30 00000000' : (isSk ? '+421 900 000 000' : '+420 777 000 000');
    $('#orderNote', orderModal).placeholder = isDe ? 'Was sollten wir über die Website oder die aktuelle Situation wissen?' : (isEn ? 'Anything useful to know about the website or current situation?' : (isSk ? 'Čo je dobré vedieť o webe alebo aktuálnej situácii?' : 'Co je dobré vědět o webu nebo aktuální situaci?'));
    const currency = $('#orderCurrency', orderModal);
    if (currency) currency.value = (isEn || isSk || isDe) ? 'EUR' : 'CZK';
    const price = (isEn || isSk || isDe) ? ((isSk || isDe) ? '199 €' : '€199') : '4 980 Kč';
    $('[data-i18n="price"]', orderModal).textContent = price;
    $('#confirmOrder', orderModal).textContent = isDe ? `Jetzt zum Einführungspreis von ${price} bestellen` : (isEn ? `Order now for the launch price ${price}` : (isSk ? `Objednať teraz za štartovaciu cenu ${price}` : `Objednat nyní za startovní cenu ${price}`));
    updateOrderCustomerTypeUI();
    updateOrderLegalLinks();
  }
  function setOrderStep(step) {
    $$('.sigel-order-view', orderModal).forEach((el) => el.classList.toggle('is-active', el.dataset.view === step));
    const order = ['form','summary','done'];
    const activeIndex = order.indexOf(step);
    $$('.sigel-order-dot', orderModal).forEach((dot) => {
      const dotIndex = order.indexOf(dot.dataset.stepDot);
      dot.classList.toggle('is-active', dot.dataset.stepDot === step);
      dot.classList.toggle('is-done', dotIndex < activeIndex);
    });
    $('.sigel-order-dialog', orderModal).scrollTop = 0;
  }
  function clearOrderErrors() { $$('[data-error-for]', orderModal).forEach((el) => el.textContent = ''); }
  function setOrderError(name, message) {
    const el = $(`[data-error-for="${name}"]`, orderModal);
    if (el) el.textContent = message;
  }
  function clearOrderStatuses() {
    [orderFormStatus, orderSummaryStatus].forEach((box) => { if (box) { box.className = 'sigel-order-status'; box.textContent = ''; } });
  }
  function showOrderStatus(box, type, message) {
    if (!box) return;
    box.className = `sigel-order-status ${type === 'ok' ? 'is-ok' : 'is-bad'}`;
    box.textContent = message;
  }
  function normalizeOrderWebsite(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/\s/.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  }
  function validateOrderUrl(value) {
    try {
      const url = new URL(normalizeOrderWebsite(value));
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.') && /^[a-z0-9.-]+$/i.test(url.hostname);
    } catch { return false; }
  }
  function validOrderEmail(value) {
    const v = String(value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return false;
    const tld = v.split('.').pop().toLowerCase();
    return tld.length >= 2;
  }
  function validOrderPhone(value) {
    const v = String(value || '').trim();
    if (!v) return true;
    return /^[+()0-9\s.-]{7,22}$/.test(v);
  }
  function validOrderIco(value) {
    const v = String(value || '').trim();
    if (!v) return true;
    if (/^\d+$/.test(v)) return /^\d{8}$/.test(v);
    return /^[A-Za-z0-9 .\-_/]{3,32}$/.test(v);
  }
  function getOrderPrice(currency) { return currency === 'EUR' ? ((orderActiveLang === 'sk' || orderActiveLang === 'de') ? '199 €' : '€199') : '4 980 Kč'; }
  function createOrderId(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `SIGEL-${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${rand}`;
  }
  function formatOrderLocalDateTime(date) {
    return new Intl.DateTimeFormat('sv-SE', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(date).replace(' ', 'T');
  }
  function orderPayloadFromForm() {
    const data = Object.fromEntries(new FormData(orderForm).entries());
    const now = new Date();
    const currency = data.currency || ((orderActiveLang === 'en' || orderActiveLang === 'sk' || orderActiveLang === 'de') ? 'EUR' : 'CZK');
    return {
      id: createOrderId(now),
      createdAt: now.toISOString(),
      createdAtUtc: now.toISOString(),
      createdAtLocal: formatOrderLocalDateTime(now),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      timezoneOffsetMinutes: now.getTimezoneOffset(),
      source: 'sigel-industries-web',
      language: orderActiveLang,
      customerType: data.customerType || 'company',
      status: 'new_order',
      paymentStatus: 'invoice_pending',
      deliveryStatus: 'waiting_for_payment',
      price: getOrderPrice(currency),
      currency,
      website: normalizeOrderWebsite(data.website || ''),
      company: data.company?.trim() || '',
      ico: data.ico?.trim() || '',
      dic: data.dic?.trim() || '',
      billing: data.billing?.trim() || '',
      contactPerson: data.contactPerson?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      reportLanguage: data.reportLanguage || '',
      note: data.note?.trim() || '',
      termsConsent: Boolean(orderForm.termsConsent.checked),
      privacyConsent: Boolean(orderForm.privacyConsent.checked),
      website_extra: data.website_extra || ''
    };
  }
  function validateOrderForm(payload) {
    clearOrderErrors(); clearOrderStatuses();
    let ok = true;
    if (payload.website_extra) return false;
    if (!validateOrderUrl(orderForm.website.value)) { setOrderError('website', orderT('websiteError')); ok = false; }
    if (!payload.company || payload.company.length < 2) { setOrderError('company', orderT('requiredError')); ok = false; }
    if (payload.customerType === 'company' && payload.ico && !validOrderIco(payload.ico)) { setOrderError('ico', orderT('icoError')); ok = false; }
    if (!payload.billing || payload.billing.length < 8) { setOrderError('billing', orderT('requiredError')); ok = false; }
    if (!validOrderEmail(payload.email)) { setOrderError('email', orderT('emailError')); ok = false; }
    if (!validOrderPhone(payload.phone)) { setOrderError('phone', orderT('phoneError')); ok = false; }
    if (!payload.termsConsent || !payload.privacyConsent) { setOrderError('consents', orderT('consentsError')); ok = false; }
    return ok;
  }
  function renderOrderSummary(payload) {
    const L = orderLabels();
    const customerTypeLabel = payload.customerType === 'person'
      ? (orderActiveLang === 'de' ? 'Privatperson' : (orderActiveLang === 'en' ? 'Individual' : (orderActiveLang === 'sk' ? 'Fyzická osoba' : 'Fyzická osoba')))
      : (orderActiveLang === 'de' ? 'Unternehmen / Gewerbe' : (orderActiveLang === 'en' ? 'Company / entrepreneur' : (orderActiveLang === 'sk' ? 'Firma / podnikateľ' : 'Firma / podnikatel'))); 
    const fields = [
      ['customerType', customerTypeLabel], ['website', payload.website], ['company', payload.company],
      ['ico', payload.ico || '—'], ['dic', payload.dic || '—'], ['contactPerson', payload.contactPerson || '—'],
      ['email', payload.email], ['phone', payload.phone || '—'], ['billing', payload.billing, true],
      ['reportLanguage', payload.reportLanguage], ['price', `${payload.price} · ${payload.currency}`], ['note', payload.note || '—', true]
    ];
    orderSummaryCard.innerHTML = fields.map(([key, value, wide]) => `
      <div class="sigel-summary-item ${wide ? 'is-wide' : ''}" data-summary-key="${orderEsc(key)}">
        <span>${orderEsc(L[key] || key)}</span>
        <strong>${orderEsc(value)}</strong>
      </div>
    `).join('');
  }
  function saveOrderBackup(payload) {
    try {
      const current = JSON.parse(localStorage.getItem(orderStorageKey) || '[]');
      current.unshift(payload);
      localStorage.setItem(orderStorageKey, JSON.stringify(current.slice(0, 30)));
    } catch {}
  }
  function renderOrderDone(payload) {
    orderDoneMeta.innerHTML = `<strong>${orderEsc(payload.id)}</strong><br>${orderEsc(payload.createdAtLocal)} · ${orderEsc(payload.price)} · ${orderEsc(payload.website)}<br>${orderEsc(payload.email)}`;
  }
  function openOrderModal(nextLang = lang) {
    if (!orderModal || !orderForm) return;
    const info = $('#infoModal');
    if (info && !info.hidden) { info.hidden = true; info.setAttribute('aria-hidden','true'); }
    applyOrderLanguage(nextLang);
    clearOrderErrors(); clearOrderStatuses();
    pendingOrderPayload = null;
    orderForm.reset();
    applyOrderLanguage(nextLang);
    setOrderStep('form');
    orderModal.classList.add('is-open');
    orderModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    setTimeout(() => $('#orderWebsite', orderModal)?.focus(), 40);
  }
  function closeOrderModal() {
    orderModal?.classList.remove('is-open');
    orderModal?.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (orderModal && orderForm) {
    $$('input[name="customerType"]', orderModal).forEach((radio) => radio.addEventListener('change', updateOrderCustomerTypeUI));
    $$('[data-order-close]', orderModal).forEach((el) => el.addEventListener('click', closeOrderModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && orderModal.classList.contains('is-open')) closeOrderModal(); });
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = orderPayloadFromForm();
      if (!validateOrderForm(payload)) return;
      pendingOrderPayload = payload;
      renderOrderSummary(payload);
      setOrderStep('summary');
    });
    $('#backToForm', orderModal)?.addEventListener('click', () => setOrderStep('form'));
    $('#confirmOrder', orderModal)?.addEventListener('click', async () => {
      if (!pendingOrderPayload) return;
      showOrderStatus(orderSummaryStatus, 'ok', orderT('sending'));
      try {
        await fetch(orderEndpoint, { method: 'POST', mode: 'no-cors', body: JSON.stringify(pendingOrderPayload) });
        saveOrderBackup(pendingOrderPayload);
        renderOrderDone(pendingOrderPayload);
        setOrderStep('done');
        orderForm.reset();
      } catch (error) {
        console.error(error);
        showOrderStatus(orderSummaryStatus, 'bad', orderT('sendError'));
      }
    });
    $('#newOrder', orderModal)?.addEventListener('click', () => {
      pendingOrderPayload = null;
      clearOrderErrors(); clearOrderStatuses(); orderForm.reset(); applyOrderLanguage(orderActiveLang); setOrderStep('form');
      setTimeout(() => $('#orderWebsite', orderModal)?.focus(), 40);
    });
    $('#orderCurrency', orderModal)?.addEventListener('change', (event) => {
      const price = getOrderPrice(event.target.value);
      $('[data-i18n="price"]', orderModal).textContent = price;
      $('#confirmOrder', orderModal).textContent = orderActiveLang === 'en' ? `Order now for the launch price ${price}` : (orderActiveLang === 'sk' ? `Objednať teraz za štartovaciu cenu ${price}` : `Objednat nyní za startovní cenu ${price}`);
    });
    $$('[data-order-open]').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openOrderModal(btn.getAttribute('data-order-lang') || lang); }));
  }

  // Cookie consent + GA4 lazy load
  const cookieBar = $('#cookieBar');
  const consentKey = 'sigel_cookie_consent_v1';
  const gaId = body?.dataset.gaId || '';

  function loadGA() {
    if (!gaId || window.__sigelGaLoaded) return;
    window.__sigelGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });

    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    doc.head.appendChild(script);
  }

  const savedConsent = localStorage.getItem(consentKey);
  if (savedConsent === 'accepted') {
    loadGA();
  } else if (!savedConsent && cookieBar) {
    cookieBar.hidden = false;
  }

  $$('[data-cookie-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-cookie-choice');
      localStorage.setItem(consentKey, choice === 'accept' ? 'accepted' : 'denied');
      if (cookieBar) cookieBar.hidden = true;
      if (choice === 'accept') loadGA();
    });
  });
})();
