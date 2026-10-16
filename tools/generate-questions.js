// Generator butir soal numerik (Matematika, IPA/IPAS, Fisika) untuk menambah volume bank soal.
// Butir dibuat dari templat dengan angka acak + pengecoh, lalu ditambahkan bila belum ada (anti-duplikat).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'data', 'questions.json');
const BANK = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const seen = new Set(BANK.map((q) => q.jenjang + '|' + q.mapel + '|' + q.question));

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let counter = 0;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);

function add({ jenjang, mapel, difficulty, type = 'pg', stimulus = null, question, options, answer, answers, statements, kategoriLabels, pembahasan, rumpun = null }) {
  const key = jenjang + '|' + mapel + '|' + question;
  if (seen.has(key)) return false;
  seen.add(key);
  const q = {
    id: `gen-${slug(jenjang)}-${slug(mapel)}-${String(++counter).padStart(4, '0')}`,
    jenjang, mapel, rumpun, kelas: null, difficulty, type, stimulus, question, pembahasan,
    sumber: 'generator',
  };
  if (type === 'pg') { q.options = options.map(String); q.answer = answer; }
  else if (type === 'mcma') { q.options = options.map(String); q.answers = answers; }
  else { q.statements = statements; q.kategoriLabels = kategoriLabels || ['Benar', 'Salah']; }
  BANK.push(q);
  return true;
}

// Buat 4 opsi PG dari jawaban benar + beberapa pengecoh
function pgOptions(correct, wrongs) {
  const set = new Set([String(correct)]);
  for (const w of wrongs) { if (set.size >= 4) break; if (String(w) !== String(correct) && w !== null && w !== undefined) set.add(String(w)); }
  let bump = 1;
  while (set.size < 4) { set.add(String(Number(correct) + bump * (Math.random() < 0.5 ? 1 : -1))); bump++; }
  const options = [...set];
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { options, answer: options.indexOf(String(correct)) };
}

const TARGET = Number(process.env.AJ_TARGET || 50);

function fill(jenjang, mapel, difficulty, fn) {
  let made = 0, tries = 0;
  while (made < TARGET && tries < TARGET * 12) {
    tries++;
    if (fn(jenjang, mapel, difficulty)) made++;
  }
  return made;
}

