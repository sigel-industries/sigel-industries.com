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
      dashboard: { score: '94', kicker: 'Dashboard', title: 'Skóre, rizika a prioritní směr.', text: 'První část reportu ukáže stav webu v jedné vrstvě: co funguje, co brzdí výkon a kde začít.', items: ['Skóre', 'Rizika', 'Archetyp', 'Roadmapa'], bars: [45,70,52,90,75,95,62,82] },
      technika: { score: '99', kicker: 'Technika', title: 'Výkon, indexace a technické limity.', text: 'Tvrdá kontrola základů: rychlost, technické zdraví, metadata, sitemap, robots a mobilní použitelnost.', items: ['Rychlost', 'Indexace', 'Metadata', 'Mobil'], bars: [86,98,76,92,70,88,54,78] },
      komunikace: { score: '82', kicker: 'Komunikace', title: 'Jasnost nabídky a důvěra.', text: 'Vyhodnocení toho, zda návštěvník rychle chápe nabídku, důvody ke koupi a další krok.', items: ['Nabídka', 'Důvěra', 'CTA', 'Důkazy'], bars: [52,74,45,82,64,58,88,70] },
      archetypy: { score: '86', kicker: 'Archetypy', title: 'Značka a zákaznické motivace.', text: 'Interpretace archetypu značky a zákaznických archetypů: kdo potřebuje důkaz, kdo jasnost a kdo vizi.', items: ['Značka', 'Motivace', 'Obavy', 'Tón'], bars: [62,78,88,56,92,66,80,72] },
      roadmapa: { score: '90', kicker: 'Roadmapa', title: 'Co řešit první, druhé a později.', text: 'Prioritní plán, který odděluje kosmetiku od věcí s reálným obchodním dopadem.', items: ['Priorita', 'Dopad', 'Rychlost', 'Další krok'], bars: [92,64,80,70,88,76,58,95] }
    },
    en: {
      dashboard: { score: '94', kicker: 'Dashboard', title: 'Score, risks and priority direction.', text: 'The first part of the report shows the website state in one layer: what works, what blocks performance and where to start.', items: ['Score', 'Risks', 'Archetype', 'Roadmap'], bars: [45,70,52,90,75,95,62,82] },
      technika: { score: '99', kicker: 'Technical', title: 'Performance, indexability and technical limits.', text: 'A hard check of the foundations: speed, technical health, metadata, sitemap, robots and mobile usability.', items: ['Speed', 'Indexing', 'Metadata', 'Mobile'], bars: [86,98,76,92,70,88,54,78] },
      komunikace: { score: '82', kicker: 'Communication', title: 'Offer clarity and trust.', text: 'Evaluation of whether visitors quickly understand the offer, the reasons to buy and the next step.', items: ['Offer', 'Trust', 'CTA', 'Proof'], bars: [52,74,45,82,64,58,88,70] },
      archetypy: { score: '86', kicker: 'Archetypes', title: 'Brand and customer motivations.', text: 'Interpretation of the brand archetype and customer archetypes: who needs proof, clarity or vision.', items: ['Brand', 'Motives', 'Objections', 'Tone'], bars: [62,78,88,56,92,66,80,72] },
      roadmapa: { score: '90', kicker: 'Roadmap', title: 'What to solve first, second and later.', text: 'A priority plan separating cosmetic changes from things with real business impact.', items: ['Priority', 'Impact', 'Speed', 'Next step'], bars: [92,64,80,70,88,76,58,95] }
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
        lead: 'Web může být technicky v pořádku a přesto nepřesvědčuje. Sigel hledá místa, kde se návštěvník ztratí, nezíská důvěru nebo nepochopí další krok.',
        items: [
          ['Kdy dává smysl', 'Když web má návštěvnost, ale málo poptávek, objednávek nebo jasných akcí.'],
          ['Co se kontroluje', 'Jasnost nabídky, CTA, důvěryhodnost, mobilní cesta a komunikační bariéry.'],
          ['Typický výstup', 'Prioritní doporučení, která oddělí kosmetiku od míst s reálným dopadem.']
        ], cta: 'Vyzkoušet audit za beta cenu'
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
        lead: 'Redesign bez diagnostiky často jen vymění vzhled. Sigel pomůže určit, co má nový web skutečně opravit.',
        items: [
          ['Kdy dává smysl', 'Před redesignem, briefem pro agenturu nebo rozhodnutím, co na webu měnit.'],
          ['Co se kontroluje', 'Struktura, komunikace nabídky, důvěra, UX, archetyp značky a rozhodovací cesta.'],
          ['Typický výstup', 'Podklad pro redesign, který řeší funkci webu, ne jen dekoraci.']
        ], cta: 'Získat podklad pro redesign'
      },
      'problem-offer': {
        kicker: 'Co to řeší', title: 'Nabídka je dobrá, lidé ji nechápou',
        lead: 'Někdy problém není produkt, ale způsob, jakým je vysvětlený. Sigel hledá rozdíl mezi tím, co firma nabízí, a tím, co návštěvník opravdu pochopí.',
        items: [
          ['Kdy dává smysl', 'Když zákazníci nerozumí hodnotě, ceně, rozdílu proti konkurenci nebo důvodu pokračovat.'],
          ['Co se kontroluje', 'Jazyk nabídky, důkazy, archetyp značky a zákaznické motivace.'],
          ['Typický výstup', 'Doporučení, jak nabídku zpřesnit pro různé typy zákazníků.']
        ], cta: 'Zpřesnit komunikaci webu'
      },
      'problem-strategy': {
        kicker: 'Co to řeší', title: 'Byznys ztrácí tah',
        lead: 'Web často zůstane v minulosti, i když se firma posunula. Audit ověří, jestli komunikace ještě odpovídá realitě byznysu.',
        items: [
          ['Kdy dává smysl', 'Při stagnaci, změně nabídky, nové cílovce nebo před zásadnějším obchodním rozhodnutím.'],
          ['Co se kontroluje', 'Soulad nabídky, positioning, archetyp, zákaznické segmenty a prioritní rizika.'],
          ['Typický výstup', 'Roadmapa toho, co změnit první, aby web znovu podporoval směr firmy.']
        ], cta: 'Prověřit strategii webu'
      },
      'problem-agency': {
        kicker: 'Co to řeší', title: 'Rychlý podklad pro klienta',
        lead: 'Agentura nemusí začínat od prázdné stránky. Sigel může dodat externí diagnostiku jako vstup do konzultace, redesignu nebo strategie.',
        items: [
          ['Kdy dává smysl', 'Před prvním klientským rozhovorem, auditem, návrhem úprav nebo redesign briefem.'],
          ['Co se kontroluje', 'Technika, UX, komunikace, důvěra, archetypy a priority v jednom podkladu.'],
          ['Typický výstup', 'Rychlý report, který agentura může použít jako interní nebo klientský základ.']
        ], cta: 'Domluvit pilotní spolupráci'
      },
      'system-process': {
        kicker: 'Uvnitř systému', title: 'Jak Sigel skládá výstup',
        lead: 'SIGEL Web Intelligence Audit není čistý AI text ani běžný checklist. Je to analytický systém, který sbírá signály z webu, vyhodnocuje je pomocí vlastního scoringu, pravidel, vah a UX heuristik, a teprve potom je převádí do čitelného reportu.',
        items: [
          ['Sběr signálů', 'Technika, SEO, struktura, obsah, CTA, důvěra a komunikace nabídky.'],
          ['Vlastní analytická logika', 'Systém pracuje s pravidly, váhami, prioritami a scoringem, aby bylo jasné, co má reálný dopad.'],
          ['UX a komunikační heuristiky', 'Audit sleduje, kde návštěvník chápe nabídku, kde váhá a kde může ztrácet důvěru.'],
          ['Interpretační vrstva', 'Nad daty vzniká interpretace značky, zákaznických archetypů a komunikace k různým typům zákazníků.'],
          ['Ruční kontrola v beta režimu', 'Výstup před odesláním prochází kontrolou, aby nepůsobil genericky a měl jasné priority.']
        ], cta: 'Vyzkoušet audit za beta cenu'
      },
      'use-web-audit': {
        kicker: 'Dostupné', title: 'Web Intelligence Audit',
        lead: 'Základní produkt SIGELu: detailní analytický audit jednoho webu před reklamou, redesignem nebo obchodním rozhodnutím.',
        items: [
          ['Obsahuje', 'Techniku, SEO, UX, komunikaci, archetyp značky, zákaznické archetypy a roadmapu.'],
          ['Hodí se pro', 'Firmy, freelancery, menší týmy nebo projekty, které potřebují jasný diagnostický vstup.'],
          ['Výstup', 'Vizuální PDF report s prioritami a doporučeními.']
        ], cta: 'Získat Web Intelligence Audit'
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
          ['Hodí se pro', 'Obchodní přípravu, segmentaci trhu, seznam potenciálních klientů nebo navazující audit.'],
          ['Výstup', 'Strukturovaný seznam webů a kontaktů podle zadání.']
        ], cta: 'Probrat výběr segmentu'
      },
      'use-benchmark': {
        kicker: 'Připravujeme', title: 'Segmentový benchmark',
        lead: 'Porovnání více webů v jednom odvětví, lokalitě nebo tržním výběru. Tohle je navazující vrstva nad jednotlivými audity.',
        items: [
          ['Obsahuje', 'Srovnání skóre, opakující se vzorce, rozdíly mezi hráči a segmentové signály.'],
          ['Hodí se pro', 'Tržní přehled, interní rozhodování, obchodní výběr nebo přípravu strategie.'],
          ['Výstup', 'Benchmarková mapa a souhrn hlavních zjištění.']
        ], cta: 'Zeptat se na benchmark'
      }
    },
    en: {
      'problem-leads': { kicker:'What it solves', title:'Too few enquiries from the website', lead:'A website can be technically fine and still fail to persuade. Sigel looks for places where visitors lose clarity, trust or the next step.', items:[['When it helps','When the site has traffic but few enquiries, orders or meaningful actions.'],['What is checked','Offer clarity, CTA, trust, mobile path and communication barriers.'],['Typical output','Priorities separating cosmetic changes from things with real impact.']], cta:'Try the audit at beta price' },
      'problem-marketing': { kicker:'What it solves', title:'Marketing is running, results are weak', lead:'Before raising ad spend, it is worth checking whether the landing website can actually support a decision.', items:[['When it helps','Before advertising, during weak conversion or when campaigns send traffic without results.'],['What is checked','Landing sections, speed, CTA, proof, trust and mismatch between ads and the website.'],['Typical output','A list of barriers that may block performance before the campaign itself.']], cta:'Check the website before advertising' },
      'problem-redesign': { kicker:'What it solves', title:'Redesign without a clear brief', lead:'A redesign without diagnostics often only changes visuals. Sigel helps define what the new website should actually fix.', items:[['When it helps','Before a redesign, agency brief or decision on what to change.'],['What is checked','Structure, offer communication, trust, UX, brand archetype and decision path.'],['Typical output','A redesign input focused on function, not decoration.']], cta:'Get redesign input' },
      'problem-offer': { kicker:'What it solves', title:'The offer is good, people do not get it', lead:'Sometimes the product is not the problem. The problem is how the value is explained.', items:[['When it helps','When customers do not understand the value, price, difference or reason to continue.'],['What is checked','Offer language, proof, brand archetype and customer motivations.'],['Typical output','Recommendations for clarifying the offer for different customer types.']], cta:'Clarify website communication' },
      'problem-strategy': { kicker:'What it solves', title:'The business is losing momentum', lead:'Websites often stay in the past while the company moves on. The audit checks whether communication still fits the business direction.', items:[['When it helps','During stagnation, changed offer, new target group or before a strategic decision.'],['What is checked','Offer fit, positioning, archetype, customer segments and priority risks.'],['Typical output','A roadmap of what to change first.']], cta:'Check website strategy' },
      'problem-agency': { kicker:'What it solves', title:'Fast client input', lead:'An agency does not have to start from a blank page. Sigel can provide an external diagnostic input for consulting, redesign or strategy.', items:[['When it helps','Before a first client conversation, audit, recommendation or redesign brief.'],['What is checked','Tech, UX, communication, trust, archetypes and priorities in one input.'],['Typical output','A fast report usable as internal or client-facing input.']], cta:'Discuss pilot cooperation' },
      'system-process': { kicker:'Inside the system', title:'How Sigel builds the output', lead:'SIGEL Web Intelligence Audit is not a pure AI text or a generic checklist. It is an analytical system that collects website signals, evaluates them through its own scoring, rules, weights and UX heuristics, and only then turns them into a readable report.', items:[['Signal collection','Technical, SEO, structure, content, CTA, trust and offer communication signals.'],['Own analytical logic','The system works with rules, weights, priorities and scoring so it is clear what has real impact.'],['UX and communication heuristics','The audit checks where visitors understand the offer, hesitate, lose trust or fail to find the next step.'],['Interpretation layer','The data is interpreted through brand, customer archetypes and communication patterns.'],['Human review in beta mode','Before delivery, the output is reviewed so it does not feel generic and has clear priorities.']], cta:'Try the audit at beta price' },
      'use-web-audit': { kicker:'Available', title:'Web Intelligence Audit', lead:'The core SIGEL product: a detailed analytical audit of one website before advertising, redesign or a business decision.', items:[['Includes','Tech, SEO, UX, communication, brand archetype, customer archetypes and roadmap.'],['Useful for','Companies, freelancers, small teams or projects needing clear diagnostic input.'],['Output','A visual PDF report with priorities and recommendations.']], cta:'Get Web Intelligence Audit' },
      'use-agency': { kicker:'Pilot', title:'Agency input', lead:'The same diagnostic base packaged for agency use: client consultation, redesign, SEO or content strategy.', items:[['Includes','External view of the client website, priorities and input for recommendations.'],['Useful for','Agencies that want a faster starting point without full manual diagnostics from zero.'],['Output','Report or internal input by agreement.']], cta:'Discuss pilot cooperation' },
      'use-lead-research': { kicker:'Pilot', title:'Lead Research', lead:'A research layer for finding relevant company websites and public contacts in a segment, location or custom market selection.', items:[['Includes','URL collection, filtering, basic validation and contact preparation for B2B research.'],['Useful for','Sales preparation, market segmentation, prospect lists or follow-up audits.'],['Output','Structured list of websites and contacts based on the brief.']], cta:'Discuss segment selection' },
      'use-benchmark': { kicker:'In preparation', title:'Segment benchmark', lead:'Comparison of multiple websites in one industry, location or market selection. This is a layer above single audits.', items:[['Includes','Score comparison, recurring patterns, differences between players and segment signals.'],['Useful for','Market overview, internal decision-making, sales selection or strategy preparation.'],['Output','Benchmark map and a summary of key findings.']], cta:'Ask about benchmark' }
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
    if (modalCta) modalCta.textContent = data.cta || (lang === 'en' ? 'Try the audit' : 'Vyzkoušet audit');
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
      modalNote.textContent = data.note || (lang === 'en' ? 'Note: The audit is a diagnostic input. It does not guarantee revenue growth, search ranking improvements or campaign results.' : 'Poznámka: Audit je diagnostický podklad. Negarantuje zvýšení tržeb, pozic ve vyhledávání ani výsledků kampaní.');
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

  // Tally modal, lazy-loaded
  let tallyLoading = false;
  function loadTally(callback) {
    if (window.Tally) {
      callback?.();
      return;
    }
    if (tallyLoading) {
      setTimeout(() => loadTally(callback), 250);
      return;
    }
    tallyLoading = true;
    const script = doc.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    script.onload = () => {
      tallyLoading = false;
      callback?.();
    };
    script.onerror = () => {
      tallyLoading = false;
      window.open('https://tally.so/r/jaGlJ1', '_blank', 'noopener');
    };
    doc.head.appendChild(script);
  }

  $$('[data-tally-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const formId = btn.getAttribute('data-tally-open') || 'jaGlJ1';
      const requestedWidth = Number(btn.getAttribute('data-tally-width') || 720);
      const safePopupWidth = Math.max(300, Math.min(requestedWidth, Math.max(300, window.innerWidth - 28)));
      const options = {
        layout: btn.getAttribute('data-tally-layout') || 'modal',
        width: window.innerWidth <= 760 ? safePopupWidth : requestedWidth,
        emoji: { text: btn.getAttribute('data-tally-emoji-text') || '👋', animation: btn.getAttribute('data-tally-emoji-animation') || 'wave' }
      };
      loadTally(() => {
        if (window.Tally?.openPopup) window.Tally.openPopup(formId, options);
        else window.open(`https://tally.so/r/${formId}`, '_blank', 'noopener');
      });
    });
  });

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
