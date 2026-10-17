// Fa funzionare il gioco anche senza internet: la prima volta salva tutti i file sul dispositivo.
'use strict';

const NOME = 'cubi-delle-parole-v2';
const FILE = ['./', 'index.html', 'stile.css', 'disegni.js', 'app.js', 'manifest.webmanifest', 'icone/icona-192.png', 'icone/icona-512.png', 'icone/icona-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(NOME).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== NOME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// prima prova la rete (così gli aggiornamenti arrivano), se non c'è usa la copia salvata
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && new URL(e.request.url).origin === location.origin) {
          const copia = r.clone();
          caches.open(NOME).then((c) => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
