import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureFrame } from '../../src/services/screenshot';

function makeVideoEl(videoWidth = 1920, videoHeight = 1080) {
  return { videoWidth, videoHeight };
}

let fakeCtx;
let fakeCanvas;

beforeEach(() => {
  fakeCtx = { drawImage: vi.fn() };
  fakeCanvas = { width: 0, height: 0, getContext: vi.fn(() => fakeCtx) };
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') return fakeCanvas;
    return document.createElement(tag);
  });
});

describe('captureFrame — full frame', () => {
  it('sizes canvas to full video dimensions', () => {
    captureFrame(makeVideoEl(1280, 720));
    expect(fakeCanvas.width).toBe(1280);
    expect(fakeCanvas.height).toBe(720);
  });

  it('draws the full video frame onto the canvas', () => {
    const video = makeVideoEl(1280, 720);
    captureFrame(video);
    expect(fakeCtx.drawImage).toHaveBeenCalledWith(video, 0, 0);
  });

  it('returns the canvas element', () => {
    const result = captureFrame(makeVideoEl());
    expect(result).toBe(fakeCanvas);
  });
});

describe('captureFrame — with cropRect', () => {
  it('sizes canvas to the cropped region in pixels', () => {
    // 50% of 1920x1080 region starting at (0.1, 0.1)
    captureFrame(makeVideoEl(1920, 1080), { x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
    expect(fakeCanvas.width).toBe(Math.round(0.5 * 1920));
    expect(fakeCanvas.height).toBe(Math.round(0.5 * 1080));
  });

  it('draws the cropped region using the 9-argument drawImage form', () => {
    const video = makeVideoEl(1920, 1080);
    const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
    captureFrame(video, crop);

    const sx = Math.round(0.25 * 1920);
    const sy = Math.round(0.25 * 1080);
    const sw = Math.round(0.5 * 1920);
    const sh = Math.round(0.5 * 1080);

    expect(fakeCtx.drawImage).toHaveBeenCalledWith(
      video, sx, sy, sw, sh, 0, 0, sw, sh
    );
  });

  it('handles full-size crop (x=0, y=0, width=1, height=1)', () => {
    captureFrame(makeVideoEl(800, 600), { x: 0, y: 0, width: 1, height: 1 });
    expect(fakeCanvas.width).toBe(800);
    expect(fakeCanvas.height).toBe(600);
  });
});
