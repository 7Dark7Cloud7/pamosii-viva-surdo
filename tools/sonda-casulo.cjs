#!/usr/bin/env node
'use strict';
/*
 * Sonda do casulo — o que fica verificado em CADA publicação.
 *
 *   node tools/sonda-casulo.cjs
 *   node tools/sonda-casulo.cjs --base=https://…/pamosii-viva-surdo/ --porta=5401
 *
 * Não é uma sonda de interface: é a contagem do que o service worker efectivamente
 * pôs na Cache API, mais o estado do próprio worker e os campos do manifest que o
 * telemóvel lê para «Adicionar ao ecrã principal». Serve para o README poder dizer
 * «casulo-vsNN: N entradas / B bytes» em vez de repetir a versão anterior.
 *
 * Lê a versão de `styles.css?v=` no URL, porque é essa que tem de bater com a
 * VERSAO do sw.js: se divergirem, o offline continua a servir o código velho.
 * Sai 1 se houver falha.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };

const BASE = flag('base', 'http://127.0.0.1:8123/');
const PORTA = Number(flag('porta', 5401));
const ESPERA = Number(flag('espera', 1500));

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.error('Chrome não encontrado'); process.exit(1); }

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function alvo(porta) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/json/new?about:blank`, { method: 'PUT' });
      if (r.ok) return await r.json();
    } catch (e) { /* ainda a levantar */ }
    await dormir(150);
  }
  throw new Error('Chrome não respondeu na porta ' + porta);
}

function ligar(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    let id = 0;
    const espera = new Map();
    const eventos = [];
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && espera.has(m.id)) {
        const { ok, ko } = espera.get(m.id);
        espera.delete(m.id);
        m.error ? ko(new Error(m.error.message)) : ok(m.result);
        return;
      }
      eventos.forEach(fn => fn(m));
    };
    ws.onerror = e => rej(new Error('WebSocket: ' + (e.message || 'erro')));
    ws.onopen = () => res({
      pedir(method, params) {
        return new Promise((ok, ko) => {
          const n = ++id;
          espera.set(n, { ok, ko });
          ws.send(JSON.stringify({ id: n, method, params: params || {} }));
        });
      },
      ao(fn) { eventos.push(fn); },
      fechar() { try { ws.close(); } catch (e) { /* já fechado */ } },
    });
  });
}

