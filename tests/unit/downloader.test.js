import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob, downloadCanvasAsPng, generateFilename } from '../../src/services/downloader';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('generateFilename', () => {
  it('produces a webm filename for video type', () => {
    const name = generateFilename('video', 'webm');
    expect(name).toMatch(/^loom-.+\.webm$/);
  });

  it('produces a png filename for image type', () => {
    const name = generateFilename('image', 'png');
    expect(name).toMatch(/^loom-.+\.png$/);
  });

  it('includes an ISO-like timestamp', () => {
    const name = generateFilename('video', 'webm');
    // Expect loom-YYYY-MM-DDTHH-MM-SS.webm
    expect(name).toMatch(/loom-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.webm/);
  });
});

describe('downloadBlob', () => {
  it('creates an object URL and triggers a click on an anchor', () => {
    const blob = new Blob(['data'], { type: 'video/webm' });
    const clickSpy = vi.fn();
    const anchor = { href: '', download: '', click: clickSpy, style: {} };

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    downloadBlob(blob, 'test.webm');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.download).toBe('test.webm');
    expect(anchor.href).toBe('blob:fake-url');
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('revokes the object URL after a timeout', () => {
    const blob = new Blob(['data'], { type: 'video/webm' });
    const anchor = { href: '', download: '', click: vi.fn(), style: {} };

    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    downloadBlob(blob, 'test.webm');
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
