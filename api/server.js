// Must run before any other import so DATABASE_URL / BUCKET_NAME / etc.
// are populated before route modules instantiate clients at module load.
// No-op in production where no .env file is present.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { authRouter } from './src/routes/auth.js';
import { videosRouter } from './src/routes/videos.js';
import { requireAuth } from './src/middleware/requireAuth.js';
import { migrate } from './src/db/migrate.js';

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/auth', authRouter);
app.use(requireAuth);
app.use('/', videosRouter);

export { app };

// Only bind the port when run directly (not when imported by tests)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  await migrate();
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`loom-api listening on :${PORT}`));
}
