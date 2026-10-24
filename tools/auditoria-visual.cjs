#!/usr/bin/env node
'use strict';
/*
 * Auditoria de layout e contraste, sem dependências.
 *
 *   node tools/auditoria-visual.cjs                        # todas as rotas, 320 px, 100%, claro
 *   node tools/auditoria-visual.cjs --rotas=/validar,/colher --escala=150
 *   node tools/auditoria-visual.cjs --tema=escuro --largura=390 --altura=844
 *   node tools/auditoria-visual.cjs --lista                  # só os nomes das rotas
 *
 * Abre o Chrome já instalado em modo headless, fala CDP por WebSocket (o Node 22+
 * traz WebSocket global), e devolve código 1 se houver overflow horizontal, alvos de
 * toque abaixo de 24×24 (WCAG 2.5.8) ou texto abaixo de 4,5:1 (3:1 se for grande).
 *
 * O servidor local tem de estar de pé. Por omissão: http://127.0.0.1:8123/
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const a = argv.find(x => x.startsWith('--' + n + '='));
  return a ? a.slice(n.length + 3) : d;
};
const tem = n => argv.includes('--' + n);

const BASE = flag('base', 'http://127.0.0.1:8123/');
const LARGURA = Number(flag('largura', 320));
const ALTURA = Number(flag('altura', 640));
const ESCALA = Number(flag('escala', 100));
const TEMA = flag('tema', 'claro'); /* claro | escuro | alto */
const PORTA = Number(flag('porta', 9333));

const ROTAS_PADRAO = [
  '/', '/cursos', '/aprender-lga', '/pamosii', '/dicionario', '/professores',
  '/biblioteca', '/biblia', '/biblia/genesis-1', '/evangelismo', '/colher', '/validar',
  '/cobertura', '/marcar', '/fora', '/sobre', '/contacto',
];

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));

if (!CHROME) {
  console.error('Não encontro o Chrome. Diz-me o caminho em --chrome=.');
  process.exit(1);
}

/* ---------- cliente CDP mínimo ---------- */
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
  throw new Error('O Chrome não abriu a porta de depuração ' + porta);
}

/* ---------- o que se mede dentro da página ---------- */
const SONDA = `function (cfg) {
  const vw = innerWidth;
  const inline = el => {
    const p = el.parentElement;
    return !!p && /^(P|LI|TD|SPAN|BLOCKQUOTE)$/.test(p.tagName) && el.tagName === 'A';
  };
  const escondido = el => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return true;
    if (el.closest('.sr-only')) return true;
    if (parseFloat(s.opacity) === 0) return true;
    if (el.closest('[aria-hidden="true"]')) return true;
    return false;
  };
  const dentroDeScroll = el => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
    }
    return false;
  };

  /* 1. overflow horizontal */
  const overflow = [];
  document.querySelectorAll('body *').forEach(el => {
    if (escondido(el) || dentroDeScroll(el)) return;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.right > vw + 1) {
      overflow.push({ el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : ''), dir: Math.round(r.right - vw) });
    }
  });

  /* 2. alvos de toque — um <label> vale pelo controlo que acciona, e vice-versa:
     é o conjunto que responde ao dedo, não a caixinha por dentro */
  const pequenos = [];
  const areaDe = el => {
    if (el.tagName === 'LABEL' && el.htmlFor) {
      const c = document.getElementById(el.htmlFor);
      if (c) return { el, r: c.getBoundingClientRect(), alvo: c };
    }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      const l = el.closest('label');
      if (l) return { el: l, r: l.getBoundingClientRect(), alvo: l };
    }
    return { el, r: el.getBoundingClientRect(), alvo: el };
  };
  const vistos = new Set();
  document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, label[for], [role=button], [tabindex]:not([tabindex="-1"])').forEach(el => {
    if (escondido(el) || inline(el)) return;
    const { el: dono, r, alvo } = areaDe(el);
    if (vistos.has(alvo)) return;
    vistos.add(alvo);
    if (!r.width || !r.height) return;
    if (r.height < 24 || r.width < 24) {
      pequenos.push({ el: dono.tagName.toLowerCase() + (dono.id ? '#' + dono.id : '') + (dono.className && typeof dono.className === 'string' ? '.' + dono.className.trim().split(/\\s+/)[0] : ''), w: Math.round(r.width), h: Math.round(r.height), txt: (dono.textContent || '').trim().slice(0, 24) });
    }
  });

  /* 3. contraste do texto visível */
  const lum = c => {
    const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const rgba = s => {
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const fundoDe = el => {
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = rgba(s.backgroundColor);
      if (c && c.a > 0.85) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const fracos = [];
  document.querySelectorAll('body *').forEach(el => {
    if (escondido(el)) return;
    const texto = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent).join(' ').trim();
    if (!texto) return;
    const s = getComputedStyle(el);
    const fg = rgba(s.color);
    const bg = fundoDe(el);
    if (!fg || !bg) return;
    const l1 = lum([fg.r, fg.g, fg.b]);
    const l2 = lum([bg.r, bg.g, bg.b]);
    const razao = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(s.fontSize);
    const negrito = Number(s.fontWeight) >= 700;
    const grande = px >= 24 || (negrito && px >= 18.66);
    const alvoMin = grande ? 3 : 4.5;
    if (razao < alvoMin - 0.01) {
      fracos.push({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : ''), razao: Math.round(razao * 100) / 100, minimo: alvoMin, px: Math.round(px), txt: texto.slice(0, 30) });
    }
  });

  return JSON.stringify({
    vw, docW: document.documentElement.scrollWidth, zoom: (document.querySelector('#app') || { style: {} }).style.zoom || '1',
    titulo: document.title, overflow: overflow.slice(0, 6), nOverflow: overflow.length,
    pequenos: pequenos.slice(0, 8), nPequenos: pequenos.length,
    fracos: fracos.slice(0, 8), nFracos: fracos.length,
  });
}`;

