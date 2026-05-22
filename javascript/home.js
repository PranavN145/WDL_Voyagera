/* ═══════════════════════════════════════════════════════
   VOYAGERA V2 — home.js
═══════════════════════════════════════════════════════ */

'use strict';

/* ── Smooth scroll utility ── */
function voyScroll(selector, offset = 68) {
  const el = document.querySelector(selector);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}


/* ── Navbar: scroll behaviour ── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const update = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ── Active nav link on scroll ── */
(function initActiveLinks() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const links    = Array.from(document.querySelectorAll('.nav-link[data-section]'));
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(l => l.classList.toggle('active', l.dataset.section === id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
})();


/* ── Mobile hamburger ── */
(function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => menu.classList.remove('open'))
  );
})();


/* ── Scroll buttons ── */
(function initScrollButtons() {
  const heroBtn = document.getElementById('heroBtn');
  if (heroBtn) heroBtn.addEventListener('click', () => voyScroll('#vibe'));

  // Navbar "Explore" and any data-scroll links
  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      voyScroll(el.dataset.scroll);
    });
  });

  // Mobile menu links
  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        voyScroll(href);
      }
    });
  });
})();


/* ── Scroll-reveal (IntersectionObserver) ── */
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
  }, { threshold: 0.1 });

  items.forEach(el => io.observe(el));
})();


/* ── Interactive SVG Map ── */
(function initMap() {
  const regions    = document.querySelectorAll('.map-region');
  const tooltip    = document.getElementById('mapTooltip');
  const regionText = document.getElementById('regionText');
  const mapWrap    = document.querySelector('.map-wrap');

  if (!regions.length || !tooltip || !mapWrap) return;

  let selected = null;

  regions.forEach(region => {
    const name = region.dataset.region || 'Unknown Region';

    /* ── Hover: show tooltip ── */
    region.addEventListener('mouseenter', () => {
      tooltip.textContent = name;      // inner text; CSS ::before adds "→ "
      tooltip.innerHTML = name;        // reset; we rely on CSS ::before for arrow
      tooltip.classList.add('show');
    });

    region.addEventListener('mousemove', e => {
      const rect = mapWrap.getBoundingClientRect();
      let tx = e.clientX - rect.left + 14;
      let ty = e.clientY - rect.top  - 40;

      // Clamp inside wrapper
      const ttW = tooltip.offsetWidth + 24;
      const ttH = tooltip.offsetHeight + 8;
      if (tx + ttW > rect.width)  tx = e.clientX - rect.left - ttW + 14;
      if (ty < 6)                  ty = e.clientY - rect.top  + 22;
      if (ty + ttH > rect.height) ty = e.clientY - rect.top  - ttH;

      tooltip.style.left = `${tx}px`;
      tooltip.style.top  = `${ty}px`;
    });

    region.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    /* ── Click: select ── */
    region.addEventListener('click', () => {
      // Deselect previous
      if (selected && selected !== region) {
        selected.classList.remove('selected');
      }

      if (selected === region) {
        // Toggle off
        region.classList.remove('selected');
        selected = null;
        if (regionText) {
          regionText.textContent = 'Hover a region to explore';
          regionText.classList.remove('active');
        }
      } else {
        region.classList.add('selected');
        selected = region;
        if (regionText) {
          regionText.textContent = name;
          regionText.classList.add('active');
        }
        console.log(`🌍 Region selected: ${name}`);
      }
    });
  });
})();


/* ── Hero floating cards: pause animation on hover ── */
(function initCardHover() {
  document.querySelectorAll('.fcard').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.animationPlayState = 'paused';
    });
    card.addEventListener('mouseleave', () => {
      card.style.animationPlayState = 'running';
    });
  });
})();


/* ═══════════════════════════════════════════════════════
   D3 WORLD MAP — merged regions (topojson.merge approach)
   Replaces previous per-country approach.
   All other JS above is untouched.
═══════════════════════════════════════════════════════ */

