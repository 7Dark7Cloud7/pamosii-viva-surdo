#!/usr/bin/env node
'use strict';
/*
 * Folha de contacto do rig de mãos: desenha as 32 formas, oito sinais e mede o
 * custo em comandos de path de cada desenho. Serve para comparar duas versões de
 * maos.js a olho e para travar o orçamento de 2 500 comandos por frame.
 *
 *   node tools/folha-maos.cjs                       # app/maos.js
 *   node tools/folha-maos.cjs _proto/maos-ai.js --out=_proto/folha-ai.png
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const a = argv.find(x => x.startsWith('--' + n + '='));
  return a ? a.slice(n.length + 3) : d;
};
const REL = argv.find(x => !x.startsWith('--'));
const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.resolve(RAIZ, REL || 'app/maos.js');
const OUT = path.resolve(RAIZ, flag('out', '_proto/folha-maos.png'));
const HTML = OUT.replace(/\.png$/i, '.html');
const TETO = 2500;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));

if (!CHROME) {
  console.error('Não encontro o Chrome. Diz-me o caminho em --chrome=.');
  process.exit(1);
}
if (!fs.existsSync(FONTE)) {
  console.error('Não encontro ' + FONTE);
  process.exit(1);
}

const codigo = fs.readFileSync(FONTE, 'utf8');
const API = ['FORMAS_MAO', 'LOCAIS', 'MOVIMENTOS', 'SINAIS', 'sinalNotacao', 'maoFigura', 'maoCena', 'formaMisturar', 'maoMisturar'];

let api;
try {
  const caixa = vm.createContext({ Math, console });
  api = vm.runInContext(codigo + '\n;({' + API.join(',') + '});', caixa, { filename: FONTE });
} catch (e) {
  console.error('O ficheiro não carrega: ' + e.message);
  process.exit(1);
}

const faltam = API.filter(k => api[k] === undefined);
if (faltam.length) {
  console.error('Faltam globais: ' + faltam.join(', '));
  process.exit(1);
}

/* ---------- custo de desenho ---------- */
const comandos = svg => (svg.match(/[MLQCTAZ]/g) || []).length;
const paths = svg => (svg.match(/<path/g) || []).length;

const formas = Object.keys(api.FORMAS_MAO);
const sinais = ['olá', 'obrigado', 'professor', 'bom', 'água', 'sim', 'casa', 'dormir'];

const figuras = formas.map(f => {
  const svg = api.maoFigura(f);
  return { f, svg, cmd: comandos(svg), nm: paths(svg) };
});

const cenas = sinais.map(k => {
  const n = api.sinalNotacao(k);
  if (!n) return { k, svg: '', cmd: 0, nm: 0, erro: 'sinalNotacao devolveu null' };
  const poses = { dir: n.fim, esq: n.duas ? n.inicio : null };
  try {
    const svg = api.maoCena(poses, k);
    return { k, svg, cmd: comandos(svg), nm: paths(svg) };
  } catch (e) {
    return { k, svg: '', cmd: 0, nm: 0, erro: e.message };
  }
});

const pior = Math.max(...figuras.map(x => x.cmd), ...cenas.map(x => x.cmd));
const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const cartao = (rotulo, svg, nota, razao) => `
  <figure>
    <div class="quadro"${razao ? ` style="aspect-ratio:${razao}"` : ''}>${svg || '<span class="erro">falhou</span>'}</div>
    <figcaption>${rotulo}${nota ? `<small>${nota}</small>` : ''}</figcaption>
  </figure>`;

const html = `<!doctype html><meta charset="utf-8"><title>Folha de mãos — ${path.basename(FONTE)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 28px 32px 40px; background: #F3F0EA; color: #2B3A36;
         font: 14px/1.4 "Segoe UI", system-ui, sans-serif; }
  h1 { font-size: 19px; margin: 0 0 2px; }
  .meta { color: #6A7B75; margin: 0 0 22px; font-size: 12.5px; }
  .meta b { color: ${pior > TETO ? '#B3261E' : '#1F6B4A'}; }
  h2 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #6A7B75;
       margin: 26px 0 10px; font-weight: 600; }
  .grelha { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
  .grelha.cenas { grid-template-columns: repeat(4, 1fr); }
  figure { margin: 0; background: #FBFAF7; border: 1px solid #E2DDD2; border-radius: 10px;
           overflow: hidden; display: flex; flex-direction: column; }
  .quadro { background: #FBFAF7; display: grid; place-items: center; aspect-ratio: 32 / 34; }
  .quadro svg { width: 100%; height: 100%; display: block; }
  figcaption { font-size: 11.5px; text-align: center; padding: 5px 4px 7px; color: #45564F;
               border-top: 1px solid #EEE9DF; display: flex; flex-direction: column; gap: 1px; }
  figcaption small { color: #8B9994; font-size: 10px; }
  .erro { color: #B3261E; font-size: 11px; }
</style>
<h1>Folha de mãos</h1>
<p class="meta">${path.relative(RAIZ, FONTE).replace(/\\/g, '/')} · ${Math.round(codigo.length / 1024)} kB ·
  pior desenho <b>${pior} comandos</b> (teto ${TETO}) · figuras ${figuras.length} · cenas ${cenas.length}</p>
<h2>32 formas de mão</h2>
<div class="grelha">
${figuras.map(x => cartao(x.f, x.svg, `${x.cmd} cmd · ${x.nm} path`, '1 / 1')).join('')}
</div>
<h2>Oito sinais</h2>
<div class="grelha cenas">
${cenas.map(x => cartao(x.k, x.svg, x.erro || `${x.cmd} cmd`, '16 / 9')).join('')}
</div>`;

fs.writeFileSync(HTML, html);

const shot = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-device-scale-factor=1', '--window-size=1600,1720',
  '--screenshot=' + OUT, 'file:///' + HTML.replace(/\\/g, '/'),
], { stdio: 'ignore', timeout: 60000 });

if (!fs.existsSync(OUT)) {
  console.error('O Chrome não escreveu ' + OUT + (shot.error ? ' — ' + shot.error.message : ''));
  process.exit(1);
}

console.log(`${path.relative(RAIZ, OUT)} — pior ${pior} comandos (${pior > TETO ? 'ACIMA' : 'dentro'} do teto ${TETO})`);
if (pior > TETO) {
  figuras.filter(x => x.cmd > TETO).forEach(x => console.log(`  forma ${x.f}: ${x.cmd}`));
  cenas.filter(x => x.cmd > TETO).forEach(x => console.log(`  sinal ${x.k}: ${x.cmd}`));
  process.exit(1);
}
