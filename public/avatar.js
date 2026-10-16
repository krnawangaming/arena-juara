/* TKA: The Knight of Academy — penggambar karakter (SVG berlapis)
   Avatar disusun dari kosmetik yang dipakai: aura -> jubah -> tubuh -> zirah
   -> kepala -> wajah -> rambut -> helm -> senjata -> perisai -> pendamping. */
(function (global) {
  let CATALOG = {};   // id -> item { id, cat, name, rarity, art }
  let UID = 0;

  function setCatalog(items) {
    CATALOG = {};
    for (const it of items || []) CATALOG[it.id] = it;
  }

  // ---------------------------------------------------------------- AURA
  function aura(a, uid) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#7fb2ff';
    const c2 = s.c2 || '#2b3f70';
    switch (s.shape) {
      case 'sunbeam':
        return `<defs><radialGradient id="au${uid}" cx="50%" cy="32%" r="78%">
            <stop offset="0%" stop-color="${c1}"/><stop offset="70%" stop-color="${c1}" stop-opacity=".35"/>
            <stop offset="100%" stop-color="#16233f"/></radialGradient></defs>
          <rect width="200" height="260" fill="url(#au${uid})"/>
          <g fill="#fff" opacity=".55"><circle cx="34" cy="46" r="2.6"/><circle cx="168" cy="60" r="2.2"/><circle cx="150" cy="140" r="2.4"/><circle cx="46" cy="170" r="2"/></g>`;
      case 'sparkle': {
        let sp = '';
        const pts = [[30, 40], [170, 52], [156, 150], [40, 168], [100, 26], [178, 210], [24, 224]];
        for (const [x, y] of pts) {
          sp += `<path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z" fill="${c1}" opacity=".85"/>`;
        }
        return `<defs><linearGradient id="au${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#20335c"/><stop offset="100%" stop-color="#0e1730"/></linearGradient></defs>
          <rect width="200" height="260" fill="url(#au${uid})"/>${sp}`;
      }
      case 'storm':
        return `<defs><linearGradient id="au${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5b6b8c"/><stop offset="100%" stop-color="#1b2438"/></linearGradient></defs>
          <rect width="200" height="260" fill="url(#au${uid})"/>
          <ellipse cx="60" cy="40" rx="46" ry="20" fill="#e8eefb" opacity=".22"/>
          <ellipse cx="150" cy="52" rx="40" ry="17" fill="#e8eefb" opacity=".16"/>
          <path d="M104 22 L84 78 L100 78 L82 132 L118 66 L100 66 Z" fill="${c2}" opacity=".9"/>`;
      case 'royal':
        return `<defs><radialGradient id="au${uid}" cx="50%" cy="120%" r="90%">
            <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="#221238"/></radialGradient></defs>
          <rect width="200" height="260" fill="url(#au${uid})"/>
          <g stroke="${c2}" stroke-width="3" opacity=".55">
            <path d="M100 150 L40 30"/><path d="M100 150 L160 30"/><path d="M100 150 L100 20"/><path d="M100 150 L10 90"/><path d="M100 150 L190 90"/>
          </g>`;
      case 'celestial':
        return `<defs><linearGradient id="au${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2b4a9c"/><stop offset="60%" stop-color="#101c3a"/><stop offset="100%" stop-color="#05070f"/></linearGradient></defs>
          <rect width="200" height="260" fill="url(#au${uid})"/>
          <circle cx="152" cy="52" r="22" fill="${c2}" opacity=".9"/>
          <circle cx="144" cy="46" r="18" fill="#101c3a" opacity=".6"/>
          <g fill="#fff" opacity=".8"><circle cx="34" cy="40" r="2"/><circle cx="70" cy="24" r="1.6"/><circle cx="168" cy="120" r="2"/><circle cx="30" cy="150" r="1.8"/><circle cx="60" cy="214" r="1.6"/></g>`;
      default:
        return `<rect width="200" height="260" fill="#16233f"/>`;
    }
  }

  // ---------------------------------------------------------------- JUBAH
  function cape(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#b03a48';
    const c2 = s.c2 || '#7e2631';
    const c3 = s.c3 || c2;
    switch (s.shape) {
      case 'short':
        return `<path d="M66 106 Q100 96 134 106 L128 156 Q100 146 72 156 Z" fill="${c1}"/>
          <path d="M66 106 Q100 96 134 106 L132 118 Q100 108 68 118 Z" fill="${c2}"/>`;
      case 'long':
        return `<path d="M64 104 Q100 94 136 104 L132 196 Q100 184 68 196 Z" fill="${c1}"/>
          <path d="M64 104 Q100 94 136 104 L134 116 Q100 106 66 116 Z" fill="${c2}"/>`;
      case 'royal':
        return `<path d="M62 102 Q100 92 138 102 L134 210 Q100 196 66 210 Z" fill="${c1}"/>
          <path d="M62 102 Q100 92 138 102 L136 114 Q100 104 64 114 Z" fill="${c3}"/>
          <path d="M70 118 L70 202 M130 118 L130 202" stroke="${c3}" stroke-width="3" opacity=".8"/>`;
      case 'phoenix':
        return `<g>
            <path d="M64 104 Q100 92 136 104 L130 188 Q114 176 100 190 Q86 176 70 188 Z" fill="${c1}"/>
            <path d="M74 126 Q92 150 76 184 Q66 156 74 126 Z" fill="${c2}" opacity=".85"/>
            <path d="M126 126 Q108 150 124 184 Q134 156 126 126 Z" fill="${c2}" opacity=".85"/>
            <path d="M62 102 Q100 92 138 102 L137 112 Q100 103 63 112 Z" fill="${c3}"/></g>`;
      default:
        return '';
    }
  }

  // ---------------------------------------------------------------- TUBUH
  function body(skin, cap) {
    const c1 = skin.c1 || '#ffd9b3';
    const c2 = skin.c2 || '#e8b98c';
    const pants = '#3b3550';
    return `
      <ellipse cx="100" cy="224" rx="52" ry="10" fill="#000" opacity=".28"/>
      <rect x="85" y="162" width="13" height="54" rx="6" fill="${pants}"/>
      <rect x="102" y="162" width="13" height="54" rx="6" fill="${pants}"/>
      <ellipse cx="91.5" cy="218" rx="11" ry="7" fill="#241f33"/>
      <ellipse cx="108.5" cy="218" rx="11" ry="7" fill="#241f33"/>
      <rect x="58" y="110" width="15" height="52" rx="7.5" fill="${c1}"/>
      <rect x="127" y="110" width="15" height="52" rx="7.5" fill="${c1}"/>
      <circle cx="65.5" cy="164" r="8.5" fill="${c1}"/>
      <circle cx="134.5" cy="164" r="8.5" fill="${c1}"/>
      <rect x="74" y="104" width="52" height="64" rx="16" fill="#4b4a63"/>
      <rect x="93" y="94" width="14" height="14" rx="6" fill="${c2}"/>
      ${cap || ''}`;
  }

  // ---------------------------------------------------------------- ZIRAH
  function armor(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#6b8f4e';
    const c2 = s.c2 || '#4d6a37';
    const c3 = s.c3 || '#8a6b3a';
    const T = 'x="74" y="104" width="52" height="64" rx="16"';
    switch (s.shape) {
      case 'leather':
        return `<rect ${T} fill="${c1}"/>
          <path d="M74 108 Q100 96 126 108 L126 120 Q100 108 74 120 Z" fill="${c2}"/>
          <path d="M84 106 L96 160 M116 106 L104 160" stroke="${c3}" stroke-width="5" opacity=".85"/>
          <circle cx="72" cy="116" r="13" fill="${c1}"/><circle cx="128" cy="116" r="13" fill="${c1}"/>
          <rect x="72" y="146" width="56" height="10" rx="4" fill="${c3}"/>`;
      case 'chain':
        return `<rect ${T} fill="${c2}"/>
          <g fill="${c1}" opacity=".9">
            ${[112, 126, 140, 154].map((y) => [80, 92, 104, 116].map((x) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')).join('')}
          </g>
          <rect x="72" y="146" width="56" height="10" rx="4" fill="#5c6576"/>
          <circle cx="70" cy="114" r="14" fill="${c1}"/><circle cx="130" cy="114" r="14" fill="${c1}"/>`;
      case 'plate':
        return `<rect ${T} fill="${c1}"/>
          <path d="M100 106 L100 168" stroke="${c2}" stroke-width="3"/>
          <path d="M74 122 Q100 132 126 122" stroke="${c2}" stroke-width="3" fill="none"/>
          <circle cx="70" cy="112" r="15" fill="${c1}" stroke="${c2}" stroke-width="2"/>
          <circle cx="130" cy="112" r="15" fill="${c1}" stroke="${c2}" stroke-width="2"/>
          <rect x="72" y="146" width="56" height="10" rx="4" fill="${c2}"/>`;
      case 'royal':
        return `<rect ${T} fill="${c1}"/>
          <path d="M100 104 L100 168" stroke="${c2}" stroke-width="3"/>
          <path d="M76 118 Q100 130 124 118" stroke="${c2}" stroke-width="3" fill="none"/>
          <circle cx="70" cy="112" r="15" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <circle cx="130" cy="112" r="15" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <circle cx="100" cy="132" r="7" fill="${c3}"/>
          <rect x="72" y="146" width="56" height="10" rx="4" fill="${c2}"/>`;
      case 'dragon':
        return `<rect ${T} fill="${c1}"/>
          <g stroke="${c2}" stroke-width="2.4" fill="none" opacity=".9">
            <path d="M80 128 q8 -8 16 0 q8 8 16 0 q8 -8 16 0"/>
            <path d="M80 144 q8 -8 16 0 q8 8 16 0 q8 -8 16 0"/>
          </g>
          <path d="M64 104 L74 90 L84 104 Z" fill="${c3}"/>
          <path d="M116 104 L126 90 L136 104 Z" fill="${c3}"/>
          <circle cx="70" cy="112" r="15" fill="${c1}" stroke="${c3}" stroke-width="3"/>
          <circle cx="130" cy="112" r="15" fill="${c1}" stroke="${c3}" stroke-width="3"/>`;
      case 'cloth':
      default:
        return `<rect ${T} fill="${c1}"/>
          <path d="M74 108 Q100 96 126 108 L126 120 Q100 108 74 120 Z" fill="${c2}"/>
          <rect x="72" y="146" width="56" height="10" rx="4" fill="${c3}"/>
          <rect x="96" y="146" width="8" height="10" fill="#c9a227"/>`;
    }
  }

  // ---------------------------------------------------------------- KEPALA & WAJAH
  function head(skin) {
    const c1 = skin.c1 || '#ffd9b3';
    const c2 = skin.c2 || '#e8b98c';
    return `<circle cx="100" cy="72" r="30" fill="${c1}"/>
      <circle cx="70" cy="74" r="6" fill="${c2}"/><circle cx="130" cy="74" r="6" fill="${c2}"/>`;
  }
  function face(a) {
    const s = (a && a.art) || {};
    const ink = '#26324a';
    const EYE = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${ink}"/>`;
    const brow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
    const blush = `<circle cx="80" cy="86" r="5" fill="#ff8fa3" opacity=".5"/><circle cx="120" cy="86" r="5" fill="#ff8fa3" opacity=".5"/>`;
    switch (s.shape) {
      case 'determined':
        return `${EYE(90, 76)}${EYE(110, 76)}${brow(82, 68, 96, 71)}${brow(118, 68, 104, 71)}
          <path d="M91 90 L109 90" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`;
      case 'happy':
        return `<path d="M84 78 q6 -7 12 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <path d="M104 78 q6 -7 12 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <path d="M90 86 q10 11 20 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>${blush}`;
      case 'calm':
        return `${EYE(90, 77)}${EYE(110, 77)}<path d="M92 91 L108 91" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
      case 'angry':
        return `${EYE(90, 78)}${EYE(110, 78)}${brow(82, 66, 97, 72)}${brow(118, 66, 103, 72)}
          <path d="M92 93 q8 -7 16 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      case 'wink':
        return `${EYE(90, 76)}<path d="M104 78 q6 -7 12 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <path d="M92 88 q8 9 16 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      case 'smile':
      default:
        return `${EYE(90, 76)}${EYE(110, 76)}<path d="M92 87 q8 8 16 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    }
  }

  // ---------------------------------------------------------------- RAMBUT
  function hair(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#3a2a1c';
    const c2 = s.c2 || '#2a1d13';
    switch (s.shape) {
      case 'spiky':
        return `<path d="M68 76 A32 32 0 0 1 132 76 L132 64 L124 78 L118 56 L108 74 L102 48 L94 74 L84 56 L78 78 L68 64 Z" fill="${c1}"/>`;
      case 'curly':
        return `<g fill="${c1}"><circle cx="76" cy="66" r="12"/><circle cx="94" cy="54" r="12"/>
          <circle cx="112" cy="54" r="12"/><circle cx="128" cy="66" r="12"/><circle cx="102" cy="48" r="13"/></g>`;
      case 'ponytail':
        return `<path d="M68 76 A32 32 0 0 1 132 76 L132 70 Q120 50 100 50 Q80 50 68 70 Z" fill="${c1}"/>
          <path d="M126 66 Q152 82 146 122 Q139 136 131 126 Q139 94 118 74 Z" fill="${c2}"/>`;
      case 'mohawk':
        return `<path d="M86 54 Q100 24 114 54 Q107 48 100 48 Q93 48 86 54 Z" fill="${c1}"/>
          <path d="M92 52 L100 30 L108 52 Z" fill="${c2}"/>`;
      case 'short':
      default:
        return `<path d="M68 76 A32 32 0 0 1 132 76 L132 70 Q120 50 100 50 Q80 50 68 70 Z" fill="${c1}"/>
          <path d="M78 60 Q92 50 108 56 Q98 62 90 60 Q84 60 78 60 Z" fill="${c2}" opacity=".55"/>`;
    }
  }

  // ---------------------------------------------------------------- HELM
  function helm(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#c3cde0';
    const c2 = s.c2 || '#7c8aa6';
    const c3 = s.c3 || '#ff4d6d';
    switch (s.shape) {
      case 'bandana':
        return `<path d="M68 68 Q100 54 132 68 L132 79 Q100 67 68 79 Z" fill="${c1}"/>
          <path d="M128 66 l18 -9 l-5 15 z" fill="${c2}"/>`;
      case 'cap':
        return `<path d="M66 73 Q100 44 134 73 L134 77 Q100 61 66 77 Z" fill="${c1}"/>
          <rect x="60" y="73" width="80" height="9" rx="4" fill="${c2}"/>`;
      case 'knight':
        return `<path d="M68 72 Q100 40 132 72 L132 98 Q100 118 68 98 Z" fill="${c1}"/>
          <rect x="82" y="64" width="36" height="13" rx="5" fill="#243049"/>
          <path d="M100 46 L100 94" stroke="${c2}" stroke-width="3"/>
          <path d="M100 42 Q122 18 136 40 Q118 38 111 54 Z" fill="${c3}"/>`;
      case 'crown':
        return `<path d="M70 60 L78 40 L88 56 L100 34 L112 56 L122 40 L130 60 Z" fill="${c1}"/>
          <rect x="70" y="58" width="60" height="10" rx="4" fill="${c2}"/>
          <circle cx="100" cy="52" r="4" fill="${c3}"/><circle cx="79" cy="48" r="3" fill="${c3}"/><circle cx="121" cy="48" r="3" fill="${c3}"/>`;
      case 'horned':
        return `<path d="M68 72 Q100 42 132 72 L132 96 Q100 114 68 96 Z" fill="${c1}"/>
          <path d="M68 66 Q44 52 40 28 Q62 42 76 62 Z" fill="${c3}"/>
          <path d="M132 66 Q156 52 160 28 Q138 42 124 62 Z" fill="${c3}"/>
          <rect x="84" y="68" width="32" height="10" rx="4" fill="#2c2a3a"/>`;
      case 'dragon':
        return `<path d="M66 74 Q100 40 134 74 L134 96 Q100 118 66 96 Z" fill="${c1}"/>
          <path d="M100 42 Q130 26 140 52 Q120 44 108 58 Z" fill="${c2}"/>
          <rect x="84" y="70" width="32" height="10" rx="4" fill="#12241b"/>
          <path d="M100 46 L100 96" stroke="${c3}" stroke-width="3"/>
          <circle cx="100" cy="60" r="3.4" fill="${c3}"/>`;
      default:
        return '';
    }
  }

  // ---------------------------------------------------------------- SENJATA (tangan kanan)
  function weapon(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#cdd6e4';
    const c2 = s.c2 || '#8f9bb0';
    const c3 = s.c3 || '#8a5a2b';
    switch (s.shape) {
      case 'sword':
        return `<g><rect x="146" y="44" width="9" height="106" rx="3" fill="${c1}"/>
          <rect x="146" y="44" width="4" height="106" fill="${c2}" opacity=".6"/>
          <rect x="136" y="148" width="30" height="8" rx="3" fill="${c2}"/>
          <rect x="146" y="156" width="9" height="24" rx="3" fill="${c3}"/>
          <circle cx="150.5" cy="184" r="6" fill="${c2}"/></g>`;
      case 'axe':
        return `<g><rect x="147" y="40" width="8" height="146" rx="3" fill="${c3}"/>
          <path d="M151 44 Q120 54 124 84 Q140 76 151 74 Z" fill="${c1}"/>
          <path d="M151 44 Q182 54 178 84 Q162 76 151 74 Z" fill="${c1}"/>
          <path d="M124 84 Q138 92 151 86 Q138 100 126 96 Z" fill="${c2}" opacity=".7"/></g>`;
      case 'spear':
        return `<g><rect x="149" y="30" width="7" height="160" rx="3" fill="${c3}"/>
          <path d="M152.5 8 L166 40 L152.5 34 L139 40 Z" fill="${c1}"/>
          <path d="M152.5 20 L152.5 40" stroke="${c2}" stroke-width="2"/>
          <path d="M139 42 Q152.5 50 166 42" stroke="${c3}" stroke-width="3" fill="none"/></g>`;
      case 'greatsword':
        return `<g><path d="M138 40 L165 40 L168 150 L151.5 162 L135 150 Z" fill="${c1}"/>
          <path d="M151.5 44 L151.5 152" stroke="${c2}" stroke-width="3"/>
          <rect x="130" y="150" width="43" height="9" rx="3" fill="${c2}"/>
          <rect x="147" y="158" width="9" height="26" rx="3" fill="${c3}"/>
          <circle cx="151.5" cy="188" r="6" fill="${c2}"/></g>`;
      case 'flame':
        return `<g><rect x="146" y="52" width="10" height="98" rx="4" fill="${c1}"/>
          <path d="M151 52 q-13 -14 -2 -28 q-2 12 8 16 q10 -4 8 -18 q12 16 -2 30 Z" fill="${c2}"/>
          <path d="M151 46 q-6 -8 0 -16 q4 8 0 16 Z" fill="${c1}"/>
          <rect x="136" y="146" width="30" height="8" rx="3" fill="${c3}"/>
          <rect x="146" y="154" width="10" height="26" rx="3" fill="${c3}"/></g>`;
      case 'holy':
        return `<g><rect x="146" y="40" width="11" height="108" rx="4" fill="${c1}"/>
          <path d="M151.5 40 L151.5 148" stroke="${c2}" stroke-width="3"/>
          <path d="M136 66 q-22 -6 -30 -26 q20 6 32 20 Z" fill="${c2}" opacity=".95"/>
          <path d="M167 66 q22 -6 30 -26 q-20 6 -32 20 Z" fill="${c2}" opacity=".95"/>
          <rect x="134" y="146" width="34" height="9" rx="3" fill="${c3}"/>
          <rect x="146" y="155" width="11" height="26" rx="3" fill="${c3}"/>
          <circle cx="151.5" cy="186" r="7" fill="${c1}"/></g>`;
      default:
        return '';
    }
  }

  // ---------------------------------------------------------------- PERISAI (tangan kiri)
  function shield(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#a97b46';
    const c2 = s.c2 || '#7a5630';
    const c3 = s.c3 || '#5f3d1b';
    switch (s.shape) {
      case 'wood':
        return `<g><rect x="18" y="104" width="44" height="54" rx="8" fill="${c1}"/>
          <path d="M40 104 L40 158" stroke="${c3}" stroke-width="2" opacity=".6"/>
          <path d="M18 123 L62 123" stroke="${c3}" stroke-width="2" opacity=".6"/>
          <rect x="18" y="104" width="44" height="54" rx="8" fill="none" stroke="${c2}" stroke-width="4"/>
          <circle cx="40" cy="131" r="7" fill="${c3}"/></g>`;
      case 'round':
        return `<g><circle cx="40" cy="130" r="27" fill="${c1}" stroke="${c2}" stroke-width="4"/>
          <circle cx="40" cy="130" r="9" fill="${c3}"/>
          <path d="M40 103 L40 157 M13 130 L67 130" stroke="${c3}" stroke-width="2" opacity=".5"/></g>`;
      case 'kite':
        return `<g><path d="M40 96 L68 116 L40 164 L12 116 Z" fill="${c1}" stroke="${c2}" stroke-width="4"/>
          <path d="M40 96 L40 164" stroke="${c2}" stroke-width="2" opacity=".6"/>
          <circle cx="40" cy="122" r="7" fill="${c3}"/></g>`;
      case 'royal':
        return `<g><path d="M40 94 L70 116 L40 168 L10 116 Z" fill="${c1}" stroke="${c2}" stroke-width="5"/>
          <path d="M40 104 L60 118 L40 152 L20 118 Z" fill="${c3}" opacity=".9"/>
          <circle cx="40" cy="122" r="8" fill="${c1}"/>
          <path d="M40 100 L40 160" stroke="${c2}" stroke-width="2" opacity=".5"/></g>`;
      case 'dragon':
        return `<g><path d="M40 94 L70 116 L40 168 L10 116 Z" fill="${c1}" stroke="${c2}" stroke-width="5"/>
          <path d="M28 108 q12 -8 24 0 q-4 6 -12 6 q-8 0 -12 -6 Z" fill="${c3}"/>
          <path d="M32 128 q8 10 16 0 q-8 -6 -16 0 Z" fill="${c2}" opacity=".8"/>
          <circle cx="40" cy="122" r="6" fill="${c3}"/></g>`;
      default:
        return '';
    }
  }

  // ---------------------------------------------------------------- PENDAMPING
  function pet(a) {
    const s = (a && a.art) || {};
    const c1 = s.c1 || '#f0a24a';
    const c2 = s.c2 || '#c97f2e';
    const c3 = s.c3 || '#ffd76a';
    const G = `<ellipse cx="168" cy="216" rx="20" ry="6" fill="#000" opacity=".25"/>`;
    switch (s.shape) {
      case 'cat':
        return `<g>${G}<ellipse cx="168" cy="196" rx="17" ry="15" fill="${c1}"/>
          <circle cx="168" cy="180" r="12" fill="${c1}"/>
          <path d="M158 172 l-3 -11 l10 5 Z" fill="${c2}"/><path d="M178 172 l3 -11 l-10 5 Z" fill="${c2}"/>
          <circle cx="163" cy="180" r="2" fill="#25324a"/><circle cx="173" cy="180" r="2" fill="#25324a"/>
          <path d="M182 200 q14 -6 12 -20" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
      case 'dog':
        return `<g>${G}<ellipse cx="168" cy="196" rx="17" ry="15" fill="${c1}"/>
          <circle cx="168" cy="180" r="12" fill="${c1}"/>
          <ellipse cx="157" cy="178" rx="5" ry="9" fill="${c2}"/><ellipse cx="179" cy="178" rx="5" ry="9" fill="${c2}"/>
          <circle cx="163" cy="180" r="2" fill="#25324a"/><circle cx="173" cy="180" r="2" fill="#25324a"/>
          <circle cx="168" cy="186" r="3" fill="#25324a"/></g>`;
      case 'owl':
        return `<g>${G}<ellipse cx="168" cy="194" rx="16" ry="18" fill="${c1}"/>
          <path d="M152 180 q-6 -12 4 -14 q4 6 2 12 Z" fill="${c2}"/><path d="M184 180 q6 -12 -4 -14 q-4 6 -2 12 Z" fill="${c2}"/>
          <circle cx="161" cy="186" r="7" fill="#fff"/><circle cx="175" cy="186" r="7" fill="#fff"/>
          <circle cx="161" cy="186" r="3" fill="#25324a"/><circle cx="175" cy="186" r="3" fill="#25324a"/>
          <path d="M168 190 l-4 6 l8 0 Z" fill="${c3}"/></g>`;
      case 'dragonling':
        return `<g>${G}<ellipse cx="168" cy="196" rx="16" ry="14" fill="${c1}"/>
          <circle cx="166" cy="180" r="11" fill="${c1}"/>
          <path d="M176 176 q16 -14 22 2 q-12 -4 -16 6 Z" fill="${c2}"/>
          <path d="M150 186 q-14 -4 -18 -16 q12 4 16 10 Z" fill="${c2}"/>
          <path d="M158 172 l4 -8 l4 8 Z" fill="${c3}"/><path d="M170 170 l4 -8 l4 8 Z" fill="${c3}"/>
          <circle cx="162" cy="180" r="2" fill="#0c2a1c"/><circle cx="171" cy="180" r="2" fill="#0c2a1c"/></g>`;
      case 'phoenixling':
        return `<g>${G}<ellipse cx="168" cy="196" rx="14" ry="13" fill="${c2}"/>
          <circle cx="166" cy="182" r="10" fill="${c1}"/>
          <path d="M176 178 q18 -10 22 4 q-12 -2 -16 6 Z" fill="${c3}"/>
          <path d="M160 208 q-6 14 4 20 q2 -10 10 -14 q-10 -2 -14 -6 Z" fill="${c1}"/>
          <circle cx="162" cy="182" r="2" fill="#3a1200"/><circle cx="171" cy="182" r="2" fill="#3a1200"/>
          <path d="M166 186 l4 5 l-8 0 Z" fill="${c3}"/></g>`;
      default:
        return '';
    }
  }

  function pick(equipped, cat) {
    const id = equipped && equipped[cat];
    return id ? CATALOG[id] : null;
  }

  const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

  function svg(equipped, opt) {
    opt = opt || {};
    const uid = ++UID;
    const size = opt.size || 180;
    const skin = pick(equipped, 'kulit') || { art: { c1: '#ffd9b3', c2: '#e8b98c' } };

    const parts = [
      aura(pick(equipped, 'aura'), uid),
      cape(pick(equipped, 'jubah')),
      body(skin, ''),
      armor(pick(equipped, 'zirah')),
      head(skin),
      face(pick(equipped, 'wajah')),
      hair(pick(equipped, 'rambut')),
      helm(pick(equipped, 'helm')),
      weapon(pick(equipped, 'senjata')),
      shield(pick(equipped, 'perisai')),
      pet(pick(equipped, 'pendamping')),
    ];

    return `<svg ${SVG_NS} viewBox="0 0 200 260" width="${size}" height="${Math.round(size * 1.3)}" class="avatar-svg" role="img" aria-label="Karakter">${parts.join('')}</svg>`;
  }

  global.Avatar = { setCatalog, svg };
})(window);