async function main() {
  if (tem('lista')) {
    console.log(ROTAS_PADRAO.join('\n'));
    return 0;
  }
  const rotas = (flag('rotas', '') || ROTAS_PADRAO.join(',')).split(',').map(s => s.trim()).filter(Boolean);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pamosii-aud-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + PORTA, '--user-data-dir=' + perfil,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });

  let cliente = null;
  try {
    const t = await alvo(PORTA);
    cliente = await ligar(t.webSocketDebuggerUrl);
    const p = cliente.pedir;
    await p('Page.enable');
    await p('Runtime.enable');
    await p('Emulation.setDeviceMetricsOverride', {
      width: LARGURA, height: ALTURA, deviceScaleFactor: 1, mobile: LARGURA < 800,
    });
    await p('Emulation.setEmulatedMedia', { features: [] });

    const avaliar = async expr => {
      const r = await p('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception || {}).description);
      return r.result.value;
    };
    const carregar = async url => {
      const pronto = new Promise(res => cliente.ao(m => { if (m.method === 'Page.loadEventFired') res(); }));
      await p('Page.navigate', { url });
      await Promise.race([pronto, dormir(15000)]);
      await dormir(250);
    };

    /* prefs de acessibilidade: escrever uma vez, no mesmo browser, e recarregar —
       a escala é aplicada no arranque, não quando se muda de rota */
    await carregar(BASE + '?cb=aud');
    await avaliar(`localStorage.setItem('vs.a11y', ${JSON.stringify(JSON.stringify({
      escala: ESCALA, contraste: TEMA === 'alto', temaEscuro: TEMA === 'escuro', movimento: true, simples: false,
    }))}); 'ok'`);
    await carregar(BASE + '?cb=aud&prefs=1');

    const linhas = [];
    let falhas = 0;
    for (const rota of rotas) {
      await carregar(BASE + '?cb=aud#' + rota);
      const bruto = await avaliar('(' + SONDA + ')(' + JSON.stringify({}) + ')');
      const d = JSON.parse(bruto);
      const problemas = d.nOverflow + d.nPequenos + d.nFracos;
      if (problemas) falhas++;
      linhas.push({ rota, d, problemas });
    }

    console.log(`Pamosii — auditoria ${LARGURA}×${ALTURA} · texto ${ESCALA}% · tema ${TEMA}` + (TEMA === 'alto' ? ' (contraste alto)' : ''));
    linhas.forEach(({ rota, d, problemas }) => {
      const estado = problemas ? 'FALHA' : 'OK   ';
      console.log(`${estado} ${rota.padEnd(16)} ${d.titulo.slice(0, 52)}`);
      console.log(`      largura ${d.docW}/${d.vw} px · zoom ${d.zoom}`);
      if (rota !== '/' && d.titulo === 'Pamosii Viva Surdo') {
        console.log('      aviso: título é o da página inicial — rota inexistente ou sem metadados');
      }
      d.overflow.forEach(o => console.log(`      overflow +${o.dir}px  ${o.el}`));
      d.pequenos.forEach(o => console.log(`      alvo ${o.w}×${o.h}  ${o.el} «${o.txt}»`));
      d.fracos.forEach(o => console.log(`      contraste ${o.razao}:1 (min ${o.minimo})  ${o.el} ${o.px}px «${o.txt}»`));
    });
    console.log(`\n${linhas.length} rota(s), ${falhas} com problemas.`);
    return falhas ? 1 : 0;
  } finally {
    if (cliente) cliente.fechar();
    chrome.kill();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* perfil temporário */ }
  }
}

main().then(c => process.exit(c)).catch(e => { console.error('Falhou: ' + e.message); process.exit(2); });
