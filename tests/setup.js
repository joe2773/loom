import { vi } from 'vitest';

// ── MediaStream / MediaStreamTrack ──────────────────────────────────────────
export function makeFakeTrack(overrides = {}) {
  return {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    kind: 'video',
    ...overrides,
  };
}

export function makeFakeStream(tracks = [makeFakeTrack()]) {
  return {
    getTracks: vi.fn(() => tracks),
    getVideoTracks: vi.fn(() => tracks.filter((t) => t.kind === 'video')),
    getAudioTracks: vi.fn(() => tracks.filter((t) => t.kind === 'audio')),
  };
}

// ── MediaRecorder ────────────────────────────────────────────────────────────
export function makeFakeMediaRecorder(stream, options = {}) {
  const instance = {
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    state: 'inactive',
    mimeType: options.mimeType || 'video/mp4',
    ondataavailable: null,
    onstop: null,
    _triggerData(data = new Blob(['chunk'], { type: 'video/mp4' })) {
      if (instance.ondataavailable) instance.ondataavailable({ data });
    },
    _triggerStop() {
      instance.state = 'inactive';
      if (instance.onstop) instance.onstop();
    },
  };
  instance.start.mockImplementation(() => { instance.state = 'recording'; });
  instance.pause.mockImplementation(() => { instance.state = 'paused'; });
  instance.resume.mockImplementation(() => { instance.state = 'recording'; });
  instance.stop.mockImplementation(() => {
    instance.state = 'inactive';
    setTimeout(() => instance._triggerStop(), 0);
  });
  return instance;
}

// Install global MediaRecorder mock
let _MediaRecorderFactory = (stream, opts) => makeFakeMediaRecorder(stream, opts);

global.MediaRecorder = vi.fn((stream, opts) => _MediaRecorderFactory(stream, opts));
global.MediaRecorder.isTypeSupported = vi.fn(() => true);

export function setMediaRecorderFactory(fn) { _MediaRecorderFactory = fn; }
export function resetMediaRecorderFactory() {
  _MediaRecorderFactory = (stream, opts) => makeFakeMediaRecorder(stream, opts);
}

// ── navigator.mediaDevices ───────────────────────────────────────────────────
global.navigator.mediaDevices = {
  getDisplayMedia: vi.fn(),
};

// ── URL ─────────────────────────────────────────────────────────────────────
global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
global.URL.revokeObjectURL = vi.fn();

// ── Canvas ───────────────────────────────────────────────────────────────────
export function makeFakeCanvas(overrides = {}) {
  const ctx = {
    drawImage: vi.fn(),
    ...overrides.ctx,
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb) => cb(new Blob(['png'], { type: 'image/png' }))),
    captureStream: vi.fn(() => makeFakeStream()),
    ...overrides,
  };
  return { canvas, ctx };
}

// ── requestAnimationFrame ────────────────────────────────────────────────────
global.requestAnimationFrame = vi.fn((cb) => { cb(); return 1; });
global.cancelAnimationFrame = vi.fn();

// ── HTMLCanvasElement mock for jsdom ──────────────────────────────────────────
// jsdom doesn't implement canvas.getContext, so we mock it
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(function() {
    return { drawImage: vi.fn() };
  });
}
