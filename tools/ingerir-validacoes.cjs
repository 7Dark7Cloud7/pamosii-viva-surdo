/* tools/ingerir-validacoes.cjs — aplicar veredictos assinados ao dicionário publicado

   Uso:
     node tools/ingerir-validacoes.cjs caminho/do/pamosii-validacoes-2026-10-24.jsonl
     node tools/ingerir-validacoes.cjs a.jsonl b.json          (aceita JSONL e o JSON da mesma página)
     node tools/ingerir-validacoes.cjs --dry-run …             (mostra, não escreve)
     node tools/ingerir-validacoes.cjs --destino=ficheiro.json (escreve noutro sítio — serve para testes)
     node tools/ingerir-validacoes.cjs --mostra                (deita o glossário resultante no ecrã)

   Ordem do trabalho (docs/colheita-sinais-lga.md §6 e §7):
     1. /colher exporta um pacote  →  tools/ingerir-colheita.cjs  →  app/assets/glossario-extra.json
     2. #/validar exporta veredictos  →  ESTE script  →  os estados do mesmo ficheiro

   O que faz:
     1. lê uma ou mais exportações de #/validar (schema 1, `tipo: "pamosii-validacao"`);
     2. recusa tudo o que não vier assinado, ou assinado por quem não declarou usar LGA;
     3. por palavra, junta os veredictos de gente DIFERENTE (o mesmo apelido conta uma vez,
        e a última vez que essa pessoa mudou de ideia é a que vale);
     4. promove ou rejeita o termo já publicado, e escreve a proveniência no próprio termo;
     5. nunca toca no GLOSSÁRIO central de app/app.js — isso é trabalho humano com git.

   Regras de estado (as mesmas que a página promises a quem valida):
     1 assinador que usa LGA diz «correcto» ou «variante regional»  →  confirmado
     2 assinadores diferentes aprovam                                →  aprovado
     «errado» em maioria contra as aprovações                        →  rejeitado
     empate (1 contra 1, 2 contra 2)                                  →  nada se move:
        falta uma terceira opinião, e o script diz isso ao invés de escolher por nós.
     O estado nunca desce por accidente: só uma maioria de «errado» o derruba. */

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const DESTINO_PADRAO = path.join(RAIZ, 'app', 'assets', 'glossario-extra.json');
const SCHEMA_VALIDACAO = 1;

/* o vocabulário vive em app/app.js (VA_VEREDICTOS); tools/integridade-test.cjs compara
   as duas listas. Aqui entra o que cada veredicto VALE para o estado. */
const PESO = { correcto: 'aprova', variante: 'aprova', errado: 'rejeita' };
const ROTULO = { correcto: 'Correcto', variante: 'Variante regional', errado: 'Errado' };
const RANK = { colhido: 0, confirmado: 1, aprovado: 2, rejeitado: -1 };

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const campo = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

/* ---------- 1. ler a exportação (JSONL linha-a-linha, ou JSON com validacoes[]) ---------- */
function leValidacoes(caminho) {
  const bruto = fs.readFileSync(caminho, 'utf8');
  const nome = path.basename(caminho);
  let linhas = [];
  const talhado = /\.jsonl$/i.test(nome) || /\.ndjson$/i.test(nome) ? null : tenta(bruto);
  if (talhado) {
    if (talhado.schema && talhado.schema > SCHEMA_VALIDACAO) {
      throw new Error(nome + ': esquema ' + talhado.schema + ', este ingester só conhece a versão ' + SCHEMA_VALIDACAO);
    }
    const arr = Array.isArray(talhado.validacoes) ? talhado.validacoes
      : Array.isArray(talhado.termos) ? talhado.termos
      : Array.isArray(talhado) ? talhado : null;
    if (!arr) throw new Error(nome + ': sem `validacoes[]` — não é uma exportação de #/validar.');
    linhas = arr.map((o, i) => ({ o, de: nome + ' #' + (i + 1) }));
  } else {
    bruto.split(/\r?\n/).forEach((l, i) => {
      const s = l.trim();
      if (!s) return;
      let o;
      try { o = JSON.parse(s); } catch (e) { throw new Error(nome + ', linha ' + (i + 1) + ': JSON ilegível.'); }
      linhas.push({ o, de: nome + ':' + (i + 1) });
    });
  }
  return linhas;
}
function tenta(texto) {
  const t = String(texto).trim();
  if (!t || (t[0] !== '{' && t[0] !== '[')) return null;
  try { return JSON.parse(t); } catch (e) { return null; }
}

