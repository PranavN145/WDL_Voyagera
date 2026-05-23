document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("destinations-container");
  const wrapper = document.getElementById("vibe-context-wrapper");
  
  if (!container || !wrapper) return;

  const activeVibeKey = wrapper.getAttribute("data-vibe");
  const destinations = DESTINATIONS_BY_VIBE[activeVibeKey] || [];

  if (destinations.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No raw exploration listings logged under this track yet. Check back soon!</p></div>`;
    return;
  }

  container.innerHTML = destinations.map(dest => `
    <div class="dest-card">
      <div class="img-wrapper">
        <img src="${dest.image}" alt="${dest.name}" loading="lazy">
        <span class="card-budget">${dest.budget} <small>/ day</small></span>
      </div>
      <div class="card-body">
        <h3>${dest.name}</h3>
        <div class="card-meta">
          <strong>Best Season:</strong> ${dest.season}
        </div>
        <p class="card-desc">${dest.description}</p>
        <div class="card-tags">
          ${dest.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
});