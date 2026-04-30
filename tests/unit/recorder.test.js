import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenRecorder } from '../../src/services/recorder';
import { makeFakeStream, makeFakeMediaRecorder, setMediaRecorderFactory, resetMediaRecorderFactory } from '../setup';

beforeEach(() => {
  resetMediaRecorderFactory();
  vi.clearAllMocks();
  global.MediaRecorder.isTypeSupported.mockReturnValue(true);
});

describe('ScreenRecorder — MIME type resolution', () => {
  it('uses requested mimeType when supported', () => {
    global.MediaRecorder.isTypeSupported.mockReturnValue(true);
    const r = new ScreenRecorder(makeFakeStream(), { mimeType: 'video/mp4' });
    expect(r.mimeType).toBe('video/mp4');
    expect(global.MediaRecorder).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mimeType: 'video/mp4' })
    );
  });

  it('falls back to vp9 when requested mimeType is unsupported', () => {
    global.MediaRecorder.isTypeSupported
      .mockImplementation((t) => t === 'video/webm;codecs=vp9');
    const r = new ScreenRecorder(makeFakeStream(), { mimeType: 'video/mp4' });
    expect(r.mimeType).toBe('video/webm;codecs=vp9');
  });

  it('falls back to plain webm when nothing else is supported', () => {
    global.MediaRecorder.isTypeSupported.mockReturnValue(false);
    const r = new ScreenRecorder(makeFakeStream(), { mimeType: 'video/mp4' });
    expect(r.mimeType).toBe('video/webm');
  });
});

describe('ScreenRecorder — start / stop', () => {
  it('start() resets chunks and calls recorder.start(100)', () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    r.start();
    expect(instance.start).toHaveBeenCalledWith(100);
  });

  it('stop() resolves with a Blob built from collected chunks', async () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    r.start();
    instance._triggerData(new Blob(['a'], { type: 'video/webm' }));
    instance._triggerData(new Blob(['b'], { type: 'video/webm' }));

    const p = r.stop();
    instance._triggerStop();

    const blob = await p;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('video/webm');
  });

  it('stop() resolves even with no chunks', async () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    r.start();
    const p = r.stop();
    instance._triggerStop();

    const blob = await p;
    expect(blob).toBeInstanceOf(Blob);
  });

  it('stop() does not call recorder.stop() again if already inactive', async () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      instance.state = 'inactive';
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    const p = r.stop();
    instance._triggerStop();
    await p;

    // stop() mock should not have been called since state was already inactive
    expect(instance.stop).not.toHaveBeenCalled();
  });
});

describe('ScreenRecorder — pause / resume', () => {
  it('pause() calls recorder.pause() when recording', () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    r.start();
    r.pause();
    expect(instance.pause).toHaveBeenCalled();
  });

  it('resume() calls recorder.resume() when paused', () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    r.start();
    r.pause();
    r.resume();
    expect(instance.resume).toHaveBeenCalled();
  });

  it('pause() is a no-op when not recording', () => {
    let instance;
    setMediaRecorderFactory((stream, opts) => {
      instance = makeFakeMediaRecorder(stream, opts);
      return instance;
    });

    const r = new ScreenRecorder(makeFakeStream());
    // Never called start — state is 'inactive'
    r.pause();
    expect(instance.pause).not.toHaveBeenCalled();
  });
});
