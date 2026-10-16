// Katalog kosmetik karakter — TKA: The Knight of Academy
// Kosmetik MURNI TAMPILAN (tanpa bonus pertandingan) dan dibeli dengan Koin.
// Setiap butir punya kelangkaan: R (Rare) -> SR (Super Rare) -> SSR (Super Super Rare).

export const RARITIES = {
  R: { key: 'R', label: 'Rare', order: 1, color: '#5aa9ff', glow: 'rgba(90,169,255,.55)' },
  SR: { key: 'SR', label: 'Super Rare', order: 2, color: '#c084fc', glow: 'rgba(192,132,252,.60)' },
  SSR: { key: 'SSR', label: 'Super Super Rare', order: 3, color: '#ffb020', glow: 'rgba(255,176,32,.72)' },
};

export const CATEGORIES = [
  { key: 'kulit', name: 'Kulit', icon: '🧑' },
  { key: 'rambut', name: 'Rambut', icon: '💇' },
  { key: 'wajah', name: 'Ekspresi', icon: '😄' },
  { key: 'zirah', name: 'Zirah', icon: '🥋' },
  { key: 'jubah', name: 'Jubah', icon: '🧣' },
  { key: 'helm', name: 'Helm', icon: '⛑️' },
  { key: 'senjata', name: 'Senjata', icon: '⚔️' },
  { key: 'perisai', name: 'Perisai', icon: '🛡️' },
  { key: 'pendamping', name: 'Pendamping', icon: '🐾' },
  { key: 'aura', name: 'Aura', icon: '✨' },
];

// I(id, cat, name, rarity, price, art)
const I = (id, cat, name, rarity, price, art) => ({ id, cat, name, rarity, price, art });

