/*
 * asia.js — VOYAGERA Asia Continent Page
 * Place at: /javascript/asia.js
 *
 * Covers:
 *   1. Navbar scroll state + hamburger
 *   2. Scroll-reveal (IntersectionObserver)
 *   3. Smooth scroll (data-scroll buttons)
 *   4. Country card click → page redirect
 *   5. D3 interactive Asia map (5 selectable countries)
 */

'use strict';


/* ═══════════════════════════════════════════════════════
   CONFIG — 5 interactive countries
   url: set to the actual page once it exists
═══════════════════════════════════════════════════════ */
const ACTIVE_COUNTRIES = {
  GTM: { name: 'Guatemala',  flag: '🇬🇹', tags: 'Ruins · Volcanoes · Mayan Heritage', url: 'guatemala.html'  },
  CRI: { name: 'Costa Rica', flag: '🇨🇷', tags: 'Rainforest · Wildlife · Pura Vida',  url: 'costa_rica.html' },
  PAN: { name: 'Panama',     flag: '🇵🇦', tags: 'Canal · Biodiversity · Crossroads',  url: 'panama.html'     },
};

/* ── Numeric ID → ISO 3 for every country in the Central America region ── */
const ISO_MAP = {
  84:  'BLZ',   /* Belize        */
  188: 'CRI',   /* Costa Rica    */
  222: 'SLV',   /* El Salvador   */
  320: 'GTM',   /* Guatemala     */
  340: 'HND',   /* Honduras      */
  484: 'MEX',   /* Mexico        */
  558: 'NIC',   /* Nicaragua     */
  591: 'PAN',   /* Panama        */
  170: 'COL',   /* Colombia (southern context) */
};

/* ── Full set of countries to render (active + background context) ── */
const C_AMERICA_SET = new Set([
  'GTM', 'BLZ', 'HND', 'SLV', 'NIC', 'CRI', 'PAN',
  'MEX',   /* northern context */
  'COL',   /* southern context */
]);

/* 

/* ═══════════════════════════════════════════════════════
   1. NAVBAR — scroll state + hamburger
═══════════════════════════════════════════════════════ */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  /* Scroll state */
  const tick = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', tick, { passive: true });
  tick();

  /* Hamburger */
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    })
  );
})();


/* ═══════════════════════════════════════════════════════
   2. SCROLL REVEAL — same IntersectionObserver as home.js
═══════════════════════════════════════════════════════ */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.10 });

  items.forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════════════════════════
   3. SMOOTH SCROLL — data-scroll attribute buttons
═══════════════════════════════════════════════════════ */
(function initScrollButtons() {
  function voyScroll(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 68; /* 68 = navbar height */
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      voyScroll(el.dataset.scroll);
    });
  });
})();


