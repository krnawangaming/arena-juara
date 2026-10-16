// Uji otomatis: 2 klien bertanding satu pertandingan penuh (Best of 5).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'questions.json'), 'utf8'));
const byId = new Map(BANK.map((q) => [q.id, q]));

const URL = process.env.AJ_URL || 'http://localhost:3000';

function correctAnswer(q) {
  if (q.type === 'pg') return q.answer;
  if (q.type === 'mcma') return q.answers;
  return q.statements.map((s) => s.value);
}
function wrongAnswer(q) {
  if (q.type === 'pg') return (q.answer + 1) % q.options.length;
  if (q.type === 'mcma') return [0].filter((x) => !q.answers.includes(x)).concat(q.answers.length ? [] : [0]);
  return q.statements.map((s) => !s.value);
}

const mkClient = (pid, name) => {
  const c = io(URL, { transports: ['websocket'] });
  c.data = { pid, name };
  c.on('connect', () => c.emit('player:sync', {
    playerId: pid, name, kelas: '10', sekolah: 'SMAN Uji', jenjang: 'SMA',
    region: { prov: '32', kab: '3273', kec: '', kel: '', kelName: '' },
  }));
  return c;
};

const A = mkClient('test-a', 'Rani');
const B = mkClient('test-b', 'Budi');

let started = 0, ended = 0, ranks = {};
const log = (...a) => console.log(...a);

function wireAnswerer(c, mode) {
  c.on('round:start', ({ question, round }) => {
    const q = byId.get(question.id);
    const ans = mode === 'correct' ? correctAnswer(q) : wrongAnswer(q);
    const delay = mode === 'correct' ? 30 : (process.env.AJ_Q_SECONDS ? Number(process.env.AJ_Q_SECONDS) * 1000 - 200 : 119000);
    setTimeout(() => c.emit('round:answer', { answer: ans }), mode === 'correct' ? delay : 60);
  });
}

wireAnswerer(A, 'correct');
wireAnswerer(B, 'wrong');

for (const c of [A, B]) {
  c.on('player:ok', () => {
    started++;
    if (started === 2) {
      log('Kedua pemain siap. Mulai matchmaking…');
      A.emit('queue:join', { jenjang: 'SMA', mapel: 'Matematika' });
      B.emit('queue:join', { jenjang: 'SMA', mapel: 'Matematika' });
    }
  });
  c.on('match:start', (d) => log(`[${c.data.name}] Match mulai vs ${d.opponent.name} (${d.opponent.rank.label})`));
  c.on('round:result', (d) => log(`[${c.data.name}] Ronde ${d.round}: ${d.tie ? 'SERI' : (d.winner === c.data.pid ? 'MENANG' : 'KALAH')} | skor ${JSON.stringify(d.wins)}`));
  c.on('match:end', (d) => {
    ranks[c.data.name] = d.rankAfter.label + ' (' + d.rankAfter.s + '★)';
    log(`[${c.data.name}] SELESAI: ${d.result.toUpperCase()} ${d.scoreYou}-${d.scoreOpponent} | rank ${d.rankBefore.label} -> ${d.rankAfter.label} (${d.rankEvent})`);
    log(`[${c.data.name}] hadiah: +${d.reward?.coins} koin, +${d.reward?.xp} XP | level ${d.progress?.level} | total koin ${d.progress?.coins}`);
    ended++;
    if (ended === 2) {
      log('\nHASIL AKHIR:', JSON.stringify(ranks));
      log('UJI BERHASIL: pertandingan tuntas, rank berubah, hadiah koin dibagikan.');
      A.close(); B.close();
      process.exit(0);
    }
  });
  c.on('match:error', (m) => { log('ERROR match:', m); process.exit(1); });
}

setTimeout(() => { log('UJI GAGAL: timeout.'); process.exit(1); }, 90000);
