// I Cubi delle Parole: un gioco per imparare le lettere costruendo parole con i cubi.
// Funziona con il dito (tablet) e con il mouse (PC). Le parole della famiglia, le foto e le
// voci registrate restano solo sul dispositivo (archivio del browser), mai su internet.
'use strict';

// ------------------------------------------------------------ piccoli aiuti

const $ = (s) => document.querySelector(s);
function crea(tag, classe, html) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
const aspetta = (ms) => new Promise((r) => setTimeout(r, ms));
function mescola(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const unoA = (a) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------ le lettere

// Le lettere dei cubi nel gioco libero: l'alfabeto italiano e la A con l'accento (per PAPÀ).
const ALFABETO = 'ABCDEFGHILMNOPQRSTUVZ'.split('').concat(['À']);
const NOMI_LETTERE = {
  A: 'a', B: 'bi', C: 'ci', D: 'di', E: 'e', F: 'effe', G: 'gi', H: 'acca', I: 'i', J: 'i lunga', K: 'cappa', L: 'elle',
  M: 'emme', N: 'enne', O: 'o', P: 'pi', Q: 'cu', R: 'erre', S: 'esse', T: 'ti', U: 'u', V: 'vu', W: 'doppia vu',
  X: 'ics', Y: 'ipsilon', Z: 'zeta', À: "a con l'accento", È: "e con l'accento", É: "e con l'accento",
  Ì: "i con l'accento", Ò: "o con l'accento", Ù: "u con l'accento",
};
const ESEMPI = {
  A: 'ape', B: 'balena', C: 'casa', D: 'dado', E: 'elefante', F: 'fiore', G: 'gatto', I: 'isola', L: 'luna', M: 'mamma',
  N: 'nonno', O: 'oca', P: 'palla', Q: 'quadro', R: 'rana', S: 'sole', T: 'treno', U: 'uva', V: 'vaso', Z: 'zebra',
};
// Ogni lettera ha sempre il suo colore; le lettere più usate hanno colori ben diversi tra loro.
const COLORI_LETTERE = {
  A: '#e8413c', E: '#2f6fde', I: '#27ae60', O: '#ff8a1c', U: '#9b59b6', M: '#13b5a4', N: '#d63384', L: '#e8b100',
  R: '#8d5a3c', S: '#ff6fae', T: '#34495e', P: '#6252d9', C: '#7cb518', D: '#0aa0c8', B: '#5d6d7e', F: '#ff6f61',
  G: '#c56cf0', H: '#95a5a6', Q: '#b5838d', V: '#45aaf2', Z: '#786fa6', J: '#2c3e50', K: '#cd6133', W: '#218c74',
  X: '#c23616', Y: '#e1b12c',
};
const TAVOLOZZA = Object.values(COLORI_LETTERE);
/** Il colore di una lettera (la À ha lo stesso colore della A). */
function colore(l) {
  return COLORI_LETTERE[l.normalize('NFD')[0]] || '#e8413c';
}
const nomeLettera = (l) => NOMI_LETTERE[l] || l.toLowerCase();

// ------------------------------------------------------------ le sillabe (come a scuola)

const VOCALI = 'AEIOUÀÈÉÌÒÙ';
const FORTI = 'AEOÀÈÉÒÌÙ';
const vocale = (c) => VOCALI.includes(c);

/** Divide una parola in sillabe: CASA -> CA SA, CANDELA -> CAN DE LA, PISTA -> PI STA. */
function sillabeDi(parola) {
  const p = parola.toUpperCase();
  // gruppi di vocali; dentro un gruppo si separano due vocali "forti" (IDEA -> I DE A)
  const nuclei = [];
  let i = 0;
  while (i < p.length) {
    if (vocale(p[i])) {
      let j = i;
      while (j < p.length && vocale(p[j])) j++;
      let inizio = i;
      for (let k = i + 1; k < j; k++) {
        if (FORTI.includes(p[k - 1]) && FORTI.includes(p[k])) {
          nuclei.push([inizio, k]);
          inizio = k;
        }
      }
      nuclei.push([inizio, j]);
      i = j;
    } else i++;
  }
  if (nuclei.length <= 1) return [p];
  // dove tagliare tra un nucleo e l'altro
  const tagli = [];
  for (let n = 0; n < nuclei.length - 1; n++) {
    const fine = nuclei[n][1];
    const dopo = nuclei[n + 1][0];
    const gruppo = p.slice(fine, dopo);
    let quanti; // quante consonanti restano con la sillaba prima
    if (gruppo.length === 0) quanti = 0;
    else if (gruppo.length === 1) quanti = 0;
    else if (gruppo.length === 2) {
      const [a, b] = gruppo;
      if (a === b) quanti = 1; // MAM-MA, GAT-TO
      else if (a === 'S') quanti = 0; // PI-STA
      else if ('LR'.includes(b) && 'BCDFGPTV'.includes(a)) quanti = 0; // PA-TRI-ZIA
      else if (['CH', 'GH', 'GN'].includes(gruppo) || (gruppo === 'GL' && p[dopo] === 'I')) quanti = 0;
      else quanti = 1; // LO-REN-ZA
    } else {
      quanti = gruppo[0] === 'S' ? 0 : 1; // SAN-DRO, CAN-TRO
    }
    tagli.push(fine + quanti);
  }
  const sillabe = [];
  let da = 0;
  for (const t of tagli) {
    sillabe.push(p.slice(da, t));
    da = t;
  }
  sillabe.push(p.slice(da));
  return sillabe;
}

/** Sillabe di una frase (più parole separate da spazi). */
const sillabeFrase = (testo) => testo.trim().split(/\s+/).flatMap(sillabeDi);

// ------------------------------------------------------------ l'archivio sul dispositivo

const Archivio = {
  db: null,
  memoria: { parole: new Map(), voci: new Map(), impostazioni: new Map() },

  async apri() {
    try {
      const attesa = new Promise((ok, ko) => setTimeout(() => ko(new Error('archivio lento')), 2500));
      this.db = await Promise.race([attesa, this._apri()]);
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch {
      this.db = null; // senza archivio si gioca lo stesso (ma non si ricorda niente)
    }
  },

  _apri() {
    return new Promise((ok, ko) => {
      const r = indexedDB.open('cubi-delle-parole', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('parole', { keyPath: 'id' });
        d.createObjectStore('voci', { keyPath: 'id' });
        d.createObjectStore('impostazioni');
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  },

  _passo(store, modo, fare) {
    return new Promise((ok, ko) => {
      const t = this.db.transaction(store, modo);
      const r = fare(t.objectStore(store));
      t.oncomplete = () => ok(r && r.result);
      t.onerror = () => ko(t.error);
    });
  },

  async tutti(store) {
    if (!this.db) return [...this.memoria[store].values()];
    return (await this._passo(store, 'readonly', (s) => s.getAll())) || [];
  },
  async leggi(store, chiave) {
    if (!this.db) return this.memoria[store].get(chiave);
    return this._passo(store, 'readonly', (s) => s.get(chiave));
  },
  async metti(store, valore, chiave) {
    if (!this.db) {
      this.memoria[store].set(chiave ?? valore.id, valore);
      return;
    }
    await this._passo(store, 'readwrite', (s) => (chiave === undefined ? s.put(valore) : s.put(valore, chiave)));
  },
  async togli(store, chiave) {
    if (!this.db) {
      this.memoria[store].delete(chiave);
      return;
    }
    await this._passo(store, 'readwrite', (s) => s.delete(chiave));
  },
};

// ------------------------------------------------------------ i suoni (creati dal codice)

const Suoni = {
  ctx: null,
  rumoreBuffer: null,

  sblocca() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      const n = this.ctx.sampleRate;
      this.rumoreBuffer = this.ctx.createBuffer(1, n, n);
      const d = this.rumoreBuffer.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  tono(f0, f1, durata, tipo = 'sine', volume = 0.2, ritardo = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + ritardo;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + durata);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + durata + 0.02);
  },

  battito(t, volume) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.rumoreBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900 + Math.random() * 1400;
    f.Q.value = 1.1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + Math.random() * 0.04);
    s.connect(f).connect(g).connect(this.ctx.destination);
    s.start(t, Math.random() * 0.5, 0.12);
  },

  prendi() {
    this.tono(620, 760, 0.06, 'triangle', 0.12);
  },
  pop() {
    this.tono(420, 980, 0.1, 'sine', 0.28);
    this.tono(1300, 1500, 0.06, 'triangle', 0.08, 0.05);
  },
  boing() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.45);
    lfo.frequency.value = 18;
    lg.gain.value = 40;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.52);
    lfo.stop(t + 0.52);
  },
  ding(n = 0) {
    const f = 660 * Math.pow(2, n / 12);
    this.tono(f, f, 0.35, 'triangle', 0.16);
  },
  applauso() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    for (let k = 0; k < 70; k++) {
      const x = Math.random();
      const t = t0 + 2.4 * x * x * 0.9 + Math.random() * 0.15;
      this.battito(t, 0.25 + Math.random() * 0.35 * (1 - x * 0.6));
    }
  },
  fanfara() {
    [523, 659, 784, 1047].forEach((f, k) => this.tono(f, f, 0.5, 'triangle', 0.2, k * 0.13));
    [523, 659, 784].forEach((f) => this.tono(f * 2, f * 2, 1.1, 'triangle', 0.1, 0.62));
  },
  magia() {
    for (let k = 0; k < 10; k++) {
      const f = 1200 + k * 160 + Math.random() * 120;
      this.tono(f, f * 1.02, 0.4, 'sine', 0.07, k * 0.05);
    }
  },
  puff() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.rumoreBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    s.connect(f).connect(g).connect(this.ctx.destination);
    s.start(t, 0, 0.3);
  },
};

