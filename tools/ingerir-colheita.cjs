/* tools/ingerir-colheita.cjs — transformar pacotes da Colheita em dicionário publicado

   Uso:
     node tools/ingerir-colheita.cjs caminho/do/pamosii-colheita-2026-10-22.json [outro.json ...]
     node tools/ingerir-colheita.cjs caminho/do/pamosii-sessoes-2026-10-22.jsonl   (uma linha por repetição)
     node tools/ingerir-colheita.cjs --dry-run   …   (mostra o que faria, não escreve)

   O que faz:
     1. lê um ou mais pacotes exportados pela página /colher (schema 1) — JSON ou JSONL;
     2. limpa e valida cada termo (palavra, tema, URL, comprimento);
     3. tira as fotografias (base64) — ficam no aparelho de quem colheu, nunca no site;
     4. deduplica contra o GLOSSÁRIO central lido de app/app.js e contra o que já
        está publicado em app/assets/glossario-extra.json;
     5. escreve o ficheiro publicado e conta o que entrou / o que foi recusado.

   Regras de integridade (as mesmas do site):
     - UM SINAL SÓ FICA "confirmado" se o registo trouxer `validado_por` com o nome de
       um sinalizador surdo. Sem isso, entra como "colhido" — e a página diz isso.
     - uma sessão de gravação sem `consentimento` registado é recusada: a recolha só
       entra no dicionário se a pessoa que sinalizou tiver concordado antes.
     - o script não envia nada a lado nenhum nem pede dados pessoais. */

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const FICHEIRO_APP = path.join(RAIZ, 'app', 'app.js');
const DESTINO = path.join(RAIZ, 'app', 'assets', 'glossario-extra.json');
const SCHEMA_ESPERADO = 1;
/* O JSONL de sessões tem esquema próprio (SCHEMA_SESSAO em app/app.js):
   1 = sem `qualidade`; 2 = cada repetição traz os números do verificador de gravação. */
const SCHEMA_SESSAO_MAX = 2;

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/* ---------- 1. o glossário central, para não publicar duplicados ---------- */
function glossarioCentral() {
  const fonte = fs.readFileSync(FICHEIRO_APP, 'utf8');
  const inicio = fonte.indexOf('const GLOSSARIO = [');
  if (inicio < 0) throw new Error('Não encontrei `const GLOSSARIO = [` em app/app.js — o formato mudou.');
  const fim = fonte.indexOf('].map(', inicio);
  const bloco = fonte.slice(inicio, fim);
  const chaves = new Set();
  bloco.split('\n').forEach(linha => {
    const sep = linha.indexOf('termos:');
    if (sep < 0) return;
    const cauda = linha.slice(sep);
    (cauda.match(/'[^']*'/g) || []).forEach(s => {
      const v = s.slice(1, -1).trim();
      if (v) chaves.add(norm(v));
    });
    /* alfabeto e números são gerados por código, não são listas de palavras */
    if (/split\(''\)/.test(cauda)) 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c => chaves.add(norm(c)));
    const arr = cauda.match(/length:\s*(\d+)/);
    if (arr) Array.from({ length: Number(arr[1]) }, (_, i) => String(i)).forEach(n => chaves.add(n));
  });
  const meses = fonte.match(/const MESES\s*=\s*\[([^\]]*)\]/);
  if (meses) (meses[1].match(/'[^']*'/g) || []).forEach(s => chaves.add(norm(s.slice(1, -1))));
  return chaves;
}

/* ---------- 2. leitura e limpeza de um pacote (JSON da Colheita ou JSONL de sessões) ---------- */
function leJsonl(bruto) {
  const linhas = String(bruto).split('\n').map(l => l.trim()).filter(Boolean);
  const porPalavra = new Map();
  let maus = 0, futuro = 0;
  linhas.forEach(l => {
    let o;
    try { o = JSON.parse(l); } catch (e) { maus++; return; }
    if (!o || o.tipo !== 'pamosii-sessao' || !o.palavra) { maus++; return; }
    if (Number(o.schema) > SCHEMA_SESSAO_MAX) {
      futuro++;
      return;
    }
    const chave = norm(o.palavra);
    if (!porPalavra.has(chave)) {
      porPalavra.set(chave, {
        palavra: o.palavra, tema: o.tema, estado: o.estado, validado_por: o.validado_por,
        configuracao: o.configuracao, lugar: o.lugar, movimento: o.movimento, mnm: o.mnm,
        fonte: o.fonte, nota: o.nota, video: o.video, data: o.data,
        sessao: { id: o.sessao, completa: o.completa, consentimento: o.consentimento, audio: o.audio, repeticoes: [] },
      });
    }
    const t = porPalavra.get(chave);
    t.sessao.repeticoes.push({ rep: o.rep, ritmo: o.ritmo, dur_ms: o.dur_ms, quadros: (o.quadros || []).length,
      qualidade: o.qualidade && typeof o.qualidade === 'object' ? o.qualidade : null });
    /* o registo que a pessoa encheu depois da gravação é o mais completo: não o estragar */
    ['configuracao', 'lugar', 'movimento', 'mnm', 'fonte', 'nota', 'video', 'validado_por'].forEach(k => {
      if (o[k] && !t[k]) t[k] = o[k];
    });
    if (o.completa) t.sessao.completa = true;
  });
  if (maus) console.log('  ! ' + maus + ' linha(s) ilegais ignoradas.');
  if (futuro) console.log('  ! ' + futuro + ' linha(s) com esquema acima de ' + SCHEMA_SESSAO_MAX
    + ' ignoradas — este ingestor é mais velho que o exportador; actualizá-lo antes de confiar no resto.');
  const entrada = [...porPalavra.values()];
  return { termos: entrada, lacunas: {}, sessoes: entrada.length };
}

