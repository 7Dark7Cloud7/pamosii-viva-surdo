/* Sonda do filme com legendas (#/ouvir) — CDP, sem dependências.
   O que a página promete: escolher o filme e a legenda no mesmo gesto e o site
   emparelha-os pelo nome; ler a estrutura do MP4/MOV para dizer se há faixas de
   legendas dentro do ficheiro; e usar a faixa que o browser expuser. O que a
   página NÃO promete — ler legendas queimadas na imagem — tem de continuar dito
   como «não há». Nada disto se prova com uma captura de ecrã: aqui os ficheiros
   são construídos no browser (caixas ISO-BMFF sintéticas), pelo que a sonda não
   depende de ffmpeg, de rede nem de nenhum vídeo real.
   Precisa do servidor local. Uso: node tools/sonda-filme.cjs --porta=5301 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const PORTA = Number(flag('porta', 5301));
const BASE = flag('base', 'http://127.0.0.1:8123/');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));

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
const dormir = ms => new Promise(r => setTimeout(r, ms));
async function alvo(porta) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/json/new?about:blank`, { method: 'PUT' });
      if (r.ok) return await r.json();
    } catch (e) { /* ainda a arrancar */ }
    await dormir(150);
  }
  throw new Error('O Chrome não abriu a porta ' + porta);
}

const casos = [];
const tem = (nome, ok, detalhe) => casos.push({ nome, ok: !!ok, detalhe });

/* constrói um MP4 sintético com duas pistas: imagem (avc1) e legendas (tx3g) */
const CAIXAS = `
function caixa(tipo, corpo) {
  var b = new Uint8Array(8 + corpo.length);
  new DataView(b.buffer).setUint32(0, b.length);
  for (var i = 0; i < 4; i++) b[4 + i] = tipo.charCodeAt(i);
  b.set(corpo, 8);
  return b;
}
function junto() {
  var total = 0;
  for (var i = 0; i < arguments.length; i++) total += arguments[i].length;
  var b = new Uint8Array(total), p = 0;
  for (var j = 0; j < arguments.length; j++) { b.set(arguments[j], p); p += arguments[j].length; }
  return b;
}
function hdlr(tipo) {
  var c = new Uint8Array(24);
  c.set([0, 0, 0, 0, 0, 0, 0, 0], 0);
  for (var i = 0; i < 4; i++) c[8 + i] = tipo.charCodeAt(i);
  return caixa('hdlr', c);
}
function stsd(formato) {
  var cab = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]);
  var entrada = caixa(formato, new Uint8Array(8));
  return caixa('stsd', junto(cab, entrada));
}
function u32(v) {
  var b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, v);
  return b;
}
function mdhd(escala) {
  var c = new Uint8Array(20), d = new DataView(c.buffer);
  d.setUint32(12, escala);
  d.setUint32(16, 2000 * 2);
  return caixa('mdhd', c);
}
function amostra(txt) {
  var t = new TextEncoder().encode(txt);
  var b = new Uint8Array(2 + t.length);
  b[0] = t.length >> 8; b[1] = t.length & 255;
  b.set(t, 2);
  return b;
}
function trak(h, formato, amostras, deslocamento) {
  var partes = [stsd(formato)];
  if (amostras) {
    var tam = junto.apply(null, amostras.map(function(a) { return u32(a.length); }));
    partes.push(caixa('stts', junto(new Uint8Array(4), u32(1), u32(amostras.length), u32(2000))));
    partes.push(caixa('stsz', junto(new Uint8Array(4), u32(0), u32(amostras.length), tam)));
    partes.push(caixa('stsc', junto(new Uint8Array(4), u32(1), u32(1), u32(amostras.length), u32(1))));
    partes.push(caixa('stco', junto(new Uint8Array(4), u32(1), u32(deslocamento))));
  }
  var stbl = caixa('stbl', junto.apply(null, partes));
  var minf = caixa('minf', stbl);
  var mdia = caixa('mdia', junto(hdlr(h), mdhd(1000), minf));
  return caixa('trak', mdia);
}
function mp4Sintetico(comLegendas, comFalas) {
  var ftyp = caixa('ftyp', new TextEncoder().encode('isomiso2'));
  var amostras = comLegendas && comFalas
    ? [amostra('Bom dia!'), amostra('Onde fica a escola?')] : null;
  var montar = function(off) {
    var pistas = [trak('vide', 'avc1', null, 0)];
    if (comLegendas) pistas.push(trak('sbtl', 'tx3g', amostras, off));
    return junto(ftyp, caixa('moov', junto.apply(null, pistas)));
  };
  var corpo = montar(0);
  if (amostras) {
    var dados = junto.apply(null, amostras);
    corpo = junto(montar(corpo.length + 8), caixa('mdat', dados));
  }
  return new File([corpo], comLegendas ? 'Filme.2019.1080p.mp4' : 'SemLegendas.mp4', { type: 'video/mp4' });
}
`;