// ------------------------------------------------------------ la voce

const Voce = {
  voce: null,
  audio: null,
  disponibile: 'speechSynthesis' in window,

  init() {
    if (!this.disponibile) return;
    const scegli = () => {
      const tutte = speechSynthesis.getVoices();
      const italiane = tutte.filter((v) => /^it([-_]|$)/i.test(v.lang));
      this.voce = italiane.find((v) => /google/i.test(v.name)) || italiane.find((v) => /elsa|isabella|alice|federica/i.test(v.name)) || italiane[0] || null;
    };
    scegli();
    speechSynthesis.onvoiceschanged = scegli;
  },

  zitto() {
    if (this.disponibile) speechSynthesis.cancel();
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  },

  /** Dice una frase con la voce del dispositivo; finisce quando ha finito di parlare. */
  di(testo, opz = {}) {
    return new Promise((ok) => {
      if (!this.disponibile || !testo) return ok();
      const u = new SpeechSynthesisUtterance(testo);
      u.lang = 'it-IT';
      if (this.voce) u.voice = this.voce;
      u.rate = opz.velocita ?? 0.85;
      u.pitch = opz.tono ?? 1.1;
      let finito = false;
      const fine = () => {
        if (!finito) {
          finito = true;
          ok();
        }
      };
      u.onend = fine;
      u.onerror = fine;
      setTimeout(fine, 1200 + testo.length * 160);
      speechSynthesis.speak(u);
    });
  },

  /** Fa sentire una registrazione (le voci di mamma e papà). */
  suona(blob) {
    return new Promise((ok) => {
      try {
        const a = new Audio(URL.createObjectURL(blob));
        this.audio = a;
        a.onended = () => ok();
        a.onerror = () => ok();
        a.play().catch(() => ok());
        setTimeout(ok, 8000);
      } catch {
        ok();
      }
    });
  },

  lettera(l) {
    this.zitto();
    return this.di(nomeLettera(l), { velocita: 0.9 });
  },

  async parola(p) {
    if (p.voce) return this.suona(p.voce);
    return this.di(p.testo.toLowerCase(), { velocita: 0.8 });
  },
};

// ------------------------------------------------------------ le parole e le impostazioni

const PAROLE_BASE = [
  ['MAMMA', 'mamma'], ['PAPÀ', 'papa'], ['NONNO', 'nonno'], ['NONNA', 'nonna'], ['ZIO', 'zio'], ['ZIA', 'zia'],
  ['CASA', 'casa'], ['SOLE', 'sole'], ['LUNA', 'luna'], ['MELA', 'mela'], ['CANE', 'cane'], ['GATTO', 'gatto'],
  ['PALLA', 'palla'], ['PISTA', 'pista'], ['MARE', 'mare'], ['NAVE', 'nave'], ['FIORE', 'fiore'], ['TRENO', 'treno'],
  ['AUTO', 'auto'], ['UOVO', 'uovo'], ['APE', 'ape'], ['OCA', 'oca'], ['UVA', 'uva'],
].map(([testo, disegno]) => ({ id: 'base-' + disegno, testo, disegno, foto: null, voce: null, attiva: true, famiglia: false }));

/** Disegno adatto a una parola nuova, se si capisce cosa è (altrimenti la sua iniziale). */
function disegnoPer(testo) {
  const t = testo.toUpperCase();
  const regole = [
    ['MAMMA', 'mamma'], ['PAPÀ', 'papa'], ['PAPA', 'papa'], ['NONNO', 'nonno'], ['NONNA', 'nonna'], ['ZIO', 'zio'],
    ['ZIA', 'zia'], ['CUGINO', 'bimbo'], ['CUGINA', 'bimba'], ['FRATELLO', 'bimbo'], ['SORELLA', 'bimba'],
    ['GATT', 'gatto'], ['MICI', 'gatto'], ['CANE', 'cane'], ['PISTA', 'pista'], ['PALLA', 'palla'], ['CASA', 'casa'],
    ['TRENO', 'treno'], ['AUTO', 'auto'], ['MACCHINA', 'auto'], ['NAVE', 'nave'], ['BARCA', 'nave'], ['SOLE', 'sole'],
    ['LUNA', 'luna'], ['MARE', 'mare'], ['FIORE', 'fiore'], ['MELA', 'mela'],
  ];
  const r = regole.find(([k]) => t.includes(k));
  return r ? r[1] : null;
}

