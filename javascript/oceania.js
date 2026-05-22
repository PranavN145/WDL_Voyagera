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
    australia:      'australia.html',
    newzealand:      'newzealand.html',
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
(function initOceaniaMap() {

  const ACTIVE_COUNTRIES = {
    36:  { name: 'Australia',   flag: '🇦🇺', tags: 'Outback · Reef · Wildlife',          url: 'australia.html'  },
    554: { name: 'New Zealand', flag: '🇳🇿', tags: 'Mountains · Fjords · Maori Culture', url: 'new_zealand.html' },
  };

  /* Background countries — rendered dimmed for geographic context */
  const BG_IDS = new Set([598, 242, 90, 548, 882, 776, 296, 583, 585, 584, 520, 798]);

  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  async function buildMap() {
    const container  = document.getElementById('oceania-map-container');
    const tooltip    = document.getElementById('oceaniaTooltip');
    const mttName    = document.getElementById('oceaniaMttName');
    const mttSub     = document.getElementById('oceaniaMttSub');
    const regionText = document.getElementById('oceaniaRegionText');
    const mapWrap    = document.querySelector('#oceania-map-section .map-wrap');

    if (!container) return;

    let world;
    try {
      world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    } catch (err) {
      console.warn('Voyagera Oceania: could not load world atlas.', err);
      return;
    }

    const W = 1000, H = 520;

    /* Mercator centred on Oceania — 148°E, -27° keeps AUS large and NZL fully visible */
    const proj = d3.geoMercator()
      .center([148, -27])
      .scale(580)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* Glow filter */
    const defs  = svg.append('defs');
    const fGlow = defs.append('filter')
      .attr('id', 'oceania-glow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    fGlow.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur');
    const fm = fGlow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    /* Ocean */
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#070d1c');

    /* Graticule */
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.032)')
      .attr('stroke-width', '0.4')
      .attr('d', pathGen);

    const activePaths = {};

    /* Pass 1 — dimmed background countries */
    world.objects.countries.geometries.forEach(g => {
      const id = parseInt(g.id);
      if (!BG_IDS.has(id)) return;
      svg.append('path')
        .datum(topojson.feature(world, g))
        .attr('d', pathGen)
        .attr('fill', '#0c1626')
        .attr('stroke', '#121d32')
        .attr('stroke-width', '0.5')
        .attr('stroke-linejoin', 'round')
        .style('pointer-events', 'none');
    });

    /* Pass 2 — Australia + New Zealand */
    world.objects.countries.geometries.forEach(g => {
      const id   = parseInt(g.id);
      const data = ACTIVE_COUNTRIES[id];
      if (!data) return;

      const feature = topojson.feature(world, g);

      const vp = svg.append('path')
        .datum(feature)
        .attr('d', pathGen)
        .attr('fill', '#1a2845')
        .attr('stroke', '#1e3560')
        .attr('stroke-width', '0.9')
        .attr('stroke-linejoin', 'round')
        .style('transition', 'fill 0.20s ease, filter 0.20s ease');

      activePaths[id] = vp;

      /* Centroid label */
      const c = pathGen.centroid(feature);
      if (!isNaN(c[0]) && !isNaN(c[1])) {
        svg.append('text')
          .attr('x', c[0]).attr('y', c[1] + 4)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', id === 36 ? '12px' : '9px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '1.2px')
          .text(data.name.toUpperCase());
      }

      /* Transparent hit-area */
      svg.append('path')
        .datum(feature)
        .attr('d', pathGen)
        .attr('fill', 'transparent')
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', ()    => onEnter(id, data))
        .on('mousemove',  (ev)  => onMove(ev))
        .on('mouseleave', ()    => onLeave(id))
        .on('click',      ()    => onClick(data));
    });

    /* ── Styles ── */
    function litStyle(id) {
      const p = activePaths[id]; if (!p) return;
      p.attr('fill', '#2a5599')
       .style('filter',
         'drop-shadow(0 0 7px rgba(0,200,255,0.70)) ' +
         'drop-shadow(0 0 20px rgba(0,200,255,0.32))');
    }
    function defaultStyle(id) {
      const p = activePaths[id]; if (!p) return;
      p.attr('fill', '#1a2845').style('filter', 'none');
    }

    /* ── Tooltip ── */
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

    /* ── Events ── */
    function onEnter(id, data) {
      litStyle(id);
      showTooltip(data);
      if (regionText) { regionText.textContent = data.name; regionText.classList.add('active'); }
    }
    function onMove(ev)  { positionTooltip(ev); }
    function onLeave(id) {
      defaultStyle(id);
      hideTooltip();
      if (regionText) { regionText.textContent = 'Hover a country to explore'; regionText.classList.remove('active'); }
    }
    function onClick(data) { window.location.href = data.url; }
  }

})();
