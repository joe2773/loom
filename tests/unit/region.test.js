import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegionSelector } from '../../src/region.js';

function makeEl(rect = { left: 0, top: 0, width: 200, height: 150 }) {
  return {
    style: { display: '', left: '', top: '', width: '', height: '' },
    getBoundingClientRect: vi.fn(() => ({ ...rect })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

function makeMouseEvent(clientX, clientY) {
  return { clientX, clientY, preventDefault: vi.fn() };
}

describe('RegionSelector — activate / deactivate', () => {
  it('activate() shows the overlay and attaches mousedown', () => {
    const overlay = makeEl();
    const box = makeEl();
    const video = makeEl();
    const onChange = vi.fn();

    const rs = new RegionSelector(overlay, box, video, onChange);
    rs.activate();

    expect(overlay.style.display).toBe('block');
    expect(overlay.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  it('deactivate() hides overlay and removes listeners', () => {
    const overlay = makeEl();
    const box = makeEl();
    const video = makeEl();

    const rs = new RegionSelector(overlay, box, video, vi.fn());
    rs.activate();
    rs.deactivate();

    expect(overlay.style.display).toBe('none');
    expect(overlay.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});

describe('RegionSelector — clearSelection', () => {
  it('clears cropRect and calls onChange(null)', () => {
    const overlay = makeEl();
    const box = makeEl();
    const video = makeEl();
    const onChange = vi.fn();

    const rs = new RegionSelector(overlay, box, video, onChange);
    // Manually set a cropRect
    rs._cropRect = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };
    rs.clearSelection();

    expect(rs.getCropRect()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
    expect(box.style.display).toBe('none');
  });
});

describe('RegionSelector — drag to select', () => {
  // Call the private bound methods directly — avoids fighting jsdom's
  // document.addEventListener which can behave unexpectedly with vi.spyOn.
  function simulateDrag(rs, overlayRect, start, end) {
    rs._overlay.getBoundingClientRect.mockReturnValue(overlayRect);
    // _overlay.getBoundingClientRect is also called inside _updateBox via this._overlay
    rs._onMouseDown(makeMouseEvent(start.x, start.y));
    rs._onMouseMove(makeMouseEvent(end.x, end.y));
    rs._onMouseUp(makeMouseEvent(end.x, end.y));
  }

  it('records normalized cropRect after drag', () => {
    const overlayRect = { left: 0, top: 0, width: 200, height: 100 };
    const overlay = makeEl(overlayRect);
    const box = makeEl();
    const video = makeEl();
    const onChange = vi.fn();

    const rs = new RegionSelector(overlay, box, video, onChange);
    rs.activate();

    simulateDrag(rs, overlayRect,
      { x: 0, y: 0 },
      { x: 100, y: 50 }  // 50% of width, 50% of height
    );

    const rect = rs.getCropRect();
    expect(rect).not.toBeNull();
    expect(rect.width).toBeCloseTo(0.5, 1);
    expect(rect.height).toBeCloseTo(0.5, 1);
  });

  it('ignores tiny accidental clicks (< 1% area)', () => {
    const overlayRect = { left: 0, top: 0, width: 200, height: 100 };
    const overlay = makeEl(overlayRect);
    const box = makeEl();
    const video = makeEl();
    const onChange = vi.fn();

    const rs = new RegionSelector(overlay, box, video, onChange);
    rs.activate();

    // 1px drag — very small
    simulateDrag(rs, overlayRect, { x: 10, y: 10 }, { x: 11, y: 11 });

    expect(rs.getCropRect()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with the normalized rect on successful drag', () => {
    const overlayRect = { left: 0, top: 0, width: 400, height: 300 };
    const overlay = makeEl(overlayRect);
    const box = makeEl();
    const video = makeEl();
    const onChange = vi.fn();

    const rs = new RegionSelector(overlay, box, video, onChange);
    rs.activate();

    simulateDrag(rs, overlayRect, { x: 0, y: 0 }, { x: 200, y: 150 });

    const lastCall = onChange.mock.calls.at(-1)[0];
    expect(lastCall).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      width: expect.closeTo(0.5, 1),
      height: expect.closeTo(0.5, 1),
    });
  });

  it('clamps coordinates to overlay bounds', () => {
    const overlayRect = { left: 50, top: 50, width: 200, height: 100 };
    const overlay = makeEl(overlayRect);
    const box = makeEl();
    const video = makeEl();
    const onChange = vi.fn();

    const rs = new RegionSelector(overlay, box, video, onChange);
    rs.activate();

    // Drag far outside the overlay bounds
    simulateDrag(rs, overlayRect, { x: 50, y: 50 }, { x: 9999, y: 9999 });

    const rect = rs.getCropRect();
    expect(rect.width).toBeLessThanOrEqual(1);
    expect(rect.height).toBeLessThanOrEqual(1);
  });
});
