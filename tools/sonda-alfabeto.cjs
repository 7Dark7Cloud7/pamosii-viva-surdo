/* Sonda funcional da folha A–Z de datilologia (#/alfabeto) — CDP, sem dependências.
   A página promete três coisas: que as 26 letras estão na folha com o estado que o
   dicionário lhes dá, que o site não desenha formas de mão, e que ao imprimir sai
   apenas a folha, numa página de A4. Nada disso se prova a olhar para o CSS — aqui é
   tudo medido no DOM, no ecrã e com a media «print» emulada numa folha A4 (182×269 mm
   úteis a 96 dpi = 688×1017 px, já descontadas as margens de 14 mm do @page).
   Precisa do servidor local a correr. Uso: node tools/sonda-alfabeto.cjs --porta=5293
   (porta de 4 dígitos nova a cada execução). Sai 0 com tudo ok, 1 com falha ou erro de consola. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const PORTA = Number(flag('porta', 4813));
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

/* O que tem de desaparecer no papel, medido primeiro no ecrã: só se exige que saia do
   papel aquilo que efectivamente se via no ecrã. */
const SELECTORES = ['.page-head', '.site-head', '.site-foot', '.tabbar', '.sg-fab', '.note-band',
  '#alf-aula-sec', '#alf-grade', '.alf-ac', '#alf-treino', '#alf-folha'];

