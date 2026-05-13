import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock @google-cloud/storage ───────────────────────────────────────────────
const getSignedUrl = vi.fn().mockResolvedValue(['https://signed-url.example.com/upload']);
const getFiles = vi.fn();
const fileFn = vi.fn(() => ({ getSignedUrl }));
const bucketFn = vi.fn(() => ({ file: fileFn, getFiles }));

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn(() => ({ bucket: bucketFn })),
}));

// ── Mock pg (db pool) ────────────────────────────────────────────────────────
const dbQuery = vi.fn();
vi.mock('pg', () => ({
  default: { Pool: vi.fn(() => ({ query: dbQuery, connect: vi.fn() })) },
}));

// ── Mock google-auth-library ────────────────────────────────────────────────
const verifyIdToken = vi.fn();
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(() => ({ verifyIdToken })),
}));

// Set required env vars before importing the app
process.env.BUCKET_NAME = 'test-bucket';
process.env.ALLOWED_ORIGIN = '*';
process.env.JWT_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';

const { app } = await import('./server.js');

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_EMAIL = 'test@example.com';
const authHeader = () =>
  `Bearer ${jwt.sign({ sub: TEST_USER_ID, email: TEST_USER_EMAIL }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
  })}`;

// ── Auth middleware ──────────────────────────────────────────────────────────
describe('auth middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/videos');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed Authorization header', async () => {
    const res = await request(app).get('/videos').set('Authorization', 'NotBearer xyz');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app).get('/videos').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });
});

// ── POST /auth/google ────────────────────────────────────────────────────────
describe('POST /auth/google', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exchanges a valid Google ID token for an app JWT', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'alice@example.com',
        email_verified: true,
        name: 'Alice',
        picture: 'https://pic/alice',
      }),
    });
    dbQuery.mockResolvedValue({
      rows: [{
        id: TEST_USER_ID,
        email: 'alice@example.com',
        name: 'Alice',
        picture: 'https://pic/alice',
      }],
    });

    const res = await request(app).post('/auth/google').send({ idToken: 'google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: TEST_USER_ID,
      email: 'alice@example.com',
      name: 'Alice',
      picture: 'https://pic/alice',
    });
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.sub).toBe(TEST_USER_ID);
    expect(decoded.email).toBe('alice@example.com');

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    expect(dbQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['google-sub-1', 'alice@example.com', 'Alice', 'https://pic/alice'],
    );
  });

  it('returns 400 when idToken is missing', async () => {
    const res = await request(app).post('/auth/google').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when Google rejects the token', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    const res = await request(app).post('/auth/google').send({ idToken: 'bad' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when email is not verified', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 's', email: 'x@y.com', email_verified: false }),
    });
    const res = await request(app).post('/auth/google').send({ idToken: 't' });
    expect(res.status).toBe(401);
  });
});

// ── POST /sign-upload ────────────────────────────────────────────────────────
describe('POST /sign-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSignedUrl.mockResolvedValue(['https://signed-url.example.com/upload']);
  });

  it('returns uploadUrl and publicUrl scoped under users/{userId}/', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .set('Authorization', authHeader())
      .send({ filename: 'loom-2026-04-15T10-00-00.webm', contentType: 'video/webm' });

    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toBe('https://signed-url.example.com/upload');
    expect(res.body.publicUrl).toBe(
      `https://storage.googleapis.com/test-bucket/users/${TEST_USER_ID}/loom-2026-04-15T10-00-00.webm`,
    );
    expect(fileFn).toHaveBeenCalledWith(`users/${TEST_USER_ID}/loom-2026-04-15T10-00-00.webm`);
    expect(getSignedUrl).toHaveBeenCalledWith(expect.objectContaining({
      version: 'v4',
      action: 'write',
      contentType: 'video/webm',
    }));
  });

  it('returns 400 when filename is missing', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .set('Authorization', authHeader())
      .send({ contentType: 'video/webm' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/filename/);
  });

  it('returns 400 when contentType is missing', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .set('Authorization', authHeader())
      .send({ filename: 'test.webm' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/contentType/);
  });

  it('returns 400 when filename contains path separators', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .set('Authorization', authHeader())
      .send({ filename: '../evil.webm', contentType: 'video/webm' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/sign-upload')
      .send({ filename: 'x.webm', contentType: 'video/webm' });
    expect(res.status).toBe(401);
  });
});

// ── GET /videos ──────────────────────────────────────────────────────────────
describe('GET /videos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists files under the calling user prefix, newest first', async () => {
    getFiles.mockResolvedValue([[
      { name: `users/${TEST_USER_ID}/loom-a.webm`, metadata: { timeCreated: '2026-04-14T10:00:00Z' } },
      { name: `users/${TEST_USER_ID}/loom-b.webm`, metadata: { timeCreated: '2026-04-15T10:00:00Z' } },
    ]]);

    const res = await request(app).get('/videos').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(getFiles).toHaveBeenCalledWith({ prefix: `users/${TEST_USER_ID}/` });
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('loom-b.webm');
    expect(res.body[1].name).toBe('loom-a.webm');
    expect(res.body[0].url).toBe(
      `https://storage.googleapis.com/test-bucket/users/${TEST_USER_ID}/loom-b.webm`,
    );
  });

  it('returns empty array when the user has no videos', async () => {
    getFiles.mockResolvedValue([[]]);
    const res = await request(app).get('/videos').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/videos');
    expect(res.status).toBe(401);
  });
});
