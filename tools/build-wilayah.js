// Konversi CSV wilayah (edwardsamuel) -> JSON ringkas.
// Format keluaran: { id, name, p (parent id) }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.join(__dirname, '..', 'data', 'wilayah-csv');
const OUT_DIR = path.join(__dirname, '..', 'data', 'wilayah');

function parseCsv(file, outName, parentField) {
  const raw = fs.readFileSync(path.join(CSV_DIR, file), 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
  const out = [];
  for (const line of lines) {
    const i1 = line.indexOf(',');
    if (i1 < 0) continue;
    const id = line.slice(0, i1).trim();
    let parent = '';
    let name;
    if (parentField) {
      const i2 = line.indexOf(',', i1 + 1);
      if (i2 < 0) continue;
      parent = line.slice(i1 + 1, i2).trim();
      name = line.slice(i2 + 1).trim();
    } else {
      name = line.slice(i1 + 1).trim();
    }
    const row = { id, name };
    if (parentField) row.p = parent;
    out.push(row);
  }
  fs.writeFileSync(path.join(OUT_DIR, outName), JSON.stringify(out));
  return out.length;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const nProv = parseCsv('provinces.csv', 'provinces.json', null);
const nKab = parseCsv('regencies.csv', 'regencies.json', true);
const nKec = parseCsv('districts.csv', 'districts.json', true);
const nKel = parseCsv('villages.csv', 'villages.json', true);
console.log(`provinces=${nProv} regencies=${nKab} districts=${nKec} villages=${nKel}`);
console.log('Selesai ->', OUT_DIR);