const SRT = '1\n00:00:01,000 --> 00:00:02,500\nBom dia!\n\n'
  + '2\n00:00:03,000 --> 00:00:04,200\n<i>Onde fica</i> a escola?\n\n'
  + '3\n00:00:05,000 --> 00:00:06,000\n{\\an8}Eu quero água.\n';

(async () => {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pamosii-filme-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + PORTA, '--user-data-dir=' + perfil,
    '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ], { stdio: 'ignore' });

  const erros = [];
  let cliente;
  try {
    const t = await alvo(PORTA);
    cliente = await ligar(t.webSocketDebuggerUrl);
    const p = cliente.pedir;
    cliente.ao(m => {
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
        erros.push(m.params.type + ': ' + (m.params.args || []).map(a => a.value || a.description || '').join(' ').slice(0, 160));
      }
      if (m.method === 'Runtime.exceptionThrown') {
        erros.push('excepção: ' + ((m.params.exceptionDetails || {}).exception || {}).description);
      }
    });
    await p('Page.enable');
    await p('Runtime.enable');
    await p('Emulation.setDeviceMetricsOverride', { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false });

    const avaliar = async expr => {
      const r = await p('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + ((r.exceptionDetails.exception || {}).description || ''));
      return r.result.value;
    };
    const carregar = async url => {
      const pronto = new Promise(res => cliente.ao(m => { if (m.method === 'Page.loadEventFired') res(); }));
      await p('Page.navigate', { url });
      await Promise.race([pronto, dormir(30000)]);
      for (let i = 0; i < 60; i++) {
        let montado = false;
        try {
          montado = await avaliar(`document.readyState === 'complete' && !!document.querySelector('#app') && document.querySelector('#app').children.length > 0`);
        } catch (e) { /* contexto a trocar durante a navegação */ }
        if (montado) break;
        await dormir(250);
      }
      await dormir(400);
    };

    await carregar(BASE + '?cb=filme#/ouvir');
    await avaliar(`document.querySelector('[data-modo="leg"]').click()`);

    /* --- as três formas de escolher existem e dizem o que fazem --- */
    tem('a página abre no painel do vídeo', await avaliar(`!document.querySelector('#ov-p-leg').hidden`));
    tem('há um botão para escolher filme e legendas no mesmo gesto',
      await avaliar(`!!document.querySelector('#ov-ficheiros[multiple]')`));
    tem('há um botão para escolher a pasta do filme',
      await avaliar(`document.querySelector('#ov-pasta').hasAttribute('webkitdirectory')`));
    tem('escolher à mão continua disponível, dentro de «Escolher os ficheiros à mão»',
      await avaliar(`!!document.querySelector('.ov-manual #ov-video') && !!document.querySelector('.ov-manual #ov-legenda')`));
    tem('o estado começa vazio e sem faixas inventadas',
      await avaliar(`document.querySelector('#ov-pistas').hidden && document.querySelector('#ov-faixa-linha').hidden`));

    /* --- emparelhar pelo nome --- */
    const pares = JSON.parse(await avaliar(`JSON.stringify({
      igual: ovBaseNome('Filme.2019.1080p.mp4') === ovBaseNome('Filme.2019.pt-PT.srt'),
      base: ovBaseNome('Filme.2019.1080p.mp4'),
      pt: ovIdiomaLegenda('Filme.2019.pt-PT.srt'),
      en: ovIdiomaLegenda('Filme.2019.en.srt'),
      best: (function(){var v={name:'Filme.2019.1080p.mp4'};
        return ovMelhorLegenda([{name:'Filme.2019.en.srt'},{name:'Filme.2019.pt-PT.srt'},{name:'outro.srt'}], v).name;})()
    })`));
    tem('o nome do vídeo e o da legenda ficam iguais depois de tirar idioma e qualidade',
      pares.igual && pares.base === 'filme 2019', pares.base);
    tem('o idioma é reconhecido no nome do ficheiro', pares.pt === 'pt' && pares.en === 'en', pares.pt + '/' + pares.en);
    tem('entre várias legendas escolhe a portuguesa', pares.best === 'Filme.2019.pt-PT.srt', pares.best);

    /* --- ler .srt e .vtt --- */
    const cues = JSON.parse(await avaliar(`(function(){
      var s = ovParseLegendas(${JSON.stringify(SRT)});
      var v = ovParseLegendas('WEBVTT\\n\\n00:01.000 --> 00:02.000\\nOi\\n');
      return JSON.stringify({n:s.length, textos:s.map(function(c){return c.texto;}), ini:s.map(function(c){return c.ini;}),
        vtt:v.length, vttT:v.length?v[0].texto:''});
    })()`));
    tem('o .srt é lido com as horas e o texto limpo de tags', cues.n === 3
      && cues.textos[1] === 'Onde fica a escola?' && cues.textos[2] === 'Eu quero água.'
      && cues.ini[0] === 1 && cues.ini[2] === 5, cues.textos.join(' | '));
    tem('o .vtt também é lido', cues.vtt === 1 && cues.vttT === 'Oi', cues.vtt + ' ' + cues.vttT);

    /* --- a estrutura do MP4 --- */
    const detectado = JSON.parse(await avaliar(`${CAIXAS}
      (async function(){
        var com = await ovPistasContentor(mp4Sintetico(true));
        var sem = await ovPistasContentor(mp4Sintetico(false));
        return JSON.stringify({com:com, sem:sem});
      })()`));
    const leg = detectado.com.pistas.filter(x => x.legenda);
    tem('o leitor de MP4 encontra a faixa de legendas embutida',
      leg.length === 1 && leg[0].codec === '3GPP', JSON.stringify(detectado.com.pistas));
    tem('o leitor de MP4 não inventa legendas quando não há',
      detectado.sem.pistas.filter(x => x.legenda).length === 0, JSON.stringify(detectado.sem.pistas));

    /* --- escolher filme + legendas juntos, pela interface --- */
    const escolhidos = await avaliar(`${CAIXAS}
      (function(){
        var dt = new DataTransfer();
        dt.items.add(mp4Sintetico(true));
        dt.items.add(new File([${JSON.stringify(SRT)}], 'Filme.2019.pt-PT.srt', {type:'text/plain'}));
        dt.items.add(new File([${JSON.stringify(SRT)}], 'Filme.2019.en.srt', {type:'text/plain'}));
        var inp = document.querySelector('#ov-ficheiros');
        inp.files = dt.files;
        var n = dt.files.length;   /* o handler limpa o input no fim */
        inp.dispatchEvent(new Event('change', {bubbles:true}));
        return n;
      })()`);
    await dormir(600);
    const depois = JSON.parse(await avaliar(`JSON.stringify({
      fonte: document.querySelector('#ov-fonte').textContent,
      nomeV: document.querySelector('#ov-video-nome').textContent,
      nomeL: document.querySelector('#ov-legenda-nome').textContent,
      cues: ovEstado.cues.length,
      lista: document.querySelectorAll('#ov-cues .ov-cue').length,
      agora: document.querySelector('#ov-agora-x').textContent,
      player: !document.querySelector('#ov-player').hidden,
      pistas: document.querySelector('#ov-pistas').hidden
    })`));
    tem('o lote com três ficheiros foi aceite', escolhidos === 3, String(escolhidos));
    tem('o filme escolhido aparece com o nome', /Filme\.2019\.1080p\.mp4/.test(depois.nomeV), depois.nomeV);
    tem('a legenda portuguesa foi emparelhada sozinha', /Filme\.2019\.pt-PT\.srt/.test(depois.nomeL) && /3 falas/.test(depois.nomeL), depois.nomeL);
    tem('as falas da legenda entraram na lista', depois.cues === 3 && depois.lista === 3,
      depois.cues + ' falas, ' + depois.lista + ' na lista');
    tem('a primeira fala aparece no painel do que está a tocar', depois.agora === 'Bom dia!', depois.agora);
    tem('a página diz o que emparelhou', /emparelhada/.test(depois.fonte) && /pt-PT/.test(depois.fonte), depois.fonte);
    tem('quando há .srt escolhido não se procura (nem se anuncia) faixa embutida', depois.pistas, 'pistas visíveis');

    /* --- um filme sozinho: detectar dentro do ficheiro e limpar a legenda antiga --- */
    await avaliar(`${CAIXAS}
      (function(){
        var dt = new DataTransfer();
        dt.items.add(mp4Sintetico(true));
        var inp = document.querySelector('#ov-ficheiros');
        inp.files = dt.files;
        inp.dispatchEvent(new Event('change', {bubbles:true}));
      })()`);
    await dormir(700);
    const sozinho = JSON.parse(await avaliar(`JSON.stringify({
      nomeL: document.querySelector('#ov-legenda-nome').textContent,
      cues: ovEstado.cues.length,
      pistas: document.querySelector('#ov-pistas').hidden ? '' : document.querySelector('#ov-pistas').textContent,
      aviso: document.querySelector('#ov-pistas').classList.contains('is-aviso'),
      faixa: document.querySelector('#ov-faixa-linha').hidden
    })`));
    tem('um filme novo sem legenda limpa a legenda do filme anterior',
      sozinho.cues === 0 && /Nenhuma legenda/.test(sozinho.nomeL), sozinho.nomeL);
    tem('o site anuncia a faixa de legendas que encontrou dentro do MP4',
      /1 faixa de legendas/.test(sozinho.pistas) && /3GPP/.test(sozinho.pistas), sozinho.pistas);
    tem('e deixa claro que é o browser que decide se a consegue abrir',
      /browser/.test(sozinho.pistas), sozinho.pistas);

    /* --- o filme traz as falas dentro: lê-las sem .srt --- */
    await avaliar(`${CAIXAS}
      (function(){
        var dt = new DataTransfer();
        dt.items.add(mp4Sintetico(true, true));
        var inp = document.querySelector('#ov-ficheiros');
        inp.files = dt.files;
        inp.dispatchEvent(new Event('change', {bubbles:true}));
      })()`);
    await dormir(900);
    const lido = JSON.parse(await avaliar(`JSON.stringify({
      nomeL: document.querySelector('#ov-legenda-nome').textContent,
      cues: ovEstado.cues.map(function(c){return [c.ini, c.fim, c.texto];}),
      lista: document.querySelectorAll('#ov-cues .ov-cue').length,
      pistas: document.querySelector('#ov-pistas').textContent,
      aviso: document.querySelector('#ov-pistas').classList.contains('is-aviso'),
      fonte: document.querySelector('#ov-fonte').textContent,
      faixa: document.querySelector('#ov-faixa-linha').hidden
    })`));
    tem('as falas são lidas de dentro do MP4, sem ficheiro .srt',
      lido.cues.length === 2 && lido.cues[0][2] === 'Bom dia!' && lido.cues[1][2] === 'Onde fica a escola?',
      JSON.stringify(lido.cues));
    tem('e entram logo na lista, com horas',
      lido.lista === 2 && lido.cues[1][0] === 2,
      lido.lista + ' na lista, segunda fala em ' + (lido.cues[1] || [])[0]);
    tem('a página diz que leu de dentro do filme',
      /Li 2 falas de dentro do filme/.test(lido.pistas) && !lido.aviso, lido.pistas);
    tem('a legenda aparece com o nome «Dentro do filme» e o aviso não pede .srt',
      /Dentro do filme/.test(lido.nomeL) && /\.mp4/.test(lido.nomeL) && /Legendas lidas de dentro/.test(lido.fonte),
      lido.nomeL + ' | ' + lido.fonte);
    tem('a faixa do browser fica escondida quando as falas já estão lidas', lido.faixa, 'select visível');

    /* --- um filme sem faixa --- */
    await avaliar(`${CAIXAS}
      (function(){
        var dt = new DataTransfer();
        dt.items.add(mp4Sintetico(false));
        var inp = document.querySelector('#ov-ficheiros');
        inp.files = dt.files;
        inp.dispatchEvent(new Event('change', {bubbles:true}));
      })()`);
    await dormir(700);
    tem('um MP4 sem faixas de legenda diz isso e pede o .srt/.vtt',
      await avaliar(`/não traz faixas de legendas/.test(document.querySelector('#ov-pistas').textContent)`),
      await avaliar(`document.querySelector('#ov-pistas').textContent`));

    /* --- MKV: não é reproduzível, e a página não finge que é --- */
    await avaliar(`(function(){
      var dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(64)], 'filme.mkv', {type:'video/x-matroska'}));
      var inp = document.querySelector('#ov-ficheiros');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', {bubbles:true}));
    })()`);
    await dormir(500);
    tem('um MKV avisa que o Chrome não o reproduz',
      await avaliar(`/Chrome não reproduz MKV/.test(document.querySelector('#ov-pistas').textContent)`),
      await avaliar(`document.querySelector('#ov-pistas').textContent`));

    /* --- legenda queimada: continua a ser dita como ausente --- */
    tem('a página diz que legendas queimadas na imagem não são lidas',
      await avaliar(`/Legendas queimadas na imagem/.test(document.body.textContent)`));
    tem('e explica porquê (OCR, sem adivinhar)',
      await avaliar(`/reconhecimento óptico de caracteres/.test(document.body.textContent)`));

    /* --- nenhum erro de consola durante tudo isto --- */
    tem('a sonda não deixou erros de consola', erros.length === 0, erros.slice(0, 3).join(' | '));
  } catch (e) {
    casos.push({ nome: 'a sonda correu até ao fim', ok: false, detalhe: e.message });
  } finally {
    const maus = casos.filter(c => !c.ok);
    casos.forEach(c => console.log((c.ok ? '  ok  ' : ' FALHA') + '  ' + c.nome
      + (c.detalhe ? '  [' + String(c.detalhe).replace(/\s+/g, ' ').slice(0, 220) + ']' : '')));
    console.log('\n' + (casos.length - maus.length) + '/' + casos.length + ' casos ok');
    if (cliente) cliente.fechar();
    chrome.kill();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* perfil preso */ }
    process.exit(maus.length ? 1 : 0);
  }
})();
