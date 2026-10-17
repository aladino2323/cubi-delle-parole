// I disegni del gioco, tutti fatti con il codice (SVG): le figure delle parole e le figurine dell'album.
// Ogni disegno sta in un quadrato di 200 x 200, con il contorno scuro e i colori pieni.
'use strict';

(function () {
  const T = '#2b2433'; // colore del contorno

  const svg = (corpo) =>
    `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<g stroke="${T}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${corpo}</g></svg>`;

  const occhi = (cx, cy, d, r = 6) =>
    `<circle cx="${cx - d}" cy="${cy}" r="${r}" fill="${T}" stroke="none"/>` +
    `<circle cx="${cx + d}" cy="${cy}" r="${r}" fill="${T}" stroke="none"/>` +
    `<circle cx="${cx - d + 2}" cy="${cy - 2}" r="${r / 3}" fill="#fff" stroke="none"/>` +
    `<circle cx="${cx + d + 2}" cy="${cy - 2}" r="${r / 3}" fill="#fff" stroke="none"/>`;

  const sorriso = (cx, cy, l = 16, h = 12) => `<path d="M${cx - l} ${cy} Q${cx} ${cy + h} ${cx + l} ${cy}" fill="none"/>`;

  const guance = (cx, cy, d) =>
    `<circle cx="${cx - d}" cy="${cy}" r="8" fill="#ff8fa3" opacity=".55" stroke="none"/>` +
    `<circle cx="${cx + d}" cy="${cy}" r="8" fill="#ff8fa3" opacity=".55" stroke="none"/>`;

  const stella = (cx, cy, r, colore, contorno = true) => {
    let d = '';
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 === 0 ? r : r * 0.45;
      d += (k === 0 ? 'M' : 'L') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' ';
    }
    return `<path d="${d}Z" fill="${colore}"${contorno ? '' : ' stroke="none"'}/>`;
  };

  // ------------------------------------------------------------ le persone

  function persona(o) {
    const p = Object.assign(
      { pelle: '#f6cfa8', capelli: '#6b4226', stile: 'corti', maglia: '#3b82f6', baffi: false, barba: false, occhiali: false, bimbo: false, cappello: null, fiocco: false },
      o,
    );
    const cy = p.bimbo ? 96 : 90;
    const r = p.bimbo ? 50 : 45;
    const sx = 100 - r;
    const dx = 100 + r;
    let dietro = '';
    let sopra = '';
    if (p.stile === 'lunghi') {
      dietro = `<path d="M${sx - 8} ${cy} Q${sx - 14} ${cy + 66} ${sx + 6} ${cy + 74} L${dx - 6} ${cy + 74} Q${dx + 14} ${cy + 66} ${dx + 8} ${cy} Q100 ${cy - r - 26} ${sx - 8} ${cy} Z" fill="${p.capelli}"/>`;
    }
    const corpo = `<path d="M28 200 Q30 ${cy + r + 8} 100 ${cy + r + 4} Q170 ${cy + r + 8} 172 200 Z" fill="${p.maglia}"/>`;
    const collo = `<rect x="88" y="${cy + r - 14}" width="24" height="22" fill="${p.pelle}"/>`;
    const orecchie = `<circle cx="${sx + 1}" cy="${cy + 4}" r="9" fill="${p.pelle}"/><circle cx="${dx - 1}" cy="${cy + 4}" r="9" fill="${p.pelle}"/>`;
    const testa = `<circle cx="100" cy="${cy}" r="${r}" fill="${p.pelle}"/>`;
    switch (p.stile) {
      case 'corti':
      case 'lunghi':
        sopra = `<path d="M${sx + 1} ${cy - 2} Q${sx - 2} ${cy - r - 10} 100 ${cy - r - 8} Q${dx + 2} ${cy - r - 10} ${dx - 1} ${cy - 2} Q${dx - 12} ${cy - r + 12} 104 ${cy - r + 16} Q${sx + 14} ${cy - r + 14} ${sx + 1} ${cy - 2} Z" fill="${p.capelli}"/>`;
        break;
      case 'ricci':
        for (let k = 0; k < 9; k++) {
          const a = Math.PI + (k * Math.PI) / 8;
          sopra += `<circle cx="${(100 + Math.cos(a) * (r - 2)).toFixed(1)}" cy="${(cy - 6 + Math.sin(a) * (r - 2)).toFixed(1)}" r="16" fill="${p.capelli}"/>`;
        }
        break;
      case 'crocchia':
        sopra = `<circle cx="100" cy="${cy - r - 12}" r="18" fill="${p.capelli}"/>` +
          `<path d="M${sx + 1} ${cy - 2} Q${sx - 2} ${cy - r - 8} 100 ${cy - r - 6} Q${dx + 2} ${cy - r - 8} ${dx - 1} ${cy - 2} Q100 ${cy - r + 8} ${sx + 1} ${cy - 2} Z" fill="${p.capelli}"/>`;
        break;
      case 'calvo':
        sopra = `<ellipse cx="${sx + 6}" cy="${cy - 6}" rx="10" ry="16" fill="${p.capelli}"/><ellipse cx="${dx - 6}" cy="${cy - 6}" rx="10" ry="16" fill="${p.capelli}"/>`;
        break;
    }
    let viso = occhi(100, cy - 2, 17) + guance(100, cy + 16, 28);
    viso += `<path d="M97 ${cy + 4} Q101 ${cy + 12} 105 ${cy + 6}" fill="none"/>`;
    viso += p.baffi
      ? `<path d="M76 ${cy + 22} Q88 ${cy + 10} 100 ${cy + 18} Q112 ${cy + 10} 124 ${cy + 22} Q112 ${cy + 28} 100 ${cy + 22} Q88 ${cy + 28} 76 ${cy + 22} Z" fill="${p.capelli}"/>`
      : sorriso(100, cy + 22, 15, 12);
    if (p.barba) {
      viso += `<path d="M${sx + 6} ${cy + 8} Q${sx + 10} ${cy + r + 8} 100 ${cy + r + 6} Q${dx - 10} ${cy + r + 8} ${dx - 6} ${cy + 8} Q${dx - 14} ${cy + 26} 100 ${cy + 30} Q${sx + 14} ${cy + 26} ${sx + 6} ${cy + 8} Z" fill="${p.capelli}"/>` + sorriso(100, cy + 24, 12, 8);
    }
    if (p.occhiali) {
      viso += `<circle cx="83" cy="${cy - 2}" r="13" fill="none"/><circle cx="117" cy="${cy - 2}" r="13" fill="none"/><path d="M96 ${cy - 4} L104 ${cy - 4}"/>`;
    }
    if (p.cappello) {
      sopra += `<path d="M${sx - 2} ${cy - 10} Q100 ${cy - r - 34} ${dx + 2} ${cy - 10} Z" fill="${p.cappello}"/><path d="M${dx - 6} ${cy - 12} Q${dx + 26} ${cy - 14} ${dx + 30} ${cy - 4} L${dx - 6} ${cy - 4} Z" fill="${p.cappello}"/>`;
    }
    if (p.fiocco) {
      sopra += `<path d="M128 ${cy - r - 4} L112 ${cy - r - 18} L112 ${cy - r + 10} Z" fill="#ff6fa8"/><path d="M128 ${cy - r - 4} L146 ${cy - r - 18} L146 ${cy - r + 10} Z" fill="#ff6fa8"/><circle cx="128" cy="${cy - r - 4}" r="7" fill="#ff3d8b"/>`;
    }
    return svg(dietro + corpo + collo + orecchie + testa + sopra + viso);
  }

  // ------------------------------------------------------------ le cose

  const casa = svg(
    `<path d="M14 172 H186" fill="none"/>` +
      `<rect x="126" y="42" width="18" height="34" fill="#b5523b"/>` +
      `<rect x="44" y="90" width="112" height="82" fill="#ffd56b"/>` +
      `<path d="M30 96 L100 34 L170 96 Z" fill="#e8504a"/>` +
      `<rect x="87" y="120" width="28" height="52" rx="6" fill="#8a5a3c"/><circle cx="108" cy="148" r="3" fill="${T}"/>` +
      `<rect x="54" y="104" width="24" height="24" fill="#9fdcff"/><path d="M66 104 V128 M54 116 H78"/>` +
      `<rect x="124" y="104" width="24" height="24" fill="#9fdcff"/><path d="M136 104 V128 M124 116 H148"/>`,
  );

  let raggi = '';
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    raggi += `<path d="M${(100 + Math.cos(a) * 60).toFixed(1)} ${(100 + Math.sin(a) * 60).toFixed(1)} L${(100 + Math.cos(a) * 84).toFixed(1)} ${(100 + Math.sin(a) * 84).toFixed(1)}" stroke="#ff9f1c" stroke-width="9"/>`;
  }
  const sole = svg(raggi + `<circle cx="100" cy="100" r="52" fill="#ffd93b"/>` + occhi(100, 92, 17) + guance(100, 110, 30) + sorriso(100, 114, 18, 14));

  const luna = svg(
    stella(40, 46, 14, '#fff6a8') + stella(162, 150, 12, '#fff6a8') + stella(158, 40, 9, '#fff6a8') +
      `<path d="M109.6 34.7 A66 66 0 1 0 154.4 137.3 A56 56 0 0 1 109.6 34.7 Z" fill="#ffe27a"/>` +
      `<path d="M42 92 Q49 85 56 92" fill="none"/>` + sorriso(52, 114, 9, 7) +
      `<circle cx="64" cy="104" r="6" fill="#ff8fa3" opacity=".55" stroke="none"/>`,
  );

  const mela = svg(
    `<path d="M100 62 C70 40 30 60 36 108 C42 156 78 178 100 160 C122 178 158 156 164 108 C170 60 130 40 100 62 Z" fill="#e8413c"/>` +
      `<path d="M100 62 Q98 44 106 30" fill="none"/>` +
      `<path d="M106 46 Q126 24 148 36 Q130 58 106 46 Z" fill="#5cc45c"/>` +
      `<ellipse cx="66" cy="96" rx="9" ry="16" fill="#fff" opacity=".5" stroke="none"/>`,
  );

  const cane = svg(
    `<ellipse cx="54" cy="104" rx="20" ry="40" fill="#8a5a3c" transform="rotate(20 54 104)"/>` +
      `<ellipse cx="146" cy="104" rx="20" ry="40" fill="#8a5a3c" transform="rotate(-20 146 104)"/>` +
      `<ellipse cx="100" cy="104" rx="50" ry="52" fill="#d9a066"/>` +
      `<ellipse cx="100" cy="130" rx="28" ry="20" fill="#f4dcc0"/>` +
      occhi(100, 92, 18) +
      `<ellipse cx="100" cy="118" rx="11" ry="8" fill="${T}"/>` +
      `<path d="M92 140 Q100 166 108 140 Z" fill="#ff7b9c"/>` +
      `<path d="M86 132 Q100 142 114 132" fill="none"/>`,
  );

  const gatto = svg(
    `<path d="M50 92 L56 36 L92 66 Z" fill="#9aa3ad"/><path d="M150 92 L144 36 L108 66 Z" fill="#9aa3ad"/>` +
      `<path d="M60 76 L62 50 L80 66 Z" fill="#ffb3c6" stroke="none"/><path d="M140 76 L138 50 L120 66 Z" fill="#ffb3c6" stroke="none"/>` +
      `<ellipse cx="100" cy="112" rx="58" ry="50" fill="#9aa3ad"/>` +
      `<ellipse cx="80" cy="104" rx="10" ry="13" fill="#7ed957"/><ellipse cx="120" cy="104" rx="10" ry="13" fill="#7ed957"/>` +
      `<ellipse cx="80" cy="104" rx="3.5" ry="10" fill="${T}" stroke="none"/><ellipse cx="120" cy="104" rx="3.5" ry="10" fill="${T}" stroke="none"/>` +
      `<path d="M92 124 L108 124 L100 133 Z" fill="#ff8fa3"/>` +
      `<path d="M88 140 Q94 146 100 138 Q106 146 112 140" fill="none"/>` +
      `<path d="M40 122 L76 128 M40 138 L76 134 M160 122 L124 128 M160 138 L124 134" fill="none" stroke-width="3"/>`,
  );

  let spicchi = '';
  const coloriPalla = ['#e8413c', '#fff', '#3b82f6', '#fff', '#ffd93b', '#fff'];
  for (let k = 0; k < 6; k++) {
    const a0 = (k * Math.PI) / 3;
    const a1 = ((k + 1) * Math.PI) / 3;
    spicchi += `<path d="M100 100 L${(100 + Math.cos(a0) * 64).toFixed(1)} ${(100 + Math.sin(a0) * 64).toFixed(1)} A64 64 0 0 1 ${(100 + Math.cos(a1) * 64).toFixed(1)} ${(100 + Math.sin(a1) * 64).toFixed(1)} Z" fill="${coloriPalla[k]}"/>`;
  }
  const palla = svg(spicchi + `<circle cx="100" cy="100" r="12" fill="#fff"/><ellipse cx="74" cy="68" rx="14" ry="8" fill="#fff" opacity=".6" stroke="none" transform="rotate(-35 74 68)"/>`);

  const legno = '#e0a860';
  const pista = svg(
    `<rect x="20" y="176" width="160" height="12" rx="4" fill="#b97a3d"/>` +
      `<rect x="34" y="50" width="14" height="128" fill="#c98c4a"/><rect x="152" y="50" width="14" height="128" fill="#c98c4a"/>` +
      `<path d="M30 56 L162 84 L162 96 L30 68 Z" fill="${legno}"/>` +
      `<path d="M170 104 L40 130 L40 142 L170 116 Z" fill="${legno}"/>` +
      `<path d="M30 150 L162 166 L162 176 L30 162 Z" fill="${legno}"/>` +
      `<circle cx="70" cy="52" r="13" fill="#e8413c"/><ellipse cx="66" cy="48" rx="4" ry="3" fill="#fff" stroke="none" opacity=".7"/>` +
      `<circle cx="120" cy="114" r="11" fill="#3b82f6"/>`,
  );

  const mare = svg(
    `<circle cx="150" cy="50" r="24" fill="#ffd93b"/>` +
      `<path d="M50 96 Q64 70 82 84 L90 74 L92 92 Q70 106 50 96 Z" fill="#ff9f1c"/><circle cx="64" cy="88" r="3" fill="${T}" stroke="none"/>` +
      `<path d="M10 120 Q35 104 60 120 T110 120 T160 120 T210 120 L210 200 L10 200 Z" fill="#4cb3f0"/>` +
      `<path d="M10 150 Q35 134 60 150 T110 150 T160 150 T210 150 L210 200 L10 200 Z" fill="#2f8fd8"/>`,
  );

  const nave = svg(
    `<path d="M100 40 L100 130" fill="none"/>` +
      `<path d="M104 46 L150 118 L104 118 Z" fill="#fff"/><path d="M96 58 L58 118 L96 118 Z" fill="#fff"/>` +
      `<path d="M100 40 L124 48 L100 56 Z" fill="#e8413c"/>` +
      `<path d="M36 128 L164 128 L148 158 L52 158 Z" fill="#c0392b"/>` +
      `<path d="M10 168 Q35 152 60 168 T110 168 T160 168 T210 168 L210 200 L10 200 Z" fill="#4cb3f0"/>`,
  );

  let petali = '';
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    petali += `<circle cx="${(100 + Math.cos(a) * 32).toFixed(1)}" cy="${(80 + Math.sin(a) * 32).toFixed(1)}" r="24" fill="#ff6fa8"/>`;
  }
  const fiore = svg(
    `<path d="M100 110 Q96 150 100 190" fill="none" stroke="#3a9a3a" stroke-width="8"/>` +
      `<path d="M100 160 Q70 136 52 152 Q74 172 100 160 Z" fill="#5cc45c"/><path d="M100 146 Q130 120 150 136 Q126 158 100 146 Z" fill="#5cc45c"/>` +
      petali + `<circle cx="100" cy="80" r="24" fill="#ffd93b"/>` + occhi(100, 76, 8, 4) + sorriso(100, 86, 8, 6),
  );

  const treno = svg(
    `<circle cx="70" cy="40" r="10" fill="#ddd" stroke="none"/><circle cx="56" cy="24" r="14" fill="#eee" stroke="none"/><circle cx="38" cy="14" r="10" fill="#f4f4f4" stroke="none"/>` +
      `<rect x="62" y="52" width="18" height="34" fill="#444"/>` +
      `<rect x="40" y="84" width="84" height="56" rx="8" fill="#e8413c"/>` +
      `<rect x="110" y="56" width="58" height="84" rx="6" fill="#3b82f6"/><rect x="122" y="68" width="34" height="26" rx="4" fill="#9fdcff"/>` +
      `<rect x="28" y="136" width="150" height="14" rx="5" fill="#555"/>` +
      `<circle cx="62" cy="158" r="16" fill="#333"/><circle cx="104" cy="158" r="16" fill="#333"/><circle cx="148" cy="158" r="16" fill="#333"/>` +
      `<circle cx="62" cy="158" r="5" fill="#bbb"/><circle cx="104" cy="158" r="5" fill="#bbb"/><circle cx="148" cy="158" r="5" fill="#bbb"/>`,
  );

  const auto = svg(
    `<path d="M24 136 L32 108 Q40 90 64 86 L84 64 Q92 56 108 56 L136 56 Q150 56 158 70 L168 88 Q184 92 186 108 L186 136 Z" fill="#e8413c"/>` +
      `<path d="M92 70 L104 70 L104 88 L76 88 Z" fill="#9fdcff"/><path d="M114 70 L134 70 Q142 70 146 78 L150 88 L114 88 Z" fill="#9fdcff"/>` +
      `<circle cx="60" cy="140" r="20" fill="#333"/><circle cx="150" cy="140" r="20" fill="#333"/>` +
      `<circle cx="60" cy="140" r="7" fill="#bbb"/><circle cx="150" cy="140" r="7" fill="#bbb"/>` +
      `<circle cx="178" cy="104" r="6" fill="#ffd93b"/>`,
  );

  const uovo = svg(
    `<circle cx="100" cy="104" r="88" fill="#fff1b8" stroke="none"/>` +
      `<path d="M40 150 Q100 186 160 150 Q150 176 100 182 Q50 176 40 150 Z" fill="#c98c4a"/>` +
      `<path d="M100 30 C62 30 46 96 50 126 C54 158 146 158 150 126 C154 96 138 30 100 30 Z" fill="#fff4dc"/>` +
      `<ellipse cx="80" cy="78" rx="8" ry="16" fill="#fff" stroke="none" opacity=".8"/>` +
      `<path d="M36 146 Q100 170 164 146" fill="none"/>`,
  );

  const ape = svg(
    `<ellipse cx="80" cy="64" rx="24" ry="30" fill="#d6f0ff" opacity=".9" transform="rotate(-20 80 64)"/>` +
      `<ellipse cx="118" cy="62" rx="24" ry="30" fill="#d6f0ff" opacity=".9" transform="rotate(20 118 62)"/>` +
      `<ellipse cx="104" cy="112" rx="56" ry="40" fill="#ffd93b"/>` +
      `<rect x="92" y="74" width="12" height="76" rx="6" fill="${T}" stroke="none"/><rect x="118" y="78" width="12" height="68" rx="6" fill="${T}" stroke="none"/>` +
      `<path d="M160 112 L178 106 L162 122 Z" fill="${T}"/>` +
      `<circle cx="54" cy="108" r="26" fill="#ffd93b"/>` + occhi(50, 102, 9, 4) + sorriso(50, 114, 8, 6) +
      `<path d="M44 84 Q38 66 30 62 M58 84 Q62 66 70 62" fill="none"/>`,
  );

  const oca = svg(
    `<circle cx="100" cy="104" r="88" fill="#cdeeff" stroke="none"/>` +
      `<path d="M14 168 Q100 150 186 168 L186 186 L14 186 Z" fill="#8fd16f" stroke="none"/>` +
      `<path d="M70 120 Q50 160 90 168 L150 168 Q178 160 170 126 Q160 100 130 110 Q110 116 100 108 Z" fill="#fff"/>` +
      `<path d="M100 112 Q92 70 96 50 Q104 30 122 40" fill="none" stroke-width="22" stroke="${T}"/>` +
      `<path d="M100 112 Q92 70 96 50 Q104 30 122 40" fill="none" stroke-width="13" stroke="#fff"/>` +
      `<path d="M128 40 L152 46 L128 54 Z" fill="#ff9f1c"/><circle cx="116" cy="40" r="3.5" fill="${T}" stroke="none"/>` +
      `<path d="M112 126 Q136 120 150 140" fill="none"/>` +
      `<path d="M104 168 L100 186 L112 186 M132 168 L130 186 L142 186" fill="none" stroke="#ff9f1c"/>`,
  );

  let acini = '';
  const posti = [[70, 70], [100, 70], [130, 70], [85, 96], [115, 96], [70, 122], [100, 122], [130, 122], [85, 148], [115, 148], [100, 172]];
  for (const [x, y] of posti) acini += `<circle cx="${x}" cy="${y}" r="17" fill="#8e44ad"/><circle cx="${x - 5}" cy="${y - 6}" r="4" fill="#fff" opacity=".5" stroke="none"/>`;
  const uva = svg(`<path d="M100 54 Q102 34 112 24" fill="none"/><path d="M106 34 Q130 14 156 26 Q136 50 106 34 Z" fill="#5cc45c"/>` + acini);

  // ------------------------------------------------------------ le figurine dell'album

  let criniera = '';
  for (let k = 0; k < 14; k++) {
    const a = (k * Math.PI * 2) / 14;
    criniera += `<circle cx="${(100 + Math.cos(a) * 58).toFixed(1)}" cy="${(102 + Math.sin(a) * 58).toFixed(1)}" r="22" fill="#e67e22"/>`;
  }
  const leone = svg(criniera + `<circle cx="100" cy="102" r="56" fill="#ffc14d"/>` + occhi(100, 92, 20) + `<path d="M90 112 L110 112 L100 124 Z" fill="${T}"/>` + `<path d="M84 132 Q92 140 100 128 Q108 140 116 132" fill="none"/>` + guance(100, 118, 34));

  const elefante = svg(
    `<ellipse cx="46" cy="98" rx="36" ry="46" fill="#a9b4c2"/><ellipse cx="154" cy="98" rx="36" ry="46" fill="#a9b4c2"/>` +
      `<ellipse cx="46" cy="98" rx="22" ry="30" fill="#f2b8c6" stroke="none"/><ellipse cx="154" cy="98" rx="22" ry="30" fill="#f2b8c6" stroke="none"/>` +
      `<ellipse cx="100" cy="92" rx="48" ry="50" fill="#b8c3d0"/>` +
      `<path d="M88 120 Q86 168 112 176 Q122 178 120 168 Q104 160 112 120 Z" fill="#b8c3d0"/>` +
      occhi(100, 84, 18) + guance(100, 104, 30),
  );

  const pesce = svg(
    `<path d="M150 100 L188 66 L184 134 Z" fill="#ff9f1c"/>` +
      `<ellipse cx="96" cy="100" rx="66" ry="46" fill="#ffb347"/>` +
      `<path d="M90 56 Q110 34 126 60" fill="#ff9f1c"/>` +
      `<circle cx="64" cy="90" r="10" fill="#fff"/><circle cx="62" cy="90" r="5" fill="${T}" stroke="none"/>` +
      `<path d="M40 112 Q50 120 60 112" fill="none"/><path d="M100 76 Q112 100 100 124 M122 80 Q134 100 122 120" fill="none" stroke-width="3"/>` +
      `<circle cx="30" cy="50" r="8" fill="#bfe6ff"/><circle cx="44" cy="28" r="5" fill="#bfe6ff"/>`,
  );

  const farfalla = svg(
    `<ellipse cx="64" cy="70" rx="40" ry="36" fill="#ff6fa8"/><ellipse cx="136" cy="70" rx="40" ry="36" fill="#ff6fa8"/>` +
      `<ellipse cx="70" cy="134" rx="30" ry="28" fill="#ffd93b"/><ellipse cx="130" cy="134" rx="30" ry="28" fill="#ffd93b"/>` +
      `<circle cx="62" cy="70" r="12" fill="#fff" stroke="none"/><circle cx="138" cy="70" r="12" fill="#fff" stroke="none"/>` +
      `<ellipse cx="100" cy="104" rx="10" ry="54" fill="${T}"/>` +
      `<path d="M96 54 Q84 26 70 22 M104 54 Q116 26 130 22" fill="none"/>`,
  );

  const coccinella = svg(
    `<circle cx="100" cy="56" r="24" fill="${T}"/>` + occhi(100, 52, 9, 4).replaceAll(`fill="${T}"`, 'fill="#fff"') +
      `<path d="M36 120 A64 64 0 0 1 164 120 Q164 176 100 176 Q36 176 36 120 Z" fill="#e8413c"/>` +
      `<path d="M100 66 L100 176" fill="none"/>` +
      `<circle cx="70" cy="106" r="11" fill="${T}" stroke="none"/><circle cx="130" cy="106" r="11" fill="${T}" stroke="none"/>` +
      `<circle cx="64" cy="146" r="9" fill="${T}" stroke="none"/><circle cx="136" cy="146" r="9" fill="${T}" stroke="none"/>`,
  );

  const razzo = svg(
    `<path d="M80 150 Q100 196 120 150 Z" fill="#ff9f1c"/><path d="M88 150 Q100 178 112 150 Z" fill="#ffd93b" stroke="none"/>` +
      `<path d="M74 120 L46 156 L76 150 Z" fill="#e8413c"/><path d="M126 120 L154 156 L124 150 Z" fill="#e8413c"/>` +
      `<path d="M100 14 Q140 50 128 150 L72 150 Q60 50 100 14 Z" fill="#f4f4f4"/>` +
      `<path d="M100 14 Q118 30 124 46 L76 46 Q82 30 100 14 Z" fill="#e8413c"/>` +
      `<circle cx="100" cy="88" r="17" fill="#4cb3f0"/>`,
  );

  const arcobaleno = svg(
    ['#e8413c', '#ff9f1c', '#ffd93b', '#5cc45c', '#3b82f6', '#8e44ad']
      .map((c, k) => `<path d="M${22 + k * 10} 150 A${78 - k * 10} ${78 - k * 10} 0 0 1 ${178 - k * 10} 150" fill="none" stroke="${c}" stroke-width="11"/>`)
      .join('') +
      `<circle cx="28" cy="154" r="16" fill="#fff"/><circle cx="46" cy="160" r="14" fill="#fff"/><circle cx="172" cy="154" r="16" fill="#fff"/><circle cx="154" cy="160" r="14" fill="#fff"/>`,
  );

  const stellina = svg(stella(100, 104, 84, '#ffd93b') + occhi(100, 100, 16) + guance(100, 118, 28) + sorriso(100, 120, 14, 10));

  const dinosauro = svg(
    `<path d="M30 150 Q20 120 60 110 Q70 70 110 66 Q130 40 160 50 Q186 60 176 84 Q168 98 140 94 Q138 130 120 150 Z" fill="#5cc45c"/>` +
      `<path d="M66 108 L74 88 L84 104 L94 82 L102 100 L112 76 L118 94" fill="#ffd93b"/>` +
      `<rect x="62" y="146" width="16" height="30" rx="4" fill="#5cc45c"/><rect x="100" y="146" width="16" height="30" rx="4" fill="#5cc45c"/>` +
      `<circle cx="158" cy="66" r="6" fill="${T}" stroke="none"/><path d="M150 84 Q162 90 172 82" fill="none"/>`,
  );

  const tartaruga = svg(
    `<ellipse cx="164" cy="128" rx="20" ry="16" fill="#8bd17c"/><circle cx="170" cy="124" r="3.5" fill="${T}" stroke="none"/>` +
      `<rect x="54" y="140" width="20" height="26" rx="8" fill="#8bd17c"/><rect x="124" y="140" width="20" height="26" rx="8" fill="#8bd17c"/>` +
      `<path d="M34 146 A66 66 0 0 1 166 146 Z" fill="#3a9a3a"/>` +
      `<path d="M100 84 L122 100 L114 128 L86 128 L78 100 Z" fill="#6cc46c"/><path d="M100 84 L100 60 M122 100 L146 92 M114 128 L132 146 M86 128 L68 146 M78 100 L54 92" fill="none"/>`,
  );

  const gufo = svg(
    `<path d="M50 60 L64 24 L80 56 Z" fill="#8a5a3c"/><path d="M150 60 L136 24 L120 56 Z" fill="#8a5a3c"/>` +
      `<ellipse cx="100" cy="112" rx="62" ry="74" fill="#a8744a"/>` +
      `<ellipse cx="100" cy="140" rx="38" ry="40" fill="#f4dcc0"/>` +
      `<circle cx="74" cy="84" r="22" fill="#fff"/><circle cx="126" cy="84" r="22" fill="#fff"/>` +
      `<circle cx="74" cy="84" r="10" fill="${T}" stroke="none"/><circle cx="126" cy="84" r="10" fill="${T}" stroke="none"/>` +
      `<path d="M92 104 L108 104 L100 120 Z" fill="#ff9f1c"/>`,
  );

  const pinguino = svg(
    `<ellipse cx="100" cy="108" rx="58" ry="78" fill="#2d3a4a"/>` +
      `<ellipse cx="100" cy="124" rx="38" ry="58" fill="#fff"/>` +
      occhi(100, 72, 16, 5).replaceAll(`fill="${T}"`, 'fill="#fff"') + `<circle cx="84" cy="72" r="3" fill="${T}" stroke="none"/><circle cx="116" cy="72" r="3" fill="${T}" stroke="none"/>` +
      `<path d="M88 86 L112 86 L100 100 Z" fill="#ff9f1c"/>` +
      `<path d="M70 184 L60 194 L90 194 Z M130 184 L140 194 L110 194 Z" fill="#ff9f1c"/>`,
  );

  const coniglio = svg(
    `<ellipse cx="74" cy="54" rx="16" ry="46" fill="#f4f4f4"/><ellipse cx="126" cy="54" rx="16" ry="46" fill="#f4f4f4"/>` +
      `<ellipse cx="74" cy="56" rx="7" ry="32" fill="#ffb3c6" stroke="none"/><ellipse cx="126" cy="56" rx="7" ry="32" fill="#ffb3c6" stroke="none"/>` +
      `<circle cx="100" cy="126" r="54" fill="#f4f4f4"/>` + occhi(100, 116, 20) + guance(100, 138, 32) +
      `<path d="M92 132 L108 132 L100 140 Z" fill="#ff8fa3"/>` +
      `<rect x="92" y="146" width="16" height="14" fill="#fff"/><path d="M100 146 V160" fill="none" stroke-width="3"/>`,
  );

  const palloncini = svg(
    `<path d="M70 120 Q80 160 100 190 M130 116 Q120 160 100 190 M100 104 L100 190" fill="none" stroke-width="3"/>` +
      `<ellipse cx="70" cy="82" rx="30" ry="38" fill="#e8413c"/><ellipse cx="130" cy="78" rx="30" ry="38" fill="#3b82f6"/><ellipse cx="100" cy="64" rx="30" ry="38" fill="#ffd93b"/>` +
      `<ellipse cx="90" cy="50" rx="6" ry="10" fill="#fff" stroke="none" opacity=".6"/>`,
  );

  const gelato = svg(
    `<path d="M66 96 L100 188 L134 96 Z" fill="#e0a860"/><path d="M76 116 L120 150 M86 102 L128 132 M124 116 L80 150 M114 102 L72 132" fill="none" stroke-width="3"/>` +
      `<circle cx="80" cy="92" r="26" fill="#ff8fa3"/><circle cx="120" cy="92" r="26" fill="#8a5a3c"/><circle cx="100" cy="62" r="28" fill="#fff4dc"/>` +
      `<circle cx="104" cy="30" r="10" fill="#e8413c"/>`,
  );

  const orso = svg(
    `<circle cx="54" cy="58" r="22" fill="#a8744a"/><circle cx="146" cy="58" r="22" fill="#a8744a"/>` +
      `<circle cx="54" cy="58" r="11" fill="#f4dcc0" stroke="none"/><circle cx="146" cy="58" r="11" fill="#f4dcc0" stroke="none"/>` +
      `<circle cx="100" cy="108" r="62" fill="#a8744a"/>` + `<ellipse cx="100" cy="132" rx="30" ry="24" fill="#f4dcc0"/>` +
      occhi(100, 96, 22) + `<ellipse cx="100" cy="122" rx="10" ry="7" fill="${T}"/>` + `<path d="M90 138 Q100 146 110 138" fill="none"/>`,
  );

  // ------------------------------------------------------------ l'elenco

  // Disegni delle parole: chiave -> nome (per la voce) e disegno.
  window.DISEGNI = {
    mamma: { nome: 'mamma', svg: persona({ stile: 'lunghi', capelli: '#7a4a2a', maglia: '#ff6fa8' }) },
    papa: { nome: 'papà', svg: persona({ stile: 'corti', capelli: '#4a3020', maglia: '#3b82f6', barba: true }) },
    nonno: { nome: 'nonno', svg: persona({ stile: 'calvo', capelli: '#e9e9ee', maglia: '#5cc45c', baffi: true, occhiali: true }) },
    nonna: { nome: 'nonna', svg: persona({ stile: 'crocchia', capelli: '#d9d9e0', maglia: '#9b59b6', occhiali: true }) },
    zio: { nome: 'zio', svg: persona({ stile: 'corti', capelli: '#2d2a32', maglia: '#ff9f1c', cappello: '#e8413c' }) },
    zia: { nome: 'zia', svg: persona({ stile: 'ricci', capelli: '#c0392b', maglia: '#1abc9c' }) },
    bimbo: { nome: 'bimbo', svg: persona({ stile: 'corti', capelli: '#8a5a3c', maglia: '#ffd93b', bimbo: true }) },
    bimba: { nome: 'bimba', svg: persona({ stile: 'lunghi', capelli: '#e0a040', maglia: '#ff8fa3', bimbo: true, fiocco: true }) },
    casa: { nome: 'casa', svg: casa },
    sole: { nome: 'sole', svg: sole },
    luna: { nome: 'luna', svg: luna },
    mela: { nome: 'mela', svg: mela },
    cane: { nome: 'cane', svg: cane },
    gatto: { nome: 'gatto', svg: gatto },
    palla: { nome: 'palla', svg: palla },
    pista: { nome: 'pista', svg: pista },
    mare: { nome: 'mare', svg: mare },
    nave: { nome: 'nave', svg: nave },
    fiore: { nome: 'fiore', svg: fiore },
    treno: { nome: 'treno', svg: treno },
    auto: { nome: 'auto', svg: auto },
    uovo: { nome: 'uovo', svg: uovo },
    ape: { nome: 'ape', svg: ape },
    oca: { nome: 'oca', svg: oca },
    uva: { nome: 'uva', svg: uva },
  };

  // Le figurine dell'album, nell'ordine in cui si vincono.
  window.FIGURINE = [
    { nome: 'il leone', svg: leone },
    { nome: 'la farfalla', svg: farfalla },
    { nome: 'il razzo', svg: razzo },
    { nome: 'il pesce', svg: pesce },
    { nome: "l'arcobaleno", svg: arcobaleno },
    { nome: "l'elefante", svg: elefante },
    { nome: 'la coccinella', svg: coccinella },
    { nome: 'il dinosauro', svg: dinosauro },
    { nome: 'la stella', svg: stellina },
    { nome: 'la tartaruga', svg: tartaruga },
    { nome: 'il gufo', svg: gufo },
    { nome: 'il pinguino', svg: pinguino },
    { nome: 'il coniglio', svg: coniglio },
    { nome: 'i palloncini', svg: palloncini },
    { nome: 'il gelato', svg: gelato },
    { nome: "l'orsetto", svg: orso },
  ];

  // Piccole icone dei pulsanti.
  window.ICONE = {
    gioca: `<svg viewBox="0 0 100 100"><path d="M34 22 L80 50 L34 78 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg>`,
    casa: `<svg viewBox="0 0 100 100"><path d="M18 50 L50 20 L82 50 M28 42 V82 H72 V42" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
    voce: `<svg viewBox="0 0 100 100"><path d="M18 40 H34 L56 22 V78 L34 60 H18 Z" fill="#fff"/><path d="M66 36 Q76 50 66 64 M74 26 Q92 50 74 74" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
    cubi: `<svg viewBox="0 0 100 100"><rect x="10" y="50" width="38" height="38" rx="7" fill="#ffd93b"/><rect x="52" y="50" width="38" height="38" rx="7" fill="#5cc45c"/><rect x="31" y="10" width="38" height="38" rx="7" fill="#ff6fa8"/><text x="50" y="40" font-size="28" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text></svg>`,
    trova: `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="54" height="54" rx="10" fill="#ff6fae"/><text x="37" y="51" font-size="40" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text><circle cx="62" cy="62" r="20" fill="rgba(255,255,255,.35)" stroke="#fff" stroke-width="8"/><path d="M76 76 L90 90" stroke="#fff" stroke-width="11" stroke-linecap="round"/></svg>`,
    album: `<svg viewBox="0 0 100 100"><rect x="14" y="14" width="72" height="72" rx="10" fill="#fff"/>${stella(50, 52, 26, '#ffd93b', false)}</svg>`,
    ingranaggio: `<svg viewBox="0 0 100 100"><g fill="#fff">${Array.from({ length: 8 }, (_, k) => `<rect x="44" y="6" width="12" height="20" rx="3" transform="rotate(${k * 45} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="28"/></g><circle cx="50" cy="50" r="11" fill="#4cb3f0"/></svg>`,
    cancella: `<svg viewBox="0 0 100 100"><path d="M26 26 L74 74 M74 26 L26 74" stroke="#fff" stroke-width="12" stroke-linecap="round"/></svg>`,
    schermo: `<svg viewBox="0 0 100 100"><path d="M14 36 V14 H36 M64 14 H86 V36 M86 64 V86 H64 M36 86 H14 V64" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    stella: (piena) => `<svg viewBox="0 0 100 100">${stella(50, 54, 44, piena ? '#ffd93b' : 'rgba(255,255,255,.35)', false)}</svg>`,
    microfono: `<svg viewBox="0 0 100 100"><rect x="36" y="12" width="28" height="50" rx="14" fill="#fff"/><path d="M24 48 Q24 76 50 76 Q76 76 76 48 M50 76 V90 M36 90 H64" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  };
})();
