import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ── MediaStream / MediaStreamTrack ──────────────────────────────────────────
export function makeFakeTrack(overrides: Record<string, unknown> = {}): any {
  return {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    kind: 'video',
    ...overrides,
  };
}

export function makeFakeStream(tracks: any[] = [makeFakeTrack()]): any {
  return {
    getTracks: vi.fn(() => tracks),
    getVideoTracks: vi.fn(() => tracks.filter((t) => t.kind === 'video')),
    getAudioTracks: vi.fn(() => tracks.filter((t) => t.kind === 'audio')),
  };
}

// ── MediaRecorder ────────────────────────────────────────────────────────────
export function makeFakeMediaRecorder(_stream: any, options: { mimeType?: string } = {}): any {
  const instance: any = {
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    state: 'inactive',
    mimeType: options.mimeType || 'video/webm',
    ondataavailable: null as ((e: { data: Blob }) => void) | null,
    onstop: null as (() => void) | null,
    _triggerData(data = new Blob(['chunk'], { type: 'video/webm' })) {
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
let _MediaRecorderFactory: (stream: any, opts: any) => any =
  (stream, opts) => makeFakeMediaRecorder(stream, opts);

(globalThis as any).MediaRecorder = vi.fn((stream: any, opts: any) => _MediaRecorderFactory(stream, opts));
(globalThis as any).MediaRecorder.isTypeSupported = vi.fn(() => true);

export function setMediaRecorderFactory(fn: (stream: any, opts: any) => any) { _MediaRecorderFactory = fn; }
export function resetMediaRecorderFactory() {
  _MediaRecorderFactory = (stream, opts) => makeFakeMediaRecorder(stream, opts);
}

// ── navigator.mediaDevices ───────────────────────────────────────────────────
(globalThis as any).navigator.mediaDevices = {
  getDisplayMedia: vi.fn(),
};

// ── URL ─────────────────────────────────────────────────────────────────────
(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:fake-url');
(globalThis as any).URL.revokeObjectURL = vi.fn();

// ── Canvas ───────────────────────────────────────────────────────────────────
export function makeFakeCanvas(overrides: any = {}) {
  const ctx = {
    drawImage: vi.fn(),
    ...overrides.ctx,
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb: (b: Blob) => void) => cb(new Blob(['png'], { type: 'image/png' }))),
    captureStream: vi.fn(() => makeFakeStream()),
    ...overrides,
  };
  return { canvas, ctx };
}

// ── requestAnimationFrame ────────────────────────────────────────────────────
(globalThis as any).requestAnimationFrame = vi.fn((cb: () => void) => { cb(); return 1; });
(globalThis as any).cancelAnimationFrame = vi.fn();

// ── HTMLCanvasElement mock for jsdom ──────────────────────────────────────────
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(function () {
    return { drawImage: vi.fn() };
  }) as any;
}
