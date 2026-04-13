/**
 * Thin wrapper around MediaRecorder.
 * Resolves stop() with a complete Blob of the recording.
 */
export class ScreenRecorder {
  /**
   * @param {MediaStream} stream
   * @param {{ mimeType?: string, videoBitsPerSecond?: number }} options
   */
  constructor(stream, { mimeType = 'video/webm', videoBitsPerSecond = 2_500_000 } = {}) {
    // Fall back gracefully if the requested mimeType isn't supported
    const resolvedMime = MediaRecorder.isTypeSupported(mimeType)
      ? mimeType
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

    this._mimeType = resolvedMime;
    this._chunks = [];
    this._recorder = new MediaRecorder(stream, {
      mimeType: resolvedMime,
      videoBitsPerSecond,
    });

    this._recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };
  }

  /** Returns the resolved MIME type actually used. */
  get mimeType() {
    return this._mimeType;
  }

  start() {
    this._chunks = [];
    this._recorder.start(100); // collect data every 100 ms
  }

  pause() {
    if (this._recorder.state === 'recording') this._recorder.pause();
  }

  resume() {
    if (this._recorder.state === 'paused') this._recorder.resume();
  }

  /** @returns {Promise<Blob>} */
  stop() {
    return new Promise((resolve) => {
      this._recorder.onstop = () => {
        resolve(new Blob(this._chunks, { type: this._mimeType }));
      };
      if (this._recorder.state !== 'inactive') this._recorder.stop();
    });
  }
}
