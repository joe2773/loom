import { describe, it, expect, vi, beforeEach } from 'vitest';
import { acquireStream, stopStream } from '../../src/display.js';
import { makeFakeStream, makeFakeTrack } from '../setup.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('acquireStream', () => {
  it('calls getDisplayMedia with cursor always and audio=true by default', async () => {
    const stream = makeFakeStream();
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(stream);

    const result = await acquireStream();
    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
      video: { cursor: 'always' },
      audio: true,
    });
    expect(result).toBe(stream);
  });

  it('passes audio: false when specified', async () => {
    const stream = makeFakeStream();
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(stream);

    await acquireStream({ audio: false });
    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: false })
    );
  });

  it('propagates rejection (e.g. NotAllowedError)', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    navigator.mediaDevices.getDisplayMedia.mockRejectedValue(err);

    await expect(acquireStream()).rejects.toMatchObject({ name: 'NotAllowedError' });
  });
});

describe('stopStream', () => {
  it('stops all tracks in the stream', () => {
    const t1 = makeFakeTrack();
    const t2 = makeFakeTrack({ kind: 'audio' });
    const stream = makeFakeStream([t1, t2]);

    stopStream(stream);
    expect(t1.stop).toHaveBeenCalled();
    expect(t2.stop).toHaveBeenCalled();
  });

  it('is a no-op when called with null', () => {
    expect(() => stopStream(null)).not.toThrow();
  });
});
