import { describe, it, expect, vi, afterEach } from 'vitest';

// Stub VITE_API_URL before importing the module
vi.stubEnv('VITE_API_URL', 'http://localhost:3001');

const { uploadToGCS } = await import('../../src/uploader.js');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function makeFetchMock(...responses) {
  let call = 0;
  return vi.fn(() => Promise.resolve(responses[call++]));
}

function okJson(body) {
  return { ok: true, json: () => Promise.resolve(body) };
}

function failRes(status) {
  return { ok: false, status, json: () => Promise.resolve({ error: `HTTP ${status}` }) };
}

describe('uploadToGCS', () => {
  it('calls sign-upload then PUTs to the signed URL and returns publicUrl', async () => {
    const fetchMock = makeFetchMock(
      okJson({ uploadUrl: 'https://signed.example.com/put', publicUrl: 'https://storage.googleapis.com/bucket/test.mp4' }),
      { ok: true }
    );
    vi.stubGlobal('fetch', fetchMock);

    const blob = new Blob(['video'], { type: 'video/mp4' });
    const result = await uploadToGCS(blob, 'test.mp4');

    expect(fetchMock).toHaveBeenCalledTimes(2);

    // First call: sign-upload POST
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3001/sign-upload');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ filename: 'test.mp4', contentType: 'video/mp4' }),
    });

    // Second call: PUT to signed URL
    expect(fetchMock.mock.calls[1][0]).toBe('https://signed.example.com/put');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: blob });

    expect(result).toBe('https://storage.googleapis.com/bucket/test.mp4');
  });

  it('throws when sign-upload returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(failRes(500))));

    const blob = new Blob(['video'], { type: 'video/mp4' });
    await expect(uploadToGCS(blob, 'test.mp4')).rejects.toThrow('HTTP 500');
  });

  it('throws when the GCS PUT returns a non-ok response', async () => {
    const fetchMock = makeFetchMock(
      okJson({ uploadUrl: 'https://signed.example.com/put', publicUrl: 'https://storage.googleapis.com/bucket/test.mp4' }),
      { ok: false, status: 403 }
    );
    vi.stubGlobal('fetch', fetchMock);

    const blob = new Blob(['video'], { type: 'video/mp4' });
    await expect(uploadToGCS(blob, 'test.mp4')).rejects.toThrow('GCS upload failed: 403');
  });
});