/** Pulisce una parola scritta dai genitori: maiuscole, solo lettere e spazi. */
function pulisci(testo) {
  return testo
    .toLocaleUpperCase('it-IT')
    .replace(/[^A-ZÀÈÉÌÒÙ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14);
}

const stato = {
  impostazioni: { nome: '', livello: 'copia', aiutoColori: true, extra: 1, perGiro: 4 },
  album: 0,
  parole: [],
  vociBravo: [],
  recenti: [],
  schermata: 'home',
};

const urlFoto = new Map();
function fotoUrl(p) {
  if (!p.foto) return null;
  if (!urlFoto.has(p.id)) urlFoto.set(p.id, URL.createObjectURL(p.foto));
  return urlFoto.get(p.id);
}
function dimenticaFoto(id) {
  if (urlFoto.has(id)) {
    URL.revokeObjectURL(urlFoto.get(id));
    urlFoto.delete(id);
  }
}

async function caricaTutto() {
  await Archivio.apri();
  const imp = await Archivio.leggi('impostazioni', 'generali').catch(() => null);
  if (imp) Object.assign(stato.impostazioni, imp);
  stato.album = (await Archivio.leggi('impostazioni', 'album').catch(() => 0)) || 0;
  const salvate = await Archivio.tutti('parole').catch(() => []);
  const perId = new Map(salvate.map((p) => [p.id, p]));
  stato.parole = PAROLE_BASE.map((b) => Object.assign({}, b, perId.get(b.id) || {}, { testo: b.testo, famiglia: false }));
  for (const p of salvate) if (p.famiglia) stato.parole.push(p);
  stato.vociBravo = await Archivio.tutti('voci').catch(() => []);
}

const salvaImpostazioni = () => Archivio.metti('impostazioni', Object.assign({}, stato.impostazioni), 'generali').catch(() => {});
const salvaAlbum = () => Archivio.metti('impostazioni', stato.album, 'album').catch(() => {});
const salvaParola = (p) => Archivio.metti('parole', Object.assign({}, p)).catch(() => {});

// ------------------------------------------------------------ disegni delle parole

function htmlFigura(p) {
  const url = fotoUrl(p);
  if (url) return `<img src="${url}" alt="">`;
  if (p.disegno && window.DISEGNI[p.disegno]) return window.DISEGNI[p.disegno].svg;
  const l = p.testo[0] || '?';
  return `<svg viewBox="0 0 200 200"><rect x="14" y="14" width="172" height="172" rx="34" fill="${colore(l)}"/><text x="100" y="138" font-size="120" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui, sans-serif">${l}</text><path d="M152 40 c6-10 22-6 18 6 c-2 8-18 18-18 18 s-16-10-18-18 c-4-12 12-16 18-6z" fill="#fff" opacity=".85"/></svg>`;
}

// ------------------------------------------------------------ i cubi

function nuovoCubo(lettera) {
  const c = crea('div', 'cubo', `<span>${lettera}</span>`);
  c.dataset.lettera = lettera;
  c.style.setProperty('--colore', colore(lettera));
  c.style.setProperty('--giro', (Math.random() * 8 - 4).toFixed(1) + 'deg');
  return c;
}

function dimensiona() {
  const caselle = document.querySelectorAll('#caselle .casella').length || 4;
  const spazi = document.querySelectorAll('#caselle .spazio').length;
  const largo = window.innerWidth * 0.94;
  const alto = window.innerHeight;
  let lato = Math.min(largo / ((caselle + spazi * 0.4) * 1.14), alto * 0.15, 130);
  lato = Math.max(lato, 30);
  document.documentElement.style.setProperty('--lato', lato.toFixed(0) + 'px');
  const nelVassoio = document.querySelectorAll('#vassoio .cubo, #vassoio .vuoto').length || 1;
  const righe = gioco.libero ? 2 : 1;
  const perRiga = Math.ceil(nelVassoio / righe);
  let latoV = Math.min(lato, (largo * 0.96) / (perRiga * 1.18), alto * (gioco.libero ? 0.12 : 0.16));
  if (gioco.trova) latoV = Math.min(alto * 0.24, (largo * 0.9) / (nelVassoio * 1.6), 190);
  latoV = Math.max(latoV, 28);
  document.documentElement.style.setProperty('--lato-vassoio', latoV.toFixed(0) + 'px');
}

// ------------------------------------------------------------ il trascinamento (dito e mouse)

let trascina = null;

function rendiTrascinabile(c, modello = false) {
  c.addEventListener('pointerdown', (e) => {
    if (gioco.occupato || trascina || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (c.classList.contains('fermo')) return;
    e.preventDefault();
    Suoni.sblocca();
    const r = c.getBoundingClientRect();
    let el = c;
    if (modello) {
      // nel gioco libero il cubo del vassoio resta lì: se ne prende una copia
      el = nuovoCubo(c.dataset.lettera);
      el.classList.add('volante');
      el.style.width = r.width + 'px';
      el.style.height = r.height + 'px';
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      document.body.appendChild(el);
    }
    el.classList.add('trascinato');
    trascina = { el, x0: e.clientX, y0: e.clientY, id: e.pointerId, modello, daCasella: el.parentElement && el.parentElement.classList.contains('casella') ? el.parentElement : null };
    Suoni.prendi();
    Voce.lettera(el.dataset.lettera);
  });
}

window.addEventListener(
  'pointermove',
  (e) => {
    if (!trascina || e.pointerId !== trascina.id) return;
    e.preventDefault();
    const dx = e.clientX - trascina.x0;
    const dy = e.clientY - trascina.y0;
    trascina.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.15) rotate(0deg)`;
  },
  { passive: false },
);

let ultimoRilascio = 0;

function finisciTrascina(e) {
  if (!trascina || e.pointerId !== trascina.id) return;
  const t = trascina;
  trascina = null;
  ultimoRilascio = performance.now();
  if (gioco.libero) rilasciaLibero(t, e.clientX, e.clientY);
  else rilascia(t, e.clientX, e.clientY);
}
window.addEventListener('pointerup', finisciTrascina);
window.addEventListener('pointercancel', finisciTrascina);

const vuota = (s) => !s.querySelector('.cubo');

function casellaVicina(x, y, filtro) {
  let migliore = null;
  let distanza = Infinity;
  for (const s of document.querySelectorAll('#caselle .casella')) {
    if (!filtro(s)) continue;
    const r = s.getBoundingClientRect();
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < distanza) {
      distanza = d;
      migliore = s;
    }
  }
  return { casella: migliore, distanza };
}

function vicinoAlleCaselle(x, y) {
  const r = $('#caselle').getBoundingClientRect();
  const lato = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lato')) || 80;
  return y > r.top - lato * 1.2 && y < r.bottom + lato * 0.9 && x > r.left - lato && x < r.right + lato;
}

function torna(el) {
  el.classList.add('torna');
  el.classList.remove('trascinato');
  el.style.transform = '';
  setTimeout(() => el.classList.remove('torna'), 320);
}

function metti(el, casella) {
  el.classList.remove('trascinato', 'volante');
  el.style.transform = '';
  el.style.left = el.style.top = el.style.width = el.style.height = '';
  const posto = el.parentElement && el.parentElement.id === 'vassoio' ? el : null;
  if (posto) {
    // nel vassoio resta un posto vuoto, così gli altri cubi non si spostano
    const vuoto = crea('div', 'vuoto');
    posto.replaceWith(vuoto);
  }
  casella.appendChild(el);
  // nelle parole il cubo messo resta al suo posto (nel gioco libero si può spostare)
  if (!gioco.libero) el.classList.add('fermo');
  el.classList.add('appena');
  setTimeout(() => el.classList.remove('appena'), 400);
  Suoni.pop();
  scintille(casella);
}

/** Toccando una casella (vuota o con il suo cubo) la voce dice la lettera; toccandola di nuovo aggiunge un esempio. */
let ultimaCasella = { el: null, quando: 0 };
function toccaCasella(e) {
  const s = e.target.closest('.casella');
  if (!s || !s.dataset.lettera || gioco.libero || gioco.trova || gioco.occupato || trascina) return;
  if (performance.now() - ultimoRilascio < 400) return;
  Suoni.sblocca();
  const l = s.dataset.lettera;
  s.classList.remove('tocco');
  void s.offsetWidth;
  s.classList.add('tocco');
  const ancora = ultimaCasella.el === s && performance.now() - ultimaCasella.quando < 3000;
  ultimaCasella = { el: s, quando: performance.now() };
  const esempio = esempioPer(l);
  Voce.zitto();
  Voce.di(ancora && esempio ? `${nomeLettera(l)}, come ${esempio}` : nomeLettera(l), { velocita: 0.9 });
}

/** Copia e Ascolta: il cubo giusto va al suo posto (come una calamita), quello sbagliato torna indietro. */
function rilascia(t, x, y) {
  const el = t.el;
  const lettera = el.dataset.lettera;
  if (!vicinoAlleCaselle(x, y)) {
    torna(el);
    return;
  }
  const giusta = casellaVicina(x, y, (s) => vuota(s) && s.dataset.lettera === lettera);
  if (giusta.casella) {
    metti(el, giusta.casella);
    if ([...document.querySelectorAll('#caselle .casella')].every((s) => !vuota(s))) festaParola();
    return;
  }
  // non va bene: un piccolo aiuto
  torna(el);
  Suoni.boing();
  const vicina = casellaVicina(x, y, vuota).casella;
  if (!vicina) return;
  const attesa = vicina.dataset.lettera;
  const n = (gioco.errori.get(vicina) || 0) + 1;
  gioco.errori.set(vicina, n);
  if (n >= 2) vicina.classList.add('aiuto');
  const esempio = esempioPer(attesa);
  setTimeout(() => {
    Voce.zitto();
    Voce.di(n >= 2 && esempio ? `Cerca la ${nomeLettera(attesa)}, come ${esempio}` : `Cerca la ${nomeLettera(attesa)}`);
  }, 350);
}

/** Una parola d'esempio per una lettera: prima la parola del gioco, poi quelle della famiglia. */
function esempioPer(l) {
  if (gioco.parola && gioco.parola.testo.startsWith(l)) return gioco.parola.testo.toLowerCase();
  const fam = stato.parole.find((p) => p.famiglia && p.attiva && p.testo.startsWith(l));
  if (fam) return fam.testo.toLowerCase();
  return ESEMPI[l] || '';
}

// ------------------------------------------------------------ la partita

const gioco = { modo: 'copia', giro: [], indice: 0, parola: null, occupato: false, errori: new Map(), libero: false, trova: false, lettera: null, sbagli: 0 };

/** Prepara la schermata del gioco per uno dei tre giochi: parole, libero o trova. */
function tipoDiGioco(tipo) {
  gioco.libero = tipo === 'libero';
  gioco.trova = tipo === 'trova';
  $('#gioco').classList.toggle('libero', gioco.libero);
  $('#gioco').classList.toggle('trova', gioco.trova);
}

function scegliParole() {
  const attive = stato.parole.filter((p) => p.attiva && p.testo.replace(/ /g, '').length > 0);
  if (!attive.length) return [];
  // le parole corte escono più spesso, quelle appena viste meno
  const punteggio = (p) => Math.random() + p.testo.length * 0.05 + (stato.recenti.includes(p.id) ? 1.2 : 0);
  const ordinate = attive.map((p) => [punteggio(p), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const quante = stato.impostazioni.perGiro;
  const scelte = [];
  while (scelte.length < quante) scelte.push(...ordinate.slice(0, quante - scelte.length));
  return scelte;
}

function iniziaGiro() {
  Suoni.sblocca();
  tipoDiGioco('parole');
  gioco.modo = stato.impostazioni.livello === 'ascolta' ? 'ascolta' : 'copia';
  gioco.giro = scegliParole();
  gioco.indice = 0;
  mostra('gioco');
  if (!gioco.giro.length) {
    Voce.di('Non ci sono parole. Chiedi alla mamma o al papà!');
    return;
  }
  preparaParola();
}

function disegnaStelle() {
  const s = $('#stelle');
  s.innerHTML = '';
  if (gioco.libero) return;
  for (let k = 0; k < gioco.giro.length; k++) s.appendChild(crea('span', 'stella' + (k < gioco.indice ? ' piena' : ''), ICONE.stella(k < gioco.indice)));
}

function preparaParola() {
  const p = gioco.giro[gioco.indice];
  gioco.parola = p;
  gioco.errori = new Map();
  gioco.occupato = false;
  stato.recenti = [p.id, ...stato.recenti.filter((id) => id !== p.id)].slice(0, 8);
  disegnaStelle();

  const figura = $('#figura');
  figura.innerHTML = htmlFigura(p);
  figura.classList.remove('entra');
  void figura.offsetWidth;
  figura.classList.add('entra');

  const caselle = $('#caselle');
  caselle.innerHTML = '';
  [...p.testo].forEach((l, i) => {
    if (l === ' ') {
      caselle.appendChild(crea('div', 'spazio'));
      return;
    }
    const s = crea('div', 'casella', `<span class="fantasma">${l}</span>`);
    s.dataset.lettera = l;
    s.dataset.indice = i;
    s.style.setProperty('--colore', colore(l));
    if (gioco.modo === 'copia') s.classList.add('copia');
    if (stato.impostazioni.aiutoColori) s.classList.add('colorata');
    caselle.appendChild(s);
  });

  const lettere = [...p.testo.replace(/ /g, '')];
  const altre = ALFABETO.filter((l) => !lettere.includes(l) && l !== 'À');
  const extra = mescola(altre).slice(0, stato.impostazioni.extra);
  const vassoio = $('#vassoio');
  vassoio.innerHTML = '';
  for (const l of mescola([...lettere, ...extra])) {
    const c = nuovoCubo(l);
    rendiTrascinabile(c);
    vassoio.appendChild(c);
  }
  dimensiona();
  annunciaParola();
}

async function annunciaParola() {
  const p = gioco.parola;
  Voce.zitto();
  await aspetta(300);
  await Voce.di(gioco.modo === 'copia' ? 'Costruiamo...' : 'Scrivi...', { velocita: 0.95 });
  await Voce.parola(p);
}

/** Legge la parola a sillabe accendendo i cubi, poi tutta intera. */
async function leggiAccendendo(testo, cubiPerLettera) {
  const parole = testo.trim().split(/\s+/);
  let pos = 0;
  let nota = 0;
  for (const parola of parole) {
    for (const s of sillabeDi(parola)) {
      const accesi = cubiPerLettera.slice(pos, pos + s.length).filter(Boolean);
      pos += s.length;
      accesi.forEach((c) => c.classList.add('luce'));
      Suoni.ding(nota);
      nota += 2;
      await Voce.di(s.toLowerCase(), { velocita: 0.75 });
      await aspetta(120);
      accesi.forEach((c) => c.classList.remove('luce'));
    }
  }
  cubiPerLettera.filter(Boolean).forEach((c) => c.classList.add('salta'));
}

async function festaParola() {
  gioco.occupato = true;
  const p = gioco.parola;
  const cubi = [...document.querySelectorAll('#caselle .casella')].map((s) => s.querySelector('.cubo'));
  await aspetta(350);
  await leggiAccendendo(p.testo, cubi);
  await Voce.parola(p);
  Suoni.applauso();
  coriandoli(140);
  gioco.indice++;
  disegnaStelle();
  await bravo();
  await aspetta(700);
  if (stato.schermata !== 'gioco' || gioco.libero || gioco.trova) return;
  if (gioco.indice >= gioco.giro.length) fineGiro();
  else preparaParola();
}

async function bravo() {
  if (stato.vociBravo.length) return Voce.suona(unoA(stato.vociBravo).blob);
  const nome = stato.impostazioni.nome;
  const frasi = nome ? [`Bravo ${nome}!`, `Bravissimo ${nome}!`, 'Evviva!', `Che bravo, ${nome}!`, 'Super!'] : ['Bravo!', 'Bravissimo!', 'Evviva!', 'Che bravo!', 'Super!'];
  return Voce.di(unoA(frasi), { velocita: 0.95, tono: 1.25 });
}

async function fineGiro() {
  const figurine = window.FIGURINE;
  const nuova = stato.album < figurine.length;
  const indice = nuova ? stato.album : Math.floor(Math.random() * figurine.length);
  if (nuova) {
    stato.album++;
    salvaAlbum();
  }
  const f = figurine[indice];
  const premio = $('#premio');
  premio.innerHTML = '';
  const carta = crea('div', 'carta-premio', `<div class="dorso"></div><div class="fronte">${f.svg}</div>`);
  const pulsanti = crea('div', 'pulsanti-premio');
  const ancora = crea('button', 'tasto-grande gioca', ICONE.gioca);
  ancora.setAttribute('aria-label', 'Ancora');
  const aCasa = crea('button', 'tasto-medio casa', ICONE.casa);
  aCasa.setAttribute('aria-label', 'Torna a casa');
  pulsanti.append(ancora, aCasa);
  premio.append(carta, pulsanti);
  premio.classList.add('aperto');
  Suoni.fanfara();
  coriandoli(220);
  await aspetta(700);
  carta.classList.add('girata');
  Suoni.magia();
  await aspetta(500);
  await Voce.di(nuova ? `Hai vinto una figurina: ${f.nome}!` : `Le hai tutte! Ecco ${f.nome}!`, { tono: 1.2 });
  ancora.onclick = () => {
    premio.classList.remove('aperto');
    if (gioco.trova) iniziaTrova();
    else iniziaGiro();
  };
  aCasa.onclick = () => {
    premio.classList.remove('aperto');
    tornaACasa();
  };
}

// ------------------------------------------------------------ trova la lettera

const DOMANDE_TROVA = 5;
// lettere che a questa età si confondono facilmente: non si mettono mai insieme sul tavolo
const SIMILI = ['MN', 'EF', 'OQC', 'PRB', 'BD', 'CG', 'IL', 'UV', 'AÀ'];
const simili = (a, b) => SIMILI.some((g) => g.includes(a) && g.includes(b));

/** Le lettere da cercare: quelle delle sue parole, con le vocali e le lettere del suo nome più spesso. */
function lettereDaCercare(quante) {
  const peso = new Map();
  const aggiungi = (l, p) => {
    if (ALFABETO.includes(l) && l !== 'À') peso.set(l, (peso.get(l) || 0) + p);
  };
  for (const p of stato.parole.filter((x) => x.attiva)) for (const l of p.testo.replace(/ /g, '')) aggiungi(l, p.famiglia ? 2 : 1);
  for (const l of 'AEIOU') aggiungi(l, 4);
  for (const l of pulisci(stato.impostazioni.nome).replace(/ /g, '')) aggiungi(l, 6);
  const scelte = [];
  while (scelte.length < quante) {
    const possibili = [...peso.entries()].filter(([l]) => l !== scelte[scelte.length - 1] && !scelte.includes(l));
    const tutte = possibili.length ? possibili : [...peso.entries()];
    let r = Math.random() * tutte.reduce((s, [, p]) => s + p, 0);
    const [l] = tutte.find(([, p]) => (r -= p) < 0) || tutte[0];
    scelte.push(l);
  }
  return scelte;
}

function iniziaTrova() {
  Suoni.sblocca();
  tipoDiGioco('trova');
  gioco.modo = stato.impostazioni.livello === 'ascolta' ? 'ascolta' : 'copia';
  gioco.parola = null;
  gioco.giro = lettereDaCercare(DOMANDE_TROVA);
  gioco.indice = 0;
  mostra('gioco');
  preparaTrova();
}

/** La figura in alto: la lettera da cercare (livello Copia) oppure solo l'altoparlante (Ascolta). */
function htmlLetteraDaCercare(l) {
  if (gioco.modo === 'copia') {
    return `<svg viewBox="0 0 200 200"><rect x="14" y="14" width="172" height="172" rx="34" fill="${colore(l)}"/><text x="100" y="150" font-size="140" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui, sans-serif">${l}</text></svg>`;
  }
  const sfondo = stato.impostazioni.aiutoColori ? colore(l) : '#2fa84a';
  return `<div class="leggi" style="background:${sfondo}">${ICONE.voce}</div>`;
}

function preparaTrova() {
  const l = gioco.giro[gioco.indice];
  gioco.lettera = l;
  gioco.sbagli = 0;
  gioco.occupato = false;
  disegnaStelle();
  const figura = $('#figura');
  figura.innerHTML = htmlLetteraDaCercare(l);
  figura.classList.remove('entra');
  void figura.offsetWidth;
  figura.classList.add('entra');
  $('#caselle').innerHTML = '';
  const altre = mescola(ALFABETO.filter((x) => x !== 'À' && x !== l && !simili(x, l)));
  const scelte = [];
  for (const x of altre) {
    if (scelte.length >= 1 + stato.impostazioni.extra) break;
    if (!scelte.some((y) => simili(x, y))) scelte.push(x);
  }
  const vassoio = $('#vassoio');
  vassoio.innerHTML = '';
  mescola([l, ...scelte]).forEach((x, i) => {
    const c = nuovoCubo(x);
    c.classList.add('galleggia');
    c.style.animationDelay = (i * 0.45).toFixed(2) + 's';
    c.addEventListener('click', () => sceltaTrova(c));
    vassoio.appendChild(c);
  });
  dimensiona();
  annunciaTrova();
}

async function annunciaTrova() {
  Voce.zitto();
  await aspetta(300);
  await Voce.di(`Dov'è la ${nomeLettera(gioco.lettera)}?`, { velocita: 0.9 });
}

async function sceltaTrova(c) {
  if (gioco.occupato || !gioco.trova) return;
  Suoni.sblocca();
  const l = c.dataset.lettera;
  Voce.zitto();
  if (l !== gioco.lettera) {
    // il cubo "scuote la testa" e la voce dice quale lettera è
    gioco.sbagli++;
    c.classList.remove('sbagliato');
    void c.offsetWidth;
    c.classList.add('sbagliato');
    setTimeout(() => c.classList.remove('sbagliato'), 500);
    Suoni.boing();
    if (gioco.sbagli >= 2) document.querySelectorAll('#vassoio .cubo').forEach((x) => x.classList.toggle('indizio', x.dataset.lettera === gioco.lettera));
    await Voce.di(`Questa è la ${nomeLettera(l)}. Cerca la ${nomeLettera(gioco.lettera)}!`);
    return;
  }
  gioco.occupato = true;
  c.classList.remove('galleggia', 'indizio');
  c.classList.add('giusto');
  document.querySelectorAll('#vassoio .cubo').forEach((x) => x !== c && x.classList.add('spento'));
  Suoni.pop();
  Suoni.ding(7);
  scintille(c);
  const esempio = esempioPer(l);
  await Voce.di(`Sì! È la ${nomeLettera(l)}${esempio ? ', come ' + esempio : ''}!`, { tono: 1.2 });
  gioco.indice++;
  disegnaStelle();
  if (gioco.indice >= gioco.giro.length) {
    Suoni.applauso();
    coriandoli(160);
    await bravo();
    await aspetta(400);
    if (stato.schermata === 'gioco' && gioco.trova) fineGiro();
  } else {
    coriandoli(40);
    await aspetta(500);
    if (stato.schermata === 'gioco' && gioco.trova) preparaTrova();
  }
}

// ------------------------------------------------------------ il gioco libero

const CASELLE_LIBERE = 8;

function iniziaLibero() {
  Suoni.sblocca();
  tipoDiGioco('libero');
  gioco.occupato = false;
  gioco.parola = null;
  mostra('gioco');
  disegnaStelle();
  const figura = $('#figura');
  figura.innerHTML = `<div class="leggi">${ICONE.voce}</div>`;
  const caselle = $('#caselle');
  caselle.innerHTML = '';
  for (let i = 0; i < CASELLE_LIBERE; i++) caselle.appendChild(crea('div', 'casella libera'));
  const vassoio = $('#vassoio');
  vassoio.innerHTML = '';
  for (const l of ALFABETO) {
    const c = nuovoCubo(l);
    c.style.setProperty('--giro', '0deg');
    rendiTrascinabile(c, true);
    vassoio.appendChild(c);
  }
  dimensiona();
  Voce.zitto();
  Voce.di('Metti i cubi che vuoi, poi tocca la figura e io leggo!');
}

/** Nel gioco libero la figura torna l'altoparlante appena si cambiano i cubi. */
function figuraLibera() {
  const figura = $('#figura');
  if (!figura.querySelector('.leggi')) figura.innerHTML = `<div class="leggi">${ICONE.voce}</div>`;
}

function rilasciaLibero(t, x, y) {
  const el = t.el;
  figuraLibera();
  const libera = casellaVicina(x, y, vuota);
  if (vicinoAlleCaselle(x, y) && libera.casella) {
    const sotto = casellaVicina(x, y, () => true);
    const dove = sotto.casella && vuota(sotto.casella) ? sotto.casella : libera.casella;
    metti(el, dove);
    return;
  }
  if (t.daCasella && vicinoAlleCaselle(x, y)) {
    // rimesso vicino al suo posto: ci torna
    torna(el);
    return;
  }
  // fuori dalle caselle: il cubo sparisce
  el.classList.add('sparisce');
  Suoni.puff();
  setTimeout(() => el.remove(), 260);
}

async function leggiLibero() {
  if (gioco.occupato) return;
  const caselle = [...document.querySelectorAll('#caselle .casella')];
  const cubi = caselle.map((s) => s.querySelector('.cubo'));
  const testo = cubi.map((c) => (c ? c.dataset.lettera : ' ')).join('').replace(/\s+/g, ' ').trim();
  Suoni.sblocca();
  Voce.zitto();
  if (!testo) {
    Voce.di('Metti qualche cubo!');
    return;
  }
  gioco.occupato = true;
  const pieni = cubi.filter(Boolean);
  await leggiAccendendo(testo, pieni);
  await Voce.di(testo.toLowerCase(), { velocita: 0.8 });
  const trovata = stato.parole.find((p) => p.attiva && p.testo === testo);
  if (trovata) {
    const figura = $('#figura');
    figura.innerHTML = htmlFigura(trovata);
    figura.classList.remove('entra');
    void figura.offsetWidth;
    figura.classList.add('entra');
    Suoni.applauso();
    coriandoli(120);
    await bravo();
  } else if (Math.random() < 0.35) {
    await Voce.di(unoA(['Che parola buffa!', 'Questa la sai solo tu!', 'Ah ah, che ridere!']), { tono: 1.3 });
  }
  pieni.forEach((c) => c.classList.remove('salta'));
  gioco.occupato = false;
}

function cancellaLibero() {
  if (gioco.occupato) return;
  const cubi = document.querySelectorAll('#caselle .cubo');
  if (!cubi.length) return;
  figuraLibera();
  Suoni.puff();
  cubi.forEach((c) => c.classList.add('sparisce'));
  setTimeout(() => cubi.forEach((c) => c.remove()), 260);
}

// ------------------------------------------------------------ effetti: scintille e coriandoli

function scintille(el) {
  const r = el.getBoundingClientRect();
  for (let k = 0; k < 8; k++) {
    const s = crea('div', 'scintilla');
    const a = (k / 8) * Math.PI * 2;
    s.style.left = r.left + r.width / 2 + 'px';
    s.style.top = r.top + r.height / 2 + 'px';
    s.style.setProperty('--dx', Math.cos(a) * r.width * 0.9 + 'px');
    s.style.setProperty('--dy', Math.sin(a) * r.width * 0.9 + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }
}

const tela = { el: null, ctx: null, pezzi: [], giro: false };
function coriandoli(n) {
  if (!tela.el) {
    tela.el = $('#coriandoli');
    tela.ctx = tela.el.getContext('2d');
  }
  const w = (tela.el.width = window.innerWidth);
  tela.el.height = window.innerHeight;
  for (let k = 0; k < n; k++) {
    tela.pezzi.push({
      x: Math.random() * w,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 0.3,
      c: unoA(TAVOLOZZA),
      l: 8 + Math.random() * 10,
      forma: Math.random() < 0.3 ? 'stella' : 'pezzo',
    });
  }
  if (!tela.giro) {
    tela.giro = true;
    requestAnimationFrame(animaCoriandoli);
  }
}
function animaCoriandoli() {
  const { ctx, el } = tela;
  ctx.clearRect(0, 0, el.width, el.height);
  for (const p of tela.pezzi) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.a += p.va;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.fillStyle = p.c;
    if (p.forma === 'stella') {
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? p.l * 0.4 : p.l;
        const a = (k * Math.PI) / 5;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.fill();
    } else ctx.fillRect(-p.l / 2, -p.l / 4, p.l, p.l / 2);
    ctx.restore();
  }
  tela.pezzi = tela.pezzi.filter((p) => p.y < el.height + 30);
  if (tela.pezzi.length) requestAnimationFrame(animaCoriandoli);
  else {
    ctx.clearRect(0, 0, el.width, el.height);
    tela.giro = false;
  }
}

// ------------------------------------------------------------ schermate

function mostra(nome, storia = true) {
  document.querySelectorAll('.schermata').forEach((s) => s.classList.toggle('attiva', s.id === nome));
  stato.schermata = nome;
  if (storia && nome !== 'home') history.pushState({ schermata: nome }, '');
}

function tornaACasa() {
  Voce.zitto();
  gioco.occupato = false;
  $('#premio').classList.remove('aperto');
  mostra('home', false);
  aggiornaHome();
}

// il tasto "indietro" del tablet riporta alla schermata iniziale invece di chiudere il gioco
window.addEventListener('popstate', () => {
  if (stato.schermata !== 'home') tornaACasa();
});

function titoloGioco() {
  const nome = stato.impostazioni.nome;
  return nome ? `I CUBI DI ${nome.toLocaleUpperCase('it-IT')}` : 'I CUBI DELLE PAROLE';
}

function aggiornaHome() {
  const testo = titoloGioco();
  document.title = stato.impostazioni.nome ? `I Cubi di ${stato.impostazioni.nome}` : 'I Cubi delle Parole';
  const t = $('#titolo');
  t.innerHTML = '';
  testo.split(' ').forEach((parola, k) => {
    const riga = crea('span', 'parola-titolo');
    [...parola].forEach((l, i) => {
      const c = crea('span', 'cubetto', l);
      c.style.setProperty('--colore', colore(l));
      c.style.animationDelay = (k * 0.3 + i * 0.08).toFixed(2) + 's';
      riga.appendChild(c);
    });
    t.appendChild(riga);
  });
}

function apriAlbum() {
  Suoni.sblocca();
  mostra('album');
  const g = $('#figurine');
  g.innerHTML = '';
  window.FIGURINE.forEach((f, i) => {
    const vinta = i < stato.album;
    const c = crea('button', 'figurina' + (vinta ? ' vinta' : ''), vinta ? f.svg : '<span>?</span>');
    c.setAttribute('aria-label', vinta ? f.nome : 'figurina da vincere');
    c.onclick = () => {
      c.classList.remove('salta');
      void c.offsetWidth;
      c.classList.add('salta');
      Voce.zitto();
      Voce.di(vinta ? f.nome : 'Questa la vinci giocando!');
    };
    g.appendChild(c);
  });
  Voce.zitto();
  Voce.di(stato.album ? `Hai ${stato.album} figurine!` : 'Gioca e vinci le figurine!');
}

// ------------------------------------------------------------ l'angolo dei genitori

function finestra(titolo, contenuto, pulsanti) {
  return new Promise((ok) => {
    const d = $('#dialogo');
    d.innerHTML = '';
    const box = crea('div', 'box');
    box.appendChild(crea('h3', '', titolo));
    if (contenuto) box.appendChild(typeof contenuto === 'string' ? crea('p', '', contenuto) : contenuto);
    const riga = crea('div', 'riga-pulsanti');
    for (const [testo, valore, classe] of pulsanti) {
      const b = crea('button', 'pulsante ' + (classe || ''), testo);
      b.onclick = () => {
        d.classList.remove('aperto');
        ok(valore);
      };
      riga.appendChild(b);
    }
    box.appendChild(riga);
    d.appendChild(box);
    d.classList.add('aperto');
  });
}

async function riduciFoto(file) {
  let img;
  try {
    img = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = URL.createObjectURL(file);
    });
  }
  const lato = Math.min(img.width, img.height);
  const sx = (img.width - lato) / 2;
  const sy = (img.height - lato) / 2;
  const c = document.createElement('canvas');
  c.width = c.height = Math.min(600, lato);
  c.getContext('2d').drawImage(img, sx, sy, lato, lato, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob((b) => ok(b), 'image/jpeg', 0.85));
}

