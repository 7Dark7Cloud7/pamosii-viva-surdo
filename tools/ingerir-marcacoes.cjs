/* tools/ingerir-marcacoes.cjs — juntar ficheiros de marcação numa lista publicada

   Uso:
     node tools/ingerir-marcacoes.cjs caminho/pamosii-marcacoes-2026-10-22.json [outro.json ...]
     node tools/ingerir-marcacoes.cjs --dry-run      (mostra o que faria, não escreve)
     node tools/ingerir-marcacoes.cjs --lista        (só imprime a tabela, sem escrever)

   O que faz:
     1. lê um ou mais ficheiros exportados pela página /marcar (schema 1);
     2. confirma que cada marcação tem {aula, palavra, inicio, fim} e que a aula
        existe mesmo nas 17 aulas do site (o ID do vídeo é a chave);
     3. junta repetições da mesma palavra na mesma aula (contam como ocorrências
        distintas — um sinal pode aparecer três vezes numa aula);
     4. escreve app/assets/marcacoes.json, o ficheiro que o site lê para mostrar
        «o sinal está em 0:31–0:34 desta aula».

   Regras de integridade:
     - uma marcação só sai daqui como `confirmado` se o registo trouxer
       `validado_por` com o nome de um sinalizador surdo. Sem isso fica
       `a validar`, e o site mostra esse estado no cartão.
     - nada é enviado a lado nenhum; o input são ficheiros que a equipa reúne.  */

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const FICHEIRO_APP = path.join(RAIZ, 'app', 'app.js');
const DESTINO = path.join(RAIZ, 'app', 'assets', 'marcacoes.json');
const SCHEMA_ESPERADO = 1;
const DURACAO_MAX = 120;   /* segundos — igual à regra da página */

const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[….:;?!]/g, '').trim();

/* ---------- 1. as aulas reais, para não inventar vídeos ---------- */
function aulasConhecidas() {
  const fonte = fs.readFileSync(FICHEIRO_APP, 'utf8');
  const inicio = fonte.indexOf('const LGA_AULAS = [');
  if (inicio < 0) throw new Error('Não encontrei `const LGA_AULAS = [` em app/app.js — o formato mudou.');
  const fim = fonte.indexOf('];', inicio);
  const bloco = fonte.slice(inicio, fim);
  const mapa = new Map();
  bloco.split('\n').forEach(linha => {
    const id = linha.match(/id:\s*'([^']+)'/);
    const titulo = linha.match(/titulo:\s*'([^']+)'/);
    const tema = linha.match(/tema:\s*'([^']+)'/);
    if (id) mapa.set(id[1], { titulo: titulo ? titulo[1] : id[1], tema: tema ? tema[1] : '' });
  });
  return mapa;
}

const parseT = (x) => {
  const t = String(x == null ? '' : x).trim().replace(',', '.');
  if (!t) return null;
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(Number(t) * 10) / 10;
  const p = t.split(':');
  if (p.length < 2 || p.length > 3) return null;
  const n = p.map(v => Number(v));
  if (n.some(v => !isFinite(v) || v < 0)) return null;
  const seg = n[n.length - 1], min = n.length === 2 ? n[0] : n[1], h = n.length === 3 ? n[0] : 0;
  if (min >= 60 || seg >= 60) return null;
  return Math.round((h * 3600 + min * 60 + seg) * 10) / 10;
};
const fmtT = (s) => {
  let t = Math.round(Math.max(0, s) * 10) / 10;
  let m = Math.floor(t / 60), seg = Math.round((t - m * 60) * 10) / 10;
  if (seg >= 60) { m += 1; seg -= 60; }
  return m + ':' + seg.toFixed(1).padStart(4, '0');
};

/* ---------- 2. leitura ---------- */
function leFicheiro(caminho) {
  const bruto = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  if (bruto.schema && bruto.schema > SCHEMA_ESPERADO) {
    throw new Error(path.basename(caminho) + ': schema ' + bruto.schema + ', este ingestor só conhece a versão ' + SCHEMA_ESPERADO);
  }
  const lista = Array.isArray(bruto) ? bruto
    : Array.isArray(bruto.marcacoes) ? bruto.marcacoes : null;
  if (!lista) throw new Error(path.basename(caminho) + ': sem `marcacoes[]` — não é um ficheiro da página /marcar.');
  return lista;
}

/* ---------- 3. validar uma marcação ---------- */
function limpa(r, aulas) {
  const palavra = String(r.palavra || '').replace(/\s+/g, ' ').trim();
  if (palavra.length < 2) return { erro: 'palavra ausente' };
  if (palavra.length > 48) return { erro: 'palavra com mais de 48 caracteres' };
  const id = String(r.aula || r.videoId || '').trim();
  if (!aulas.has(id)) return { erro: 'aula desconhecida: ' + id.slice(0, 24) };
  const inicio = parseT(r.inicio), fim = parseT(r.fim);
  if (inicio == null) return { erro: 'início sem formato mm:ss: ' + String(r.inicio).slice(0, 10) };
  if (fim == null) return { erro: 'fim sem formato mm:ss: ' + String(r.fim).slice(0, 10) };
  if (fim <= inicio) return { erro: 'fim (' + fmtT(fim) + ') não vem depois do início (' + fmtT(inicio) + ')' };
  if (fim - inicio > DURACAO_MAX) return { erro: 'trecho de ' + fmtT(fim - inicio) + ' — demasiado longo para um sinal' };
  const campo = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const validador = campo(r.validado_por, 80);
  return {
    m: {
      aula: id,
      aulaTitulo: aulas.get(id).titulo,
      palavra,
      palavraChave: norm(palavra),
      tema: campo(r.tema, 40) || aulas.get(id).tema || 'Sem tema',
      inicio,
      fim,
      duracao: Math.round((fim - inicio) * 10) / 10,
      /* o site mostra este estado no cartão: nunca o inventamos aqui */
      estado: validador ? 'confirmado' : 'a validar',
      validado_por: validador || undefined,
      quem: campo(r.quem || r.fonte, 80) || undefined,
      nota: campo(r.nota, 160) || undefined,
      marcadoEm: campo(r.marcadoEm, 30) || undefined,
    },
  };
}

