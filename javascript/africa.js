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
  ZAF: { name: 'South Africa', flag: '🇿🇦', tags: 'Safari · Culture · Coastlines', url: 'south_africa.html' },
  NGA: { name: 'Nigeria',      flag: '🇳🇬', tags: 'Music · Food · Megacity',       url: 'nigeria.html'      },
  CMR: { name: 'Cameroon',     flag: '🇨🇲', tags: 'Rainforest · Wildlife · Coast',  url: 'cameroon.html'     },
};


/* ── Numeric ID → ISO 3 for African countries on world-atlas 110m ── */
const ISO_MAP = {
  12:'DZA',  24:'AGO',  72:'BWA',  108:'BDI', 120:'CMR', 132:'CPV',
  140:'CAF', 148:'TCD', 174:'COM', 178:'COG', 180:'COD', 204:'BEN',
  226:'GNQ', 231:'ETH', 232:'ERI', 266:'GAB', 270:'GMB', 288:'GHA',
  324:'GIN', 384:'CIV', 404:'KEN', 426:'LSO', 430:'LBR', 434:'LBY',
  450:'MDG', 454:'MWI', 466:'MLI', 478:'MRT', 504:'MAR', 508:'MOZ',
  516:'NAM', 562:'NER', 566:'NGA', 624:'GNB', 646:'RWA', 678:'STP',
  686:'SEN', 694:'SLE', 706:'SOM', 710:'ZAF', 716:'ZWE', 728:'SSD',
  729:'SDN', 748:'SWZ', 768:'TGO', 788:'TUN', 800:'UGA', 818:'EGY',
  834:'TZA', 854:'BFA', 894:'ZMB',
};

/* ── Full set of African ISO3 codes to render (active + background) ── */
const AFRICA_SET = new Set([
  'DZA','AGO','BWA','BDI','CMR','CPV','CAF','TCD','COM','COG','COD','BEN',
  'ETH','ERI','GAB','GMB','GHA','GIN','GNB','KEN','LSO','LBR','LBY','MDG',
  'MWI','MLI','MRT','MAR','MOZ','NAM','NER','NGA','RWA','STP','SEN',
  'SLE','SOM','ZAF','SSD','SDN','TZA','TGO','TUN','UGA','ZMB','ZWE','CIV',
  'BFA','GNQ','SWZ','EGY',
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
    southafrica:'southafrica.html',
    nigeria:    'nigeria.html',
    cameroon:   'cameroon.html',
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
   5. D3 INTERACTIVE AFRICA MAP
═══════════════════════════════════════════════════════ */
(function initAfricaMap() {

  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  async function buildMap() {

    /* ── DOM refs — IDs mirror the africa.html map section ── */
    const container  = document.getElementById('africa-map-container');
    const tooltip    = document.getElementById('africaTooltip');
    const mttName    = document.getElementById('africaMttName');
    const mttSub     = document.getElementById('africaMttSub');
    const regionText = document.getElementById('africaRegionText');
    const mapWrap    = document.querySelector('#africa-map-section .map-wrap');

    if (!container) return;

    let world;
    try {
      world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    } catch (err) {
      console.warn('Voyagera Africa: could not load world atlas.', err);
      return;
    }

    /* ── SVG canvas ── */
    const W = 800, H = 820;

    /*
     * Mercator projection centred on Africa.
     *   center [20, 2]  — 20°E / 2°N is roughly the geographic midpoint
     *   scale 480       — fills the canvas without clipping Madagascar or Morocco
     */
    const proj = d3.geoMercator()
      .center([20, 2])
      .scale(480)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* ── Glow filter ── */
    const defs  = svg.append('defs');
    const fGlow = defs.append('filter')
      .attr('id', 'africa-glow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    fGlow.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur');
    const fMerge = fGlow.append('feMerge');
    fMerge.append('feMergeNode').attr('in', 'blur');
    fMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /* ── Ocean background ── */
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#070d1c');

    /* ── Graticule ── */
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.032)')
      .attr('stroke-width', '0.4')
      .attr('d', pathGen);

    const activePaths = {};

    /* ── Pass 1: background countries (dimmed, no events) ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !AFRICA_SET.has(iso3) || ACTIVE_COUNTRIES[iso3]) return;

      svg.append('path')
        .datum(topojson.feature(world, g))
        .attr('d', pathGen)
        .attr('fill', '#0c1626')
        .attr('stroke', '#121d32')
        .attr('stroke-width', '0.5')
        .attr('stroke-linejoin', 'round')
        .style('pointer-events', 'none');
    });

    /* ── Pass 2: active countries (lit, interactive) ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !ACTIVE_COUNTRIES[iso3]) return;

      const data    = ACTIVE_COUNTRIES[iso3];
      const feature = topojson.feature(world, g);

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
        /* Nudge South Africa label up slightly so it clears the Lesotho enclave */
        const ly = iso3 === 'ZAF' ? c[1] - 6 : c[1] + 4;
        svg.append('text')
          .attr('x', c[0])
          .attr('y', ly)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.30)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', '8.5px')
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
       TOOLTIP helpers (identical pattern to asia.js)
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
       PATH style helpers (mirrors asia.js glow system)
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
      p.attr('fill', '#1a2845').style('filter', 'none');
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
      window.location.href = data.url;
    }

  } /* end buildMap */

})();