function scegliFile() {
  return new Promise((ok) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = 'image/*';
    i.onchange = () => ok(i.files && i.files[0]);
    i.click();
  });
}

const Registratore = {
  attivo: null,
  async registra(secondi, suTick) {
    if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('niente microfono');
    const flusso = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(flusso);
    const pezzi = [];
    return new Promise((ok) => {
      mr.ondataavailable = (e) => e.data.size && pezzi.push(e.data);
      mr.onstop = () => {
        flusso.getTracks().forEach((t) => t.stop());
        this.attivo = null;
        ok(new Blob(pezzi, { type: mr.mimeType || 'audio/webm' }));
      };
      mr.start();
      this.attivo = mr;
      let resto = secondi;
      suTick(resto);
      const conto = setInterval(() => {
        resto--;
        suTick(resto);
        if (resto <= 0) {
          clearInterval(conto);
          if (mr.state !== 'inactive') mr.stop();
        }
      }, 1000);
      mr.addEventListener('stop', () => clearInterval(conto));
    });
  },
  ferma() {
    if (this.attivo && this.attivo.state !== 'inactive') this.attivo.stop();
  },
};

/** Pulsante "registra": premuto registra fino a `secondi`, ripremuto si ferma prima. */
async function registraCon(pulsante, secondi) {
  if (Registratore.attivo) {
    Registratore.ferma();
    return null;
  }
  const testo = pulsante.innerHTML;
  try {
    pulsante.classList.add('registra');
    const blob = await Registratore.registra(secondi, (s) => (pulsante.innerHTML = `● ${s}`));
    return blob;
  } catch {
    await finestra('Microfono non disponibile', "Per registrare serve il permesso di usare il microfono. Se l'app è aperta dal link (https) il tablet lo chiede la prima volta.", [['Ho capito', true]]);
    return null;
  } finally {
    pulsante.classList.remove('registra');
    pulsante.innerHTML = testo;
  }
}

