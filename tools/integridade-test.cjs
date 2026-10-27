/* Integridade do Pamosii — teste de regressão
   ----------------------------------------------------------------------------
   Falha quando a interface afirma o que o código não faz. As regras vêm do brief
   do projecto (README, "Regras do projecto") e das notas do conselheiro:

     - nunca dizer que o site traduz automaticamente fala<->LGA, ou reconhece
       sinais por camera/voz, se nao houver tecnologia implementada E validada;
     - nunca dizer que um sinal esta "validado" pela comunidade surda;
     - nunca usar "pessoas normais";
     - nunca inventar dados de demonstracao (precos, depoimentos, mentores, contas);
     - nunca afirmar que a UNICEF opera ou patrocina este site;
     - nunca publicar chaves/credenciais no frontend;
     - nunca reutilizar texto da Open Minds Academy.

   Nao precisa de browser: le os ficheiros. Corre com `node tools/integridade-test.cjs`
   e sai com codigo 1 se alguma regra for quebrada -- e para isso que serve.      */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'app');
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');

const app = ler('app.js');
const html = ler('index.html');
const css = ler('styles.css');
const sw = ler('sw.js');
const manifest = JSON.parse(ler('manifest.webmanifest'));

const falhas = [];
const avisos = [];
const note = m => avisos.push(m);

/* ------------------------------------------------------------------ 1. claims */

/* comentario de codigo nao e uma promessa a quem usa o site: a propria lista de
   regras vive em comentarios, e nao queremos que o teste chumbe por isso */
function semComentarios(t) {
  return String(t)
    /* "video/*" num atributo accept não é um comentário: sem isto, a expressão
       seguinte abria um comentário falso e engolia o resto do ficheiro. */
    .replace(/accept="[^"]*"/g, 'accept=""')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1 ');
}

const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').normalize('NFC');

/* Uma expressao proibida so e falha se for AFIRMADA. «Nada disto traduz
   automaticamente» cumpre a regra; «este site traduz automaticamente» viola-a.
   Por isso olhamos para a frase onde a expressao aparece e aceitamo-la quando
   ha uma negacao antes dela, na mesma frase. */
const NEGACAO = /(n[aã]o|nem\b|nunca\b|sem\b|nenhuma?\b|jamais\b|em vez de\b|ao inv[ée]s\b|fals[oe]|imposs[íi]vel|proibid|evit|corrig|deixa de|em vez)/;
function afirmacaoProibida(texto, frase) {
  const alvo = norm(frase);
  let i = -1;
  while ((i = texto.indexOf(alvo, i + 1)) >= 0) {
    const cortes = [texto.lastIndexOf('.', i), texto.lastIndexOf(';', i), texto.lastIndexOf('!', i),
      texto.lastIndexOf('?', i), texto.lastIndexOf('\n', i), texto.lastIndexOf('—', i),
      texto.lastIndexOf(':', i), texto.lastIndexOf(')', i)];
    const inicio = Math.max.apply(null, cortes);
    const antes = texto.slice(inicio + 1, i);
    if (!NEGACAO.test(antes)) return antes + ' >>> ' + texto.slice(i, i + alvo.length + 45);
  }
  return null;
}

const PROIBIDAS = [
  ['traduz automaticamente', 'afirma traducao automatica; o Pamosii faz glosa de estudo'],
  ['traducao automatica de fala', 'afirma traducao de fala; nao ha reconhecimento de voz'],
  ['reconhece sinais', 'afirma leitura de sinais por camera; nao existe'],
  ['reconhece a sua lingua gestual', 'afirma reconhecimento; nao existe'],
  ['converte a voz', 'afirma voz->texto/sinais; nao existe'],
  ['inteligencia artificial que traduz', 'afirma IA tradutora; nao existe'],
  ['validado pela comunidade surda', 'afirma validacao; o estado maximo e "colhido"/"A validar"'],
  ['traducao instantanea', 'promessa de instantaneidade'],
  ['pessoas normais', 'linguagem capacitista; usar "pessoas ouvintes"'],
  ['open minds', 'texto da Open Minds Academy que nao devia ter ficado'],
  ['unicef e a operadora', 'a UNICEF nao opera o site'],
  ['patrocinado pela unicef', 'a UNICEF nao patrocina este site'],
];

const corpo = norm([app, html, css].map(semComentarios).join('\n '));
/* o removedor de comentários é simples por propósito: um `/*` escrito dentro de um
   atributo HTML (accept="video/*") comeria o código até ao próximo `*/`, e as claims
   dessa zona deixariam de ser vistas. Um sentinela perto do fim do ficheiro prova que
   a varredura não engoliu nada. */
if (!corpo.includes('ouvir com o microfone')) {
  falhas.push('A varredura de comentários perdeu o texto de #/ouvir: há provavelmente um `/*` dentro de um atributo — usa listas de tipos explícitas em vez de `video/*`.');
}
for (const [frase, porque] of PROIBIDAS) {
  const contexto = afirmacaoProibida(corpo, frase);
  if (contexto) falhas.push('CLAIM proibida (afirmada, nao negada): «' + frase + '» — ' + porque +
    '\n    contexto: …' + contexto.replace(/\n/g, ' ').slice(-200) + '…');
}

/* o contrario tambem se verifica: os avisos honestos nao podem desaparecer */
if (!app.includes('A validar')) falhas.push('Perdemos o aviso «A validar» do Signer/dicionario.');
if (!/n[aã]o [eé] tradu/i.test(app)) falhas.push('Perdemos a frase que diz que o Pamosii nao e traducao automatica.');
if (!/em breve/i.test(app)) falhas.push('Perdemos o estado honesto «Em breve» para o que ainda nao existe.');

/* nenhuma palavra do glossario pode chegar a "validado" por via deste codigo */
const estados = [...app.matchAll(/estado:\s*'([^']+)'/g)].map(m => m[1]);
const illegais = [...new Set(estados.filter(e => /validad/i.test(e) && !/por validar/i.test(e)))];
if (illegais.length) falhas.push('Estados de validacao inventados no codigo: ' + illegais.join(', '));