/* ================= SD ================= */
const sdTemplates = [
  (j, m, d) => {
    const a = ri(15, 89), b = ri(15, 89);
    const correct = a + b;
    const { options, answer } = pgOptions(correct, [correct + 10, correct - 10, correct + 1]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Hasil dari ${a} + ${b} adalah ...`, options, answer, pembahasan: `${a} + ${b} = ${correct}.` });
  },
  (j, m, d) => {
    const a = ri(30, 149), b = ri(11, 39);
    const correct = a - b;
    const { options, answer } = pgOptions(correct, [correct + 10, correct - 1, a + b]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Hasil dari ${a} - ${b} adalah ...`, options, answer, pembahasan: `${a} - ${b} = ${correct}.` });
  },
  (j, m, d) => {
    const a = ri(6, 15), b = ri(3, 9);
    const correct = a * b;
    const { options, answer } = pgOptions(correct, [correct + b, correct - b, a + b]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Hasil dari ${a} x ${b} adalah ...`, options, answer, pembahasan: `${a} x ${b} = ${correct}.` });
  },
  (j, m, d) => {
    const b = ri(3, 9), c = ri(4, 12), a = b * c;
    const { options, answer } = pgOptions(c, [c + 1, c - 1, b]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Hasil dari ${a} : ${b} adalah ...`, options, answer, pembahasan: `${a} : ${b} = ${c}.` });
  },
  (j, m, d) => {
    const p = ri(6, 20), l = ri(3, 12);
    const correct = p * l;
    const { options, answer } = pgOptions(correct, [2 * (p + l), p + l, correct + p]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Luas persegi panjang dengan panjang ${p} cm dan lebar ${l} cm adalah ... cm2`, options, answer, pembahasan: `Luas = p x l = ${p} x ${l} = ${correct} cm2.` });
  },
  (j, m, d) => {
    const s = ri(4, 25);
    const correct = 4 * s;
    const { options, answer } = pgOptions(correct, [s * s, 2 * s, correct + 4]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Keliling persegi dengan panjang sisi ${s} cm adalah ... cm`, options, answer, pembahasan: `Keliling = 4 x sisi = 4 x ${s} = ${correct} cm.` });
  },
  (j, m, d) => {
    const a = ri(2, 9), b = ri(1, 9) * 10;
    const correct = a * 100 + b;
    const { options, answer } = pgOptions(correct, [a * 10 + b, correct + 100, correct - 10]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Berapa cm-kah ${a} meter ${b} cm?`, options, answer, pembahasan: `${a} m = ${a * 100} cm, ditambah ${b} cm = ${correct} cm.` });
  },
  (j, m, d) => {
    const a = ri(2, 6), b = ri(2, 6);
    const small = Math.min(a, b), big = Math.max(a, b);
    const gcd = (x, y) => (y ? gcd(y, x % y) : x);
    const g = gcd(a, b);
    const correct = `${a / g}/${b / g}`;
    const wrongs = [`${a}/${b}`, `${b / g}/${a / g}`, `${a + 1}/${b}`];
    const options = [...new Set([correct, ...wrongs])].slice(0, 4);
    while (options.length < 4) options.push(`${a + options.length}/${b}`);
    const answer = options.indexOf(correct);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Bentuk paling sederhana dari pecahan ${a}/${b} adalah ...`, options, answer, pembahasan: `FPB(${a}, ${b}) = ${g}, sehingga ${a}/${b} = ${correct}.` });
  },
  (j, m, d) => {
    const primes = [2, 3, 5, 7, 11, 13];
    const chosen = [pick(primes), ri(4, 20), ri(4, 20), pick(primes)];
    const opts = [...new Set(chosen)].slice(0, 5);
    if (opts.length < 4) return false;
    const answers = opts.map((v, i) => (primes.includes(v) ? i : -1)).filter((i) => i >= 0);
    if (!answers.length) return false;
    return add({ jenjang: j, mapel: m, difficulty: d, type: 'mcma', question: 'Pilih semua bilangan prima dari daftar berikut!', options: opts, answers, pembahasan: 'Bilangan prima hanya habis dibagi 1 dan dirinya sendiri.' });
  },
];

