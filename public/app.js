/* TKA: The Knight of Academy — klien */
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
  me: null,
  jenjang: '',
  mapel: '',
  match: null,
  round: null,
  selected: null,
  locked: false,
  myWins: 0,
  oppWins: 0,
  catalog: { categories: [], items: [], rarities: {} },
  catKarakter: null,
  catToko: null,
};

const RARITY_KEY = { R: 'r', SR: 'sr', SSR: 'ssr' };

/* ---------------- util ---------------- */
function showView(id) {
  $$('.view').forEach((v) => v.classList.add('hidden'));
  const el = $(id);
  if (el) el.classList.remove('hidden');
  $$('#tabbar .tab').forEach((t) => t.classList.toggle('active', t.dataset.view === id));
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
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'HTTP ' + r.status), { data });
  return data;
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- karakter (avatar) ---------------- */
function defaultEquipped() {
  const eq = {};
  for (const cat of state.catalog.categories) {
    const free = state.catalog.items.find((i) => i.cat === cat.key && i.price === 0);
    if (free) eq[cat.key] = free.id;
  }
  return eq;
}
function equippedOf(player) {
  const eq = player?.cosmetics?.equipped;
  return eq && Object.keys(eq).length ? eq : defaultEquipped();
}
function avatarHTML(equipped, size) {
  return window.Avatar.svg(equipped || defaultEquipped(), { size: size || 120 });
}
function paint(el, equipped, size) {
  if (!el) return;
  el.innerHTML = avatarHTML(equipped, size);
}

/* ---------------- koneksi ---------------- */
socket.on('connect', () => { $('#connDot').classList.add('on'); $('#connText').textContent = 'siap'; });
socket.on('disconnect', () => { $('#connDot').classList.remove('on'); $('#connText').textContent = 'putus'; });

/* ---------------- profil lokal ---------------- */
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

/* ---------------- wilayah ---------------- */
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
  applyProfile(profile);
  state.jenjang = profile.jenjang;
  loadMapelList();
  $('#tabbar').classList.remove('hidden');
  showView('#view-arena');
  if (isNew) toast('Ksatria baru terdaftar. Koin awalmu: ' + (profile.progress?.coins ?? 0) + ' 🪙');
});
socket.on('player:error', ({ message }) => toast(message || 'Gagal menyimpan profil.'));
socket.on('player:data', (p) => { if (p) applyProfile(p); });

function applyProfile(p) {
  state.me = p;
  state.jenjang = p.jenjang || state.jenjang;
  refreshHud();
  refreshArena();
  refreshKarakter();
  refreshToko();
  refreshProfil();
}

/* ---------------- HUD & Arena ---------------- */
function refreshHud() {
  if (!state.me) return;
  $('#hud-coins').textContent = (state.me.progress?.coins ?? state.me.wallet?.coins ?? 0).toLocaleString('id-ID');
  $('#hud-level').textContent = 'Lv ' + (state.me.level || 1);
}
function starStr(n, per) {
  if (per) return n > 0 ? '★'.repeat(Math.min(n, per)) : '—';
  return '★'.repeat(Math.min(n, 6)) + (n > 6 ? '+' : '');
}
function refreshArena() {
  if (!state.me) return;
  const r = state.me.rank;
  const pr = state.me.progress || {};
  $('#rankTier').textContent = r.label;
  $('#rankStars').textContent = starStr(r.s, r.starsPer);
  $('#lobbyShield').textContent = r.shield || 0;
  $('#lobbyWho').textContent = state.me.name + (state.me.kelas ? ' · Kelas ' + state.me.kelas : '');
  $('#lvl-num').textContent = 'Level ' + (pr.level || 1);
  $('#lvl-xptxt').textContent = (pr.xp || 0) + ' / ' + (pr.need || 0) + ' XP';
  $('#lvl-xpbar').style.width = (pr.pct || 0) + '%';
  const st = state.me.stats || {};
  $('#st-matches').textContent = st.matches || 0;
  $('#st-wins').textContent = st.wins || 0;
  $('#st-losses').textContent = st.losses || 0;
  $('#st-wr').textContent = st.matches ? Math.round((st.wins / st.matches) * 100) + '%' : '0%';
  $('#st-poin').textContent = st.poin || 0;
  paint($('#arena-avatar'), equippedOf(state.me), 124);
}
async function loadMapelList() {
  try {
    const list = await api('/api/bank/mapel?jenjang=' + encodeURIComponent(state.jenjang));
    const sel = $('#f-mapel');
    sel.innerHTML = '<option value="">— pilih mapel —</option>' + list.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    if (!list.length) sel.innerHTML = '<option value="">(belum ada soal untuk jenjang ini)</option>';
  } catch (e) { console.error(e); }
}
function openEditProfile() { fillProfileForm(state.me); showView('#view-setup'); }
$('#btn-edit').addEventListener('click', openEditProfile);
$('#btn-edit-2').addEventListener('click', openEditProfile);
$('#btn-ke-karakter').addEventListener('click', () => showView('#view-karakter'));

