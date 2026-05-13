import { apiFetch, UnauthenticatedError } from './apiClient';

export { UnauthenticatedError };

export async function uploadToGCS(blob: Blob, filename: string): Promise<string> {
  const signRes = await apiFetch('/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType: blob.type }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || `sign-upload failed: ${signRes.status}`);
  }

  const { uploadUrl, publicUrl } = (await signRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

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
