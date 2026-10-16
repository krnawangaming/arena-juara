// Uji end-to-end backend PostgreSQL.
// Pakai:
//   $env:DATABASE_URL="postgres://user:pass@host:5432/db"; npm run test:pg
//    (atau buat berkas .env lalu: node --env-file=.env tools/test-postgres.js)
// Menulis 1 pemain uji + 1 soal + 1 pertandingan, membacanya kembali, lalu melaporkan hasil.
// Pemain uji memakai stats.matches = 0 sehingga TIDAK muncul di papan peringkat.
import { createPgBackend } from '../src/storage/postgres.js';

const url = (process.env.DATABASE_URL || '').trim();
if (!url) {
  console.error('DATABASE_URL belum diisi.\nContoh (PowerShell):\n  $env:DATABASE_URL="postgres://user:pass@host:5432/db"; npm run test:pg');
  process.exit(2);
}

const stamp = Date.now();
const pid = 'uji-' + stamp;
const backend = createPgBackend(url);

try {
  console.log('1) init skema…');
  await backend.init();

  console.log('2) tulis data uji…');
  await backend.savePlayer({
    id: pid, name: 'Pemain Uji', kelas: '10', sekolah: 'SEKOLAH UJI', jenjang: 'SMA',
    rank: { t: 1, d: 0, s: 2, shield: 1 },
    stats: { matches: 0, wins: 0, losses: 0, roundsWon: 0, roundsLost: 0, poin: 0 },
    history: [],
  });
  await backend.saveQuestion({
    id: 'q-' + pid, jenjang: 'SMA', mapel: 'Matematika', type: 'pg',
    question: 'UJI PG: 2+2 = ?', options: ['3', '4'], answer: 1, difficulty: 1,
  });
  await backend.saveMatch({ id: 'm-' + pid, at: stamp, p1: pid, p2: 'uji-lawan', winner: pid, rounds: { [pid]: 3 } });
  await backend.flush();

  console.log('3) baca kembali…');
  const players = await backend.loadPlayers();
  const questions = await backend.loadQuestions();
  const matches = await backend.loadMatches();
  const found = players.find((p) => p.id === pid);
  const foundQ = questions.find((q) => q.id === 'q-' + pid);
  const foundM = matches.find((m) => m.id === 'm-' + pid);

  console.log('   players  :', players.length, '| ditemukan:', !!found);
  console.log('   questions:', questions.length, '| ditemukan:', !!foundQ);
  console.log('   matches  :', matches.length, '| ditemukan:', !!foundM);

  const ok = !!found && found.rank && found.rank.s === 2 && !!foundQ && !!foundM;
  console.log('\nHASIL:', ok ? 'OK — PostgreSQL berfungsi (tulis & baca cocok).' : 'GAGAL — data tidak sesuai.');
  console.log('Bersihkan baris uji (opsional):');
  console.log(`  DELETE FROM players WHERE id = '${pid}';`);
  console.log(`  DELETE FROM questions WHERE id = 'q-${pid}';`);
  console.log(`  DELETE FROM matches WHERE id = 'm-${pid}';`);
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('\nGAGAL terhubung/menulis:', e.message);
  console.error('Periksa: connection string, SSL (biasanya perlu sslmode=require), dan IP allowlist DB.');
  process.exit(1);
}
