
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyW9_bXhkYvmOcDHqAWIhBzOLOZcxID6UqFh6-3GW4XBxZRbtJJn9Cu7iXPG7FMOuG7/exec';

// Set to true to use demo data while setting up Google Sheets
const USE_DEMO_DATA = false;


// ══════════════════════════════════════════════════════════
//  DEMO HOSTS (fallback / development data)
// ══════════════════════════════════════════════════════════
const DEMO_HOSTS = [
  {
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    country: 'India',
    city: 'Jaipur',
    languages: 'Hindi, English, Rajasthani',
    interests: 'Photography, Street Food, Architecture',
    bio: 'Tea farmer by day, storyteller by night. I live in the old walled city of Jaipur — my rooftop has the best view of Amber Fort you will ever find. I love sharing chai and conversations with curious travelers.',
    stayType: 'Private Room',
    availability: 'Always Available',
    philosophy: 'Every stranger is a friend I haven\'t met yet. Travel should leave a mark — on the road, and on your soul.',
    // image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
  },
  {
    name: 'Yuki Tanaka',
    email: 'yuki@example.com',
    country: 'Japan',
    city: 'Kyoto',
    languages: 'Japanese, English',
    interests: 'Tea Ceremony, Zen Buddhism, Calligraphy',
    bio: 'I live near the bamboo grove in Arashiyama. I can show you Kyoto that tourists never see — ancient temples at dawn, hidden sake bars, neighborhood shrines. My home is small but full of warmth.',
    stayType: 'Couch / Living Space',
    availability: 'Weekends Only',
    philosophy: 'Ichi-go ichi-e — each meeting is a once-in-a-lifetime treasure. Slow travel, deep connections.',
    // image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&q=80'
  },
  {
    name: 'Sofia Ricci',
    email: 'sofia@example.com',
    country: 'Italy',
    city: 'Florence',
    languages: 'Italian, English, French',
    interests: 'Renaissance Art, Wine, Cooking',
    bio: 'Art history professor who lives 10 minutes from the Uffizi. I host dinners every Friday — homemade pasta, local Chianti, and conversations that go until midnight. My apartment has original 15th-century frescoes.',
    stayType: 'Shared Room',
    availability: 'By Request',
    philosophy: 'La dolce vita isn\'t a cliché — it\'s a practice. Slow down, eat well, see beauty in everything.',
    // image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80'
  },
  {
    name: 'Amara Diallo',
    email: 'amara@example.com',
    country: 'India',
    city: 'Mumbai',
    languages: 'Hindi, English, Marathi',
    interests: 'Bollywood, Street Art, Local Train Culture',
    bio: 'Born and raised in Dharavi — the most misunderstood neighborhood in the world. I\'ll show you the real Mumbai: the tiffin culture, the dabbawalas, the sea face at sunset, the midnight vada pav stalls.',
    stayType: 'Shared Room',
    availability: 'Weekends Only',
    philosophy: 'Mumbai doesn\'t sleep, but it does reveal itself — one local train ride at a time.',
    // image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  }
];

let allHosts = [];
let currentHostForRequest = null;

const hostsGrid      = document.getElementById('hostsGrid');
const hostsLoading   = document.getElementById('hostsLoading');
const hostsEmpty     = document.getElementById('hostsEmpty');
const filterInput    = document.getElementById('filterInput');
const filterCountry  = document.getElementById('filterCountry');
const refreshBtn     = document.getElementById('refreshHostsBtn');

// Modals
const profileModal   = document.getElementById('profileModal');
const requestModal   = document.getElementById('requestModal');
const hostModal      = document.getElementById('hostModal');

// Profile modal fields
const pmImg          = document.getElementById('pmImg');
const pmName         = document.getElementById('pmName');
const pmLocation     = document.getElementById('pmLocation');
const pmTags         = document.getElementById('pmTags');
const pmBio          = document.getElementById('pmBio');
const pmLangs        = document.getElementById('pmLangs');
const pmStayType     = document.getElementById('pmStayType');
const pmPhilosophy   = document.getElementById('pmPhilosophy');
const pmAvailability = document.getElementById('pmAvailability');


// ══════════════════════════════════════════════════════════
//  NAVBAR SCROLL
// ══════════════════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });


// ══════════════════════════════════════════════════════════
//  HAMBURGER
// ══════════════════════════════════════════════════════════
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});


