import type { CropRect } from '../types';

export function captureFrame(videoEl: HTMLVideoElement, cropRect: CropRect | null = null): HTMLCanvasElement {
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

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