let invitoInstalla = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  invitoInstalla = e;
});

function sezione(titolo, aiuto) {
  const s = crea('section', 'sezione');
  s.appendChild(crea('h3', '', titolo));
  if (aiuto) s.appendChild(crea('p', 'nota', aiuto));
  return s;
}

function scelta(opzioni, attuale, quandoCambia) {
  const riga = crea('div', 'scelta');
  for (const [valore, testo] of opzioni) {
    const b = crea('button', 'opzione' + (valore === attuale ? ' scelta-attiva' : ''), testo);
    b.onclick = () => {
      riga.querySelectorAll('.opzione').forEach((x) => x.classList.remove('scelta-attiva'));
      b.classList.add('scelta-attiva');
      quandoCambia(valore);
    };
    riga.appendChild(b);
  }
  return riga;
}

function apriGenitori() {
  Voce.zitto();
  mostra('genitori');
  disegnaGenitori();
}

function disegnaGenitori() {
  const g = $('#genitori');
  const scorri = g.scrollTop;
  g.innerHTML = '';
  const testa = crea('header', 'testa-genitori');
  testa.appendChild(crea('h2', '', "L'angolo dei genitori"));
  const esci = crea('button', 'pulsante principale', 'Chiudi');
  esci.onclick = tornaACasa;
  testa.appendChild(esci);
  g.appendChild(testa);

  // il bambino
  const s1 = sezione('Il bambino', 'Il nome compare nel titolo e la voce lo usa per dire «Bravo!».');
  const nome = crea('input', 'campo');
  nome.type = 'text';
  nome.placeholder = 'Come si chiama?';
  nome.value = stato.impostazioni.nome;
  nome.maxLength = 16;
  nome.oninput = () => {
    stato.impostazioni.nome = nome.value.trim().replace(/\s+/g, ' ');
    salvaImpostazioni();
  };
  s1.appendChild(nome);
  g.appendChild(s1);

  // come si gioca
  const s2 = sezione('Come si gioca');
  s2.appendChild(crea('p', 'etichetta', 'Livello'));
  s2.appendChild(
    scelta([['copia', 'Copia (le lettere si vedono)'], ['ascolta', 'Ascolta e scrivi']], stato.impostazioni.livello, (v) => {
      stato.impostazioni.livello = v;
      salvaImpostazioni();
    }),
  );
  s2.appendChild(crea('p', 'etichetta', 'Aiuto dei colori (le caselle hanno il colore del cubo giusto)'));
  s2.appendChild(
    scelta([[true, 'Sì'], [false, 'No']], stato.impostazioni.aiutoColori, (v) => {
      stato.impostazioni.aiutoColori = v;
      salvaImpostazioni();
    }),
  );
  s2.appendChild(crea('p', 'etichetta', 'Cubi in più da scartare'));
  s2.appendChild(
    scelta([[0, 'Nessuno'], [1, 'Uno'], [2, 'Due']], stato.impostazioni.extra, (v) => {
      stato.impostazioni.extra = v;
      salvaImpostazioni();
    }),
  );
  s2.appendChild(crea('p', 'etichetta', 'Parole per ogni figurina'));
  s2.appendChild(
    scelta([[3, '3'], [4, '4'], [5, '5']], stato.impostazioni.perGiro, (v) => {
      stato.impostazioni.perGiro = v;
      salvaImpostazioni();
    }),
  );
  g.appendChild(s2);

  // le parole
  const s3 = sezione(
    'Le parole',
    'Aggiungete il nome del bambino, dei parenti, degli animali e dei giocattoli. Si possono scrivere più parole insieme, separate da una virgola. Toccando la figura si sceglie una foto (anche scattata ora) o un disegno; con il microfono si registra la parola detta da voi.',
  );
  const riga = crea('div', 'aggiungi');
  const campo = crea('input', 'campo');
  campo.type = 'text';
  campo.placeholder = 'Parole nuove, separate da una virgola';
  const aggiungi = crea('button', 'pulsante principale', 'Aggiungi');
  aggiungi.onclick = async () => {
    const nuove = campo.value.split(',').map(pulisci).filter((t) => t.length > 0);
    let n = 0;
    for (const testo of nuove) {
      if (stato.parole.some((p) => p.testo === testo)) continue;
      const p = { id: 'fam-' + Date.now().toString(36) + '-' + n++, testo, disegno: disegnoPer(testo), foto: null, voce: null, attiva: true, famiglia: true };
      stato.parole.push(p);
      await salvaParola(p);
    }
    campo.value = '';
    disegnaGenitori();
  };
  riga.append(campo, aggiungi);
  s3.appendChild(riga);
  const elenco = crea('div', 'elenco-parole');
  const ordinate = [...stato.parole.filter((p) => p.famiglia), ...stato.parole.filter((p) => !p.famiglia)];
  for (const p of ordinate) elenco.appendChild(schedaParola(p));
  s3.appendChild(elenco);
  g.appendChild(s3);

  // le voci del bravo
  const s4 = sezione('Le voci del «Bravo!»', 'Registrate mamma, papà o i nonni che dicono «Bravo!» (fino a 4 secondi): il gioco le userà a caso al posto della voce del tablet.');
  const regBravo = crea('button', 'pulsante', `${ICONE.microfono} Registra un «Bravo!»`);
  regBravo.onclick = async () => {
    const blob = await registraCon(regBravo, 4);
    if (blob && blob.size > 0) {
      const v = { id: 'bravo-' + Date.now().toString(36), blob };
      stato.vociBravo.push(v);
      await Archivio.metti('voci', v).catch(() => {});
      disegnaGenitori();
    }
  };
  s4.appendChild(regBravo);
  stato.vociBravo.forEach((v, i) => {
    const r = crea('div', 'voce-bravo');
    r.appendChild(crea('span', '', `«Bravo!» numero ${i + 1}`));
    const ascolta = crea('button', 'pulsante piccolo', '▶ Ascolta');
    ascolta.onclick = () => Voce.suona(v.blob);
    const togli = crea('button', 'pulsante piccolo pericolo', 'Togli');
    togli.onclick = async () => {
      stato.vociBravo = stato.vociBravo.filter((x) => x !== v);
      await Archivio.togli('voci', v.id).catch(() => {});
      disegnaGenitori();
    };
    r.append(ascolta, togli);
    s4.appendChild(r);
  });
  g.appendChild(s4);

  // altro
  const s5 = sezione('Altro');
  const prova = crea('button', 'pulsante', 'Prova la voce del dispositivo');
  prova.onclick = () => {
    Voce.zitto();
    Voce.di(`Ciao${stato.impostazioni.nome ? ' ' + stato.impostazioni.nome : ''}! Giochiamo con le lettere?`);
  };
  s5.appendChild(prova);
  if (!Voce.disponibile || (speechSynthesis.getVoices().length && !Voce.voce)) {
    s5.appendChild(crea('p', 'nota avviso', "Su questo dispositivo non c'è una voce italiana: installatela nelle impostazioni (Sintesi vocale / Text-to-speech) oppure registrate le parole con il microfono."));
  }
  const intero = crea('button', 'pulsante', 'Schermo intero');
  intero.onclick = () => document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  s5.appendChild(intero);
  if (invitoInstalla) {
    const inst = crea('button', 'pulsante principale', "Installa l'app su questo dispositivo");
    inst.onclick = async () => {
      invitoInstalla.prompt();
      invitoInstalla = null;
      disegnaGenitori();
    };
    s5.appendChild(inst);
  }
  const azzera = crea('button', 'pulsante pericolo', "Ricomincia l'album delle figurine");
  azzera.onclick = async () => {
    if (await finestra("Ricominciare l'album?", 'Le figurine vinte spariscono e si ricomincia da capo.', [['Sì, ricomincia', true, 'pericolo'], ['No', false]])) {
      stato.album = 0;
      salvaAlbum();
    }
  };
  s5.appendChild(azzera);
  s5.appendChild(crea('p', 'nota', `Le foto, le voci registrate e le parole aggiunte restano solo su questo dispositivo: non vengono mandate su internet. Versione ${VERSIONE}.`));
  s5.appendChild(crea('p', 'nota copyright-genitori', '© 2026 GML – Tutti i diritti riservati.'));
  g.appendChild(s5);
  g.scrollTop = scorri;
}

