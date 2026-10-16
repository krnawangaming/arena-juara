// Arena Juara - server utama (Express + Socket.IO), siap lokal & online.
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import { Server as SocketServer } from 'socket.io';

import { CONFIG } from './src/config.js';
import { loadQuestions, mapelFor, summary, addQuestion, allQuestions, setPersistHandler } from './src/questions.js';
import { loadRegions, listProvinces, listRegencies, listDistricts, listVillages, resolveRegion } from './src/regions.js';
import { initStore, storeKind, getPlayer, upsertPlayer, allPlayers, getDB, saveNow, customQuestions, saveQuestion } from './src/store.js';
import { rankDisplay, rankRating } from './src/ranks.js';
import { initGame } from './src/game.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const app = express();
app.set('trust proxy', 1);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: ALLOWED_ORIGIN },
  maxHttpBufferSize: 1e6,
  // Deteksi koneksi mati lebih cepat agar lawan tidak menunggu lama.
  pingInterval: 20000,
  pingTimeout: 25000,
});
const game = initGame(io);

// ---- util ----
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

function safeProfile(payload) {
  const region = resolveRegion({
    prov: payload?.region?.prov,
    kab: payload?.region?.kab,
    kec: payload?.region?.kec,
    kel: payload?.region?.kel,
    kelName: payload?.region?.kelName,
  });
  return {
    name: String(payload?.name || '').slice(0, 40).trim(),
    kelas: String(payload?.kelas || '').slice(0, 20).trim(),
    sekolah: String(payload?.sekolah || '').slice(0, 80).trim(),
    jenjang: String(payload?.jenjang || '').slice(0, 8).trim(),
    region,
  };
}

// ---- Socket: sinkronisasi profil ----
io.on('connection', (socket) => {
  socket.on('player:sync', (payload) => {
    try {
      const id = String(payload?.playerId || '').slice(0, 64);
      if (!id) return socket.emit('player:error', { message: 'playerId wajib.' });
      const patch = safeProfile(payload);
      const existing = getPlayer(id);
      const player = upsertPlayer(id, patch);
      socket.data.profile = { id: player.id, name: player.name };
      socket.emit('player:ok', {
        profile: { ...player, rank: rankDisplay(player.rank) },
        isNew: !existing,
        bestOf: { need: CONFIG.ROUNDS_TO_WIN, max: CONFIG.MAX_ROUNDS },
      });
    } catch (e) {
      console.error('[player:sync]', e);
      socket.emit('player:error', { message: 'Gagal menyimpan profil.' });
    }
  });

  socket.on('player:get', (payload) => {
    const id = String(payload?.playerId || '');
    const player = getPlayer(id);
    socket.emit('player:data', player ? { ...player, rank: rankDisplay(player.rank) } : null);
  });
});

// ---- REST: kesehatan (untuk platform hosting) ----
app.get('/healthz', (_req, res) => res.json({ ok: true, store: storeKind(), ...game.stats() }));
app.get('/api/health', (_req, res) => res.json({ ok: true, store: storeKind(), ...game.stats(), soal: allQuestions().length }));

// ---- REST: wilayah ----
app.get('/api/wilayah/provinsi', (_req, res) => res.json(listProvinces()));
app.get('/api/wilayah/kabupaten', (req, res) => res.json(listRegencies(String(req.query.prov || ''))));
app.get('/api/wilayah/kecamatan', (req, res) => res.json(listDistricts(String(req.query.kab || ''))));
app.get('/api/wilayah/kelurahan', (req, res) => res.json(listVillages(String(req.query.kec || ''))));

// ---- REST: bank soal ----
app.get('/api/bank/ringkasan', (_req, res) => res.json({ total: allQuestions().length, per: summary() }));
app.get('/api/bank/mapel', (req, res) => res.json(mapelFor(String(req.query.jenjang || ''))));

app.post('/api/guru/soal', (req, res) => {
  try {
    const q = req.body || {};
    const err = validateQuestion(q);
    if (err) return res.status(400).json({ ok: false, error: err });
    const saved = addQuestion(normalizeQuestion(q));
    res.json({ ok: true, id: saved.id, total: allQuestions().length });
  } catch (e) {
    console.error('[guru/soal]', e);
    res.status(500).json({ ok: false, error: 'Gagal menyimpan soal.' });
  }
});

function validateQuestion(q) {
  if (!q.jenjang) return 'jenjang wajib (SD/SMP/SMA/SMK)';
  if (!q.mapel) return 'mapel wajib';
  if (!q.question) return 'teks soal wajib';
  if (!['pg', 'mcma', 'kategori'].includes(q.type)) return 'type harus pg/mcma/kategori';
  if ((q.type === 'pg' || q.type === 'mcma') && (!Array.isArray(q.options) || q.options.length < 2)) return 'butuh minimal 2 opsi';
  if (q.type === 'pg' && (q.answer === undefined || q.answer === null)) return 'jawaban benar (answer) wajib';
  if (q.type === 'mcma' && (!Array.isArray(q.answers) || !q.answers.length)) return 'jawaban benar (answers[]) wajib';
  if (q.type === 'kategori' && (!Array.isArray(q.statements) || !q.statements.length)) return 'pernyataan (statements[]) wajib';
  return null;
}