function lePacote(caminho) {
  const bruto = fs.readFileSync(caminho, 'utf8');
  if (/\.jsonl$/i.test(caminho) || /\.ndjson$/i.test(caminho)) return leJsonl(bruto);
  const dados = JSON.parse(bruto);
  if (dados.schema && dados.schema > SCHEMA_ESPERADO) {
    throw new Error(path.basename(caminho) + ': schema ' + dados.schema + ', este ingestor só conhece a versão ' + SCHEMA_ESPERADO);
  }
  const termos = Array.isArray(dados.entrada) ? dados.entrada
    : Array.isArray(dados.termos) ? dados.termos : null;
  if (!termos) throw new Error(path.basename(caminho) + ': sem `entrada[]` nem `termos[]` — não é um pacote da Colheita.');
  return { termos, lacunas: dados.lacunas && typeof dados.lacunas === 'object' ? dados.lacunas : {} };
}

function limpa(t) {
  const palavra = String(t.palavra || '').replace(/\s+/g, ' ').trim();
  if (palavra.length < 2) return { erro: 'palavra ausente ou curta de mais' };
  if (palavra.length > 48) return { erro: 'palavra com mais de 48 caracteres' };
  const url = String(t.video || '').trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) return { erro: 'URL do vídeo inválido: ' + url.slice(0, 40) };
  const campo = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const s = t.sessao && Array.isArray(t.sessao.repeticoes) && t.sessao.repeticoes.length ? t.sessao : null;
  if (s && !(s.consentimento && s.consentimento.em)) {
    return { erro: 'sessão de gravação sem consentimento registado: não se publica imagem de alguém sem isso' };
  }
  const segundos = s ? Math.round(s.repeticoes.reduce((n, r) => n + Number(r.dur_ms || 0), 0) / 1000) : undefined;
  /* o verificador de gravação (schema 2): queixas repetidas em ≥40% das amostras de uma
     repetição. É sobre o VÍDEO (luz, contraste, nitidez, movimento), nunca sobre o sinal
     estar certo — continuar a não confundir as duas coisas. */
  const comBandeira = s ? s.repeticoes.filter(r => r.qualidade && Array.isArray(r.qualidade.bandeiras) && r.qualidade.bandeiras.length) : [];
  const regravar = comBandeira.map(r => r.rep + 'ª:' + r.qualidade.bandeiras.join('/'));
  const leitura = s ? s.repeticoes.filter(r => r.qualidade).map(r => r.rep + 'ª '
    + ['luz ' + r.qualidade.brilho, 'contr ' + r.qualidade.contraste,
       'nitid ' + r.qualidade.nitidez, 'mov ' + r.qualidade.movimento].join(' ')) : [];
  return {
    termo: {
      palavra,
      tema: campo(t.tema, 40) || 'Colheita',
      /* só a validação humana sobe o estado — o site nunca promete o contrário */
      estado: (t.estado === 'confirmado' && String(t.validado_por || '').trim()) ? 'confirmado' : 'colhido',
      validado_por: campo(t.validado_por, 80) || undefined,
      configuracao: campo(t.configuracao, 120) || undefined,
      lugar: campo(t.lugar, 120) || undefined,
      movimento: campo(t.movimento, 120) || undefined,
      mnm: campo(t.mnm, 160) || undefined,
      fonte: campo(t.fonte, 120) || undefined,
      video: url || undefined,
      nota: campo(t.nota, 400) || undefined,
      data: campo(t.data, 10) || undefined,
      tem_fotos: Array.isArray(t.fotos) && t.fotos.length ? t.fotos.length : undefined,
      /* a sessão de gravação: quantas repetições, se a lenta lá está, quanto tempo de sinal
         (é com estes segundos que se paga a quem sinaliza), e quem autorizou */
      sessao: s ? {
        id: campo(s.id, 20),
        rep: s.repeticoes.length,
        lenta: s.repeticoes.some(r => r.ritmo === 'lento'),
        completa: !!s.completa,
        segundos,
        quadros: s.repeticoes.reduce((n, r) => n + Number(r.quadros || 0), 0),
        quem: s.consentimento.quem === 'outra' ? 'outra pessoa' : 'a própria pessoa',
        audio: s.audio === false ? 'não' : String(s.audio || '—'),
        consentido_em: campo(s.consentimento.em, 24),
        regravar: regravar.length ? regravar : undefined,
        leitura: leitura.length ? leitura.join(' · ') : undefined,
      } : undefined,
    },
  };
}