function schedaParola(p) {
  const s = crea('div', 'scheda' + (p.attiva ? '' : ' spenta'));
  const fig = crea('button', 'mini-figura', htmlFigura(p));
  fig.setAttribute('aria-label', 'Cambia la figura');
  fig.onclick = () => cambiaFigura(p);
  const testo = crea('div', 'testo-scheda');
  testo.appendChild(crea('strong', '', p.testo));
  testo.appendChild(crea('span', 'nota', p.famiglia ? 'aggiunta da voi' : 'già nel gioco'));
  const azioni = crea('div', 'azioni-scheda');
  const attiva = crea('button', 'pulsante piccolo ' + (p.attiva ? 'principale' : ''), p.attiva ? 'In gioco' : 'Fuori gioco');
  attiva.onclick = async () => {
    p.attiva = !p.attiva;
    await salvaParola(p);
    disegnaGenitori();
  };
  const ascolta = crea('button', 'pulsante piccolo', '▶');
  ascolta.setAttribute('aria-label', 'Ascolta');
  ascolta.onclick = () => {
    Voce.zitto();
    Voce.parola(p);
  };
  const registra = crea('button', 'pulsante piccolo' + (p.voce ? ' fatto' : ''), ICONE.microfono);
  registra.setAttribute('aria-label', 'Registra la parola');
  registra.onclick = async () => {
    const blob = await registraCon(registra, 3);
    if (blob && blob.size > 0) {
      p.voce = blob;
      await salvaParola(p);
      disegnaGenitori();
    }
  };
  azioni.append(attiva, ascolta, registra);
  if (p.voce) {
    const toglivoce = crea('button', 'pulsante piccolo', 'Voce del tablet');
    toglivoce.onclick = async () => {
      p.voce = null;
      await salvaParola(p);
      disegnaGenitori();
    };
    azioni.appendChild(toglivoce);
  }
  if (p.famiglia) {
    const togli = crea('button', 'pulsante piccolo pericolo', 'Togli');
    togli.onclick = async () => {
      if (!(await finestra(`Togliere ${p.testo}?`, null, [['Sì, togli', true, 'pericolo'], ['No', false]]))) return;
      stato.parole = stato.parole.filter((x) => x !== p);
      dimenticaFoto(p.id);
      await Archivio.togli('parole', p.id).catch(() => {});
      disegnaGenitori();
    };
    azioni.appendChild(togli);
  }
  s.append(fig, testo, azioni);
  return s;
}

