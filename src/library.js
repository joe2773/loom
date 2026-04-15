const API_URL = import.meta.env.VITE_API_URL;

function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildCard(name, url, created) {
  const article = document.createElement('article');
  article.className = 'video-card';
  article.title = name;
  article.addEventListener('click', () => window.open(url, '_blank'));

  const thumb = document.createElement('div');
  thumb.className = 'video-card-thumb';
  const video = document.createElement('video');
  video.src = url;
  video.preload = 'metadata';
  video.muted = true;
  thumb.appendChild(video);

  const meta = document.createElement('div');
  meta.className = 'video-card-meta';

  const nameEl = document.createElement('span');
  nameEl.className = 'video-card-name';
  nameEl.textContent = name;

  const dateEl = document.createElement('span');
  dateEl.className = 'video-card-date';
  dateEl.textContent = created ? formatDate(created) : '';

  meta.appendChild(nameEl);
  meta.appendChild(dateEl);
  article.appendChild(thumb);
  article.appendChild(meta);
  return article;
}

function updateCount(grid) {
  const count = grid.children.length;
  const badge = document.getElementById('library-count');
  if (badge) badge.textContent = count > 0 ? `${count} video${count === 1 ? '' : 's'}` : '';
}

/**
 * Fetches the video list from loom-api and renders cards into #library-grid.
 * Shows the #library section on success.
 */
export async function loadLibrary() {
  const section = document.getElementById('library');
  const grid    = document.getElementById('library-grid');
  const empty   = document.getElementById('library-empty');
  if (!section || !grid || !empty) return;

  const res = await fetch(`${API_URL}/videos`);
  if (!res.ok) throw new Error(`Failed to load videos: ${res.status}`);

  const videos = await res.json();
  section.classList.add('active');

  if (videos.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = '';
  for (const { name, url, created } of videos) {
    grid.appendChild(buildCard(name, url, created));
  }
  updateCount(grid);
}

/**
 * Inserts a new video card at the front of #library-grid immediately after upload.
 * @param {string} name - Filename
 * @param {string} url  - Public GCS URL
 */
export function prependCard(name, url) {
  const section = document.getElementById('library');
  const grid    = document.getElementById('library-grid');
  const empty   = document.getElementById('library-empty');
  if (!grid) return;

  section?.classList.add('active');
  empty?.classList.add('hidden');
  grid.insertBefore(buildCard(name, url, new Date().toISOString()), grid.firstChild);
  updateCount(grid);
}
