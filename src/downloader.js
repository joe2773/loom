/**
 * Triggers a file download for the given Blob.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Converts a canvas to a PNG blob and downloads it.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
export function downloadCanvasAsPng(canvas, filename) {
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
  }, 'image/png');
}

/**
 * Generates a timestamped filename.
 * @param {'video'|'image'} type
 * @param {string} ext  e.g. 'webm' or 'png'
 */
export function generateFilename(type, ext) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `loom-${ts}.${ext}`;
}
