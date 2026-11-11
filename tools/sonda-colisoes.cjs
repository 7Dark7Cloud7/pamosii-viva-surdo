#!/usr/bin/env node
'use strict';
/*
 * Sonda de colisões — CDP sobre o Chrome instalado, sem dependências.
 *
 *   node tools/sonda-colisoes.cjs                       # 20 rotas, 390×844
 *   node tools/sonda-colisoes.cjs --largura=320 --altura=640
 *   node tools/sonda-colisoes.cjs --rotas=/transcrever,/ouvir --tema=escuro
 *
 * Para cada alvo de toque visível (liga, botão, campo, [role=button], [tabindex]),
 * mede a área que fica por baixo de um elemento FIXO que não pertence a esse alvo
 * (o painel de acessibilidade, o atalho do Signer, a barra de navegação, qualquer
 * `position:fixed`). O centro do alvo é o critério duro: tapado = falha. Intersecção
 * menor que não chega ao centro é aviso, com os píxeis.
 *
 * O que não é colisão: o alvo que É o elemento fixo (a própria barra, o próprio
 * botão flutuante), o que fica fora do ecrã, e — medido à primeira corrida — um
 * contentor maior que o ecrã (`#conteudo` tem `tabindex` e 9 000 px de altura; o
 * centro dele atravessa o atalho do Signer sem que ninguém o vá carregar) ou um
 * fixo estacionado fora do ecrã (o `.skip` é `top:10px` com `translateY(-160%)`
 * até receber foco, portanto fica inteiramente por cima do viewport).
 * Os dois últimos são contados e impressos, não escondidos.
 * Precisa do servidor local de pé (ou de --base com o site publicado). Sai 1 se houver falha.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };

const BASE = flag('base', 'http://127.0.0.1:8123/');
const LARGURA = Number(flag('largura', 390));
const ALTURA = Number(flag('altura', 844));
const PORTA = Number(flag('porta', 4861));
const TEMA = flag('tema', 'claro');
const ESCALA = Number(flag('escala', 100));

const ROTAS = (flag('rotas', '') || [
  '/', '/cursos', '/cursos/mini-curso-lga', '/aprender-lga', '/alfabeto', '/pamosii',
  '/ouvir', '/transcrever', '/dicionario', '/professores', '/biblioteca', '/biblia',
  '/evangelismo', '/colher', '/validar', '/cobertura', '/marcar', '/fora', '/sobre', '/contacto',
]).join(',').split(',').map(s => s.trim()).filter(Boolean);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));

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

/* Em página: intersecção de cada alvo com cada fixo que não é seu ascendente. */
const SONDA = `(function(){
  var alvos = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [tabindex]'));
  var fixos = Array.from(document.querySelectorAll('body *')).filter(function(el){
    var c = getComputedStyle(el);
    if (c.position !== 'fixed') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none' && parseFloat(c.opacity||'1') > 0.05;
  });
  function rect(el){ var r = el.getBoundingClientRect(); return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}; }
  /* tudo o que existe fora do ecrã não pode tapar nada: o .skip vive a
     top:10px com translateY(-160%) até receber foco, e um fixo fora do viewport
     não intercepta o dedo */
  function recortar(r){
    var l = Math.max(0,r.l), t = Math.max(0,r.t), rr = Math.min(innerWidth,r.r), b = Math.min(innerHeight,r.b);
    return { l:l, t:t, r:rr, b:b, w:Math.max(0,rr-l), h:Math.max(0,b-t) };
  }
  function nome(el){ return (el.id ? '#'+el.id : (typeof el.className === 'string' && el.className.trim() ? '.'+el.className.trim().split(/\\s+/)[0] : el.tagName.toLowerCase())); }
  function area(a,b){ var w = Math.min(a.r,b.r)-Math.max(a.l,b.l); var h = Math.min(a.b,b.b)-Math.max(a.t,b.t); return (w>0&&h>0)? w*h : 0; }
  var maus = [], avisos = [], fora = 0, grandes = 0;
  var tela = innerWidth * innerHeight;
  for (var i=0;i<alvos.length;i++){
    var a = alvos[i], ra = rect(a);
    if (ra.w < 4 || ra.h < 4) continue;
    /* #conteudo tem tabindex e 9000 px de altura: o centro cai fora do ecrã e
       atravessa o atalho do Signer em baixo. Um alvo maior que o ecrã não é um
       alvo de toque — é um contentor. */
    if (ra.w * ra.h > tela) { grandes++; continue; }
    var cx = ra.l + ra.w/2, cy = ra.t + ra.h/2;
    if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) { fora++; continue; }
    var vis = recortar(ra);
    var dentro = null, melhor = 0;
    for (var j=0;j<fixos.length;j++){
      var f = fixos[j];
      if (f === a || a.contains(f) || f.contains(a)) continue;
      var rf = recortar(rect(f));
      if (rf.w < 4 || rf.h < 4) continue;
      var pisca = rf.w * rf.h;
      if (pisca >= vis.w * vis.h * 0.98 && rf.h >= innerHeight * 0.9) continue; /* camada a cobrir o ecrã inteiro é diálogo, não colisão */
      var inter = area(vis, rf);
      if (inter > melhor) { melhor = inter; dentro = f; }
    }
    if (!dentro || melhor < 24) continue;
    var topo = document.elementFromPoint(cx, cy);
    var centroTapado = !topo || !(topo === a || a.contains(topo) || topo.contains(a));
    var reg = {
      alvo: nome(a) + ' ' + Math.round(ra.w) + 'x' + Math.round(ra.h),
      por: nome(dentro),
      px: Math.round(melhor),
      texto: (a.textContent || a.value || a.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ').slice(0,30),
      y: Math.round(ra.t),
    };
    if (centroTapado) maus.push(reg); else avisos.push(reg);
  }
  return JSON.stringify({ maus: maus, avisos: avisos, fixos: fixos.map(nome), fora: fora, grandes: grandes });
})()`;

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${os.tmpdir()}/vs-colisoes-${PORTA}`,
    '--disable-gpu', '--no-first-run', '--window-size=1200,900', 'about:blank',
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
    await Promise.race([pronto, dormir(15000)]);
    await dormir(400);
  };

  await p('Emulation.setDeviceMetricsOverride', { width: LARGURA, height: ALTURA, deviceScaleFactor: 2, mobile: true });
  await carregar(BASE + '?cb=col');
  await avaliar(`localStorage.setItem('vs.a11y', ${JSON.stringify(JSON.stringify({
    temaEscuro: TEMA === 'escuro' || TEMA === 'contraste-escuro',
    contraste: TEMA === 'contraste' || TEMA === 'contraste-escuro',
    escala: ESCALA,
  }))})`);

  let falhas = 0, avisosTotal = 0, descartados = 0;
  console.log(`colisões · ${LARGURA}×${ALTURA} · tema ${TEMA} · texto a ${ESCALA}% · ${ROTAS.length} rotas`);
  for (const rota of ROTAS) {
    await carregar(BASE + '?cb=col' + rota);
    await avaliar('window.scrollTo(0,0)');
    await dormir(350);
    const bruto = await avaliar(SONDA);
    const r = JSON.parse(bruto);
    /* o mesmo embaixo: a barra inferior fixa só interfere com o fim do documento */
    await avaliar('window.scrollTo(0, document.body.scrollHeight)');
    await dormir(350);
    const r2 = JSON.parse(await avaliar(SONDA));
    const maus = [...r.maus, ...r2.maus];
    const avisos = [...r.avisos, ...r2.avisos];
    falhas += maus.length;
    avisosTotal += avisos.length;
    descartados += Math.max(r.grandes, r2.grandes);
    console.log((maus.length ? 'FALHA ' : 'OK    ') + rota.padEnd(24)
      + (maus.length ? '' : `(fixos: ${r.fixos.length} · fora do ecrã: ${r2.fora} · contentores: ${r2.grandes})`));
    maus.slice(0, 6).forEach(m => console.log(`        centro tapado: ${m.alvo} «${m.texto}» por ${m.por} (${m.px} px², y=${m.y})`));
    avisos.slice(0, 3).forEach(m => console.log(`        aviso: ${m.alvo} «${m.texto}» encosta em ${m.por} (${m.px} px²)`));
  }
  const errosReais = erros.filter(x => !/favicon|manifest|SpeechSynthesis|speech|Permission/i.test(x));
  console.log(`\nrotas: ${ROTAS.length} · alvos com o centro tapado: ${falhas} · encostos: ${avisosTotal} · contentores ignorados: ${descartados} · erros de consola: ${errosReais.length}`);
  errosReais.slice(0, 4).forEach(x => console.log('  consola: ' + x));
  try { cliente.fechar(); } catch (e) { /* já fechado */ }
  try { chrome.kill(); } catch (e) { /* já morto */ }
  process.exit(falhas || errosReais.length ? 1 : 0);
})().catch(e => {
  console.error('sonda falhou: ' + e.message);
  /* só o Chrome que esta sonda lançou: nunca `taskkill /im chrome.exe`, que
     mataria o navegador da pessoa */
  const c = global.__chrome;
  if (c && c.pid) { try { spawn('taskkill', ['/pid', String(c.pid), '/T', '/f'], { stdio: 'ignore' }); } catch (err) { /* ignora */ } }
  process.exit(1);
});
