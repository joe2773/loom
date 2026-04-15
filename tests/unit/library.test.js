import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_API_URL', 'http://localhost:3001');

// Set up the DOM structure library.js expects before module import
function setupDOM() {
  document.body.innerHTML = `
    <section id="library">
      <span id="library-count"></span>
      <div id="library-grid"></div>
      <p id="library-empty" class="hidden"></p>
    </section>
  `;
}

// Import after env stub so import.meta.env.VITE_API_URL resolves
const { loadLibrary, prependCard } = await import('../../src/library.js');

beforeEach(() => {
  setupDOM();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function mockFetch(body, ok = true) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })
  ));
}

describe('loadLibrary', () => {
  it('renders a card for each video and activates the section', async () => {
    mockFetch([
      { name: 'loom-b.webm', url: 'https://storage.googleapis.com/b/loom-b.webm', created: '2026-04-15T10:00:00Z' },
      { name: 'loom-a.webm', url: 'https://storage.googleapis.com/b/loom-a.webm', created: '2026-04-14T10:00:00Z' },
    ]);

    await loadLibrary();

    const grid = document.getElementById('library-grid');
    expect(grid.querySelectorAll('.video-card')).toHaveLength(2);
    expect(document.getElementById('library').classList.contains('active')).toBe(true);
    expect(document.getElementById('library-empty').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('library-count').textContent).toBe('2 videos');
  });

  it('shows the empty state when the API returns an empty array', async () => {
    mockFetch([]);

    await loadLibrary();

    const grid = document.getElementById('library-grid');
    expect(grid.querySelectorAll('.video-card')).toHaveLength(0);
    expect(document.getElementById('library-empty').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('library-count').textContent).toBe('');
  });

  it('throws when the API returns a non-ok response', async () => {
    mockFetch({}, false);

    await expect(loadLibrary()).rejects.toThrow('Failed to load videos: 500');
  });
});

describe('prependCard', () => {
  it('inserts a card as the first child of #library-grid', () => {
    // Pre-populate one existing card
    const grid = document.getElementById('library-grid');
    const existing = document.createElement('article');
    existing.className = 'video-card';
    grid.appendChild(existing);

    prependCard('loom-new.webm', 'https://storage.googleapis.com/b/loom-new.webm');

    const cards = grid.querySelectorAll('.video-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.video-card-name').textContent).toBe('loom-new.webm');
  });

  it('activates the library section and hides the empty state', () => {
    prependCard('loom-x.webm', 'https://storage.googleapis.com/b/loom-x.webm');

    expect(document.getElementById('library').classList.contains('active')).toBe(true);
    expect(document.getElementById('library-empty').classList.contains('hidden')).toBe(true);
  });

  it('updates the count badge', () => {
    prependCard('loom-x.webm', 'https://storage.googleapis.com/b/loom-x.webm');
    expect(document.getElementById('library-count').textContent).toBe('1 video');

    prependCard('loom-y.webm', 'https://storage.googleapis.com/b/loom-y.webm');
    expect(document.getElementById('library-count').textContent).toBe('2 videos');
  });
});
