/* Pamosii Viva Surdo — service worker (funcionar sem rede)

   O que fica guardado neste telemóvel/computador:
     - a estrutura da página, o estilo, o motor (todos os dados — glossário, cursos,
       mini-curso — vivem dentro de app.js, por isso o site offline continua completo);
     - o manifest e a marca;
     - os tipos letra a letra (Google Fonts) e as miniaturas das aulas já vistas.

   O que NÃO fica guardado: os vídeos do YouTube (precisam de ligação, e o site diz
   isso mesmo quando se carrega em "Reproduzir" sem rede) e tudo o que a pessoa escreve
   ou grava — as gravações do Pamosii nunca saem do browser, e este ficheiro só vê
   pedidos GET de ficheiros, nunca o conteúdo dos campos nem dos vídeos.

   IMPORTANTE AO PUBLICAR: este site é versionado por query string (styles.css?v=NN).
   Se mudares app.js ou styles.css sem mudar o `?v=` do index.html, o offline continua a
   servir a versão antiga. Por isso a VERSÃO abaixo acompanha sempre o `?v=`.          */

const VERSAO = 'vs78';
const CASULO = 'casulo-' + VERSAO;
const EXTERNO = 'externo-' + VERSAO;

/* as chaves com o mesmo `?v=` do index.html — é assim que o offline acerta no primeiro pedido */
const FICHEIROS = [
  './',
  './index.html',
  './styles.css?v=' + VERSAO,
  './app.js?v=' + VERSAO,
  './manifest.webmanifest',
  './assets/logo-mark.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/pattern-angola.svg',
  './assets/biblia.json',
  './assets/glossario-extra.json',
  './assets/marcacoes.json',
];

const eExterno = u => /^(fonts\.googleapis\.com|fonts\.gstatic\.com|i\.ytimg\.com)$/.test(new URL(u).hostname);

self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const c = await caches.open(CASULO);
    /* um ficheiro em falta não pode chumbar a instalação: o resto continua offline */
    await Promise.all(FICHEIROS.map(async f => {
      try {
        const res = await fetch(f, { cache: 'reload' });
        if (res && res.ok) await c.put(f, res);
      } catch (e) { /* segue em frente */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    for (const nome of await caches.keys()) {
      if (nome !== CASULO && nome !== EXTERNO) await caches.delete(nome);
    }
    await self.clients.claim();
  })());
});

/* limita o cache de imagens externas: miniaturas vistas ao longo de semanas não podem
   crescer sem fim num telemóvel com pouco armazenamento */
async function apara(c, max) {
  const chaves = await c.keys();
  if (chaves.length <= max) return;
  for (const k of chaves.slice(0, chaves.length - max)) await c.delete(k);
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* navegação: rede primeiro (a página tem de estar actualizada), casulo se não houver */
  if (req.mode === 'navigate') {
    ev.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CASULO);
        await c.put('./index.html', res.clone());
        await c.put('./', res.clone());
        return res;
      } catch (e) {
        const c = await caches.open(CASULO);
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }

  /* tipos e miniaturas: servir o que já está guardado, renovar em segundo plano */
  if (eExterno(url)) {
    ev.respondWith((async () => {
      const c = await caches.open(EXTERNO);
      const guardado = await c.match(req);
      const rede = fetch(req).then(async res => {
        if (res && (res.ok || res.type === 'opaque')) { await c.put(req, res.clone()); await apara(c, 120); }
        return res;
      }).catch(() => null);
      if (guardado) { rede.catch(() => {}); return guardado; }
      const res = await rede;
      return res || Response.error();
    })());
    return;
  }

  /* ficheiros do próprio site: primeiro o que está guardado na chave EXACTA (com o ?v=),
     depois a rede — e o que a rede trouxer fica guardado.
     Não há fallback "ignorar o ?v=": foi tentado, e foi exactamente assim que um service
     worker velho serviu o styles.css da versão anterior a quem já carregava o vs33.
     Com o casulo pré-guardado nas chaves versionadas (FICHEIROS acima) isso não acontece. */
  if (url.origin === self.location.origin) {
    /* O dicionário publicado e as marcações de tempo não têm ?v=: mudam quando a equipa
       ingere um ficheiro novo, e quem está com ligação deve ver os sinais novos sem
       desinstalar nada. Rede primeiro, casulo se não houver ligação — por isso o offline
       continua com o último que viste. */
    const dados = url.pathname.match(/\/assets\/(glossario-extra|marcacoes)\.json$/);
    if (dados) {
      const chave = './assets/' + dados[1] + '.json';
      ev.respondWith((async () => {
        const c = await caches.open(CASULO);
        try {
          const res = await fetch(req);
          if (res && res.ok) await c.put(chave, res.clone());
          return res;
        } catch (e) {
          return (await c.match(chave)) || Response.error();
        }
      })());
      return;
    }
    ev.respondWith((async () => {
      const c = await caches.open(CASULO);
      const guardado = await c.match(req);
      if (guardado) return guardado;
      const res = await fetch(req);
      if (res && res.ok) await c.put(req, res.clone());
      return res;
    })());
  }
});
