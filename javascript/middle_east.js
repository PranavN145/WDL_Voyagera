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
  JOR: { name: 'Jordan',  flag: '🇯🇴', tags: 'Petra · Desert · History',          url: 'jordan.html'  },
  TUR: { name: 'Turkey',  flag: '🇹🇷', tags: 'Istanbul · Culture · Cuisine',       url: 'turkey.html'  },
  ARE: { name: 'UAE',     flag: '🇦🇪', tags: 'Dubai · Luxury · Modern',            url: 'uae.html'     },
  ISR: { name: 'Israel',  flag: '🇮🇱', tags: 'Jerusalem · History · Culture',      url: 'israel.html'  },
};

/* ── Numeric ID → ISO 3 for every country visible in the Middle East viewport ── */
const ISO_MAP = {
  31:'AZE',  51:'ARM',  191:'HRV',  192:'CUB',  196:'CYP',
  268:'GEO', 275:'PSE', 368:'IRQ',  376:'ISR',  400:'JOR',
  414:'KWT', 422:'LBN', 512:'OMN',  634:'QAT',  643:'RUS',
  682:'SAU', 704:'VNM', 760:'SYR',  784:'ARE',  792:'TUR',
  887:'YEM', 48:'BHR',  356:'IND',  364:'IRN',  4:'AFG',
  50:'BGD',  524:'NPL', 586:'PAK',  398:'KAZ',  417:'KGZ',
  762:'TJK', 795:'TKM', 860:'UZB',
  /* European/North African context */
  12:'DZA',  818:'EGY', 434:'LBY',  504:'MAR',  788:'TUN',
  736:'SDN', 729:'SSD',
  /* Balkan/Caucasus */
  8:'ALB', 56:'BEL', 100:'BGR', 250:'FRA', 276:'DEU', 300:'GRC',
  348:'HUN', 380:'ITA', 442:'LUX', 528:'NLD', 616:'POL', 642:'ROU',
  724:'ESP', 804:'UKR', 826:'GBR',
};

/* ── Full set of countries to render (active + background context) ── */
const ME_SET = new Set([
  /* Core Middle East */
  'JOR','TUR','ARE','ISR','SAU','IRN','IRQ','SYR','LBN','OMN',
  'KWT','QAT','BHR','YEM','PSE','AZE','ARM','GEO','CYP',
  /* North Africa for context */
  'EGY','LBY','SDN',
  /* Caucasus / Wider region context */
  'UKR','RUS',
  /* South/Central Asia for eastern border */
  'AFG','PAK','KAZ','TKM','UZB',
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
    jordan:      'jordan.html',
    turkey:      'turkey.html',
    uae : 'uae.html',
    israel:  'israel.html',
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
(function initMEMap() {

  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  async function buildMap() {

    const container  = document.getElementById('me-map-container');
    const tooltip    = document.getElementById('meTooltip');
    const mttName    = document.getElementById('meMttName');
    const mttSub     = document.getElementById('meMttSub');
    const regionText = document.getElementById('meRegionText');
    const mapWrap    = document.querySelector('#me-map-section .map-wrap');

    if (!container) return;

    let world;
    try {
      world = await d3.json(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      );
    } catch (err) {
      console.warn('Voyagera Middle East: could not load world atlas.', err);
      return;
    }

    const W = 1000, H = 560;

    /*
     * Mercator centred on the Middle East.
     * center [38, 28] puts the Arabian Peninsula, Turkey, and the Levant
     * all comfortably in frame.  scale 780 fills the canvas nicely.
     */
    const proj = d3.geoMercator()
      .center([38, 28])
      .scale(780)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* Glow filter — identical to asia.js */
    const defs  = svg.append('defs');
    const fGlow = defs.append('filter')
      .attr('id', 'me-glow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    fGlow.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur');
    const fMerge = fGlow.append('feMerge');
    fMerge.append('feMergeNode').attr('in', 'blur');
    fMerge.append('feMergeNode').attr('in', 'SourceGraphic');

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

    /* PASS 1 — background countries */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !ME_SET.has(iso3) || ACTIVE_COUNTRIES[iso3]) return;

      svg.append('path')
        .datum(topojson.feature(world, g))
        .attr('d', pathGen)
        .attr('fill', '#0c1626')
        .attr('stroke', '#121d32')
        .attr('stroke-width', '0.5')
        .attr('stroke-linejoin', 'round')
        .style('pointer-events', 'none');
    });

    /* PASS 2 — active countries */
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

      /* Centroid label */
      const c = pathGen.centroid(feature);
      if (!isNaN(c[0]) && !isNaN(c[1])) {
        /* Turkey is wide — nudge label to centroid so it stays on land */
        const labelSize = iso3 === 'TUR' ? '8px' : iso3 === 'SAU' ? '9.5px' : '8.5px';
        svg.append('text')
          .attr('x', c[0])
          .attr('y', c[1] + 4)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', labelSize)
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
        .on('mouseenter',  ()    => onEnter(iso3, data))
        .on('mousemove',   (ev)  => onMove(ev))
        .on('mouseleave',  ()    => onLeave(iso3))
        .on('click',       ()    => onClick(data));
    });

    /* ── Tooltip helpers ── */
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

    /* ── Style helpers ── */
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

    function onMove(event) { positionTooltip(event); }

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

  }

})();
