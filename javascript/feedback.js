
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxR1RpTgrYIgRbkHxCuVEQ4xRMJhP0C1wZ-nLSSYXjYAaDFw36USXCq7mqvVjh9xab_tg/exec';


/* ───────────────────────────────────────────────────────────────
   STATE
─────────────────────────────────────────────────────────────── */
let selectedMood   = '';
let selectedRating = 0;


/* ═══════════════════════════════════════════════════════════════
   NAVBAR — scroll state + hamburger (mirrors home.js behaviour)
═══════════════════════════════════════════════════════════════ */
const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});


/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL — same IntersectionObserver pattern as home.js
═══════════════════════════════════════════════════════════════ */
const revealEls = document.querySelectorAll('.reveal');
const revealIO  = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealIO.observe(el));


/* ═══════════════════════════════════════════════════════════════
   MOOD CARDS
═══════════════════════════════════════════════════════════════ */
const moodCards = document.querySelectorAll('.mood-card');

moodCards.forEach(card => {
  card.addEventListener('click',   () => selectMood(card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectMood(card);
    }
  });
});

function selectMood(card) {
  moodCards.forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-pressed', 'false');
  });
  card.classList.add('active');
  card.setAttribute('aria-pressed', 'true');
  selectedMood = card.dataset.mood;
  hideError('moodError');
}


/* ═══════════════════════════════════════════════════════════════
   STAR RATING
═══════════════════════════════════════════════════════════════ */
const stars     = document.querySelectorAll('.star');
const starLabel = document.getElementById('starLabel');

const ratingLabels = {
  1: 'Not quite there',
  2: 'Getting somewhere',
  3: 'Memorable',
  4: 'Brilliant journey',
  5: 'Life-changing'
};

stars.forEach(star => {
  const val = Number(star.dataset.val);

  star.addEventListener('mouseenter', () => highlightStars(val));
  star.addEventListener('mouseleave', () => resetHighlight());
  star.addEventListener('click',      () => selectRating(val));
  star.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectRating(val);
    }
    /* Allow arrow key navigation */
    if (e.key === 'ArrowRight' && val < 5) {
      stars[val].focus();       /* val is 0-indexed here: next star = stars[val] */
    }
    if (e.key === 'ArrowLeft' && val > 1) {
      stars[val - 2].focus();   /* previous star */
    }
  });
});

function highlightStars(upTo) {
  stars.forEach(s => {
    const v = Number(s.dataset.val);
    s.classList.toggle('hovered',  v <= upTo);
    s.classList.remove('selected');   /* temporarily clear for hover preview */
  });
  starLabel.textContent = ratingLabels[upTo] || '';
}

function resetHighlight() {
  stars.forEach(s => {
    const v = Number(s.dataset.val);
    s.classList.remove('hovered');
    s.classList.toggle('selected', v <= selectedRating);
  });
  starLabel.textContent = selectedRating
    ? ratingLabels[selectedRating]
    : 'Tap a star to rate';
}

function selectRating(val) {
  selectedRating = val;
  stars.forEach(s => {
    const v = Number(s.dataset.val);
    s.classList.remove('hovered');
    s.classList.toggle('selected', v <= val);
  });
  starLabel.textContent = ratingLabels[val];
  hideError('ratingError');
}


/* ═══════════════════════════════════════════════════════════════
   VALIDATION HELPERS
═══════════════════════════════════════════════════════════════ */
function showError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('visible');
}

function validate() {
  let valid = true;

  if (!selectedMood) {
    showError('moodError');
    valid = false;
  } else {
    hideError('moodError');
  }

  if (!selectedRating) {
    showError('ratingError');
    valid = false;
  } else {
    hideError('ratingError');
  }

  const inspiration = document.getElementById('inspiration').value.trim();
  const improvement = document.getElementById('improvement').value.trim();
  if (!inspiration && !improvement) {
    showError('storyError');
    valid = false;
  } else {
    hideError('storyError');
  }

  /* Scroll to first error */
  if (!valid) {
    const firstError = document.querySelector('.fb-error.visible');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return valid;
}


/* ═══════════════════════════════════════════════════════════════
   GOOGLE SHEETS — fire-and-forget POST
═══════════════════════════════════════════════════════════════ */
async function submitToSheets(data) {
  if (!SHEET_URL || SHEET_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    /* URL not configured — log data for development and move on */
    console.warn('[VOYAGERA] Google Sheets URL not set. Feedback data:', data);
    return;
  }

  /* mode:'no-cors' is required for Apps Script — response will be opaque
     but the row IS appended to the sheet successfully.                   */
  await fetch(SHEET_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  });
}


/* ═══════════════════════════════════════════════════════════════
   SUBMIT HANDLER
═══════════════════════════════════════════════════════════════ */
const submitBtn = document.getElementById('submitBtn');
submitBtn.addEventListener('click', handleSubmit);

async function handleSubmit() {
  if (!validate()) return;

  /* Build structured feedback object */
  const feedbackData = {
    mood:        selectedMood,
    rating:      selectedRating,
    inspiration: document.getElementById('inspiration').value.trim(),
    improvement: document.getElementById('improvement').value.trim(),
    traveler:    document.getElementById('traveler').value.trim() || 'Anonymous',
    email:       document.getElementById('email').value.trim() || '',
    timestamp:   new Date().toISOString()
  };

  /* Disable button — prevent double-submit */
  submitBtn.disabled = true;
  const btnSpan = submitBtn.querySelector('span');
  const originalText = btnSpan.textContent;
  btnSpan.textContent = 'Sending...';

  /* Fire request without blocking the success animation */
  submitToSheets(feedbackData).catch(err => {
    console.warn('[VOYAGERA] Sheet submission error:', err);
  });

  /* Show success after short intentional delay for perceived loading */
  setTimeout(showSuccess, 900);
}


/* ═══════════════════════════════════════════════════════════════
   SUCCESS OVERLAY
═══════════════════════════════════════════════════════════════ */
function showSuccess() {
  const overlay = document.getElementById('successOverlay');
  overlay.removeAttribute('aria-hidden');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  /* Move focus into the overlay for accessibility */
  const title = overlay.querySelector('.success-title');
  if (title) {
    title.setAttribute('tabindex', '-1');
    title.focus();
  }
}