/* ---------- 2. limpar uma linha ---------- */
function limpa(o, de) {
  if (!o || typeof o !== 'object') return { erro: 'linha que não é objecto' };
  if (o.tipo && o.tipo !== 'pamosii-validacao') return { erro: 'tipo «' + o.tipo + '» não é uma validação' };
  if (Number(o.schema) > SCHEMA_VALIDACAO) {
    return { erro: 'esquema ' + o.schema + ' — este ingester só conhece a versão ' + SCHEMA_VALIDACAO + ' (actualizá-lo antes de confiar nisto)' };
  }
  const palavra = campo(o.palavra, 48);
  if (palavra.length < 2) return { erro: 'palavra ausente ou curta de mais' };
  const veredicto = campo(o.veredicto, 20);
  if (!PESO[veredicto]) return { erro: 'veredicto desconhecido: «' + veredicto + '» (esperava correcto / variante / errado)' };
  const assinou = campo(o.validado_por, 40);
  if (!assinou) return { erro: 'sem `validado_por`: um veredicto anónimo não move estado nenhum' };
  if (o.validadora_surda !== true) {
    return { erro: 'assinado por «' + assinou + '» sem a declaração de quem usa LGA: não se promove com esta assinatura' };
  }
  const em = campo(o.validado_em, 24);
  if (!/^\d{4}-\d{2}-\d{2}([T ]|\d|$)/.test(em)) return { erro: 'sem data de validação (`validado_em`): «' + (o.palavra || '') + '»' };
  return {
    v: {
      chave: norm(palavra),
      palavra,
      tema: campo(o.tema, 40) || 'Colheita',
      veredicto,
      por: assinou,
      regiao: campo(o.regiao, 40) || undefined,
      em,
      nota: campo(o.nota_validador, 400) || undefined,
      sessao: campo(o.sessao, 20) || undefined,
      reps: Number.isFinite(Number(o.reps)) ? Number(o.reps) : undefined,
      origem: campo(o.origem, 20) || undefined,
      estado_antes: campo(o.estado_antes, 20) || 'colhido',
    },
    de,
  };
}

/* ---------- 3. correr ---------- */
const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');
const mostra = argv.includes('--mostra');
const destinoArg = argv.find(a => a.startsWith('--destino='));
const DESTINO = destinoArg ? path.resolve(RAIZ, destinoArg.slice('--destino='.length)) : DESTINO_PADRAO;
const ficheiros = argv.filter(a => !a.startsWith('--'));

if (!ficheiros.length) {
  console.error('Falta o caminho da(s) exportação(ões) de #/validar. Exemplo:\n'
    + '  node tools/ingerir-validacoes.cjs ~/Downloads/pamosii-validacoes-2026-10-24.jsonl');
  process.exit(1);
}
if (!fs.existsSync(DESTINO)) {
  console.error('✗ ' + path.relative(RAIZ, DESTINO) + ' não existe. Corre primeiro tools/ingerir-colheita.cjs '
    + 'com o pacote de origem: as validações aplicam-se a termos já publicados.');
  process.exit(1);
}

const publicado = JSON.parse(fs.readFileSync(DESTINO, 'utf8'));
const termos = Array.isArray(publicado.termos) ? publicado.termos : [];
const porChave = new Map(termos.map(t => [norm(t.palavra), t]));

const recebidas = [];
let recusadas = 0;
ficheiros.forEach(caminho => {
  let linhas;
  try { linhas = leValidacoes(caminho); }
  catch (e) { console.error('✗ ' + e.message); process.exit(1); }
  console.log('\n' + path.basename(caminho) + ' — ' + linhas.length + ' linha(s)');
  linhas.forEach(l => {
    const r = limpa(l.o, l.de);
    if (r.erro) { console.log('  ✗ recusado (' + l.de + '): ' + r.erro); recusadas++; return; }
    recebidas.push(r.v);
  });
});

/* o mesmo apelido na mesma palavra: vale o veredicto mais recente (a pessoa corrigiu-se) */
const porPalavra = new Map();
recebidas.forEach(v => {
  const lista = porPalavra.get(v.chave) || [];
  lista.push(v);
  porPalavra.set(v.chave, lista);
});
porPalavra.forEach((lista, chave) => {
  const melhor = new Map();
  lista.forEach(v => {
    const atual = melhor.get(norm(v.por));
    if (!atual || String(v.em) > String(atual.em)) melhor.set(norm(v.por), v);
  });
  porPalavra.set(chave, [...melhor.values()].sort((a, b) => String(a.em).localeCompare(String(b.em))));
});