(async () => {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pamosii-alf-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + PORTA, '--user-data-dir=' + perfil,
    '--no-first-run', '--no-default-browser-check', 'about:blank',
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
      /* o host pode demorar mais do que o load event: fontes e miniaturas do
         YouTube seguram a rede e, no primeiro carregamento, o service worker
         ainda está a instalar. Só se mede depois de o router ter montado. */
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
    const ver = async sel => await avaliar(`(function(){var e=document.querySelector(${JSON.stringify(sel)});
      if(!e) return 'ausente'; var c=getComputedStyle(e);var r=e.getBoundingClientRect();
      return (c.display==='none'||r.width<1||r.height<1)?'escondido':'visivel';})()`);

    await carregar(BASE + '?cb=probe#/alfabeto');

    /* --- o que a folha é, no ecrã --- */
    tem('a página carrega com a folha A–Z', await avaliar(`!!document.querySelector('#alf-folha .alf-folha-grelha')`));
    const letras = await avaliar(`[...document.querySelectorAll('.alf-folha-letra')].map(e=>e.textContent.trim()).join('')`);
    tem('a folha tem as 26 letras, por ordem', letras === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', letras);
    const estados = await avaliar(`[...document.querySelectorAll('.alf-folha-est')].map(e=>e.textContent.trim())`);
    tem('cada letra traz um estado escrito', estados.length === 26 && estados.every(x => x && x !== 'undefined'),
      estados.filter(x => !x || x === 'undefined').length + ' vazias');
    const pautas = await avaliar(`document.querySelectorAll('.alf-folha-pauta i').length`);
    tem('cada letra tem linha pautada para anotar a forma', pautas === 52, pautas + ' linhas');
    tem('a folha não mostra imagens: não há formas de mão desenhadas',
      await avaliar(`document.querySelectorAll('#alf-folha img').length`) === 0);
    const textoFolha = await avaliar(`document.querySelector('#alf-folha').textContent`);
    tem('a folha diz que este site não desenha formas de mão', /não\s+desenha formas de mão/.test(textoFolha.replace(/\s+/g, ' ')));
    const dataOk = await avaliar(`document.querySelector('.alf-folha-nota').textContent.indexOf(fmtData(new Date().toISOString().slice(0,10))) >= 0`);
    tem('a folha diz em que dia o estado foi lido', dataOk, await avaliar(`document.querySelector('.alf-folha-nota').textContent.slice(0,70)`));

    /* a folha e a grelha têm de dizer o mesmo — é o mesmo dicionário */
    const contaFolha = await avaliar(`(function(){var m=document.querySelector('.alf-folha-nota').textContent
      .match(/(\\d+) de 26/);return m?+m[1]:-1;})()`);
    const contaReal = await avaliar(`alfDados().confirmadas`);
    tem('as letras confirmadas da folha são as do dicionário', contaFolha === contaReal,
      'folha ' + contaFolha + ' · dicionário ' + contaReal);
    const divergem = await avaliar(`(function(){
      var graus={};
      document.querySelectorAll('#alf-grade [data-alf-l]').forEach(function(b){
        var m=b.getAttribute('aria-label').match(/^Letra (\\w), ([^,]+)/);
        if(m) graus[m[1]]=m[2];});
      var maus=[];
      document.querySelectorAll('.alf-folha-l').forEach(function(li){
        var l=li.querySelector('.alf-folha-letra').textContent.trim();
        var e=li.querySelector('.alf-folha-est').textContent.trim();
        if(graus[l]!==e) maus.push(l+': folha «'+e+'» vs grelha «'+graus[l]+'»');});
      return maus;})()`);
    tem('o estado de cada letra na folha é o da grelha', divergem.length === 0, divergem.slice(0, 3).join(' | '));

    /* a fonte das formas: ou um link real para a aula, ou a honestidade de dizer que não há */
    const rodape = await avaliar(`(function(){var a=document.querySelector('.alf-folha-rod a.vlink');
      return (a?a.getAttribute('href'):'sem link')+' | '+document.querySelector('.alf-folha-rod').textContent.slice(0,60);})()`);
    const aula = await avaliar(`(function(){var a=alfAula();return a?a.id:'nenhuma';})()`);
    tem('a folha aponta para a aula real, ou diz que ainda não há aula',
      aula === 'nenhuma' ? /ainda não há aula/.test(rodape) : rodape.startsWith('https://www.youtube.com/watch?v=' + aula), rodape);

    /* --- o botão --- */
    tem('há um botão para imprimir a folha', await avaliar(`!!document.querySelector('[data-alf-print]')`));
    await avaliar(`window.__nPrint=0; window.print=function(){window.__nPrint++;}; 1`);
    await avaliar(`document.querySelector('[data-alf-print]').click()`);
    await dormir(120);
    tem('o botão chama a impressão do browser', await avaliar(`window.__nPrint`) === 1, 'window.print chamado ' + (await avaliar(`window.__nPrint`)) + ' vez(es)');
    tem('e anuncia o que está a acontecer', await avaliar(`(document.querySelector('#alf-live')||{}).textContent.length > 30`));

    /* --- o papel --- */
    const noEcra = {};
    for (const sel of SELECTORES) noEcra[sel] = await ver(sel);
    await p('Emulation.setEmulatedMedia', { media: 'print', features: [] });
    await p('Emulation.setDeviceMetricsOverride', { width: 688, height: 1017, deviceScaleFactor: 1, mobile: false });
    await dormir(250);
    const noPapel = {};
    for (const sel of SELECTORES) noPapel[sel] = await ver(sel);
    const ficaram = SELECTORES.filter(s => noEcra[s] === 'visivel' && noPapel[s] !== 'escondido' && s !== '#alf-folha');
    tem('no papel não sai cabeçalho, rodapé, barra, vídeo, grelha, treino nem botões',
      ficaram.length === 0, ficaram.map(s => s + '=' + noPapel[s]).join(', ')
        + ' | no ecrã: ' + SELECTORES.map(s => s + '=' + noEcra[s]).join(', '));
    tem('no papel a folha continua lá', noPapel['#alf-folha'] === 'visivel', noPapel['#alf-folha']);
    const letrasPapel = await avaliar(`document.querySelectorAll('.alf-folha-l').length`);
    tem('as 26 letras saem no papel', letrasPapel === 26, letrasPapel + ' letras');
    const medidas = await avaliar(`(function(){var r=document.querySelector('#alf-folha').getBoundingClientRect();
      return Math.round(r.width)+'x'+Math.round(r.height)+' px, página '+(1017-Math.round(r.height))+' px de folga, largura '+document.documentElement.clientWidth;})()`);
    const dim = await avaliar(`(function(){var r=document.querySelector('#alf-folha').getBoundingClientRect();
      return [r.width, r.height, document.documentElement.clientWidth];})()`);
    tem('a folha cabe numa página de A4', dim[0] <= dim[2] + 1 && dim[1] <= 1017, medidas);
    const corLetra = await avaliar(`getComputedStyle(document.querySelector('.alf-folha-letra')).color`);
    tem('no papel as letras saem a preto', /0, 0, 0/.test(corLetra), corLetra);
    await p('Emulation.setEmulatedMedia', { media: '', features: [] });
    await p('Emulation.setDeviceMetricsOverride', { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false });
    await dormir(200);
    tem('voltamos ao ecrã: a página toda reaparece', (await ver('.site-head')) === 'visivel' && (await ver('#alf-grade')) === 'visivel');

    /* --- quem imprime com texto a 150% --- */
    await avaliar(`localStorage.setItem('vs.a11y', JSON.stringify({escala:150,contraste:false,temaEscuro:false,movimento:false,simples:false}))`);
    await carregar(BASE + '?cb=probe150#/alfabeto');
    tem('a escala de 150% chega efectivamente ao conteúdo',
      await avaliar(`Number(getComputedStyle(document.querySelector('#app')).zoom)`) === 1.5);
    await p('Emulation.setEmulatedMedia', { media: 'print', features: [] });
    await p('Emulation.setDeviceMetricsOverride', { width: 688, height: 1017, deviceScaleFactor: 1, mobile: false });
    await dormir(250);
    const dim150 = await avaliar(`(function(){var r=document.querySelector('#alf-folha').getBoundingClientRect();
      return [r.width, document.documentElement.clientWidth, Number(getComputedStyle(document.querySelector('#app')).zoom)];})()`);
    tem('com 150% de texto a folha continua a caber na largura do papel', dim150[0] <= dim150[1] + 1 && dim150[2] === 1,
      Math.round(dim150[0]) + '/' + dim150[1] + ' px, zoom ' + dim150[2]);
    await p('Emulation.setEmulatedMedia', { media: '', features: [] });
    await avaliar(`localStorage.removeItem('vs.a11y')`);
    tem('e o aparelho volta a ficar como estava', (await avaliar(`Object.keys(localStorage).length`)) === 0);
  } catch (e) {
    casos.push({ nome: 'a sonda correu até ao fim', ok: false, detalhe: e.message });
  } finally {
    const maus = casos.filter(c => !c.ok);
    for (const c of casos) console.log((c.ok ? '  ok   ' : '  FALHA ') + c.nome + (c.detalhe ? '  [' + String(c.detalhe).slice(0, 140) + ']' : ''));
    const errosReais = erros.filter(x => !/favicon|net::ERR_FILE_NOT_FOUND.*manifest|SpeechSynthesis|speech/i.test(x));
    console.log('casos: ' + casos.length + ' · falhas: ' + maus.length + ' · erros de consola: ' + errosReais.length);
    errosReais.slice(0, 6).forEach(x => console.log('  consola: ' + x));
    try { cliente && cliente.fechar(); } catch (e) { /* já fechado */ }
    try { chrome.kill(); } catch (e) { /* já morto */ }
    process.exit(maus.length || errosReais.length ? 1 : 0);
  }
})();
