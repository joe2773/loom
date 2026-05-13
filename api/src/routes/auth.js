import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db/pool.js';

const router = express.Router();
const googleClient = new OAuth2Client();

router.post('/google', async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const jwtSecret = process.env.JWT_SECRET;
  if (!clientId || !jwtSecret) return res.status(500).json({ error: 'Auth not configured' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google ID token' });
  }

  if (!payload?.email_verified) {
    return res.status(401).json({ error: 'Google account email is not verified' });
  }

  const { sub: googleSub, email, name = null, picture = null } = payload;

  const { rows } = await query(
    `INSERT INTO users (google_sub, email, name, picture)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_sub) DO UPDATE
       SET email = EXCLUDED.email,
           name = EXCLUDED.name,
           picture = EXCLUDED.picture,
           updated_at = now()
     RETURNING id, email, name, picture`,
    [googleSub, email, name, picture],
  );
  const user = rows[0];

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });

  res.json({ token, user });
});

export { router as authRouter };