/* ---------------- tab bawah ---------------- */
$('#tabbar').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  const view = btn.dataset.view;
  showView(view);
  if (view === '#view-board') loadBoard();
  if (view === '#view-guru') return;
});

/* ---------------- KARAKTER ---------------- */
function renderChips(sel, active, onPick) {
  const box = $(sel);
  box.innerHTML = state.catalog.categories.map((c) =>
    `<button class="chip${c.key === active ? ' active' : ''}" data-cat="${c.key}">${c.icon} ${esc(c.name)}</button>`
  ).join('');
  box.onclick = (e) => { const b = e.target.closest('.chip'); if (b) onPick(b.dataset.cat); };
}
function refreshKarakter() {
  if (!state.me || !state.catalog.categories.length) return;
  if (!state.catKarakter) state.catKarakter = state.catalog.categories[0].key;
  paint($('#kar-avatar'), equippedOf(state.me), 124);
  $('#kar-name').textContent = state.me.name || '—';
  $('#kar-count').textContent = (state.me.cosmetics?.owned?.length || 0) + ' kosmetik dimiliki';

  renderChips('#kar-cats', state.catKarakter, (cat) => { state.catKarakter = cat; refreshKarakter(); });
  const owned = new Set(state.me.cosmetics?.owned || []);
  const eq = equippedOf(state.me);
  const items = state.catalog.items.filter((i) => i.cat === state.catKarakter && owned.has(i.id));
  $('#kar-grid').innerHTML = items.map((it) => {
    const on = eq[it.cat] === it.id;
    const rk = RARITY_KEY[it.rarity] || 'r';
    return `<div class="item ${rk}">
      <div class="item-art">${avatarHTML({ ...eq, [it.cat]: it.id }, 120)}</div>
      <div class="item-name">${esc(it.name)}</div>
      <div class="item-foot"><span class="rar ${rk}">${it.rarity}</span>${on ? '<span class="tag">Dipakai</span>' : ''}</div>
      <button class="mini-btn ${on ? 'on' : ''}" data-equip="${it.id}" data-cat="${it.cat}" ${on ? 'disabled' : ''}>${on ? 'Sedang Dipakai' : 'Pakai'}</button>
    </div>`;
  }).join('') || '<p class="hint">Belum ada kosmetik di bagian ini. Belanja dulu di Toko!</p>';

  $('#kar-grid').onclick = async (e) => {
    const b = e.target.closest('[data-equip]');
    if (!b) return;
    try {
      const res = await api('/api/karakter/pakai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: PID, cat: b.dataset.cat, itemId: b.dataset.equip }),
      });
      applyProfile(res.profile);
      $('#kar-status').textContent = 'Perlengkapan dipakai.';
    } catch (err) { toast(err.message); }
  };
}
$('#kar-random').addEventListener('click', async () => {
  const owned = new Set(state.me?.cosmetics?.owned || []);
  const eq = { ...equippedOf(state.me) };
  for (const cat of state.catalog.categories) {
    const pool = state.catalog.items.filter((i) => i.cat === cat.key && owned.has(i.id));
    if (pool.length) eq[cat.key] = pool[Math.floor(Math.random() * pool.length)].id;
  }
  // simpan berurutan
  try {
    let prof = state.me;
    for (const [cat, id] of Object.entries(eq)) {
      if (prof.cosmetics?.equipped?.[cat] === id) continue;
      const res = await api('/api/karakter/pakai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: PID, cat, itemId: id }),
      });
      prof = res.profile;
    }
    applyProfile(prof);
    toast('Penampilan diacak! 🎲');
  } catch (err) { toast(err.message); }
});

