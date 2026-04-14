import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecordingTimer } from '../../src/timer.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeDisplayEl() {
  return { textContent: '' };
}

describe('RecordingTimer — display formatting', () => {
  it('initialises display to 00:00', () => {
    const el = makeDisplayEl();
    new RecordingTimer(el);
    expect(el.textContent).toBe('');
  });

  it('shows elapsed seconds after start', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(5000);
    expect(el.textContent).toBe('00:05');
  });

  it('formats minutes correctly', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(90_000);
    expect(el.textContent).toBe('01:30');
  });

  it('resets display to 00:00 on stop()', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(3000);
    t.stop();
    expect(el.textContent).toBe('00:00');
  });
});

describe('RecordingTimer — pause / resume accumulation', () => {
  it('stop() returns total elapsed ms', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(4000);
    const total = t.stop();
    expect(total).toBeGreaterThanOrEqual(4000);
  });

  it('accumulates time across pause/resume', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(3000);
    t.pause();
    vi.advanceTimersByTime(10_000); // this time should NOT count
    t.resume();
    vi.advanceTimersByTime(2000);
    const total = t.stop();
    // Should be ~5 s, definitely not ~15 s
    expect(total).toBeGreaterThanOrEqual(5000);
    expect(total).toBeLessThan(7000);
  });

  it('display does not advance while paused', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(2000);
    t.pause();
    const displayAtPause = el.textContent;
    vi.advanceTimersByTime(5000);
    expect(el.textContent).toBe(displayAtPause);
  });

  it('display resumes updating after resume()', () => {
    const el = makeDisplayEl();
    const t = new RecordingTimer(el);
    t.start();
    vi.advanceTimersByTime(1000);
    t.pause();
    const atPause = el.textContent;
    t.resume();
    vi.advanceTimersByTime(3000);
    expect(el.textContent).not.toBe(atPause);
  });
});