const MEDIR = `(async function(){
  var reg = await navigator.serviceWorker.getRegistration();
  var estado = { activo: !!(reg && reg.active), controlado: !!navigator.serviceWorker.controller,
                 scope: reg ? reg.scope : null };
  var nomes = await caches.keys();
  var casulos = [];
  for (var i = 0; i < nomes.length; i++) {
    var c = await caches.open(nomes[i]);
    var chaves = await c.keys();
    var bytes = 0, ficheiros = [];
    for (var j = 0; j < chaves.length; j++) {
      var r = await c.match(chaves[j]);
      if (!r) continue;
      var b = await r.blob();
      bytes += b.size;
      ficheiros.push(new URL(chaves[j].url).pathname.split('/').pop() + ':' + b.size);
    }
    casulos.push({ nome: nomes[i], entradas: chaves.length, bytes: bytes, ficheiros: ficheiros });
  }
  var links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  var css = links.find(function(l){ return /styles\.css/.test(l.href); });
  var versao = css ? (css.href.split('v=')[1] || '') : '';
  var manifesto = null;
  try {
    var m = await fetch('manifest.webmanifest');
    if (m.ok) {
      var d = await m.json();
      manifesto = { nome: d.name, curto: d.short_name, display: d.display,
                    inicio: d.start_url, icones: (d.icons || []).length,
                    partilha: !!(d.share_target), atalhos: (d.shortcuts || []).length };
    }
  } catch (e) { manifesto = { erro: String(e).slice(0, 80) }; }
  return JSON.stringify({ estado: estado, casulos: casulos, versao: versao,
                          titulo: document.title, manifesto: manifesto });
})()`;

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${os.tmpdir()}/vs-casulo-${PORTA}`,
    '--disable-gpu', '--no-first-run', '--window-size=1000,800', 'about:blank',
  ], { stdio: 'ignore' });
  global.__chrome = chrome;

  const t = await alvo(PORTA);
  const cliente = await ligar(t.webSocketDebuggerUrl);
  const p = (m, pr) => cliente.pedir(m, pr);
  await p('Page.enable');
  await p('Runtime.enable');
  const erros = [];
  cliente.ao(m => {
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') erros.push(m.params.entry.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push(JSON.stringify(m.params.args).slice(0, 160));
  });

  const avaliar = async expr => {
    const r = await p('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text);
    return r.result.value;
  };
  const carregar = async url => {
    const pronto = new Promise(res => {
      const fn = m => { if (m.method === 'Page.loadEventFired') res(); };
      cliente.ao(fn);
    });
    await p('Page.navigate', { url });
    await Promise.race([pronto, dormir(20000)]);
    await dormir(ESPERA);
  };

  await carregar(BASE + '?cb=casulo');
  /* a primeira visita instala o worker; a segunda é que já está controlada por ele */
  await carregar(BASE + '?cb=casulo2');

  const r = JSON.parse(await avaliar(MEDIR));
  const falhas = [];
  const tem = (oQue, cond, detalhe) => {
    console.log((cond ? '  ok   ' : '  FALHA ') + oQue + (detalhe === undefined ? '' : '  [' + detalhe + ']'));
    if (!cond) falhas.push(oQue);
  };

  console.log(`casulo · ${BASE}`);
  tem('o service worker está activo', r.estado.activo, r.estado.scope);
  tem('e a página é controlada por ele', r.estado.controlado);
  tem('o scope é o da pasta publicada', /\/$/.test(String(r.estado.scope || '')), r.estado.scope);
  tem('a versão do CSS bate com a do worker', /^vs[0-9]+$/.test(r.versao), r.versao);

  const esperada = 'casulo-' + r.versao;
  const casulo = r.casulos.find(c => c.nome === esperada);
  tem(`existe o cache ${esperada}`, !!casulo, r.casulos.map(c => c.nome + ' (' + c.entradas + ' entradas, ' + c.bytes + ' B)').join(' · '));
  if (casulo) {
    tem('tem as páginas e os assets do site', casulo.entradas >= 12, casulo.entradas + ' entradas / ' + casulo.bytes.toLocaleString('pt-PT') + ' B');
    console.log('       ' + casulo.ficheiros.join(' '));
  }
  const velhos = r.casulos.filter(c => c !== casulo && /^casulo-/.test(c.nome));
  tem('não há casulo de versão anterior', velhos.length === 0, velhos.map(v => v.nome).join(', ') || 'só o de agora');

  tem('o manifest diz o nome certo', r.manifesto && /Agatha Viva Surdo/.test(String(r.manifesto.nome)), r.manifesto && r.manifesto.nome);
  tem('abre como aplicação', r.manifesto && r.manifesto.display === 'standalone', r.manifesto && r.manifesto.display);
  tem('tem ícones para o ecrã principal', r.manifesto && r.manifesto.icones >= 3, r.manifesto && r.manifesto.icones + ' ícones');
  tem('e aceita partilha de texto', !!(r.manifesto && r.manifesto.partilha), r.manifesto && r.manifesto.atalhos + ' atalhos');
  tem('o título da página é o da marca', /Agatha Viva Surdo/.test(r.titulo), r.titulo);

  const errosReais = erros.filter(x => !/favicon|speech|Permission|net::ERR_FILE_NOT_FOUND.*manifest/i.test(x));
  tem('sem erros de consola', errosReais.length === 0, errosReais.length + ' erros');
  errosReais.slice(0, 4).forEach(x => console.log('  consola: ' + x));

  console.log(`\nfalhas: ${falhas.length}`);
  try { cliente.fechar(); } catch (e) { /* já fechado */ }
  try { chrome.kill(); } catch (e) { /* já morto */ }
  process.exit(falhas.length ? 1 : 0);
})().catch(e => {
  console.error('sonda falhou: ' + e.message);
  const c = global.__chrome;
  if (c && c.pid) { try { spawn('taskkill', ['/pid', String(c.pid), '/T', '/f'], { stdio: 'ignore' }); } catch (err) { /* ignora */ } }
  process.exit(1);
});
