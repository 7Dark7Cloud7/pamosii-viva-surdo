#!/usr/bin/env node
'use strict';
/* Renderiza UMA cena do maos.js/palco.js a tamanho real para inspeção.
   node tools/cena-uma.cjs <ficheiro> <sinal-ou-vazio> [saida.png] */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const FONTE = process.argv[2];
const SINAL = process.argv[3] || '';
const OUT = process.argv[4] || '_proto/cena-uma.png';
const API = ['FORMAS_MAO', 'LOCAIS', 'MOVIMENTOS', 'SINAIS', 'sinalNotacao', 'maoFigura', 'maoCena', 'formaMisturar', 'maoMisturar'];

const caixa = vm.createContext({ Math, console });
const api = vm.runInContext(fs.readFileSync(FONTE, 'utf8') + '\n;({' + API.join(',') + '});', caixa, { filename: FONTE });
const n = SINAL ? api.sinalNotacao(SINAL) : null;
/* mesma pose de repouso de app.js (REP) */
const formaRep = api.formaMisturar(api.FORMAS_MAO.curva, api.FORMAS_MAO.abre, 0.45);
const svg = n
  ? api.maoCena({ dir: n.fim, esq: n.duas ? n.inicio : null }, SINAL)
  : api.maoCena({
      dir: { forma: formaRep, pos: [-1.04, 0.96, 0.30], rot: [6, 180, 186] },
      esq: { forma: formaRep, pos: [1.04, 0.96, 0.30], rot: [6, -180, -186] },
    }, '');

const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#0b1414}svg{display:block;width:960px;height:540px}</style>${svg}`;
const tmp = path.join(os.tmpdir(), 'cena-uma.html');
fs.writeFileSync(tmp, html);
const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
spawnSync(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
  `--screenshot=${path.resolve(OUT)}`, '--window-size=960,540', 'file:///' + tmp.split(path.sep).join('/'),
], { stdio: 'ignore' });
console.log(OUT);
