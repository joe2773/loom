import type { RecorderOptions } from '../types';

export class ScreenRecorder {
  private _mimeType: string;
  private _chunks: Blob[];
  private _recorder: MediaRecorder;

  constructor(stream: MediaStream, { mimeType = 'video/webm', videoBitsPerSecond = 2_500_000 }: RecorderOptions = {}) {
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

    this._recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };
  }

  get mimeType(): string {
    return this._mimeType;
  }

  start(): void {
    this._chunks = [];
    this._recorder.start(100);
  }

  pause(): void {
    if (this._recorder.state === 'recording') this._recorder.pause();
  }

  resume(): void {
    if (this._recorder.state === 'paused') this._recorder.resume();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this._recorder.onstop = () => {
        resolve(new Blob(this._chunks, { type: this._mimeType }));
      };
      if (this._recorder.state !== 'inactive') this._recorder.stop();
    });
  }
}
