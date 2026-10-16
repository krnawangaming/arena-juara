// Pemuatan data wilayah Indonesia (provinsi -> kab/kota -> kecamatan -> kelurahan)
// Sumber: https://github.com/edwardsamuel/Wilayah-Administratif-Indonesia
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '..', 'data', 'wilayah');

let provinces = [];
let regencies = [];
let districts = [];
let villages = [];
const idx = { prov: new Map(), kab: new Map(), kec: new Map() };

function readJSON(name) {
  const f = path.join(DIR, name);
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

export function loadRegions() {
  provinces = readJSON('provinces.json');
  regencies = readJSON('regencies.json');
  districts = readJSON('districts.json');
  villages = readJSON('villages.json');

  idx.prov = new Map(provinces.map((p) => [p.id, p]));
  idx.kab = new Map(regencies.map((r) => [r.id, r]));
  idx.kec = new Map(districts.map((d) => [d.id, d]));

  return {
    provinsi: provinces.length,
    kabupaten: regencies.length,
    kecamatan: districts.length,
    kelurahan: villages.length,
  };
}

export function listProvinces() {
  return provinces;
}
export function listRegencies(provId) {
  return regencies.filter((r) => r.p === provId);
}
export function listDistricts(kabId) {
  return districts.filter((d) => d.p === kabId);
}
export function listVillages(kecId) {
  return villages.filter((v) => v.p === kecId);
}

export function resolveRegion(ids = {}) {
  const prov = idx.prov.get(ids.prov);
  const kab = idx.kab.get(ids.kab);
  const kec = idx.kec.get(ids.kec);
  return {
    provId: ids.prov || '',
    kabId: ids.kab || '',
    kecId: ids.kec || '',
    kelId: ids.kel || '',
    provName: prov ? prov.name : '',
    kabName: kab ? kab.name : '',
    kecName: kec ? kec.name : '',
    kelName: ids.kelName || '',
  };
}
