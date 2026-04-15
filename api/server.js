import express from 'express';
import cors from 'cors';
import { Storage } from '@google-cloud/storage';

const app = express();
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);

app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// POST /sign-upload
// Body: { filename: string, contentType: string }
// Response: { uploadUrl: string, publicUrl: string }
app.post('/sign-upload', async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'Missing required fields: filename, contentType' });
  }

  const [uploadUrl] = await bucket.file(filename).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${filename}`;
  res.json({ uploadUrl, publicUrl });
});

// GET /videos
// Response: [{ name: string, url: string, created: string }]
app.get('/videos', async (_req, res) => {
  const [files] = await bucket.getFiles();
  const items = files
    .map(f => ({
      name: f.name,
      url: `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${f.name}`,
      created: f.metadata.timeCreated,
    }))
    .sort((a, b) => new Date(b.created) - new Date(a.created));
  res.json(items);
});

export { app };

// Only bind the port when run directly (not when imported by tests)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`loom-api listening on :${PORT}`));
}