/* ---------- 3. correr ---------- */
const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');
const mostra = argv.includes('--mostra');
const ficheiros = argv.filter(a => !a.startsWith('--'));

if (!ficheiros.length) {
  console.error('Falta o caminho do(s) pacote(s). Exemplo:\n  node tools/ingerir-colheita.cjs ~/Downloads/pamosii-colheita-2026-10-22.json');
  process.exit(1);
}

const central = glossarioCentral();
const publicados = fs.existsSync(DESTINO)
  ? (JSON.parse(fs.readFileSync(DESTINO, 'utf8')).termos || [])
  : [];

const porChave = new Map();
publicados.forEach(t => porChave.set(norm(t.palavra), t));

let novos = 0, repetidos = 0, jaCentrais = 0, recusados = 0;
const lacunasTotais = {};

ficheiros.forEach(caminho => {
  let pacote;
  try { pacote = lePacote(caminho); }
  catch (e) { console.error('✗ ' + e.message); recusados++; return; }
  console.log('\n' + path.basename(caminho) + ' — ' + pacote.termos.length + ' registo(s)');
  Object.entries(pacote.lacunas).forEach(([w, n]) => { lacunasTotais[norm(w)] = (lacunasTotais[norm(w)] || 0) + Number(n || 0); });

  pacote.termos.forEach(t => {
    const r = limpa(t);
    if (r.erro) { console.log('  ✗ recusado: ' + r.erro); recusados++; return; }
    const chave = norm(r.termo.palavra);
    if (central.has(chave)) { console.log('  · já no glossário central: ' + r.termo.palavra); jaCentrais++; return; }
    const existente = porChave.get(chave);
    if (existente) {
      /* o registo mais rico ganha, mas o estado nunca desce nem sobe sem validação */
      porChave.set(chave, {
        ...existente,
        ...Object.fromEntries(Object.entries(r.termo).filter(([, v]) => v !== undefined)),
        estado: existente.estado === 'confirmado' ? 'confirmado' : r.termo.estado,
      });
      console.log('  † juntado ao que já estava publicado: ' + r.termo.palavra);
      repetidos++;
      return;
    }
    porChave.set(chave, r.termo);
    console.log('  + ' + r.termo.palavra + ' [' + r.termo.estado + '] · ' + r.termo.tema
      + (r.termo.sessao && r.termo.sessao.regravar ? ' · regravar: ' + r.termo.sessao.regravar.join(', ') : ''));
    novos++;
  });
});

const termos = [...porChave.values()]
  .sort((a, b) => a.tema.localeCompare(b.tema, 'pt') || a.palavra.localeCompare(b.palavra, 'pt'));

const saida = {
  schema: SCHEMA_ESPERADO,
  tipo: 'pamosii-glossario-extra',
  geradoEm: new Date().toISOString().slice(0, 10),
  nota: 'Gerado por tools/ingerir-colheita.cjs a partir de pacotes exportados pela página /colher. Não editar à mão: voltar a correr o ingestor. estado "colhido" = ainda sem revisão de um sinalizador surdo angolano; as fotografias enviadas na colheita ficam no aparelho de quem as tirou (o campo tem_fotos diz quantas).',
  termos,
};

console.log('\n' + (dry ? '[dry-run] nada escrito.' : '→ ' + path.relative(RAIZ, DESTINO)));
if (mostra) console.log(JSON.stringify(termos, null, 1));
console.log('  ' + novos + ' novo(s), ' + repetidos + ' juntado(s), ' + jaCentrais + ' já no glossário central, ' + recusados + ' recusado(s).');
if (Object.keys(lacunasTotais).length) {
  const top = Object.entries(lacunasTotais).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('  palavras sem sinal mais pedidas: ' + top.map(([w, n]) => w + ' (' + n + '×)').join(', '));
}
if (!dry) fs.writeFileSync(DESTINO, JSON.stringify(saida, null, 2) + '\n', 'utf8');
