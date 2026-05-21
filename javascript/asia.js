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
  IND: { name: 'India',      flag: '🇮🇳', tags: 'Culture · Spirituality · Diversity', url: 'india.html'      },
  JPN: { name: 'Japan',      flag: '🇯🇵', tags: 'Culture · Neon · Food',              url: 'japan.html'      },
  KAZ: { name: 'Kazakhstan', flag: '🇰🇿', tags: 'Adventure · Nomad · Wilderness',     url: 'kazakhstan.html' },
  IDN: { name: 'Indonesia',  flag: '🇮🇩', tags: 'Islands · Nature · Culture',         url: 'indonesia.html'  },
  THA: { name: 'Thailand',   flag: '🇹🇭', tags: 'Food · Temples · Islands',           url: 'thailand.html'   },
};

/* ── Numeric ID → ISO‑3 for every country that appears on the Asia map ── */
const ISO_MAP = {
  4:'AFG',  31:'AZE',  48:'BHR',  50:'BGD',  51:'ARM',  64:'BTN',
  96:'BRN', 104:'MMR', 116:'KHM', 144:'LKA', 156:'CHN', 158:'TWN',
  268:'GEO',275:'PSE', 356:'IND', 360:'IDN', 364:'IRN', 368:'IRQ',
  376:'ISR',392:'JPN', 398:'KAZ', 400:'JOR', 408:'PRK', 410:'KOR',
  414:'KWT',417:'KGZ', 418:'LAO', 422:'LBN', 458:'MYS', 462:'MDV',
  496:'MNG',512:'OMN', 524:'NPL', 586:'PAK', 608:'PHL', 626:'TLS',
  634:'QAT',643:'RUS', 682:'SAU', 702:'SGP', 704:'VNM', 760:'SYR',
  762:'TJK',764:'THA', 784:'ARE', 792:'TUR', 795:'TKM', 860:'UZB',
  887:'YEM',
};

/* ── Full set of countries to render (active + background context) ── */
const ASIA_SET = new Set([
  /* East Asia */        'CHN','JPN','KOR','PRK','MNG','TWN',
  /* South Asia */       'IND','PAK','BGD','NPL','LKA','BTN','MDV','AFG',
  /* Central Asia */     'KAZ','UZB','TKM','KGZ','TJK',
  /* Southeast Asia */   'IDN','PHL','VNM','THA','MYS','MMR','KHM','LAO','SGP','BRN','TLS',
  /* West Asia / ME */   'IRN','IRQ','TUR','SAU','YEM','SYR','JOR','ISR','LBN',
                         'ARE','OMN','KWT','QAT','BHR','PSE','AZE','ARM','GEO',
  /* Northern context */ 'RUS',
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
    india:      'india.html',
    japan:      'japan.html',
    kazakhstan: 'kazakhstan.html',
    indonesia:  'indonesia.html',
    thailand:   'thailand.html',
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
(function initAsiaMap() {

  /* ── Wait for D3 + TopoJSON CDN scripts (mirrors home.js pattern) ── */
  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  /* ─────────────────────────────────────────────────── */
  async function buildMap() {

    /* ── DOM refs (all IDs exactly as in asia.html) ── */
    const container  = document.getElementById('asia-map-container');
    const tooltip    = document.getElementById('asiaTooltip');
    const mttName    = document.getElementById('asiaMttName');
    const mttSub     = document.getElementById('asiaMttSub');
    const regionText = document.getElementById('asiaRegionText');
    const mapWrap    = document.querySelector('#asia-map-section .map-wrap');

    if (!container) return;

    /* ── Load world‑atlas 110m (same URL as home.js) ── */
    let world;
    try {
      world = await d3.json(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      );
    } catch (err) {
      console.warn('Voyagera Asia: could not load world atlas.', err);
      return;
    }

    /* ── SVG canvas ── */
    const W = 1000, H = 520;

    /* ── Mercator projection centred on Asia ──
         center [100, 26] keeps India, Japan, and Kazakhstan all in frame.
         scale 490 fills the canvas comfortably.                           */
    const proj = d3.geoMercator()
      .center([100, 26])
      .scale(490)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    /* ── Build SVG ── */
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* ── Glow filter — matches homepage voy-glow definition ── */
    const defs   = svg.append('defs');
    const fGlow  = defs.append('filter')
      .attr('id', 'asia-glow')
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

    /* ── Graticule (faint grid lines) ── */
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.032)')
      .attr('stroke-width', '0.4')
      .attr('d', pathGen);

    /* ─────────────────────────────────────────────────
       Two-pass rendering:
         Pass 1 — background (all Asian countries, dimmed, no events)
         Pass 2 — active countries (lit, hover + click)
       Active paths are drawn on top so glow never hides behind bg.
    ───────────────────────────────────────────────── */
    const activePaths = {};   /* iso3 → d3 selection of the visible path */

    /* ── PASS 1: background countries ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !ASIA_SET.has(iso3) || ACTIVE_COUNTRIES[iso3]) return;

      svg.append('path')
        .datum(topojson.feature(world, g))
        .attr('d', pathGen)
        .attr('fill', '#0c1626')
        .attr('stroke', '#121d32')
        .attr('stroke-width', '0.5')
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
        .attr('stroke-width', '0.9')
        .attr('stroke-linejoin', 'round')
        .style('transition', 'fill 0.20s ease, filter 0.20s ease');

      activePaths[iso3] = vp;

      /* Country name label at D3-computed centroid */
      const c = pathGen.centroid(feature);
      if (!isNaN(c[0]) && !isNaN(c[1])) {
        svg.append('text')
          .attr('x', c[0])
          .attr('y', c[1] + 4)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', iso3 === 'KAZ' ? '9.5px' : '8.5px')  /* KAZ is large */
          .attr('font-weight', '700')
          .attr('letter-spacing', '1.2px')
          .text(data.name.toUpperCase());
      }

      /* Transparent hit-area on top — keeps events clean over thin borders */
      svg.append('path')
        .datum(feature)
        .attr('d', pathGen)
        .attr('fill', 'transparent')
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter',  ()    => onEnter(iso3, data))
        .on('mousemove',   (ev)  => onMove(ev))
        .on('mouseleave',  ()    => onLeave(iso3))
        .on('click',       ()    => onClick(data));
    });


    /* ═══════════════════════════════════════════════
       TOOLTIP helpers
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

    /* Clamp tooltip inside the map-wrap bounding rect */
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
       PATH style helpers — match homepage glow system
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
       EVENT HANDLERS
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
      /* Brief visual feedback before navigating */
      window.location.href = data.url;
    }

  } /* end buildMap */

})();