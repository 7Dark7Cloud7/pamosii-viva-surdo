/* Teste rápido do motor de glosa do Pamosii, sem browser:
   corta as partes puras de app.js e corre-as em Node.
   uso: node tools/engine-test.cjs [app.js] */
const fs = require('fs');
const lines = fs.readFileSync(process.argv[2] || 'app/app.js', 'utf8').split('\n');
const at = (prefix, from = 0) => { const i = lines.findIndex((l, n) => n >= from && l.startsWith(prefix)); if (i < 0) throw new Error('não encontrado: ' + prefix); return i; };
const a1 = at('const ESTADO_GLOSSARIO');
const a2 = at('const aulasDeTema');
const a3 = at('const PAMOSSI_TIPOS');
const a4 = at('const PM_MAOS');
const code = lines.slice(a1, a2 + 1).join('\n') + '\n' + lines.slice(a3, a4).join('\n');
const normKey = (w) => String(w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const api = new Function('LGA_AULAS', 'MESES', code + `
  return { analisarTexto, glosaTexto, PM_EXEMPLOS, procurarSinal, PAMOSSI_INDICE, GLOSSARIO };`)(
  [{ id: 'x', tema: 'Escola', titulo: 'aula' }],
  ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']);

console.log('temas no glossário:', api.GLOSSARIO.length);
let falhas = 0;
for (const f of api.PM_EXEMPLOS) {
  for (const r of api.analisarTexto(f, { soletrar: false })) {
    console.log('\nFRASE: ' + r.frase);
    console.log('  glosa: ' + api.glosaTexto(r));
    console.log(`  sinais ${r.sinais.length}/${r.unidades} · alfabeto ${r.datilologias.length} · marcadores ${r.marcadores.length} · omitidas ${r.omitidas.length}`);
    console.log('  itens: ' + r.itens.map(i => `${i.tipo}:${i.palavra}${i.origem ? '<-' + i.origem : ''}${i.expressao ? '(expr)' : ''}${i.plural ? '(pl)' : ''}`).join(' | '));
    if (r.datilologias.some(d => !d.nome)) falhas++;
  }
}
console.log('\nfrases com palavras sem sinal (esperado >0, é honesto):', falhas);
console.log('\n--- procurarSinal: falsos positivos a vigiar ---');
['compra', 'venda', 'preciso', 'trabalha', 'gosto', 'estuda', 'escreve', 'quanto', 'da', 'em', 'amigos', 'casas', 'cadeira', 'águas', 'casa', 'mesa', 'porta', 'mercado', 'telefone', 'sapato', 'obrigado', 'leio', 'bom', 'amigo', 'obrigada', 'ele', 'ela', 'sao', 'gostas', 'corres', 'bebe', 'dorme'].forEach(w => {
  const r = api.procurarSinal(normKey(w));
  console.log(' ', w, '→', r ? `${r.palavra}${r.lema ? ' (lema ' + r.lema + ')' : ''}${r.plural ? ' (plural)' : ''}` : 'null');
});