/* ---------------- TOKO ---------------- */
function refreshToko() {
  if (!state.me || !state.catalog.categories.length) return;
  if (!state.catToko) state.catToko = state.catalog.categories[0].key;
  const coins = state.me.progress?.coins ?? state.me.wallet?.coins ?? 0;
  $('#toko-coins').textContent = coins.toLocaleString('id-ID');

  renderChips('#toko-cats', state.catToko, (cat) => { state.catToko = cat; refreshToko(); });
  const owned = new Set(state.me.cosmetics?.owned || []);
  const eq = equippedOf(state.me);
  const items = state.catalog.items.filter((i) => i.cat === state.catToko);
  $('#toko-grid').innerHTML = items.map((it) => {
    const rk = RARITY_KEY[it.rarity] || 'r';
    const have = owned.has(it.id);
    const on = eq[it.cat] === it.id;
    let foot;
    if (have) foot = `<div class="item-foot"><span class="rar ${rk}">${it.rarity}</span><span class="tag">Dimiliki</span></div>
        <button class="mini-btn ${on ? 'on' : ''}" data-equip="${it.id}" data-cat="${it.cat}" ${on ? 'disabled' : ''}>${on ? 'Sedang Dipakai' : 'Pakai'}</button>`;
    else {
      const afford = coins >= it.price;
      foot = `<div class="item-foot"><span class="rar ${rk}">${it.rarity}</span><span class="price">🪙 ${it.price.toLocaleString('id-ID')}</span></div>
        <button class="mini-btn" data-buy="${it.id}" ${afford ? '' : 'disabled'}>${afford ? 'Beli' : 'Koin kurang'}</button>`;
    }
    return `<div class="item ${rk}">
      <div class="item-art">${avatarHTML({ ...eq, [it.cat]: it.id }, 120)}</div>
      <div class="item-name">${esc(it.name)}</div>
      ${foot}
    </div>`;
  }).join('');

  $('#toko-grid').onclick = async (e) => {
    const buy = e.target.closest('[data-buy]');
    const equip = e.target.closest('[data-equip]');
    try {
      if (buy) {
        const res = await api('/api/toko/beli', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: PID, itemId: buy.dataset.buy }),
        });
        applyProfile(res.profile);
        toast('Pembelian berhasil! 🎉');
      } else if (equip) {
        const res = await api('/api/karakter/pakai', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: PID, cat: equip.dataset.cat, itemId: equip.dataset.equip }),
        });
        applyProfile(res.profile);
      }
    } catch (err) { toast(err.message); }
  };
}

/* ---------------- PROFIL ---------------- */
function refreshProfil() {
  if (!state.me) return;
  paint($('#prof-avatar'), equippedOf(state.me), 124);
  $('#p-name').textContent = state.me.name || '—';
  $('#p-jenjang').textContent = state.me.jenjang || '—';
  $('#p-kelas').textContent = state.me.kelas || '—';
  $('#p-sekolah').textContent = state.me.sekolah || '—';
  const r = state.me.region || {};
  $('#p-wilayah').textContent = [r.kelName, r.kecName, r.kabName, r.provName].filter(Boolean).join(', ') || '—';
}

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
  paint($('#m-you-avatar'), data.you.avatar, 90);
  $('#m-opp-name').textContent = data.opponent.name;
  $('#m-opp-rank').textContent = data.opponent.rank.label + ' · ' + data.opponent.rank.s + '★';
  paint($('#m-opp-avatar'), data.opponent.avatar, 90);
  $('#m-round').textContent = '1';
  updateScore();
  $('#m-question').textContent = 'Bersiap…';
  $('#m-answers').innerHTML = '';
  $('#btn-lock').disabled = true;
  $('#m-wait').classList.add('hidden');
  showEl('#ov-match');
});
function updateScore() { $('#m-pips').textContent = `${state.myWins} - ${state.oppWins}`; }

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

  state.myWins = data.wins[PID] || 0;
  state.oppWins = oppPid ? (data.wins[oppPid] || 0) : 0;
  updateScore();

  const title = $('#r-title');
  if (data.tie) title.textContent = 'Ronde Seri — Adu Cepat!';
  else title.textContent = data.winner === PID ? 'Ronde Ini Kamu Menang! ⚔️' : 'Ronde Ini Kamu Kalah';

  const fmt = (r, label) => `<div class="rb-row"><span>${label}</span><span>${r.correct ? '<b>BENAR</b>' : (r.answered ? 'salah' : 'tidak dijawab')}${r.t != null ? ' · ' + (r.t / 1000).toFixed(1) + 's' : ''}</span></div>`;
  $('#r-body').innerHTML =
    fmt(mine, 'Kamu (' + state.me.name + ')') +
    fmt(opp, 'Lawan') +
    `<div class="rb-row"><span>Skor ronde</span><b>${state.myWins} - ${state.oppWins}</b></div>`;
  $('#r-next').textContent = data.tie ? 'Soal baru disiapkan untuk menentukan pemenang ronde…' : (data.decided ? 'Pertandingan selesai…' : 'Ronde berikutnya segera dimulai…');
  hideEl('#ov-match');
  showEl('#ov-round');
});

