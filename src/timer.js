/**
 * Pause-aware elapsed time tracker that updates a DOM element.
 */
export class RecordingTimer {
  constructor(displayEl) {
    this._displayEl = displayEl;
    this._accumulated = 0;
    this._startTs = null;
    this._intervalId = null;
  }

  start() {
    this._accumulated = 0;
    this._startTs = Date.now();
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 100);
  }

  pause() {
    if (this._startTs !== null) {
      this._accumulated += Date.now() - this._startTs;
      this._startTs = null;
    }
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  resume() {
    this._startTs = Date.now();
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 100);
  }

  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    const total = this._elapsed();
    this._accumulated = 0;
    this._startTs = null;
    this._displayEl.textContent = '00:00';
    return total;
  }

  _elapsed() {
    const running = this._startTs !== null ? Date.now() - this._startTs : 0;
    return this._accumulated + running;
  }

  _tick() {
    this._displayEl.textContent = this._format(this._elapsed());
  }

  _format(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
