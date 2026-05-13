import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './pool.js';

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');

export async function migrate() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Insert the marker first; if another instance already applied it, the unique PK
      // raises and we roll back without re-running the SQL.
      try {
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      } catch (err) {
        if (err.code === '23505') {
          await client.query('ROLLBACK');
          continue;
        }
        throw err;
      }
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`migration ${file} applied`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}