(function initD3Map() {

  /* ── Region definitions (ISO-3 codes + Voyagera theme colours) ── */
  const REGIONS = {
    'North America':   { codes: ['USA','CAN','GRL'], label: { x: 0.145, y: 0.26 } },
    'Central America': { codes: ['MEX','GTM','BLZ','HND','SLV','NIC','CRI','PAN',
                                  'CUB','JAM','HTI','DOM','TTO','BRB','LCA','VCT',
                                  'GRD','ATG','DMA','KNA','BHS','PRI'],
                         label: { x: 0.185, y: 0.43 } },
    'South America':   { codes: ['BRA','ARG','CHL','COL','PER','VEN','ECU','BOL',
                                  'PRY','URY','GUY','SUR','GUF'],
                         label: { x: 0.26,  y: 0.66 } },
    'Europe':          { codes: ['RUS','DEU','FRA','GBR','ITA','ESP','POL','UKR',
                                  'SWE','NOR','FIN','DNK','NLD','BEL','CHE','AUT',
                                  'PRT','CZE','HUN','ROU','BGR','GRC','SRB','HRV',
                                  'SVK','SVN','LTU','LVA','EST','BLR','MDA','MKD',
                                  'ALB','BIH','MNE','LUX','ISL','IRL','MLT','CYP',
                                  'AND','LIE','SMR','MCO','VAT','ARM','GEO'],
                         label: { x: 0.49,  y: 0.21 } },
    'Africa':          { codes: ['DZA','AGO','BEN','BWA','BFA','BDI','CPV','CMR',
                                  'CAF','TCD','COM','COD','COG','CIV','DJI','EGY',
                                  'GNQ','ERI','SWZ','ETH','GAB','GMB','GHA','GIN',
                                  'GNB','KEN','LSO','LBR','LBY','MDG','MWI','MLI',
                                  'MRT','MUS','MAR','MOZ','NAM','NER','NGA','RWA',
                                  'STP','SEN','SLE','SOM','ZAF','SSD','SDN','TZA',
                                  'TGO','TUN','UGA','ZMB','ZWE'],
                         label: { x: 0.49,  y: 0.59 } },
    'Middle East':     { codes: ['SAU','IRN','IRQ','TUR','YEM','SYR','JOR','ISR',
                                  'LBN','ARE','OMN','KWT','QAT','BHR','PSE','AZE'],
                         label: { x: 0.585, y: 0.39 } },
    'Asia':            { codes: ['CHN','JPN','KOR','PRK','MNG','IND','PAK','BGD',
                                  'NPL','LKA','BTN','AFG','KAZ','UZB','TKM','KGZ',
                                  'TJK','IDN','PHL','VNM','THA','MYS','MMR','KHM',
                                  'LAO','SGP','BRN','TLS','TWN'],
                         label: { x: 0.72,  y: 0.30 } },
    'Oceania':         { codes: ['AUS','NZL','PNG','FJI','SLB','VUT','WSM','TON',
                                  'KIR','FSM','PLW','MHL','NRU','TUV'],
                         label: { x: 0.835, y: 0.73 } },
  };

  /* ── Complete numeric ID → ISO3 lookup (world-atlas 110m) ── */
  const ISO_MAP = {
    4:'AFG',8:'ALB',12:'DZA',24:'AGO',32:'ARG',36:'AUS',40:'AUT',50:'BGD',56:'BEL',
    64:'BTN',68:'BOL',72:'BWA',76:'BRA',100:'BGR',104:'MMR',108:'BDI',116:'KHM',
    120:'CMR',124:'CAN',132:'CPV',140:'CAF',144:'LKA',148:'TCD',152:'CHL',156:'CHN',
    170:'COL',174:'COM',178:'COG',180:'COD',188:'CRI',191:'HRV',192:'CUB',196:'CYP',
    203:'CZE',204:'BEN',208:'DNK',214:'DOM',218:'ECU',818:'EGY',222:'SLV',226:'GNQ',
    231:'ETH',232:'ERI',246:'FIN',250:'FRA',266:'GAB',270:'GMB',276:'DEU',288:'GHA',
    296:'KIR',304:'GRL',308:'GRD',320:'GTM',324:'GIN',332:'HTI',340:'HND',348:'HUN',
    356:'IND',360:'IDN',364:'IRN',368:'IRQ',372:'IRL',376:'ISR',380:'ITA',384:'CIV',
    388:'JAM',392:'JPN',398:'KAZ',400:'JOR',404:'KEN',408:'PRK',410:'KOR',414:'KWT',
    418:'LAO',422:'LBN',426:'LSO',428:'LVA',430:'LBR',434:'LBY',440:'LTU',442:'LUX',
    450:'MDG',454:'MWI',458:'MYS',466:'MLI',478:'MRT',480:'MUS',484:'MEX',496:'MNG',
    504:'MAR',508:'MOZ',516:'NAM',524:'NPL',528:'NLD',558:'NIC',562:'NER',566:'NGA',
    578:'NOR',583:'FSM',584:'MHL',585:'PLW',586:'PAK',591:'PAN',598:'PNG',600:'PRY',
    604:'PER',608:'PHL',616:'POL',620:'PRT',624:'GNB',626:'TLS',630:'PRI',634:'QAT',
    642:'ROU',643:'RUS',646:'RWA',678:'STP',682:'SAU',686:'SEN',694:'SLE',703:'SVK',
    705:'SVN',706:'SOM',710:'ZAF',716:'ZWE',724:'ESP',728:'SSD',729:'SDN',740:'SUR',
    748:'SWZ',752:'SWE',756:'CHE',760:'SYR',762:'TJK',764:'THA',768:'TGO',776:'TON',
    780:'TTO',784:'ARE',788:'TUN',792:'TUR',795:'TKM',798:'TUV',800:'UGA',804:'UKR',
    826:'GBR',834:'TZA',840:'USA',854:'BFA',858:'URY',860:'UZB',862:'VEN',704:'VNM',
    882:'WSM',887:'YEM',894:'ZMB',
    28:'ATG',44:'BHS',52:'BRB',84:'BLZ',90:'SLB',212:'DMA',242:'FJI',268:'GEO',
    520:'NRU',548:'VUT',659:'KNA',662:'LCA',670:'VCT',51:'ARM',31:'AZE',417:'KGZ',
    275:'PSE'
  };

  /* iso3 → region name */
  const isoToRegion = {};
  Object.entries(REGIONS).forEach(([rName, data]) => {
    data.codes.forEach(c => { isoToRegion[c] = rName; });
  });

  /* ── DOM refs ── */
  const container  = document.getElementById('d3-map-container');
  const tooltip    = document.getElementById('mapTooltip');
  const mttName    = document.getElementById('mttName');
  const regionText = document.getElementById('regionText');
  const mapWrap    = document.querySelector('.map-wrap');

  if (!container) return;

  let activeRegion   = null;
  let selectedRegion = null;

  /* ── Build map ── */
  async function buildMap() {
    let world;
    try {
      world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    } catch (e) {
      console.warn('Voyagera: failed to load world atlas.', e);
      return;
    }

    const W = 960, H = 500;

    const proj = d3.geoNaturalEarth1()
      .scale(153)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(proj);

    /* Create SVG */
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    /* SVG filters */
    const defs = svg.append('defs');

    /* Glow filter */
    const fGlow = defs.append('filter').attr('id', 'voy-glow').attr('x','-30%').attr('y','-30%').attr('width','160%').attr('height','160%');
    fGlow.append('feGaussianBlur').attr('stdDeviation','5').attr('result','blur');
    const fm = fGlow.append('feMerge');
    fm.append('feMergeNode').attr('in','blur');
    fm.append('feMergeNode').attr('in','SourceGraphic');

    /* Ocean background */
    svg.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', '#080e1c');

    /* Sphere (ocean shape) */
    svg.append('path')
      .datum({ type: 'Sphere' })
      .attr('fill', '#0a1220')
      .attr('d', pathGen);

    /* Graticule */
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.04)')
      .attr('stroke-width', '0.35')
      .attr('d', pathGen);

    /* ── Group geometries by region ── */
    const regionGeoms = {};
    Object.keys(REGIONS).forEach(r => { regionGeoms[r] = []; });

    world.objects.countries.geometries.forEach(g => {
      const iso    = ISO_MAP[parseInt(g.id)];
      const region = iso ? isoToRegion[iso] : null;
      if (region) regionGeoms[region].push(g);
    });

    /* ── Draw each region as a single merged shape ── */
    const regionPaths = {};   // regionName → d3 selection

    Object.entries(regionGeoms).forEach(([rName, geoms]) => {
      if (!geoms.length) return;
      const merged = topojson.merge(world, geoms);

      const rPath = svg.append('path')
        .attr('class', 'voy-region')
        .attr('data-region', rName)
        .attr('d', pathGen(merged))
        .attr('fill', '#1a2845')
        .attr('stroke', '#0b1530')
        .attr('stroke-width', '0.6')
        .attr('stroke-linejoin', 'round')
        .style('cursor', 'pointer')
        .style('transition', 'fill 0.22s ease, filter 0.22s ease');

      regionPaths[rName] = rPath;

      /* Transparent hit area on top for clean events */
      svg.append('path')
        .attr('d', pathGen(merged))
        .attr('fill', 'transparent')
        .attr('stroke', 'none')
        .attr('data-region', rName)
        .style('cursor', 'pointer')
        .on('mousemove',  (ev) => onMouseMove(ev, rName))
        .on('mouseleave', ()   => onMouseLeave())
        .on('click',      (ev) => onClick(ev, rName));
    });

    /* ── Region labels ── */
    Object.entries(REGIONS).forEach(([rName, data]) => {
      const lx = data.label.x * W;
      const ly = data.label.y * H;

      svg.append('circle')
        .attr('cx', lx - 7).attr('cy', ly - 1.5)
        .attr('r', 1.5)
        .attr('fill', 'rgba(255,255,255,0.25)')
        .attr('pointer-events', 'none');

      svg.append('text')
        .attr('x', lx).attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('pointer-events', 'none')
        .attr('fill', 'rgba(255,255,255,0.28)')
        .attr('font-family', "'Barlow Condensed', sans-serif")
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('letter-spacing', '1.4px')
        .attr('text-transform', 'uppercase')
        .text(rName.toUpperCase());
    });

    /* ── Helpers ── */
    function setRegionStyle(rName, state) {
      const p = regionPaths[rName];
      if (!p) return;
      if (state === 'default') {
        p.attr('fill', '#1a2845')
         .style('filter', 'none')
         .style('opacity', '1');
      } else if (state === 'lit') {
        p.attr('fill', '#2a5599')
         .style('filter', 'drop-shadow(0 0 6px rgba(0,200,255,0.55)) drop-shadow(0 0 16px rgba(0,200,255,0.28))')
         .style('opacity', '1');
      } else if (state === 'selected') {
        p.attr('fill', '#1e447f')
         .style('filter', 'drop-shadow(0 0 9px rgba(0,200,255,0.75)) drop-shadow(0 0 24px rgba(0,200,255,0.4))')
         .style('opacity', '1');
      } else if (state === 'dimmed') {
        p.attr('fill', '#0d1520')
         .style('filter', 'none')
         .style('opacity', '0.35');
      }
    }

    function applyHighlight(hoveredName) {
      Object.keys(regionPaths).forEach(rName => {
        if (rName === selectedRegion) {
          setRegionStyle(rName, 'selected');
        } else if (hoveredName && rName === hoveredName) {
          setRegionStyle(rName, 'lit');
        } else if (hoveredName) {
          setRegionStyle(rName, 'dimmed');
        } else {
          setRegionStyle(rName, 'default');
        }
      });
    }

    function clearHighlight() {
      Object.keys(regionPaths).forEach(rName => {
        if (rName === selectedRegion) setRegionStyle(rName, 'selected');
        else setRegionStyle(rName, 'default');
      });
    }

    /* ── Event handlers ── */
    function onMouseMove(event, rName) {
      /* Tooltip */
      if (mttName) mttName.textContent = rName;
      if (tooltip) {
        tooltip.classList.add('d3-tt-visible');
        const wRect = mapWrap.getBoundingClientRect();
        let tx = event.clientX - wRect.left + 14;
        let ty = event.clientY - wRect.top  - 42;
        const ttW = tooltip.offsetWidth  + 20;
        const ttH = tooltip.offsetHeight + 10;
        if (tx + ttW > wRect.width)  tx = event.clientX - wRect.left - ttW;
        if (ty < 4)                  ty = event.clientY - wRect.top  + 20;
        if (ty + ttH > wRect.height) ty = event.clientY - wRect.top  - ttH - 4;
        tooltip.style.left = `${tx}px`;
        tooltip.style.top  = `${ty}px`;
      }

      /* Footer bar */
      if (regionText) {
        regionText.textContent = rName;
        regionText.classList.add('active');
      }

      /* Highlight */
      if (activeRegion !== rName) {
        activeRegion = rName;
        applyHighlight(rName);
      }
    }

    function onMouseLeave() {
      if (tooltip) tooltip.classList.remove('d3-tt-visible');
      activeRegion = null;

      if (selectedRegion) {
        applyHighlight(null);
        if (regionText) regionText.textContent = selectedRegion;
      } else {
        clearHighlight();
        if (regionText) {
          regionText.textContent = 'Hover a region to explore';
          regionText.classList.remove('active');
        }
      }
    }

    const REGION_PAGES = {
      'Asia': 'asia.html',
      'Africa': 'africa.html',
      'Europe': 'europe.html',
      'South America': 's_america.html',
      'North America': 'n_america.html',
      'Central America': 'c_america.html',
      'Oceania': 'oceania.html',
      'Middle East': 'middle_east.html',
    };

    function onClick(event, rName) {
      if (selectedRegion === rName) {
        /* Deselect */
        selectedRegion = null;
        applyHighlight(activeRegion);
        if (regionText) {
          regionText.textContent = activeRegion || 'Hover a region to explore';
          if (!activeRegion) regionText.classList.remove('active');
        }
        console.log('🌍 Region deselected');
      } else {
        selectedRegion = rName;
        applyHighlight(activeRegion);
        if (regionText) {
          regionText.textContent = rName;
          regionText.classList.add('active');
        }
        console.log(`🌍 Region selected: ${rName}`);
        if (REGION_PAGES[rName]) window.location.href = REGION_PAGES[rName];
      }
    }
  }

  /* Wait for D3 + TopoJSON CDN scripts */
  function waitForLibs(cb) {
    if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') cb();
    else setTimeout(() => waitForLibs(cb), 80);
  }

  waitForLibs(buildMap);
})();