// Konfigurasi global Arena Juara
const envNum = (k, d) => (process.env[k] !== undefined ? Number(process.env[k]) : d);

export const CONFIG = {
  // Aturan pertandingan (Best of 5)
  ROUNDS_TO_WIN: envNum('AJ_ROUNDS_TO_WIN', 3),   // menang 3 ronde = juara
  MAX_ROUNDS: envNum('AJ_MAX_ROUNDS', 5),         // maksimum 5 ronde
  QUESTION_SECONDS: envNum('AJ_Q_SECONDS', 120),  // 1 soal maksimal 120 detik

  // Jeda antar-tahap (milidetik) - dapat diatur lewat env untuk uji cepat
  COUNTDOWN_MS: envNum('AJ_COUNTDOWN_MS', 3000),
  RESULT_MS: envNum('AJ_RESULT_MS', 5000),        // tampil hasil ronde sebelum ronde berikut
  END_MS: envNum('AJ_END_MS', 1000),

  // Matchmaking (berdasarkan rating/rank)
  MM_BASE_RANGE: 4,          // selisih rating awal
  MM_EXPAND_PER_SEC: 3,      // pelebaran pencarian tiap detik menunggu
  MM_MAX_RANGE: 120,
  QUEUE_TICK_MS: 1500,

  // Perlindungan rank
  MAX_SHIELD: 2,             // maksimal kartu perlindungan yang tersimpan

  // Poin papan peringkat
  POIN_ROUND_WIN: 1,
  POIN_MATCH_WIN: 3,
};

export default CONFIG;
