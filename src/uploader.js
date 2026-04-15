const API_URL = import.meta.env.VITE_API_URL;

/**
 * Uploads a recorded blob to GCS via a signed URL from loom-api.
 * @param {Blob} blob - The recorded video blob
 * @param {string} filename - The filename to store in GCS
 * @returns {Promise<string>} The public GCS URL of the uploaded video
 */
export async function uploadToGCS(blob, filename) {
  // Step 1: get a signed PUT URL from the API
  const signRes = await fetch(`${API_URL}/sign-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType: blob.type }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || `sign-upload failed: ${signRes.status}`);
  }

  const { uploadUrl, publicUrl } = await signRes.json();

  // Step 2: PUT the blob directly to GCS
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`GCS upload failed: ${uploadRes.status}`);
  }

  return publicUrl;
}