/* ================= SMP ================= */
const smpTemplates = [
  (j, m, d) => {
    const a = ri(5, 40), b = ri(-40, -5);
    const correct = a + b;
    const { options, answer } = pgOptions(correct, [a - b, -correct, correct + 10]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Hasil dari ${a} + (${b}) adalah ...`, options, answer, pembahasan: `${a} + (${b}) = ${correct}.` });
  },
  (j, m, d) => {
    const a = ri(2, 9), x = ri(2, 15), b = ri(1, 20);
    const c = a * x + b;
    const { options, answer } = pgOptions(x, [x + 1, x - 1, c - b]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Nilai x yang memenuhi ${a}x + ${b} = ${c} adalah ...`, options, answer, pembahasan: `${a}x = ${c - b}, maka x = ${x}.` });
  },
  (j, m, d) => {
    const x1 = ri(1, 5), x2 = x1 + ri(1, 4), y1 = ri(1, 9), gr = ri(1, 4), y2 = y1 + gr * (x2 - x1);
    const { options, answer } = pgOptions(gr, [gr + 1, x2 - x1, y2 - y1]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Gradien garis yang melalui titik (${x1},${y1}) dan (${x2},${y2}) adalah ...`, options, answer, pembahasan: `m = (${y2}-${y1})/(${x2}-${x1}) = ${gr}.` });
  },
  (j, m, d) => {
    const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
    const { options, answer } = pgOptions(t[2], [t[0] + t[1], t[2] + 1, t[2] - 1]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Segitiga siku-siku memiliki sisi tegak ${t[0]} cm dan ${t[1]} cm. Panjang sisi miringnya adalah ... cm`, options, answer, pembahasan: `akar(${t[0]}^2 + ${t[1]}^2) = ${t[2]} cm.` });
  },
  (j, m, d) => {
    const n = 5, nums = Array.from({ length: n }, () => ri(4, 20));
    const sum = nums.reduce((a, b) => a + b, 0);
    if (sum % n !== 0) { nums[0] += n - (sum % n); }
    const total = nums.reduce((a, b) => a + b, 0);
    const correct = total / n;
    const { options, answer } = pgOptions(correct, [correct + 1, correct - 1, total]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Rata-rata dari data ${nums.join(', ')} adalah ...`, options, answer, pembahasan: `Jumlah = ${total}, banyak data = ${n}, rata-rata = ${correct}.` });
  },
  (j, m, d) => {
    const p = pick([10, 15, 20, 25, 40]), n = pick([20000, 25000, 40000, 50000]);
    const correct = (p * n) / 100;
    const { options, answer } = pgOptions(correct, [correct * 2, correct / 2, n - correct]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `${p}% dari Rp${n.toLocaleString('id-ID')} adalah ...`, options, answer, pembahasan: `${p}% x ${n} = ${correct}.` });
  },
  (j, m, d) => {
    const r = pick([7, 14, 21]);
    const correct = Math.round((22 / 7) * r * r);
    const { options, answer } = pgOptions(correct, [Math.round((22 / 7) * 2 * r), correct + r, Math.round((22 / 7) * r)]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Luas lingkaran dengan jari-jari ${r} cm (phi = 22/7) adalah ... cm2`, options, answer, pembahasan: `Luas = phi x r^2 = 22/7 x ${r * r} = ${correct} cm2.` });
  },
  (j, m, d) => {
    const a = ri(2, 6), b = ri(-8, -2);
    const correct = a * b;
    const { options, answer } = pgOptions(correct, [-correct, a + b, correct + a]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Hasil dari ${a} x (${b}) adalah ...`, options, answer, pembahasan: `Positif x negatif = negatif, hasilnya ${correct}.` });
  },
];

/* ================= SMA ================= */
const smaTemplates = [
  (j, m, d) => {
    const a = ri(2, 5), p = ri(2, 6), q = ri(2, 6);
    const correct = `a^${p + q}`;
    const options = [`a^${p * q}`, `a^${p + q}`, `a^${Math.abs(p - q)}`, `${a}a^${p + q}`].map((s) => s.replace('a', a));
    const answer = options.indexOf(`${a}^${p + q}`);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Bentuk sederhana dari ${a}^${p} x ${a}^${q} adalah ...`, options, answer, pembahasan: `a^m x a^n = a^(m+n) = ${a}^${p + q}.` });
  },
  (j, m, d) => {
    const e = ri(2, 4), correct = e;
    const { options, answer } = pgOptions(correct, [e * 2, e - 1, e + 2]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Nilai dari log ${10 ** e} (basis 10) adalah ...`, options, answer, pembahasan: `10^${e} = ${10 ** e}, maka log ${10 ** e} = ${e}.` });
  },
  (j, m, d) => {
    const a = ri(2, 7), b = ri(2, 9), n = ri(6, 15);
    const correct = a + (n - 1) * b;
    const { options, answer } = pgOptions(correct, [a + n * b, correct + b, correct - b]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Suku ke-${n} barisan aritmetika ${a}, ${a + b}, ${a + 2 * b}, ... adalah ...`, options, answer, pembahasan: `Un = a + (n-1)b = ${a} + ${n - 1}x${b} = ${correct}.` });
  },
  (j, m, d) => {
    const a = ri(2, 6), n = ri(2, 4);
    const correct = `${a * n}x^${n - 1}`;
    const options = [`${a}x^${n - 1}`, `${a * n}x^${n}`, `${a * n}x^${n - 1}`, `${n}x^${n - 1}`];
    const uniq = [...new Set(options)];
    const answer = uniq.indexOf(correct);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Turunan pertama dari f(x) = ${a}x^${n} adalah ...`, options: uniq.length >= 2 ? uniq : options, answer, pembahasan: `f'(x) = ${a * n}x^${n - 1}.` });
  },
  (j, m, d) => {
    const correct = '1/2';
    const options = ['1/2', '1/3', '1/4', '2/3'];
    const answer = options.indexOf(correct);
    return add({ jenjang: j, mapel: m, difficulty: d, question: 'Peluang munculnya sisi angka pada pelemparan satu koin seimbang adalah ...', options, answer, pembahasan: 'Ada 2 kemungkinan sama besar, peluang angka = 1/2.' });
  },
  (j, m, d) => {
    const a = ri(2, 9), b = ri(1, 12);
    const correct = b / a;
    const { options, answer } = pgOptions(correct, [a / b, correct + 1, -correct]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Gradien garis ${a}y = ${b} adalah ...`, options, answer, pembahasan: `y = ${b}/${a}, gradien = ${correct}.` });
  },
];

/* ================= IPA / Fisika / IPAS numerik ================= */
const ipaTemplates = [
  (j, m, d) => {
    const s = ri(20, 200), t = ri(2, 20), correct = s / t;
    const { options, answer } = pgOptions(correct, [s * t, correct + 1, s - t]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Sebuah benda menempuh jarak ${s} m dalam ${t} sekon. Kecepatan rata-ratanya adalah ... m/s`, options, answer, pembahasan: `v = s/t = ${s}/${t} = ${correct} m/s.` });
  },
  (j, m, d) => {
    const mass = ri(2, 20), v = ri(1, 10);
    const correct = mass * v;
    const { options, answer } = pgOptions(correct, [mass + v, correct * 2, mass * v / 2]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Momentum benda bermassa ${mass} kg yang bergerak dengan kecepatan ${v} m/s adalah ... kg.m/s`, options, answer, pembahasan: `p = m.v = ${mass} x ${v} = ${correct}.` });
  },
  (j, m, d) => {
    const mass = ri(2, 8), g = 10, correct = mass * g;
    const { options, answer } = pgOptions(correct, [mass, correct * 2, mass + g]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Berat benda bermassa ${mass} kg (g = 10 m/s^2) adalah ... N`, options, answer, pembahasan: `w = m.g = ${mass} x 10 = ${correct} N.` });
  },
  (j, m, d) => {
    const mass = ri(2, 12), v = ri(1, 8);
    const correct = 0.5 * mass * v * v;
    const { options, answer } = pgOptions(correct, [mass * v, 2 * mass * v * v, correct + mass]);
    return add({ jenjang: j, mapel: m, difficulty: d, question: `Energi kinetik benda bermassa ${mass} kg dengan kecepatan ${v} m/s adalah ... J`, options, answer, pembahasan: `Ek = 1/2 m v^2 = 1/2 x ${mass} x ${v * v} = ${correct} J.` });
  },
];

