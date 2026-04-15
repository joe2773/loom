import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob, downloadCanvasAsPng, generateFilename } from '../../src/downloader.js';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('generateFilename', () => {
  it('produces an mp4 filename for video type', () => {
    const name = generateFilename('video', 'mp4');
    expect(name).toMatch(/^loom-.+\.mp4$/);
  });

  it('produces a png filename for image type', () => {
    const name = generateFilename('image', 'png');
    expect(name).toMatch(/^loom-.+\.png$/);
  });

  it('includes an ISO-like timestamp', () => {
    const name = generateFilename('video', 'mp4');
    // Expect loom-YYYY-MM-DDTHH-MM-SS.mp4
    expect(name).toMatch(/loom-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.mp4/);
  });
});

describe('downloadBlob', () => {
  it('creates an object URL and triggers a click on an anchor', () => {
    const blob = new Blob(['data'], { type: 'video/mp4' });
    const clickSpy = vi.fn();
    const anchor = { href: '', download: '', click: clickSpy, style: {} };

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    downloadBlob(blob, 'test.mp4');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.download).toBe('test.mp4');
    expect(anchor.href).toBe('blob:fake-url');
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('revokes the object URL after a timeout', () => {
    const blob = new Blob(['data'], { type: 'video/mp4' });
    const anchor = { href: '', download: '', click: vi.fn(), style: {} };

    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    downloadBlob(blob, 'test.mp4');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1100);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });
});

describe('downloadCanvasAsPng', () => {
  it('calls canvas.toBlob and then triggers a download', async () => {
    const pngBlob = new Blob(['png-data'], { type: 'image/png' });
    const canvas = {
      toBlob: vi.fn((cb) => cb(pngBlob)),
    };
    const anchor = { href: '', download: '', click: vi.fn(), style: {} };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    downloadCanvasAsPng(canvas, 'shot.png');

    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(URL.createObjectURL).toHaveBeenCalledWith(pngBlob);
    expect(anchor.click).toHaveBeenCalled();
  });
});