async function cambiaFigura(p) {
  const opzioni = [['Foto (scatta o scegli)', 'foto', 'principale'], ['Un disegno', 'disegno']];
  if (p.foto) opzioni.push(['Togli la foto', 'togli']);
  opzioni.push(['Annulla', null]);
  const scelto = await finestra(`La figura di ${p.testo}`, null, opzioni);
  if (scelto === 'foto') {
    const file = await scegliFile();
    if (!file) return;
    const blob = await riduciFoto(file).catch(() => null);
    if (!blob) return;
    p.foto = blob;
    dimenticaFoto(p.id);
  } else if (scelto === 'disegno') {
    const griglia = crea('div', 'griglia-disegni');
    const scelta = await new Promise((ok) => {
      for (const [chiave, d] of Object.entries(window.DISEGNI)) {
        const b = crea('button', 'mini-figura', d.svg);
        b.setAttribute('aria-label', d.nome);
        b.onclick = () => {
          $('#dialogo').classList.remove('aperto');
          ok(chiave);
        };
        griglia.appendChild(b);
      }
      finestra('Scegli un disegno', griglia, [['Annulla', null]]).then(() => ok(null));
    });
    if (!scelta) return;
    p.disegno = scelta;
    p.foto = null;
    dimenticaFoto(p.id);
  } else if (scelto === 'togli') {
    p.foto = null;
    dimenticaFoto(p.id);
  } else return;
  await salvaParola(p);
  disegnaGenitori();
}

