import pg from 'pg';

const { Pool } = pg;

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;
  const host = process.env.DB_HOST;
  if (user && password && name && host) {
    return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@/${name}?host=${host}`;
  }
  throw new Error('Database not configured: set DATABASE_URL or DB_USER/DB_PASSWORD/DB_NAME/DB_HOST');
}

let pool;

export function getPool() {
  if (!pool) pool = new Pool({ connectionString: buildConnectionString() });
  return pool;
}

export function query(text, params) {
  return getPool().query(text, params);
}
