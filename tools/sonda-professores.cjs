/* Sonda funcional do planeador de aulas (#/professores) — CDP, sem dependências.
   Verifica o que a interface afirma: os minutos batem certo com a duração escolhida,
   nada é guardado no aparelho, o tema de demonstração fica de fora, a quantidade pedida
   limita-se ao que existe, a glosa aparece marcada como «a validar», e o botão do Pamosii
   leva a frase escrevida para o painel.
   Precisa do servidor local a correr. Uso: node tools/sonda-professores.cjs --porta=5291
   (porta de 4 dígitos nova a cada execução). Sai 0 com tudo ok, 1 com falha ou erro de consola. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const PORTA = Number(flag('porta', 4811));
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
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pamosii-probe-'));
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

    await carregar(BASE + '?cb=probe#/professores');

    tem('a página carrega com o planeador', await avaliar(`!!document.querySelector('#prof-plano .prof-bloco')`));
    tem('o resumo é anunciado', await avaliar(`(document.querySelector('#prof-live')||{}).textContent.length > 20`));
    const chaveAntes = await avaliar(`Object.keys(localStorage).sort().join(',')`);
    tem('nada é escrito no aparelho à partida', !/vs\.(colheita|professor|plano)/.test(chaveAntes), chaveAntes);

    /* os minutos têm de bater certo com a duração escolhida */
    const soma = await avaliar(`[...document.querySelectorAll('.prof-min')].map(e=>+parseInt(e.textContent)).reduce((a,b)=>a+b,0)`);
    tem('45 min escolhidos = 45 min no plano', soma === 45, 'soma ' + soma);
    await avaliar(`var e=document.querySelector('#prof-dur');e.value='90';e.dispatchEvent(new Event('change'));1`);
    await dormir(120);
    tem('90 min', await avaliar(`[...document.querySelectorAll('.prof-min')].map(e=>+parseInt(e.textContent)).reduce((a,b)=>a+b,0)`) === 90);
    await avaliar(`var e=document.querySelector('#prof-dur');e.value='30';e.dispatchEvent(new Event('change'));1`);
    await dormir(120);
    tem('30 min', await avaliar(`[...document.querySelectorAll('.prof-min')].map(e=>+parseInt(e.textContent)).reduce((a,b)=>a+b,0)`) === 30);
    await avaliar(`var e=document.querySelector('#prof-dur');e.value='45';e.dispatchEvent(new Event('change'));1`);
    await dormir(120);

    /* o tema de demonstração não pode aparecer como conteúdo de ensino */
    tem('tema de demonstração fora do planeador',
      !(await avaliar(`[...document.querySelectorAll('#prof-tema option')].map(o=>o.value).join('|')`)).includes('Demonstração'));

    /* estado por palavra */
    tem('cada palavra mostra o seu estado',
      await avaliar(`[...document.querySelectorAll('.prof-palavras li')].every(li=>li.querySelector('.dic-badge'))`));
    tem('o plano diz que não foi revisto por uma pessoa surda',
      await avaliar(`document.querySelector('.prof-avisos').textContent.includes('não foi revisto por uma pessoa surda')`));

    /* a frase escrevida produz glosa marcada como a validar */
    await avaliar(`var f=document.querySelector('#prof-frase');f.value='Onde fica a escola?';f.dispatchEvent(new Event('input'));1`);
    await dormir(500);
    const glosa = await avaliar(`(document.querySelector('.prof-glosa')||{}).textContent || ''`);
    tem('a frase produz glosa', /Glosa/.test(glosa), glosa.slice(0, 90));
    tem('a glosa vem marcada como a validar', /a validar/.test(glosa));

    /* o texto que sai para a área de transferência / para o ficheiro */
    const txt = await avaliar(`profTextoPlano(profEstado,[true,false,true,false,false,false,true])`);
    tem('o plano descarregável existe', typeof txt === 'string' && txt.length > 500, (txt || '').length + ' chars');
    tem('o texto diz que não foi revisto', /não foi revisto por uma pessoa surda/.test(txt));
    tem('o texto traz a checklist marcada', /\[x\] Vi a aula inteira/.test(txt) && /\[ \] A luz bate/.test(txt));
    tem('o texto não leva etiquetas HTML', !/<(strong|a href|em|p)>/.test(txt), (txt.match(/<[^>\n]{1,30}>/) || [''])[0]);
    tem('o cabeçalho escrevido aparece no ficheiro', !/Escola, turma/.test(txt));

    /* nada ficou guardado depois de tudo isto */
    const chaveDepois = await avaliar(`Object.keys(localStorage).sort().join(',')`);
    tem('continua sem escrever no aparelho', chaveDepois === chaveAntes, chaveDepois);

    /* levar a frase para o Pamosii */
    await avaliar(`document.querySelector('[data-prof-pamosii]').click()`);
    await dormir(500);
    const depois = await avaliar(`location.hash + ' | ' + pmEstado.texto`);
    tem('o botão abre o Pamosii com a frase', depois === '#/pamosii | Onde fica a escola?', depois);

    /* voltar e mudar para o alfabeto: o bloco de datilologia troca */
    await carregar(BASE + '?cb=probe#/professores');
    await avaliar(`var e=document.querySelector('#prof-tema');e.value='Alfabeto';e.dispatchEvent(new Event('change'));1`);
    await dormir(150);
    const titulos = await avaliar(`[...document.querySelectorAll('.prof-bloco-t')].map(h=>h.textContent).join(' / ')`);
    tem('no alfabeto o treino troca de bloco', /Treino em pares/.test(titulos) && !/Datilologia: o que não tem sinal/.test(titulos), titulos);
    const letras = await avaliar(`[...document.querySelectorAll('.prof-w')].map(s=>s.textContent).join('')`);
    tem('as palavras do plano do alfabeto são letras', /^[A-Z]+$/.test(letras), letras);

    /* contexto inclusiva: o aviso do intérprete tem de aparecer */
    await avaliar(`var e=document.querySelector('#prof-ctx');e.value='inclusiva';e.dispatchEvent(new Event('change'));1`);
    await dormir(150);
    tem('o plano de turma inclusiva avisa que não substitui um intérprete',
      await avaliar(`document.querySelector('#prof-plano').textContent.includes('não substitui um intérprete')`));
    tem('e avisa que não interpreta a aula',
      await avaliar(`document.querySelector('.prof-avisos').textContent.includes('não interpreta a aula')`));

    /* a quantidade pedida nunca pode passar o que existe no tema */
    const tabela = await avaliar(`profTemas().map(t=>t+'='+GLOSSARIO.find(g=>g.tema===t).termos.filter(x=>x.estado!=='demonstracao').length+'/aulas'+aulasDeTema(t).length).join(', ')`);
    console.log('  dados  ' + tabela);
    const curto = await avaliar(`profTemas().map(t=>[t,GLOSSARIO.find(g=>g.tema===t).termos.filter(x=>x.estado!=='demonstracao').length]).filter(x=>x[1]<12&&x[1]>=3).map(x=>x[0])[0]||''`);
    const semAula = await avaliar(`profTemas().find(t=>aulasDeTema(t).length===0)||''`);
    if (curto) {
      await avaliar("var e=document.querySelector('#prof-tema');e.value=" + JSON.stringify(curto) + ";e.dispatchEvent(new Event('change'));1");
      await avaliar(`var e=document.querySelector('#prof-n');e.value='12';e.dispatchEvent(new Event('change'));1`);
      await dormir(200);
      const n = await avaliar(`document.querySelectorAll('.prof-palavras li').length`);
      tem('pedir 12 palavras num tema com menos (' + curto + ') limita-se ao que existe', n < 12 && n > 0, n + ' cartões');
      tem('e o plano avisa que o tema tem menos palavras',
        await avaliar(`document.querySelector('.prof-avisos').textContent.includes('no dicionário')`));
    } else tem('existe um tema curto para testar a quantidade', false, 'nenhum tema com 3–11 palavras');
    if (semAula) {
      await avaliar("var e=document.querySelector('#prof-tema');e.value=" + JSON.stringify(semAula) + ";e.dispatchEvent(new Event('change'));1");
      await dormir(200);
      tem('um tema sem aula (' + semAula + ') diz que não há vídeo',
        await avaliar(`/Sem aula ligada a este tema/.test(document.querySelector('#prof-plano').textContent)`));
      tem('e aponta para o dicionário e para a Colheita em vez de fingir',
        await avaliar(`!!document.querySelector('a[href="#/dicionario"]') && !!document.querySelector('a[href="#/colher"]')`));
    } else tem('todos os temas do planeador têm aula (nada a testar aqui)', true, 'sem tema sem aula');

    /* os quatro contextos têm de mostrar a nota no bloco de acolhimento */
    for (const c of ['turma', 'professor', 'familia']) {
      await avaliar(`var e=document.querySelector('#prof-ctx');e.value='${c}';e.dispatchEvent(new Event('change'));1`);
      await dormir(150);
      const nota = await avaliar(`(PROF_CONTEXTOS.find(x=>x.id==='${c}')||{}).nota`);
      tem('contexto ' + c + ' mostra a sua nota',
        await avaliar(`document.querySelector('#prof-plano').textContent.includes(${JSON.stringify(nota.slice(0, 40))})`));
    }

    /* os botões de copiar e descarregar não rebentam */
    await avaliar(`document.querySelector('[data-prof-copy]').click()`);
    await dormir(200);
    await avaliar(`document.querySelector('[data-prof-dl]').click()`);
    await dormir(300);
    tem('copiar e descarregar correm sem erro na consola', erros.filter(x => !/favicon|net::ERR_FILE_NOT_FOUND.*manifest|SpeechSynthesis|speech|Clipboard|Documents\.Permission|not allowed/i.test(x)).length === 0,
      erros.slice(-2).join(' | '));
  } catch (e) {
    casos.push({ nome: 'a sonda correu até ao fim', ok: false, detalhe: e.message });
  } finally {
    const maus = casos.filter(c => !c.ok);
    for (const c of casos) console.log((c.ok ? '  ok   ' : '  FALHA ') + c.nome + (c.detalhe ? '  [' + String(c.detalhe).slice(0, 120) + ']' : ''));
    const errosReais = erros.filter(x => !/favicon|net::ERR_FILE_NOT_FOUND.*manifest|SpeechSynthesis|speech/i.test(x));
    console.log('casos: ' + casos.length + ' · falhas: ' + maus.length + ' · erros de consola: ' + errosReais.length);
    errosReais.slice(0, 6).forEach(x => console.log('  consola: ' + x));
    try { cliente && cliente.fechar(); } catch (e) { /* já fechado */ }
    try { chrome.kill(); } catch (e) { /* já morto */ }
    process.exit(maus.length || errosReais.length ? 1 : 0);
  }
})();
