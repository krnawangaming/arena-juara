// Sistem Rank ala MLBB: tier + divisi + bintang, dengan perlindungan rank.
// Bintang naik saat MENANG, turun saat KALAH (kecuali dilindungi).
import { CONFIG } from './config.js';

// divisions: jumlah divisi dalam 1 tier (0 = paling bawah, mis. III -> II -> I)
// starsPer : jumlah bintang untuk naik dari satu divisi ke divisi berikutnya
export const TIERS = [
  { key: 'perunggu',    name: 'Perunggu',    divisions: 3, starsPer: 3 },
  { key: 'perak',       name: 'Perak',       divisions: 3, starsPer: 3 },
  { key: 'emas',        name: 'Emas',        divisions: 3, starsPer: 3 },
  { key: 'platinum',    name: 'Platinum',    divisions: 4, starsPer: 3 },
  { key: 'berlian',     name: 'Berlian',     divisions: 4, starsPer: 4 },
  { key: 'master',      name: 'Master',      divisions: 4, starsPer: 4 },
  { key: 'grandmaster', name: 'Grandmaster', divisions: 4, starsPer: 5 },
  { key: 'mythic',      name: 'Mythic',      divisions: 1, starsPer: Infinity },
];

// Tingkat kesulitan soal berdasarkan tier (1..5)
export function difficultyForRank(rank) {
  const maxT = TIERS.length - 1;
  const lvl = 1 + Math.round((rank.t * 4) / maxT);
  return Math.max(1, Math.min(5, lvl));
}

export function defaultRank() {
  return { t: 0, d: 0, s: 0, shield: 0 };
}

export function sanitizeRank(rank) {
  const r = rank || defaultRank();
  return { t: r.t || 0, d: r.d || 0, s: r.s || 0, shield: r.shield || 0 };
}

function toRoman(n) {
  const map = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return map[n] || String(n);
}

// Nilai rating numerik untuk sorting / matchmaking
export function rankRating(rank) {
  const r = sanitizeRank(rank);
  let rating = 0;
  for (let i = 0; i < r.t; i++) {
    const sp = TIERS[i].starsPer;
    rating += TIERS[i].divisions * (sp === Infinity ? 0 : sp);
  }
  const sp = TIERS[r.t].starsPer;
  rating += r.d * (sp === Infinity ? 0 : sp) + (r.s || 0);
  return rating;
}

// Label divisi, mis. "Emas II"
export function rankLabel(rank) {
  const r = sanitizeRank(rank);
  const tier = TIERS[r.t] || TIERS[0];
  if (tier.divisions === 1) return tier.name;
  const roman = toRoman(tier.divisions - r.d);
  return `${tier.name} ${roman}`;
}

// Terapkan hasil pertandingan pada rank.
// return: { rank, event, starDelta, protectedBy }
export function applyResult(rank, won) {
  const r = sanitizeRank(rank);
  const tier = TIERS[r.t];
  const sp = tier.starsPer;

  if (won) {
    r.s += 1;
    let event = 'up';
    if (r.s >= sp) {
      // naik (promosi)
      if (r.t === TIERS.length - 1) {
        // Sudah Mythic -> bintang terus bertambah
        event = 'up';
      } else if (r.d < tier.divisions - 1) {
        r.d += 1;
        r.s = 0;
        event = 'promote-div';
      } else {
        // naik tier
        r.t += 1;
        r.d = 0;
        r.s = 0;
        r.shield = Math.min(CONFIG.MAX_SHIELD, (r.shield || 0) + 1);
        event = 'promote-tier';
      }
    }
    return { rank: r, event, starDelta: 1, protectedBy: null };
  }

  // Kalah
  if (r.s > 0) {
    r.s -= 1;
    return { rank: r, event: 'down', starDelta: -1, protectedBy: null };
  }

  // s === 0 -> seharusnya turun divisi/tier; cek perlindungan
  const atTierBase = r.d === 0;

  // 1) Lantai mutlak: Perunggu III (t=0,d=0,s=0) tidak bisa turun
  if (r.t === 0 && atTierBase) {
    return { rank: r, event: 'floor', starDelta: 0, protectedBy: 'lantai-perunggu' };
  }

  // 2) Kartu perlindungan menyerap 1 kekalahan (lebih dulu daripada proteksi tier)
  if ((r.shield || 0) > 0) {
    r.shield -= 1;
    return { rank: r, event: 'shield', starDelta: 0, protectedBy: 'kartu-perlindungan' };
  }

  // 3) Proteksi tier bawah (Perunggu & Perak tidak dapat turun tier)
  if (atTierBase && r.t <= 1) {
    return { rank: r, event: 'floor', starDelta: 0, protectedBy: 'proteksi-tier' };
  }

  // Turun
  if (r.d > 0) {
    r.d -= 1;
    r.s = (TIERS[r.t].starsPer === Infinity ? 0 : TIERS[r.t].starsPer - 1);
    return { rank: r, event: 'demote-div', starDelta: -1, protectedBy: null };
  }
  // d === 0 -> turun tier
  r.t -= 1;
  r.d = TIERS[r.t].divisions - 1;
  r.s = (TIERS[r.t].starsPer === Infinity ? 0 : TIERS[r.t].starsPer - 1);
  return { rank: r, event: 'demote-tier', starDelta: -1, protectedBy: null };
}

export function rankDisplay(rank) {
  const r = sanitizeRank(rank);
  const tier = TIERS[r.t] || TIERS[0];
  return {
    ...r,
    tierName: tier.name,
    tierKey: tier.key,
    label: rankLabel(r),
    rating: rankRating(r),
    starsPer: tier.starsPer === Infinity ? null : tier.starsPer,
    divisions: tier.divisions,
  };
}
