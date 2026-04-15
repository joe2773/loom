import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock @google-cloud/storage ───────────────────────────────────────────────
const getSignedUrl = vi.fn().mockResolvedValue(['https://signed-url.example.com/upload']);
const getFiles = vi.fn();
const fileFn = vi.fn(() => ({ getSignedUrl }));
const bucketFn = vi.fn(() => ({ file: fileFn, getFiles }));

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn(() => ({ bucket: bucketFn })),
}));

// Set required env vars before importing the app
process.env.BUCKET_NAME = 'test-bucket';
process.env.ALLOWED_ORIGIN = '*';

const { app } = await import('./server.js');

// ── POST /sign-upload ────────────────────────────────────────────────────────
describe('POST /sign-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSignedUrl.mockResolvedValue(['https://signed-url.example.com/upload']);
  });

  it('returns uploadUrl and publicUrl for valid body', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .send({ filename: 'loom-2026-04-15T10-00-00.webm', contentType: 'video/webm' });

    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toBe('https://signed-url.example.com/upload');
    expect(res.body.publicUrl).toBe(
      'https://storage.googleapis.com/test-bucket/loom-2026-04-15T10-00-00.webm'
    );
    expect(getSignedUrl).toHaveBeenCalledWith(expect.objectContaining({
      version: 'v4',
      action: 'write',
      contentType: 'video/webm',
    }));
  });

  it('returns 400 when filename is missing', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .send({ contentType: 'video/webm' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/filename/);
  });

  it('returns 400 when contentType is missing', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .send({ filename: 'test.webm' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/contentType/);
  });
});

// ── GET /videos ──────────────────────────────────────────────────────────────
describe('GET /videos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns videos sorted newest-first', async () => {
    getFiles.mockResolvedValue([[
      { name: 'loom-a.webm', metadata: { timeCreated: '2026-04-14T10:00:00Z' } },
      { name: 'loom-b.webm', metadata: { timeCreated: '2026-04-15T10:00:00Z' } },
    ]]);

    const res = await request(app).get('/videos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('loom-b.webm');
    expect(res.body[1].name).toBe('loom-a.webm');
    expect(res.body[0].url).toBe(
      'https://storage.googleapis.com/test-bucket/loom-b.webm'
    );
  });

  it('returns empty array when bucket has no files', async () => {
    getFiles.mockResolvedValue([[]]);

    const res = await request(app).get('/videos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