socket.on('match:end', (data) => {
  clearInterval(state.round?.timerId);
  hideEl('#ov-match'); hideEl('#ov-round');
  const win = data.result === 'menang';
  $('#e-title').textContent = win ? '🏆 KAMU JUARA!' : 'Bendera Diturunkan';
  const rb = data.rankBefore || { label: '-' };
  const ra = data.rankAfter;
  let rankInfo = `<div class="rb-row"><span>Rank</span><span>${esc(rb.label)} → <b>${esc(ra.label)}</b> (${ra.s}★)</span></div>`;
  if (data.rankEvent && data.rankEvent.startsWith('promote')) rankInfo += `<div class="rb-row"><span>Status</span><span class="badge-win">NAIK RANK! 🚀</span></div>`;
  else if (data.protectedBy) rankInfo += `<div class="rb-row"><span>Status</span><span class="badge-win">Dilindungi (${esc(data.protectedBy)}) 🛡</span></div>`;
  else if (!win) rankInfo += `<div class="rb-row"><span>Status</span><span class="badge-lose">Turun bintang</span></div>`;

  const rw = data.reward || { coins: 0, xp: 0, levelUps: 0 };
  let rewardHTML = `<div style="margin-top:12px"><span class="reward">🪙 +${rw.coins} koin</span><span class="reward">✨ +${rw.xp} XP</span>`;
  if (rw.levelUps) rewardHTML += `<span class="reward">🎖️ Naik Level ×${rw.levelUps}</span>`;
  rewardHTML += '</div>';

  $('#e-body').innerHTML =
    `<div class="rb-row"><span>Skor akhir</span><b>${data.scoreYou} - ${data.scoreOpponent}</b></div>` +
    `<div class="rb-row"><span>Lawan</span><span>${esc(data.opponent.name)}</span></div>` +
    rankInfo +
    (data.walkover ? `<div class="rb-row"><span>Catatan</span><span>${win ? 'Kemenangan WO (lawan keluar)' : 'Kamu keluar dari pertandingan'}</span></div>` : '') +
    rewardHTML;
  showEl('#ov-end');
});

socket.on('match:cancelled', ({ reason }) => {
  clearInterval(state.round?.timerId);
  hideEl('#ov-match'); hideEl('#ov-round');
  toast('Pertandingan dibatalkan (' + (reason || '') + ').');
});

socket.on('match:error', ({ message }) => {
  clearInterval(state.round?.timerId);
  hideEl('#ov-match'); hideEl('#ov-round');
  toast(message || 'Terjadi kesalahan pertandingan.');
  showView('#view-arena');
});

$('#btn-end-ok').addEventListener('click', () => {
  hideEl('#ov-end');
  socket.emit('player:get', { playerId: PID });
  showView('#view-arena');
});
$('#btn-resign').addEventListener('click', () => { socket.emit('match:resign'); });

/* ---------------- papan peringkat ---------------- */
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
$('#btn-guru-back').addEventListener('click', () => showView('#view-profil'));

$('#g-type').addEventListener('change', () => {
  const t = $('#g-type').value;
  $('#g-hint').textContent = t === 'pg'
    ? 'Tandai tepat SATU jawaban benar dengan tanda * di depan baris.'
    : t === 'mcma'
      ? 'Tandai SEMUA jawaban benar dengan tanda * di depan baris.'
      : 'Tulis pernyataan. Tandai * di depan untuk pernyataan BENAR (tanpa * = Salah).';
});

$('#btn-guru-save').addEventListener('click', async () => {
  const type = $('#g-type').value;
  const base = {
    jenjang: $('#g-jenjang').value,
    mapel: $('#g-mapel').value.trim(),
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
    if (res.ok) { $('#g-status').textContent = 'Tersimpan! Total soal: ' + res.total; toast('Soal tersimpan.'); renderResetGuru(); }
    else toast(res.error || 'Gagal menyimpan.');
  } catch (e) { toast('Gagal menyimpan soal.'); }
});
function renderResetGuru() { $('#g-question').value = ''; $('#g-options').value = ''; $('#g-stimulus').value = ''; }

/* ---------------- boot ---------------- */
(async function boot() {
  try {
    const cat = await api('/api/toko');
    state.catalog = cat;
    window.Avatar.setCatalog(cat.items);
  } catch (e) { console.error('gagal memuat katalog', e); }

  paint($('#setup-avatar'), defaultEquipped(), 124);

  await initWilayah();

  const local = loadLocalProfile();
  if (local) {
    fillProfileForm(local);
    socket.emit('player:sync', { ...local, playerId: PID });
  } else {
    showView('#view-setup');
  }
  setTimeout(() => { if (!state.me) showView('#view-setup'); }, 1500);
})();
