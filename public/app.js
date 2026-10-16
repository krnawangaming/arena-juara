/* Arena Juara - klien */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const PID = (() => {
  let id = localStorage.getItem('aj_pid');
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now() + '-' + Math.random().toString(16).slice(2));
    localStorage.setItem('aj_pid', id);
  }
  return id;
})();

const socket = io();

const state = {
  me: null,        // profil + rank (dari server)
  jenjang: '',
  mapel: '',
  match: null,     // {matchId, you, opponent}
  round: null,     // {question, deadline, timerId}
  selected: null,  // jawaban terpilih
  locked: false,
  myWins: 0,
  oppWins: 0,
  regionNames: {},
};

/* ---------------- util ---------------- */
function showView(id) {
  $$('.view').forEach((v) => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}
function showEl(sel) { $(sel).classList.remove('hidden'); }
function hideEl(sel) { $(sel).classList.add('hidden'); }
let toastTimer = null;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}
async function api(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- koneksi ---------------- */
socket.on('connect', () => { $('#connDot').classList.add('on'); $('#connText').textContent = 'terhubung'; });
socket.on('disconnect', () => { $('#connDot').classList.remove('on'); $('#connText').textContent = 'terputus'; });

/* ---------------- profil ---------------- */
function loadLocalProfile() {
  try { return JSON.parse(localStorage.getItem('aj_profile') || 'null'); } catch { return null; }
}
function saveLocalProfile(p) { localStorage.setItem('aj_profile', JSON.stringify(p)); }

function fillProfileForm(p) {
  if (!p) return;
  $('#f-name').value = p.name || '';
  $('#f-jenjang').value = p.jenjang || '';
  $('#f-kelas').value = p.kelas || '';
  $('#f-sekolah').value = p.sekolah || '';
}

function collectProfileForm() {
  return {
    playerId: PID,
    name: $('#f-name').value.trim(),
    jenjang: $('#f-jenjang').value,
    kelas: $('#f-kelas').value.trim(),
    sekolah: $('#f-sekolah').value.trim(),
    region: {
      prov: $('#f-prov').value,
      kab: $('#f-kab').value,
      kec: $('#f-kec').value,
      kel: $('#f-kel').value,
      kelName: $('#f-kel').selectedOptions[0] ? $('#f-kel').selectedOptions[0].textContent : '',
    },
  };
}

/* ---------------- wilayah cascade ---------------- */
function fillSelect(sel, rows, placeholder) {
  const el = $(sel);
  el.innerHTML = `<option value="">${placeholder}</option>` + rows.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
}
async function initWilayah() {
  try {
    fillSelect('#f-prov', await api('/api/wilayah/provinsi'), '— pilih —');
  } catch (e) { console.error(e); toast('Gagal memuat data wilayah.'); }
}
$('#f-prov').addEventListener('change', async (e) => {
  fillSelect('#f-kab', [], '— pilih —'); fillSelect('#f-kec', [], '— pilih —'); fillSelect('#f-kel', [], '— pilih —');
  if (e.target.value) fillSelect('#f-kab', await api('/api/wilayah/kabupaten?prov=' + e.target.value), '— pilih —');
});
$('#f-kab').addEventListener('change', async (e) => {
  fillSelect('#f-kec', [], '— pilih —'); fillSelect('#f-kel', [], '— pilih —');
  if (e.target.value) fillSelect('#f-kec', await api('/api/wilayah/kecamatan?kab=' + e.target.value), '— pilih —');
});
$('#f-kec').addEventListener('change', async (e) => {
  fillSelect('#f-kel', [], '— pilih —');
  if (e.target.value) fillSelect('#f-kel', await api('/api/wilayah/kelurahan?kec=' + e.target.value), '— pilih —');
});

/* ---------------- simpan profil ---------------- */
$('#btn-save').addEventListener('click', () => {
  const p = collectProfileForm();
  if (!p.name) return toast('Isi nama dulu ya.');
  if (!p.jenjang) return toast('Pilih jenjang.');
  if (!p.sekolah) return toast('Isi nama sekolah.');
  if (!p.region.prov || !p.region.kab) return toast('Pilih provinsi & kabupaten/kota.');
  saveLocalProfile(p);
  socket.emit('player:sync', p);
});

socket.on('player:ok', ({ profile, isNew }) => {
  state.me = profile;
  state.jenjang = profile.jenjang;
  refreshRankUI();
  loadMapelList();
  showView('#view-lobby');
  if (isNew) toast('Profil tersimpan. Selamat bertanding!');
});
socket.on('player:error', ({ message }) => toast(message || 'Gagal menyimpan profil.'));

/* ---------------- UI rank & statistik ---------------- */
function starStr(n) { n = Math.min(n, 10); return n > 0 ? '★'.repeat(n) : '—'; }
function refreshRankUI() {
  if (!state.me) return;
  const r = state.me.rank;
  $('#rankTier').textContent = r.label;
  $('#rankStars').textContent = r.starsPer ? starStr(r.s) : '★'.repeat(Math.min(r.s, 6)) + (r.s > 6 ? '+' : '');
  $('#lobbyWho').textContent = state.me.name + ' · ' + (state.me.sekolah || '') + (state.me.kelas ? (' · Kelas ' + state.me.kelas) : '');
  $('#lobbyStars').textContent = r.s;
  $('#lobbyShield').textContent = r.shield || 0;
  const st = state.me.stats || {};
  $('#st-matches').textContent = st.matches || 0;
  $('#st-wins').textContent = st.wins || 0;
  $('#st-losses').textContent = st.losses || 0;
  $('#st-wr').textContent = st.matches ? Math.round((st.wins / st.matches) * 100) + '%' : '0%';
  $('#st-poin').textContent = st.poin || 0;
}

async function loadMapelList() {
  try {
    const list = await api('/api/bank/mapel?jenjang=' + encodeURIComponent(state.jenjang));
    const sel = $('#f-mapel');
    sel.innerHTML = '<option value="">— pilih mapel —</option>' + list.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    if (!list.length) sel.innerHTML = '<option value="">(belum ada soal untuk jenjang ini)</option>';
  } catch (e) { console.error(e); }
}

$('#btn-edit').addEventListener('click', () => {
  fillProfileForm(state.me);
  showView('#view-setup');
});

/* ---------------- matchmaking ---------------- */
$('#btn-find').addEventListener('click', () => {
  const mapel = $('#f-mapel').value;
  if (!mapel) return toast('Pilih mapel dulu.');
  state.mapel = mapel;
  $('#queue-info').textContent = `${state.jenjang} · ${mapel}`;
  showEl('#ov-queue');
  socket.emit('queue:join', { jenjang: state.jenjang, mapel });
});
$('#btn-cancel-queue').addEventListener('click', () => { socket.emit('queue:leave'); hideEl('#ov-queue'); });
socket.on('queue:joined', ({ jenjang, mapel }) => { $('#queue-info').textContent = `${jenjang} · ${mapel}`; });
socket.on('queue:error', ({ message }) => { hideEl('#ov-queue'); toast(message || 'Gagal mencari lawan.'); });

/* ---------------- pertandingan ---------------- */
socket.on('match:start', (data) => {
  state.match = data;
  state.myWins = 0; state.oppWins = 0;
  hideEl('#ov-queue');
  $('#m-you-name').textContent = data.you.name;
  $('#m-you-rank').textContent = data.you.rank.label + ' · ' + data.you.rank.s + '★';
  $('#m-opp-name').textContent = data.opponent.name;
  $('#m-opp-rank').textContent = data.opponent.rank.label + ' · ' + data.opponent.rank.s + '★';
  $('#m-round').textContent = '1';
  updateScore();
  $('#m-question').textContent = 'Bersiap…';
  $('#m-answers').innerHTML = '';
  $('#btn-lock').disabled = true;
  $('#m-wait').classList.add('hidden');
  showEl('#ov-match');
});

function updateScore() {
  $('#m-pips').textContent = `${state.myWins} - ${state.oppWins}`;
}

socket.on('round:start', ({ round, sudden, seconds, question }) => {
  state.round = { question, deadline: Date.now() + seconds * 1000, timerId: null };
  state.selected = null;
  state.locked = false;
  $('#m-round').textContent = sudden ? round + ' (adu cepat)' : round;
  renderQuestion(question);
  startTimer(seconds);
  hideEl('#ov-round');
  showEl('#ov-match');
});

function startTimer(seconds) {
  clearInterval(state.round?.timerId);
  const bar = $('#m-timerbar'); const txt = $('#m-timertxt');
  const tick = () => {
    const left = Math.max(0, Math.round((state.round.deadline - Date.now()) / 1000));
    txt.textContent = left;
    bar.style.width = Math.min(100, (left / seconds) * 100) + '%';
    bar.classList.toggle('low', left <= 15);
    if (left <= 0) { clearInterval(state.round.timerId); if (!state.locked) lockAnswer(); }
  };
  tick();
  state.round.timerId = setInterval(tick, 300);
}

function renderQuestion(q) {
  $('#m-mapel').textContent = q.mapel;
  $('#m-diff').textContent = '★'.repeat(q.difficulty || 1);
  $('#m-type').textContent = q.type === 'pg' ? 'Pilihan Ganda' : q.type === 'mcma' ? 'PG Kompleks' : 'PG Kategori';
  const stim = $('#m-stimulus');
  if (q.stimulus) { stim.textContent = q.stimulus; stim.classList.remove('hidden'); } else stim.classList.add('hidden');
  $('#m-question').textContent = q.question;
  const box = $('#m-answers');
  box.innerHTML = '';
  $('#m-wait').classList.add('hidden');
  $('#btn-lock').classList.remove('hidden');
  $('#btn-lock').disabled = true;
  $('#btn-lock').textContent = 'Kunci Jawaban';

  if (q.type === 'pg' || q.type === 'mcma') {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    q.options.forEach((opt, i) => {
      const d = document.createElement('button');
      d.className = 'opt';
      d.innerHTML = `<span class="key">${letters[i]}</span><span>${esc(opt)}</span>`;
      d.addEventListener('click', () => selectOption(i, d, q));
      box.appendChild(d);
    });
    state.selected = q.type === 'mcma' ? [] : null;
  } else if (q.type === 'kategori') {
    const labels = q.kategoriLabels || ['Benar', 'Salah'];
    state.selected = q.statements.map(() => null);
    q.statements.forEach((s, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'stmt';
      wrap.innerHTML = `<div class="txt">${esc(s.text)}</div>
        <div class="toggle">
          <button data-v="1">${esc(labels[0])}</button>
          <button data-v="0">${esc(labels[1])}</button>
        </div>`;
      [...wrap.querySelectorAll('button')].forEach((b) => {
        b.addEventListener('click', () => {
          if (state.locked) return;
          state.selected[i] = b.dataset.v === '1';
          [...wrap.querySelectorAll('button')].forEach((x) => x.classList.toggle('on', x === b));
          validateLock();
        });
      });
      box.appendChild(wrap);
    });
  }
}

function selectOption(i, el, q) {
  if (state.locked) return;
  const opts = [...$('#m-answers').querySelectorAll('.opt')];
  if (q.type === 'pg') {
    state.selected = i;
    opts.forEach((o) => o.classList.toggle('sel', o === el));
  } else {
    const idx = state.selected.indexOf(i);
    if (idx >= 0) state.selected.splice(idx, 1); else state.selected.push(i);
    el.classList.toggle('sel', state.selected.includes(i));
  }
  validateLock();
}

function validateLock() {
  const q = state.round.question;
  let ok = false;
  if (q.type === 'pg') ok = state.selected !== null;
  else if (q.type === 'mcma') ok = Array.isArray(state.selected) && state.selected.length > 0;
  else ok = Array.isArray(state.selected) && state.selected.every((v) => v !== null);
  $('#btn-lock').disabled = !ok || state.locked;
}

$('#btn-lock').addEventListener('click', lockAnswer);

function lockAnswer() {
  if (state.locked || !state.round) return;
  state.locked = true;
  $('#btn-lock').disabled = true;
  clearInterval(state.round.timerId);
  socket.emit('round:answer', { answer: state.selected });
  $('#m-wait').classList.remove('hidden');
}

socket.on('round:answered', () => {
  state.locked = true;
  $('#btn-lock').disabled = true;
  $('#m-wait').classList.remove('hidden');
});

socket.on('round:result', (data) => {
  state.locked = true;
  clearInterval(state.round?.timerId);
  const mine = data.results[PID] || { correct: false, t: null, answered: false };
  const oppPid = Object.keys(data.results).find((k) => k !== PID);
  const opp = data.results[oppPid] || { correct: false, t: null, answered: false };

  // perbarui skor
  state.myWins = data.wins[PID] || 0;
  state.oppWins = oppPid ? (data.wins[oppPid] || 0) : 0;
  updateScore();

  const title = $('#r-title');
  if (data.tie) {
    title.textContent = 'Ronde Seri — Adu Cepat!';
  } else {
    title.textContent = data.winner === PID ? 'Ronde Ini Kamu Menang! 🎉' : 'Ronde Ini Kamu Kalah';
  }
  const fmt = (r, label) => `<div class="rb-row"><span>${label}</span><span>${r.correct ? '<b>BENAR</b>' : (r.answered ? 'salah' : 'tidak dijawab')}${r.t != null ? ' · ' + (r.t / 1000).toFixed(1) + 's' : ''}</span></div>`;
  $('#r-body').innerHTML =
    fmt(mine, 'Kamu (' + state.me.name + ')') +
    fmt(opp, 'Lawan') +
    `<div class="rb-row"><span>Skor ronde</span><b>${state.myWins} - ${state.oppWins}</b></div>`;
  $('#r-next').textContent = data.tie ? 'Soal baru sedang disiapkan untuk menentukan pemenang ronde…' : (data.decided ? 'Pertandingan selesai…' : 'Ronde berikutnya segera dimulai…');
  hideEl('#ov-match');
  showEl('#ov-round');
});

socket.on('match:end', (data) => {
  clearInterval(state.round?.timerId);
  hideEl('#ov-match'); hideEl('#ov-round');
  const win = data.result === 'menang';
  $('#e-title').textContent = win ? '🏆 KAMU JUARA!' : '💀 Kamu Kalah';
  const rb = data.rankBefore || { label: '-' };
  const ra = data.rankAfter;
  let rankInfo = `<div class="rb-row"><span>Rank</span><span>${esc(rb.label)} → <b>${esc(ra.label)}</b> (${ra.s}★)</span></div>`;
  if (data.rankEvent && data.rankEvent.startsWith('promote')) rankInfo += `<div class="rb-row"><span>Status</span><span class="badge-win">NAIK RANK! 🚀</span></div>`;
  else if (data.protectedBy) rankInfo += `<div class="rb-row"><span>Status</span><span class="badge-win">Dilindungi (${esc(data.protectedBy)}) 🛡</span></div>`;
  else if (!win) rankInfo += `<div class="rb-row"><span>Status</span><span class="badge-lose">Turun bintang</span></div>`;
  $('#e-body').innerHTML =
    `<div class="rb-row"><span>Skor akhir</span><b>${data.scoreYou} - ${data.scoreOpponent}</b></div>` +
    `<div class="rb-row"><span>Lawan</span><span>${esc(data.opponent.name)}</span></div>` +
    rankInfo +
    (data.walkover ? `<div class="rb-row"><span>Catatan</span><span>${win ? 'Kemenangan WO (lawan keluar)' : 'Kamu keluar dari pertandingan'}</span></div>` : '');
  showEl('#ov-end');
});

socket.on('match:cancelled', ({ reason }) => {
  clearInterval(state.round?.timerId);
  hideEl('#ov-match'); hideEl('#ov-round'); hideEl('#queue');
  toast('Pertandingan dibatalkan (' + (reason || '') + ').');
});

socket.on('match:error', ({ message }) => {
  clearInterval(state.round?.timerId);
  hideEl('#ov-match'); hideEl('#ov-round');
  toast(message || 'Terjadi kesalahan pertandingan.');
  showView('#view-lobby');
});

$('#btn-end-ok').addEventListener('click', () => {
  hideEl('#ov-end');
  socket.emit('player:get', { playerId: PID });
  showView('#view-lobby');
});
$('#btn-resign').addEventListener('click', () => { socket.emit('match:resign'); });

socket.on('player:data', (p) => {
  if (!p) return;
  state.me = p;
  refreshRankUI();
});

/* ---------------- papan peringkat ---------------- */
$('#btn-board').addEventListener('click', () => { showView('#view-board'); loadBoard(); });
$('#btn-board-back').addEventListener('click', () => showView('#view-lobby'));
$('#btn-board-load').addEventListener('click', loadBoard);

async function loadBoard() {
  const scope = $('#b-scope').value;
  const jenjang = $('#b-jenjang').value;
  const q = new URLSearchParams({ scope, limit: '50' });
  if (jenjang) q.set('jenjang', jenjang);
  const me = state.me || {};
  if (scope === 'kelas') { q.set('sekolah', me.sekolah || ''); q.set('kelas', me.kelas || ''); }
  if (scope === 'sekolah') q.set('sekolah', me.sekolah || '');
  if (me.region) {
    if (scope === 'kelurahan') q.set('kel', me.region.kelId || '');
    if (scope === 'kecamatan') q.set('kec', me.region.kecId || '');
    if (scope === 'kota') q.set('kab', me.region.kabId || '');
    if (scope === 'provinsi') q.set('prov', me.region.provId || '');
  }
  const box = $('#board-list');
  box.innerHTML = '<p class="hint">Memuat…</p>';
  try {
    const data = await api('/api/papan?' + q.toString());
    if (!data.rows.length) { box.innerHTML = '<p class="hint">Belum ada data untuk tingkat ini.</p>'; return; }
    box.innerHTML = data.rows.map((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      const meCls = r.id === PID ? ' me' : '';
      return `<div class="board-row${meCls}">
        <div class="pos">${medal}</div>
        <div class="nm"><b>${esc(r.name)}</b><span>${esc(r.sekolah)}${r.kelas ? ' · ' + esc(r.kelas) : ''} · ${esc(r.regionName || '-')}</span></div>
        <div class="rk">${esc(r.rank.label)}<br>${r.winrate}% · ${r.poin}p</div>
      </div>`;
    }).join('');
  } catch (e) { box.innerHTML = '<p class="hint">Gagal memuat papan peringkat.</p>'; }
}

/* ---------------- mode guru ---------------- */
$('#btn-guru').addEventListener('click', () => showView('#view-guru'));
$('#btn-guru-back').addEventListener('click', () => showView('#view-lobby'));

$('#btn-guru-save').addEventListener('click', async () => {
  const type = $('#g-type').value;
  const slug = $('#g-mapel').value.trim();
  const base = {
    jenjang: $('#g-jenjang').value,
    mapel: slug,
    type,
    difficulty: Number($('#g-diff').value) || 1,
    stimulus: $('#g-stimulus').value.trim() || null,
    question: $('#g-question').value.trim(),
    kelas: null,
  };
  const body = { ...base };
  try {
    if (type === 'pg' || type === 'mcma') {
      const lines = $('#g-options').value.split('\n').map((s) => s.trim()).filter(Boolean);
      const options = []; const marks = [];
      lines.forEach((l) => {
        if (l.startsWith('*')) { marks.push(options.length); options.push(l.slice(1).trim()); }
        else options.push(l);
      });
      body.options = options;
      if (type === 'pg') { if (marks.length !== 1) return toast('Tandai tepat SATU jawaban benar dengan *'); body.answer = marks[0]; }
      else { if (!marks.length) return toast('Tandai minimal satu jawaban benar dengan *'); body.answers = marks; }
    } else {
      const lines = $('#g-options').value.split('\n').map((s) => s.trim()).filter(Boolean);
      body.statements = lines.map((l) => l.startsWith('*') ? { text: l.slice(1).trim(), value: true } : { text: l, value: false });
      body.kategoriLabels = ['Benar', 'Salah'];
    }
    const res = await api('/api/guru/soal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { $('#g-status').textContent = 'Tersimpan! Total soal: ' + res.total; toast('Soal tersimpan.'); resetGuruForm(); }
    else toast(res.error || 'Gagal menyimpan.');
  } catch (e) { toast('Gagal menyimpan soal.'); }
});

$('#g-type').addEventListener('change', () => {
  const t = $('#g-type').value;
  $('#g-hint').textContent = t === 'pg'
    ? 'Tandai tepat SATU jawaban benar dengan tanda * di depan baris.'
    : t === 'mcma'
      ? 'Tandai SEMUA jawaban benar dengan tanda * di depan baris.'
      : 'Tulis pernyataan. Tandai * di depan untuk pernyataan BENAR (tanpa * = Salah).';
});

function resetGuruForm() {
  $('#g-question').value = ''; $('#g-options').value = ''; $('#g-stimulus').value = '';
}

/* ---------------- boot ---------------- */
(async function boot() {
  await initWilayah();
  const local = loadLocalProfile();
  if (local) {
    fillProfileForm(local);
    // sinkronkan otomatis bila data utama ada
    socket.emit('player:sync', { ...local, playerId: PID });
  } else {
    showView('#view-setup');
  }
  // jika server lambat merespons, tampilkan setup sebagai cadangan
  setTimeout(() => { if (!state.me) showView('#view-setup'); }, 1500);
})();