let movidos = 0, iguais = 0, empates = 0, pendentes = 0;
const resumo = [];
porPalavra.forEach((lista, chave) => {
  const aprova = lista.filter(v => PESO[v.veredicto] === 'aprova');
  const rejeita = lista.filter(v => PESO[v.veredicto] === 'rejeita');
  const termo = porChave.get(chave);
  if (!termo) {
    console.log('  ? «' + lista[0].palavra + '» não está publicado em ' + path.relative(RAIZ, DESTINO)
      + ' — primeiro tools/ingerir-colheita.cjs com o pacote de origem.');
    pendentes++;
    return;
  }
  let novo;
  if (aprova.length && aprova.length === rejeita.length) novo = null;
  else if (rejeita.length > aprova.length) novo = 'rejeitado';
  else if (aprova.length >= 2) novo = 'aprovado';
  else if (aprova.length === 1) novo = 'confirmado';
  else novo = null;

  if (novo === null) {
    console.log('  = «' + termo.palavra + '»: ' + aprova.length + ' aprovação(ões) contra ' + rejeita.length
      + ' rejeição(ões) — empate. Falta uma terceira opinião, nada se move.');
    empates++;
    return;
  }
  const antigo = termo.estado || 'colhido';
  /* descer só uma maioria de «errado»; subir nunca desperdiça trabalho feito */
  if (novo !== 'rejeitado' && RANK[novo] <= RANK[antigo]) {
    console.log('  · «' + termo.palavra + '» já está em ' + antigo + ': ' + lista.length
      + ' veredicto(s) registados, estado não desce.');
    iguais++;
  } else {
    termo.estado = novo;
    movidos++;
    console.log('  → «' + termo.palavra + '»: ' + antigo + ' → ' + novo
      + ' (por ' + lista.map(v => v.por + ' ' + v.veredicto).join(', ') + ')');
  }
  /* a proveniência vai no próprio termo: quem assinou, o que disse, e onde sinaliza */
  termo.validado_por = lista.map(v => v.por).join('; ').slice(0, 80);
  termo.validado_em = lista.map(v => v.em).sort().pop();
  termo.veredictos = lista.map(v => ({
    por: v.por, veredicto: v.veredicto, em: v.em,
    regiao: v.regiao, nota: v.nota, sessao: v.sessao,
  }));
  const variantes = lista.filter(v => v.veredicto === 'variante');
  if (variantes.length) {
    termo.variantes = variantes.map(v => (v.regiao ? v.regiao + ': ' : '') + (v.nota || 'variante registada')).slice(0, 4);
  }
  resumo.push({ palavra: termo.palavra, estado: novo || antigo, assinadores: lista.length, variantes: variantes.length });
});

/* a nota do ficheiro é reescrita de cada vez a partir do texto base: correr duas
   vezes não pode acumular a mesma frase duas vezes */
const MARCA = 'Veredictos de #/validar aplicados por tools/ingerir-validacoes.cjs';
const base = String(publicado.nota || '').split(MARCA)[0].trim();

const saida = {
  schema: publicado.schema || 1,
  tipo: publicado.tipo || 'pamosii-glossario-extra',
  geradoEm: new Date().toISOString().slice(0, 10),
  nota: base + ' ' + MARCA + ' em ' + new Date().toISOString().slice(0, 10)
    + ': "confirmado" = um assinador que usa LGA; "aprovado" = dois assinadores diferentes; '
    + '"rejeitado" = maioria de "errado" (não se ensina, mas fica cá para nova recolha).',
  termos,
};

const alvoRel = path.relative(RAIZ, DESTINO);
const alvoTxt = alvoRel.startsWith('..') ? DESTINO : alvoRel;
console.log('\n' + (dry ? '[dry-run] nada escrito em ' + alvoTxt + '.' : '→ ' + alvoTxt));
if (mostra) console.log(JSON.stringify(termos, null, 1));
console.log('  ' + movidos + ' termo(s) com estado movido, ' + iguais + ' já mais adiantado(s), '
  + empates + ' empate(s) à espera de terceira opinião, ' + pendentes
  + ' palavra(s) ainda não publicadas, ' + recusadas + ' linha(s) recusada(s).');
if (resumo.length) {
  console.log('  ' + resumo.map(r => r.palavra + ' [' + r.estado + ']').join(', '));
}
if (!dry) fs.writeFileSync(DESTINO, JSON.stringify(saida, null, 2) + '\n', 'utf8');
