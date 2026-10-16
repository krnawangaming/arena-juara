// Facade penyimpanan: menyimpan state di memori (dibaca sinkron oleh mesin game),
// lalu menuliskannya ke backend terpilih (berkas JSON atau PostgreSQL).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsonBackend } from './storage/json.js';
import { CONFIG } from './config.js';
import { defaultEquipped, freeItemIds, sanitizeCosmetics } from './cosmetics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.join(__dirname, '..', 'data');

let backend = null;
const db = { players: {}, matches: [], questions: [] };
let writes = Promise.resolve();

function enqueue(fn) {
  writes = writes.then(fn).catch((e) => console.error('[store]', e.message));
}

function defaultPlayer(id) {
  return {
    id, name: '', kelas: '', sekolah: '', jenjang: '', region: {},
    rank: { t: 0, d: 0, s: 0, shield: 0 },
    stats: { matches: 0, wins: 0, losses: 0, roundsWon: 0, roundsLost: 0, poin: 0 },
    wallet: { coins: CONFIG.COIN_START },
    level: 1, xp: 0,
    cosmetics: { owned: freeItemIds(), equipped: defaultEquipped() },
    created: Date.now(), lastSeen: Date.now(), history: [],
  };
}

// Lengkapi pemain lama (data yang belum punya koin/kosmetik/level)
function normalizePlayer(p) {
  if (!p || typeof p !== 'object') return p;
  p.rank = p.rank && typeof p.rank === 'object' ? p.rank : { t: 0, d: 0, s: 0, shield: 0 };
  p.stats = p.stats && typeof p.stats === 'object'
    ? p.stats
    : { matches: 0, wins: 0, losses: 0, roundsWon: 0, roundsLost: 0, poin: 0 };
  if (!p.wallet || typeof p.wallet.coins !== 'number') p.wallet = { coins: CONFIG.COIN_START };
  if (typeof p.level !== 'number' || p.level < 1) p.level = 1;
  if (typeof p.xp !== 'number' || p.xp < 0) p.xp = 0;
  p.cosmetics = sanitizeCosmetics(p.cosmetics);
  if (!Array.isArray(p.history)) p.history = [];
  return p;
}


// Muat semua data dari backend. Dipanggil sekali saat server start.
export async function initStore() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (url) {
    const { createPgBackend } = await import('./storage/postgres.js');
    backend = createPgBackend(url);
  } else {
    backend = createJsonBackend((process.env.DATA_DIR || DEFAULT_DIR));
  }
  await backend.init();

  const [players, matches, questions] = await Promise.all([
    backend.loadPlayers(), backend.loadMatches(), backend.loadQuestions(),
  ]);
  for (const p of players) if (p && p.id) db.players[p.id] = normalizePlayer(p);
  db.matches = matches || [];
  db.questions = questions || [];

  return { kind: backend.kind, players: Object.keys(db.players).length, matches: db.matches.length, questions: db.questions.length };
}

export function storeKind() { return backend ? backend.kind : 'none'; }
export function getDB() { return db; }
export function getPlayer(id) { return db.players[id] || null; }
export function allPlayers() { return Object.values(db.players); }
export function customQuestions() { return db.questions; }

export function upsertPlayer(id, patch) {
  const cur = db.players[id] || defaultPlayer(id);
  Object.assign(cur, patch);
  cur.lastSeen = Date.now();
  normalizePlayer(cur);
  db.players[id] = cur;
  const snapshot = structuredClone(cur);
  enqueue(() => backend.savePlayer(snapshot));
  return cur;
}

export function recordMatch(record) {
  db.matches.push(record);
  if (db.matches.length > 2000) db.matches.splice(0, db.matches.length - 2000);
  for (const pid of [record.p1, record.p2]) {
    const p = db.players[pid];
    if (p) {
      p.history = p.history || [];
      p.history.unshift({
        at: record.at,
        opponent: pid === record.p1 ? record.p2Name : record.p1Name,
        result: pid === record.winner ? 'menang' : 'kalah',
        rounds: record.rounds,
      });
      if (p.history.length > 30) p.history.length = 30;
      const snapshot = structuredClone(p);
      enqueue(() => backend.savePlayer(snapshot));
    }
  }
  enqueue(() => backend.saveMatch(record));
}

export function saveQuestion(q) {
  db.questions.push(q);
  enqueue(() => backend.saveQuestion(q));
}

// Tulis semua antrean + flush backend (dipakai saat mematikan server).
export async function saveNow() {
  try {
    await writes;
    if (backend) await backend.flush();
  } catch (e) {
    console.error('[store] flush gagal:', e.message);
  }
}
