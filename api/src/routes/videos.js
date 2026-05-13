import express from 'express';
import { Storage } from '@google-cloud/storage';

const router = express.Router();
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);

function sanitizeFilename(name) {
  if (typeof name !== 'string' || name.length === 0) return null;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return null;
  return name;
}

// POST /sign-upload
// Body: { filename: string, contentType: string }
// Response: { uploadUrl: string, publicUrl: string }
router.post('/sign-upload', async (req, res) => {
  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'Missing required fields: filename, contentType' });
  }

  const safeName = sanitizeFilename(filename);
  if (!safeName) return res.status(400).json({ error: 'Invalid filename' });

  const objectName = `users/${req.user.id}/${safeName}`;

  const [uploadUrl] = await bucket.file(objectName).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${objectName}`;
  res.json({ uploadUrl, publicUrl });
});

// GET /videos
// Response: [{ name: string, url: string, created: string }]
router.get('/videos', async (req, res) => {
  const prefix = `users/${req.user.id}/`;
  const [files] = await bucket.getFiles({ prefix });
  const items = files
    .map(f => ({
      name: f.name.slice(prefix.length),
      url: `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${f.name}`,
      created: f.metadata.timeCreated,
    }))
    .sort((a, b) => new Date(b.created) - new Date(a.created));
  res.json(items);
});

export { router as videosRouter };
