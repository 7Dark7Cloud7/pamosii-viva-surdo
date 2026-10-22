const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const passagens = [
  { chave: 'genesis-1', consulta: 'genesis 1:1-31', titulo: 'A criação', tema: 'Começos' },
  { chave: 'joao-3-16', consulta: 'joao 3:16-17', titulo: 'Deus amou o mundo', tema: 'Amor' },
  { chave: 'salmos-23', consulta: 'salmos 23:1-6', titulo: 'O Senhor é o meu pastor', tema: 'Consolo' },
  { chave: 'marcos-7-31', consulta: 'marcos 7:31-37', titulo: 'Jesus e o homem surdo', tema: 'Encontro' },
];

const dados = passagens.map(p => {
  const fonte = 'https://bible-api.com/' + encodeURIComponent(p.consulta) + '?translation=almeida';
  const resposta = JSON.parse(execFileSync('curl', ['-fsS', '--max-time', '35', fonte], { encoding: 'utf8' }));
  if (!Array.isArray(resposta.verses) || !resposta.verses.length || resposta.translation_id !== 'almeida' || !/public domain/i.test(resposta.translation_note)) {
    throw new Error('Texto ou licença não confirmado: ' + p.consulta);
  }
  const { consulta, ...meta } = p;
  const versos = resposta.verses.map(v => ({ n: v.verse, texto: v.text.replace(/\s+/g, ' ').trim() }));
  process.stdout.write(resposta.reference + ': ' + versos.length + ' versículos\n');
  return { ...meta, referencia: resposta.reference, fonte, versos };
});

const saida = {
  traducao: 'João Ferreira de Almeida',
  licenca: 'Domínio público (Public Domain)',
  obtidoEm: new Date().toISOString().slice(0, 10),
  passagens: dados,
};
const destino = path.join(__dirname, '..', 'app', 'assets', 'biblia.json');
fs.writeFileSync(destino, JSON.stringify(saida, null, 2) + '\n');
process.stdout.write('Guardado: ' + destino + '\n');
