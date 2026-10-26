/* Sonda funcional da folha de colheita (#/cobertura) — CDP, sem dependências.
   A folha promete três coisas: que as palavras e os estados são os do dicionário
   (não uma lista escrita à mão), que diz com honestidade quantas palavras ficaram
   de fora, e que ao imprimir sai só a folha, numa página de A4. Nada disso se
   prova a olhar para o CSS — aqui é tudo medido no DOM, no ecrã e com a media
   «print» emulada numa folha A4 (182×269 mm úteis a 96 dpi = 688×1017 px, já
   descontadas as margens de 14 mm do @page).
   Precisa do servidor local a correr. Uso: node tools/sonda-cobertura.cjs --porta=5294
   (porta de 4 dígitos nova a cada execução). Sai 0 com tudo ok, 1 com falha ou erro de consola. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const PORTA = Number(flag('porta', 4814));
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
  '#cov-folha-tema', '#cov-live', '.cov-tab-temas', '#cov-folha'];

(async () => {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pamosii-cov-'));
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
      await Promise.race([pronto, dormir(15000)]);
      await dormir(400);
    };
    const ver = async sel => await avaliar(`(function(){var e=document.querySelector(${JSON.stringify(sel)});
      if(!e) return 'ausente'; var c=getComputedStyle(e);var r=e.getBoundingClientRect();
      return (c.display==='none'||r.width<1||r.height<1)?'escondido':'visivel';})()`);

    await carregar(BASE + '?cb=probe#/cobertura');

    /* --- a folha existe e diz de que tema fala --- */
    tem('a página carrega com a folha de colheita', await avaliar(`!!document.querySelector('#cov-folha .cov-folha-tab')`));
    const tema = await avaliar(`document.querySelector('#cov-folha-tema').value`);
    const h2 = await avaliar(`document.querySelector('#cov-folha h2').textContent.trim()`);
    tem('a folha nomeia o tema que está a imprimir', !!tema && h2.indexOf(tema) >= 0, h2);

    /* --- as palavras e os estados são os do dicionário, não uma lista à mão --- */
    const esperado = await avaliar(`(function(){var f=covFolhaTema(covDados(), ${JSON.stringify(tema)});
      return JSON.stringify({mostra:f.mostra,sem:f.semSinal.length,total:f.palavras.length,fora:f.fora});})()`);
    const esp = JSON.parse(esperado);
    const linhas = await avaliar(`[...document.querySelectorAll('.cov-folha-tab tbody tr')].map(function(tr){
      return {p:tr.querySelector('th').textContent.trim(), e:tr.querySelector('.cov-folha-est').textContent.trim()};})`);
    const conferidas = JSON.parse(await avaliar(`(function(){var f=covFolhaTema(covDados(),
      document.querySelector('#cov-folha-tema').value);
      var maus=0;
      [...document.querySelectorAll('.cov-folha-tab tbody tr')].forEach(function(tr,i){
        var x=f.mostra[i]; if(!x){maus++;return;}
        var rot=(ESTADO_GLOSSARIO[x.estado]||{rotulo:'sem estado'}).rotulo;
        if(tr.querySelector('th').textContent.trim()!==x.palavra) maus++;
        if(tr.querySelector('.cov-folha-est').textContent.trim()!==rot) maus++;});
      return JSON.stringify({maus:maus,n:f.mostra.length});})()`));
    tem('as linhas da folha são as palavras sem sinal do dicionário',
      linhas.length === esp.mostra.length && conferidas.maus === 0 && conferidas.n === linhas.length,
      linhas.length + ' linhas · esperadas ' + esp.mostra.length + ' · ' + conferidas.maus + ' divergências');
    tem('a folha mostra o estado escrito de cada palavra', linhas.every(l => l.e && l.e !== 'undefined'),
      linhas.filter(l => !l.e || l.e === 'undefined').length + ' vazias');

    /* --- a coluna de resposta está vazia: a folha pergunta, não ensina --- */
    const celulas = await avaliar(`(function(){var maus=0;
      document.querySelectorAll('.cov-folha-tab tbody tr').forEach(function(tr){
        var c=tr.querySelectorAll('td.cov-folha-escreve');
        if(c.length!==2 || c[0].textContent.trim() || c[1].textContent.trim()) maus++;});
      return maus;})()`);
    tem('cada palavra tem duas células de resposta em branco', celulas === 0, celulas + ' linha(s) más');
    const nota = await avaliar(`document.querySelector('#cov-folha .cov-folha-nota').textContent.replace(/\\s+/g,' ')`);
    tem('a folha diz que não ensina nenhum sinal', /Esta folha não ensina nada/.test(nota));
    tem('a folha diz em que dia o dicionário foi lido',
      nota.indexOf(await avaliar(`fmtData(new Date().toISOString().slice(0,10))`)) >= 0, nota.slice(0, 80));
    const contagem = nota.match(/(\d+) de (\d+)/);
    tem('a contagem escrita na folha é a contagem real',
      !!contagem && +contagem[1] === esp.sem && +contagem[2] === esp.total,
      contagem && contagem[0] + ' · real ' + esp.sem + ' de ' + esp.total);

    /* --- o que não cabe é dito, não escondido --- */
    tem('se sobram palavras, a folha diz quantas ficaram de fora',
      esp.fora === 0 ? linhas.length === esp.sem : /ficaram de fora/.test(nota), 'fora ' + esp.fora);

    /* --- a folha aponta para a Colheita, onde o sinal passa a existir --- */
    const rodape = await avaliar(`(function(){var a=document.querySelector('.cov-folha-rod a');
      return a ? a.getAttribute('href') : 'sem link';})()`);
    tem('a folha diz onde registar o que se respondeu', /#\/colher$/.test(rodape), rodape);

    /* --- o seletor só oferece temas com lacunas, e repinta a folha --- */
    const opcoes = await avaliar(`[...document.querySelectorAll('#cov-folha-tema option')].map(function(o){return o.value;})`);
    const temasEsperados = JSON.parse(await avaliar(`JSON.stringify(covFolhaTema(covDados(), null).temas)`));
    tem('o seletor lista só os temas que ainda têm palavras sem sinal',
      opcoes.join('|') === temasEsperados.join('|'), opcoes.length + ' temas');
    tem('há um botão para imprimir a folha', await avaliar(`!!document.querySelector('[data-cov-print]')`));
    await avaliar(`window.__nPrint=0; window.print=function(){window.__nPrint++;}; 1`);
    await avaliar(`document.querySelector('[data-cov-print]').click()`);
    await dormir(120);
    tem('o botão chama a impressão do browser', await avaliar(`window.__nPrint`) === 1,
      'window.print chamado ' + (await avaliar(`window.__nPrint`)) + ' vez(es)');
    tem('e anuncia o que está a acontecer', await avaliar(`((document.querySelector('#cov-live')||{}).textContent||'').length > 30`));

    if (opcoes.length > 1) {
      const outro = opcoes[1];
      await avaliar(`(function(){var s=document.querySelector('#cov-folha-tema');s.value=${JSON.stringify(outro)};
        s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await dormir(250);
      const novoH2 = await avaliar(`document.querySelector('#cov-folha h2').textContent`);
      const novasLinhas = await avaliar(`document.querySelectorAll('.cov-folha-tab tbody tr').length`);
      const esperadoOutro = JSON.parse(await avaliar(`JSON.stringify(covFolhaTema(covDados(), ${JSON.stringify(outro)}))`));
      const live = await avaliar(`document.querySelector('#cov-live').textContent`);
      tem('mudar de tema repinta a folha com as palavras desse tema',
        novoH2.indexOf(outro) >= 0 && novasLinhas === esperadoOutro.mostra.length, novoH2 + ' · ' + novasLinhas + ' linhas');
      tem('e diz quantas palavras ainda faltam nesse tema', /ainda sem sinal confirmado/.test(live) && live.length > 30, live.slice(0, 90));
    }

    /* --- o papel --- */
    const noEcra = {};
    for (const sel of SELECTORES) noEcra[sel] = await ver(sel);
    const linhasEcra = await avaliar(`document.querySelectorAll('.cov-folha-tab tbody tr').length`);
    await p('Emulation.setEmulatedMedia', { media: 'print', features: [] });
    await p('Emulation.setDeviceMetricsOverride', { width: 688, height: 1017, deviceScaleFactor: 1, mobile: false });
    await dormir(250);
    const noPapel = {};
    for (const sel of SELECTORES) noPapel[sel] = await ver(sel);
    const ficaram = SELECTORES.filter(s => noEcra[s] === 'visivel' && noPapel[s] !== 'escondido' && s !== '#cov-folha');
    tem('no papel não sai cabeçalho, rodapé, barra, tabelas, seletor nem avisos',
      ficaram.length === 0, ficaram.map(s => s + '=' + noPapel[s]).join(', ')
        + ' | no ecrã: ' + SELECTORES.map(s => s + '=' + noEcra[s]).join(', '));
    tem('no papel a folha continua lá', noPapel['#cov-folha'] === 'visivel', noPapel['#cov-folha']);
    const linhasPapel = await avaliar(`document.querySelectorAll('.cov-folha-tab tbody tr').length`);
    tem('as mesmas linhas saem no papel', linhasPapel === linhasEcra, linhasPapel + ' de ' + linhasEcra);
    const dim = await avaliar(`(function(){var r=document.querySelector('#cov-folha').getBoundingClientRect();
      return [r.width, r.height, document.documentElement.clientWidth];})()`);
    tem('a folha cabe numa página de A4', dim[0] <= dim[2] + 1 && dim[1] <= 1017,
      Math.round(dim[0]) + '×' + Math.round(dim[1]) + ' px, largura ' + dim[2]);
    const corLetra = await avaliar(`getComputedStyle(document.querySelector('.cov-folha-tab th')).color`);
    tem('no papel as palavras saem a preto', /0, 0, 0/.test(corLetra), corLetra);
    const alturaCelula = await avaliar(`Math.round(document.querySelector('.cov-folha-escreve').getBoundingClientRect().height)`);
    tem('as células de resposta têm altura para escrever à mão', alturaCelula >= 20, alturaCelula + ' px');
    await p('Emulation.setEmulatedMedia', { media: '', features: [] });
    await p('Emulation.setDeviceMetricsOverride', { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false });
    await dormir(200);
    tem('voltamos ao ecrã: a página toda reaparece', (await ver('.site-head')) === 'visivel' && (await ver('.cov-tab-temas')) === 'visivel');

    /* --- quem imprime com texto a 150% --- */
    await avaliar(`localStorage.setItem('vs.a11y', JSON.stringify({escala:150,contraste:false,temaEscuro:false,movimento:false,simples:false}))`);
    await carregar(BASE + '?cb=probe150#/cobertura');
    tem('a escala de 150% chega efectivamente ao conteúdo',
      await avaliar(`Number(getComputedStyle(document.querySelector('#app')).zoom)`) === 1.5);
    await p('Emulation.setEmulatedMedia', { media: 'print', features: [] });
    await p('Emulation.setDeviceMetricsOverride', { width: 688, height: 1017, deviceScaleFactor: 1, mobile: false });
    await dormir(250);
    const dim150 = await avaliar(`(function(){var r=document.querySelector('#cov-folha').getBoundingClientRect();
      return [r.width, r.height, document.documentElement.clientWidth, Number(getComputedStyle(document.querySelector('#app')).zoom)];})()`);
    tem('com 150% de texto a folha continua a caber no papel',
      dim150[0] <= dim150[2] + 1 && dim150[1] <= 1017 && dim150[3] === 1,
      Math.round(dim150[0]) + '/' + dim150[2] + ' px, ' + Math.round(dim150[1]) + ' px de altura, zoom ' + dim150[3]);
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