// ══════════════════════════════════════════════════════════
//  SCROLL REVEAL
// ══════════════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ══════════════════════════════════════════════════════════
//  SMOOTH SCROLL BUTTONS
// ══════════════════════════════════════════════════════════
document.getElementById('exploreHostsBtn').addEventListener('click', () => {
  document.getElementById('hosts-section').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('ctaExploreBtn').addEventListener('click', () => {
  document.getElementById('hosts-section').scrollIntoView({ behavior: 'smooth' });
});


// ══════════════════════════════════════════════════════════
//  FETCH HOSTS FROM GOOGLE SHEETS (or use demo data)
// ══════════════════════════════════════════════════════════
async function fetchHosts() {
  showLoading(true);

  if (USE_DEMO_DATA) {
    // Simulate network delay for realistic feel
    await new Promise(r => setTimeout(r, 800));
    allHosts = DEMO_HOSTS;
    renderHosts(allHosts);
    showLoading(false);
    return;
  }

  try {
    const res  = await fetch(`${APPS_SCRIPT_URL}?action=getHosts`, { mode: 'cors' });
    const data = await res.json();

    if (data.success && Array.isArray(data.hosts) && data.hosts.length > 0) {
      // Merge fetched hosts with demo hosts (demo always shown first)
      allHosts = [...DEMO_HOSTS, ...data.hosts.map(normalizeSheetHost)];
    } else {
      allHosts = DEMO_HOSTS;
    }
    renderHosts(allHosts);
  } catch (err) {
    console.warn('[Couchsurfing] Could not fetch from Google Sheets. Falling back to demo data.', err);
    allHosts = DEMO_HOSTS;
    renderHosts(allHosts);
  }

  showLoading(false);
}

/** Normalize a row from Google Sheets into our host object shape */
function normalizeSheetHost(row) {
  return {
    name:         row['Host Name']  || row.name        || 'Community Host',
    email:        row['Email']      || row.email        || '',
    country:      row['Country']    || row.country      || '',
    city:         row['City']       || row.city         || '',
    languages:    row['Languages']  || row.languages    || '',
    interests:    row['Interests']  || row.interests    || '',
    bio:          row['Bio']        || row.bio          || '',
    stayType:     row['Stay Type']  || row.stayType     || '',
    availability: row['Availability'] || row.availability || '',
    philosophy:   row['Philosophy'] || row.philosophy   || 'Open to every kind of traveler.',
    image:        row['Image URL']  || row.image        || getRandomAvatar()
  };
}

function getRandomAvatar() {
  const ids = ['1506794778202', '1547425260760', '1500648767791', '1507003211169', '1438761681033'];
  const id  = ids[Math.floor(Math.random() * ids.length)];
  return `../images/avatar.avif`;
}

function showLoading(show) {
  hostsLoading.style.display = show ? 'flex' : 'none';
}


// ══════════════════════════════════════════════════════════
//  RENDER HOST CARDS
// ══════════════════════════════════════════════════════════
function renderHosts(hosts) {
  hostsGrid.innerHTML = '';

  if (!hosts || hosts.length === 0) {
    hostsEmpty.style.display = 'block';
    return;
  }

  hostsEmpty.style.display = 'none';

  hosts.forEach((host, idx) => {
    const card = createHostCard(host, idx);
    hostsGrid.appendChild(card);
  });
}

function createHostCard(host, idx) {
  const card = document.createElement('div');
  card.className = 'host-card';
  card.style.animationDelay = `${idx * 0.06}s`;

  const tags = (host.interests || '')
    .split(',')
    .slice(0, 3)
    .map(t => `<span class="host-tag">${t.trim()}</span>`)
    .join('');

  const fallbackImg = '../images/avatar.avif';

  card.innerHTML = `
    <div class="host-card-img-wrap">
      <img
        class="host-card-img"
        src="${escHtml(host.image || fallbackImg)}"
        alt="${escHtml(host.name)}"
        loading="lazy"
        onerror="this.src='${fallbackImg}'"
      />
      <div class="host-card-img-overlay"></div>
      <span class="host-card-country-badge">${escHtml(host.country)}</span>
    </div>
    <div class="host-card-body">
      <h3 class="host-card-name">${escHtml(host.name)}</h3>
      <p class="host-card-location">${escHtml(host.city)}, ${escHtml(host.country)}</p>
      <div class="host-card-tags">${tags}</div>
      <p class="host-card-bio">${escHtml(host.bio)}</p>
      <div class="host-card-actions">
        <button class="hc-btn-view" data-idx="${idx}">View Profile</button>
        <button class="hc-btn-request" data-idx="${idx}"><span>Request Stay</span></button>
      </div>
    </div>
  `;

  card.querySelector('.hc-btn-view').addEventListener('click', () => openProfileModal(host));
  card.querySelector('.hc-btn-request').addEventListener('click', () => openRequestModal(host));

  return card;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// ══════════════════════════════════════════════════════════
//  FILTERING
// ══════════════════════════════════════════════════════════
function applyFilters() {
  const query   = filterInput.value.toLowerCase().trim();
  const country = filterCountry.value;

  const filtered = allHosts.filter(host => {
    const matchText = !query || [host.name, host.city, host.country, host.interests, host.bio]
      .some(field => (field || '').toLowerCase().includes(query));
    const matchCountry = !country || host.country === country;
    return matchText && matchCountry;
  });

  renderHosts(filtered);
}

filterInput.addEventListener('input', applyFilters);
filterCountry.addEventListener('change', applyFilters);
refreshBtn.addEventListener('click', fetchHosts);


// ══════════════════════════════════════════════════════════
//  PROFILE MODAL
// ══════════════════════════════════════════════════════════
function openProfileModal(host) {
  const fallbackImg = '../images/avatar.avif';
  pmImg.src         = host.image || fallbackImg;
  pmImg.onerror     = () => { pmImg.src = fallbackImg; };
  pmImg.alt         = host.name;
  pmName.textContent      = host.name;
  pmLocation.textContent  = `${host.city}, ${host.country}`;
  pmBio.textContent       = host.bio;
  pmLangs.textContent     = host.languages || 'Not specified';
  pmStayType.textContent  = host.stayType  || 'Not specified';
  pmPhilosophy.textContent = host.philosophy || 'Open to every kind of traveler.';
  pmAvailability.textContent = host.availability || 'By Request';

  pmTags.innerHTML = (host.interests || '')
    .split(',')
    .map(t => `<span class="host-tag">${escHtml(t.trim())}</span>`)
    .join('');

  // Wire up the modal's request stay button
  document.getElementById('pmRequestBtn').onclick = () => {
    closeModal(profileModal);
    openRequestModal(host);
  };

  openModal(profileModal);
}

document.getElementById('closeProfileModal').addEventListener('click', () => closeModal(profileModal));


// ══════════════════════════════════════════════════════════
//  REQUEST STAY MODAL
// ══════════════════════════════════════════════════════════
function openRequestModal(host) {
  currentHostForRequest = host;
  document.getElementById('requestHostName').textContent = host.name;
  document.getElementById('reqHostName').value = host.name;

  // Reset form
  ['reqName','reqCountry','reqDates','reqMessage'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('reqVibe').value = '';
  document.getElementById('reqSuccess').classList.remove('show');
  document.getElementById('reqError').classList.remove('show');

  openModal(requestModal);
}

document.getElementById('closeRequestModal').addEventListener('click', () => closeModal(requestModal));

document.getElementById('submitRequestBtn').addEventListener('click', async () => {
  const name    = document.getElementById('reqName').value.trim();
  const country = document.getElementById('reqCountry').value.trim();
  const dates   = document.getElementById('reqDates').value.trim();
  const vibe    = document.getElementById('reqVibe').value;
  const message = document.getElementById('reqMessage').value.trim();
  const host    = document.getElementById('reqHostName').value;

  if (!name || !country || !dates) {
    showFormError('reqError', 'Please fill in your name, country, and travel dates.');
    return;
  }

  const payload = {
    action:     'submitRequest',
    travelerName:    name,
    travelerCountry: country,
    travelDates:     dates,
    moodVibe:        vibe,
    selectedHost:    host,
    message:         message
  };

  await submitToSheets(payload, 'submitRequestBtn', 'reqSuccess', 'reqError',
    'Stay request submitted successfully.');
});


// ══════════════════════════════════════════════════════════
//  BECOME HOST MODAL
// ══════════════════════════════════════════════════════════
document.getElementById('becomeHostBtn').addEventListener('click', openHostModal);

function openHostModal() {
  // Reset form
  ['hostName','hostEmail','hostCountry','hostCity','hostLangs','hostInterests','hostBio']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('hostStayType').value = '';
  document.getElementById('hostAvailability').value = '';
  document.getElementById('hostSuccess').classList.remove('show');
  document.getElementById('hostError').classList.remove('show');

  openModal(hostModal);
}

document.getElementById('closeHostModal').addEventListener('click', () => closeModal(hostModal));

document.getElementById('submitHostBtn').addEventListener('click', async () => {
  const name         = document.getElementById('hostName').value.trim();
  const email        = document.getElementById('hostEmail').value.trim();
  const country      = document.getElementById('hostCountry').value.trim();
  const city         = document.getElementById('hostCity').value.trim();
  const langs        = document.getElementById('hostLangs').value.trim();
  const interests    = document.getElementById('hostInterests').value.trim();
  const stayType     = document.getElementById('hostStayType').value;
  const availability = document.getElementById('hostAvailability').value;
  const bio          = document.getElementById('hostBio').value.trim();

  if (!name || !email || !country || !city) {
    showFormError('hostError', 'Please fill in your name, email, country, and city.');
    return;
  }

  const payload = {
    action:       'registerHost',
    hostName:     name,
    email,
    country,
    city,
    languages:    langs,
    interests,
    stayType,
    availability,
    bio
  };

  const success = await submitToSheets(payload, 'submitHostBtn', 'hostSuccess', 'hostError',
    'Host registration submitted successfully.');

  if (success) {
    // Add new host locally so it appears immediately without refresh
    const newHost = { name, email, country, city, languages: langs, interests, bio,
      stayType, availability, philosophy: '', image: getRandomAvatar() };
    allHosts.unshift(newHost);
    renderHosts(allHosts);
  }
});


// ══════════════════════════════════════════════════════════
//  GOOGLE SHEETS SUBMISSION
// ══════════════════════════════════════════════════════════
async function submitToSheets(payload, btnId, successId, errorId, successMsg) {
    const btn = document.getElementById(btnId);
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>Sending…</span>';
    btn.disabled = true;
  
    document.getElementById(errorId).classList.remove('show');
    document.getElementById(successId).classList.remove('show');
  
    try {
      const url = APPS_SCRIPT_URL
        + '?payload='
        + encodeURIComponent(JSON.stringify(payload));
  
      const res  = await fetch(url);
      const text = await res.text();
      console.log('Apps Script response:', text);
      const data = JSON.parse(text);
  
      if (data.success) {
        document.getElementById(successId).classList.add('show');
        btn.innerHTML = originalHTML;
        btn.disabled  = false;
        return true;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[Voyagera] Submission error:', err);
      showFormError(errorId, 'Error: ' + err.message);
      btn.innerHTML = originalHTML;
      btn.disabled  = false;
      return false;
    }
  }

function showFormError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}


// ══════════════════════════════════════════════════════════
//  MODAL UTILITIES
// ══════════════════════════════════════════════════════════
function openModal(modal) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Close on overlay click
[profileModal, requestModal, hostModal].forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal);
  });
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    [profileModal, requestModal, hostModal].forEach(closeModal);
  }
});


// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  fetchHosts();
});