// L'ingranaggio si apre solo tenendolo premuto 3 secondi (così il bambino non ci entra per sbaglio).
function preparaIngranaggio() {
  const b = $('#ingranaggio');
  let timer = null;
  let inizio = 0;
  const anima = () => {
    if (!timer) return;
    const k = Math.min(1, (performance.now() - inizio) / 3000);
    b.style.setProperty('--avanzamento', (k * 360).toFixed(0) + 'deg');
    if (k < 1) requestAnimationFrame(anima);
  };
  const ferma = () => {
    clearTimeout(timer);
    timer = null;
    b.style.setProperty('--avanzamento', '0deg');
  };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    inizio = performance.now();
    timer = setTimeout(() => {
      ferma();
      apriGenitori();
    }, 3000);
    requestAnimationFrame(anima);
  });
  b.addEventListener('pointerup', ferma);
  b.addEventListener('pointerleave', ferma);
  b.addEventListener('pointercancel', ferma);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ------------------------------------------------------------ avvio

const VERSIONE = '1.1.1';

function collega() {
  $('#gioca').innerHTML = ICONE.gioca;
  $('#libero').innerHTML = ICONE.cubi;
  $('#apri-album').innerHTML = ICONE.album;
  $('#ingranaggio').insertAdjacentHTML('afterbegin', ICONE.ingranaggio);
  $('#schermo').innerHTML = ICONE.schermo;
  $('#esci').innerHTML = ICONE.casa;
  $('#esci-album').innerHTML = ICONE.casa;
  $('#ripeti').innerHTML = ICONE.voce;
  $('#leggi').innerHTML = ICONE.voce;
  $('#cancella').innerHTML = ICONE.cancella;

  $('#gioca').onclick = iniziaGiro;
  $('#libero').onclick = iniziaLibero;
  $('#apri-album').onclick = apriAlbum;
  $('#esci').onclick = () => history.back();
  $('#esci-album').onclick = () => history.back();
  const ripeti = () => {
    Suoni.sblocca();
    if (gioco.libero) return leggiLibero();
    if (gioco.trova) {
      if (!gioco.occupato) annunciaTrova();
      return;
    }
    if (gioco.parola && !gioco.occupato) {
      Voce.zitto();
      Voce.parola(gioco.parola);
    }
  };
  $('#ripeti').onclick = ripeti;
  $('#figura').onclick = ripeti;
  $('#trova').innerHTML = ICONE.trova;
  $('#trova').onclick = iniziaTrova;
  $('#leggi').onclick = leggiLibero;
  $('#cancella').onclick = cancellaLibero;
  $('#caselle').addEventListener('click', toccaCasella);
  $('#schermo').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  };
  // il titolo ripete il nome del gioco
  $('#titolo').onclick = () => {
    Suoni.sblocca();
    Voce.zitto();
    Voce.di(titoloGioco().toLocaleLowerCase('it-IT'));
  };
  preparaIngranaggio();
  window.addEventListener('resize', () => stato.schermata === 'gioco' && dimensiona());
  document.addEventListener('contextmenu', (e) => {
    if (stato.schermata !== 'genitori') e.preventDefault();
  });
}

/** Modalità di prova per controllare la grafica: index.html#prova=gioco (oppure libero, album, premio, genitori). */
async function provaScena(nome) {
  Voce.disponibile = false;
  if (nome === 'trova') {
    iniziaTrova();
    gioco.indice = 2;
    disegnaStelle();
  } else if (nome === 'gioco' || nome === 'premio') {
    iniziaGiro();
    const caselle = [...document.querySelectorAll('#caselle .casella')].slice(0, 2);
    for (const s of caselle) {
      const c = [...document.querySelectorAll('#vassoio .cubo')].find((x) => x.dataset.lettera === s.dataset.lettera);
      if (c) metti(c, s);
    }
    gioco.indice = 1;
    disegnaStelle();
    if (nome === 'premio') {
      fineGiro();
      await aspetta(1400);
    }
  } else if (nome === 'libero') {
    iniziaLibero();
    const caselle = document.querySelectorAll('#caselle .casella');
    'CASA'.split('').forEach((l, i) => metti(nuovoCubo(l), caselle[i]));
    $('#figura').innerHTML = htmlFigura(stato.parole.find((p) => p.testo === 'CASA'));
  } else if (nome === 'album') {
    stato.album = 5;
    apriAlbum();
  } else if (nome === 'genitori') apriGenitori();
}

async function avvia() {
  Voce.init();
  collega();
  stato.parole = PAROLE_BASE.map((p) => Object.assign({}, p));
  aggiornaHome();
  const prova = location.hash.match(/prova=(\w+)/);
  if (prova) {
    provaScena(prova[1]);
    return;
  }
  await caricaTutto();
  aggiornaHome();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

avvia();
