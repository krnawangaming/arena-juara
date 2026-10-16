// Backend penyimpanan berbasis berkas JSON.
// Cocok untuk lokal maupun hosting dengan volume tetap (mis. Fly.io/Railway volume).
// Lokasi berkas dapat diatur lewat DATA_DIR (mis. DATA_DIR=/data).
import fs from 'node:fs';
import path from 'node:path';

export function createJsonBackend(dataDir) {
  const file = path.join(dataDir, 'db.json');
  const state = { players: {}, matches: [], questions: [] };
  let timer = null;

  function writeNow() {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(state));
      fs.renameSync(tmp, file);
    } catch (e) {
      console.error('[store:json] gagal menulis:', e.message);
    }
  }
  function scheduleWrite() {
    if (timer) return;
    timer = setTimeout(() => { timer = null; writeNow(); }, 400);
  }

  return {
    kind: 'json',
    async init() {
      fs.mkdirSync(dataDir, { recursive: true });
      if (fs.existsSync(file)) {
        try {
          const s = JSON.parse(fs.readFileSync(file, 'utf8'));
          state.players = s.players || {};
          state.matches = s.matches || [];
          state.questions = s.questions || [];
        } catch (e) {
          console.error('[store:json] db.json rusak, membuat baru:', e.message);
        }
      }
      console.log(`[store:json] data: ${file}`);
    },
    async loadPlayers() { return Object.values(state.players); },
    async loadMatches() { return state.matches.slice(); },
    async loadQuestions() { return state.questions.slice(); },
    async savePlayer(p) { state.players[p.id] = p; scheduleWrite(); },
    async saveMatch(m) {
      state.matches.push(m);
      if (state.matches.length > 2000) state.matches.splice(0, state.matches.length - 2000);
      scheduleWrite();
    },
    async saveQuestion(q) { state.questions.push(q); scheduleWrite(); },
    async flush() { if (timer) { clearTimeout(timer); timer = null; } writeNow(); },
  };
}
