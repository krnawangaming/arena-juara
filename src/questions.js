// Bank soal: pemuatan, daftar mapel per jenjang, pemilihan soal, dan sanitasi.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'data', 'questions.json');

let BANK = [];
const byKey = new Map(); // `${jenjang}|${mapel}` -> [ soal ]
let persistHandler = null;

function indexQuestion(q) {
  BANK.push(q);
  const k = `${q.jenjang}|${q.mapel}`;
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(q);
}

// extra = butir tambahan (mis. dari basis data pada versi online)
export function loadQuestions(extra = []) {
  BANK = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  byKey.clear();
  for (const q of BANK) {
    const k = `${q.jenjang}|${q.mapel}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(q);
  }
  for (const q of extra) indexQuestion(q);
  return BANK.length;
}

// Penanganan penyimpanan butir baru (diatur server: ke berkas lokal atau basis data).
export function setPersistHandler(fn) { persistHandler = fn; }

export function allQuestions() {
  return BANK;
}

// Mapel yang tersedia untuk sebuah jenjang (dari isi bank soal)
export function mapelFor(jenjang) {
  const set = new Set();
  for (const q of BANK) if (q.jenjang === jenjang) set.add(q.mapel);
  return [...set].sort();
}

// Ringkasan jumlah soal per jenjang+mapel
export function summary() {
  const out = {};
  for (const q of BANK) {
    const k = `${q.jenjang} / ${q.mapel}`;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function pickRandom(arr, exclude = new Set()) {
  const pool = arr.filter((q) => !exclude.has(q.id));
  const src = pool.length ? pool : arr;
  return src[Math.floor(Math.random() * src.length)];
}

// Pilih satu soal: utamakan kesulitan sesuai level rank,
// jika tidak tersedia, melonggarkan ke level terdekat.
export function pickQuestion(jenjang, mapel, level, excludeIds = []) {
  const arr = byKey.get(`${jenjang}|${mapel}`);
  if (!arr || !arr.length) return null;
  const exclude = new Set(excludeIds);

  const exact = arr.filter((q) => (q.difficulty || 1) === level);
  if (exact.length) return pickRandom(exact, exclude);

  // cari level terdekat
  const sorted = [...arr].sort(
    (a, b) => Math.abs((a.difficulty || 1) - level) - Math.abs((b.difficulty || 1) - level)
  );
  return sorted[0] ? pickRandom(sorted.slice(0, Math.min(6, sorted.length)), exclude) : null;
}

// Buang kunci jawaban sebelum dikirim ke klien
export function sanitize(q) {
  const base = {
    id: q.id,
    jenjang: q.jenjang,
    mapel: q.mapel,
    type: q.type,
    difficulty: q.difficulty || 1,
    stimulus: q.stimulus || null,
    question: q.question,
  };
  if (q.type === 'pg' || q.type === 'mcma') {
    base.options = q.options;
    if (q.type === 'mcma') base.maxAnswers = (q.answers || []).length;
  }
  if (q.type === 'kategori') {
    base.statements = q.statements.map((s) => ({ text: s.text }));
    base.kategoriLabels = q.kategoriLabels || ['Benar', 'Salah'];
  }
  return base;
}

// Periksa jawaban siswa terhadap soal asli
export function isCorrect(q, answer) {
  if (answer === undefined || answer === null) return false;
  if (q.type === 'pg') {
    return Number(answer) === Number(q.answer);
  }
  if (q.type === 'mcma') {
    if (!Array.isArray(answer)) return false;
    const a = [...new Set(answer.map(Number))].sort();
    const b = [...new Set(q.answers.map(Number))].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  if (q.type === 'kategori') {
    if (!Array.isArray(answer)) return false;
    if (answer.length !== q.statements.length) return false;
    return q.statements.every((s, i) => Boolean(answer[i]) === Boolean(s.value));
  }
  return false;
}

// Tambah soal (mode guru): perbarui memori lalu teruskan ke penyimpanan.
export function addQuestion(q) {
  indexQuestion(q);
  if (persistHandler) {
    try { persistHandler(q); } catch (e) { console.error('[questions] gagal menyimpan butir:', e.message); }
  }
  return q;
}
