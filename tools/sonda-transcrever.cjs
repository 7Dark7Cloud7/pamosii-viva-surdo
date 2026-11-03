/* Sonda funcional da folha de transcrição (#/transcrever) — CDP, sem dependências.
   A folha promete quatro coisas: que cada fala final fica com a hora aproximada,
   que o texto corrido acompanha e pode ser corrigido, que os ficheiros .txt/.srt
   saem com o conteúdo certo, e que «Levar aos sinais» entrega o texto ao #/ouvir
   sem deixar nada guardado. Não é preciso microfone: injeta-se o resultado que o
   ditado devolveria e mede-se o DOM e os ficheiros.
   Precisa do servidor local a correr. Uso: node tools/sonda-transcrever.cjs --porta=4851
   Sai 0 com tudo ok, 1 com falha ou erro de consola. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const PORTA = Number(flag('porta', 4851));
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

(async () => {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pamosii-tr-'));
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
      for (let i = 0; i < 60; i++) {
        let montado = false;
        try {
          montado = await avaliar(`document.readyState === 'complete' && !!document.querySelector('#app') && document.querySelector('#app').children.length > 0`);
        } catch (e) { /* contexto a trocar durante a navegação */ }
        if (montado) break;
        await dormir(250);
      }
      await dormir(350);
    };
    const ver = async sel => await avaliar(`(function(){var e=document.querySelector(${JSON.stringify(sel)});
      if(!e) return 'ausente'; var c=getComputedStyle(e);var r=e.getBoundingClientRect();
      return (c.display==='none'||r.width<1||r.height<1)?'escondido':'visivel';})()`);

    await carregar(BASE + '?cb=tr#/transcrever');

    /* --- a folha existe e é honesta sobre o que faz --- */
    tem('a página carrega com o microfone e a folha', await avaliar(`!!document.querySelector('#tr-mic') && !!document.querySelector('#tr-texto') && !!document.querySelector('#tr-segs')`));
    tem('a folha abre vazia, com o estado vazio à vista', await ver('#tr-vazio') === 'visivel' && (await avaliar(`document.querySelectorAll('#tr-segs li').length`)) === 0);
    const textoPagina = await avaliar(`document.querySelector('#app').innerText`);
    tem('diz que não é tradução para LGA', /não é tradução|Não é tradução/i.test(textoPagina) && /LGA/i.test(textoPagina));
    tem('diz os três limites (ficheiro, LGA→texto e tradução)', /ficheiro de áudio/i.test(textoPagina) && /Gestual Angolana\s*→\s*texto/i.test(textoPagina.replace(/\s+/g, ' ')) && /tradução automática/i.test(textoPagina));
    tem('traz a nota de privacidade do ditado do browser', /serviço de ditado do/i.test(textoPagina) && /não grava som/i.test(textoPagina));

    /* --- o ditado devolve duas falas: horas, texto e contagem --- */
    await avaliar(`(function(){
      trEstado.segundos = 3;
      trEstado.segs.push({ ini: 0, fim: 3.4, texto: 'Bom dia, turma.' });
      trJuntar('Bom dia, turma.');
      trEstado.segundos = 7;
      trEstado.segs.push({ ini: 3.4, fim: 7.2, texto: 'Hoje vamos aprender o alfabeto.' });
      trJuntar('Hoje vamos aprender o alfabeto.');
      trPintar();
      return true;
    })()`);
    tem('cada fala aparece na lista com a sua hora', await avaliar(`[...document.querySelectorAll('#tr-segs time')].map(t=>t.textContent).join('|')`) === '0:00|0:03',
      await avaliar(`[...document.querySelectorAll('#tr-segs time')].map(t=>t.textContent).join('|')`));
    tem('o texto corrido recebe as duas frases', await avaliar(`document.querySelector('#tr-texto').value`) === 'Bom dia, turma. Hoje vamos aprender o alfabeto.',
      await avaliar(`document.querySelector('#tr-texto').value`));
    tem('a contagem diz duas falas e as palavras', await avaliar(`document.querySelector('#tr-count').textContent`) === '2 falas · 8 palavras',
      await avaliar(`document.querySelector('#tr-count').textContent`));
    tem('o estado vazio desaparece quando há falas', await ver('#tr-vazio') === 'escondido');

    /* --- exportar: sem tocar no disco, captura-se o que seria escrito --- */
    await avaliar(`window.__dl = []; descarregarFicheiro = function (n, c, t) { window.__dl.push({ n: n, c: c, t: t }); }; trBaixarTxt(); trBaixarSrt(); true`);
    const dl = await avaliar(`window.__dl`);
    tem('saem dois ficheiros: .txt e .srt', dl.length === 2 && /\.txt$/.test(dl[0].n) && /\.srt$/.test(dl[1].n), JSON.stringify(dl.map(d => d.n)));
    const txt = dl[0] ? dl[0].c : '';
    const srt = dl[1] ? dl[1].c : '';
    tem('o .txt leva o texto e a lista de falas com hora', txt.includes('Hoje vamos aprender o alfabeto.') && txt.includes('FALAS COM HORA') && txt.includes('[0:03 → 0:07]'));
    tem('o .srt leva números, horas de ficheiro e as duas falas',
      srt.startsWith('1\n00:00:00,000 --> 00:00:03,400\nBom dia, turma.') && srt.includes('2\n00:00:03,400 --> 00:00:07,200\nHoje vamos aprender o alfabeto.'),
      srt.replace(/\n/g, '\\n').slice(0, 130));

    /* --- apagar uma fala corrige também o texto corrido --- */
    await avaliar(`document.querySelector('#tr-segs .tr-del').click(); true`);
    tem('apagar a primeira fala deixa só a segunda', await avaliar(`document.querySelectorAll('#tr-segs li').length`) === 1);
    tem('e o texto corrido perde a frase apagada', !(await avaliar(`document.querySelector('#tr-texto').value`)).includes('Bom dia, turma.'),
      await avaliar(`document.querySelector('#tr-texto').value`));

    /* --- «Levar aos sinais» entrega o texto ao #/ouvir e não deixa rasto --- */
    await avaliar(`window.confirm = function(){ return true; }; document.querySelector('#tr-clear').click(); true`);
    tem('limpar esvazia a folha', await avaliar(`document.querySelectorAll('#tr-segs li').length`) === 0 && await ver('#tr-vazio') === 'visivel');
    await avaliar(`(function(){ trEstado.segundos = 4; trEstado.segs.push({ ini: 0, fim: 4, texto: 'A escola fica ali.' }); trJuntar('A escola fica ali.'); trPintar(); return true; })()`);
    await avaliar(`document.querySelector('#tr-sinais').click(); true`);
    for (let i = 0; i < 40; i++) {
      const pronto = await avaliar(`location.hash === '#/ouvir' && !!document.querySelector('#ov-texto')`);
      if (pronto) break;
      await dormir(200);
    }
    tem('«Levar aos sinais» abre o #/ouvir', await avaliar(`location.hash`) === '#/ouvir', await avaliar(`location.hash`));
    tem('o texto chega ao campo do #/ouvir', await avaliar(`document.querySelector('#ov-texto') && document.querySelector('#ov-texto').value`) === 'A escola fica ali.',
      await avaliar(`document.querySelector('#ov-texto') && document.querySelector('#ov-texto').value`));
    tem('a glosa já está desenhada para o texto chegado', (await avaliar(`document.querySelectorAll('#ov-out .pm-sign, #ov-out .pm-card, #ov-out [data-sinal], #ov-out svg').length`)) > 0,
      await avaliar(`document.querySelector('#ov-out') && document.querySelector('#ov-out').textContent.slice(0, 80)`));
    tem('a chave de sessão foi apagada', await avaliar(`sessionStorage.getItem('agatha.transcrever')`) === null);
    tem('a transcrição não fica na memória ao sair da rota', await avaliar(`trEstado.segs.length === 0 && trEstado.texto === ''`));

    /* --- voltar à folha: começa limpa --- */
    await carregar(BASE + '?cb=tr2#/transcrever');
    tem('ao voltar, a folha está outra vez vazia', (await avaliar(`document.querySelectorAll('#tr-segs li').length`)) === 0 && await ver('#tr-vazio') === 'visivel');

    /* --- telemóvel pequeno: sem scroll lateral --- */
    await p('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: false });
    await dormir(300);
    const larg = await avaliar(`(function(){var d=document.documentElement; return [d.scrollWidth, d.clientWidth];})()`);
    tem('a 320 px a folha não ganha scroll lateral', larg[0] <= larg[1] + 1, larg.join('/'));

    /* --- o atalho flutuante do Signer não pode tapar o botão do microfone --- */
    tem('o atalho do Signer fica fora desta rota', await ver('#sg-fab') === 'escondido', await ver('#sg-fab'));
    await carregar(BASE + '?cb=tr3#/');
    tem('e volta a aparecer nas outras páginas', await ver('#sg-fab') === 'visivel', await ver('#sg-fab'));
  } catch (e) {
    casos.push({ nome: 'a sonda correu até ao fim', ok: false, detalhe: e.message });
  } finally {
    const maus = casos.filter(c => !c.ok);
    for (const c of casos) console.log((c.ok ? '  ok   ' : '  FALHA ') + c.nome + (c.detalhe ? '  [' + String(c.detalhe).slice(0, 150) + ']' : ''));
    const errosReais = erros.filter(x => !/favicon|manifest|SpeechSynthesis|speech/i.test(x));
    console.log('casos: ' + casos.length + ' · falhas: ' + maus.length + ' · erros de consola: ' + errosReais.length);
    errosReais.slice(0, 6).forEach(x => console.log('  consola: ' + x));
    try { cliente && cliente.fechar(); } catch (e) { /* já fechado */ }
    try { chrome.kill(); } catch (e) { /* já morto */ }
    process.exit(maus.length || errosReais.length ? 1 : 0);
  }
})();
