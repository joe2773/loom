import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  makeFakeStream,
  makeFakeTrack,
  makeFakeMediaRecorder,
  setMediaRecorderFactory,
  resetMediaRecorderFactory,
} from '../setup';

// Mock services that touch DOM/APIs we don't care about in integration tests
vi.mock('../../src/services/downloader', () => ({
  downloadBlob: vi.fn(),
  downloadCanvasAsPng: vi.fn(),
  generateFilename: vi.fn((type: string, ext: string) => `mock-${type}.${ext}`),
}));

vi.mock('../../src/services/screenshot', () => ({
  captureFrame: vi.fn(() => ({
    toBlob: vi.fn((cb: (b: Blob) => void) => cb(new Blob(['img'], { type: 'image/png' }))),
  })),
}));

let fakeStream: any;
let fakeRecorder: any;

beforeEach(() => {
  vi.clearAllMocks();
  resetMediaRecorderFactory();
  (global as any).MediaRecorder.isTypeSupported.mockReturnValue(true);

  const track = makeFakeTrack();
  fakeStream = makeFakeStream([track]);
  (navigator.mediaDevices as any).getDisplayMedia.mockResolvedValue(fakeStream);

  setMediaRecorderFactory((stream, opts) => {
    fakeRecorder = makeFakeMediaRecorder(stream, opts);
    return fakeRecorder;
  });

  // Stub videoWidth/videoHeight on any new <video> element jsdom creates
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 1280 });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 720 });

  // Stub captureStream on canvas so region-mode recording doesn't crash
  (HTMLCanvasElement.prototype as any).captureStream = vi.fn(() => makeFakeStream());
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderApp() {
  // Dynamic import so each test gets a fresh module-level state
  vi.resetModules();
  const { default: App } = await import('../../src/App');
  return render(<App />);
}

async function selectSource(user: ReturnType<typeof userEvent.setup>) {
  await act(async () => {
    await user.click(document.getElementById('btn-select-source')!);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Initial state (idle)', () => {
  it('shows the setup panel', async () => {
    await renderApp();
    expect(document.getElementById('setup-panel')).toBeInTheDocument();
    expect(document.getElementById('preview-container')).not.toBeInTheDocument();
    expect(document.getElementById('recording-pill')).not.toBeInTheDocument();
  });

  it('disables region and screenshot type cards', async () => {
    await renderApp();
    expect(document.getElementById('btn-region-mode')).toBeDisabled();
    expect(document.getElementById('btn-screenshot')).toBeDisabled();
  });

  it('enables the screen-source button', async () => {
    await renderApp();
    expect(document.getElementById('btn-select-source')).not.toBeDisabled();
  });
});

describe('Select source → previewing', () => {
  it('calls getDisplayMedia', async () => {
    const user = userEvent.setup();
    await renderApp();
    await selectSource(user);
    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
  });

  it('transitions to previewing: shows preview, hides setup', async () => {
    const user = userEvent.setup();
    await renderApp();
    await selectSource(user);
    expect(document.getElementById('setup-panel')).not.toBeInTheDocument();
    expect(document.getElementById('preview-container')).toBeInTheDocument();
    expect(document.getElementById('preview-toolbar')).toBeInTheDocument();
  });

  it('does not throw on NotAllowedError', async () => {
    const user = userEvent.setup();
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    (navigator.mediaDevices as any).getDisplayMedia.mockRejectedValue(err);
    await renderApp();
    await expect(selectSource(user)).resolves.not.toThrow();
  });
});

describe('Record → Stop', () => {
  async function reachRecording(user: ReturnType<typeof userEvent.setup>) {
    await selectSource(user);
    await user.click(document.getElementById('btn-record')!);
  }

  it('shows recording pill and hides toolbar', async () => {
    const user = userEvent.setup();
    await renderApp();
    await reachRecording(user);
    expect(document.getElementById('recording-pill')).toBeInTheDocument();
    expect(document.getElementById('preview-toolbar')).not.toBeInTheDocument();
  });

  it('starts the recorder', async () => {
    const user = userEvent.setup();
    await renderApp();
    await reachRecording(user);
    expect(fakeRecorder.start).toHaveBeenCalled();
  });

  it('stop returns to previewing', async () => {
    const user = userEvent.setup();
    await renderApp();
    await reachRecording(user);
    fakeRecorder._triggerData();

    await act(async () => {
      await user.click(document.getElementById('btn-stop')!);
      fakeRecorder._triggerStop();
      await Promise.resolve();
    });

    expect(document.getElementById('recording-pill')).not.toBeInTheDocument();
    expect(document.getElementById('preview-toolbar')).toBeInTheDocument();
  });
});

describe('Pause / Resume', () => {
  async function reachRecording(user: ReturnType<typeof userEvent.setup>) {
    await selectSource(user);
    await user.click(document.getElementById('btn-record')!);
  }

  it('pause swaps icons; resume restores them', async () => {
    const user = userEvent.setup();
    await renderApp();
    await reachRecording(user);

    await user.click(document.getElementById('btn-pause')!);
    expect(document.getElementById('icon-pause')).toHaveStyle({ display: 'none' });
    expect(document.getElementById('icon-resume')).toHaveStyle({ display: 'inline-flex' });

    await user.click(document.getElementById('btn-pause')!);
    expect(document.getElementById('icon-pause')).toHaveStyle({ display: 'inline-flex' });
    expect(document.getElementById('icon-resume')).toHaveStyle({ display: 'none' });
  });

  it('pause calls recorder.pause(); resume calls recorder.resume()', async () => {
    const user = userEvent.setup();
    await renderApp();
    await reachRecording(user);

    await user.click(document.getElementById('btn-pause')!);
    expect(fakeRecorder.pause).toHaveBeenCalled();

    await user.click(document.getElementById('btn-pause')!);
    expect(fakeRecorder.resume).toHaveBeenCalled();
  });
});

describe('Screenshot', () => {
  it('pill screenshot button updates status to mention "screenshot"', async () => {
    const user = userEvent.setup();
    await renderApp();
    await selectSource(user);
    await user.click(document.getElementById('btn-record')!);
    await user.click(document.getElementById('btn-screenshot-pill')!);
    expect(document.getElementById('status-text')!.textContent).toMatch(/screenshot/i);
  });
});

describe('Gear panel', () => {
  async function reachRecording(user: ReturnType<typeof userEvent.setup>) {
    await selectSource(user);
    await user.click(document.getElementById('btn-record')!);
  }

  it('opens on gear click and closes on second click', async () => {
    const user = userEvent.setup();
    await renderApp();
    await reachRecording(user);

    await user.click(document.getElementById('btn-gear')!);
    expect(document.getElementById('gear-panel')).toBeInTheDocument();

    await user.click(document.getElementById('btn-gear')!);
    expect(document.getElementById('gear-panel')).not.toBeInTheDocument();
  });
});
