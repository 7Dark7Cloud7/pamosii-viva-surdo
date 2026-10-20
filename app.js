'use strict';
/* ============================================================================
   Pamosii Viva Surdo — aplicação de página única (JavaScript puro, sem build)
   ----------------------------------------------------------------------------
   CONTEÚDO EDITÁVEL (ver README.md):
     1. CONTATOS       → canais oficiais verificados
     2. LGA_AULAS      → aulas do mini-curso de LGA (canal oficial no YouTube)
     3. CURSOS         → catálogo (APENAS conteúdo real e aprovado)
     4. CATEGORIAS     → categorias do catálogo (com estados honestos)
     5. BIB_EM_BREVE   → itens planeados da biblioteca ("Em breve")
     6. FONTES_PUBLICAS→ fontes usadas na página "Sobre" (contexto editorial)

   REGRAS DO PROJECTO (não remover):
     - Não inventar cursos, preços, depoimentos, instrutores ou contactos.
     - Funcionalidades não implementadas => estado honesto "Em breve".
     - Terminologia: "pessoas ouvintes" (nunca "pessoas normais");
       "Língua Gestual Angolana (LGA)".
   ============================================================================ */

/* ---------------- utilitários ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtData = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
};

/* ---------------- ícones (SVG, decorativos: aria-hidden) ---------------- */
const ic = (inner) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
const I = {
  arrow: ic('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'),
  search: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>'),
  menu: ic('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  home: ic('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  mais: ic('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
  close: ic('<path d="M18 6L6 18M6 6l12 12"/>'),
  check: ic('<path d="M20 6L9 17l-5-5"/>'),
  calendar: ic('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  users: ic('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>'),
  book: ic('<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>'),
  video: ic('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>'),
  doc: ic('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/>'),
  clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
  target: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  spark: ic('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  external: ic('<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>'),
  chat: ic('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'),
  grad: ic('<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>'),
  heart: ic('<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/>'),
  access: ic('<circle cx="12" cy="4.5" r="2"/><path d="M4 8.5h16"/><path d="M12 8.5v6l4 6"/><path d="M12 14.5l-4 6"/>'),
  play: `<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><polygon points="7 4 21 12 7 20 7 4"/></svg>`,
  chev: ic('<path d="M6 9l6 6 6-6"/>'),
  info: ic('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M12 12v4"/>'),
  shield: ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  facebook: ic('<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>'),
  instagram: ic('<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><path d="M17.5 6.5h.01"/>'),
  youtube: ic('<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'),
};

/* ============================================================================
   1. CONTATOS — canais oficiais verificados pela equipa (não adicionar sem
   confirmação da Viva Surdo; telefone e e-mail ficam de fora até aprovação)
   ============================================================================ */
const CONTATOS = {
  facebook: { nome: 'Facebook', url: 'https://www.facebook.com/106870138852707', rotulo: 'Página oficial no Facebook' },
  instagram: { nome: 'Instagram', url: 'https://www.instagram.com/pamossi_viva_surdo/', rotulo: '@pamossi_viva_surdo' },
  youtube: { nome: 'YouTube', url: 'https://www.youtube.com/@vivasurdo8579', rotulo: '@vivasurdo8579' },
  playlist: { nome: 'Playlist do mini-curso de LGA', url: 'https://www.youtube.com/playlist?list=PL7ed0ba9AmBrecszUd6OHdbKrYrkKdGL0', rotulo: 'As 17 aulas do mini-curso' },
};

/* ============================================================================
   2. LGA_AULAS — aulas reais do mini-curso, publicadas no canal oficial
   (YouTube Viva Surdo, playlist pública; IDs e datas verificados em 2026-10)
   ============================================================================ */
const LGA_AULAS = [
  { id: '_oyDAeqCjSM', ordem: 0, tema: 'Apresentação', titulo: 'Apresentação do mini curso', data: '2025-01-21' },
  { id: 'XyGt-yaHJkA', ordem: 1, tema: 'Saudações', titulo: 'Aula 01 — Saudação de LGA', data: '2025-01-16' },
  { id: 'xBhXm0ubMS0', ordem: 2, tema: 'Alfabeto', titulo: 'Aula 02 — Abecedário', data: '2025-01-16' },
  { id: 'F-ZMpMJFF7A', ordem: 3, tema: 'Números', titulo: 'Aula 03 — Números', data: '2025-01-16' },
  { id: 'Gn3FyAYlMQY', ordem: 4, tema: 'Diálogos', titulo: 'Diálogo 01', data: '2025-01-16' },
  { id: 'fpnhLW245Hw', ordem: 5, tema: 'Escola', titulo: 'Aula 04 — Material escolar', data: '2025-01-16' },
  { id: 'H4fO2cdpnDs', ordem: 6, tema: 'Cores', titulo: 'Aula 05 — Cores', data: '2025-01-16' },
  { id: 'AOSjmGxMfGI', ordem: 7, tema: 'Verbos', titulo: 'Aula 06 — Verbos de LGA (parte 1)', data: '2025-01-16' },
  { id: 'pl0P1LmoW3Q', ordem: 8, tema: 'Comida e bebida', titulo: 'Aula 07 — Comida e Bebida (1ª parte)', data: '2025-01-16' },
  { id: 'NxqSSU2LK-w', ordem: 9, tema: 'Comida e bebida', titulo: 'Aula 08 — Comida e Bebida (2ª parte)', data: '2025-01-16' },
  { id: 'Jk-ENdNjVL0', ordem: 10, tema: 'Adjetivos', titulo: 'Aula 09 — Adjetivos', data: '2025-01-16' },
  { id: 'cSmBaPW8-UI', ordem: 11, tema: 'Frases', titulo: 'Acessórios/Frases 1', data: '2025-01-16' },
  { id: 'Wp-qBtsw4uA', ordem: 12, tema: 'Verbos', titulo: 'Aula 10 — Verbos de LGA (parte 2)', data: '2025-01-16' },
  { id: 'tzhRtS3zs78', ordem: 13, tema: 'Casa', titulo: 'Aula 11 — Casa (1ª parte)', data: '2025-01-16' },
  { id: '7MNX--Xh0V8', ordem: 14, tema: 'Casa', titulo: 'Aula 12 — Casa (2ª parte)', data: '2025-01-16' },
  { id: '7Tuc_i7QgNo', ordem: 15, tema: 'Tempos e meses', titulo: 'Aula 13 — Tempos e Meses', data: '2025-01-16' },
  { id: 'fbsKSkuvXa4', ordem: 16, tema: 'Partes do corpo', titulo: 'Aula 14 — As partes do corpo', data: '2025-01-16' },
];

/* Temas na ordem pedagógica usada nas páginas /aprender-lga e /cursos/:slug */
const TEMAS = [
  { nome: 'Apresentação', icon: 'spark' },
  { nome: 'Saudações', icon: 'chat' },
  { nome: 'Alfabeto', icon: 'book' },
  { nome: 'Números', icon: 'target' },
  { nome: 'Diálogos', icon: 'chat' },
  { nome: 'Escola', icon: 'book' },
  { nome: 'Cores', icon: 'spark' },
  { nome: 'Verbos', icon: 'video' },
  { nome: 'Comida e bebida', icon: 'heart' },
  { nome: 'Adjetivos', icon: 'spark' },
  { nome: 'Frases', icon: 'chat' },
  { nome: 'Casa', icon: 'book' },
  { nome: 'Tempos e meses', icon: 'calendar' },
  { nome: 'Partes do corpo', icon: 'access' },
];

/* ============================================================================
   3. CURSOS — apenas conteúdo real. Para adicionar um curso novo, copie o
   formato abaixo. Enquanto não houver inscrição/pagamento integrados, use
   inscricao: 'em-breve'.
   ============================================================================ */
const CURSOS = [
  {
    slug: 'mini-curso-lga',
    titulo: 'Mini-curso de Língua Gestual Angolana',
    categoria: 'Língua Gestual Angolana',
    publico: 'Todos os públicos — pessoas surdas, familiares, colegas, professores e pessoas ouvintes que querem aprender LGA',
    nivel: 'Iniciante',
    formato: 'Vídeo (aulas no YouTube)',
    preco: 'Gratuito',
    inscricao: 'em-breve',
    certificado: 'em-breve',
    resumo: 'Introdução à Língua Gestual Angolana em 17 aulas públicas do canal oficial da Viva Surdo: saudações, alfabeto, números, cores, verbos, comida e bebida, casa, tempos e meses e partes do corpo.',
    requisitos: 'Nenhum — as aulas são gratuitas e abertas a todas as pessoas.',
    acessibilidade: 'Vídeo em língua gestual. Transcrições e materiais de apoio serão publicados quando aprovados pela equipa.',
    objectivos: [
      'Fazer saudações e apresentar-se em LGA',
      'Conhecer o alfabeto manual e os números',
      'Nomear cores, material escolar, comida, bebida, casa e partes do corpo',
      'Usar verbos, adjetivos e frases do dia-a-dia',
      'Seguir um diálogo simples em LGA',
    ],
    aulas: LGA_AULAS,
  },
];

/* ============================================================================
   4. CATEGORIAS do catálogo. estado: 'com-conteudo' | 'em-breve'
   ============================================================================ */
const CATEGORIAS = [
  { id: 'lga', nome: 'Língua Gestual Angolana', estado: 'com-conteudo' },
  { id: 'formacao', nome: 'Formação profissional acessível', estado: 'em-breve', nota: 'A Viva Surdo trabalha para oferecer formação técnica interpretada em LGA. Novidades serão anunciadas nos canais oficiais.' },
  { id: 'professores', nome: 'Recursos para professores', estado: 'em-breve', nota: 'Materiais de ensino para profissionais que trabalham com alunos surdos estão em preparação. Consulta a página de professores.' },
];

/* ============================================================================
   5. BIB_EM_BREVE — itens planeados da biblioteca (estados honestos)
   ============================================================================ */
const BIB_EM_BREVE = [
  { tipo: 'Guia', titulo: 'Como usar o mini-curso de LGA em contexto escolar', nota: 'Para professores e escolas.' },
  { tipo: 'Guia', titulo: 'Orientações de acessibilidade para aulas com alunos surdos', nota: 'Boas práticas em preparação com a equipa.' },
  { tipo: 'Material', titulo: 'Vocabulário visual de LGA para sala de aula', nota: 'Cartões e fichas descarregáveis.' },
];

/* ============================================================================
   6. FONTES_PUBLICAS — usadas na página "Sobre" como contexto editorial
   (a UNICEF é citada como FONTE de notícia, nunca como operadora/patrocinadora)
   ============================================================================ */
const FONTES_PUBLICAS = {
  unicef1: { nome: 'UNICEF Angola (Abril de 2025)', url: 'https://www.unicef.org/angola/historias/projecto-angolano-de-inclus%C3%A3o-das-pessoas-surdas-entre-os-10-melhores-do-desafio-da', titulo: 'Projecto angolano de inclusão das pessoas surdas entre os 10 melhores do desafio da UNICEF' },
  unicef2: { nome: 'UNICEF Angola', url: 'https://www.unicef.org/angola/historias/desafio-genial-um-olhar-sobre-ideias-das-5-equipas-finalistas', titulo: 'Desafio Genial: um olhar sobre as ideias das 5 equipas finalistas' },
  f6s: { nome: 'F6S', url: 'https://www.f6s.com/company/viva-surdo', titulo: 'Perfil público da Viva Surdo' },
};

/* ============================================================================
   7. GLOSSARIO — base do dicionário LGA <-> português
   ----------------------------------------------------------------------------
   REGRAS DE INTEGRIDADE (não afrouxar):
     - O que está VERIFICADO é o tema de cada aula (título público da aula).
     - A palavra individual associada a um sinal só passa a estado
       'confirmado' depois de validada por utilizadores de LGA / equipa.
     - Não existe tradutor automático PT<->LGA validado: o site NÃO simula
       tradução automática. Ver a nota honesta na vista /dicionario.

   Para adicionar vocabulário: acrescentar palavras ao tema correspondente.
   Para validar uma palavra: mudar estado para 'confirmado' e, se houver
   vídeo próprio do sinal, indicar o ID do YouTube em `sinal`.
   ============================================================================ */
const ESTADO_GLOSSARIO = {
  'a-validar': { rotulo: 'A validar', nota: 'Associação entre a palavra e o sinal ainda não validada por utilizadores de LGA.' },
  'confirmado': { rotulo: 'Confirmado', nota: 'Validado pela equipa / comunidade surda.' },
  'demonstracao': { rotulo: 'Demonstração', nota: 'Palavra de exemplo, para mostrar como o painel funciona. Não corresponde a sinal gravado nem a LGA validada — retirar ou substituir por sinal filmado.' },
};

const GLOSSARIO = [
  { tema: 'Saudações', termos: ['olá', 'bom dia', 'boa tarde', 'boa noite', 'tchau', 'obrigado', 'obrigada', 'como está?', 'bom', 'mau', 'por favor', 'desculpa', 'sim', 'não'] },
  { tema: 'Alfabeto', termos: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { tema: 'Números', termos: Array.from({ length: 21 }, (_, i) => String(i)) },
  { tema: 'Diálogos', termos: ['conversa', 'perguntar', 'responder', 'falar em LGA'] },
  { tema: 'Escola', termos: ['escola', 'professor', 'aluno', 'caderno', 'caneta', 'lápis', 'borracha', 'mochila', 'livro', 'carteira', 'recreio', 'lição'] },
  { tema: 'Cores', termos: ['vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco', 'laranja', 'roxo', 'rosa', 'castanho', 'cinza', 'cores'] },
  { tema: 'Verbos', termos: ['comer', 'beber', 'dormir', 'acordar', 'andar', 'correr', 'ver', 'escrever', 'ler', 'trabalhar', 'estudar', 'gostar', 'querer', 'ter', 'dar', 'fazer', 'ajudar', 'brincar'] },
  { tema: 'Comida e bebida', termos: ['água', 'pão', 'arroz', 'feijão', 'peixe', 'carne', 'fruta', 'legumes', 'leite', 'café', 'açúcar', 'sal', 'óleo', 'comida', 'bebida', 'faminta', 'sede'] },
  { tema: 'Adjetivos', termos: ['grande', 'pequeno', 'bonito', 'novo', 'velho', 'rápido', 'lento', 'quente', 'frio', 'feliz', 'triste', 'cansado', 'doente', 'saudável'] },
  { tema: 'Frases', termos: ['como te chamas?', 'chamo-me…', 'onde fica?', 'quanto custa?', 'não entendo', 'repete por favor', 'muito bem', 'até amanhã'] },
  { tema: 'Casa', termos: ['casa', 'porta', 'janela', 'cama', 'mesa', 'cadeira', 'cozinha', 'quarto', 'sala', 'casa de banho', 'teto', 'chão', 'família', 'mãe', 'pai', 'filho', 'filha', 'avó', 'avô', 'irmão', 'irmã'] },
  { tema: 'Tempos e meses', termos: ['hoje', 'amanhã', 'ontem', 'agora', 'depois', 'semana', 'mês', 'ano', 'dia', 'hora', ...MESES] },
  { tema: 'Partes do corpo', termos: ['cabeça', 'olho', 'mão', 'dedo', 'boca', 'nariz', 'orelha', 'ombro', 'braço', 'perna', 'pé', 'barriga', 'dente', 'cabelo'] },
  /* ⚠️ TEMA DE DEMONSTRAÇÃO — palavras de exemplo para o painel conseguir mostrar
     frases do dia a dia. NÃO são LGA: não têm vídeo, não foram vistas por ninguém
     surdo, e saem do site no dia em que o glossário validado chegar (README, item 19). */
  { tema: 'Demonstração (sem vídeo)', estado: 'demonstracao', termos: [
    'mercado', 'autocarro', 'dinheiro', 'telefone', 'amigo', 'amiga', 'computador', 'hospital',
    'médico', 'igreja', 'futebol', 'música', 'dança', 'roupa', 'sapato', 'cartão',
    'comprar', 'vender', 'pagar', 'esperar', 'chegar', 'precisar', 'poder', 'dever',
    'cedo', 'tarde', 'sempre', 'nunca', 'muito', 'pouco', 'aqui', 'ali', 'devagar'
  ] },
].map(g => ({
  tema: g.tema,
  termos: g.termos.map(t => ({
    palavra: typeof t === 'string' ? t : String(t),
    estado: g.estado || 'a-validar',
    sinal: null, // ID de vídeo próprio do sinal, quando existir e for aprovado
  })),
}));

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const aulasDeTema = (tema) => LGA_AULAS.filter(a => a.tema === tema);
const slugTema = (t) => 'tema-' + norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ============================================================================
   8. PREFERÊNCIAS DE ACESSIBILIDADE — guardadas apenas neste dispositivo
   ============================================================================ */
const A11Y_KEY = 'vs.a11y';
const A11Y_PADRAO = { escala: 100, contraste: false, temaEscuro: false, movimento: false, simples: false };
const ESCALAS = [100, 115, 130, 150];

function lerPrefs() {
  try { return { ...A11Y_PADRAO, ...(JSON.parse(localStorage.getItem(A11Y_KEY) || '{}')) }; }
  catch (e) { return { ...A11Y_PADRAO }; }
}
function guardarPrefs(p) {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(p)); } catch (e) { /* modo privado: ignorar */ }
}
function aplicarPrefs(p) {
  const h = document.documentElement;
  h.toggleAttribute('data-tema-escuro', !!p.temaEscuro);
  h.toggleAttribute('data-contraste-alto', !!p.contraste);
  h.toggleAttribute('data-movimento-reduzido', !!p.movimento);
  h.toggleAttribute('data-leitura-simples', !!p.simples);
  /* a escala cresce o conteúdo; o painel fixo de acessibilidade fica fora,
     senão com texto grande o próprio painel saía do ecrã */
  const alvo = $('#app') || document.body;
  const f = p.escala / 100;
  alvo.style.zoom = f.toFixed(3);
  // as unidades de viewport (dvh) não sentem o zoom: quem precisa de altura máxima
  // dentro de #app divide por esta variável para não ficar abaixo da dobra
  alvo.style.setProperty('--escala', f.toFixed(3));
  // o painel de acessibilidade vive fora de #app (não é escalado) mas precisa de saber
  // a escala para se manter acima da barra inferior — por isso a variável vai também no <html>
  document.documentElement.style.setProperty('--escala', f.toFixed(3));
}

const A11Y_ICONE = I.access;

function painelA11yHTML(p) {
  const temVoz = 'speechSynthesis' in window;
  return `
<div class="a11y">
  <button class="a11y-btn" id="a11y-btn" type="button" aria-expanded="false" aria-controls="a11y-panel">${A11Y_ICONE}<span>Acessibilidade</span></button>
  <div class="a11y-panel" id="a11y-panel" role="group" aria-label="Opções de acessibilidade" hidden>
    <p class="a11y-title">Opções de leitura e visualização</p>
    <div class="a11y-row">
      <span class="a11y-lab" id="lab-escala">Tamanho do texto</span>
      <span class="a11y-step">
        <button class="a11y-act" type="button" data-escala="-" aria-labelledby="lab-escala" title="Diminuir texto">A−</button>
        <output id="a11y-escala">${p.escala}%</output>
        <button class="a11y-act" type="button" data-escala="+" aria-labelledby="lab-escala" title="Aumentar texto">A+</button>
      </span>
    </div>
    <button class="a11y-toggle" type="button" data-pref="contraste" aria-pressed="${p.contraste}">${I.check} Contraste alto</button>
    <button class="a11y-toggle" type="button" data-pref="temaEscuro" aria-pressed="${p.temaEscuro}">${I.check} Tema escuro</button>
    <button class="a11y-toggle" type="button" data-pref="movimento" aria-pressed="${p.movimento}">${I.check} Movimento reduzido</button>
    <button class="a11y-toggle" type="button" data-pref="simples" aria-pressed="${p.simples}">${I.check} Leitura simples</button>
    <hr class="a11y-hr">
    ${temVoz
      ? `<button class="a11y-read" type="button" id="a11y-read">${I.video} Ler esta página em voz alta</button>`
      : `<p class="a11y-note">A leitura em voz alta não está disponível neste browser. Usa um leitor de ecrã (NVDA, TalkBack, VoiceOver) — o site foi construído para funcionar com eles.</p>`}
    <p class="a11y-note">As tuas escolhas ficam guardadas <strong>só neste dispositivo</strong>. Não recolhemos dados pessoais.</p>
    <button class="a11y-reset" type="button" data-pref="reset">Repor opções</button>
  </div>
</div>`;
}

function bindA11yPanel() {
  const btn = $('#a11y-btn'), painel = $('#a11y-panel');
  if (!btn || !painel) return;
  let prefs = lerPrefs();
  const pintar = () => {
    $$('.a11y-toggle', painel).forEach(t => t.setAttribute('aria-pressed', String(!!prefs[t.dataset.pref])));
    const out = $('#a11y-escala'); if (out) out.textContent = prefs.escala + '%';
  };
  btn.addEventListener('click', () => {
    const aberto = painel.hidden;
    painel.hidden = !aberto;
    btn.setAttribute('aria-expanded', String(aberto));
  });
  painel.addEventListener('click', e => {
    const alvo = e.target.closest('[data-pref],[data-escala]');
    if (!alvo) return;
    if (alvo.dataset.escala) {
      const i = ESCALAS.indexOf(prefs.escala);
      const passo = alvo.dataset.escala === '+' ? 1 : -1;
      prefs.escala = ESCALAS[Math.min(ESCALAS.length - 1, Math.max(0, (i < 0 ? 0 : i) + passo))];
    } else if (alvo.dataset.pref === 'reset') {
      prefs = { ...A11Y_PADRAO };
      pararLeitura();
    } else {
      prefs[alvo.dataset.pref] = !prefs[alvo.dataset.pref];
    }
    guardarPrefs(prefs);
    aplicarPrefs(prefs);
    pintar();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !painel.hidden) { painel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  });
  const read = $('#a11y-read');
  if (read) read.addEventListener('click', () => alternarLeitura(read));
  pintar();
}

/* leitura em voz alta — usa a síntese de voz já instalada no browser do utilizador */
const leitura = { ativa: false };

function frasesParaLer() {
  const alvo = $('#conteudo');
  if (!alvo) return [];
  const aninhados = 'h1,h2,h3,h4,p,li,dd,dt,figcaption,blockquote,th,td,summary';
  const vistos = new Set();
  const blocos = [];
  $$(aninhados, alvo).forEach(el => {
    if (el.closest('[hidden],[aria-hidden="true"],[data-no-read]')) return;
    if (el.querySelector(aninhados)) return; // o texto pertence a um filho, não duplicar
    const clone = el.cloneNode(true);
    clone.querySelectorAll('svg').forEach(s => s.remove()); // glifos e ícones não são texto
    const t = clone.textContent.replace(/\s+/g, ' ').trim();
    if (t.length < 2 || vistos.has(t)) return;
    vistos.add(t);
    blocos.push(t);
  });
  const frases = [];
  blocos.forEach(t => (t.match(/[^.!?]+[.!?]*/g) || [t]).forEach(f => {
    const s = f.trim();
    if (s.length > 1) frases.push(s);
  }));
  return frases;
}

function escolherVoz() {
  const vozes = window.speechSynthesis.getVoices();
  const por = (re) => vozes.find(v => re.test(String(v.lang)));
  return por(/^pt[-_]PT/i) || por(/^pt[-_]BR/i) || por(/^pt/i) || null;
}

function pintarBotaoLeitura(ativa) {
  const btn = $('#a11y-read');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(ativa));
  btn.innerHTML = ativa ? `${I.close} Parar de ler` : `${I.video} Ler esta página em voz alta`;
}

function pararLeitura() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  if (!leitura.ativa) return;
  leitura.ativa = false;
  pintarBotaoLeitura(false);
}

function alternarLeitura(btn) {
  if (leitura.ativa) { pararLeitura(); return; }
  const frases = frasesParaLer();
  if (!frases.length) { btn.innerHTML = `${I.info} Não há texto para ler`; return; }
  leitura.ativa = true;
  pintarBotaoLeitura(true);
  const voz = escolherVoz();
  let i = 0;
  const dizer = () => {
    if (!leitura.ativa) return;
    if (i >= frases.length) { pararLeitura(); return; }
    const u = new SpeechSynthesisUtterance(frases[i++]);
    if (voz) { u.voice = voz; u.lang = voz.lang; } else { u.lang = 'pt-PT'; }
    u.rate = 0.95;
    u.onend = dizer;
    u.onerror = () => { leitura.ativa = false; pintarBotaoLeitura(false); };
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.cancel();
  dizer();
}

function montarPainelA11y() {
  const raiz = $('#a11y-root');
  if (!raiz || raiz.childElementCount) return;
  raiz.innerHTML = painelA11yHTML(lerPrefs());
  bindA11yPanel();
}

/* ============================================================================
   9. PAMOSSI — tradutor de bolso português ↔ LGA
   ----------------------------------------------------------------------------
   O que faz de verdade: divide frases, procura cada palavra no GLOSSARIO e
   devolve uma GLOSA — a sequência de sinais, com a imagem e o vídeo da aula
   onde esse sinal é mostrado. Aceita ditado por microfone (voz → LGA) e
   construção por escolha de sinais (LGA → texto + voz).
   O que NÃO faz: não é tradução automática. A LGA tem gramática própria
   (espaço, ordem, expressão facial) que uma sequência de palavras não reproduz,
   e não existe neste site reconhecimento automático de gestos validado.
   ============================================================================ */
const PAMOSSI_TIPOS = {
  artigo: { rotulo: 'Artigo', acao: 'omitir', nota: 'A LGA não usa artigos; o contexto e o espaço mostram de que coisa se fala.' },
  preposicao: { rotulo: 'Preposição', acao: 'omitir', nota: 'As relações de lugar fazem-se posicionando as mãos no espaço.' },
  conjuncao: { rotulo: 'Conjunção', acao: 'omitir', nota: 'As ideias ligam-se por sequência de sinais e pausa.' },
  determinante: { rotulo: 'Posse', acao: 'marcador', nota: 'Aponta-se para a pessoa ou para o lugar combinado dessa coisa.' },
  pronome: { rotulo: 'Pronome', acao: 'marcador', nota: 'Sinal de pessoa: aponta-se para o lugar do espaço reservado a quem se refere.' },
  'verbo-suporte': { rotulo: 'Ser / estar', acao: 'omitir', nota: 'Costuma estar incorporado no próprio verbo ou no contexto.' },
  interrogativo: { rotulo: 'Pergunta', acao: 'marcador', nota: 'Nas perguntas com palavra, os marcadores faciais (sobrancelhas, cabeça) fazem o trabalho.' },
  soletracao: { rotulo: 'Letra (datilologia)', acao: 'sinal', nota: 'Grafema do alfabeto manual — usa-se para nomes próprios e palavras sem sinal.' },
};

const PAMOSSI_MAPA = {};
[
  ['artigo', ['a', 'o', 'as', 'os', 'uma', 'um', 'umas', 'uns']],
  ['preposicao', ['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'sem', 'com', 'entre', 'sob', 'apos', 'ate', 'desde', 'perante', 'sobre', 'alem', 'tras']],
  ['conjuncao', ['e', 'ou', 'mas', 'porem', 'porque', 'pois', 'se', 'ainda', 'logo', 'entao']],
  ['determinante', ['meu', 'minha', 'teu', 'tua', 'seu', 'sua', 'nosso', 'nossa', 'vosso', 'vossa', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esse', 'isso', 'isto', 'aquele', 'aquela']],
  ['pronome', ['eu', 'tu', 'ele', 'ela', 'nos', 'voce', 'voces', 'eles', 'elas', 'me', 'te', 'lhe', 'lhes', 'se', 'noso', 'convosco', 'comigo', 'contigo', 'connosco']],
  ['verbo-suporte', ['ser', 'sou', 'es', 'eh', 'somos', 'sao', 'estar', 'estou', 'estas', 'esta', 'estamos', 'estao', 'esteja', 'ficar', 'fico', 'fica']],
  ['interrogativo', ['quem', 'onde', 'quando', 'como', 'qual', 'quais', 'quanto', 'quanta']],
].forEach(([tipo, palavras]) => palavras.forEach(p => { if (!(p in PAMOSSI_MAPA)) PAMOSSI_MAPA[p] = tipo; }));

const tokenizar = (frase) => (frase.match(/[\p{L}\p{M}][\p{L}\p{M}'’-]*|\p{N}+/gu) || []);

/* "chamo-me" → ["chamo", "me"] — o glossário conhece as partes, não o bloco. */
const dividirPalavra = (tk) => String(tk).split(/[-'’]/).filter(Boolean);

/* Forma conjugada → forma de dicionário. Só verbos que existem no glossário, e
   só quando a palavra não é também uma palavra pequena ("da" fica preposição). */
const PAMOSSI_LEMAS = {};
[
  ['querer', ['quero', 'queres', 'queremos', 'querem', 'queria', 'queriamos', 'queriam', 'quis', 'quiseram']],
  ['comer', ['comes', 'come', 'comemos', 'comem', 'comia', 'comiamos', 'comi', 'comeu', 'comeram']],
  ['beber', ['bebes', 'bebe', 'bebemos', 'bebem', 'bebia', 'bebi', 'bebeu']],
  ['dormir', ['dormes', 'dorme', 'dormimos', 'dormem', 'dormi', 'dormiu']],
  ['acordar', ['acordo', 'acordas', 'acorda', 'acordamos', 'acordam']],
  ['andar', ['ando', 'andas', 'anda', 'andamos', 'andam', 'andei', 'andou']],
  ['correr', ['corro', 'corres', 'corre', 'corremos', 'correm', 'corri', 'correu']],
  ['ver', ['ves', 've', 'vemos', 'veem', 'viram', 'vi', 'viu']],
  ['escrever', ['escrevo', 'escreves', 'escreve', 'escrevemos', 'escrevem', 'escrevi']],
  ['ler', ['le', 'les', 'le', 'lemos', 'leem', 'leram', 'li', 'leu']],
  ['trabalhar', ['trabalho', 'trabalhas', 'trabalha', 'trabalhamos', 'trabalham']],
  ['estudar', ['estudo', 'estudas', 'estuda', 'estudamos', 'estudam']],
  ['gostar', ['gosto', 'gostas', 'gosta', 'gostamos', 'gostam']],
  ['ter', ['tenho', 'tens', 'tem', 'temos', 'tem', 'tinhas', 'tinha', 'tivemos', 'tive', 'teve']],
  ['dar', ['dou', 'damos', 'dao', 'dam', 'dei', 'deu']],
  ['fazer', ['faco', 'fazes', 'faz', 'fazemos', 'fazem', 'fiz', 'fez']],
  ['ajudar', ['ajudo', 'ajudas', 'ajuda', 'ajudamos', 'ajudam']],
  ['brincar', ['brinco', 'brincas', 'brinca', 'brincamos', 'brincam']],
].forEach(([base, formas]) => formas.forEach(f => { if (!(f in PAMOSSI_LEMAS)) PAMOSSI_LEMAS[f] = base; }));

/* índice palavra → entrada do glossário; e índice de expressões ("bom dia",
   "onde fica", "casa de banho") — um sinal pode cobrir várias palavras. */
const PAMOSSI_INDICE = new Map();
const PAMOSSI_EXPRESSOES = new Map();
let PAMOSSI_EXP_MAX = 1;
GLOSSARIO.forEach(g => g.termos.forEach(t => {
  const chave = norm(t.palavra).replace(/[….:;?!]/g, '').trim();
  if (!chave) return;
  const entrada = { palavra: t.palavra, tema: g.tema, estado: t.estado };
  if (!PAMOSSI_INDICE.has(chave)) PAMOSSI_INDICE.set(chave, entrada);
  const partes = [];
  tokenizar(chave).forEach(tk => dividirPalavra(tk).forEach(p => partes.push(norm(p))));
  if (partes.length > 1) {
    const k = partes.join(' ');
    if (!PAMOSSI_EXPRESSOES.has(k)) PAMOSSI_EXPRESSOES.set(k, entrada);
    PAMOSSI_EXP_MAX = Math.max(PAMOSSI_EXP_MAX, partes.length);
  }
}));

/* hit exacto, com a forma de dicionário por baixo (plural ou conjugação) */
const PAMOSSI_DESINENCIAS = ['o', 'as', 'a', 'amos', 'am', 'ava', 'avam', 'ei', 'ou',
  'e', 'es', 'emos', 'em', 'eu', 'ia', 'iam', 'imos', 'iu'];
function procurarSinal(c) {
  if (PAMOSSI_INDICE.has(c)) return PAMOSSI_INDICE.get(c);
  if (c.length > 3 && c.endsWith('s') && PAMOSSI_INDICE.has(c.slice(0, -1))) {
    return { ...PAMOSSI_INDICE.get(c.slice(0, -1)), plural: true, termo: PAMOSSI_INDICE.get(c.slice(0, -1)).palavra };
  }
  const base = PAMOSSI_LEMAS[c];
  if (base && PAMOSSI_INDICE.has(base)) {
    return { ...PAMOSSI_INDICE.get(base), lema: base, termo: PAMOSSI_INDICE.get(base).palavra };
  }
  /* verbo regular conjugado: "compra" → comprar, "venda" → vender. Só funciona
     quando a raiz + infinitivo existe mesmo no glossário, e nunca para palavras
     pequenas ("da", "em"), que são preposições antes de serem qualquer verbo. */
  if (PAMOSSI_MAPA[c]) return null;
  for (const suf of PAMOSSI_DESINENCIAS) {
    if (c.length <= suf.length + 3 || !c.endsWith(suf)) continue;
    const raiz = c.slice(0, -suf.length);
    for (const inf of ['ar', 'er', 'ir']) {
      const found = PAMOSSI_INDICE.get(raiz + inf);
      if (found) return { ...found, lema: raiz + inf, termo: found.palavra };
    }
  }
  return null;
}

/* Frases com o terminador, para saber o que foi pergunta. */
function dividirFrases(texto) {
  const re = /([^[\n.!?…]+)([.!?…\n]*)/g;
  const out = [];
  let m;
  while ((m = re.exec(String(texto || '')))) {
    const frase = m[1].trim();
    if (frase) out.push({ frase, terminador: m[2] || '' });
  }
  return out;
}

/* analisas texto → [{ frase, itens, sinais, datilologias, marcadores, omitidas }] */
function analisarTexto(texto, opts = {}) {
  const unidadesDe = (frase) => {
    const u = [];
    tokenizar(frase).forEach(tk => dividirPalavra(tk).forEach(p => u.push({ chave: norm(p), parte: p })));
    return u;
  };
  const aulaAbc = aulasDeTema('Alfabeto')[0] || null;

  return dividirFrases(texto).map(({ frase, terminador }) => {
    const pergunta = /[?]/.test(terminador + frase);
    const unidades = unidadesDe(frase);
    const itens = [];

    if (opts.soletrar) {
      unidades.forEach(u => {
        [...u.chave].forEach(letra => {
          if (!/[\p{L}\p{N}]/u.test(letra)) return;
          const entrada = PAMOSSI_INDICE.get(letra);
          if (entrada) itens.push({ tipo: 'sinal', palavra: letra.toUpperCase(), entrada, aula: aulaAbc, datilologia: true });
          else itens.push({ tipo: 'desconhecida', palavra: letra });
        });
      });
    } else {
      let i = 0;
      while (i < unidades.length) {
        /* 1) a expressão mais longa que o glossário conhece, antes das palavras soltas */
        let achado = null;
        for (let n = Math.min(PAMOSSI_EXP_MAX, unidades.length - i); n >= 2 && !achado; n--) {
          const k = unidades.slice(i, i + n).map(u => u.chave).join(' ');
          if (PAMOSSI_EXPRESSOES.has(k)) achado = { entrada: PAMOSSI_EXPRESSOES.get(k), cobre: n };
        }
        if (achado) {
          const e = achado.entrada;
          itens.push({ tipo: 'sinal', palavra: e.palavra, entrada: e, aula: aulasDeTema(e.tema)[0] || null, expressao: true });
          i += achado.cobre;
          continue;
        }

        const { chave, parte } = unidades[i];
        const func = PAMOSSI_MAPA[chave];
        const tipoFunc = func ? PAMOSSI_TIPOS[func] : null;
        /* "como", "onde", "qual" fora de uma pergunta são outra coisa — não se
           marcam como interrogação; a pergunta é que lhes dá esse valor. */
        const contaComoMarcador = tipoFunc && !(func === 'interrogativo' && !pergunta);
        /* "a", "o", "e" são artigos — não se convertem no sinal da letra */
        const artigoCurto = contaComoMarcador && tipoFunc.acao === 'omitir' && chave.length <= 2;
        const entrada = artigoCurto ? null : procurarSinal(chave);

        if (entrada) {
          itens.push({ tipo: 'sinal', palavra: entrada.palavra, entrada, aula: aulasDeTema(entrada.tema)[0] || null, origem: entrada.termo && entrada.termo !== parte.toLowerCase() ? parte : null });
        } else if (contaComoMarcador) {
          itens.push({ tipo: func, palavra: parte, rotulo: tipoFunc.rotulo, acao: tipoFunc.acao, nota: tipoFunc.nota });
        } else {
          /* Sem entrada no glossário: em sinalização usa-se o alfabeto manual.
             Não é um sinal — é a letra, e a página diz isso. */
          const ehProprio = i > 0 && /^\p{Lu}/u.test(parte);
          itens.push({
            tipo: 'datilologia',
            palavra: parte,
            letras: [...parte].filter(l => /[\p{L}\p{N}]/u.test(l)).map(l => l.toUpperCase()),
            nome: ehProprio,
            nota: ehProprio
              ? 'Nome próprio: vai em alfabeto manual (datilologia), não é um sinal de LGA.'
              : 'Ainda sem sinal no glossário: mostrada em alfabeto manual para poderes seguir a frase.',
          });
        }
        i += 1;
      }
      if (pergunta) itens.push({ tipo: 'marcador-pergunta', palavra: '?', rotulo: 'Pergunta', acao: 'marcador', nota: 'Enquanto sinalizas a pergunta, as sobrancelas franzem e a cabeça inclina-se ligeiramente — é isso que marca a interrogação, não a palavra.' });
    }

    const sinais = itens.filter(ii => ii.tipo === 'sinal');
    const datilologias = itens.filter(ii => ii.tipo === 'datilologia');
    return {
      frase,
      itens,
      unidades: unidades.length,
      sinais,
      datilologias,
      marcadores: itens.filter(ii => ii.acao === 'marcador'),
      omitidas: itens.filter(ii => ii.acao === 'omitir'),
      desconhecidas: datilologias.map(d => ({ palavra: d.palavra, nome: d.nome })),
    };
  });
}

const PM_EXEMPLOS = [
  'Bom dia! Chamo-me Ana e sou de Luanda.',
  'Onde fica a escola? Eu quero água, por favor.',
  'O professor escreve a lição no caderno e o aluno estuda.',
  'Eu preciso de dinheiro para comprar peixe no mercado. Quanto custa?',
  'A minha mãe trabalha no hospital. Eu gosto de estudar.',
];

const glosaTexto = (r) => r.itens
  .filter(i => i.tipo === 'sinal' || i.tipo === 'datilologia')
  .map(i => i.tipo === 'datilologia' ? [...i.palavra].map(l => l.toUpperCase()).join('-')
    : String(i.palavra || '').replace(/[…]/g, '').trim().toUpperCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
  .join(' · ');

/* ----------------------------------------------------------------------------
   Ilustrações vectoriais animadas. São GLIFOS DE MOVIMENTO (famílias de gesto),
   não a forma exacta do sinal — o vídeo da aula é que faz fé. Cada glifo é
   decorativo (aria-hidden) e vem sempre acompanhado do vídeo.
---------------------------------------------------------------------------- */
const PM_MAOS = '<path class="pm-mao" d="M32 86c-8-6-12-15-12-25V44a5 5 0 0110 0v9M30 52V27a5 5 0 0110 0v25M40 52V22a5 5 0 0110 0v30M50 52V27a5 5 0 0110 0v25M60 56v-8a5 5 0 0110 0v18c0 14-9 24-22 24-8 0-13-3-16-8"/>';
const PM_MARCAS = {
  aceno: '<path class="pm-onda" d="M78 20c7 5 11 13 11 22M88 12c10 7 15 18 15 30"/>',
  acao: '<path class="pm-rumo" d="M14 46c8-12 20-19 34-19"/><path class="pm-rumo" d="M44 22l6 5-6 5"/>',
  grafema: '<rect class="pm-caixa" x="70" y="14" width="26" height="26" rx="7"/><text class="pm-letra" x="83" y="33" text-anchor="middle">A</text>',
  contar: '<circle class="pm-ponto" cx="80" cy="22" r="4"/><circle class="pm-ponto pm-d2" cx="90" cy="32" r="4"/><circle class="pm-ponto pm-d3" cx="98" cy="44" r="4"/>',
  objeto: '<path class="pm-base" d="M18 96h72"/><path class="pm-nuvem" d="M74 30c8 0 14 6 14 13s-6 13-14 13"/>',
  ponto: '<circle class="pm-alvo" cx="88" cy="28" r="12"/><path class="pm-alvo" d="M82 28h12"/>',
  qualidade: '<path class="pm-suporte" d="M76 14v40M100 14v40"/><path class="pm-suporte pm-d2" d="M76 34h24"/>',
  conversa: '<path class="pm-balao" d="M70 22h40a8 8 0 018 8v16a8 8 0 01-8 8H86l-10 8v-8h-6a8 8 0 01-8-8V30a8 8 0 018-8z"/>',
  ciclo: '<path class="pm-circulo" d="M92 32a14 14 0 11-14-14"/><path class="pm-circulo" d="M78 12l4 7-7 3"/>',
};
const PM_MOVIMENTO = {
  'Saudações': 'aceno', 'Diálogos': 'conversa', 'Frases': 'conversa',
  'Alfabeto': 'grafema', 'Números': 'contar', 'Cores': 'ponto', 'Partes do corpo': 'ponto',
  'Verbos': 'acao', 'Adjetivos': 'qualidade', 'Tempos e meses': 'ciclo',
  'Escola': 'objeto', 'Casa': 'objeto', 'Comida e bebida': 'objeto',
};
const pmGlifo = (tema, extra = '', letra = 'A') => {
  const mov = PM_MOVIMENTO[tema] || 'acao';
  let marca = PM_MARCAS[mov] || PM_MARCAS.acao;
  /* o grafema mostra a letra pedida — senão a ilustração mentiria sobre o sinal */
  if (mov === 'grafema') marca = marca.replace('>A<', '>' + esc(letra) + '<');
  return `<svg class="pm-glyph pm-mov-${mov}" viewBox="0 0 120 110" aria-hidden="true" focusable="false">${PM_MAOS}${marca}</svg>${extra}`;
};

/* fala uma frase pontual (não interfere com a leitura da página inteira) */
function falarTexto(texto, btn) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(texto));
  const voz = escolherVoz();
  if (voz) { u.voice = voz; u.lang = voz.lang; } else { u.lang = 'pt-PT'; }
  u.rate = 0.92;
  if (btn) {
    u.onend = () => { btn.setAttribute('aria-pressed', 'false'); };
    u.onerror = () => { btn.setAttribute('aria-pressed', 'false'); };
    btn.setAttribute('aria-pressed', 'true');
  }
  window.speechSynthesis.speak(u);
  return true;
}

/* ---------------- metadados por página ---------------- */
const META_BASE = 'Pamosii Viva Surdo';
const META = {
  '/': { t: 'Pamosii Viva Surdo — Aprender, ensinar e comunicar em Língua Gestual Angolana', d: 'Plataforma angolana de inclusão das pessoas surdas: aulas gratuitas de Língua Gestual Angolana (LGA), dicionário, tradutor de bolso Pamosii e recursos para professores.' },
  '/cursos': { t: 'Cursos — Pamosii Viva Surdo', d: 'Catálogo de cursos da Viva Surdo: Língua Gestual Angolana para iniciantes e formação em preparação. Sem preços inventados — apenas oferta real.' },
  '/aprender-lga': { t: 'Aprender LGA — Pamosii Viva Surdo', d: 'Aprende Língua Gestual Angolana com as 17 aulas gratuitas do mini-curso oficial da Viva Surdo, organizadas por tema: saudações, alfabeto, números, cores, verbos e mais.' },
  '/pamosii': { t: 'Glosa português ↔ Língua Gestual Angolana — Pamosii Viva Surdo', d: 'Escreve ou dita uma frase em português e vê a sequência de sinais com o vídeo da aula; ou escolhe os sinais e ouve a frase em português. Glosa de estudo, não tradução automática.' },
  '/dicionario': { t: 'Dicionário português ↔ LGA — Pamosii Viva Surdo', d: 'Procura palavras em português e descobre em que aula de Língua Gestual Angolana o sinal é ensinado. Glossário por tema, com estado de validação visível em cada entrada.' },
  '/professores': { t: 'Recursos para professores — Pamosii Viva Surdo', d: 'Materiais de ensino para professores e profissionais que trabalham com alunos surdos: aulas de referência em LGA e recursos em preparação.' },
  '/biblioteca': { t: 'Biblioteca — Pamosii Viva Surdo', d: 'Biblioteca pesquisável de conteúdos gratuitos da Viva Surdo: aulas de LGA em vídeo e materiais em preparação.' },
  '/sobre': { t: 'Sobre — Pamosii Viva Surdo', d: 'Pamosii é a plataforma da Viva Surdo, iniciativa angolana de inclusão das pessoas surdas através da educação, da formação e da Língua Gestual Angolana (LGA).' },
  '/contacto': { t: 'Contacto — Pamosii Viva Surdo', d: 'Canais oficiais verificados da Viva Surdo: Facebook, Instagram e YouTube. Telefone e e-mail serão divulgados após confirmação.' },
};

function setMeta(title, desc) {
  document.title = title;
  const md = $('meta[name="description"]'); if (md) md.setAttribute('content', desc);
  const ogT = $('meta[property="og:title"]'); if (ogT) ogT.setAttribute('content', title);
  const ogD = $('meta[property="og:description"]'); if (ogD) ogD.setAttribute('content', desc);
}

/* ---------------- router (hash) ---------------- */
const routes = [];
const on = (path, view) => routes.push({ path, view });
const go = (path) => { location.hash = '#' + path; };

const REDIRECTS = { '/catalogo': '/cursos' }; // rotas antigas do site anterior

function matchRoute(hash) {
  for (const r of routes) {
    const pattern = r.path.replace(/:[^/]+/g, '([^/]+)');
    const m = hash.match(new RegExp(`^${pattern}$`));
    if (m) {
      const names = [...r.path.matchAll(/:([^/]+)/g)].map(x => x[1]);
      const args = {};
      names.forEach((n, i) => { args[n] = decodeURIComponent(m[i + 1]); });
      return { view: r.view, args };
    }
  }
  return null;
}

/* ---------------- estrutura (header / footer) ---------------- */
const NAV_ITENS = [
  { path: '/', rotulo: 'Início' },
  { path: '/cursos', rotulo: 'Cursos' },
  { path: '/aprender-lga', rotulo: 'Aprender LGA' },
  { path: '/pamosii', rotulo: 'Pamosii' },
  { path: '/dicionario', rotulo: 'Dicionário' },
  { path: '/professores', rotulo: 'Professores' },
  { path: '/biblioteca', rotulo: 'Biblioteca' },
  { path: '/sobre', rotulo: 'Sobre' },
  { path: '/contacto', rotulo: 'Contacto' },
];

const logoHTML = (tam) => `<img src="assets/logo-mark.svg" alt="" width="${tam}" height="${tam}">`;

/* Os quatro destinos que cabem na barra inferior do telemóvel; o resto vive no
   menu "Mais" (o mesmo painel do hambúrguer, para não ter dois menus diferentes). */
const TAB_ITENS = [
  { path: '/', rotulo: 'Início', icone: 'home' },
  { path: '/aprender-lga', rotulo: 'Aprender', icone: 'grad' },
  { path: '/pamosii', rotulo: 'Pamosii', icone: 'chat' },
  { path: '/dicionario', rotulo: 'Dicionário', icone: 'book' },
];

function shell(content, active) {
  const links = NAV_ITENS.map(n =>
    `<a href="#${n.path}"${n.path === active ? ' aria-current="page"' : ''}>${n.rotulo}</a>`).join('');
  const nasTabs = TAB_ITENS.some(n => n.path === active);
  const tabs = TAB_ITENS.map(n =>
    `<a class="tab" href="#${n.path}"${n.path === active ? ' aria-current="page"' : ''}>${I[n.icone]}<span>${n.rotulo}</span></a>`).join('');
  const ano = new Date().getFullYear();
  return `
<header class="site-head">
  <div class="wrap nav">
    <a class="brand" href="#/" aria-label="Pamosii Viva Surdo — página inicial">
      ${logoHTML(38)}
      <span class="wm">Pamosii<small>Viva Surdo<span class="tg-lga"> · Língua Gestual Angolana</span></small></span>
    </a>
    <button class="burger" id="burger" aria-label="Abrir menu de navegação" aria-expanded="false" aria-controls="nav-links">${I.menu}</button>
    <nav class="nav-links" id="nav-links" aria-label="Navegação principal">${links}</nav>
  </div>
</header>
<main id="conteudo" tabindex="-1">${content}</main>
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-in">
      <div>
        <a class="foot-brand" href="#/" aria-label="Pamosii Viva Surdo — página inicial">
          ${logoHTML(36)}<span class="wm">Pamosii Viva Surdo</span>
        </a>
        <p style="font-size:14px;margin:0;max-width:34ch">Iniciativa angolana de inclusão das pessoas surdas. Aprender, ensinar e comunicar em Língua Gestual Angolana.</p>
      </div>
      <nav aria-label="Navegação do rodapé">
        <h2>Navegar</h2>
        <ul class="foot-list">${NAV_ITENS.map(n => `<li><a href="#${n.path}">${n.rotulo}</a></li>`).join('')}</ul>
      </nav>
      <div>
        <h2>Canais oficiais</h2>
        <ul class="foot-list">
          <li><a href="${CONTATOS.facebook.url}" target="_blank" rel="noopener">${I.facebook} Facebook<span class="sr-only"> (abre em nova janela)</span></a></li>
          <li><a href="${CONTATOS.instagram.url}" target="_blank" rel="noopener">${I.instagram} Instagram<span class="sr-only"> (abre em nova janela)</span></a></li>
          <li><a href="${CONTATOS.youtube.url}" target="_blank" rel="noopener">${I.youtube} YouTube<span class="sr-only"> (abre em nova janela)</span></a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${ano} Pamosii Viva Surdo. Conteúdos de LGA publicados com autorização do canal oficial da Viva Surdo.</span>
      <span>Sem registo de contas e sem recolha de dados pessoais nesta versão.</span>
    </div>
  </div>
</footer>
<nav class="tabbar" aria-label="Navegação rápida">
  <div class="tab-in">${tabs}<button class="tab tab-mais${nasTabs ? '' : ' on'}" id="tab-mais" type="button" aria-expanded="false" aria-controls="nav-links">${I.mais}<span>Mais</span></button></div>
</nav>`;
}

/* ---------------- componentes reutilizáveis ---------------- */
const extLink = (url, rotulo, classe = 'btn btn-o btn-sm') =>
  `<a class="${classe}" href="${esc(url)}" target="_blank" rel="noopener">${esc(rotulo)} ${I.external}<span class="sr-only"> (abre em nova janela)</span></a>`;

const soonBadge = () => `<span class="soon">${I.clock} Em breve</span>`;

function videoCard(a) {
  return `<article class="vcard">
    <div class="vfacade">
      <button class="vplay" type="button" data-play="${a.id}" data-titulo="${esc(a.titulo)}"
        aria-label="Ver o vídeo: ${esc(a.titulo)}">
        <img src="https://i.ytimg.com/vi/${a.id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" width="480" height="360">
        <span class="vbtn">${I.play}</span>
      </button>
    </div>
    <div class="vmeta">
      <h3 class="vtitle">${esc(a.titulo)}</h3>
      <p class="vsub">${esc(a.tema)} · Publicado a ${fmtData(a.data)}</p>
      <a class="vlink" href="https://www.youtube.com/watch?v=${a.id}" target="_blank" rel="noopener">Abrir no YouTube ${I.external}<span class="sr-only"> (abre em nova janela)</span></a>
    </div>
  </article>`;
}

function courseCard(c) {
  return `<article class="ccard rv" data-slug="${esc(c.slug)}">
    <div class="ccard-top">
      <span class="chip">${I.video} ${esc(c.formato)}</span>
      <span class="chip">${I.check} ${esc(c.preco)}</span>
    </div>
    <h2 class="ccard-t"><a href="#/cursos/${esc(c.slug)}">${esc(c.titulo)}</a></h2>
    <p class="ccard-d">${esc(c.resumo)}</p>
    <ul class="meta-list">
      <li>${I.users}<span><strong>Público:</strong> ${esc(c.publico)}</span></li>
      <li>${I.target}<span><strong>Nível:</strong> ${esc(c.nivel)}</span></li>
      <li>${I.video}<span><strong>Aulas:</strong> ${c.aulas.length} vídeos públicos</span></li>
      <li>${I.access}<span><strong>Acessibilidade:</strong> ${esc(c.acessibilidade)}</span></li>
    </ul>
    <a class="btn btn-p" href="#/cursos/${esc(c.slug)}">Ver o curso ${I.arrow}</a>
  </article>`;
}

/* ilustração decorativa do herói: duas formas de diálogo + pontos (sem sinais) */
const HERO_ART = `<svg viewBox="0 0 420 340" aria-hidden="true" focusable="false">
  <g fill="none" stroke="#0E756B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".85">
    <path d="M40 96c0-22 18-40 40-40h150c22 0 40 18 40 40v70c0 22-18 40-40 40H120l-44 34v-34c-20-3-36-20-36-40z"/>
    <path d="M250 236c0-18 15-33 33-33h84c18 0 33 15 33 33v34c0 18-15 33-33 33h-6v22l-28-22h-50c-18 0-33-15-33-33z" opacity=".6"/>
  </g>
  <g fill="#F7C948">
    <circle cx="105" cy="131" r="9"/>
    <circle cx="145" cy="131" r="9"/>
    <circle cx="185" cy="131" r="9"/>
  </g>
  <circle cx="300" cy="262" r="7" fill="#0E756B"/>
  <circle cx="326" cy="262" r="7" fill="#0E756B" opacity=".55"/>
  <circle cx="352" cy="262" r="7" fill="#0E756B" opacity=".3"/>
</svg>`;

/* ---------------- vista: página inicial ---------------- */
on('/', () => {
  const c = CURSOS[0];
  const audiencias = [
    { ic: I.users, cls: 't', titulo: 'Sou surdo/a', texto: 'Encontra formação e recursos em Língua Gestual Angolana, com a comunidade surda como público principal.', cta: 'Ver cursos', href: '#/cursos' },
    { ic: I.grad, cls: 't', titulo: 'Sou professor/a', texto: 'Acede a materiais de ensino para trabalhar com alunos surdos — aulas de referência em LGA e recursos em preparação.', cta: 'Ver recursos', href: '#/professores' },
    { ic: I.chat, cls: 'a', titulo: 'Quero aprender LGA', texto: 'Começa hoje: as 17 aulas gratuitas do mini-curso oficial de Língua Gestual Angolana estão abertas a todas as pessoas.', cta: 'Começar a aprender', href: '#/aprender-lga' },
  ];
  const passos = [
    { t: 'Escolhe o teu percurso', d: 'Pessoa surda, professor/a ou pessoa ouvinte que quer aprender LGA — cada caminho tem a sua entrada.' },
    { t: 'Vê as aulas gratuitas', d: 'O mini-curso de LGA está público no canal oficial da Viva Surdo, com aulas organizadas por tema.' },
    { t: 'Acompanha as novidades', d: 'Novos cursos e materiais são anunciados nos canais oficiais à medida que forem aprovados.' },
    { t: 'Abre sem gastar dados', d: 'O dicionário e o Pamosii ficam guardados no telemóvel depois da primeira visita e abrem sem internet — só os vídeos precisam de ligação. No browser, escolhe "Adicionar ao ecrã principal".' },
  ];
  return {
    active: '/',
    h: shell(`
<section class="hero">
  <div class="wrap hero-in">
    <div>
      <p class="eyebrow">${I.spark} Iniciativa angolana de inclusão das pessoas surdas</p>
      <h1>Aprender, ensinar e comunicar em <span class="hl">Língua Gestual Angolana</span>.</h1>
      <p class="lead">O Pamosii reúne pessoas surdas, professores e pessoas ouvintes que querem aprender LGA. Aqui encontras o mini-curso gratuito de Língua Gestual Angolana, o dicionário, o tradutor de bolso e recursos para quem ensina — tudo construído com a comunidade surda da Viva Surdo.</p>
      <div class="hero-ctas">
        <a class="btn btn-p btn-lg" href="#/aprender-lga">Começar a aprender LGA ${I.arrow}</a>
        <a class="btn btn-o btn-lg" href="#/pamosii">Traduzir com o Pamosii</a>
        <a class="btn btn-o btn-lg" href="#/cursos">Ver cursos</a>
      </div>
      <p class="hero-note">Aulas gratuitas em vídeo, no canal oficial da Viva Surdo. Sem registo, sem pagamento.</p>
    </div>
    <div class="hero-art">${HERO_ART}</div>
  </div>
</section>

<section class="section" aria-labelledby="h-aud">
  <div class="wrap">
    <h2 id="h-aud">Como queres usar o Pamosii?</h2>
    <div class="grid g-3">
      ${audiencias.map(a => `
      <article class="aud-card rv">
        <span class="aud-ic ${a.cls}">${a.ic}</span>
        <h3>${a.titulo}</h3>
        <p>${a.texto}</p>
        <a class="btn btn-p btn-sm" href="${a.href}">${a.cta} ${I.arrow}</a>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="section tight" aria-labelledby="h-cur">
  <div class="wrap">
    <h2 id="h-cur">Conteúdo disponível agora</h2>
    <p class="muted" style="max-width:64ch">Só publicamos como curso aquilo que existe de facto. Hoje, o mini-curso de LGA é o nosso conteúdo real e completo.</p>
    <div class="grid" style="margin-top:20px">${courseCard(c)}</div>
  </div>
</section>

<section class="section" aria-labelledby="h-ferr">
  <div class="wrap">
    <h2 id="h-ferr">Ferramentas de comunicação</h2>
    <p class="muted" style="max-width:66ch">A LGA tem gramática própria, por isso estas ferramentas são um apoio de estudo e não um tradutor automático. Cada palavra mostra o vídeo da aula onde o sinal se vê.</p>
    <div class="grid g-2" style="margin-top:20px">
      <article class="aud-card rv">
        <span class="aud-ic t">${I.chat}</span>
        <h3>Pamosii — português ↔ LGA</h3>
        <p>Escreve ou dita uma frase e vê a sequência de sinais com o vídeo de cada aula. Ao contrário: escolhe os sinais e ouve a frase em português. Podes ainda gravar o teu sinal para o reveres em câmara lenta.</p>
        <a class="btn btn-p btn-sm" href="#/pamosii">Abrir o Pamosii ${I.arrow}</a>
      </article>
      <article class="aud-card rv">
        <span class="aud-ic a">${I.book}</span>
        <h3>Dicionário de LGA</h3>
        <p>${GLOSSARIO.reduce((t, g) => t + g.termos.length, 0)} palavras por tema, ligadas à aula onde o sinal é ensinado. Cada entrada diz se ainda está a validar ou se já foi confirmada.</p>
        <a class="btn btn-p btn-sm" href="#/dicionario">Procurar palavras ${I.arrow}</a>
      </article>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="h-como">
  <div class="wrap">
    <h2 id="h-como">Como funciona</h2>
    <div class="steps">
      ${passos.map(p => `
      <div class="step rv">
        <h3>${p.t}</h3>
        <p>${p.d}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="band rv">
      <div>
        <h2>Acompanha a Viva Surdo</h2>
        <p>Os canais oficiais são a fonte fiável de novidades, novas aulas e oportunidades da iniciativa.</p>
        <div class="band-links">
          <a href="${CONTATOS.facebook.url}" target="_blank" rel="noopener">${I.facebook} Facebook<span class="sr-only"> (abre em nova janela)</span></a>
          <a href="${CONTATOS.instagram.url}" target="_blank" rel="noopener">${I.instagram} Instagram<span class="sr-only"> (abre em nova janela)</span></a>
          <a href="${CONTATOS.youtube.url}" target="_blank" rel="noopener">${I.youtube} YouTube<span class="sr-only"> (abre em nova janela)</span></a>
        </div>
      </div>
      <div>
        <a class="btn btn-a" href="#/contacto">Ver todos os contactos ${I.arrow}</a>
      </div>
    </div>
  </div>
</section>`, '/')
  };
});

/* ---------------- vista: catálogo de cursos ---------------- */
on('/cursos', () => {
  const catsComConteudo = CATEGORIAS.filter(c => c.estado === 'com-conteudo').map(c => c.nome);
  const emBreve = CATEGORIAS.filter(c => c.estado === 'em-breve');
  return {
    active: '/cursos',
    h: shell(`
<div class="wrap page-head">
  <h1>Cursos</h1>
  <p class="lead">Catálogo da Viva Surdo. Publicamos apenas cursos que existem de facto — sem preços, promessas ou vagas inventadas.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <form class="filters" role="search" onsubmit="return false">
      <div class="f-field">
        <label for="cat-q">Pesquisar cursos</label>
        <input type="search" id="cat-q" placeholder="Ex.: gestual, iniciante…" autocomplete="off">
      </div>
      <div class="f-field" aria-label="Filtrar por categoria">
        <span class="f-chips" id="cat-chips" role="group" aria-label="Filtrar por categoria">
          <button type="button" class="f-chip" data-cat="todas" aria-pressed="true">Todas</button>
          ${catsComConteudo.map(n => `<button type="button" class="f-chip" data-cat="${esc(n)}" aria-pressed="false">${esc(n)}</button>`).join('')}
        </span>
      </div>
    </form>
    <div id="cat-results" class="grid g-auto" style="margin-top:24px">${CURSOS.map(courseCard).join('')}</div>
    <div id="cat-empty" class="empty" hidden>
      ${I.search}
      <h3>Nenhum curso corresponde à pesquisa</h3>
      <p>Tenta outra palavra ou vê o mini-curso de LGA — é gratuito e aberto a todas as pessoas.</p>
      <a class="btn btn-p btn-sm" href="#/aprender-lga">Aprender LGA ${I.arrow}</a>
    </div>
    <h2 style="margin-top:44px">Categorias em preparação</h2>
    <p class="muted" style="max-width:64ch">Estas áreas fazem parte do plano da Viva Surdo. Quando houver cursos reais, aparecem aqui — até lá, dizemos honestamente o que ainda não existe.</p>
    <div class="grid" style="margin-top:18px">
      ${emBreve.map(c => `
      <div class="cat-soon rv">
        ${soonBadge()}
        <div>
          <h3>${esc(c.nome)}</h3>
          <p>${esc(c.nota)}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>`, '/cursos'),
    bind: bindCatalogo
  };
});

function bindCatalogo() {
  const q = $('#cat-q'), chips = $$('#cat-chips .f-chip'), results = $('#cat-results'), emptyBox = $('#cat-empty');
  if (!q) return;
  let filtroCat = 'todas';
  const aplicar = () => {
    const termo = q.value.trim().toLowerCase();
    let visiveis = 0;
    $$('.ccard', results).forEach(card => {
      const c = CURSOS.find(x => x.slug === card.dataset.slug);
      const okQ = !termo || (c.titulo + ' ' + c.resumo + ' ' + c.categoria + ' ' + c.publico).toLowerCase().includes(termo);
      const okC = filtroCat === 'todas' || c.categoria === filtroCat;
      const ok = okQ && okC;
      card.hidden = !ok;
      if (ok) visiveis++;
    });
    results.hidden = visiveis === 0;
    emptyBox.hidden = visiveis > 0;
  };
  q.addEventListener('input', aplicar);
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === ch ? 'true' : 'false'));
    filtroCat = ch.dataset.cat;
    aplicar();
  }));
}

/* ---------------- vista: detalhe de curso ---------------- */
on('/cursos/:slug', ({ args }) => {
  const c = CURSOS.find(x => x.slug === args.slug);
  if (!c) return notFound();
  const mods = TEMAS
    .map(t => ({ tema: t.nome, icon: t.icon, aulas: c.aulas.filter(a => a.tema === t.nome) }))
    .filter(m => m.aulas.length);
  const meta = {
    t: `${c.titulo} — ${META_BASE}`,
    d: c.resumo,
  };
  return {
    active: '/cursos',
    h: shell(`
<div class="wrap page-head">
  <ol class="crumbs">
    <li><a href="#/">Início</a></li>
    <li><a href="#/cursos">Cursos</a></li>
    <li aria-current="page">${esc(c.titulo)}</li>
  </ol>
  <h1>${esc(c.titulo)}</h1>
  <p class="lead">${esc(c.resumo)}</p>
  <div class="ccard-top" style="margin-top:14px">
    <span class="chip">${I.video} ${esc(c.formato)}</span>
    <span class="chip">${I.check} ${esc(c.preco)}</span>
    <span class="chip">${I.target} Nível: ${esc(c.nivel)}</span>
  </div>
</div>
<div class="wrap course-layout">
  <div class="course-main">
    <section aria-labelledby="h-desc">
      <h2 id="h-desc">Sobre este curso</h2>
      <p class="course-desc">${esc(c.resumo)} As aulas são vídeos públicos do canal oficial da Viva Surdo, reunidos aqui por tema para facilitar a aprendizagem.</p>
      <h3 style="margin-top:22px">O que vais aprender</h3>
      <ul class="obj-list">
        ${c.objectivos.map(o => `<li>${I.check}<span>${esc(o)}</span></li>`).join('')}
      </ul>
    </section>
    <section id="aulas" aria-labelledby="h-mods">
      <h2 id="h-mods">Aulas por tema</h2>
      <p class="muted">${c.aulas.length} aulas em vídeo. Clica numa aula para ver aqui mesmo, ou abre no YouTube.</p>
      <div class="grid" style="gap:14px;margin-top:16px">
        ${mods.map((m, i) => `
        <details class="mod" ${i === 0 ? 'open' : ''}>
          <summary>
            <span class="mod-n">${i + 1}</span>
            <h3>${esc(m.tema)}</h3>
            <span class="mod-count">${m.aulas.length} ${m.aulas.length > 1 ? 'aulas' : 'aula'}</span>
            <span class="chev">${I.chev}</span>
          </summary>
          <div class="mod-body">
            <div class="vgrid">${m.aulas.map(videoCard).join('')}</div>
          </div>
        </details>`).join('')}
      </div>
    </section>
  </div>
  <aside class="course-side" aria-label="Detalhes do curso">
    <div class="side-box">
      <h2>Detalhes</h2>
      <dl>
        <div><dt>Público</dt><dd>${esc(c.publico)}</dd></div>
        <div><dt>Nível</dt><dd>${esc(c.nivel)}</dd></div>
        <div><dt>Formato</dt><dd>${esc(c.formato)}</dd></div>
        <div><dt>Preço</dt><dd>${esc(c.preco)}</dd></div>
        <div><dt>Requisitos</dt><dd>${esc(c.requisitos)}</dd></div>
        <div><dt>Acessibilidade</dt><dd>${esc(c.acessibilidade)}</dd></div>
      </dl>
      <a class="btn btn-p" href="#aulas" style="margin-top:14px">Ver as aulas ${I.arrow}</a>
      ${extLink(CONTATOS.playlist.url, 'Abrir a playlist no YouTube', 'btn btn-o')}
    </div>
    <div class="side-note">${I.info}<span><strong>Inscrição formal: em breve.</strong> Acompanhar as aulas é livre e não precisa de inscrição. O registo com acompanhamento de progresso será anunciado quando estiver pronto.</span></div>
    <div class="side-note">${I.info}<span><strong>Certificados: em breve.</strong> Nesta fase a Viva Surdo não emite certificados — qualquer promessa em contrário não vem de nós.</span></div>
  </aside>
</div>`, '/cursos'),
    meta
  };
});

/* ---------------- vista: aprender LGA ---------------- */
on('/aprender-lga', () => {
  const temas = TEMAS.map(t => ({ ...t, aulas: LGA_AULAS.filter(a => a.tema === t.nome) })).filter(t => t.aulas.length);
  const slug = (t) => 'tema-' + t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
  return {
    active: '/aprender-lga',
    h: shell(`
<div class="wrap page-head">
  <h1>Aprender Língua Gestual Angolana</h1>
  <p class="lead">O ponto de entrada para aprender LGA: as 17 aulas públicas do mini-curso oficial da Viva Surdo, organizadas por tema. Cada aula é um vídeo do canal oficial — gratuito e aberto a todas as pessoas.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <nav class="theme-nav" aria-label="Ir para um tema">
      ${temas.map(t => `<a href="#${slug(t.nome)}">${esc(t.nome)} <b>${t.aulas.length}</b></a>`).join('')}
    </nav>
    ${temas.map(t => `
    <section class="theme-sec" id="${slug(t.nome)}" aria-labelledby="h-${slug(t.nome)}">
      <h2 id="h-${slug(t.nome)}"><span class="t-ic">${I[t.icon]}</span>${esc(t.nome)}</h2>
      <div class="vgrid">${t.aulas.map(videoCard).join('')}</div>
    </section>`).join('')}
    <div class="note-band">
      ${I.info}
      <p><strong>Legendas e transcrições:</strong> as aulas são ministradas em língua gestual. Transcrições e materiais de apoio em texto serão publicados à medida que forem aprovados pela equipa. Se notares um sinal incorrectamente identificado, avisa-nos nos canais oficiais.</p>
    </div>
    <div style="margin-top:26px">
      ${extLink(CONTATOS.playlist.url, 'Ver a playlist completa no YouTube', 'btn btn-p')}
      <a class="btn btn-o" href="#/dicionario" style="margin-left:10px">${I.book} Procurar uma palavra no dicionário</a>
    </div>
  </div>
</section>`, '/aprender-lga')
  };
});

/* ---------------- vista: dicionário português <-> LGA ---------------- */
on('/dicionario', () => {
  const state = { q: '', tema: 'todos' };
  const temas = GLOSSARIO.map(g => g.tema);
  const demo = GLOSSARIO.reduce((t, g) => t + g.termos.filter(x => x.estado === 'demonstracao').length, 0);
  return {
    active: '/dicionario',
    h: shell(`
<div class="wrap page-head">
  <h1>Dicionário de Língua Gestual Angolana</h1>
  <p class="lead">Procura uma palavra em português e salta para a aula de LGA onde o sinal correspondente é ensinado. Ou escolhe um tema e vê o vocabulário completo dessa aula.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <div class="note-band">
      ${I.info}
      <p><strong>Isto ainda não é um tradutor automático.</strong> Não existe tecnologia validada que converta fala em Língua Gestual Angolana, ou gestos em português, de forma fiável. Esta página é um glossário: liga palavras a aulas reais. O vídeo de cada sinal isolado será acrescentado quando for gravado e confirmado pela comunidade surda.</p>
    </div>
    <p class="dic-cta">${I.arrow} <a href="#/pamosii">Queres uma frase inteira? O <strong>Pamosii</strong> decompõe a frase e mostra os sinais por ordem, com vídeo e ditado por voz.</a></p>
    <form class="filters" role="search" onsubmit="return false" style="margin-top:26px">
      <div class="f-field">
        <label for="dic-q">Procurar palavra em português</label>
        <input type="search" id="dic-q" placeholder="Ex.: água, professor, dezembro…" autocomplete="off">
      </div>
    </form>
    <div class="f-chips" id="dic-chips" role="group" aria-label="Filtrar por tema">
      ${['todos', ...temas].map(t => `<button type="button" class="f-chip" data-tema="${esc(t)}" aria-pressed="${t === 'todos'}">${t === 'todos' ? 'Todos os temas' : esc(t)}</button>`).join('')}
    </div>
    <p class="dic-count" id="dic-count" role="status"></p>
    <div id="dic-area"></div>
    <div class="note-band" style="margin-top:30px">
      ${I.users}
      <p><strong>Entradas "A validar":</strong> a associação entre a palavra e a aula foi feita a partir do programa público do mini-curso, mas ainda não foi revista por uma pessoa surda utilizadora de LGA. Se fores, <a href="#/contacto">diz-nos o que está certo ou errado</a> — uma entrada só passa a "Confirmado" depois dessa validação.</p>
    </div>
    ${demo ? `<div class="note-band is-demo" style="margin-top:14px">
      ${I.info}
      <p><strong>Tema "Demonstração (sem vídeo)":</strong> as ${demo} palavras desse tema são <em>só exemplo</em> — servem para o painel conseguir mostrar frases do dia a dia (mercado, autocarro, hospital…). Não são LGA: não têm vídeo, não vêm de nenhuma aula e não foram vistas por ninguém surdo. Saem do site no dia em que o glossário validado chegar.</p>
    </div>` : ''}
  </div>
</section>`, '/dicionario'),
    bind: bindDicionario,
    state,
  };
});

function bindDicionario(state) {
  const q = $('#dic-q'), chips = $$('#dic-chips .f-chip'), area = $('#dic-area'), cont = $('#dic-count');
  if (!q || !area) return;

  const linhaSinal = (aula) => `
      <span class="lib-act"><button class="btn btn-p btn-sm" type="button" data-play="${aula.id}" data-titulo="${esc(aula.titulo)}" aria-label="Ver a aula: ${esc(aula.titulo)}">${I.play} Ver o sinal em uso</button></span>`;

  const grupoHTML = (g, termos) => {
    const aulas = aulasDeTema(g.tema);
    return `<section class="dic-grupo">
      <header class="dic-head">
        <h2>${esc(g.tema)}</h2>
        <div class="dic-aulas">${aulas.length
          ? aulas.slice(0, 2).map(linhaSinal).join('')
          : soonBadge()}</div>
      </header>
      <ul class="dic-words">
        ${termos.map(t => `<li>
          <span class="dic-w">${esc(t.palavra)}</span>
          <span class="dic-badge is-${t.estado}" title="${esc(ESTADO_GLOSSARIO[t.estado].nota)}">${esc(ESTADO_GLOSSARIO[t.estado].rotulo)}</span>
        </li>`).join('')}
      </ul>
    </section>`;
  };

  const desenhar = () => {
    const termo = norm(state.q);
    const grupos = GLOSSARIO
      .filter(g => state.tema === 'todos' || g.tema === state.tema)
      .map(g => ({ g, termos: termo && norm(g.tema).includes(termo)
        ? g.termos
        : g.termos.filter(t => !termo || norm(t.palavra).includes(termo)) }))
      .filter(x => x.termos.length);
    const nPalavras = grupos.reduce((s, x) => s + x.termos.length, 0);
    cont.textContent = nPalavras
      ? `${nPalavras} ${nPalavras === 1 ? 'palavra' : 'palavras'} em ${grupos.length} ${grupos.length === 1 ? 'tema' : 'temas'}`
      : '';
    area.innerHTML = grupos.length
      ? grupos.map(x => grupoHTML(x.g, x.termos)).join('')
      : `<div class="empty">
          ${I.search}
          <h3>Nada encontrado</h3>
          <p>Esta palavra ainda não está no glossário. Diz-nos o que falta — ou explora as aulas por tema.</p>
          <a class="btn btn-p btn-sm" href="#/aprender-lga">Aprender LGA ${I.arrow}</a>
        </div>`;
  };

  q.addEventListener('input', () => { state.q = q.value; desenhar(); });
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === ch ? 'true' : 'false'));
    state.tema = ch.dataset.tema;
    desenhar();
  }));
  desenhar();
}

/* ---------------- vista: Pamosii (tradutor de bolso português ↔ LGA) ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let pmCam = null;

/* O estado vive fora da vista: a frase escrita e a sequência de sinais não desaparecem
   quando o utilizador navega para ver um vídeo ou um tema. */
const pmEstado = { modo: 'pt-lga', texto: 'Onde fica a escola? Eu quero água, por favor.', soletrar: false, tema: 'Saudações', chain: [], quadros: 0 };

function desligarCamara() {
  if (!pmCam) return;
  try { pmCam.stream && pmCam.stream.getTracks().forEach(t => t.stop()); } catch (e) { /* já parada */ }
  if (pmCam.rec && pmCam.rec.state !== 'inactive') { try { pmCam.rec.stop(); } catch (e) { /* já parada */ } }
  if (pmCam.url) { URL.revokeObjectURL(pmCam.url); pmCam.url = null; }
  pmCam = null;
}

function pmCard(it, n) {
  const e = it.entrada || {};
  const estado = ESTADO_GLOSSARIO[e.estado || 'a-validar'];
  const num = `<span class="pm-num">${n === undefined ? '' : n}</span>`;
  if (it.tipo === 'datilologia') {
    return `<li class="pm-card pm-card-dati">
      <div class="pm-facade pm-dati">${it.letras.map(l => `<span class="pm-letra">${esc(l)}</span>`).join('')}</div>
      <p class="pm-word">${num}<span class="pm-word-t">${esc(it.palavra)}</span></p>
      <p class="pm-tag">${it.nome ? 'Nome próprio' : 'Sem sinal no glossário'}<span class="pm-badge-dati">Alfabeto manual</span></p>
      <p class="pm-nota">${esc(it.nota)}</p>
    </li>`;
  }
  const abc = it.datilologia ? String(it.palavra).charAt(0) : 'A';
  const notas = [];
  if (it.expressao) notas.push('Um só sinal para várias palavras.');
  if (it.origem) notas.push(`Forma de «${it.origem}» no dicionário.`);
  if (e.plural) notas.push('Plural: repete-se o sinal.');
  const midia = it.aula
    ? `<div class="vfacade pm-facade"><button class="vplay" type="button" data-play="${it.aula.id}" data-titulo="${esc(it.aula.titulo)}"
         aria-label="Ver o vídeo do sinal de ${esc(it.palavra)} na aula ${esc(it.aula.titulo)}">
         <img src="https://i.ytimg.com/vi/${it.aula.id}/hqdefault.jpg" alt="Quadro da aula «${esc(it.aula.titulo)}»" loading="lazy" decoding="async" width="480" height="360">
         <span class="vbtn">${I.play}</span></button></div>`
    : `<div class="pm-facade pm-novideo">${pmGlifo(e.tema, '', abc)}<span class="pm-sem-video">${I.info} Ainda sem vídeo deste sinal</span></div>`;
  return `<li class="pm-card${e.estado === 'demonstracao' ? ' pm-card-demo' : ''}">
    ${midia}
    <p class="pm-word">${num}${it.aula ? pmGlifo(e.tema, '', abc) : ''}<span class="pm-word-t">${esc(it.palavra)}</span></p>
    ${notas.length ? `<p class="pm-nota">${notas.map(esc).join(' ')}</p>` : ''}
    <p class="pm-tag">${esc(e.tema || 'Glossário')}<span class="dic-badge is-${e.estado || 'a-validar'}" title="${esc(estado.nota)}">${esc(estado.rotulo)}</span></p>
  </li>`;
}

function pmSentenca(r, i) {
  const marcos = r.marcadores;
  const grupos = {};
  r.omitidas.forEach(o => { (grupos[o.tipo] ||= []).push(o.palavra); });
  const total = r.unidades || r.itens.length;
  const pct = total ? Math.round((r.sinais.length / total) * 100) : 0;
  const cartoes = r.itens.filter(x => x.tipo === 'sinal' || x.tipo === 'datilologia');
  const nomes = r.datilologias.filter(d => d.nome).map(d => d.palavra);
  const lacunas = r.datilologias.filter(d => !d.nome).map(d => d.palavra);
  return `<article class="pm-sent">
  <header class="pm-sent-head">
    <h3>Frase ${i + 1} — <em>“${esc(r.frase)}”</em></h3>
    <span class="pm-tools">
      <button class="btn btn-o btn-sm" type="button" data-speak="${esc(r.frase)}" aria-pressed="false">${I.video} Ouvir em português</button>
      <button class="btn btn-o btn-sm" type="button" data-copy="${esc(glosaTexto(r))}">${I.doc} Copiar glosa</button>
    </span>
  </header>
  <p class="pm-gloss"><strong>Glosa (sequência de sinais):</strong> ${esc(glosaTexto(r) || '—')}</p>
  <p class="pm-meter"><span class="pm-meter-bar" aria-hidden="true"><span class="pm-meter-fill" style="width:${pct}%"></span></span><span class="pm-meter-t">${r.sinais.length}/${total} com sinal${r.datilologias.length ? ` · ${r.datilologias.length} em alfabeto manual` : ''} · ${pct}% do glossário</span></p>
  <ul class="pm-cards" data-no-read>${cartoes.map((x, n) => pmCard(x, n + 1)).join('')}</ul>
  ${marcos.length ? `<div class="pm-marcas">${marcos.map(m => `<p>${I.access}<strong>${esc(m.rotulo || m.palavra)}</strong> · ${esc(m.palavra)} — ${esc(m.nota)}</p>`).join('')}</div>` : ''}
  ${Object.keys(grupos).length ? `<div class="pm-omit">${Object.entries(grupos).map(([tipo, palavras]) =>
    `<p>${I.close} <strong>${esc(PAMOSSI_TIPOS[tipo].rotulo)}</strong> não se traduz palavra a palavra (${esc(palavras.join(', '))}) — ${esc(PAMOSSI_TIPOS[tipo].nota)}</p>`).join('')}</div>` : ''}
  ${nomes.length || lacunas.length ? `<p class="pm-desconhecidas">${I.info} <strong>Em alfabeto manual:</strong> ${nomes.map(n => `<span class="pm-chip-nome">${esc(n)}</span>`).join('')}${lacunas.map(l => `<span class="pm-chip-bad">${esc(l)}</span>`).join('')}${lacunas.length ? ' Estas palavras ainda não estão no glossário. Sabes o sinal? <a href="#/contacto">Diz-nos</a> — não inventamos glosas.' : ' Nomes próprios seguem sempre em datilologia.'}</p>` : ''}
  <p class="pm-cobertura">${r.sinais.length} de ${total} ${total === 1 ? 'palavra' : 'palavras'} com sinal no glossário${r.datilologias.length ? `, ${r.datilologias.length} em alfabeto manual` : ''}${marcos.length ? `, ${marcos.length} por marcadores de corpo/espaço` : ''}.</p>
</article>`;
}

function pamosiiHTML(state) {
  const demo = GLOSSARIO.reduce((t, g) => t + g.termos.filter(x => x.estado === 'demonstracao').length, 0);
  return `
<div class="wrap page-head">
  <h1>Pamosii — traduzir entre português e Língua Gestual Angolana</h1>
  <p class="lead">Escreve ou <strong>dita</strong> uma frase (ou várias) e o Pamosii devolve a sequência de sinais, com o quadro e o vídeo da aula onde cada sinal se mostra. Ou escolhe os sinais e o Pamosii escreve e <strong>lê em voz alta</strong> a frase em português.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <div class="note-band">
      ${I.info}
      <p><strong>Como funciona, sem promessas.</strong> O Pamosii faz uma <em>glosa</em>: decompõe a frase, procura cada palavra no dicionário e mostra os sinais por ordem, mais os marcadores que a LGA pede no lugar das palavras pequenas (apontar, expressão facial, pausa). <strong>Não é tradução automática</strong> — a LGA tem gramática própria, e nenhum site pode escrever uma frase gramaticalmente correcta em LGA a partir do português sem revisão de pessoas suras. Cada entrada aparece com o estado de validação; o vídeo da aula é sempre a fonte.</p>
    </div>
    ${demo ? `<div class="note-band is-demo">
      ${I.info}
      <p><strong>Como ver o motor a trabalhar hoje:</strong> as frases de exemplo e parte do vocabulário (mercado, autocarro, hospital…) pertencem ao tema <em>Demonstração</em> — ${demo} palavras de treino, sem vídeo e sem validação, para se perceber o mecanismo. Cada cartão diz o que é: sinal de aula, palavra em alfabeto manual, ou demonstração. O tema sai quando o glossário confirmado chegar.</p>
    </div>` : ''}

    <div class="pm-dirs" role="group" aria-label="As quatro direcções de tradução">
      <p class="pm-dirs-t">${I.spark} As quatro direcções — carrega para abrir:</p>
      <button class="pm-dir" type="button" data-atalho="texto-sinais">${I.doc}<span><strong>Texto → Sinais</strong><em>Escreves uma frase e recebes a sequência de sinais, com o vídeo de cada um.</em></span></button>
      <button class="pm-dir" type="button" data-atalho="voz-sinais">${I.video}<span><strong>Voz → Sinais</strong><em>Ditas a frase; o ditado do browser enche o campo de texto.</em></span></button>
      <button class="pm-dir" type="button" data-atalho="sinais-texto">${I.book}<span><strong>Sinais → Texto</strong><em>Escolhes os sinais por ordem e o Pamosii escreve a frase em português.</em></span></button>
      <button class="pm-dir" type="button" data-atalho="sinais-voz">${I.play}<span><strong>Sinais → Voz</strong><em>Escolhes os sinais e ouves a frase em voz alta, em português.</em></span></button>
    </div>

    <div class="pm-modes" role="group" aria-label="Direcção da tradução">
      <button class="pm-mode" type="button" data-modo="pt-lga" aria-pressed="true">${I.arrow} Português → LGA</button>
      <button class="pm-mode" type="button" data-modo="lga-pt" aria-pressed="false">${I.book} LGA → Português</button>
    </div>

    <div id="pm-pt">
      <h2>Do português para a sequência de sinais</h2>
      <p class="pm-io">${I.doc} Entra: <strong>texto escrito</strong> ou <strong>voz</strong> (ditado) &nbsp;·&nbsp; Sai: <strong>sinais</strong>, com o vídeo de cada um</p>
      <div class="filters pm-form">
        <div class="f-field pm-field-lg">
          <label for="pm-in">Frase em português — uma ou várias</label>
          <textarea id="pm-in" rows="3" autocomplete="off" placeholder="Bom dia! Onde fica a escola? Eu quero água. Chamo-me Ana.">${esc(state.texto)}</textarea>
        </div>
      </div>
      <div class="pm-exemplos" role="group" aria-label="Frases de exemplo prontas a testar">
        <p class="pm-exemplos-t">${I.spark} Exemplos prontos — carregas e a glosa aparece:</p>
        <div class="pm-exemplos-l">
          ${PM_EXEMPLOS.map(f => `<button class="pm-ex" type="button" data-frase="${esc(f)}" aria-pressed="false">${esc(f)}</button>`).join('')}
        </div>
      </div>
      <div class="pm-tools pm-tools-row">
        ${SR ? `<button class="btn btn-a btn-sm" type="button" id="pm-mic" aria-pressed="false">${I.video} Ditar por voz</button>`
             : `<span class="pm-noVoice">${I.info} Ditado por voz não está disponível neste browser — escreve no campo acima, ou usa o ditado do teu telemóvel.</span>`}
        <label class="pm-check"><input type="checkbox" id="pm-soletrar"> Soletrar letras (nomes próprios, datilologia)</label>
        <button class="btn btn-o btn-sm" type="button" id="pm-clear">Limpar</button>
        <button class="btn btn-p btn-sm" type="button" id="pm-run">Ver a glosa ${I.arrow}</button>
      </div>
      <p class="pm-hint" id="pm-mic-msg" role="status"></p>
      <p class="pm-cobertura" id="pm-status" role="status">Escreve ou dita uma frase para veres a sequência de sinais.</p>
      <div id="pm-out" class="pm-out"></div>
    </div>

    <div id="pm-lga" hidden>
      <h2>Dos sinais para o português escrito e falado</h2>
      <p class="pm-io">${I.doc} Entra: <strong>sinais</strong> que escolhes da lista &nbsp;·&nbsp; Sai: <strong>texto escrito</strong> e <strong>voz</strong> em português</p>
      <p class="muted" style="max-width:64ch">Escolhe um tema, carrega nos sinais por ordem, e o Pamosii escreve e lê a frase em português. É o caminho inverso: <strong>da LGA para a voz</strong>, feito pela tua escolha de sinais — não por reconhecimento automático.</p>
      <div class="f-chips" id="pm-temas" role="group" aria-label="Temas de sinais">
        ${GLOSSARIO.map((g, i) => `<button type="button" class="f-chip" data-tema="${esc(g.tema)}" aria-pressed="${i === 0}">${esc(g.tema)}</button>`).join('')}
      </div>
      <div class="pm-build">
        <div class="pm-col">
          <h2 id="pm-tema-titulo" tabindex="-1">${esc(state.tema)}</h2>
          <p class="pm-count" id="pm-tema-count"></p>
          <ul class="pm-words" id="pm-words"></ul>
        </div>
        <div class="pm-col pm-col-chain">
          <h2>A tua sequência</h2>
          <ol class="pm-chain" id="pm-chain" data-no-read></ol>
          <p class="pm-phrase" id="pm-phrase" aria-live="polite"></p>
          <div class="pm-tools pm-tools-row">
            <button class="btn btn-p btn-sm" type="button" id="pm-speak" aria-pressed="false">${I.video} Ouvir em voz alta</button>
            <button class="btn btn-o btn-sm" type="button" id="pm-copy2">${I.doc} Copiar frase</button>
            <button class="btn btn-o btn-sm" type="button" id="pm-clear2">Limpar sequência</button>
          </div>
          <p class="pm-hint">Para saber o sinal de cada palavra, abre o <a href="#/dicionario">dicionário</a> ou vê a aula do tema.</p>
        </div>
      </div>
    </div>

    <section class="pm-cam" aria-labelledby="pm-cam-h">
      <h2 id="pm-cam-h">Gravar e rever o teu sinal</h2>
      <p class="muted" style="max-width:66ch">Este módulo <strong>não reconhece gestos</strong> — não existe tecnologia validada para isso. Serve para gravares o teu próprio sinal, o veres em câmara lenta e mostrares a uma pessoa sura que confirme. A imagem e o vídeo ficam só neste dispositivo: nada é carregado para a Internet e tudo desaparece ao saíres da página.</p>
      <div class="pm-cam-grid">
        <video id="pm-cam" playsinline muted aria-label="Pré-visualização da câmara"></video>
        <video id="pm-rev" controls hidden aria-label="Reprodução da tua gravação"></video>
      </div>
      <div class="pm-tools pm-tools-row">
        <button class="btn btn-p btn-sm" type="button" id="pm-cam-on">${I.video} Ligar a câmara</button>
        <button class="btn btn-a btn-sm" type="button" id="pm-cam-rec" disabled>${I.play} Gravar</button>
        <button class="btn btn-o btn-sm" type="button" id="pm-cam-shot" disabled>Capturar quadro</button>
        <label class="pm-check">Velocidade de revisão
          <select id="pm-cam-speed"><option value="0.5">0,5×</option><option value="0.75">0,75×</option><option value="1" selected>1×</option></select>
        </label>
        <button class="btn btn-o btn-sm" type="button" id="pm-cam-off">Desligar e apagar</button>
      </div>
      <div class="pm-frames" id="pm-frames"></div>
      <p class="pm-cammsg" id="pm-cam-msg" role="status"></p>
    </section>

    <div class="note-band" style="margin-top:26px">
      ${I.shield}
      <p><strong>Privacidade:</strong> o ditado por voz usa o serviço de reconhecimento do teu browser, a câmara só acende quando pedes, e nenhuma gravação ou texto é enviado por este site. Não graves terceiros sem consentimento.</p>
    </div>
  </div>
</section>`;
}

function bindPamosii(state) {
  const $ = (s) => document.querySelector(s);
  const inBox = $('#pm-in'), out = $('#pm-out');

  const micMsg = (erro) => {
    const alvo = $('#pm-mic-msg');
    if (!alvo) return;
    const mapa = {
      'not-allowed': 'Não deste permissão ao microfone. Sem permissão nada é ouvido — escreve a frase no campo.',
      'service-not-allowed': 'O browser bloqueou o serviço de reconhecimento deste site. Usa o ditado por voz do teclado do teu telemóvel.',
      'no-speech': 'Não ouvi nada. Tenta de novo mais perto do microfone, ou escreve tu mesmo.',
      'audio-capture': 'Não encontrei microfone neste dispositivo.',
      'network': 'O ditado por voz precisa de ligação à Internet. Sem ligação, escreve a frase.',
      'aborted': '',
      'nao-iniciou': 'O ditado não arrancou. Carrega outra vez em “Ditar por voz”.'
    };
    alvo.textContent = erro in mapa ? mapa[erro] : 'O ditado por voz interrompeu. Podes escrever a frase.';
  };

  const mudarModo = (modo) => {
    state.modo = modo;
    $$('.pm-mode').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
    $('#pm-pt').hidden = modo !== 'pt-lga';
    $('#pm-lga').hidden = modo !== 'lga-pt';
  };
  $$('.pm-mode').forEach(b => b.addEventListener('click', () => mudarModo(b.dataset.modo)));

  /* atalhos das quatro direcções: abrem o painel certo e põem o foco onde
     a pessoa actuou — sem fingir reconhecimento de gestos nem tradução automática */
  const abrirAtalho = (dir) => {
    if (dir === 'texto-sinais' || dir === 'voz-sinais') {
      mudarModo('pt-lga');
      const mic = $('#pm-mic');
      if (dir === 'voz-sinais' && mic) { mic.focus(); micMsg(''); return; }
      inBox.focus();
    } else {
      mudarModo('lga-pt');
      const alvo = (dir === 'sinais-voz' && state.chain.length) ? $('#pm-speak')
        : ($('.pm-wadd') || $('#pm-tema-titulo'));
      if (alvo) alvo.focus();
    }
  };
  $$('.pm-dir').forEach(b => b.addEventListener('click', () => abrirAtalho(b.dataset.atalho)));

  /* ---------- painel A: português → glosa ---------- */
  const correr = () => {
    state.texto = inBox.value;
    const resultados = analisarTexto(state.texto, { soletrar: $('#pm-soletrar').checked });
    const status = $('#pm-status');
    if (!resultados.length) {
      out.innerHTML = '';
      status.textContent = 'Escreve ou dita uma frase para veres a sequência de sinais.';
      return;
    }
    const s = resultados.reduce((t, r) => t + r.sinais.length, 0);
    const e = resultados.reduce((t, r) => t + (r.unidades || r.itens.length), 0);
    const d = resultados.reduce((t, r) => t + r.datilologias.length, 0);
    status.textContent = `${resultados.length} ${resultados.length === 1 ? 'frase analisada' : 'frases analisadas'} · ${s} de ${e} ${e === 1 ? 'palavra com sinal' : 'palavras com sinal no glossário'}${d ? ` · ${d} em alfabeto manual` : ''}`;
    out.innerHTML = resultados.map(pmSentenca).join('') + `
      <p class="pm-hint">A glosa é uma ajuda de estudo, não uma frase de LGA correcta. Para confirmar ordem e marcadores, fala com <a href="#/dicionario">o dicionário</a> e com a comunidade surda.</p>`;
  };
  let tDebounce = 0;
  inBox.addEventListener('input', () => { marcarChip(inBox.value); clearTimeout(tDebounce); tDebounce = setTimeout(correr, 350); });

  /* frases de exemplo: mostram o motor a trabalhar sem a pessoa ter de inventar texto */
  const chips = $$('.pm-ex');
  const marcarChip = (frase) => chips.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.frase === frase)));
  chips.forEach(b => b.addEventListener('click', () => {
    marcarChip(b.dataset.frase);
    inBox.value = b.dataset.frase;
    correr();
  }));
  /* primeira visita: o campo já traz uma frase de exemplo, para se ver o motor a trabalhar */
  if (state.texto) { marcarChip(state.texto); correr(); }
  const chkSoletrar = $('#pm-soletrar');
  chkSoletrar.checked = state.soletrar;
  chkSoletrar.addEventListener('change', () => { state.soletrar = chkSoletrar.checked; correr(); });
  $('#pm-run').addEventListener('click', correr);
  $('#pm-clear').addEventListener('click', () => { inBox.value = ''; state.texto = ''; out.innerHTML = ''; marcarChip(''); $('#pm-status').textContent = 'Escreve ou dita uma frase para veres a sequência de sinais.'; inBox.focus(); });

  out.addEventListener('click', e => {
    const spk = e.target.closest('[data-speak]');
    if (spk) { falarTexto(spk.dataset.speak, spk); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) copiarTexto(cp.dataset.copy, cp);
  });

  /* ditado por voz → texto → glosa */
  const mic = $('#pm-mic');
  if (mic && SR) {
    let rec = null;
    mic.addEventListener('click', () => {
      if (rec) { rec.stop(); rec = null; return; }
      rec = new SR();
      rec.lang = 'pt-PT';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = true;
      rec.onresult = (ev) => {
        const dito = [...ev.results].slice(ev.resultIndex).map(r => r[0].transcript).join(' ');
        inBox.value = (inBox.value ? inBox.value.trim() + ' ' : '') + dito.trim();
        correr();
      };
      rec.onerror = (ev) => { micMsg(ev.error); };
      rec.onend = () => { rec = null; mic.setAttribute('aria-pressed', 'false'); mic.innerHTML = `${I.video} Ditar por voz`; };
      try { rec.start(); mic.setAttribute('aria-pressed', 'true'); mic.innerHTML = `${I.close} Parar de ditar`; }
      catch (err) { micMsg('nao-iniciou'); }
    });
  }

  /* ---------- painel B: LGA → português (voz) ---------- */
  const temaDois = GLOSSARIO.find(g => g.tema === state.tema) || GLOSSARIO[0];
  const words = $('#pm-words'), chain = $('#pm-chain');
  const desenharTema = () => {
    const g = GLOSSARIO.find(x => x.tema === state.tema) || GLOSSARIO[0];
    $('#pm-tema-titulo').textContent = g.tema;
    $('#pm-tema-count').textContent = `${g.termos.length} palavras · aulas: ${aulasDeTema(g.tema).length || 0}`;
    words.innerHTML = g.termos.map(t => `<li><button type="button" class="pm-wadd" data-palavra="${esc(t.palavra)}" data-tema="${esc(g.tema)}">
      ${esc(t.palavra)}<span class="dic-badge is-${t.estado}">${esc(ESTADO_GLOSSARIO[t.estado].rotulo)}</span></button></li>`).join('');
  };
  const frasePT = () => {
    const t = state.chain.map(c => c.palavra).join(' ');
    return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : '';
  };
  const desenharChain = () => {
    chain.innerHTML = state.chain.length ? state.chain.map((c, i) => `<li>
      <span class="pm-chain-n">${i + 1}</span>
      <span class="pm-chain-w">${esc(c.palavra)}</span>
      <span class="pm-chain-t">${esc(c.tema)}</span>
      <span class="pm-chain-act">
        <button type="button" data-mv="${i}" data-dir="-1" aria-label="Mover ${esc(c.palavra)} uma posição para trás" ${i === 0 ? 'disabled' : ''}>◀</button>
        <button type="button" data-mv="${i}" data-dir="1" aria-label="Mover ${esc(c.palavra)} uma posição para a frente" ${i === state.chain.length - 1 ? 'disabled' : ''}>▶</button>
        <button type="button" data-rm="${i}" aria-label="Remover ${esc(c.palavra)} da sequência">${I.close}</button>
      </span></li>`).join('') : '<li class="pm-chain-empty">Ainda não escolheste sinais. Começa pela lista à esquerda.</li>';
    $('#pm-phrase').textContent = frasePT();
  };
  words.addEventListener('click', e => {
    const b = e.target.closest('.pm-wadd');
    if (!b) return;
    state.chain.push({ palavra: b.dataset.palavra, tema: b.dataset.tema });
    desenharChain();
  });
  chain.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { state.chain.splice(Number(rm.dataset.rm), 1); desenharChain(); return; }
    const mv = e.target.closest('[data-mv]');
    if (!mv) return;
    const i = Number(mv.dataset.mv), j = i + Number(mv.dataset.dir);
    if (j < 0 || j >= state.chain.length) return;
    [state.chain[i], state.chain[j]] = [state.chain[j], state.chain[i]];
    desenharChain();
  });
  $$('#pm-temas .f-chip').forEach(ch => ch.addEventListener('click', () => {
    $$('#pm-temas .f-chip').forEach(x => x.setAttribute('aria-pressed', String(x === ch)));
    state.tema = ch.dataset.tema;
    desenharTema();
    $('#pm-tema-titulo').focus();
  }));
  $('#pm-speak').addEventListener('click', (e) => {
    const f = frasePT();
    if (!f) return;
    if (!falarTexto(f, e.currentTarget)) $('#pm-phrase').insertAdjacentHTML('afterend', '<p class="pm-hint">Este browser não tem síntese de voz — podes ler a frase em voz alta ou usar um leitor de ecrã.</p>');
  });
  $('#pm-copy2').addEventListener('click', (e) => copiarTexto(frasePT(), e.currentTarget));
  $('#pm-clear2').addEventListener('click', () => { state.chain = []; desenharChain(); });
  desenharTema();
  desenharChain();

  /* ---------- painel C: câmara ---------- */
  const video = $('#pm-cam'), rev = $('#pm-rev'), msg = $('#pm-cam-msg');
  const aviso = (t) => { msg.textContent = t; };
  const podeCam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!podeCam) {
    ['#pm-cam-on', '#pm-cam-rec', '#pm-cam-shot'].forEach(s => { const b = $(s); if (b) b.disabled = true; });
    aviso('Este browser não dá acesso à câmara. Numa app ou browser moderno, o módulo fica disponível.');
  }
  $('#pm-cam-on').addEventListener('click', async () => {
    if (pmCam) { aviso('A câmara já está ligada.'); return; }
    aviso('O browser vai pedir permissão para usar a câmara. Ainda nada é gravado.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      pmCam = { stream, rec: null, url: null };
      video.srcObject = stream;
      await video.play();
      video.classList.add('on');
      $('#pm-cam-rec').disabled = false;
      $('#pm-cam-shot').disabled = false;
      aviso('Câmara ligada. Nada é gravado até carregares em Gravar.');
    } catch (err) {
      aviso(err && err.name === 'NotAllowedError'
        ? 'Deste permissão à câmara? Sem permissão não é possível gravar — o site não insiste nem guarda nada.'
        : 'Não foi possível acender a câmara neste dispositivo/browser.');
    }
  });
  $('#pm-cam-rec').addEventListener('click', () => {
    if (!pmCam) return;
    if (pmCam.rec) { pmCam.rec.stop(); return; }
    const tipos = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    const tipo = tipos.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!tipo) { aviso('Este browser não grava vídeo. Ainda podes capturar quadros (imagens).'); return; }
    const chunks = [];
    const rec = new MediaRecorder(pmCam.stream, { mimeType: tipo });
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      if (pmCam && pmCam.url) URL.revokeObjectURL(pmCam.url);
      pmCam.url = URL.createObjectURL(new Blob(chunks, { type: tipo }));
      rev.src = pmCam.url;
      rev.hidden = false;
      rev.playbackRate = Number($('#pm-cam-speed').value);
      aviso('Gravação pronta para rever em baixo. Só existe neste separador — ao saíres da página é apagada.');
      const b = $('#pm-cam-rec');
      b.innerHTML = `${I.play} Gravar`;
      b.setAttribute('aria-pressed', 'false');
    };
    rec.start();
    pmCam.rec = rec;
    const b = $('#pm-cam-rec');
    b.innerHTML = `${I.close} Parar`;
    b.setAttribute('aria-pressed', 'true');
    aviso('A gravar o teu sinal…');
  });
  $('#pm-cam-shot').addEventListener('click', () => {
    if (!pmCam || !video.videoWidth) { aviso('Espera que a imagem apareça antes de capturar o quadro.'); return; }
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/png');
    const n = ++state.quadros;
    const fig = document.createElement('figure');
    fig.className = 'pm-frame';
    fig.innerHTML = `<img src="${url}" alt="Quadro ${n} da tua gravação" width="320" height="${Math.round(320 * c.height / c.width)}">
      <figcaption><a href="${url}" download="pamosii-quadro-${n}.png">Guardar quadro ${n}</a>
      <button type="button" aria-label="Esconder quadro ${n}">${I.close}</button></figcaption>`;
    fig.querySelector('button').addEventListener('click', () => { fig.remove(); state.quadros--; });
    $('#pm-frames').prepend(fig);
    aviso(`Quadro ${n} capturado (imagem no teu dispositivo, nada enviado).`);
  });
  $('#pm-cam-speed').addEventListener('change', (e) => { rev.playbackRate = Number(e.target.value); });
  $('#pm-cam-off').addEventListener('click', () => {
    desligarCamara();
    video.classList.remove('on');
    video.srcObject = null;
    rev.hidden = true;
    rev.removeAttribute('src');
    $('#pm-cam-rec').disabled = true;
    $('#pm-cam-shot').disabled = true;
    $('#pm-frames').innerHTML = '';
    state.quadros = 0;
    aviso('Câmara desligada. Gravações e quadros apagados deste dispositivo.');
  });

  mudarModo(state.modo);
  $$('#pm-temas .f-chip').forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.tema === state.tema)));
  if (state.texto) correr();
}

function copiarTexto(texto, btn) {
  const original = btn.innerHTML;
  const ok = () => { btn.textContent = 'Copiado'; setTimeout(() => { btn.innerHTML = original; }, 1800); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(ok, () => fallback());
  } else { fallback(); }
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    let feito = false;
    try { feito = document.execCommand('copy'); } catch (e) { feito = false; }
    ta.remove();
    if (feito) ok();
    else { btn.textContent = 'Selecciona e copia tu'; setTimeout(() => { btn.innerHTML = original; }, 2600); }
  }
}

on('/pamosii', () => ({
  active: '/pamosii',
  h: shell(pamosiiHTML(pmEstado), '/pamosii'),
  bind: bindPamosii,
  state: pmEstado,
}));

/* ---------------- vista: recursos para professores ---------------- */
on('/professores', () => {
  const recursos = [
    { ic: I.video, cls: 't', titulo: 'Aulas de LGA para referência', estado: 'disponivel', texto: 'As 17 aulas do mini-curso oficial podem servir de referência e apoio em sala, tanto para ensinar LGA como para comunicação básica com alunos surdos.', cta: 'Ver as aulas', href: '#/aprender-lga' },
    { ic: I.doc, cls: 'a', titulo: 'Planos de aula', estado: 'em-breve', texto: 'Planos de aula estruturados para trabalhar com alunos surdos, em preparação pela equipa da Viva Surdo.', cta: null },
    { ic: I.book, cls: 'a', titulo: 'Vocabulário e materiais visuais', estado: 'em-breve', texto: 'Cartões de vocabulário, fichas e materiais visuais descarregáveis para sala de aula.', cta: null },
    { ic: I.access, cls: 'a', titulo: 'Orientações de acessibilidade', estado: 'em-breve', texto: 'Orientações práticas para tornar aulas e escolas mais acessíveis a alunos surdos, a validar com professores e com a comunidade surda.', cta: null },
  ];
  return {
    active: '/professores',
    h: shell(`
<div class="wrap page-head">
  <h1>Recursos para professores</h1>
  <p class="lead">Espaço para professores e profissionais que ensinam ou apoiam pessoas surdas. Só publicamos materiais aprovados pela equipa — o que ainda não existe está claramente marcado como “Em breve”.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <div class="grid g-2">
      ${recursos.map(r => `
      <article class="res-card rv">
        <span class="res-ic ${r.cls}">${r.ic}</span>
        <h3>${r.titulo}</h3>
        ${r.estado === 'em-breve' ? soonBadge() : `<span class="chip">${I.check} Disponível</span>`}
        <p>${r.texto}</p>
        ${r.cta ? `<a class="btn btn-p btn-sm" href="${r.href}">${r.cta} ${I.arrow}</a>` : ''}
      </article>`).join('')}
    </div>
    <div class="note-band" style="margin-top:30px">
      ${I.chat}
      <p><strong>Ensinas pessoas surdas e tens materiais para partilhar?</strong> Fala com a Viva Surdo nos canais oficiais — materiais só são publicados após revisão e aprovação da equipa.</p>
    </div>
    <div style="margin-top:24px">
      <a class="btn btn-p" href="#/contacto">Falar com a Viva Surdo ${I.arrow}</a>
    </div>
  </div>
</section>`, '/professores')
  };
});

/* ---------------- vista: biblioteca ---------------- */
on('/biblioteca', () => {
  const itens = LGA_AULAS.map(a => ({ ...a, tipo: 'Vídeo' }));
  return {
    active: '/biblioteca',
    h: shell(`
<div class="wrap page-head">
  <h1>Biblioteca</h1>
  <p class="lead">Conteúdos gratuitos da Viva Surdo, pesquisáveis. Hoje: as aulas de LGA em vídeo. Guias e materiais descarregáveis serão adicionados quando aprovados.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <form class="filters" role="search" onsubmit="return false">
      <div class="f-field">
        <label for="bib-q">Pesquisar na biblioteca</label>
        <input type="search" id="bib-q" placeholder="Ex.: números, casa, cores…" autocomplete="off">
      </div>
      <div class="f-field">
        <span class="f-chips" id="bib-chips" role="group" aria-label="Filtrar por tipo de conteúdo">
          <button type="button" class="f-chip" data-tipo="todos" aria-pressed="true">Todos</button>
          <button type="button" class="f-chip" data-tipo="Vídeo" aria-pressed="false">Vídeos</button>
          <button type="button" class="f-chip" data-tipo="Guia" aria-pressed="false">Guias</button>
          <button type="button" class="f-chip" data-tipo="Material" aria-pressed="false">Materiais</button>
        </span>
      </div>
    </form>
    <div id="bib-list" class="lib-list" style="margin-top:24px" aria-live="polite"></div>
    <h2 style="margin-top:44px">A chegar</h2>
    <p class="muted" style="max-width:64ch">Itens planeados, ainda não publicados. Aparecem aqui assim que forem aprovados pela equipa.</p>
    <div class="lib-list" style="margin-top:18px">
      ${BIB_EM_BREVE.map(i => `
      <div class="lib-soon">
        <span class="lib-ic">${i.tipo === 'Guia' ? I.doc : I.book}</span>
        <div>
          <h3>${esc(i.titulo)}</h3>
          <p>${esc(i.tipo)} · ${esc(i.nota)}</p>
        </div>
        ${soonBadge()}
      </div>`).join('')}
    </div>
  </div>
</section>`, '/biblioteca'),
    bind: bindBiblioteca,
    state: { itens }
  };
});

function bindBiblioteca(state) {
  const q = $('#bib-q'), chips = $$('#bib-chips .f-chip'), lista = $('#bib-list');
  if (!q) return;
  const { itens } = state;
  let tipo = 'todos';
  const desenhar = () => {
    const termo = q.value.trim().toLowerCase();
    const vis = itens.filter(i => {
      const okQ = !termo || (i.titulo + ' ' + i.tema + ' ' + i.tipo).toLowerCase().includes(termo);
      const okT = tipo === 'todos' || i.tipo === tipo;
      return okQ && okT;
    });
    lista.innerHTML = vis.length ? vis.map(i => `
      <article class="lib-item">
        <span class="lib-ic">${i.tipo === 'Vídeo' ? I.video : I.doc}</span>
        <div class="lib-body">
          <h3><a href="https://www.youtube.com/watch?v=${i.id}" target="_blank" rel="noopener">${esc(i.titulo)}</a></h3>
          <p class="lib-meta">
            <span>${esc(i.tipo)}</span><span>Tema: ${esc(i.tema)}</span><span>Nível: iniciante</span><span>${fmtData(i.data)}</span>
          </p>
          <div class="lib-act">
            <button class="btn btn-p btn-sm" type="button" data-play="${i.id}" data-titulo="${esc(i.titulo)}" aria-label="Ver o vídeo: ${esc(i.titulo)}">${I.play} Ver vídeo</button>
            ${extLink('https://www.youtube.com/watch?v=' + i.id, 'Abrir no YouTube')}
          </div>
        </div>
      </article>`).join('') : `
      <div class="empty">
        ${I.search}
        <h3>Nada encontrado</h3>
        <p>Tenta outra palavra — ou explora as aulas por tema na página Aprender LGA.</p>
        <a class="btn btn-p btn-sm" href="#/aprender-lga">Aprender LGA ${I.arrow}</a>
      </div>`;
  };
  q.addEventListener('input', desenhar);
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === ch ? 'true' : 'false'));
    tipo = ch.dataset.tipo;
    desenhar();
  }));
  desenhar();
}

/* ---------------- vista: sobre ---------------- */
on('/sobre', () => {
  const valores = [
    { ic: I.heart, t: 'Inclusão', d: 'Pessoas surdas como público principal e coautoras da experiência.' },
    { ic: I.grad, t: 'Educação', d: 'Aprendizagem e formação como caminho para inclusão económica e social.' },
    { ic: I.access, t: 'Acessibilidade', d: 'Comunicação em LGA e materiais pensados para todas as pessoas.' },
    { ic: I.users, t: 'Comunidade', d: 'Famílias, professores e pessoas ouvintes a aprender juntos.' },
  ];
  return {
    active: '/sobre',
    h: shell(`
<div class="wrap page-head">
  <h1>Sobre o Pamosii e a Viva Surdo</h1>
  <p class="lead">Uma iniciativa angolana dedicada à inclusão económica e social, à educação e à acessibilidade das pessoas surdas.</p>
</div>
<section class="section tight">
  <div class="wrap about-grid">
    <div>
      <h2>A nossa missão</h2>
      <p><strong>Pamosii</strong> é o nome desta plataforma; a <strong>Viva Surdo</strong> é a iniciativa angolana que a publica. Quando falamos de aulas, vídeos e canais oficiais, falamos sempre da Viva Surdo.</p>
      <p>A Viva Surdo nasceu em Angola para ampliar o acesso à aprendizagem e à formação para pessoas surdas, tendo a Língua Gestual Angolana (LGA) como língua de comunicação e de ensino.</p>
      <p>A plataforma reúne três públicos: pessoas surdas em busca de formação acessível, professores e profissionais que ensinam ou apoiam pessoas surdas, e pessoas ouvintes — familiares, colegas, educadores — que querem aprender LGA.</p>
      <p>A comunidade surda não é tratada como exceção: é o público principal e coautora desta experiência. Os materiais de LGA são validados com utilizadores da língua antes de serem publicados.</p>
      <h2 style="margin-top:26px">O modelo da iniciativa</h2>
      <p>Segundo fontes públicas sobre a Viva Surdo, o projecto inclui formação técnica interpretada em LGA (electricidade, canalização, pastelaria, culinária, decoração, instalação de fios e climatização) e prevê uma base de dados de oportunidades de emprego, estágios e apoio a microempréstimos para pessoas surdas.</p>
      <p class="muted" style="font-size:13.5px">Estes componentes estão descritos em fontes públicas sobre o modelo da iniciativa. A sua operacionalização nesta plataforma só será apresentada como oferta depois de confirmada pela equipa da Viva Surdo.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="fact-card rv">
        <h2>${I.spark} Reconhecimento</h2>
        <p>O projecto foi seleccionado entre os <strong>10 melhores do desafio global de jovens</strong> (Global Youth Challenge / Desafio Genial), segundo notícia do UNICEF Angola publicada em Abril de 2025.</p>
        <p class="src">Fontes públicas para contexto editorial — a UNICEF não é operadora nem patrocinadora deste site:</p>
        <p class="src" style="margin-top:6px">
          <a href="${FONTES_PUBLICAS.unicef1.url}" target="_blank" rel="noopener">${esc(FONTES_PUBLICAS.unicef1.titulo)} — ${esc(FONTES_PUBLICAS.unicef1.nome)}<span class="sr-only"> (abre em nova janela)</span></a>
        </p>
        <p class="src"><a href="${FONTES_PUBLICAS.unicef2.url}" target="_blank" rel="noopener">${esc(FONTES_PUBLICAS.unicef2.titulo)} — ${esc(FONTES_PUBLICAS.unicef2.nome)}<span class="sr-only"> (abre em nova janela)</span></a></p>
        <p class="src"><a href="${FONTES_PUBLICAS.f6s.url}" target="_blank" rel="noopener">${esc(FONTES_PUBLICAS.f6s.titulo)} — ${esc(FONTES_PUBLICAS.f6s.nome)}<span class="sr-only"> (abre em nova janela)</span></a></p>
      </div>
      <div class="fact-card rv">
        <h2>${I.shield} O que este site é — e não é</h2>
        <p>É: um site público e gratuito, com as aulas reais de LGA e informação verificada sobre a iniciativa.</p>
        <p>Não é (ainda): plataforma de contas, inscrições, pagamentos, certificados ou aulas ao vivo. Quando essas funções existirem, serão anunciadas nos canais oficiais.</p>
      </div>
    </div>
  </div>
</section>
<section class="section tight">
  <div class="wrap">
    <h2>Valores</h2>
    <div class="grid g-4">
      ${valores.map(v => `
      <div class="val-card rv">
        ${v.ic}
        <h3>${v.t}</h3>
        <p>${v.d}</p>
      </div>`).join('')}
    </div>
  </div>
</section>
<section class="section tight">
  <div class="wrap">
    <div class="band rv">
      <div>
        <h2>Acompanha o trabalho da Viva Surdo</h2>
        <p>Novas aulas, materiais e oportunidades são anunciados nos canais oficiais da iniciativa.</p>
        <div class="band-links">
          <a href="${CONTATOS.facebook.url}" target="_blank" rel="noopener">${I.facebook} Facebook<span class="sr-only"> (abre em nova janela)</span></a>
          <a href="${CONTATOS.instagram.url}" target="_blank" rel="noopener">${I.instagram} Instagram<span class="sr-only"> (abre em nova janela)</span></a>
          <a href="${CONTATOS.youtube.url}" target="_blank" rel="noopener">${I.youtube} YouTube<span class="sr-only"> (abre em nova janela)</span></a>
        </div>
      </div>
      <div><a class="btn btn-a" href="#/contacto">Contactos ${I.arrow}</a></div>
    </div>
  </div>
</section>`, '/sobre')
  };
});

/* ---------------- vista: contacto ---------------- */
on('/contacto', () => {
  const canais = [
    { c: CONTATOS.facebook, ic: I.facebook, desc: 'Notícias, publicações e mensagens da página oficial.' },
    { c: CONTATOS.instagram, ic: I.instagram, desc: 'Actualizações diárias e bastidores da iniciativa.' },
    { c: CONTATOS.youtube, ic: I.youtube, desc: 'Todas as aulas de LGA e vídeos da Viva Surdo.' },
  ];
  return {
    active: '/contacto',
    h: shell(`
<div class="wrap page-head">
  <h1>Contacto e canais oficiais</h1>
  <p class="lead">Estes são os únicos canais verificados pela equipa da Viva Surdo. Ligações externas abrem em nova janela.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <div class="grid g-3">
      ${canais.map(({ c, ic: icn, desc }) => `
      <article class="chan-card rv">
        <span class="chan-ic">${icn}</span>
        <h3>${esc(c.nome)}</h3>
        <p>${esc(desc)}<br><strong>${esc(c.rotulo)}</strong></p>
        ${extLink(c.url, 'Abrir ' + c.nome, 'btn btn-p btn-sm')}
      </article>`).join('')}
    </div>
    <div class="cat-soon" style="margin-top:26px">
      ${I.youtube.replace('class="ic"', 'class="ic" style="width:34px;height:34px;flex:none;color:var(--teal-deep)"')}
      <div>
        <h3>Playlist do mini-curso de LGA</h3>
        <p>Todas as 17 aulas reunidas, no canal oficial da Viva Surdo.</p>
        <p style="margin-top:8px">${extLink(CONTATOS.playlist.url, 'Abrir a playlist', 'btn btn-o btn-sm')}</p>
      </div>
    </div>
    <div class="note-band" style="margin-top:26px">
      ${I.info}
      <p><strong>Telefone e e-mail:</strong> serão divulgados nesta página apenas depois de confirmados pela equipa. Quaisquer outros contactos apresentados em nome da Viva Surdo não foram verificados por nós.</p>
    </div>
    <div class="note-band" style="margin-top:16px">
      ${I.shield}
      <p><strong>Privacidade:</strong> este site não tem formulários e não recolhe dados pessoais. Quando existir um formulário, será publicada a respectiva política de privacidade, com a finalidade e o responsável pelo tratamento.</p>
    </div>
  </div>
</section>`, '/contacto')
  };
});

/* ---------------- vista: 404 ---------------- */
function notFound() {
  return {
    active: null,
    h: shell(`
<div class="wrap nf">
  <h1>404</h1>
  <p class="muted">Esta página não existe — talvez o endereço tenha mudado com o novo Pamosii.</p>
  <a class="btn btn-p" href="#/">Voltar ao início ${I.arrow}</a>
</div>`, null)
  };
}

/* ============================================================================
   motor de renderização
   ============================================================================ */
let primeiraRender = true;
let ioReveal = null;

function initReveal() {
  const els = $$('.rv');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(e => e.classList.add('in'));
    return;
  }
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  ioReveal ??= new IntersectionObserver(entradas => {
    entradas.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); ioReveal.unobserve(x.target); } });
  }, { threshold: 0.08 });
  els.forEach(e => ioReveal.observe(e));
}

let escHeader = null;

function bindHeader() {
  const burger = $('#burger'), links = $('#nav-links');
  if (!burger || !links) return;
  const mais = $('#tab-mais');
  const gatilhos = [burger, mais].filter(Boolean);
  const marcar = (aberto) => gatilhos.forEach(b => {
    b.setAttribute('aria-expanded', String(aberto));
    b.setAttribute('aria-label', aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  });
  const fechar = () => { links.classList.remove('open'); marcar(false); };
  gatilhos.forEach(b => b.addEventListener('click', () => {
    const aberto = links.classList.toggle('open');
    marcar(aberto);
    // o "Mais" da barra inferior vem DEPOIS do menu no DOM: sem mover o foco para o
    // primeiro item, Tab a partir do botão saía do menu e ia para o fim da página
    if (aberto && b === mais) { const primeiro = links.querySelector('a'); if (primeiro) primeiro.focus(); }
  }));
  links.addEventListener('click', e => { if (e.target.closest('a')) fechar(); });
  /* um só listener no documento: bindHeader corre em cada mudança de rota e o DOM do menu
     é recriado, por isso a função anterior é retirada antes de registar a nova */
  if (escHeader) document.removeEventListener('keydown', escHeader);
  escHeader = (e) => {
    if (e.key !== 'Escape' || !links.classList.contains('open')) return;
    fechar();
    const gatilho = gatilhos.find(b => b.offsetParent);
    if (gatilho) gatilho.focus();
  };
  document.addEventListener('keydown', escHeader);
}

async function render() {
  let hash = location.hash.replace(/^#/, '') || '/';
  if (REDIRECTS[hash]) { location.replace('#' + REDIRECTS[hash]); return; }

  pararLeitura();
  desligarCamara();
  const m = matchRoute(hash);
  const resultado = m ? await m.view({ args: m.args }) : notFound();
  const app = $('#app');
  app.innerHTML = resultado.h;

  const meta = resultado.meta || META[hash] || { t: META_BASE, d: META['/'].d };
  setMeta(meta.t, meta.d);
  const live = $('#route-live');
  if (live) live.textContent = meta.t;

  if (resultado.bind) resultado.bind(resultado.state);
  bindHeader();
  initReveal();

  if (!primeiraRender) {
    const main = $('#conteudo');
    if (main) main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  primeiraRender = false;
}

/* âncoras internas (#tema-...) não devem re-renderizar a aplicação */
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (h && !h.startsWith('/')) {
    const el = document.getElementById(h);
    if (el) { el.scrollIntoView(); }
    return;
  }
  render();
});

/* fachada de vídeo: ao clicar, carrega o leitor do YouTube (só depois do clique) */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-play]');
  if (!btn) return;
  const id = btn.dataset.play;
  const titulo = btn.dataset.titulo || 'Aula de LGA';
  /* sem rede o leitor não carrega — é melhor dizê-lo do que deixar um rectângulo à espera.
     O aviso vai DEPOIS da fachada e o botão fica intacto, para poder experimentar de novo
     quando a ligação voltar. */
  if (!navigator.onLine) {
    const fachada = btn.closest('.vfacade') || btn.closest('.lib-act');
    const hospede = fachada && fachada.parentElement ? fachada.parentElement : btn.parentElement;
    if (hospede && !hospede.querySelector('.v-offline')) {
      const aviso = document.createElement('p');
      aviso.className = 'v-offline';
      aviso.setAttribute('role', 'status');
      aviso.textContent = 'Sem ligação: este vídeo precisa de rede para ser reproduzido. O resto do Pamosii funciona offline.';
      hospede.appendChild(aviso);
    }
    return;
  }
  const criarFrame = () => {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    frame.title = titulo;
    frame.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('loading', 'lazy');
    return frame;
  };
  const fachada = btn.closest('.vfacade');
  if (fachada) {
    if (fachada.querySelector('iframe')) return;
    fachada.replaceChildren(criarFrame());
    fachada.querySelector('iframe').focus();
    return;
  }
  /* botão fora de fachada (biblioteca): abre o leitor dentro do próprio item */
  const act = btn.closest('.lib-act');
  if (!act) return;
  const holder = document.createElement('div');
  holder.className = 'vfacade';
  holder.style.marginTop = '10px';
  holder.appendChild(criarFrame());
  act.replaceChildren(holder);
  holder.scrollIntoView({ block: 'nearest' });
});

function iniciarApp() {
  aplicarPrefs(lerPrefs());
  montarPainelA11y();
  render();
}

/* Voltou a ligação: retira os avisos de "sem rede" para não deixar um estado fantasma
   na página — a pessoa pode simplesmente carregar outra vez em Reproduzir. */
window.addEventListener('online', () => {
  document.querySelectorAll('.v-offline').forEach(a => a.remove());
});

/* Funcionar sem rede + "Adicionar ao ecrã principal". O service worker guarda só a
   estrutura, o estilo, o motor (os dados vivem dentro de app.js), os tipos e as
   miniaturas já vistas — nenhum vídeo, nenhum texto escrito pela pessoa, nenhuma gravação.
   Em file:// e em browsers sem Support não há SW: o site continua a funcionar online. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sem offline neste browser */ });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarApp);
else iniciarApp();
