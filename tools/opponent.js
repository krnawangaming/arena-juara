// Lawan headless untuk pengujian UI: mengantre lalu menjawab tiap ronde.
import { io } from 'socket.io-client';
const URL = process.env.AJ_URL || 'http://localhost:3000';
const MAPEL = process.env.AJ_MAPEL || 'Matematika';
const c = io(URL, { transports: ['websocket'] });

c.on('connect', () => c.emit('player:sync', {
  playerId: 'node-opp', name: 'Lawan Bot', kelas: '10', sekolah: 'SMAN Bot', jenjang: 'SMA',
  region: { prov: '32', kab: '3273' },
}));
c.on('player:ok', () => { console.log('OPP: siap, antre…'); c.emit('queue:join', { jenjang: 'SMA', mapel: MAPEL }); });
c.on('match:start', (d) => console.log('OPP: bertanding vs', d.opponent.name));
c.on('round:start', ({ question }) => {
  console.log('OPP: ronde soal', question.id, question.type);
  const ans = question.type === 'pg' ? 0 : question.type === 'mcma' ? [0] : question.statements.map(() => false);
  setTimeout(() => c.emit('round:answer', { answer: ans }), 900);
});
c.on('round:result', (d) => console.log('OPP: hasil ronde', d.round, d.tie ? 'SERI' : 'ada pemenang'));
c.on('match:end', (d) => { console.log('OPP: selesai', d.result); process.exit(0); });
setTimeout(() => { console.log('OPP: keluar (timeout)'); process.exit(0); }, 60000);