function normalizeQuestion(q) {
  const base = {
    id: q.id || `guru-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    jenjang: String(q.jenjang).toUpperCase(),
    mapel: String(q.mapel),
    rumpun: q.rumpun || null,
    kelas: q.kelas || null,
    difficulty: Math.min(5, Math.max(1, Number(q.difficulty) || 1)),
    type: q.type,
    stimulus: q.stimulus || null,
    question: String(q.question),
    pembahasan: q.pembahasan || '',
    sumber: 'guru',
  };
  if (q.type === 'pg') {
    base.options = q.options.map(String);
    base.answer = Number(q.answer);
  } else if (q.type === 'mcma') {
    base.options = q.options.map(String);
    base.answers = q.answers.map(Number);
  } else {
    base.statements = q.statements.map((s) => ({ text: String(s.text), value: !!s.value }));
    base.kategoriLabels = q.kategoriLabels || ['Benar', 'Salah'];
  }
  return base;
}

// ---- REST: papan peringkat berjenjang ----
app.get('/api/papan', (req, res) => {
  const scope = String(req.query.scope || 'nasional');
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const jenjang = String(req.query.jenjang || '');
  const players = allPlayers().filter((p) => (p.stats?.matches || 0) > 0);

  const match = (p) => {
    if (jenjang && p.jenjang !== jenjang) return false;
    const r = p.region || {};
    switch (scope) {
      case 'nasional': return true;
      case 'provinsi': return r.provId === String(req.query.prov || '');
      case 'kota': return r.kabId === String(req.query.kab || '');
      case 'kecamatan': return r.kecId === String(req.query.kec || '');
      case 'kelurahan': return r.kelId === String(req.query.kel || '');
      case 'sekolah': return norm(p.sekolah) === norm(req.query.sekolah || '');
      case 'kelas':
        return norm(p.sekolah) === norm(req.query.sekolah || '') && norm(p.kelas) === norm(req.query.kelas || '') && (!jenjang || p.jenjang === jenjang);
      default: return true;
    }
  };

  const rows = players
    .filter(match)
    .map((p) => ({
      id: p.id,
      name: p.name,
      kelas: p.kelas,
      sekolah: p.sekolah,
      jenjang: p.jenjang,
      regionName: [p.region?.kelName, p.region?.kecName, p.region?.kabName, p.region?.provName].filter(Boolean).join(', '),
      rank: rankDisplay(p.rank),
      rating: rankRating(p.rank),
      poin: p.stats?.poin || 0,
      wins: p.stats?.wins || 0,
      losses: p.stats?.losses || 0,
      matches: p.stats?.matches || 0,
      winrate: p.stats?.matches ? Math.round(((p.stats.wins || 0) / p.stats.matches) * 100) : 0,
    }))
    .sort((a, b) => b.rating - a.rating || b.poin - a.poin || b.wins - a.wins);

  res.json({ scope, total: rows.length, rows: rows.slice(0, limit) });
});

app.get('/api/pertandingan/terbaru', (_req, res) => {
  res.json(getDB().matches.slice(-20).reverse());
});

app.post('/api/simpan', async (_req, res) => {
  await saveNow();
  res.json({ ok: true });
});

// ---- mulai ----
async function main() {
  const storeInfo = await initStore();
  setPersistHandler((q) => saveQuestion(q));
  const regionStats = loadRegions();
  const questionCount = loadQuestions(customQuestions());

  console.log(`[data] penyimpanan: ${storeInfo.kind} -> ${JSON.stringify(storeInfo)}`);
  console.log(`[data] wilayah: ${JSON.stringify(regionStats)}`);
  console.log(`[data] bank soal: ${questionCount} butir`);

  server.listen(PORT, '0.0.0.0', () => {
    const ips = [];
    for (const list of Object.values(os.networkInterfaces())) {
      for (const ni of list || []) if (ni.family === 'IPv4' && !ni.internal) ips.push(ni.address);
    }
    console.log('');
    console.log('  ===============================================');
    console.log('   ARENA JUARA - Duel TKA (Best of 5)');
    console.log('  ===============================================');
    console.log(`   Lokal    : http://localhost:${PORT}`);
    for (const ip of ips) console.log(`   Jaringan : http://${ip}:${PORT}  (buka di HP siswa)`);
    console.log('');
  });
}

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[server] mematikan… menyimpan data.');
  try { game.stop(); } catch {}
  server.close();
  await saveNow();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((e) => {
  console.error('[server] gagal start:', e);
  process.exit(1);
});