export const ITEMS = [
  // ---- Kulit ----
  I('kulit_cerah', 'kulit', 'Kulit Cerah', 'R', 0, { shape: 'skin', c1: '#ffd9b3', c2: '#e8b98c' }),
  I('kulit_sawo', 'kulit', 'Kulit Sawo Matang', 'R', 0, { shape: 'skin', c1: '#d29a6b', c2: '#b47d50' }),
  I('kulit_langit', 'kulit', 'Kulit Langit', 'R', 300, { shape: 'skin', c1: '#cfe6ff', c2: '#a8c8ee' }),
  I('kulit_lumut', 'kulit', 'Kulit Lumut', 'R', 300, { shape: 'skin', c1: '#cdebcf', c2: '#a8cfa8' }),
  I('kulit_mistik', 'kulit', 'Kulit Mistis', 'SR', 1500, { shape: 'skin', c1: '#dcc6ff', c2: '#b79bef' }),
  I('kulit_dewa', 'kulit', 'Kulit Dewa', 'SSR', 8000, { shape: 'skin', c1: '#ffe9a8', c2: '#f0c86a' }),

  // ---- Rambut ----
  I('rambut_pendek', 'rambut', 'Rambut Pendek', 'R', 0, { shape: 'short', c1: '#3a2a1c', c2: '#2a1d13' }),
  I('rambut_ikal', 'rambut', 'Rambut Ikal', 'R', 300, { shape: 'curly', c1: '#4a3320', c2: '#31200f' }),
  I('rambut_pirang', 'rambut', 'Rambut Pirang', 'R', 300, { shape: 'short', c1: '#c98a2e', c2: '#a06d1f' }),
  I('rambut_ekor', 'rambut', 'Rambut Ekor Kuda', 'R', 450, { shape: 'ponytail', c1: '#2a2118', c2: '#191410' }),
  I('rambut_mohawk', 'rambut', 'Mohawk Merah', 'SR', 1500, { shape: 'mohawk', c1: '#ff4d6d', c2: '#c22646' }),
  I('rambut_perak', 'rambut', 'Rambut Perak', 'SR', 1800, { shape: 'spiky', c1: '#d7dee9', c2: '#a9b4c6' }),
  I('rambut_foniks', 'rambut', 'Rambut Foniks', 'SSR', 8000, { shape: 'spiky', c1: '#ff8a00', c2: '#ff3d00' }),

  // ---- Wajah ----
  I('wajah_senyum', 'wajah', 'Senyum Ramah', 'R', 0, { shape: 'smile' }),
  I('wajah_tegas', 'wajah', 'Tatapan Tegas', 'R', 0, { shape: 'determined' }),
  I('wajah_ceria', 'wajah', 'Ceria Sekali', 'R', 250, { shape: 'happy' }),
  I('wajah_tenang', 'wajah', 'Tenang', 'R', 250, { shape: 'calm' }),
  I('wajah_marah', 'wajah', 'Siap Bertarung', 'SR', 1200, { shape: 'angry' }),
  I('wajah_kedip', 'wajah', 'Kedipan Lucu', 'SR', 1200, { shape: 'wink' }),

  // ---- Zirah ----
  I('zirah_kain', 'zirah', 'Tunik Kain', 'R', 0, { shape: 'cloth', c1: '#6b8f4e', c2: '#4d6a37', c3: '#8a6b3a' }),
  I('zirah_kulit', 'zirah', 'Zirah Kulit', 'R', 350, { shape: 'leather', c1: '#8a5a2b', c2: '#63401c', c3: '#3d2711' }),
  I('zirah_besi', 'zirah', 'Zirah Besi', 'R', 550, { shape: 'chain', c1: '#9aa4b8', c2: '#6d7688', c3: '#c9d2e0' }),
  I('zirah_baja', 'zirah', 'Zirah Baja', 'SR', 1800, { shape: 'plate', c1: '#c3cde0', c2: '#8d9ab3', c3: '#e8eefb' }),
  I('zirah_raja', 'zirah', 'Zirah Kerajaan', 'SR', 2200, { shape: 'royal', c1: '#e8c65a', c2: '#b8922a', c3: '#7a5cf0' }),
  I('zirah_naga', 'zirah', 'Zirah Naga', 'SSR', 9000, { shape: 'dragon', c1: '#2f9e6b', c2: '#1c6b47', c3: '#ffb020' }),

  // ---- Jubah ----
  I('jubah_tanpa', 'jubah', 'Tanpa Jubah', 'R', 0, { shape: 'none' }),
  I('jubah_pendek', 'jubah', 'Jubah Pendek', 'R', 300, { shape: 'short', c1: '#b03a48', c2: '#7e2631' }),
  I('jubah_panjang', 'jubah', 'Jubah Panjang', 'R', 450, { shape: 'long', c1: '#3550a8', c2: '#243a7e' }),
  I('jubah_raja', 'jubah', 'Jubah Kerajaan', 'SR', 1800, { shape: 'royal', c1: '#7a5cf0', c2: '#5a3fd0', c3: '#ffd76a' }),
  I('jubah_robes', 'jubah', 'Jubah Ksatria', 'SR', 1900, { shape: 'royal', c1: '#1f8f7a', c2: '#146b5b', c3: '#c9f7e8' }),
  I('jubah_foniks', 'jubah', 'Jubah Foniks', 'SSR', 9000, { shape: 'phoenix', c1: '#ff6a00', c2: '#c2260a', c3: '#ffd76a' }),

  // ---- Helm ----
  I('helm_tanpa', 'helm', 'Tanpa Helm', 'R', 0, { shape: 'none' }),
  I('helm_ikat', 'helm', 'Ikat Kepala', 'R', 250, { shape: 'bandana', c1: '#c0392b', c2: '#8e2a1f' }),
  I('helm_kulit', 'helm', 'Topi Kulit', 'R', 350, { shape: 'cap', c1: '#8a5a2b', c2: '#5f3d1b' }),
  I('helm_ksatria', 'helm', 'Helm Ksatria', 'SR', 1800, { shape: 'knight', c1: '#c3cde0', c2: '#7c8aa6', c3: '#ff4d6d' }),
  I('helm_mahkota', 'helm', 'Mahkota Emas', 'SR', 2200, { shape: 'crown', c1: '#f2c645', c2: '#b8922a', c3: '#ff4d6d' }),
  I('helm_tanduk', 'helm', 'Helm Bertanduk', 'SSR', 8500, { shape: 'horned', c1: '#5b4a3a', c2: '#3a2e23', c3: '#f2f2f2' }),
  I('helm_naga', 'helm', 'Helm Naga', 'SSR', 9500, { shape: 'dragon', c1: '#2f9e6b', c2: '#1c6b47', c3: '#ffb020' }),

  // ---- Senjata ----
  I('senjata_tanpa', 'senjata', 'Bertangan Kosong', 'R', 0, { shape: 'none' }),
  I('senjata_kayu', 'senjata', 'Pedang Kayu', 'R', 250, { shape: 'sword', c1: '#a97b46', c2: '#7a5630', c3: '#cbd5e1' }),
  I('senjata_besi', 'senjata', 'Pedang Besi', 'R', 400, { shape: 'sword', c1: '#cdd6e4', c2: '#8f9bb0', c3: '#8a5a2b' }),
  I('senjata_kapak', 'senjata', 'Kapak Perang', 'R', 550, { shape: 'axe', c1: '#c9d2e0', c2: '#8a5a2b', c3: '#5f3d1b' }),
  I('senjata_tombak', 'senjata', 'Tombak Perak', 'SR', 1600, { shape: 'spear', c1: '#e6ecf7', c2: '#8a5a2b', c3: '#c084fc' }),
  I('senjata_besar', 'senjata', 'Pedang Raksasa', 'SR', 2000, { shape: 'greatsword', c1: '#dbe4f2', c2: '#7c8aa6', c3: '#4f8cff' }),
  I('senjata_api', 'senjata', 'Pedang Api', 'SSR', 8500, { shape: 'flame', c1: '#ffca28', c2: '#ff5722', c3: '#8a5a2b' }),
  I('senjata_suci', 'senjata', 'Bilah Suci', 'SSR', 9500, { shape: 'holy', c1: '#fff6c9', c2: '#ffd76a', c3: '#7ad1ff' }),

  // ---- Perisai ----
  I('perisai_tanpa', 'perisai', 'Tanpa Perisai', 'R', 0, { shape: 'none' }),
  I('perisai_kayu', 'perisai', 'Perisai Kayu', 'R', 250, { shape: 'wood', c1: '#a97b46', c2: '#7a5630', c3: '#5f3d1b' }),
  I('perisai_bulat', 'perisai', 'Perisai Bulat', 'R', 400, { shape: 'round', c1: '#c9d2e0', c2: '#8f9bb0', c3: '#b03a48' }),
  I('perisai_layang', 'perisai', 'Perisai Layang', 'SR', 1600, { shape: 'kite', c1: '#4f8cff', c2: '#2f5fc0', c3: '#ffd76a' }),
  I('perisai_raja', 'perisai', 'Perisai Kerajaan', 'SR', 2000, { shape: 'royal', c1: '#f2c645', c2: '#b8922a', c3: '#7a5cf0' }),
  I('perisai_naga', 'perisai', 'Perisai Naga', 'SSR', 8500, { shape: 'dragon', c1: '#2f9e6b', c2: '#1c6b47', c3: '#ffb020' }),

  // ---- Pendamping ----
  I('pendamping_tanpa', 'pendamping', 'Tanpa Pendamping', 'R', 0, { shape: 'none' }),
  I('pendamping_kucing', 'pendamping', 'Kucing Oren', 'R', 400, { shape: 'cat', c1: '#f0a24a', c2: '#c97f2e' }),
  I('pendamping_anjing', 'pendamping', 'Anjing Setia', 'R', 400, { shape: 'dog', c1: '#b98a5e', c2: '#8a6339' }),
  I('pendamping_hantu', 'pendamping', 'Burung Hantu', 'SR', 1800, { shape: 'owl', c1: '#8a6b3a', c2: '#5f4a26', c3: '#ffd76a' }),
  I('pendamping_naga', 'pendamping', 'Naga Kecil', 'SSR', 9000, { shape: 'dragonling', c1: '#2f9e6b', c2: '#1c6b47', c3: '#ffb020' }),
  I('pendamping_foniks', 'pendamping', 'Foniks Kecil', 'SSR', 9500, { shape: 'phoenixling', c1: '#ff8a00', c2: '#ff3d00', c3: '#ffd76a' }),

  // ---- Aura ----
  I('aura_tanpa', 'aura', 'Tanpa Aura', 'R', 0, { shape: 'none' }),
  I('aura_cahaya', 'aura', 'Cahaya Fajar', 'R', 300, { shape: 'sunbeam', c1: '#ffe9a8', c2: '#7fb2ff' }),
  I('aura_kerlip', 'aura', 'Kerlip Bintang', 'R', 400, { shape: 'sparkle', c1: '#c9e0ff', c2: '#8fb6ff' }),
  I('aura_badai', 'aura', 'Badai Kilat', 'SR', 1800, { shape: 'storm', c1: '#7c8aa6', c2: '#ffe066' }),
  I('aura_raja', 'aura', 'Aura Kerajaan', 'SR', 2200, { shape: 'royal', c1: '#a06bff', c2: '#ffd76a' }),
  I('aura_langit', 'aura', 'Langit Surgawi', 'SSR', 9000, { shape: 'celestial', c1: '#4f8cff', c2: '#ffd76a' }),
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function itemById(id) {
  return BY_ID.get(id) || null;
}

export function itemsByCategory(cat) {
  return ITEMS.filter((i) => i.cat === cat);
}

export function freeItemIds() {
  return ITEMS.filter((i) => i.price === 0).map((i) => i.id);
}

// Pilihan bawaan untuk pemain baru
export function defaultEquipped() {
  return {
    kulit: 'kulit_cerah',
    rambut: 'rambut_pendek',
    wajah: 'wajah_senyum',
    zirah: 'zirah_kain',
    jubah: 'jubah_tanpa',
    helm: 'helm_tanpa',
    senjata: 'senjata_kayu',
    perisai: 'perisai_kayu',
    pendamping: 'pendamping_tanpa',
    aura: 'aura_tanpa',
  };
}

export function catalogPayload() {
  return { categories: CATEGORIES, rarities: RARITIES, items: ITEMS };
}

// Pastikan data kosmetik pemain valid (untuk pemain lama / data rusak)
export function sanitizeCosmetics(raw, ownedFallback) {
  const owned = new Set(freeItemIds());
  if (Array.isArray(raw?.owned)) for (const id of raw.owned) if (BY_ID.has(id)) owned.add(id);
  if (Array.isArray(ownedFallback)) for (const id of ownedFallback) if (BY_ID.has(id)) owned.add(id);

  const def = defaultEquipped();
  const eq = {};
  for (const cat of CATEGORIES) {
    const want = raw?.equipped?.[cat.key];
    eq[cat.key] = want && owned.has(want) && BY_ID.get(want)?.cat === cat.key ? want : def[cat.key];
  }
  return { owned: [...owned], equipped: eq };
}
