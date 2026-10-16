// Mesin pertandingan real-time: matchmaking, Best of 5, ronde & penilaian.
import { randomUUID } from 'node:crypto';
import { CONFIG } from './config.js';
import { difficultyForRank, applyResult, rankDisplay, rankRating, sanitizeRank } from './ranks.js';
import { getPlayer, upsertPlayer, recordMatch } from './store.js';
import { pickQuestion, sanitize, isCorrect } from './questions.js';

export function initGame(io) {
  const matches = new Map();      // matchId -> match
  const socketMatch = new Map();  // socketId -> matchId
  const queue = [];               // entri antrean matchmaking

  const now = () => Date.now();
  const firstNames = (p) => (p?.name || 'Pemain');

  function removeFromQueue(socketId) {
    const i = queue.findIndex((e) => e.socketId === socketId);
    if (i >= 0) queue.splice(i, 1);
  }

  function queueRange(entry) {
    const waitSec = (now() - entry.since) / 1000;
    return Math.min(CONFIG.MM_MAX_RANGE, CONFIG.MM_BASE_RANGE + waitSec * CONFIG.MM_EXPAND_PER_SEC);
  }

  function findOpponent(entry) {
    const range = queueRange(entry);
    let best = null;
    let bestDiff = Infinity;
    for (const o of queue) {
      if (o.socketId === entry.socketId) continue;
      if (o.jenjang !== entry.jenjang || o.mapel !== entry.mapel) continue;
      if (!io.sockets.sockets.get(o.socketId)) continue;
      const diff = Math.abs(o.rating - entry.rating);
      if (diff <= range && diff < bestDiff) {
        best = o;
        bestDiff = diff;
      }
    }
    return best;
  }

  function tryPair() {
    const snapshot = [...queue].sort((a, b) => a.since - b.since);
    for (const e of snapshot) {
      if (!queue.includes(e)) continue;
      const opp = findOpponent(e);
      if (opp) {
        removeFromQueue(e.socketId);
        removeFromQueue(opp.socketId);
        createMatch(e, opp);
      }
    }
  }
  const tick = setInterval(tryPair, CONFIG.QUEUE_TICK_MS);

  function createMatch(a, b) {
    const sA = io.sockets.sockets.get(a.socketId);
    const sB = io.sockets.sockets.get(b.socketId);
    if (!sA || !sB) return;

    const pA = getPlayer(a.pid);
    const pB = getPlayer(b.pid);
    const level = Math.max(1, Math.round((difficultyForRank(pA.rank) + difficultyForRank(pB.rank)) / 2));

    const id = randomUUID();
    const match = {
      id,
      jenjang: a.jenjang,
      mapel: a.mapel,
      level,
      pids: [a.pid, b.pid],
      sockets: { [a.pid]: a.socketId, [b.pid]: b.socketId },
      round: 0,
      wins: { [a.pid]: 0, [b.pid]: 0 },
      used: [],
      current: null,
      state: 'countdown',
      sudden: false,
      startedAt: now(),
    };
    matches.set(id, match);
    for (const [sid, pid] of [[a.socketId, a.pid], [b.socketId, b.pid]]) {
      socketMatch.set(sid, id);
      const s = io.sockets.sockets.get(sid);
      if (s) {
        s.data.matchId = id;
        s.join('match:' + id);
      }
    }

    const payloadFor = (pid) => {
      const me = getPlayer(pid);
      const oppId = pid === a.pid ? b.pid : a.pid;
      const opp = getPlayer(oppId);
      return {
        matchId: id,
        bestOf: { need: CONFIG.ROUNDS_TO_WIN, max: CONFIG.MAX_ROUNDS },
        jenjang: match.jenjang,
        mapel: match.mapel,
        level,
        countdownMs: CONFIG.COUNTDOWN_MS,
        you: { name: me?.name || 'Pemain', rank: rankDisplay(me?.rank) },
        opponent: {
          name: opp?.name || 'Lawan',
          rank: rankDisplay(opp?.rank),
          sekolah: opp?.sekolah || '',
        },
      };
    };

    sA.emit('match:start', payloadFor(a.pid));
    sB.emit('match:start', payloadFor(b.pid));

    match.round = 1;
    setTimeout(() => {
      if (match.state === 'countdown') beginRound(match, false);
    }, CONFIG.COUNTDOWN_MS);
  }

  function beginRound(match, sudden) {
    if (match.state === 'ended') return;
    const q = pickQuestion(match.jenjang, match.mapel, match.level, match.used);
    if (!q) {
      io.to('match:' + match.id).emit('match:error', { message: 'Bank soal untuk mapel ini kosong.' });
      voidMatch(match, 'soal-kosong');
      return;
    }
    match.used.push(q.id);
    match.sudden = !!sudden;
    const startAt = now();
    const endsAt = startAt + CONFIG.QUESTION_SECONDS * 1000;
    match.current = { q, startAt, endsAt, answers: {}, timer: null };
    match.state = 'playing';

    io.to('match:' + match.id).emit('round:start', {
      round: match.round,
      sudden: match.sudden,
      seconds: CONFIG.QUESTION_SECONDS,
      serverNow: now(),
      question: sanitize(q),
    });

    match.current.timer = setTimeout(() => finishRound(match), CONFIG.QUESTION_SECONDS * 1000 + 150);
  }

  function onAnswer(socket, payload) {
    const id = socket.data.matchId;
    const match = matches.get(id);
    if (!match || match.state !== 'playing') return;
    const pid = socket.data.profile?.id;
    if (!pid || !match.pids.includes(pid)) return;
    if (match.current.answers[pid]) return; // sudah menjawab

    const at = now();
    const t = Math.max(0, at - match.current.startAt);
    match.current.answers[pid] = { answer: payload?.answer, t, at };
    socket.emit('round:answered', { t });
    if (Object.keys(match.current.answers).length >= 2) finishRound(match);
  }

  function finishRound(match) {
    if (match.state !== 'playing') return;
    match.state = 'resolving';
    if (match.current.timer) clearTimeout(match.current.timer);

    const q = match.current.q;
    const [p1, p2] = match.pids;
    const results = {};
    for (const pid of match.pids) {
      const a = match.current.answers[pid];
      results[pid] = {
        answered: !!a,
        correct: a ? isCorrect(q, a.answer) : false,
        t: a ? a.t : null,
      };
    }

    const correctPids = match.pids.filter((pid) => results[pid].correct);
    let winner = null;
    if (correctPids.length === 1) winner = correctPids[0];
    else if (correctPids.length === 2) {
      if (results[p1].t < results[p2].t) winner = p1;
      else if (results[p2].t < results[p1].t) winner = p2;
      else winner = null; // waktu identik -> adu cepat ulang
    }

    const roundPayload = { round: match.round, results, wins: match.wins };

    if (winner) {
      match.wins[winner] += 1;
      match.sudden = false;
      const decided = match.wins[winner] >= CONFIG.ROUNDS_TO_WIN;
      io.to('match:' + match.id).emit('round:result', {
        ...roundPayload,
        tie: false,
        winner,
        wins: match.wins,
        decided,
      });
      setTimeout(() => {
        if (match.state === 'ended') return;
        if (decided) endMatch(match, winner, false);
        else {
          match.round += 1;
          beginRound(match, false);
        }
      }, CONFIG.RESULT_MS);
    } else {
      match.sudden = true;
      io.to('match:' + match.id).emit('round:result', { ...roundPayload, tie: true });
      setTimeout(() => {
        if (match.state !== 'ended') beginRound(match, true);
      }, CONFIG.RESULT_MS);
    }
  }

  function voidMatch(match, reason) {
    io.to('match:' + match.id).emit('match:cancelled', { reason });
    cleanup(match);
  }

  function endMatch(match, winnerId, walkover) {
    if (match.state === 'ended') return;
    match.state = 'ended';
    const loserId = match.pids.find((p) => p !== winnerId);

    const wp = getPlayer(winnerId);
    const lp = getPlayer(loserId);
    const wBefore = rankDisplay(wp.rank);
    const lBefore = rankDisplay(lp.rank);

    const wRes = applyResult(sanitizeRank(wp.rank), true);
    const lRes = applyResult(sanitizeRank(lp.rank), false);

    const wRounds = match.wins[winnerId] || 0;
    const lRounds = match.wins[loserId] || 0;

    upsertPlayer(winnerId, {
      rank: wRes.rank,
      stats: {
        ...wp.stats,
        matches: (wp.stats.matches || 0) + 1,
        wins: (wp.stats.wins || 0) + 1,
        roundsWon: (wp.stats.roundsWon || 0) + wRounds,
        roundsLost: (wp.stats.roundsLost || 0) + lRounds,
        poin: (wp.stats.poin || 0) + CONFIG.POIN_MATCH_WIN + wRounds * CONFIG.POIN_ROUND_WIN,
      },
    });
    upsertPlayer(loserId, {
      rank: lRes.rank,
      stats: {
        ...lp.stats,
        matches: (lp.stats.matches || 0) + 1,
        losses: (lp.stats.losses || 0) + 1,
        roundsWon: (lp.stats.roundsWon || 0) + lRounds,
        roundsLost: (lp.stats.roundsLost || 0) + wRounds,
        poin: (lp.stats.poin || 0) + lRounds * CONFIG.POIN_ROUND_WIN,
      },
    });

    recordMatch({
      at: now(),
      id: match.id,
      jenjang: match.jenjang,
      mapel: match.mapel,
      p1: match.pids[0],
      p2: match.pids[1],
      p1Name: getPlayer(match.pids[0])?.name || '',
      p2Name: getPlayer(match.pids[1])?.name || '',
      winner: winnerId,
      rounds: match.wins,
      walkover: !!walkover,
    });

    const emitEnd = (pid, myRes, oppRes, oppId, won) => {
      const sid = match.sockets[pid];
      const s = io.sockets.sockets.get(sid);
      if (!s) return;
      s.emit('match:end', {
        matchId: match.id,
        walkover: !!walkover,
        result: won ? 'menang' : 'kalah',
        scoreYou: match.wins[pid],
        scoreOpponent: match.wins[oppId],
        rankBefore: myRes ? rankDisplay(pid === winnerId ? wBefore : lBefore) : null,
        rankAfter: rankDisplay(pid === winnerId ? wRes.rank : lRes.rank),
        rankEvent: pid === winnerId ? wRes.event : lRes.event,
        protectedBy: pid === winnerId ? null : lRes.protectedBy,
        opponent: { name: getPlayer(oppId)?.name || 'Lawan', rank: rankDisplay(getPlayer(oppId)?.rank) },
      });
    };

    emitEnd(winnerId, wRes, lRes, loserId, true);
    emitEnd(loserId, lRes, wRes, winnerId, false);

    cleanup(match);
  }

  function cleanup(match) {
    for (const pid of match.pids) {
      const sid = match.sockets[pid];
      if (sid) {
        socketMatch.delete(sid);
        const s = io.sockets.sockets.get(sid);
        if (s) {
          s.data.matchId = null;
          s.leave('match:' + match.id);
        }
      }
    }
    matches.delete(match.id);
  }

  function handleDisconnect(socket) {
    removeFromQueue(socket.id);
    const id = socketMatch.get(socket.id);
    if (!id) return;
    const match = matches.get(id);
    if (!match) return;
    const pid = socket.data.profile?.id;
    const oppId = match.pids.find((p) => p !== pid);
    if (match.state === 'countdown') {
      // belum mulai -> batalkan tanpa mengubah rank
      voidMatch(match, 'lawan-keluar');
    } else {
      // dianggap menyerah (walkover)
      endMatch(match, oppId, true);
    }
  }

  // ---- Socket.IO handlers ----
  io.on('connection', (socket) => {
    socket.on('queue:join', (payload) => {
      try {
        const profile = socket.data.profile;
        if (!profile) return socket.emit('queue:error', { message: 'Lengkapi profil dulu.' });
        if (socket.data.matchId) return;
        const jenjang = String(payload?.jenjang || profile.jenjang || '');
        const mapel = String(payload?.mapel || '');
        if (!jenjang || !mapel) return socket.emit('queue:error', { message: 'Pilih jenjang & mapel.' });

        removeFromQueue(socket.id);
        const fresh = getPlayer(profile.id) || profile;
        queue.push({
          socketId: socket.id,
          pid: profile.id,
          jenjang,
          mapel,
          rating: rankRating(fresh.rank),
          since: now(),
        });
        socket.emit('queue:joined', { jenjang, mapel, size: queue.length });
        tryPair();
      } catch (e) {
        console.error('[queue:join]', e);
      }
    });

    socket.on('queue:leave', () => {
      removeFromQueue(socket.id);
      socket.emit('queue:left', {});
    });

    socket.on('round:answer', (payload) => {
      try {
        onAnswer(socket, payload);
      } catch (e) {
        console.error('[round:answer]', e);
      }
    });

    socket.on('match:resign', () => {
      try {
        const match = matches.get(socket.data.matchId);
        if (!match) return;
        const pid = socket.data.profile?.id;
        const oppId = match.pids.find((p) => p !== pid);
        if (match.state === 'countdown') voidMatch(match, 'menyerah');
        else endMatch(match, oppId, true);
      } catch (e) {
        console.error('[resign]', e);
      }
    });

    socket.on('disconnect', () => {
      try {
        handleDisconnect(socket);
      } catch (e) {
        console.error('[disconnect]', e);
      }
    });
  });

  return {
    stats: () => ({ matches: matches.size, queue: queue.length }),
    stop: () => clearInterval(tick),
  };
}
