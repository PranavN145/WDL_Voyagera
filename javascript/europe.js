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
  RUS: { name: 'Russia',  flag: '🇷🇺', url: 'russia.html'  },
  DEU: { name: 'Germany', flag: '🇩🇪',    url: 'germany.html' },
  FRA: { name: 'France',  flag: '🇫🇷',      url: 'france.html'  },
  GBR: { name: 'UK',      flag: '🇬🇧',       url: 'uk.html'      },
  ESP: { name: 'Spain',   flag: '🇪🇸',           url: 'spain.html'   },
};



/* ── Numeric ID → ISO 3 for every country that appears in Europe + context ── */
const ISO_MAP = {
  8:'ALB',   20:'AND',  40:'AUT',  112:'BLR', 56:'BEL',  70:'BIH',
  100:'BGR', 191:'HRV', 196:'CYP', 203:'CZE', 208:'DNK', 233:'EST',
  246:'FIN', 250:'FRA', 276:'DEU', 300:'GRC', 348:'HUN', 352:'ISL',
  372:'IRL', 380:'ITA', 428:'LVA', 438:'LIE', 440:'LTU', 442:'LUX',
  470:'MLT', 498:'MDA', 492:'MCO', 499:'MNE', 528:'NLD', 578:'NOR',
  616:'POL', 620:'PRT', 642:'ROU', 643:'RUS', 674:'SMR', 688:'SRB',
  703:'SVK', 705:'SVN', 724:'ESP', 752:'SWE', 756:'CHE', 804:'UKR',
  826:'GBR', 807:'MKD', 8:'ALB',  51:'ARM',  31:'AZE',  268:'GEO',
  792:'TUR', 112:'BLR',
};

/* ── Full set of countries to render (active + background context) ── */
const EUROPE_SET = new Set([
  'ALB','AND','AUT','BLR','BEL','BIH','BGR','HRV','CYP','CZE',
  'DNK','EST','FIN','FRA','DEU','GRC','HUN','ISL','IRL','ITA',
  'LVA','LIE','LTU','LUX','MLT','MDA','MCO','MNE','NLD','NOR',
  'POL','PRT','ROU','RUS','SMR','SRB','SVK','SVN','ESP','SWE',
  'CHE','UKR','GBR','MKD','ARM','AZE','GEO','TUR',
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
    russia:      'russia.html',
    germany:      'germany.html',
    france: 'france.html',
    unitedkingdom:  'unitedkingdom.html',
    spain:   'spain.html',
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
(function initEuropeMap() {

  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);

  async function buildMap() {

    /* ── DOM refs ── */
    const container  = document.getElementById('europe-map-container');
    const tooltip    = document.getElementById('europeTooltip');
    const mttName    = document.getElementById('europeMttName');
    const mttSub     = document.getElementById('europeMttSub');
    const regionText = document.getElementById('europeRegionText');
    const mapWrap    = document.querySelector('#europe-map-section .map-wrap');

    if (!container) return;

    /* ── Load world atlas 110m ── */
    let world;
    try {
      world = await d3.json(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      );
    } catch (err) {
      console.warn('Voyagera Europe: could not load world atlas.', err);
      return;
    }

    /* ── SVG canvas ── */
    const W = 1000, H = 560;

    /*
     * Mercator centred on Europe.
     * center [15, 54] puts Western + Eastern Europe + a slice of Russia in frame.
     * scale 700 gives a tight, full-continent view without Russia dominating.
     * Russia will render but be clipped at the right — that's fine and looks great.
     */
    const proj = d3.geoMercator()
      .center([15, 54])
      .scale(700)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    /* ── Build SVG ── */
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* ── Glow filter — matches homepage voy-glow ── */
    const defs  = svg.append('defs');
    const fGlow = defs.append('filter')
      .attr('id', 'europe-glow')
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

    /* ─────────────────────────────────────────────────
       Two-pass rendering:
         Pass 1 — background European countries (dimmed, no events)
         Pass 2 — active countries (lit, hover + click)
    ───────────────────────────────────────────────── */
    const activePaths = {};

    /* ── PASS 1: background countries ── */
    world.objects.countries.geometries.forEach(g => {
      const iso3 = ISO_MAP[parseInt(g.id)];
      if (!iso3 || !EUROPE_SET.has(iso3) || ACTIVE_COUNTRIES[iso3]) return;

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

      /* Country name label at centroid */
      const c = pathGen.centroid(feature);
      if (!isNaN(c[0]) && !isNaN(c[1])) {
        /* Russia centroid lands far east — nudge label westward to stay in-frame */
        const lx = iso3 === 'RUS' ? Math.min(c[0], W - 60) : c[0];
        const ly = iso3 === 'RUS' ? Math.max(c[1], 60) : c[1];

        svg.append('text')
          .attr('x', lx)
          .attr('y', ly + 4)
          .attr('text-anchor', 'middle')
          .attr('pointer-events', 'none')
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', "'Barlow Condensed', sans-serif")
          .attr('font-size', iso3 === 'RUS' ? '10px' : '7.5px')
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