/* ---------- 4. correr ---------- */
const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');
const soLista = argv.includes('--lista');
const ficheiros = argv.filter(a => !a.startsWith('--'));

if (!ficheiros.length) {
  console.error('Falta o caminho do(s) ficheiro(s). Exemplo:\n  node tools/ingerir-marcacoes.cjs ~/Downloads/pamosii-marcacoes-2026-10-22.json');
  process.exit(1);
}

const aulas = aulasConhecidas();
const anteriores = fs.existsSync(DESTINO)
  ? (JSON.parse(fs.readFileSync(DESTINO, 'utf8')).marcacoes || [])
  : [];

const porChave = new Map();   /* aula|palavra|inicio → marcação */
let novos = 0, juntados = 0, recusados = 0;

const acrescenta = (m, origem) => {
  const chave = [m.aula, m.palavraChave, m.inicio].join('|');
  const existente = porChave.get(chave);
  if (existente) {
    /* o registo mais rico ganha; o estado só sobe com validador, nunca desce */
    porChave.set(chave, {
      ...existente,
      ...Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined)),
      estado: existente.estado === 'confirmado' || m.estado === 'confirmado' ? 'confirmado' : 'a validar',
    });
    if (origem) { console.log('  † repetida (já vinha de ' + origem + '): ' + m.palavra + ' ' + fmtT(m.inicio)); }
    juntados++;
    return;
  }
  porChave.set(chave, m);
  if (origem) console.log('  + ' + m.palavra + ' ' + fmtT(m.inicio) + '→' + fmtT(m.fim) + ' [' + m.estado + '] · ' + m.aulaTitulo);
  novos++;
};

anteriores.forEach(m => { const r = limpa(m, aulas); if (!r.erro) acrescenta(r.m, null); else recusados++; });
const jaPublicadas = porChave.size;
novos = 0; juntados = 0; recusados = 0;   /* as contas do relatório são só deste lote */

ficheiros.forEach(caminho => {
  let lista;
  try { lista = leFicheiro(caminho); }
  catch (e) { console.error('✗ ' + e.message); recusados++; return; }
  console.log('\n' + path.basename(caminho) + ' — ' + lista.length + ' marcação(ões)');
  lista.forEach(r => {
    const res = limpa(r, aulas);
    if (res.erro) { console.log('  ✗ recusado: ' + res.erro); recusados++; return; }
    acrescenta(res.m, path.basename(caminho));
  });
});

const marcacoes = [...porChave.values()]
  .sort((a, b) => a.aulaTitulo.localeCompare(b.aulaTitulo, 'pt') || a.inicio - b.inicio);

const porAula = {};
const porPalavra = {};
marcacoes.forEach(m => {
  porAula[m.aulaTitulo] = (porAula[m.aulaTitulo] || 0) + 1;
  porPalavra[m.palavraChave] = (porPalavra[m.palavraChave] || 0) + 1;
});

const saida = {
  schema: SCHEMA_ESPERADO,
  tipo: 'pamosii-marcacoes',
  geradoEm: new Date().toISOString().slice(0, 10),
  nota: 'Gerado por tools/ingerir-marcacoes.cjs a partir de ficheiros exportados pela página /marcar. Não editar à mão: voltar a correr o ingestor. estado "a validar" = ninguém confirmou ainda que aquele momento do vídeo é o sinal daquela palavra; "confirmado" só com validado_por (pessoa surda sinalizadora).',
  total: marcacoes.length,
  palavrasDistintas: Object.keys(porPalavra).length,
  marcacoes,
};

console.log('\n' + (dry || soLista ? '[sem escrever]' : '→ ' + path.relative(RAIZ, DESTINO)));
console.log('  ' + marcacoes.length + ' marcações (' + novos + ' deste lote + ' + jaPublicadas + ' já publicadas, ' + juntados + ' duplicados juntados), '
  + Object.keys(porPalavra).length + ' palavras distintas, ' + recusados + ' recusadas.');
const cobertura = Object.entries(porAula).sort((a, b) => b[1] - a[1]);
if (cobertura.length) console.log('  por aula: ' + cobertura.map(([a, n]) => a + ' (' + n + ')').join(', '));
const confirmadas = marcacoes.filter(m => m.estado === 'confirmado').length;
console.log('  estado: ' + confirmadas + ' confirmadas por sinalizador, ' + (marcacoes.length - confirmadas) + ' a validar.');
if (!dry && !soLista) fs.writeFileSync(DESTINO, JSON.stringify(saida, null, 2) + '\n', 'utf8');
