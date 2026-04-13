/**
 * Handles drag-to-select region overlay over the video preview.
 * All coordinates are stored in normalized form (0–1) relative to the overlay
 * dimensions so they work regardless of CSS-rendered size vs. stream resolution.
 */
export class RegionSelector {
  /**
   * @param {HTMLElement} overlayEl      The transparent drag-capture div
   * @param {HTMLElement} selectionBoxEl The visible dashed-border rectangle
   * @param {HTMLVideoElement} videoEl   The preview video (used for aspect reference)
   * @param {(rect: object|null) => void} onChange  Called when selection changes
   */
  constructor(overlayEl, selectionBoxEl, videoEl, onChange) {
    this._overlay = overlayEl;
    this._box = selectionBoxEl;
    this._video = videoEl;
    this._onChange = onChange;
    this._cropRect = null;

    this._dragStart = null;
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  /** Show overlay and start listening for drag. */
  activate() {
    this._overlay.style.display = 'block';
    this._overlay.addEventListener('mousedown', this._onMouseDown);
  }

  /** Hide overlay and remove listeners. */
  deactivate() {
    this._overlay.style.display = 'none';
    this._overlay.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    this._dragStart = null;
  }

  /** @returns {{ x, y, width, height }|null} Normalized crop rect, or null if none. */
  getCropRect() {
    return this._cropRect;
  }

  /** Resets the selection and hides the box. */
  clearSelection() {
    this._cropRect = null;
    this._box.style.display = 'none';
    this._onChange(null);
  }

  _onMouseDown(e) {
    e.preventDefault();
    const rect = this._overlay.getBoundingClientRect();
    this._dragStart = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      clientRect: rect,
    };
    this._box.style.display = 'block';
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  _onMouseMove(e) {
    if (!this._dragStart) return;
    this._updateBox(e);
  }

  _onMouseUp(e) {
    if (!this._dragStart) return;
    this._updateBox(e);

    const { x, y, width, height } = this._computeNormalized(e);
    // Ignore tiny accidental clicks
    if (width < 0.01 || height < 0.01) {
      this.clearSelection();
    } else {
      this._cropRect = { x, y, width, height };
      this._onChange(this._cropRect);
    }

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    this.deactivate();
  }

  _computeNormalized(e) {
    const { x: startX, y: startY, clientRect } = this._dragStart;
    const curX = Math.max(0, Math.min(1, (e.clientX - clientRect.left) / clientRect.width));
    const curY = Math.max(0, Math.min(1, (e.clientY - clientRect.top) / clientRect.height));
    return {
      x: Math.min(startX, curX),
      y: Math.min(startY, curY),
      width: Math.abs(curX - startX),
      height: Math.abs(curY - startY),
    };
  }

  _updateBox(e) {
    const { x, y, width, height } = this._computeNormalized(e);
    const containerRect = this._overlay.getBoundingClientRect();
    this._box.style.left = `${x * containerRect.width}px`;
    this._box.style.top = `${y * containerRect.height}px`;
    this._box.style.width = `${width * containerRect.width}px`;
    this._box.style.height = `${height * containerRect.height}px`;
  }
}
