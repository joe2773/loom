/**
 * Acquires a display media stream via the browser's native source picker.
 * @param {{ audio?: boolean }} options
 * @returns {Promise<MediaStream>}
 */
export async function acquireStream({ audio = true } = {}) {
  return navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio,
  });
}

/**
 * Stops all tracks in a stream.
 * @param {MediaStream} stream
 */
export function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}