console.log('Membuat butir soal…');
const report = {};
report['SD/Matematika'] = fill('SD', 'Matematika', 1, (j, m, d) => pick(sdTemplates.slice(0, 7))(j, m, 1));
report['SD/Matematika(mcma)'] = fill('SD', 'Matematika', 2, (j, m, d) => sdTemplates[8](j, m, 2) ? true : false);
report['SMP/Matematika'] = fill('SMP', 'Matematika', 2, (j, m, d) => pick(smpTemplates)(j, m, pick([2, 3])));
report['SMA/Matematika'] = fill('SMA', 'Matematika', 4, (j, m, d) => pick(smaTemplates)(j, m, pick([3, 4])));
report['SMP/IPA'] = fill('SMP', 'IPA', 3, (j, m, d) => pick(ipaTemplates)(j, m, pick([2, 3])));
report['SMA/Fisika'] = fill('SMA', 'Fisika', 4, (j, m, d) => pick(ipaTemplates)(j, m, pick([4, 5])));
report['SD/IPAS'] = fill('SD', 'IPAS', 2, (j, m, d) => pick(ipaTemplates)(j, m, 2));

fs.writeFileSync(FILE, JSON.stringify(BANK, null, 2));
const counts = {};
for (const q of BANK) { const k = q.jenjang + ' / ' + q.mapel; counts[k] = (counts[k] || 0) + 1; }
console.log('Ditambahkan:', report);
console.log('Total butir sekarang:', BANK.length);
console.log(counts);
