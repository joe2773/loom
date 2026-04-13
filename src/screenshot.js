/**
 * Captures the current video frame, optionally cropped to a region.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {{ x: number, y: number, width: number, height: number }|null} cropRect
 *   Normalized coordinates (0–1) relative to the stream resolution. Pass null for full frame.
 * @returns {HTMLCanvasElement}
 */
export function captureFrame(videoEl, cropRect = null) {
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (cropRect) {
    const sx = Math.round(cropRect.x * vw);
    const sy = Math.round(cropRect.y * vh);
    const sw = Math.round(cropRect.width * vw);
    const sh = Math.round(cropRect.height * vh);
    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, sw, sh);
  } else {
    canvas.width = vw;
    canvas.height = vh;
    ctx.drawImage(videoEl, 0, 0);
  }

  return canvas;
}
