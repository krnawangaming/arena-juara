// Progresi pemain: koin (untuk kosmetik) + pengalaman/level (nuansa idle game).
import { CONFIG } from './config.js';

export function xpToNext(level) {
  return CONFIG.XP_BASE + CONFIG.XP_STEP * (Math.max(1, level) - 1);
}

// Hitung koin & XP dari satu pertandingan. Kosmetik tidak memberi bonus apa pun.
export function gainProgress(player, { won, roundsWon }) {
  const baseCoins = (won ? CONFIG.COIN_WIN : CONFIG.COIN_LOSE) + roundsWon * CONFIG.COIN_PER_ROUND;
  const xpGain = won ? CONFIG.XP_WIN : CONFIG.XP_LOSE;

  let coins = (player?.wallet?.coins || 0) + baseCoins;
  let level = Math.max(1, player?.level || 1);
  let xp = (player?.xp || 0) + xpGain;
  let levelBonus = 0;
  let levelUps = 0;

  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    levelUps += 1;
    levelBonus += CONFIG.COIN_LEVELUP;
  }
  coins += levelBonus;

  return {
    wallet: { coins },
    level,
    xp,
    reward: { coins: baseCoins + levelBonus, baseCoins, levelBonus, xp: xpGain, levelUps },
  };
}

// Ringkasan progres untuk ditampilkan (level, xp menuju level berikutnya).
export function progressView(player) {
  const level = Math.max(1, player?.level || 1);
  const xp = Math.max(0, player?.xp || 0);
  const need = xpToNext(level);
  return {
    level,
    xp,
    need,
    coins: player?.wallet?.coins || 0,
    pct: Math.min(100, Math.round((xp / need) * 100)),
  };
}