/* ═══════════════════════════════════════════════════════
   4. COUNTRY CARDS — click / keyboard → redirect
═══════════════════════════════════════════════════════ */
(function initCountryCards() {
  const urlMap = {
    guatemala:      'guatemala.html',
    costarica:      'costarica.html',
    panama: 'panama.html',
  };

  document.querySelectorAll('.country-card').forEach(card => {
    const go = () => {
      const url = urlMap[card.dataset.country];
      if (url) window.location.href = url;
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
})();


/* ═══════════════════════════════════════════════════════
   5. D3 INTERACTIVE ASIA MAP
═══════════════════════════════════════════════════════ */
(function initCAmericaMap() {

  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  async function buildMap() {

    /* ── DOM refs ── */
    const container  = document.getElementById('c-america-map-container');
    const tooltip    = document.getElementById('camericaTooltip');
    const mttName    = document.getElementById('camericaMttName');
    const mttSub     = document.getElementById('camericaMttSub');
    const regionText = document.getElementById('camericaRegionText');
    const mapWrap    = document.querySelector('#c-america-map-section .map-wrap');

    if (!container) return;

    /* ── Load world atlas ── */
    let world;
    try {
      world = await d3.json(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      );
    } catch (err) {
      console.warn('Voyagera C.America: could not load world atlas.', err);
      return;
    }

    /* ── SVG canvas ── */
    const W = 960, H = 560;

    /*
     * Mercator centred on Central America.
     * center [-84, 10] puts the isthmus in the middle of the canvas.
     * scale 2400 zooms in tightly so the 7-country strip fills the frame.
     * Mexico provides northern context; Colombia provides southern.
     */
    const proj = d3.geoMercator()
      .center([-84, 10])
      .scale(2400)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    /* ── Build SVG ── */
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* ── Glow filter — same as asia.js ── */
    const defs  = svg.append('defs');
    const fGlow = defs.append('filter')
      .attr('id', 'cam-glow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    fGlow.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur');
    const fMerge = fGlow.append('feMerge');
    fMerge.append('feMergeNode').attr('in', 'blur');
    fMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /* ── Ocean background ── */
    svg.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', '#070d1c');

    /* ── Graticule ── */
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.032)')
      .attr('stroke-width', '0.4')
      .attr('d', pathGen);

    /*
     * Two-pass rendering (same pattern as asia.js):
     *   Pass 1 — background countries (dimmed, no events)
     *   Pass 2 — active countries (interactive, drawn on top)
     */
    const activePaths = {};

    /* ── PASS 1: background countries ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !C_AMERICA_SET.has(iso3) || ACTIVE_COUNTRIES[iso3]) return;

      svg.append('path')
        .datum(topojson.feature(world, g))
        .attr('d', pathGen)
        .attr('fill', '#0c1626')
        .attr('stroke', '#121d32')
        .attr('stroke-width', '0.6')
        .attr('stroke-linejoin', 'round')
        .style('pointer-events', 'none');
    });

    /* ── PASS 2: active countries ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !ACTIVE_COUNTRIES[iso3]) return;

      const data    = ACTIVE_COUNTRIES[iso3];
      const feature = topojson.feature(world, g);

      /* Coloured, glowable path */
      const vp = svg.append('path')
        .datum(feature)
        .attr('d', pathGen)
        .attr('fill', '#1a2845')
        .attr('stroke', '#1e3560')
        .attr('stroke-width', '1.0')
        .attr('stroke-linejoin', 'round')
        .style('transition', 'fill 0.20s ease, filter 0.20s ease');

      activePaths[iso3] = vp;

      /* Country name label */
      const c = pathGen.centroid(feature);
      if (!isNaN(c[0]) && !isNaN(c[1])) {
        /* Label offset tweaks per country so they don't overlap */
        const offsets = {
          GTM: [0, 0],
          CRI: [0, 0],
          PAN: [10, 0],   /* Panama is elongated east; nudge label right */
        };
        const [ox, oy] = offsets[iso3] || [0, 0];

        svg.append('text')
          .attr('x', c[0] + ox)
          .attr('y', c[1] + 4 + oy)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', '8.5px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '1.2px')
          .text(data.name.toUpperCase());
      }

      /* Transparent hit-area on top */
      svg.append('path')
        .datum(feature)
        .attr('d', pathGen)
        .attr('fill', 'transparent')
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter',  ()   => onEnter(iso3, data))
        .on('mousemove',   (ev) => onMove(ev))
        .on('mouseleave',  ()   => onLeave(iso3))
        .on('click',       ()   => onClick(data));
    });

    /* ═══════════════════════════════════════════════
       TOOLTIP helpers — identical to asia.js
    ═══════════════════════════════════════════════ */

    function showTooltip(data) {
      if (!tooltip) return;
      if (mttName) mttName.textContent = `${data.flag}  ${data.name}`;
      if (mttSub)  mttSub.textContent  = data.tags;
      tooltip.classList.add('d3-tt-visible');
    }

    function hideTooltip() {
      if (tooltip) tooltip.classList.remove('d3-tt-visible');
    }

    function positionTooltip(event) {
      if (!tooltip || !mapWrap) return;
      const rect = mapWrap.getBoundingClientRect();
      let tx = event.clientX - rect.left + 14;
      let ty = event.clientY - rect.top  - 44;
      const ttW = tooltip.offsetWidth  + 20;
      const ttH = tooltip.offsetHeight + 10;
      if (tx + ttW > rect.width)  tx = event.clientX - rect.left - ttW;
      if (ty < 4)                 ty = event.clientY - rect.top  + 22;
      if (ty + ttH > rect.height) ty = event.clientY - rect.top  - ttH - 4;
      tooltip.style.left = `${tx}px`;
      tooltip.style.top  = `${ty}px`;
    }

    /* ═══════════════════════════════════════════════
       PATH style helpers — identical to asia.js
    ═══════════════════════════════════════════════ */

    function litStyle(iso3) {
      const p = activePaths[iso3];
      if (!p) return;
      p.attr('fill', '#2a5599')
       .style('filter',
         'drop-shadow(0 0 7px  rgba(0,200,255,0.70)) ' +
         'drop-shadow(0 0 20px rgba(0,200,255,0.32))');
    }

    function defaultStyle(iso3) {
      const p = activePaths[iso3];
      if (!p) return;
      p.attr('fill', '#1a2845')
       .style('filter', 'none');
    }

    /* ═══════════════════════════════════════════════
       EVENT HANDLERS — identical to asia.js
    ═══════════════════════════════════════════════ */

    function onEnter(iso3, data) {
      litStyle(iso3);
      showTooltip(data);
      if (regionText) {
        regionText.textContent = data.name;
        regionText.classList.add('active');
      }
    }

    function onMove(event) {
      positionTooltip(event);
    }

    function onLeave(iso3) {
      defaultStyle(iso3);
      hideTooltip();
      if (regionText) {
        regionText.textContent = 'Hover a country to explore';
        regionText.classList.remove('active');
      }
    }

    function onClick(data) {
      window.location.href = data.url;
    }

  } /* end buildMap */

})();
