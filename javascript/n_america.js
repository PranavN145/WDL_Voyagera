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
  MEX: { name: 'Mexico',    flag: '🇲🇽', tags: 'Culture · Cuisine · Ancient Ruins', url: 'mexico.html'    },
  GRL: { name: 'Greenland', flag: '🇬🇱', tags: 'Arctic · Ice Sheets · Wilderness',  url: 'greenland.html' },
  ISL: { name: 'Iceland',   flag: '🇮🇸', tags: 'Volcanoes · Northern Lights · Geysers', url: 'iceland.html' },
};

/* ── Numeric ID → ISO 3 for every country that may appear on this map ── */
const ISO_MAP = {
  124: 'CAN',   /* Canada          */
  840: 'USA',   /* United States   */
  484: 'MEX',   /* Mexico          */
  304: 'GRL',   /* Greenland       */
  352: 'ISL',   /* Iceland         */
  /* Caribbean + Central America for context */
  188: 'CRI',  192: 'CUB',  214: 'DOM',  222: 'SLV',
  320: 'GTM',  332: 'HTI',  340: 'HND',  388: 'JAM',
  558: 'NIC',  591: 'PAN',  630: 'PRI',
  /* Tiny island nations */
  28:  'ATG',   44: 'BHS',   52: 'BRB',   84: 'BLZ',
  212: 'DMA',  308: 'GRD',  659: 'KNA',  662: 'LCA',
  670: 'VCT',  780: 'TTO',
  /* Northern Europe — gives Iceland geographic context */
  826: 'GBR',  372: 'IRL',  578: 'NOR',  752: 'SWE',  208: 'DNK',  246: 'FIN',
};

/* ── Full country set to render as background context ── */
const NA_SET = new Set([
  'CAN', 'USA', 'MEX', 'GRL', 'ISL',
  /* Central America */
  'GTM', 'BLZ', 'HND', 'SLV', 'NIC', 'CRI', 'PAN',
  /* Caribbean */
  'CUB', 'JAM', 'HTI', 'DOM', 'TTO', 'BRB', 'LCA',
  'VCT', 'GRD', 'ATG', 'DMA', 'KNA', 'BHS',
  /* Northern Europe context */
  'GBR', 'IRL', 'NOR', 'SWE', 'DNK', 'FIN',
]);


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
    mexico:      'mexixo.html',
    greenland:      'greenland.html',
    iceland: 'iceland.html',
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
(function initNAmericaMap() {

  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  async function buildMap() {

    /* ── DOM refs ── */
    const container  = document.getElementById('n-america-map-container');
    const tooltip    = document.getElementById('nAmericaTooltip');
    const mttName    = document.getElementById('nAmericaMttName');
    const mttSub     = document.getElementById('nAmericaMttSub');
    const regionText = document.getElementById('nAmericaRegionText');
    const mapWrap    = document.querySelector('#n-america-map-section .map-wrap');

    if (!container) return;

    /* ── World atlas ── */
    let world;
    try {
      world = await d3.json(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      );
    } catch (err) {
      console.warn('Voyagera NorthAmerica: could not load world atlas.', err);
      return;
    }

    /* ── SVG canvas ── */
    const W = 1000, H = 620;

    /*
     * Rotate longitude +45° to pull the North Atlantic (Greenland + Iceland)
     * toward the centre, then tilt latitude -55° to push the view northward
     * so Greenland is fully visible at top.  scale(420) keeps everything in frame.
     */
    const proj = d3.geoNaturalEarth1()
      .rotate([45, -55])
      .scale(420)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    /* ── Build SVG ── */
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* ── Glow filter (mirrors asia.js) ── */
    const defs  = svg.append('defs');
    const fGlow = defs.append('filter')
      .attr('id', 'na-glow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    fGlow.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur');
    const fm = fGlow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    /* ── Ocean ── */
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

    const activePaths = {};

    /* ── PASS 1: background countries (no interaction) ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !NA_SET.has(iso3) || ACTIVE_COUNTRIES[iso3]) return;

      svg.append('path')
        .datum(topojson.feature(world, g))
        .attr('d', pathGen)
        .attr('fill', '#0c1626')
        .attr('stroke', '#121d32')
        .attr('stroke-width', '0.5')
        .attr('stroke-linejoin', 'round')
        .style('pointer-events', 'none');
    });

    /* ── PASS 2: active countries (interactive) ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !ACTIVE_COUNTRIES[iso3]) return;

      const data    = ACTIVE_COUNTRIES[iso3];
      const feature = topojson.feature(world, g);

      /* Visible coloured path */
      const vp = svg.append('path')
        .datum(feature)
        .attr('d', pathGen)
        .attr('fill', '#1a2845')
        .attr('stroke', '#1e3560')
        .attr('stroke-width', '0.9')
        .attr('stroke-linejoin', 'round')
        .style('transition', 'fill 0.20s ease, filter 0.20s ease');

      activePaths[iso3] = vp;

      /* Country label at centroid */
      const c = pathGen.centroid(feature);
      if (!isNaN(c[0]) && !isNaN(c[1])) {
        svg.append('text')
          .attr('x', c[0])
          .attr('y', c[1] + 4)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', iso3 === 'GRL' ? '10px' : '8.5px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '1.2px')
          .text(data.name.toUpperCase());
      }

      /* Transparent hit-area (same pattern as asia.js) */
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

    /* ── Tooltip helpers (identical to asia.js) ── */
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

    /* ── Path style helpers (identical to asia.js) ── */
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
      p.attr('fill', '#1a2845').style('filter', 'none');
    }

    /* ── Event handlers ── */
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