/* ------------------------------------------------------------- 2. credenciais */
const SEGREDAS = [
  /sk-[A-Za-z0-9]{16,}/,
  /AIza[0-9A-Za-z_\-]{30,}/,
  /xox[baprs]-[0-9A-Za-z-]{10,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[0-9A-Za-z]{30,}/,
  /github_pat_[0-9A-Za-z_]{40,}/,
];
for (const [nome, texto] of [['app.js', app], ['index.html', html], ['styles.css', css], ['sw.js', sw]]) {
  for (const re of SEGREDAS) if (re.test(texto)) falhas.push('Possivel credencial em ' + nome + ' (' + re + ')');
}
if (/(?:apiKey|api_key|API_KEY)\s*[:=]/.test(app)) falhas.push('Aparece algo com cara de chave de API no frontend.');

/* --------------------------------------------------- 3. dados de demonstracao */
const DEMO = [
  [/\bKz\s?[\d.,]+\s*(?:por|\/|de mensalidade)/i, 'preco em kwanzas'],
  [/\bR\$\s?[\d.,]+/i, 'preco em reais'],
  [/depoim?ento/i, 'depoimento inventado'],
  [/[\d.]+\s*(?:estudantes|alunos)\s+(?:matriculados|activos|ativos)/i, 'contagem de alunos inventada'],
  [/junte[\s-]se a [\d.]+ (?:pessoas|alunos)/i, 'numero de inscritos inventado'],
  [/mentor(?:a|es)?\s+(?:verificad|certific)/i, 'mentores inventados'],
];
for (const [re, porque] of DEMO) {
  const m = corpo.match(re);
  if (!m) continue;
  const antes = corpo.slice(Math.max(0, m.index - 90), m.index);
  if (NEGACAO.test(antes)) continue;
  falhas.push('Parece dado de demonstracao (' + porque + '): …' +
    corpo.slice(Math.max(0, m.index - 40), m.index + 60) + '…');
}

/* ------------------------------------------------- 4. ligacoes internas mortas */
const rotas = [...app.matchAll(/^on\('([^']+)'[,\s]/gm)].map(m => m[1]);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regexRota = r => new RegExp('^' + esc(r).replace(/:[^/]+/g, '[^/]+') + '$');
const hrefs = [...new Set([...app.matchAll(/#\/([a-z0-9:._-]+)/gi), ...html.matchAll(/#\/([a-z0-9:._-]+)/gi)].map(m => '/' + m[1]))];
const partidas = hrefs.filter(h => !h.includes(':') && !rotas.some(r => regexRota(r).test(h)));
if (partidas.length) falhas.push('Ligacoes internas sem rota registada: ' + partidas.join(', '));

const navPaths = [...new Set([...app.matchAll(/\{\s*path:\s*'([^']+)'/g)].map(m => m[1]))];
const navPartidas = navPaths.filter(p => !rotas.some(r => r === p || (r.includes(':') && regexRota(r).test(p))));
if (navPartidas.length) falhas.push('Item de menu sem vista: ' + navPartidas.join(', '));

/* ---------------------------------------------- 5. ficheiros locais referidos */
const refs = [...new Set([...app.matchAll(/["'(]((?:assets|extensao)\/[A-Za-z0-9._\-/]+)["')]/g)].map(m => m[1]))]
  .filter(r => /\.(?:png|jpg|jpeg|svg|webp|gif|json|zip|webmanifest)$/.test(r));
for (const r of refs) {
  if (!fs.existsSync(path.join(RAIZ, r))) falhas.push('Referencia a ficheiro local que nao existe: ' + r);
}

/* -------------------------------------------------------- 6. versao do offline */
const versaoSW = (sw.match(/const VERSAO = '([^']+)'/) || [])[1];
const versoesHtml = [...new Set([...html.matchAll(/[?&]v=(vs\d+)/g)].map(m => m[1]))];
if (!versaoSW) falhas.push('sw.js sem const VERSAO.');
if (versoesHtml.length !== 1) falhas.push('index.html com mais do que uma versao: ' + versoesHtml.join(', '));
if (versaoSW && versoesHtml[0] && versaoSW !== versoesHtml[0]) {
  falhas.push('Offline desactualizado: sw.js e ' + versaoSW + ' mas o index pede ' + versoesHtml[0] + '.');
}
/* o casulo pre-guarda estas duas chaves na forma versionada; se algum lado mudar
   (sw sem ?v=, ou index a chamar o ficheiro limpo) o offline serve ficheiro velho */
for (const ficheiro of ['styles.css', 'app.js']) {
  if (!new RegExp("'\\./" + ficheiro + "\\?v=' \\+ VERSAO").test(sw)) {
    falhas.push('sw.js nao pre-guarda ' + ficheiro + ' na chave versionada (?v= + VERSAO).');
  }
  if (!new RegExp(ficheiro.replace('.', '\\.') + '\\?v=' + versaoSW).test(html)) {
    falhas.push('index.html nao pede ' + ficheiro + ' com ?v=' + versaoSW + ' — o casulo nao acertaria.');
  }
}

/* ------------------------------------------------------------- 7. acessibilidade */
const iframesHTML = [...app.matchAll(/<iframe\b[^>]*>/gi)].map(m => m[0]);
for (const f of iframesHTML) if (!/title=/.test(f)) falhas.push('iframe sem titulo: ' + f.slice(0, 80));
const imgs = [...app.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
for (const i of imgs) if (!/\balt=/.test(i)) falhas.push('<img> sem alt: ' + i.slice(0, 80));
if (/<(?:video|audio)\b[^>]*autoplay/i.test(app)) falhas.push('Ha <video>/<audio> com autoplay — proibido pelo brief.');
if (!/prefers-reduced-motion/.test(css)) falhas.push('O CSS deixou de respeitar prefers-reduced-motion.');
if (!/:focus-visible/.test(css)) falhas.push('O CSS deixou de ter foco visivel (:focus-visible).');
if (!/aria-live/.test(app)) falhas.push('Desapareceram as regioes aria-live (anuncio de rota, estados).');
if (!/data-contraste-alto/.test(css)) falhas.push('Desapareceu o modo de contraste alto.');
if (!/skip/.test(html)) falhas.push('Desapareceu o link "Saltar para o conteudo".');

/* ------------------------------------------------- 7b. verificador de qualidade */
if (/sess-qual-linha/.test(app)) {
  /* A faixa mostra numeros. Se o texto do «o que nao medimos» desaparecer, a interface passa
     a sugerir que sabemos se as maos cabem no quadro — e isso o codigo nao sabe. */
  if (!/O que <strong>n[aã]o<\/strong> medimos/.test(app)) {
    falhas.push('O verificador de qualidade mostra numeros sem dizer o que NAO mede (enquadramento).');
  }
  if (!/QUAL_LIMIAR/.test(app) || !/bandeiras/.test(app)) {
    falhas.push('O verificador deixou de produzir o resumo (`bandeiras`) que o ingestor le.');
  }
  const ing = fs.readFileSync(path.join(__dirname, '..', 'tools', 'ingerir-colheita.cjs'), 'utf8');
  const sq = app.match(/SCHEMA_SESSAO\s*=\s*(\d+)/);
  const si = ing.match(/SCHEMA_SESSAO_MAX\s*=\s*(\d+)/);
  if (!si) falhas.push('tools/ingerir-colheita.cjs ja nao declara SCHEMA_SESSAO_MAX — nao se sabe que esquema le.');
  else if (sq && Number(si[1]) < Number(sq[1])) {
    falhas.push('app.js exporta sessoes com schema ' + sq[1] + ' mas o ingestor so le ate ' + si[1] + ' — os ficheiros novos passariam a ser recusados.');
  }
}

/* ------------------------------------------------------------ 8. partilha/emb */
if (!manifest.share_target) {
  falhas.push('manifest sem share_target: o «Partilhar para o Pamosii» do Android deixou de existir.');
} else {
  const st = manifest.share_target;
  if (st.method !== 'GET' && st.method !== 'POST') falhas.push('share_target com metodo invalido: ' + st.method);
  for (const k of ['title', 'text']) {
    if (!st.params || !st.params[k]) falhas.push('share_target sem parametro «' + k + '»: o texto partilhado perde-se.');
  }
  if (!/[?&](?:title|text|url)=/.test(app)) falhas.push('O codigo deixou de ler os parametros do share_target.');
}
if (!/[?&]emb=1/.test(app)) falhas.push('O modo widget (?emb=1) desapareceu — a extensao e os iframes ficam sem superficie.');
if (!/pamosii-sinalizar/.test(app)) falhas.push('O canal de postMessage do painel desapareceu.');
if (!/SG_EMB_MAX/.test(app)) falhas.push('Desapareceu o limite de caracteres do texto recebido de fora.');
if (!/sgApontarLigar|sgTrechoApontado/.test(app)) falhas.push('O modo apontar do Signer desapareceu do site.');

/* o painel incorporavel NAO pode aceitar ordens fora de um iframe */
const ouvinte = app.slice(app.lastIndexOf("addEventListener('message'"));
if (!/EM_IFRAME/.test(ouvinte.slice(0, 900))) falhas.push('O ouvinte de mensagens nao verifica se estamos dentro de um iframe.');

/* --------------------------------------------------------- 9. extensao Chrome */
const dirExt = path.join(__dirname, '..', 'extension');
if (!fs.existsSync(dirExt)) {
  falhas.push('A pasta extension/ desapareceu.');
} else {
  const mf = JSON.parse(fs.readFileSync(path.join(dirExt, 'manifest.json'), 'utf8'));
  const c = fs.readFileSync(path.join(dirExt, 'content.js'), 'utf8');
  const b = fs.readFileSync(path.join(dirExt, 'background.js'), 'utf8');
  if (mf.manifest_version !== 3) falhas.push('Extensao nao e MV3.');
  if (Array.isArray(mf.permissions) && mf.permissions.length) falhas.push('A extensao passou a pedir permissoes: ' + mf.permissions.join(', '));
  if (Array.isArray(mf.host_permissions) && mf.host_permissions.length) falhas.push('A extensao passou a pedir host_permissions: ' + mf.host_permissions.join(', '));
  if (/<all_urls>/.test(JSON.stringify(mf))) falhas.push('A extensao pediu acesso a todos os sites.');
  for (const [re, nome] of [[/[^.\w]fetch\(/, 'fetch'], [/XMLHttpRequest/, 'XMLHttpRequest'],
    [/navigator\.sendBeacon/, 'sendBeacon'], [/localStorage/, 'localStorage'],
    [/indexedDB/i, 'indexedDB'], [/chrome\.storage/, 'chrome.storage']]) {
    if (re.test(c)) falhas.push('content.js da extensao usa ' + nome + ' — pode ser dados a sair do aparelho.');
  }
  if (!/mode:\s*'closed'/.test(c)) falhas.push('O shadow root da extensao passou a ser aberto: a pagina anfitria consegue ler por dentro.');
  if (!/ev\.origin\s*!==/.test(c)) falhas.push('content.js deixou de verificar a origem das mensagens do painel.');
  if (!/pamosii-signer-pronto/.test(c)) falhas.push('content.js deixou de esperar que o painel esteja pronto.');
  if (!/window\.top\s*!==\s*window/.test(c)) falhas.push('content.js deixou de ignorar iframes de outros sites.');
  const bSemCom = b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (/fetch\(|XMLHttpRequest|localStorage/.test(bSemCom)) falhas.push('background.js faz rede ou guarda dados.');
  const declarados = []
    .concat(mf.background && mf.background.service_worker ? [mf.background.service_worker] : [])
    .concat((mf.content_scripts || []).flatMap(s => (s.js || []).concat(s.css || [])))
    .concat(Object.values((mf.icons || {})))
    .concat(Object.values(((mf.action || {}).default_icon) || {}));
  for (const f of new Set(declarados)) {
    if (!fs.existsSync(path.join(dirExt, f))) falhas.push('manifest.json da extensao declara ' + f + ', que nao esta na pasta.');
  }
}

/* ------------------------------------------------------------ 10. marcacoes */
/* a ferramenta de marcacao nao pode marcar nada como validada por si propria */
const linhasEstado = app.split('\n').filter(l => /estadoGloss[áa]rio/.test(l));
if (linhasEstado.some(l => /=\s*['"]validado['"]/.test(l))) falhas.push('A marcacao escreve estado "validado".');
if (!/por validar/.test(app)) falhas.push('O estado inicial «por validar» desapareceu das marcacoes.');

/* -------------------------------------------------- 11. sessao de gravacao */
/* o protocolo da recolha: consentimento antes do primeiro quadro, tres repeticoes
   (uma lenta), duracao registada (e com a duracao que se paga), revogacao que apaga */
const blocoSessao = (function () {
  const a = app.indexOf('const SCHEMA_SESSAO');
  const b = app.indexOf('function vistaColheita', a);
  return a >= 0 && b > a ? app.slice(a, b) : '';
})();
if (!blocoSessao) falhas.push('A sessao de gravacao desapareceu do codigo de /colher.');
if (blocoSessao) {
  if (!/audio:\s*false/.test(blocoSessao)) falhas.push('A sessao de gravacao ja nao pede a camera sem audio.');
  const reps = blocoSessao.match(/const SESS_REPS = \[([\s\S]*?)\];/);
  if (!reps) falhas.push('SESS_REPS desapareceu: ja nao ha repeticoes definidas.');
  else {
    const lentas = (reps[1].match(/lento/g) || []).length;
    const normais = (reps[1].match(/normal/g) || []).length;
    /* docs/colheita-sinais-lga.md §3: tres ao ritmo natural + uma lenta = quatro */
    if (lentas !== 1) falhas.push('A sessao tem de ter exactamente uma repeticao lenta (agora: ' + lentas + ').');
    if (normais !== 3) falhas.push('A sessao tem de ter tres repeticoes ao ritmo natural (agora: ' + normais + ').');
    if (lentas + normais !== 4) falhas.push('A sequencia da sessao nao sao 4 repeticoes como o protocolo pede.');
  }
  if (!/sess-revogar/.test(blocoSessao)) falhas.push('Desapareceu o botao de revogar a gravacao.');
  if (!/consentimento/.test(blocoSessao)) falhas.push('A sessao deixou de registar o consentimento.');
  if (!/autoriza/.test(blocoSessao) || !/pagamento/.test(blocoSessao)) {
    falhas.push('A sessao deixou de dizer que publicar exige autorizacao escrita e pagamento a quem sinaliza.');
  }
  if (!/dur_ms/.test(blocoSessao)) falhas.push('A sessao deixou de gravar a duracao de cada repeticao (base do pagamento).');
  if (/de 3 ·/.test(blocoSessao)) falhas.push('Ha texto com «de 3» escrita a mao: o numero de repeticoes vive em SESS_REPS.');
  if (!/application\/x-ndjson/.test(blocoSessao)) falhas.push('A exportacao JSONL das sessoes desapareceu.');
  if (!/pamosii-sessao/.test(blocoSessao)) falhas.push('O registo JSONL perdeu o tipo pamosii-sessao.');
  /* nenhuma palavra da sessao pode sair do aparelho */
  const semCom = blocoSessao.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (/navigator\.sendBeacon|XMLHttpRequest|method:\s*['"]POST/.test(semCom)) {
    falhas.push('O codigo da sessao faz envios de rede.');
  }
  if (!/validar/.test(semCom)) falhas.push('A sessao deixou de dizer que so um sinalizador surdo pode validar.');
}
if (!/pararSessao\(\);/.test(app)) falhas.push('A sessao deixou de ser desligada quando se muda de rota (a camera ficava ligada).');
if (!/estado:\s*'colhido'/.test(blocoSessao)) falhas.push('A sessao ja nao marca o sinal como colhido (nunca validado).');

/* nada no site pode enviar dados de recolha para lado nenhum */
const appSemCom = app.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
if (/navigator\.sendBeacon/.test(appSemCom)) falhas.push('O site usa sendBeacon — dados a sair do aparelho.');
if (/method:\s*['"]POST['"]/.test(appSemCom)) falhas.push('O site faz um POST — a recolha tinha de ser 100% local.');

/* ------------------------------------------------- 12. fila de validação (#/validar) */
/* FASE 1B (4). A regra de fundo: o browser RECOLHE veredictos assinados, e só um
   script fora do browser move estados. Se alguém escrever `estado: 'confirmado'`
   em app/app.js, uma página passou a auto-validar — e é exactamente isso que o
   brief proíbe. */
const FilaValidos = ['confirmado', 'aprovado', 'rejeitado'];
for (const e of FilaValidos) {
  if (new RegExp("estado:\\s*'" + e + "'").test(app)) {
    falhas.push('app.js escreve estado «' + e + '»: nenhuma página deste site pode promover ou rejeitar um sinal.');
  }
}
const ingVal = path.join(__dirname, 'ingerir-validacoes.cjs');
if (!fs.existsSync(ingVal)) {
  falhas.push('tools/ingerir-validacoes.cjs desapareceu: os veredictos de #/validar não têm quem os aplique.');
} else {
  const iv = fs.readFileSync(ingVal, 'utf8');
  /* 12.1 o vocabulário dos dois lados tem de ser o mesmo, letra por letra */
  const blocoVA = app.slice(app.indexOf('const VA_VEREDICTOS'), app.indexOf('const VA_REGIOES'));
  const doSite = [...blocoVA.matchAll(/c:\s*'([a-z]+)'/g)].map(m => m[1]);
  const doScript = [...iv.matchAll(/PESO\s*=\s*\{([^}]*)\}/g)].flatMap(m => [...m[1].matchAll(/([a-z]+)\s*:/g)].map(x => x[1]));
  if (doSite.length !== 3) falhas.push('VA_VEREDICTOS já não tem três veredictos (correcto / variante / errado).');
  if (doScript.length !== 3) falhas.push('tools/ingerir-validacoes.cjs já não declara três veredictos em PESO.');
  const soSite = doSite.filter(x => !doScript.includes(x));
  const soScript = doScript.filter(x => !doSite.includes(x));
  if (soSite.length || soScript.length) {
    falhas.push('O vocabulário dos veredictos divergiu — site: ' + (soSite.join(',') || 'ok')
      + ' | script: ' + (soScript.join(',') || 'ok')
      + '. Um veredicto que o outro lado não conhece é apagado em silêncio.');
  }
  /* 12.2 o script não pode aceitar um veredicto sem assinatura, nem assinatura sem
     declaração de quem usa LGA — é o §6 do protocolo */
  if (!/validado_por/.test(iv)) falhas.push('tools/ingerir-validacoes.cjs deixou de exigir `validado_por`.');
  if (!/sem `validado_por`/.test(iv)) falhas.push('tools/ingerir-validacoes.cjs já recusa veredictos anónimos, mas deixou de o dizer.');
  if (!/validadora_surda\s*!==\s*true/.test(iv)) falhas.push('tools/ingerir-validacoes.cjs passou a aceitar assinaturas de quem não declarou usar LGA.');
  if (!/rejeitado/.test(iv) || !/aprovado/.test(iv)) falhas.push('tools/ingerir-validacoes.cjs deixou de saber escrever os estados que a página promete.');
  if (!/empate/.test(iv)) falhas.push('tools/ingerir-validacoes.cjs deixou de tratar o empate (1 contra 1) como «falta uma terceira opinião» em vez de escolher por nós.');
  /* 12.3 o dicionário lê ESTADO_GLOSSARIO[estado].nota sem rede: um estado escrito
     pelo script e ausente da tabela daria um erro em cadeia em /dicionario e /pamosii */
  for (const e of ['colhido', 'confirmado', 'aprovado', 'rejeitado']) {
    if (!new RegExp("'" + e + "':\\s*\\{\\s*rotulo:").test(app)) {
      falhas.push('ESTADO_GLOSSARIO não conhece «' + e + '»: o dicionário rebentaria ao mostrar um termo importado.');
    }
  }
  if (!/\[\s*'confirmado',\s*'aprovado',\s*'rejeitado'\s*\]/.test(app)) {
    falhas.push('app.js deixou de deixar passar os estados publicados pela equipa — um termo «aprovado» voltaria a aparecer como «colhido».');
  }
}
/* 12.4 a página tem de continuar honesta sobre o que faz com o veredicto */
const blocoValidar = (function () {
  const a = app.indexOf('13.5 FILA DE VALIDAÇÃO');
  const b = app.indexOf("on('/validar'");
  return a >= 0 && b > a ? app.slice(a, b + 1600) : '';
})();
if (!blocoValidar) falhas.push('A fila de validação desapareceu do código de #/validar.');
if (blocoValidar) {
  if (!/Nada sai deste browser/.test(blocoValidar)) falhas.push('#/validar deixou de dizer que nada sai do browser.');
  if (!/não promove estados/.test(blocoValidar)) falhas.push('#/validar deixou de dizer que não promove estados sozinha.');
  if (!/tipo:\s*'pamosii-validacao'/.test(blocoValidar)) falhas.push('A exportação de #/validar perdeu o tipo `pamosii-validacao`: o ingestor deixaria de a reconhecer.');
  if (!/SCHEMA_VALIDACAO/.test(blocoValidar)) falhas.push('A exportação de #/validar deixou de declarar esquema — a equipa não saberia o que está a ler.');
  if (!/validado_por:\s*r\.apelido/.test(blocoValidar)) falhas.push('A exportação deixou de levar a assinatura de quem validou.');
  if (!/role="status"/.test(blocoValidar)) falhas.push('#/validar deixou de anunciar os resultados a leitores de ecrã.');
  if (!/localStorage/.test(blocoValidar)) falhas.push('#/validar deixou de guardar os veredictos no aparelho (iriam perder-se ao mudar de página).');
  const semComVA = semComentarios(blocoValidar);
  if (/navigator\.sendBeacon|XMLHttpRequest|method:\s*['"]POST|fetch\(/.test(semComVA)) {
    falhas.push('O código da fila de validação faz rede: os veredictos têm de ficar no aparelho.');
  }
  if (/navigator\.geolocation|input.*type=.password/i.test(semComVA)) falhas.push('#/validar passou a pedir dados que não precisa.');
}
if (!/\{ path: '\/validar', rotulo: 'Validação'/.test(app)) falhas.push('#/validar saiu do menu: ninguém encontra a fila.');
if (!/const VA_CHAVE = 'vs\.validar'/.test(app)) falhas.push('A chave de armazenamento da fila mudou sem actualizar a promessa escrita na página.');

/* --------------------------------------------- 13. ouvir/ver → LGA (#/ouvir) */
/* FASE 1B (7). A fronteira é o microfone: o site usa o ditado do PRÓPRIO BROWSER
   e não pode, em circunstância alguma, parecer um conversor fala → LGA. Se alguém
   acrescentar getUserMedia ou um envio de áudio, a página passa a gravar som de
   pessoas que não deram consentimento — e isso o brief não autoriza. */
const blocoOuvir = (function () {
  const a = app.indexOf('13.8 OUVIR E VER');
  const b = app.indexOf("on('/ouvir'");
  return a >= 0 && b > a ? app.slice(a, b + 900) : '';
})();
if (!blocoOuvir) falhas.push('A página #/ouvir desapareceu do código.');
if (blocoOuvir) {
  const semComOV = semComentarios(blocoOuvir);
  /* 13.1 o áudio nunca é capturado por nós */
  if (/getUserMedia/.test(semComOV)) {
    falhas.push('#/ouvir passou a usar getUserMedia: o microfone é do ditado do browser, e o site promete não gravar som.');
  }
  if (/MediaRecorder|createMediaStreamSource|AudioContext/.test(semComOV)) {
    falhas.push('#/ouvir passou a processar áudio do microfone — a página diz, por escrito, que não grava som.');
  }
  if (/navigator\.sendBeacon|XMLHttpRequest|method:\s*['"]POST|fetch\(/.test(semComOV)) {
    falhas.push('O código de #/ouvir faz rede: o ditado é do browser e os ficheiros ficam no separador.');
  }
  if (/localStorage\.setItem/.test(semComOV)) {
    falhas.push('#/ouvir passou a guardar texto do microfone no aparelho; o ditado é efémero e editável.');
  }
  /* 13.2 as duas honestidades que sustentam a página */
  if (!/traduz fala para LGA/.test(blocoOuvir)) {
    falhas.push('#/ouvir deixou de dizer que nenhum botão traduz fala para LGA.');
  }
  if (!/n[aã]o grava som/.test(blocoOuvir)) {
    falhas.push('#/ouvir deixou de dizer que o site não grava som.');
  }
  if (!/n[aã]o [eé] intel|n[aã]o [eé] uma transcri/i.test(blocoOuvir)) {
    falhas.push('#/ouvir deixou de avisar que o texto do microfone é aproximado (ou que o leitor de legendas não é IA).');
  }
  if (!/type="file"/.test(semComOV)) {
    falhas.push('#/ouvir deixou de ler as legendas a partir de um ficheiro escolhido por quem usa.');
  }
  if (!/OV_ERROS/.test(semComOV)) {
    falhas.push('#/ouvir perdeu as mensagens de erro do microfone; sem elas o silêncio parece avaria do site.');
  }
  if (!/role="status"/.test(semComOV)) falhas.push('#/ouvir deixou de anunciar estados a leitores de ecrã.');
  if (!/soonBadge\(\)/.test(semComOV)) {
    falhas.push('#/ouvir deixou de mostrar o painel «O que ainda não há» — é o que impede a página de parecer um tradutor.');
  }
}
if (!/\{ path: '\/ouvir', rotulo: 'Ouvir'/.test(app)) falhas.push('#/ouvir saiu do menu: ninguém chega ao ditado.');
if (!/ovSair\(\);/.test(app)) falhas.push('#/ouvir deixou de desligar o microfone ao mudar de rota.');

/* ------------------------------------ 14. amostras treináveis (#/cobertura) */
/* FASE 1B (8). É o único sítio do site que fala de treinar seja o que for. A
   fronteira é esta: contar o material que existe num aparelho e dizer em voz alta
   o que um aparelho não pode contar (pessoas, luzes, ângulos, revisão). Se alguém
   transformar o bloco em promessa — «já quase há dados para a IA reconhecer» — a
   página volta a vender uma coisa que não existe, e o brief não autoriza isso. */
const blocoAmostras = (function () {
  const a = app.indexOf('const AMOSTRAS_LETRAS');
  const b = app.indexOf("on('/cobertura'");
  return a >= 0 && b > a ? app.slice(a, b) : '';
})();
if (!blocoAmostras) falhas.push('O contador de amostras treináveis desapareceu do #/cobertura.');
if (blocoAmostras) {
  if (/fetch\(|localStorage\.setItem|sendBeacon|XMLHttpRequest/.test(blocoAmostras)) {
    falhas.push('O bloco de amostras passou a fazer rede ou a escrever no aparelho: conta registos que já existem neste browser.');
  }
  if (!/docs\/colheita-sinais-lga\.md/.test(blocoAmostras)) {
    falhas.push('O contador deixou de citar o protocolo de onde vem a meta — o número passa a ser inventado.');
  }
  if (!/não pode contar/.test(blocoAmostras)) {
    falhas.push('O contador deixou de dizer o que um aparelho não pode contar; sem isso a percentagem lê-se como «quase prontos para a IA».');
  }
  if (!/pessoas diferentes/.test(blocoAmostras)) {
    falhas.push('O contador deixou de explicar que as três pessoas do protocolo não se podem contar sem contas nem nomes.');
  }
  if (!/[Nn]ão h[áa] upload/.test(blocoAmostras)) {
    falhas.push('O contador deixou de dizer que nada chega à equipa sem alguém exportar; os clipes não sobem sozinhos.');
  }
  if (!/aria-label/.test(blocoAmostras)) {
    falhas.push('O medidor de amostras perdeu o aria-label: um leitor de ecrã não ouve uma barra de percentagem.');
  }
}

/* --------------------------------------- 15. planeador de aula (#/professores) */
/* FASE 1B (9). A página é a única que se apresenta como «material para professores».
   O que a torna honesta é isto: monta a aula com conteúdo que existe (aulas reais,
   glossário com estado, marcações locais) e diz em voz alta o que não existe - que
   nada ali foi revisto por uma pessoa surda e que nada fica guardado no site.
   Se o bloco passar a prometer currículo aprovado, cartões imprimíveis ou um
   intérprete automático, a página volta a vender trabalho que a equipa não fez. */
const blocoProf = (function () {
  const a = app.indexOf('const PROF_DURACOES');
  const b = app.indexOf('/* ---------------- vista: biblioteca ---------------- */');
  return a >= 0 && b > a ? app.slice(a, b) : '';
})();
if (!blocoProf) falhas.push('O planeador de aula desapareceu de #/professores - a página voltou a ser só "Em breve".');
if (blocoProf) {
  if (/fetch\(|localStorage\.setItem|sendBeacon|XMLHttpRequest|indexedDB/i.test(blocoProf)) {
    falhas.push('O planeador passou a fazer rede ou a escrever no aparelho: o plano copia-se e descarrega-se, não se guarda.');
  }
  if (!/não foi revisto por uma pessoa surda/.test(blocoProf)) {
    falhas.push('O planeador deixou de dizer que o plano não foi revisto por uma pessoa surda.');
  }
  if (!/confirmado ou aprovado/.test(blocoProf)) {
    falhas.push('O planeador deixou de contar quantas palavras têm sinal confirmado ou aprovado - sem isso o plano lê-se como currículo pronto.');
  }
  if (!/não substitui um intérprete/.test(blocoProf)) {
    falhas.push('O planeador deixou de dizer que não substitui um intérprete de LGA na turma inclusiva.');
  }
  if (!/data-prof-copy/.test(blocoProf) || !/data-prof-dl/.test(blocoProf)) {
    falhas.push('O planeador perdeu o copiar ou o descarregar: sem saída, o plano é só mais texto na página.');
  }
  if (!/este site não guarda/.test(blocoProf)) {
    falhas.push('O planeador deixou de dizer que não guarda o que se escreve (cabeçalho, checklist).');
  }
  if (!/role="status"/.test(blocoProf)) {
    falhas.push('O plano deixou de anunciar o resumo a leitores de ecrã.');
  }
  if (!/<label for="prof-tema"|for="prof-tema"/.test(blocoProf)) {
    falhas.push('As escolhas do planeador ficaram sem rótulo: um leitor de ecrã não sabe o que é cada select.');
  }
  if (!/soonBadge\(\)/.test(blocoProf)) {
    falhas.push('#/professores deixou de marcar como "Em breve" o material que ainda não existe.');
  }
  if (!/dicionario/.test(blocoProf) || !/colher/.test(blocoProf)) {
    falhas.push('O planeador deixou de ligar ao dicionário e à Colheita - é por aí que o que falta passa a existir.');
  }
  /* a página promete que a checklist se leva impressa; se a folha de impressão
     desaparecer, sai papel com barra de navegação, boneco do Signer e tema cinzento */
  if (/data-prof-print/.test(blocoProf)) {
    if (!/window\.print\(\)/.test(blocoProf)) {
      falhas.push('O botão "Imprimir plano" existe mas não chama window.print() - é um botão que não faz nada.');
    }
    const print = (css.match(/@media print\{([\s\S]*?)\n\}/) || [])[1] || '';
    if (!print) falhas.push('styles.css deixou de ter um bloco @media print.');
    for (const alvo of ['.tabbar', '.sg-fab', '.sg-painel', '.site-head', '.site-foot', '#a11y-root']) {
      if (!print.includes(alvo)) {
        falhas.push('A folha de impressão não esconde ' + alvo + ': ia sair no papel interface a mais.');
      }
    }
    if (!/#app\{[^}]*zoom:1/.test(print)) {
      falhas.push('A folha de impressão não anula a escala de texto no #app: quem imprime com 150% leva um plano cortado (o zoom do painel vive em estilo inline nesse elemento).');
    }
    /* o Chrome não pinta fundos em papel: o que no ecrã é texto claro sobre cor
       preenchida imprimir-se-ia branco sobre branco. */
    if (!/\.btn[^{}]*\{[^}]*background:#fff!important/.test(print)) {
      falhas.push('A folha de impressão deixou de converter botões e etiquetas de cor preenchida em preto sobre branco — no papel isso é texto invisível.');
    }
    if (!/attr\(href\)/.test(print)) {
      falhas.push('A folha de impressão deixou de escrever o endereço dos links: «Abrir no YouTube» num papel sem URL não leva a lado nenhum.');
    }
    if (/display:none[^;}]*\s*\.prof-avisos|\.prof-avisos[^{}]*\{[^}]*display:none/.test(print)
        || !/\.prof-bloco/.test(print)) {
      falhas.push('A folha de impressão esconde os avisos ou deixa de partir os blocos limpiamente.');
    }
  }
}
if (!/\{ path: '\/professores', rotulo: 'Professores'/.test(app)) {
  falhas.push('#/professores saiu do menu: ninguém chega ao planeador.');
}
if (!/bind: bindProfessor/.test(app)) {
  falhas.push('#/professores perdeu o bind: o planeador mostrar-se-ia e não reagiria a nada.');
}

/* ------------------------------------------ 16. folha A–Z imprimível (#/alfabeto) */
/* FASE 1B (11). A folha é a única coisa deste site que se imprimiu sempre para a sala
   de aula ser olhada por 30 pares de olhos. O que a torna honesta é o que está escrito
   nela: o estado de cada letra no dia em que foi lida, a linha pautada vazia à espera
   de alguém que saiba, e a frase «este site não desenha formas de mão». Se a frase
   desaparecer, a folha passa a parecer um quadro de datilologia oficial que ninguém
   validou — e é exactamente isso que faz ensinar LGA errada em voz alta. */
const blocoAlf = (function () {
  const a = app.indexOf('13.7 ALFABETO MANUAL');
  const b = app.indexOf('13.8 ');
  return a >= 0 && b > a ? app.slice(a, b) : '';
})();
if (!blocoAlf) falhas.push('A secção do alfabeto manual desapareceu de app.js.');
if (blocoAlf) {
  const temFolha = /id="alf-folha"/.test(blocoAlf);
  if (temFolha) {
    if (!/não\s+desenha formas de mão/.test(blocoAlf)) {
      falhas.push('A folha A–Z deixou de dizer que este site não desenha formas de mão.');
    }
    if (!/fmtData\(new Date\(\)/.test(blocoAlf)) {
      falhas.push('A folha A–Z deixou de datar a leitura do dicionário: «0 de 26» sem data é um estado que ninguém pode verificar.');
    }
    if (!/ALF_ESTADO_F\[x\.estado\]/.test(blocoAlf) || !/alf-folha-pauta/.test(blocoAlf)) {
      falhas.push('A folha A–Z deixou de levar o estado de cada letra ou o espaço pautado para anotar a forma — sem isso é só um quadro de letras.');
    }
    if (!/Fonte das formas:/.test(blocoAlf)) {
      falhas.push('A folha A–Z deixou de dizer de onde vêm as formas; impressa, perde a única fonte que o site admite.');
    }
    if (!/data-alf-print/.test(blocoAlf) || !/window\.print\(\)/.test(blocoAlf)) {
      falhas.push('O botão «Imprimir folha A–Z» existe mas já não chama window.print(): é um botão que não faz nada.');
    }
    const print = (css.match(/@media print\{([\s\S]*?)\n\}/) || [])[1] || '';
    if (!/main:has\(\.alf-folha\)[\s\S]{0,400}?\.page-head/.test(print) || !/\.alf-bloco:has\(\.alf-folha\)>:not\(\.alf-folha\)/.test(print)) {
      falhas.push('A folha de impressão deixou de esconder o resto do #/alfabeto: sairia no papel o vídeo, a grelha clicável e o treino, em vez da folha.');
    }
    if (!/\.alf-folha-grelha\{[^}]*repeat\(2/.test(print) || !/\.alf-folha-l\{[^}]*break-inside:avoid/.test(print)) {
      falhas.push('A folha de impressão deixou de assentar as 26 letras em duas colunas partidas limpiamente — volta a ser um folheto de duas páginas.');
    }
    if (new RegExp('#alf-folha[^{}]*\\{[^}]*display:none').test(print)) {
      falhas.push('A folha de impressão esconde a própria folha A–Z: o botão imprimiria tudo excepto aquilo que prometeu.');
    }
  }
}
if (!/\{ path: '\/alfabeto', rotulo: 'Alfabeto'/.test(app)) {
  falhas.push('#/alfabeto saiu do menu: ninguém chega à folha de datilologia.');
}

/* ----------------------------------- 17. folha de colheita imprimível (#/cobertura) */
/* FASE 1B (12). A folha leva o glossário a uma casa sem internet: é uma pergunta em
   papel, não uma lição. O que a mantém honesta é isto — as palavras e os estados são
   lidos do dicionário, a folha diz o dia em que foram lidos, diz quantas ficaram de
   fora, e a coluna da resposta nasce vazia. Se alguém escrever um sinal ou uma lista
   à mão, a folha passa a ensinar o que ninguém validou — e é isso que se está a tentar
   impedir. A impressão tem de deixar sair só a folha, não a página inteira. */
const blocoFolha = (function () {
  const a = app.indexOf('A FOLHA DE COLHEITA');
  const b = app.indexOf("on('/cobertura'", a);
  return a >= 0 && b > a ? app.slice(a, b) : '';
})();
if (!blocoFolha) falhas.push('A folha de colheita desapareceu do código de /cobertura.');
if (blocoFolha) {
  if (!/Esta folha não ensina nada/.test(blocoFolha)) {
    falhas.push('A folha de colheita deixou de dizer que não ensina nenhum sinal.');
  }
  if (!/fmtData\(new Date\(\)/.test(blocoFolha)) {
    falhas.push('A folha de colheita deixou de datar a leitura do glossário: sem data, «N de M» não se verifica.');
  }
  if (!/covFolhaTema\(|semSinal/.test(blocoFolha) || !/COV_FOLHA_LIMITE/.test(blocoFolha)) {
    falhas.push('A folha deixou de ser lida do glossário ou perdeu o limite de linhas por A4.');
  }
  if (!/fora/.test(blocoFolha) || !/ficaram de fora/.test(blocoFolha)) {
    falhas.push('A folha deixou de dizer quantas palavras ficaram de fora: esconder o resto é pior do que não caber.');
  }
  if (!/cov-folha-escreve/.test(blocoFolha) || !/Como é que se faz\?/.test(blocoFolha)) {
    falhas.push('A folha deixou de ter a coluna vazia onde se escreve o sinal — passou a ser um quadro para copiar.');
  }
  if (!/data-cov-print/.test(blocoFolha) || !/window\.print\(\)/.test(blocoFolha)) {
    falhas.push('O botão «Imprimir esta folha» existe mas já não chama window.print(): é um botão que não faz nada.');
  }
  const semCom = blocoFolha.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (/fetch\(|localStorage\.setItem|sendBeacon|XMLHttpRequest/.test(semCom)) {
    falhas.push('A folha de colheita passou a fazer rede ou a escrever no aparelho: uma folha imprime-se sem enviar nada.');
  }
  const print = (css.match(/@media print\{([\s\S]*?)\n\}/) || [])[1] || '';
  if (!/main:has\(\.cov-folha\)[\s\S]{0,400}?\.page-head/.test(print) || !/\.cov-bloco:has\(\.cov-folha\)>:not\(\.cov-folha\)/.test(print)) {
    falhas.push('A impressão deixou de esconder o resto do #/cobertura: sairiam as tabelas, o seletor e os botões em vez da folha.');
  }
  if (!/table\.cov-folha-tab\{[^}]*table-layout:fixed/.test(print)) {
    falhas.push('A folha impressa deixou de assentar as colunas (table-layout:fixed) — volta a sair desalinhada do papel.');
  }
  if (new RegExp('#cov-folha[^{}]*\\{[^}]*display:none').test(print)) {
    falhas.push('A impressão esconde a própria folha de colheita: o botão imprimiria tudo excepto aquilo que prometeu.');
  }
}

/* ----------------------------------------------------------------- relatorio */
const saida = [];
saida.push('Integridade do Pamosii — ' + falhas.length + ' falha(s), ' + avisos.length + ' aviso(s).');
saida.push('Rotas: ' + rotas.length + ' | links internos: ' + hrefs.length +
  ' | ficheiros locais: ' + refs.length + ' | versao offline: ' + (versaoSW || '?') +
  ' | claims: ' + PROIBIDAS.length);
for (const a of avisos) saida.push('  AVISO  ' + a);
for (const f of falhas) saida.push('  FALHA  ' + f);
if (!falhas.length) saida.push('  OK     nenhuma interface promete o que o codigo nao faz.');
console.log(saida.join('\n'));
process.exit(falhas.length ? 1 : 0);
