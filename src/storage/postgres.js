// Backend penyimpanan PostgreSQL (untuk versi online yang tahan lama / multi-instance).
// Diaktifkan otomatis bila environment variable DATABASE_URL diisi.
import pg from 'pg';

const { Pool } = pg;

function useSsl(connectionString) {
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (/localhost|127\.0\.0\.1|@db[:/]/i.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

export function createPgBackend(connectionString) {
  const pool = new Pool({ connectionString, ssl: useSsl(connectionString), max: 5 });
  // Semua penulisan diserialkan agar tidak bentrok.
  let chain = Promise.resolve();
  const run = (text, params) => {
    chain = chain.then(() => pool.query(text, params)).catch((e) => console.error('[store:pg]', e.message));
    return chain;
  };

  return {
    kind: 'postgres',
    async init() {
      const statements = [
        'CREATE TABLE IF NOT EXISTS players (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz DEFAULT now())',
        'CREATE TABLE IF NOT EXISTS matches (id text PRIMARY KEY, at bigint, data jsonb NOT NULL)',
        'CREATE TABLE IF NOT EXISTS questions (id text PRIMARY KEY, data jsonb NOT NULL)',
      ];
      let attempt = 0;
      for (;;) {
        try {
          for (const s of statements) await pool.query(s);
          break;
        } catch (e) {
          attempt += 1;
          if (attempt >= 6) throw e;
          console.warn(`[store:pg] init gagal (percobaan ${attempt}/5): ${e.message} — coba lagi 3 detik…`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      console.log('[store:pg] tersambung & skema siap.');
    },
    async loadPlayers() {
      const r = await pool.query('SELECT data FROM players');
      return r.rows.map((x) => x.data);
    },
    async loadMatches() {
      const r = await pool.query('SELECT data FROM matches ORDER BY at DESC NULLS LAST LIMIT 2000');
      return r.rows.map((x) => x.data).reverse();
    },
    async loadQuestions() {
      const r = await pool.query('SELECT data FROM questions');
      return r.rows.map((x) => x.data);
    },
    savePlayer(p) {
      return run(
        'INSERT INTO players (id, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()',
        [p.id, p]
      );
    },
    saveMatch(m) {
      return run('INSERT INTO matches (id, at, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [m.id, m.at || Date.now(), m]);
    },
    saveQuestion(q) {
      return run('INSERT INTO questions (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [q.id, q]);
    },
    async flush() { await chain; },
  };
}
