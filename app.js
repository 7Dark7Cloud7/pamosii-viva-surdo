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
  'colhido': { rotulo: 'Colhido', nota: 'Registado por alguém da comunidade via Colheita. Ninguém aqui validou: continua a precisar de confirmação de um sinalizador surdo antes de ser ensinado como LGA.' },
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
   8. BÍBLIA — espaço reservado: texto real, áudio para pessoas cegas e
   sinais de teste. LER ANTES DE EDITAR (regras de integridade):
     - O texto vem de `assets/biblia.json`, gerado por `tools/fetch-biblia.cjs`
       a partir da tradução João Ferreira de Almeida (domínio público). Nunca
       escrever versículos à mão: regenerar o JSON com o script.
     - Não existe uma Bíblia traduzida e publicada em Língua Gestual Angolana
       (verificado em 2026-10-22 no YouTube e na web: só há Bíblias em Libras
       e em ASL). A glosa ao lado do texto é gerada pelo motor Pamosii a partir
       do glossário do site e é SEMPRE "a validar" — não é tradução bíblica
       oficial em LGA, e a página diz isso.
     - O áudio é síntese de voz do próprio dispositivo (Web Speech API), não
       uma locução humana gravada.
     - Libras (Brasil) aparece apenas como modo de teste, claramente separado.
     - VLibras é um serviço público brasileiro de terceiros: só é carregado se
       a pessoa carregar no botão, com aviso de que o texto visível nesta
       página é processado por esse serviço.
   ============================================================================ */
const BIBLIA_FICHEIRO = 'assets/biblia.json';
const BIBLIA_FONTES = {
  traducao: 'João Ferreira de Almeida',
  licenca: 'Domínio público',
  servico: 'bible-api.com (identificador de tradução "almeida")',
};

/* Títulos-resumo e notas editoriais (texto nosso, não escritura) por passagem */
const BIBLIA_EDIT = {
  'genesis-1': { resumo: 'Os primeiros trinta e um versículos da Bíblia: a criação, a luz, o mar, os animais e o ser humano.', cor: 'aurora' },
  'joao-3-16': { resumo: 'Dois versículos: o amor de Deus pelo mundo e a razão desse amor.', cor: 'luz' },
  'salmos-23': { resumo: 'O salmo do pastor — inclui o vale da sombra da morte.', cor: 'campo' },
  'marcos-7-31': { resumo: 'Jesus cura um homem surdo: toca os ouvidos e a língua, olha para o céu e diz «Efatá — abre-te».', cor: 'encontro' },
};

/* Vídeos em LIBRAS (Brasil) verificados — modo de teste, NÃO é LGA */
const LIBRAS_TESTE = [
  { id: 'FVGXVAk-bIc', titulo: 'Libras Génesis CAP 1', canal: 'AMO LIBRAS (Brasil)', para: 'genesis-1', verificado: '2026-10-22' },
  { id: 'NOvTs_erB00', titulo: 'Sinalário Bíblico III — Antigo Testamento', canal: 'Comunicar — Ministério com Surdos (Brasil)', para: null, verificado: '2026-10-22' },
];
const VLIBRAS_APP = 'https://vlibras.gov.br/app';
const VLIBRAS_SCRIPT = VLIBRAS_APP + '/vlibras-plugin.js';

let BIBLIA = null;
let bibErro = null;

async function carregarBiblia() {
  if (BIBLIA) return BIBLIA;
  try {
    const r = await fetch(BIBLIA_FICHEIRO, { cache: 'default' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j || !Array.isArray(j.passagens) || !j.passagens.length) throw new Error('ficheiro vazio');
    BIBLIA = {
      traducao: j.traducao || BIBLIA_FONTES.traducao,
      licenca: j.licenca || BIBLIA_FONTES.licenca,
      obtidoEm: j.obtidoEm || '',
      passagens: j.passagens.map(p => ({
        ...p,
        versos: (p.versos || []).map(v => ({ n: v.n, texto: String(v.texto).replace(/\s+/g, ' ').trim() })),
      })),
    };
    bibErro = null;
  } catch (e) {
    bibErro = e;
  }
  return BIBLIA;
}

const bibPassagem = (chave) => BIBLIA && BIBLIA.passagens.find(p => p.chave === chave);
const bibTemas = () => [...new Set((BIBLIA ? BIBLIA.passagens : []).map(p => p.tema))];
const librasPara = (chave) => LIBRAS_TESTE.filter(v => v.para === chave);

/* ---------------- progresso: fica apenas neste aparelho ---------------- */
const BIB_KEY = 'vs.biblia';
const BIB_PATRAO = { lidos: [], marcados: [], quiz: null, dias: [] };
function lerBibProgresso() {
  try { return { ...BIB_PATRAO, ...(JSON.parse(localStorage.getItem(BIB_KEY) || '{}')) }; }
  catch (e) { return { ...BIB_PATRAO }; }
}
function guardarBibProgresso(p) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const novo = { ...p, dias: p.dias.includes(hoje) ? p.dias : [hoje, ...p.dias].slice(0, 60) };
    localStorage.setItem(BIB_KEY, JSON.stringify(novo));
    return novo;
  } catch (e) { return p; }
}
function bibSequencia(dias) {
  const ordem = [...new Set(dias)].sort().reverse();
  if (!ordem.length) return 0;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  let n = 0;
  for (let i = 0; i < ordem.length; i++) {
    const d = new Date(ordem[i] + 'T00:00:00');
    const dif = Math.round((hoje - d) / 86400000) - i;
    if (dif === 0) n++; else break;
  }
  return n;
}

/* versículo do dia: estável por data, sem servidor e sem aleatório */
function bibFlat() {
  const lista = [];
  (BIBLIA ? BIBLIA.passagens : []).forEach(p => p.versos.forEach(v => lista.push({ chave: p.chave, referencia: p.referencia, n: v.n, texto: v.texto })));
  return lista;
}
function bibDoDia(data = new Date()) {
  const plano = bibFlat();
  if (!plano.length) return null;
  const dias = Math.floor(Date.UTC(Number(String(data.getFullYear()).slice(-2)), data.getMonth(), data.getDate()) / 86400000);
  return plano[Math.abs(dias) % plano.length];
}

/* ---------------- áudio da passagem (Web Speech API) ---------------- */
const bibAudio = { i: 0, ativo: false, chave: null };

function bibPintarVersoActivo() {
  $$('.bib-v').forEach(el => {
    const on = String(el.dataset.v) === String(bibAudio.i) && bibAudio.ativo;
    el.classList.toggle('is-on', on);
    el.setAttribute('aria-current', on ? 'true' : 'false');
  });
  const alvo = $(`.bib-v[data-v="${bibAudio.i}"]`);
  if (alvo && !movReduzido()) alvo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function bibDizer(chave, i) {
  const p = bibPassagem(chave);
  if (!p || !p.versos[i]) {
    if (p && bibAudio.ativo) {
      const prog = lerBibProgresso();
      if (!prog.lidos.includes(chave)) {
        prog.lidos = [...prog.lidos, chave];
        guardarBibProgresso(prog);
      }
      bibParar(`Terminei de ler ${p.referencia} (${p.versos.length} versículos).`);
      const cont = $('.bib-stats-l');
      if (cont) cont.children[0] && (cont.children[0].textContent = `${prog.lidos.length} passagens ouvidas`);
    } else bibParar();
    return;
  }
  bibAudio.chave = chave; bibAudio.i = i; bibAudio.ativo = true;
  const u = new SpeechSynthesisUtterance(`Versículo ${p.versos[i].n}. ${p.versos[i].texto}`);
  const voz = escolherVoz();
  if (voz) { u.voice = voz; u.lang = voz.lang; } else { u.lang = 'pt-PT'; }
  const vel = Number(($('#bib-vel') || { value: 1 }).value || 1);
  u.rate = vel;
  u.onend = () => { if (bibAudio.ativo && bibAudio.chave === chave) bibDizer(chave, i + 1); };
  u.onerror = () => { bibParar('A leitura parou. Podes voltar a carregar em Ouvir.'); };
  bibPintarVersoActivo();
  const live = $('#bib-live');
  if (live) live.textContent = `A ler ${p.referencia}, versículo ${p.versos[i].n} de ${p.versos.length}.`;
  window.speechSynthesis.speak(u);
}

function bibParar(msg) {
  bibAudio.ativo = false;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  bibPintarVersoActivo();
  const btn = $('#bib-play');
  if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.innerHTML = `${I.play} Ouvir esta passagem`; }
  const live = $('#bib-live');
  if (live) live.textContent = msg || 'Leitura parada.';
}

function bibIniciarLeitura(chave) {
  if (!('speechSynthesis' in window)) { $('#bib-live').textContent = 'Este browser não tem síntese de voz. Podes usar o teu leitor de ecrã: o texto está aqui em versículos separados.'; return false; }
  guardarBibProgresso(lerBibProgresso());   /* conta o dia de hoje, só neste aparelho */
  window.speechSynthesis.cancel();
  bibDizer(chave, 0);
  return true;
}

function movReduzido() {
  return document.documentElement.hasAttribute('data-movimento-reduzido') ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/* ---------------- quiz: perguntas construídas a partir do texto real ---------------- */
function bibRand(seed) {
  let t = seed >>> 0;
  return () => { t = (t * 1664525 + 1013904223) >>> 0; return t / 4294967296; };
}
function bibSeedDoDia() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
const bibPalavra = (txt) => {
  const m = String(txt).match(/[\p{L}\p{M}]{5,}/gu) || [];
  return m.sort((a, b) => b.length - a.length)[0] || null;
};

function gerarQuiz(seed) {
  if (!BIBLIA) return [];
  const rnd = bibRand(seed);
  const perguntas = [];
  const palavras = [];
  BIBLIA.passagens.forEach(p => p.versos.forEach(v => (String(v.texto).match(/[\p{L}\p{M}]{5,}/gu) || []).forEach(w => {
    if (!palavras.includes(w)) palavras.push(w);
  })));
  /* sorteia versículos de qualquer passagem — por isso "outras perguntas" muda mesmo */
  const plano = bibFlat();
  const usados = new Set();
  let tent = 0;
  while (perguntas.length < 4 && tent++ < 40) {
    const item = plano[Math.floor(rnd() * plano.length) % plano.length];
    if (usados.has(`${item.chave}:${item.n}`)) continue;
    usados.add(`${item.chave}:${item.n}`);
    const p = bibPassagem(item.chave);
    const alvo = bibPalavra(item.texto);
    if (!alvo) continue;
    const pos = item.texto.indexOf(alvo);
    const antes = item.texto.slice(0, pos), depois = item.texto.slice(pos + alvo.length);
    const erradas = [];
    let guarda = 0;
    while (erradas.length < 3 && guarda++ < 60) {
      const c = palavras[Math.floor(rnd() * palavras.length) % palavras.length];
      if (norm(c) !== norm(alvo) && !erradas.includes(c) && !c.toLowerCase().includes(alvo.toLowerCase())) erradas.push(c);
    }
    if (erradas.length < 3) continue;
    const opts = [alvo, ...erradas].sort(() => rnd() - 0.5);
    perguntas.push({
      tipo: 'completar',
      chave: item.chave,
      pergunta: `Complete — ${p.referencia}, versículo ${item.n}:`,
      texto: `${antes.trim()} _____ ${depois.trim()}`.replace(/\s+/g, ' ').trim(),
      resposta: alvo,
      opcoes: opts,
    });
  }
  return perguntas;
}

/* ---------------- vista: /biblia ---------------- */
const bibEstado = { chave: 'genesis-1', seed: bibSeedDoDia(), respostas: {}, quizFeito: false };

function bibVersoHTML(p, v, idx) {
  const prog = lerBibProgresso();
  const marcado = prog.marcados.includes(`${p.chave}:${v.n}`);
  const r = analisarTexto(v.texto)[0];
  const cartoes = r.itens.filter(x => x.tipo === 'sinal' || x.tipo === 'datilologia');
  const total = r.unidades || r.itens.length;
  const pct = total ? Math.round((r.sinais.length / total) * 100) : 0;
  const lacunas = r.datilologias.map(d => d.palavra);
  return `<li class="bib-v" data-v="${idx}" data-chave="${esc(p.chave)}">
    <span class="bib-vn" aria-hidden="true">${v.n}</span>
    <p class="bib-vt"><span class="sr-only">Versículo ${v.n}. </span>${esc(v.texto)}</p>
    <span class="bib-vact">
      <button class="bib-ico" type="button" data-verse="${idx}" aria-label="Ouvir só o versículo ${v.n}">${I.play}</button>
      <button class="bib-ico" type="button" data-star="${v.n}" aria-pressed="${marcado}" aria-label="${marcado ? 'Remover' : 'Guardar'} o versículo ${v.n} deste aparelho">${marcado ? I.spark : I.heart}</button>
      <button class="bib-ico" type="button" data-copyv="${idx}" aria-label="Copiar o versículo ${v.n}">${I.doc}</button>
      <button class="bib-ico" type="button" data-signer data-texto="${esc(v.texto)}" aria-label="Mostrar os sinais deste versículo no Signer">${I.video}</button>
    </span>
    <details class="bib-glosa">
      <summary>Sinais deste versículo — glosa de estudo <span class="dic-badge is-a-validar">A validar</span></summary>
      <p class="bib-gloss"><strong>Glosa:</strong> ${esc(glosaTexto(r) || '—')}</p>
      <p class="pm-meter"><span class="pm-meter-bar" aria-hidden="true"><span class="pm-meter-fill" style="width:${pct}%"></span></span><span class="pm-meter-t">${r.sinais.length}/${total} palavras com sinal no glossário do site · ${pct}%</span></p>
      <ul class="pm-cards" data-no-read>${cartoes.slice(0, 12).map((x, n) => pmCard(x, n + 1)).join('')}</ul>
      ${cartoes.length > 12 ? `<p class="pm-hint">Mostrados os primeiros 12 de ${cartoes.length} cartões.</p>` : ''}
      ${lacunas.length ? `<p class="bib-falta">${I.info} <strong>Sem sinal no glossário:</strong> ${lacunas.slice(0, 14).map(l => `<span class="pm-chip-bad">${esc(l)}</span>`).join(' ')} Estas palavras é que a equipa precisa de gravar e validar — é esta a lista de trabalho para a Bíblia em LGA.</p>` : ''}
      ${pct < 25 ? `<p class="pm-hint">Cobertura baixa: o texto bíblico usa vocabulário que ainda não está no mini-curso. Não é um erro da pessoa que lê — é o glossário que está incompleto.</p>` : ''}
    </details>
  </li>`;
}

function bibLeitorHTML(p) {
  const vid = librasPara(p.chave)[0];
  return `
<div class="bib-leitor" id="bib-leitor">
  <header class="bib-head">
    <p class="bib-tema">${I.book} ${esc(p.tema)}</p>
    <h2 id="bib-ref">${esc(p.referencia)} — ${esc(p.titulo)}</h2>
    <p class="bib-res">${esc((BIBLIA_EDIT[p.chave] || {}).resumo || '')}</p>
    <p class="bib-lic">${I.check} Texto: <strong>${esc(BIBLIA.traducao)}</strong>, ${esc(BIBLIA.licenca)} · obtido em ${esc(BIBLIA.obtidoEm)} a partir de ${esc(BIBLIA_FONTES.servico)}. ${vid ? '' : 'Versão em vídeo LGA: ainda não existe.'}</p>
  </header>

  <div class="bib-audio" role="group" aria-label="Leitura em voz alta desta passagem">
    <button class="btn btn-p" type="button" id="bib-play" aria-pressed="false">${I.play} Ouvir esta passagem</button>
    <button class="btn btn-o" type="button" id="bib-stop">${I.close} Parar</button>
    <label class="bib-vel">Velocidade
      <select id="bib-vel"><option value="0.8">mais devagar</option><option value="1" selected>normal</option><option value="1.15">mais rápido</option></select>
    </label>
    <span class="bib-verso-cont">${p.versos.length} versículos</span>
  </div>
  <p class="bib-live" id="bib-live" role="status">Pronto para ler em voz alta. A voz é a síntese do teu dispositivo, não uma gravação.</p>

  <ol class="bib-versos" start="1">${p.versos.map((v, i) => bibVersoHTML(p, v, i)).join('')}</ol>
  ${(() => { const sem = p.versos.reduce((t, v) => t.concat(analisarTexto(v.texto)[0].datilologias.map(d => d.palavra)), []);
    registrarLacunas(sem);
    return sem.length ? `<p class="bib-falta">${I.info} <strong>${new Set(sem.map(norm)).size} palavra(s) desta passagem ainda sem sinal em LGA</strong> — ficaram no contador deste aparelho. Regista-as na <a href="#/colher">Colheita</a> se souberes o sinal: é assim que o glossário cresce sem equipa nem servidor.</p>` : '';
  })() }
  ${vid ? `
  <section class="bib-libras" aria-labelledby="bib-libras-h">
    <h3 id="bib-libras-h">${I.video} Teste em Libras (Brasil) — não é LGA</h3>
    <p class="muted" style="max-width:66ch">Há Bíblias sinalizadas em <strong>Libras</strong>, a língua de sinais do Brasil, e em ASL. <strong>Não são Língua Gestual Angolana</strong>: os sinais são outros. Serve para comparar e para a equipa decidir como gravar a versão angolana.</p>
    <div class="vfacade bib-libras-video">
      <button class="vplay" type="button" data-play="${vid.id}" data-titulo="${esc(vid.titulo)} — ${esc(vid.canal)}"
        aria-label="Ver o vídeo em Libras: ${esc(vid.titulo)}">
        <img src="https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg" alt="Quadro do vídeo em Libras «${esc(vid.titulo)}», canal ${esc(vid.canal)}" loading="lazy" decoding="async" width="480" height="360">
        <span class="vbtn">${I.play}</span>
      </button>
    </div>
    <p class="bib-lic"><strong>${esc(vid.titulo)}</strong> · ${esc(vid.canal)} · verificado a ${esc(vid.verificado)} · precisa de ligação à Internet</p>
  </section>` : ''}
</div>`;
}

function bibQuizHTML() {
  const perguntas = gerarQuiz(bibEstado.seed);
  const prog = lerBibProgresso();
  if (!perguntas.length) return '';
  return `
<section class="bib-quiz" id="bib-quiz" aria-labelledby="bib-quiz-h">
  <h3 id="bib-quiz-h">${I.spark} Testa o que guardaste — 4 perguntas de hoje</h3>
  <p class="muted" style="max-width:66ch">As perguntas são geradas a partir do texto real que está nesta página. A pontuação fica guardada <strong>só neste aparelho</strong>: não há contas, não há ranking, não há certificado.</p>
  <form class="bib-qform" id="bib-qform">
    ${perguntas.map((q, i) => `
      <fieldset class="bib-q" data-q="${i}">
        <legend>${i + 1}. ${esc(q.pergunta)}</legend>
        <p class="bib-q-t">${esc(q.texto)}</p>
        <div class="bib-q-opts">${q.opcoes.map(o => `
          <label class="bib-qo"><input type="radio" name="q${i}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}
        </div>
        <p class="bib-q-fb" role="status" data-fb="${i}"></p>
      </fieldset>`).join('')}
    <div class="bib-q-actions">
      <button class="btn btn-p btn-sm" type="submit">Ver o resultado</button>
      <button class="btn btn-o btn-sm" type="button" id="bib-qnew">Outras perguntas ${I.arrow}</button>
      <span class="bib-q-score" id="bib-qscore" role="status">${prog.quiz ? `Melhor de hoje: ${prog.quiz.best}/${prog.quiz.total}` : 'Ainda não respondeste hoje.'}</span>
    </div>
  </form>
</section>`;
}

function bibGlifo() {
  return `<svg class="bib-glifo" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
    <path class="pm-mao" d="M32 86c-8-6-12-15-12-25V44a5 5 0 0110 0v9M30 52V27a5 5 0 0110 0v25M40 52V22a5 5 0 0110 0v30M50 52V27a5 5 0 0110 0v25M60 56v-8a5 5 0 0110 0v18c0 14-9 24-22 24-8 0-13-3-16-8"/>
    <path class="bib-livro" d="M78 30c8-4 18-4 26 0v38c-8-4-18-4-26 0z"/>
    <path class="bib-livro" d="M78 30c-8-4-18-4-26 0"/>
    <circle class="bib-estrela" cx="91" cy="16" r="4"/>
  </svg>`;
}

function bibliaHTML() {
  const p = bibPassagem(bibEstado.chave) || BIBLIA.passagens[0];
  const prog = lerBibProgresso();
  const dia = bibDoDia();
  const temas = bibTemas();
  return `
<div class="wrap page-head bib-head-page">
  <div class="bib-head-in">
    <div>
      <p class="eyebrow">${I.book} Espaço reservado · LGA, áudio e texto</p>
      <h1>Bíblia — ler, ouvir e ver em sinais</h1>
      <p class="lead">Texto bíblico real em português, leitura em voz alta para quem não vê, e a sequência de sinais gerada pelo Pamosii para cada versículo — claramente marcada como <strong>a validar</strong>.</p>
    </div>
    ${bibGlifo()}
  </div>
</div>
<section class="section tight bib-seccao">
  <div class="wrap">
    <div class="note-band is-biblia">
      ${I.shield}
      <p><strong>O que isto é e o que não é.</strong> O texto vem da tradução João Ferreira de Almeida (domínio público), copiado sem alterações. <strong>Não existe uma Bíblia traduzida e publicada em Língua Gestual Angolana</strong> — verificado nos canais públicos: há Bíblias sinalizadas em Libras (Brasil) e em ASL, não em LGA. A glosa que mostramos ao lado de cada versículo é feita pelo motor do Pamosii com o glossário deste site e serve para <em>preparar e pedir a validação</em>, nunca para apresentar uma tradução oficial em LGA. O áudio é a síntese de voz do teu dispositivo, não uma locução gravada.</p>
    </div>

    ${dia ? `
    <article class="bib-dia rv">
      <p class="bib-dia-t">${I.spark} Versículo de hoje</p>
      <p class="bib-dia-v">“${esc(dia.texto)}”</p>
      <p class="bib-dia-r">${esc(dia.referencia)}, versículo ${dia.n}</p>
      <div class="bib-dia-act">
        <a class="btn btn-p btn-sm" href="#/biblia/${esc(dia.chave)}">Abrir a passagem ${I.arrow}</a>
        <button class="btn btn-o btn-sm" type="button" data-dia="${esc(dia.texto)}">${I.video} Ouvir</button>
        <button class="btn btn-o btn-sm" type="button" data-diadit="${esc(`${dia.texto} ${dia.referencia}, versículo ${dia.n}.`)}">${I.doc} Copiar com a referência</button>
      </div>
    </article>` : ''}

    <div class="f-chips bib-nav" role="group" aria-label="Escolher passagem">
      ${BIBLIA.passagens.map(x => `<button type="button" class="f-chip bib-chip" data-chave="${esc(x.chave)}" aria-pressed="${x.chave === p.chave}">${esc(x.referencia)}<small>${esc(x.tema)}</small></button>`).join('')}
    </div>

    ${bibLeitorHTML(p)}

    <section class="bib-stats" aria-label="O teu progresso neste aparelho">
      <h3>${I.check} O teu progresso (só neste aparelho)</h3>
      <p class="bib-stats-l">
        <span class="bib-stat">${prog.lidos.length} passagens ouvidas</span>
        <span class="bib-stat">${prog.marcados.length} versículos guardados</span>
        <span class="bib-stat">${bibSequencia(prog.dias)} dia(s) seguidos</span>
        ${prog.quiz ? `<span class="bib-stat">quiz: ${prog.quiz.best}/${prog.quiz.total}</span>` : ''}
      </p>
      ${prog.marcados.length ? `<p class="bib-stars">${prog.marcados.map(m => {
        const [ch, n] = m.split(':'); const pp = bibPassagem(ch);
        return pp ? `<a class="bib-star-chip" href="#/biblia/${esc(ch)}">★ ${esc(pp.referencia)} · ${esc(n)}</a>` : '';
      }).join(' ')}</p>` : ''}
      <p class="muted" style="max-width:64ch">Sem contas e sem servidor: nada é enviado. Limpar os dados do browser apaga o progresso.</p>
      <button class="btn btn-o btn-sm" type="button" id="bib-reset">Apagar o meu progresso</button>
    </section>

    ${bibQuizHTML()}

    ${vlibrasBlocoHTML({
      h: 'bib-vlibras-h', on: 'bib-vl-on', off: 'bib-vl-off', msg: 'bib-vl-msg',
      rotulo: 'Ligar o avatar VLibras',
      titulo: 'Modo de teste: avatar em Libras (VLibras)',
      texto: 'O <strong>VLibras</strong> é um serviço público do governo brasileiro que traduz texto escrito para Libras e mostra um avatar a sinalizar. É <strong>Libras, não LGA</strong>. Só é carregado se carregares no botão — e, ao ligá-lo, o texto visível desta página passa por esse serviço externo. Neste site nada mais é enviado.',
    })}

    <section class="bib-falta-box rv" aria-labelledby="bib-falta-h">
      <h3 id="bib-falta-h">O que falta para a Bíblia estar em LGA</h3>
      <ul class="bib-falta-l">
        <li>${I.info} Gravar os sinais bíblicos usados pelas comunidades surdas angolanas (Deus, Jesus, orar, cruz, graça, criação…). Cada versículo precisa de sinal visto e aprovado por pessoas suras.</li>
        <li>${I.info} Decidir o vocabulário teológico que ainda não está no mini-curso — é a lista "sem sinal" que aparece em cada versículo.</li>
        <li>${I.info} Nenhum vídeo nosso ainda mostra um sinal bíblico: os vídeos existentes são do mini-curso, e os que estão aqui como Libras são de terceiros, para teste.</li>
      </ul>
      <p class="muted" style="max-width:66ch">Sabes um destes sinais? <a href="#/contacto">Fala com a equipa</a> — a gravação e a validação seguem o protocolo do projecto.</p>
    </section>
  </div>
</section>`;
}

function bindBiblia() {
  const p = bibPassagem(bibEstado.chave) || BIBLIA.passagens[0];

  /* chips de passagem */
  $$('.bib-chip').forEach(c => c.addEventListener('click', () => {
    bibParar();
    bibEstado.chave = c.dataset.chave;
    go('/biblia/' + encodeURIComponent(c.dataset.chave));
  }));

  /* delegação: sobrevive à re-renderização do leitor */
  const raiz = $('#bib-leitor');
  if (raiz) raiz.addEventListener('click', e => {
    const play = e.target.closest('#bib-play');
    if (play) {
      if (bibAudio.ativo) { bibParar(); return; }
      if (bibIniciarLeitura(bibEstado.chave)) {
        play.setAttribute('aria-pressed', 'true');
        play.innerHTML = `${I.close} A ler… (parar)`;
      }
      return;
    }
    if (e.target.closest('#bib-stop')) { bibParar(); return; }
    const only = e.target.closest('[data-verse]');
    if (only) {
      const i = Number(only.dataset.verse);
      bibParar();
      bibDizer(bibEstado.chave, i);
      const btn = $('#bib-play');
      if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.innerHTML = `${I.close} A ler… (parar)`; }
      return;
    }
    const star = e.target.closest('[data-star]');
    if (star) {
      const li = star.closest('.bib-v');
      const chave = li.dataset.chave, n = star.dataset.star;
      const id = `${chave}:${n}`;
      const prog = lerBibProgresso();
      prog.marcados = prog.marcados.includes(id) ? prog.marcados.filter(x => x !== id) : [...prog.marcados, id];
      guardarBibProgresso(prog);
      star.setAttribute('aria-pressed', String(prog.marcados.includes(id)));
      star.innerHTML = prog.marcados.includes(id) ? I.spark : I.heart;
      star.setAttribute('aria-label', `${prog.marcados.includes(id) ? 'Remover' : 'Guardar'} o versículo ${n} deste aparelho`);
      return;
    }
    const cp = e.target.closest('[data-copyv]');
    if (cp) {
      const li = cp.closest('.bib-v');
      const vv = bibPassagem(li.dataset.chave).versos[Number(li.dataset.v)];
      copiarTexto(`${vv.texto} — ${bibPassagem(li.dataset.chave).referencia} ${vv.n}`, cp);
    }
  });

  /* botão "ouvir" do versículo do dia + copiar */
  const diaBtn = $('[data-dia]');
  if (diaBtn) diaBtn.addEventListener('click', () => falarTexto(diaBtn.dataset.dia, diaBtn));
  const diaCopy = $('[data-diadit]');
  if (diaCopy) diaCopy.addEventListener('click', () => copiarTexto(diaCopy.dataset.diadit, diaCopy));

  /* quiz (as perguntas novas trocam-se sozinhas — ver bindQuiz) */
  bindQuiz($('#bib-quiz'));

  /* progresso: apagar */
  const reset = $('#bib-reset');
  if (reset) reset.addEventListener('click', () => {
    try { localStorage.removeItem(BIB_KEY); } catch (e) { /* sem armazenamento */ }
    const alvo = $('.bib-stats');
    if (alvo) { alvo.innerHTML = `<h3>${I.check} O teu progresso (só neste aparelho)</h3><p class="muted">Dados apagados deste aparelho. Ao voltares a usar a secção, a contagem recomeça.</p>`; }
  });

  /* VLibras (serviço externo, só com consentimento explícito) */
  bindVLibras({ h: 'bib-vlibras-h', on: 'bib-vl-on', off: 'bib-vl-off', msg: 'bib-vl-msg' });
}

/* VLibras — serviço público brasileiro. Nada é carregado nem pedido a terceiros
   até a pessoa carregar no botão; o aviso sobre o texto visível é sempre mostrado.
   Usado na Bíblia e no Pamosii (mesmo comportamento, ids diferentes).           */
function vlibrasBlocoHTML(o) {
  return `
<section class="${o.classe || 'bib-vlibras'}" aria-labelledby="${o.h}">
  <h3 id="${o.h}">${I.video} ${esc(o.titulo)}</h3>
  <p class="muted" style="max-width:66ch">${o.texto}</p>
  <div class="bib-vlibras-act">
    <button class="btn btn-a" type="button" id="${o.on}" aria-pressed="false">${I.play} ${esc(o.rotulo)}</button>
    <button class="btn btn-o" type="button" id="${o.off}" hidden>${I.close} Desligar</button>
  </div>
  <p class="bib-vlibras-msg" id="${o.msg}" role="status">Desligado. Nenhum pedido é feito a serviços externos.</p>
</section>`;
}

function desligarVLibras() {
  const w = $('#vlibras-widget');
  if (w) w.remove();
  /* o plugin cria um segundo contentor fora do nosso #vlibras-widget — sem o retirar
     aqui, o botão flutuante do avatar ficava visível depois do "Desligar" */
  const acc = $('#vlibras-access-wrapper');
  if (acc) acc.remove();
  $$('[vw]').forEach(x => x.remove());
  $$('script[src^="' + VLIBRAS_SCRIPT + '"]').forEach(x => x.remove());
  window.__vsVLibrasInst = null;
}
function bindVLibras(o) {
  const on = $('#' + o.on), off = $('#' + o.off), msg = $('#' + o.msg);
  if (!on || !off || !msg) return;
  on.addEventListener('click', async () => {
    on.setAttribute('aria-pressed', 'true');
    msg.textContent = 'A carregar o avatar VLibras (vlibras.gov.br)…';
    try {
      if (!window.VLibras) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = VLIBRAS_SCRIPT; s.async = true;
          s.onload = res; s.onerror = () => rej(new Error('script'));
          document.body.appendChild(s);
        });
      }
      const alvo = $('#vlibras-widget') || (() => {
        const d = document.createElement('div');
        d.id = 'vlibras-widget'; d.setAttribute('vw', ''); d.className = 'enabled';
        d.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
        document.body.appendChild(d);
        return d;
      })();
      alvo.hidden = false;
      if (!window.__vsVLibrasInst) window.__vsVLibrasInst = new window.VLibras.Widget(VLIBRAS_APP);
      msg.textContent = 'Avatar ligado. Usa o botão de acessibilidade do VLibras para ver esta página sinalizada em Libras (serviço do Brasil, não LGA).';
      on.hidden = true; off.hidden = false;
    } catch (e) {
      msg.textContent = 'O VLibras não carregou — é um serviço externo e pode estar indisponível ou bloqueado na tua rede. O texto e o áudio deste site continuam a funcionar.';
      on.setAttribute('aria-pressed', 'false');
    }
  });
  off.addEventListener('click', () => {
    desligarVLibras();
    off.hidden = true; on.hidden = false;
    on.setAttribute('aria-pressed', 'false');
    msg.textContent = 'Desligado. O avatar e os pedidos ao VLibras param aqui; recarrega a página para limpar tudo.';
  });
}
function bindQuiz(seccao) {
  const form = seccao && seccao.querySelector('.bib-qform');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const perguntas = gerarQuiz(bibEstado.seed);
    let acertos = 0;
    perguntas.forEach((q, i) => {
      const escolheu = form.querySelector(`input[name="q${i}"]:checked`);
      const fb = form.querySelector(`[data-fb="${i}"]`);
      if (!escolheu) { fb.textContent = 'Escolhe uma opção.'; fb.className = 'bib-q-fb is-vazio'; return; }
      const certo = escolheu.value === q.resposta;
      if (certo) acertos++;
      fb.textContent = certo ? `Exacto — «${q.resposta}».` : `Não é esta. A palavra do texto é «${q.resposta}».`;
      fb.className = 'bib-q-fb ' + (certo ? 'is-ok' : 'is-bad');
      fb.dataset.noRead = '1';
    });
    const hoje = new Date().toISOString().slice(0, 10);
    const prog = lerBibProgresso();
    const total = perguntas.length;
    const melhor = (prog.quiz && prog.quiz.dia === hoje ? prog.quiz.best : 0);
    const recorde = Math.max(acertos, melhor);
    guardarBibProgresso({ ...prog, quiz: { best: recorde, total, dia: hoje } });
    const score = form.querySelector('#bib-qscore');
    if (score) score.textContent = `Acertaste ${acertos} em ${total}` + (recorde > acertos ? ` · melhor de hoje: ${recorde}/${total}` : '');
    if (!movReduzido() && acertos === total && total) {
      form.classList.add('is-celebra');
      setTimeout(() => form.classList.remove('is-celebra'), 900);
    }
  });
  const qnew = seccao.querySelector('#bib-qnew');
  if (qnew) qnew.addEventListener('click', () => {
    bibEstado.seed = bibEstado.seed + 1;
    const temp = document.createElement('div');
    temp.innerHTML = bibQuizHTML();
    const novo = temp.firstElementChild;
    if (novo) { seccao.replaceWith(novo); bindQuiz(novo); }
    const aviso = $('#bib-live');
    if (aviso) aviso.textContent = 'Novas perguntas carregadas.';
  });
}

async function vistaBiblia(chave) {
  const dados = await carregarBiblia();
  if (!dados) {
    return {
      active: '/biblia',
      h: shell(`
<div class="wrap page-head">
  <h1>Bíblia</h1>
  <div class="note-band">${I.info}<p><strong>O texto bíblico não está disponível neste momento.</strong> O ficheiro <code>assets/biblia.json</code> não abriu (${esc(bibErro ? String(bibErro.message) : 'erro')}). Recarrega a página; se estiveres sem internet e já visitaste esta secção antes, o texto volta a partir da cache.</p></div>
</div>`, '/biblia'),
    };
  }
  if (chave && !bibPassagem(chave)) chave = null;
  bibEstado.chave = chave || bibEstado.chave;
  if (!bibPassagem(bibEstado.chave)) bibEstado.chave = dados.passagens[0].chave;
  const p = bibPassagem(bibEstado.chave);
  return {
    active: '/biblia',
    meta: { t: `${p.referencia} — Bíblia em português, áudio e sinais | Pamosii Viva Surdo`, d: `Ler e ouvir ${p.referencia} em português (Almeida, domínio público), com glosa de sinais por versículo e teste em Libras. Não é uma tradução bíblica em Língua Gestual Angolana.` },
    h: shell(bibliaHTML(), '/biblia'),
    bind: bindBiblia,
  };
}

/* as rotas /biblia e /biblia/:chave registam-se mais abaixo, junto das outras
   (o helper `on` só existe a partir da secção do router) */

/* ============================================================================
   9. EVANGELISMO — roteiro de partilha para usar COM uma pessoa surda.
   LER ANTES DE EDITAR (regras de integridade):
     - Não há "conversões" nem resultados simulados: esta página ensina a
       comunicar, não promete efeitos.
     - Cada frase é português real + a glosa do motor Pamosii (sempre "a
       validar") + áudio do dispositivo. Não existe tradução automática PT↔LGA.
     - Os versículos vêm do mesmo `assets/biblia.json` (Almeida, domínio
       público). Escrever texto bíblico à mão neste ficheiro é proibido.
     - A secção "como comunicar" é conselho prático consensuado (contacto
       visual, falar de frente, sem gritar, confirmar o que se entendeu); não é
       doutrina nem orientação médica.
   ============================================================================ */

/* kit de frases: texto nosso (não escritura) + referência para cada uma */
const EV_KIT = [
  { pt: 'Deus te ama.', ref: 'joao-3-16', nota: 'A frase mais curta que abre a conversa.' },
  { pt: 'Não tenhas medo.', ref: null, nota: 'Serve para descontrair antes de começar.' },
  { pt: 'Quero aprender a comunicar contigo.', ref: null, nota: 'Gesto de respeito: aprendes tu, não apenas falas tu.' },
  { pt: 'Jesus ouviu a tua dor.', ref: 'marcos-7-31', nota: 'Ligado à cura do homem surdo — Marcos 7.' },
  { pt: 'O Senhor é o meu pastor.', ref: 'salmos-23', nota: 'Salmo 23; mostra os sinais um de cada vez.' },
  { pt: 'No princípio Deus criou os céus e a terra.', ref: 'genesis-1', nota: 'Génesis 1:1 — bom ponto de partida.' },
  { pt: 'Podes ler comigo no telemóvel?', ref: null, nota: 'Alternativa imediata quando falta o sinal.' },
];

/* roteiro em 5 passos, cada um com o que fazer e o que evitar */
const EV_ROTEIRO = [
  { t: '1. Chamar a atenção, sem toque brusco', d: 'Acena suavemente, toca de leve no ombro só se estiveres perto, ou acende/apaga a luz. Nunca atires objectos nem grites.', evita: 'Falar de costas ou começar a falar enquanto ela ainda te olha para o lado.' },
  { t: '2. Ficar de frente e à luz', d: 'Mesma altura, rosto iluminado pela frente, boca visível, fundo calmo. Se usas máscara, escreve ou usa sinais.', evita: 'Luz forte por trás de ti (o rosto fica escuro) e falar com a mão a cobrir a boca.' },
  { t: '3. Começar pelo cumprimento em LGA', d: 'Usa a saudação da aula 1 do mini-curso e o sinal de «nome» para pedir/presentar nomes.', evita: 'Entrar directamente num sermão: primeiro estabelecem que estão a comunicar.' },
  { t: '4. Uma ideia de cada vez', d: 'Frase curta, sinal por sinal, e confirma com «percebeste?». Apoia-te no texto no ecrã, no dedo a escrever ou a apontar as palavras.', evita: 'Frases compostas e abstracções longas — perde-se o fio e ninguém ganha.' },
  { t: '5. Fechar com o que fica', d: 'Deixa o versículo copiado ou guardado, aponta o link desta página e combina o próximo contacto.', evita: 'Terminar sem nada escrito: a memória visual esmorece depressa.' },
];

/* postura: o essencial, sem inventar autoridade */
const EV_POSTURA = [
  { t: 'Falar COM a pessoa, não DELA', d: 'Se houver um intérprete ou amigo ouvinte junto, dirige os sinais e o olhar à pessoa surda, não ao intérprete.' },
  { t: 'Não assumes o que ela sabe', d: 'Muitas pessoas surdas não tiveram acesso à Bíblia na sua língua. Explica termos (graça, cruz, ressurreição) com sinais concretos e pede confirmação.' },
  { t: 'A língua dela é a LGA', d: 'Sinais de Libras ou de ASL podem ajudar como ponte, mas não são a língua angolana — diz sempre de onde vem o sinal que estás a usar.' },
  { t: 'Sem pressão', d: 'Dá tempo para responder. O silêncio não é rejeição; é parte da conversa em sinais.' },
];

function evFraseHTML(f, i) {
  const r = analisarTexto(f.pt)[0];
  registrarLacunas(r.datilologias.filter(x => !x.nome).map(x => x.palavra));
  const cartoes = r.itens.filter(x => x.tipo === 'sinal' || x.tipo === 'datilologia');
  const total = r.unidades || r.itens.length;
  const pct = total ? Math.round((r.sinais.length / total) * 100) : 0;
  const passagem = f.ref && bibPassagem(f.ref);
  return `<article class="ev-card rv" data-i="${i}">
    <p class="ev-pt">${esc(f.pt)}</p>
    ${f.nota ? `<p class="ev-nota">${I.info} ${esc(f.nota)}</p>` : ''}
    <p class="ev-gloss"><strong>Glosa (a validar):</strong> ${esc(glosaTexto(r) || '—')}</p>
    <p class="pm-meter"><span class="pm-meter-bar" aria-hidden="true"><span class="pm-meter-fill" style="width:${pct}%"></span></span><span class="pm-meter-t">${r.sinais.length}/${total} palavras com sinal no glossário · ${pct}%</span></p>
    ${cartoes.length ? `<ul class="pm-cards" data-no-read>${cartoes.map((x, n) => pmCard(x, n + 1)).join('')}</ul>` : '<p class="pm-hint">Nenhuma palavra desta frase tem sinal no glossário ainda — usa datilologia ou escreve.</p>'}
    <div class="ev-act">
      <button class="btn btn-p btn-sm" type="button" data-evdit="${esc(f.pt)}">${I.play} Ouvir</button>
      <button class="btn btn-o btn-sm" type="button" data-evcopy="${esc(f.pt + (passagem ? ' — ' + passagem.referencia : ''))}">${I.doc} Copiar</button>
      ${passagem ? `<a class="btn btn-o btn-sm" href="#/biblia/${esc(passagem.chave)}">${I.book} ${esc(passagem.referencia)}</a>` : ''}
    </div>
  </article>`;
}

function evangelismoHTML() {
  const versos = [];
  BIBLIA && BIBLIA.passagens.forEach(p => p.versos.forEach(v => {
    if (v.texto.length > 40 && v.texto.length < 150) versos.push({ chave: p.chave, ref: p.referencia, n: v.n, texto: v.texto });
  }));
  const destaque = versos.slice(0, 3);
  return `
<div class="wrap page-head">
  <p class="eyebrow">${I.heart} Evangelismo · comunicar antes de discursar</p>
  <h1>Partilhar a fé com uma pessoa surda</h1>
  <p class="lead">Um roteiro curto, frases prontas a usar com sinais e áudio, e a postura que faz a diferença. Tudo o que aqui aparece em sinais é <strong>glosa de estudo gerada pelo Pamosii</strong> e está marcada como <em>a validar</em> — não é uma tradução automática de português para Língua Gestual Angolana.</p>
</div>
<section class="section tight">
  <div class="wrap">
    <div class="note-band">
      ${I.info}
      <p><strong>Por que é diferente.</strong> Uma pessoa surda angolana cresceu, quase sempre, sem acesso à Bíblia na sua língua — a LGA não tem uma Bíblia traduzida e publicada (verificado em 2026-10-22). Isso não é falta de interesse: é falta de acesso. Por isso esta página começa pela <em>comunicação</em>, e o texto bíblico vem da Almeida em português, visível no ecrã.</p>
    </div>

    <h2 class="ev-h">${I.check} Roteiro em 5 passos</h2>
    <ol class="ev-roteiro">
      ${EV_ROTEIRO.map(s => `<li class="ev-passo rv">
        <h3>${esc(s.t)}</h3>
        <p>${esc(s.d)}</p>
        <p class="ev-evita">${I.close} <strong>Evitar:</strong> ${esc(s.evita)}</p>
      </li>`).join('')}
    </ol>

    <h2 class="ev-h">${I.book} Versículos prontos a usar</h2>
    <p class="muted" style="max-width:66ch">Três versículos curtos do texto real que está na secção <a href="#/biblia">Bíblia</a>. Carrega em Ouvir para o teu dispositivo ler, ou abre a passagem para ver sinal a sinal.</p>
    <div class="ev-grid">
      ${destaque.map(v => `<article class="ev-verso-card rv">
        <p class="ev-verso-t">“${esc(v.texto)}”</p>
        <p class="ev-verso-r">${esc(v.ref)} ${v.n}</p>
        <div class="ev-act">
          <button class="btn btn-o btn-sm" type="button" data-evdit="${esc(v.texto)}">${I.play} Ouvir</button>
          <a class="btn btn-o btn-sm" href="#/biblia/${esc(v.chave)}">Ver em sinais ${I.arrow}</a>
        </div>
      </article>`).join('')}
    </div>

    <h2 class="ev-h">${I.spark} Kit de frases</h2>
    <p class="muted" style="max-width:66ch">Cada frase tem o português, a glosa em sinais, a cobertura do glossário e os cartões um a um. Se a cobertura for baixa, usa datilologia (alfabeto manual, aula 3) ou escreve no ecrã — o site diz exatamente que palavras ainda não têm sinal.</p>
    <div class="ev-grid">${EV_KIT.map((f, i) => evFraseHTML(f, i)).join('')}</div>

    <h2 class="ev-h">${I.heart} Postura que abre portas</h2>
    <div class="ev-postura">${EV_POSTURA.map(p => `<article class="ev-post rv"><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></article>`).join('')}</div>

    <h2 class="ev-h">${I.video} Quando não sabes o sinal</h2>
    <ul class="ev-tips">
        <li>Datilologia: soletra com o alfabeto manual a palavra que falta — é o que a própria comunidade usa quando não há sinal.</li>
        <li>Escreve: abre este site no telemóvel, escreve a frase e mostra o ecrã. A leitura em ecrã é uma ponte legítima, não uma derrota.</li>
        <li>Pede: «como se faz este sinal?» — as pessoas surdas ensinam; é assim que o glossário do site vai crescer.</li>
        <li>Regista: no fim da conversa, aponta no <a href="#/contacto">contacto</a> os sinais que aprendeste ou que faltaram.</li>
    </ul>

    ${vlibrasBlocoHTML({
      h: 'ev-vlibras-h', on: 'ev-vl-on', off: 'ev-vl-off', msg: 'ev-vl-msg',
      rotulo: 'Ligar o avatar VLibras',
      titulo: 'Modo de teste: avatar em Libras (VLibras)',
      texto: 'Para comparares como uma frase fica sinalizada por um avatar, o <strong>VLibras</strong> (serviço público brasileiro) pode mostrar esta página em Libras. É <strong>Libras, não LGA</strong>, e só é carregado se carregares no botão — a partir daí o texto visível desta página passa por esse serviço externo.',
    })}

    <div class="bib-falta-box rv">
      <h3>Em preparação</h3>
      <ul class="bib-falta-l">
        <li>${I.info} Roteiros por público (jovens, crianças, famílias ouvintes de uma pessoa surda) — precisam de revisão da equipa.</li>
        <li>${I.info} Sinais bíblicos em LGA gravados e validados: é o trabalho listado na secção <a href="#/biblia">Bíblia</a>.</li>
        <li>${I.info} Encontros presenciais de evangelismo acessível: só serão publicados com data e local confirmados.</li>
      </ul>
    </div>
  </div>
</section>`;
}

function bindEvangelismo() {
  $$('[data-evdit]').forEach(b => b.addEventListener('click', () => falarTexto(b.dataset.evdit, b)));
  $$('[data-evcopy]').forEach(b => b.addEventListener('click', () => copiarTexto(b.dataset.evcopy, b)));
  bindVLibras({ h: 'ev-vlibras-h', on: 'ev-vl-on', off: 'ev-vl-off', msg: 'ev-vl-msg' });
}

async function vistaEvangelismo() {
  await carregarBiblia();   /* best-effort: sem o JSON, os cards de versículo simples não aparecem */
  return {
    active: '/evangelismo',
    h: shell(evangelismoHTML(), '/evangelismo'),
    bind: bindEvangelismo,
  };
}
/* a rota /evangelismo regista-se na secção do router, junto das outras */

/* ============================================================================
   10. PREFERÊNCIAS DE ACESSIBILIDADE — guardadas apenas neste dispositivo
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
   11. PAMOSSI — tradutor de bolso português ↔ LGA
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
  '/biblia': { t: 'Bíblia em português, áudio e sinais — Pamosii Viva Surdo', d: 'Texto bíblico real (João Ferreira de Almeida, domínio público), leitura em voz alta para pessoas cegas e glosa de sinais por versículo. Não existe Bíblia publicada em Língua Gestual Angolana; há testes em Libras.' },
  '/evangelismo': { t: 'Evangelismo acessível — Pamosii Viva Surdo', d: 'Roteiros curtos de partilha da Bíblia para usar com pessoas surdas: frases em português com glosa de sinais, áudio e copiar. Conteúdo de estudo, sem promessas de tradução automática.' },
  '/sobre': { t: 'Sobre — Pamosii Viva Surdo', d: 'Pamosii é a plataforma da Viva Surdo, iniciativa angolana de inclusão das pessoas surdas através da educação, da formação e da Língua Gestual Angolana (LGA).' },
  '/colher': { t: 'Colheita participada de sinais LGA — Pamosii Viva Surdo', d: 'Registar sinais de Língua Gestual Angolana com método (configuração da mão, lugar, movimento, expressão). Tudo fica no aparelho de quem regista e é exportado num ficheiro para a equipa validar.' },
  '/marcar': { t: 'Marcação de tempos por sinal — Pamosii Viva Surdo', d: 'Ferramenta para marcar os segundos em que o sinal de cada palavra aparece nas 17 aulas de LGA. As marcações ficam no aparelho e exportam-se em JSON para a equipa cortar os clipes.' },
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

/* As rotas das duas secções novas têm de ser registadas aqui: o helper `on` só
   existe a partir desta linha, e os ficheiros são avaliados de cima para baixo.
   Os próprios painéis vivem nas secções 8 (Bíblia) e 9 (Evangelismo). */
on('/biblia', () => vistaBiblia(null));
on('/biblia/:chave', ({ args }) => vistaBiblia(args.chave));
on('/evangelismo', vistaEvangelismo);

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

/* ---------------- estrutura (header / footer) ----------------
   `extra: true` = aparece no menu (hambúrguer e "Mais"), no rodapé e nas buscas,
   mas NÃO na barra de cima acima de 1280px: os 11 rótulos medidos ocupam 910px
   dentro dos 1076px da coluna e o 12.º ("Colheita") faria a barra partir-se em
   duas linhas. Ver a explicação completa em styles.css, secção da navegação. */
const NAV_ITENS = [
  { path: '/', rotulo: 'Início' },
  { path: '/cursos', rotulo: 'Cursos' },
  { path: '/aprender-lga', rotulo: 'Aprender LGA' },
  { path: '/pamosii', rotulo: 'Pamosii' },
  { path: '/dicionario', rotulo: 'Dicionário' },
  { path: '/professores', rotulo: 'Professores' },
  { path: '/biblioteca', rotulo: 'Biblioteca' },
  { path: '/biblia', rotulo: 'Bíblia' },
  { path: '/evangelismo', rotulo: 'Evangelismo' },
  { path: '/colher', rotulo: 'Colheita', extra: true },
  { path: '/marcar', rotulo: 'Marcação', extra: true },
  { path: '/sobre', rotulo: 'Sobre' },
  { path: '/contacto', rotulo: 'Contacto' },
];

const logoHTML = (tam) => `<img src="assets/logo-mark.svg" alt="" width="${tam}" height="${tam}">`;

/* Os quatro destinos que cabem na barra inferior do telemóvel; o resto vive no
   menu "Mais" (o mesmo painel do hambúrguer, para não ter dois menus diferentes). */
const TAB_ITENS = [
  { path: '/', rotulo: 'Início', icone: 'home' },
  { path: '/aprender-lga', rotulo: 'Aprender', icone: 'grad' },
  { path: '/pamosii', rotulo: 'Pamosii', icone: 'chat', figura: true },
  { path: '/dicionario', rotulo: 'Dicionário', icone: 'book' },
];

function shell(content, active) {
  const links = NAV_ITENS.map(n =>
    `<a href="#${n.path}"${n.extra ? ' class="nav-extra"' : ''}${n.path === active ? ' aria-current="page"' : ''}>${n.rotulo}</a>`).join('');
  const nasTabs = TAB_ITENS.some(n => n.path === active);
  /* o Pamosii leva o boneco do Signer em vez da bolha de fala: na barra inferior do
     telemóvel é o único destino que é "uma pessoa a sinalizar", e o rótulo continua lá. */
  const tabs = TAB_ITENS.map(n =>
    `<a class="tab" href="#${n.path}"${n.path === active ? ' aria-current="page"' : ''}>${n.figura ? `<span class="tab-sign">${sgFigura('Diálogos', 'A')}</span>` : I[n.icone]}<span>${n.rotulo}</span></a>`).join('');
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
        <button class="btn btn-o btn-lg" type="button" data-signer data-texto="olá, como está?">Ver no Signer ${I.video}</button>
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
    <div class="grid g-2" style="margin-top:22px">
      <article class="aud-card rv">
        <span class="aud-ic a">${I.play}</span>
        <h3>Bíblia — ler, ouvir e ver em sinais</h3>
        <p>Texto real em português (Almeida, domínio público), leitura em voz alta para quem não vê, versículo a versículo com a glosa de sinais, e um quiz para fixar. Ainda não existe uma Bíblia publicada em LGA: o que falta está dito com honestidade.</p>
        <a class="btn btn-p btn-sm" href="#/biblia">Abrir a Bíblia ${I.arrow}</a>
      </article>
      <article class="aud-card rv">
        <span class="aud-ic t">${I.heart}</span>
        <h3>Evangelismo acessível</h3>
        <p>Um roteiro de 5 passos para partilhar a fé com uma pessoa surda sem gritar nem discursar, e um kit de frases prontas com sinais, áudio e copiar.</p>
        <a class="btn btn-p btn-sm" href="#/evangelismo">Ver o roteiro ${I.arrow}</a>
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
        ${termos.map(t => {
          const mo = momentoDe(t.palavra);
          return `<li>
          <span class="dic-w">${esc(t.palavra)}</span>
          <span class="dic-badge is-${t.estado}" title="${esc(ESTADO_GLOSSARIO[t.estado].nota)}">${esc(ESTADO_GLOSSARIO[t.estado].rotulo)}</span>
          ${mo ? `<span class="mk-chip" title="${esc('momento ' + (mo.estado === 'confirmado' ? 'confirmado' : 'por validar')) + ' — ' + esc(mo.aulaTitulo || '')}">${I.clock} ${esc(fmtT(mo.inicio))} → ${esc(fmtT(mo.fim))}</span>` : ''}
          <button class="dic-ico" type="button" data-signer data-texto="${esc(t.palavra)}" aria-label="Mostrar ${esc(t.palavra)} no Signer">${I.video}</button>
        </li>`; }).join('')}
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
          <a class="btn btn-o btn-sm" href="#/colher">Registar o sinal que conheço</a>
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
  const momento = it.aula ? momentoDe(it.palavra, it.aula.id) : null;
  if (momento) notas.push(chipMomento(momento));
  const midia = it.aula
    ? `<div class="vfacade pm-facade"><button class="vplay" type="button" data-play="${it.aula.id}" data-titulo="${esc(it.aula.titulo)}"
         ${momento ? `data-start="${momento.inicio}" data-end="${momento.fim}"` : ''}
         aria-label="Ver o vídeo do sinal de ${esc(it.palavra)} na aula ${esc(it.aula.titulo)}${momento ? ', a partir de ' + fmtT(momento.inicio) : ''}">
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
      <button class="btn btn-o btn-sm" type="button" data-signer data-texto="${esc(r.frase)}">Sinais animados</button>
    </span>
  </header>
  <p class="pm-gloss"><strong>Glosa (sequência de sinais):</strong> ${esc(glosaTexto(r) || '—')}</p>
  <p class="pm-meter"><span class="pm-meter-bar" aria-hidden="true"><span class="pm-meter-fill" style="width:${pct}%"></span></span><span class="pm-meter-t">${r.sinais.length}/${total} com sinal${r.datilologias.length ? ` · ${r.datilologias.length} em alfabeto manual` : ''} · ${pct}% do glossário</span></p>
  <ul class="pm-cards" data-no-read>${cartoes.map((x, n) => pmCard(x, n + 1)).join('')}</ul>
  ${marcos.length ? `<div class="pm-marcas">${marcos.map(m => `<p>${I.access}<strong>${esc(m.rotulo || m.palavra)}</strong> · ${esc(m.palavra)} — ${esc(m.nota)}</p>`).join('')}</div>` : ''}
  ${Object.keys(grupos).length ? `<div class="pm-omit">${Object.entries(grupos).map(([tipo, palavras]) =>
    `<p>${I.close} <strong>${esc(PAMOSSI_TIPOS[tipo].rotulo)}</strong> não se traduz palavra a palavra (${esc(palavras.join(', '))}) — ${esc(PAMOSSI_TIPOS[tipo].nota)}</p>`).join('')}</div>` : ''}
  ${nomes.length || lacunas.length ? `<p class="pm-desconhecidas">${I.info} <strong>Em alfabeto manual:</strong> ${nomes.map(n => `<span class="pm-chip-nome">${esc(n)}</span>`).join('')}${lacunas.map(l => `<span class="pm-chip-bad">${esc(l)}</span>`).join('')}${lacunas.length ? ` Estas palavras ainda não estão no glossário. Sabes o sinal? <a href="#/contacto">Diz-nos</a> — não inventamos glosas.` : ' Nomes próprios seguem sempre em datilologia.'}</p>` : ''}
  ${lacunas.length ? `<p class="pm-libras-hint">Para comparares, abre o <button class="pm-link" type="button" data-jump="pm-vlibras-h">modo de teste em Libras</button> — um avatar brasileiro; <strong>não é LGA</strong>.</p>` : ''}
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

      ${vlibrasBlocoHTML({
        h: 'pm-vlibras-h', on: 'pm-vl-on', off: 'pm-vl-off', msg: 'pm-vl-msg', classe: 'bib-vlibras pm-teste',
        rotulo: 'Ligar o avatar em Libras',
        titulo: 'Modo de teste: e em Libras?',
        texto: 'Quando o glossário LGA deste site <strong>não tem o sinal</strong> de uma palavra, o Pamosii mostra datilologia (alfabeto manual) — é o que a comunidade surda angolana usa à falta de sinal. Como <em>teste</em>, podes ligar o <strong>VLibras</strong>, um avatar do governo brasileiro que sinaliza o texto visível desta página em <strong>Libras</strong>. Serve para comparar, não para aprender LGA: <strong>são línguas de sinais diferentes</strong>. Só é carregado se carregares no botão, e a partir daí o texto visível desta página passa por um serviço externo.',
      })}
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
    /* cada palavra que ficou em alfabeto manual por não estar no glossário entra no
       contador local de lacunas (secção 13) — é assim que a Colheita sabe o gravar */
    registrarLacunas(resultados.reduce((t, r) => t.concat(r.datilologias.filter(x => !x.nome).map(x => x.palavra)), []));
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

  /* liga o bloco de teste em Libras (serviço externo, só com consentimento)
     e o atalho "modo de teste em Libras" que aparece nos resultados */
  bindVLibras({ h: 'pm-vlibras-h', on: 'pm-vl-on', off: 'pm-vl-off', msg: 'pm-vl-msg' });
  out.addEventListener('click', e => {
    const jump = e.target.closest('[data-jump="pm-vlibras-h"]');
    if (!jump) return;
    const alvo = $('#pm-vlibras-h');
    if (!alvo) return;
    alvo.scrollIntoView({ block: 'center', behavior: movReduzido() ? 'auto' : 'smooth' });
    const botao = $('#pm-vl-on');
    if (botao && !botao.hidden) botao.focus();
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
  bibParar();
  desligarCamara();
  desligarVLibras();   /* o avatar externo vive fora do #app: sem isto ficaria a pairar na página nova */
  signerParar();
  desligarColheitaCam();
  desligarMarcacoes();   /* o leitor do YouTube vive dentro desta rota: sai com ela */
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
    /* data-start/data-end vêm de uma marcação de tempo (secção 14, `#/marcar`):
       o cartão deixa de dizer «é nesta aula» e passa a abrir o momento do sinal. */
    const q = ['autoplay=1', 'rel=0'];
    const st = Number(btn.dataset.start), en = Number(btn.dataset.end);
    if (isFinite(st) && st > 0) q.push('start=' + Math.floor(st));
    if (isFinite(en) && en > st) q.push('end=' + Math.ceil(en));
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${q.join('&')}`;
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

/* ============================================================================
   12. PAMOSSI SIGNER — o botão flutuante que sinaliza qualquer página
   Regras de integridade (ler antes de editar):
     - O boneco é um GLIFO DE MOVIMENTO: mostra a família de movimento e o
       marcador, nunca a forma exacta do sinal. A forma exacta só existe no vídeo
       da aula; onde não há vídeo, diz-se "ainda sem vídeo".
     - Nada aqui traduz fala para LGA. O texto entra por escrita ou por ditado do
       próprio browser; a sequência mostrada é a glossa do nosso glossário.
     - Sem serviços externos, funciona offline, e nada se move antes de um toque.
       `prefers-reduced-motion` desliga a animação (os passos continuam).
   ============================================================================ */

/* --- 12.1 a figura: duas mãos levantadas + cara, porque os marcadores não
          manuais fazem parte do sinal e não são enfeite --- */
const SG_MAOS = `
  <g class="sg-mao"><circle cx="47" cy="31" r="5"/><path d="M44 28v-6M47 27v-7M50 28v-6"/></g>
  <g class="sg-mao"><circle cx="113" cy="31" r="5"/><path d="M110 28v-6M113 27v-7M116 28v-6"/></g>`;
function sgFigura(tema, letra) {
  const mov = PM_MOVIMENTO[tema] || 'acao';
  const marca = (PM_MARCAS[mov] || PM_MARCAS.acao).replace('>A<', '>' + esc(letra || 'A') + '<');
  return `<svg class="pm-glyph sg-fig sg-mov-${mov}" viewBox="0 0 160 104" aria-hidden="true" focusable="false">
  <g class="sg-corpo">
    <circle class="sg-cabeca" cx="80" cy="24" r="13"/>
    <path class="sg-feicao" d="M73 18h6M82 18h6"/>
    <path class="sg-feicao sg-ponto-o" d="M76 23h.4M84 23h.4"/>
    <path class="sg-feicao sg-boca" d="M76 30c2.6 2 5.4 2 8 0"/>
    <path class="sg-line" d="M80 37v30M64 46h32M64 46 50 35M96 46 110 35M80 67 71 90M80 67 89 90M67 90h8M85 90h8"/>
    <path class="sg-chao" d="M48 96h64"/>
  </g>
  <g class="sg-maos">${SG_MAOS}</g>
  <g class="sg-marca" transform="translate(24,2)">${marca}</g>
</svg>`;
}

/* --- 12.2 da frase aos passos: um sinal por palavra, uma letra por falta de sinal ---
   analisarTexto() devolve uma entrada POR FRASE; o Signer tem de percorrer todas,
   senão "Bom dia! Onde fica a escola?" sinalizava apenas as duas primeiras palavras. */
function sgPassos(texto) {
  const frases = analisarTexto(texto);
  const passos = [];
  frases.forEach(r => (r.itens || []).forEach(it => {
    if (it.tipo === 'sinal') {
      const e = it.entrada || {};
      passos.push({ tipo: 'sinal', palavra: it.palavra, tema: e.tema || 'Verbos',
        estado: e.estado || 'a-validar', aula: it.aula || null, letra: null,
        nota: it.expressao ? 'Um só sinal para várias palavras.'
          : it.origem ? 'Forma de «' + it.origem + '» no dicionário.'
          : e.plural ? 'Plural: repete-se o sinal.' : '' });
    } else if (it.tipo === 'datilologia') {
      (it.letras || []).forEach(l => passos.push({ tipo: 'letra', palavra: String(l), letra: String(l),
        tema: 'Alfabeto', estado: 'sem-sinal', aula: null, daPalavra: it.palavra,
        nota: it.nome ? 'Nome próprio: sempre em alfabeto manual.' : 'Ainda sem sinal no glossário.' }));
    }
  }));
  return passos;
}

const sgEstado = { aberto: false, modo: 'texto', texto: '', passos: [], i: 0, a: false, vel: 1, relogio: 0 };

function sgPassoActual() { return sgEstado.passos[sgEstado.i] || null; }

function sgDur() { return Math.round((sgPassoActual() && sgPassoActual().tipo === 'letra' ? 780 : 1150) / sgEstado.vel); }

function sgPintar() {
  const palco = $('#sg-palco'), live = $('#sg-live'), faixa = $('#sg-strip');
  if (!palco) return;
  const p = sgPassoActual();
  const pMo = p && p.aula ? momentoDe(p.palavra, p.aula.id) : null;
  const total = sgEstado.passos.length;
  palco.innerHTML = total
    ? `${sgFigura(p.tema, p.letra)}
       <p class="sg-palavra">${esc(p.palavra)}${p.daPalavra ? `<span class="sg-de">de ${esc(p.daPalavra)}</span>` : ''}</p>
       <p class="sg-meta">${p.tipo === 'letra' ? 'Alfabeto manual (letra a letra)'
         : esc(p.tema) + ' · ' + esc(ESTADO_GLOSSARIO[p.estado] ? ESTADO_GLOSSARIO[p.estado].rotulo : 'A validar')}</p>
       ${p.nota ? `<p class="sg-nota">${esc(p.nota)}</p>` : ''}
       ${p.aula ? `<div class="vfacade pm-facade sg-video"><button class="vplay" type="button" data-play="${p.aula.id}"
           data-titulo="${esc(p.aula.titulo)}"${pMo ? ` data-start="${pMo.inicio}" data-end="${pMo.fim}"` : ''}
           aria-label="Ver o vídeo real deste sinal: ${esc(p.aula.titulo)}${pMo ? ', a partir de ' + fmtT(pMo.inicio) : ''}">
           <img src="https://i.ytimg.com/vi/${p.aula.id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" width="480" height="360">
           <span class="vbtn">${I.play}</span></button><p class="sg-vid-note">${pMo ? 'O sinal está em ' + esc(fmtT(pMo.inicio)) + ' → ' + esc(fmtT(pMo.fim)) + (pMo.estado === 'confirmado' ? ' (momento confirmado). ' : ' (a validar). ') : ''}O vídeo é que faz fé: o boneco só mostra a família de movimento.</p></div>`
         : `<p class="sg-sem-video">${I.info} Ainda sem vídeo deste sinal.</p>
            <p class="sg-convite"><a href="#/colher/${encodeURIComponent(p.daPalavra || p.palavra)}">Conheces este sinal? Ajuda a registá-lo</a></p>`}`
    : `<p class="sg-vazio">Escreve uma frase, ou pede “Sinalizar esta página”, e a sequência de sinais aparece aqui.</p>`;
  palco.style.setProperty('--sg-d', String(1 / sgEstado.vel));
  if (faixa) {
    faixa.innerHTML = sgEstado.passos.map((x, n) =>
      `<li><button class="sg-chip${n === sgEstado.i ? ' on' : ''}${x.tipo === 'letra' ? ' is-letra' : ''}" type="button" data-sg="${n}"${n === sgEstado.i ? ' aria-current="true"' : ''}>${esc(x.palavra)}</button></li>`).join('');
  }
  const cont = $('#sg-contador');
  if (cont) cont.textContent = total ? `${sgEstado.i + 1} / ${total}` : '—';
  if (live) live.textContent = total
    ? `Sinal ${sgEstado.i + 1} de ${total}: ${p.palavra}${p.tipo === 'letra' ? ' (letra do alfabeto manual)' : ''}.`
    : 'Sem sequência carregada.';
  const play = $('#sg-play');
  if (play) { play.innerHTML = sgEstado.a ? `${I.close} Pausar` : `${I.play} Reproduzir`; play.setAttribute('aria-pressed', sgEstado.a ? 'true' : 'false'); }
  const falta = $('#sg-falta');
  if (falta) {
    const s = sgEstado.passos.filter(x => x.estado === 'sem-sinal');
    const unicas = [...new Set(s.map(x => x.daPalavra || x.palavra))];
    falta.hidden = !unicas.length;
    if (unicas.length) falta.innerHTML = `${unicas.length} palavra${unicas.length > 1 ? 's' : ''} sem sinal neste texto: `
      + unicas.slice(0, 8).map(w => `<a href="#/colher/${encodeURIComponent(w)}">${esc(w)}</a>`).join(', ')
      + (unicas.length > 8 ? ' …' : '') + ' — podes registá-las tu.';
  }
}

function sgParar() {
  sgEstado.a = false;
  if (sgEstado.relogio) { clearTimeout(sgEstado.relogio); sgEstado.relogio = 0; }
  const b = $('#sg-play');
  if (b) { b.setAttribute('aria-pressed', 'false'); b.innerHTML = `${I.play} Reproduzir`; }
}

function sgAvancar() {
  if (!sgEstado.a) return;
  if (sgEstado.i >= sgEstado.passos.length - 1) { sgParar(); sgPintar(); $('#sg-live') && ($('#sg-live').textContent = 'Fim da sequência.'); return; }
  sgEstado.i++;
  sgPintar();
  sgEstado.relogio = setTimeout(sgAvancar, sgDur());
}

function sgReproduzir() {
  if (!sgEstado.passos.length) return;
  if (sgEstado.a) { sgParar(); return; }
  if (sgEstado.i >= sgEstado.passos.length - 1) sgEstado.i = -1;
  sgEstado.a = true;
  sgAvancar();
  if (sgEstado.i === -1) { sgEstado.i = 0; sgPintar(); }
}

function sgCarregar(texto, modo) {
  sgEstado.texto = String(texto || '').trim();
  sgEstado.modo = modo || 'texto';
  sgPassar();
}
function sgPassar() { sgParar(); sgEstado.passos = sgPassos(sgEstado.texto); sgEstado.i = 0; sgPintar(); }

function sgTextoPagina() {
  const main = $('#conteudo');
  if (!main) return '';
  const texto = (main.innerText || '').replace(/\s+/g, ' ').trim();
  const palavras = texto.split(' ').slice(0, 120).join(' ');
  return palavras + (texto.split(' ').length > 120 ? ' …' : '');
}

function sgAbrir(textoInicial) {
  sgEstado.aberto = true;
  const painel = $('#sg-painel'), fab = $('#sg-fab');
  if (!painel) return;
  painel.hidden = false;
  document.documentElement.classList.add('sg-on');
  if (fab) fab.setAttribute('aria-expanded', 'true');
  if (typeof textoInicial === 'string' && textoInicial) {
    const ta = $('#sg-texto'); if (ta) ta.value = textoInicial;
    sgCarregar(textoInicial, 'texto');
  } else if (!sgEstado.passos.length) {
    const ta = $('#sg-texto'); if (ta && !ta.value) ta.value = sgEstado.texto;
    if (ta && ta.value) sgCarregar(ta.value, 'texto'); else sgPintar();
  } else sgPintar();
  const alvo = sgEstado.passos.length ? $('#sg-play') : $('#sg-texto');
  if (alvo) alvo.focus({ preventScroll: true });
}

function sgFechar() {
  sgEstado.aberto = false;
  sgParar();
  const painel = $('#sg-painel'), fab = $('#sg-fab');
  if (painel) painel.hidden = true;
  document.documentElement.classList.remove('sg-on');
  if (fab) { fab.setAttribute('aria-expanded', 'false'); fab.focus({ preventScroll: true }); }
}

/* --- 12.3 montagem: vive FORA do #app, por isso sobrevive a todas as rotas --- */
function montarSigner() {
  if ($('#sg-fab')) return;
  const raiz = document.createElement('div');
  raiz.innerHTML = `
<button class="sg-fab" id="sg-fab" type="button" aria-expanded="false" aria-controls="sg-painel">
  ${sgFigura('Diálogos', 'A')}<span>Pamosii Signer</span>
</button>
<div class="sg-painel" id="sg-painel" role="dialog" aria-labelledby="sg-h" hidden>
  <div class="sg-topo">
    <h2 id="sg-h">${I.access} Pamosii Signer</h2>
    <span class="sg-contador" id="sg-contador">—</span>
    <button class="sg-x" id="sg-close" type="button" aria-label="Fechar o Pamosii Signer">${I.close}</button>
  </div>
  <p class="sg-aviso">Bonecos animados a mostrar a <strong>família de movimento</strong> de cada sinal,
    com a palavra escrita por baixo. Não é a forma exacta do sinal — essa está nos vídeos das aulas — e
    tudo o que aqui aparece vem do glossário deste site,
    <span class="dic-badge is-a-validar">A validar</span> pela comunidade surda angolana.</p>
  <div class="sg-fonte">
    <label class="sg-lbl" for="sg-texto">Texto a sinalizar</label>
    <textarea id="sg-texto" rows="2" autocomplete="off" spellcheck="false"
      placeholder="Escreve (ou dita) a frase que queres ver em sinais.">Bom dia! Onde fica a escola?</textarea>
    <div class="sg-liga">
      <button class="btn btn-p btn-sm" type="button" id="sg-usar">${I.search} Sinalizar</button>
      <button class="btn btn-o btn-sm" type="button" id="sg-pagina">Sinalizar esta página</button>
      <button class="btn btn-o btn-sm" type="button" id="sg-fala" aria-pressed="false">${I.play} Ouvir em português</button>
    </div>
    <p class="sg-priv">O texto fica neste aparelho: nada é enviado para fora, e não há servidores.</p>
  </div>
  <div class="sg-palco" id="sg-palco"></div>
  <p class="sg-ctrl">
    <span class="sg-ctrl-r1">
      <button class="btn btn-o btn-sm" type="button" id="sg-prev" aria-label="Sinal anterior">${I.chev} Anterior</button>
      <button class="btn btn-a btn-sm" type="button" id="sg-play" aria-pressed="false">${I.play} Reproduzir</button>
      <button class="btn btn-o btn-sm" type="button" id="sg-next" aria-label="Sinal seguinte">Seguinte ${I.arrow}</button>
    </span>
    <span class="sg-ctrl-r2">
      <button class="btn btn-o btn-sm" type="button" id="sg-rep">Repetir este sinal</button>
      <label class="sg-vel-l" for="sg-vel">Velocidade</label>
      <select id="sg-vel"><option value="0.5">0,5×</option><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.5">1,5×</option></select>
    </span>
  </p>
  <p class="sg-live" id="sg-live" role="status"></p>
  <ul class="sg-strip" id="sg-strip" data-no-read aria-label="Sinais desta sequência — escolher um"></ul>
  <p class="sg-falta" id="sg-falta" role="status" hidden></p>
</div>`;
  document.body.appendChild(raiz);

  $('#sg-fab').addEventListener('click', () => { sgEstado.aberto ? sgFechar() : sgAbrir(); });
  $('#sg-close').addEventListener('click', sgFechar);
  $('#sg-usar').addEventListener('click', () => sgCarregar($('#sg-texto').value, 'texto'));
  $('#sg-pagina').addEventListener('click', () => {
    const t = sgTextoPagina();
    $('#sg-texto').value = t;
    sgCarregar(t, 'pagina');
    $('#sg-live').textContent = 'Sequência desta página carregada (primeiras 120 palavras).';
  });
  $('#sg-fala').addEventListener('click', e => {
    const b = e.currentTarget;
    if (b.getAttribute('aria-pressed') === 'true') { window.speechSynthesis.cancel(); b.setAttribute('aria-pressed', 'false'); return; }
    if (!falarTexto(sgEstado.texto || $('#sg-texto').value, b)) {
      $('#sg-live').textContent = 'Este browser não tem síntese de voz; o texto continua a funcionar.';
    }
  });
  $('#sg-play').addEventListener('click', sgReproduzir);
  $('#sg-prev').addEventListener('click', () => { sgParar(); sgEstado.i = Math.max(0, sgEstado.i - 1); sgPintar(); });
  $('#sg-next').addEventListener('click', () => { sgParar(); sgEstado.i = Math.min(sgEstado.passos.length - 1, sgEstado.i + 1); sgPintar(); });
  $('#sg-rep').addEventListener('click', () => {
    sgParar();
    const dur = sgDur();
    sgEstado.a = true; sgPintar();
    sgEstado.relogio = setTimeout(sgParar, dur);
    $('#sg-live').textContent = 'A repetir este sinal.';
  });
  $('#sg-vel').addEventListener('change', e => { sgEstado.vel = Number(e.target.value) || 1; sgPintar(); });
  $('#sg-strip').addEventListener('click', e => {
    const b = e.target.closest('[data-sg]');
    if (!b) return;
    sgParar(); sgEstado.i = Number(b.dataset.sg); sgPintar();
  });
  /* teclado: Esc fecha (em qualquer sítio, com o painel aberto); ←/→ e Espaço só quando o
     foco está dentro do painel — com o painel aberto a pessoa continua a poder usar o
     Espaço para rolar a página e as setas para se mover no texto que está a ler. */
  document.addEventListener('keydown', e => {
    if (!sgEstado.aberto) return;
    if (e.key === 'Escape') { e.preventDefault(); sgFechar(); return; }
    const dentro = $('#sg-painel').contains(document.activeElement);
    if (dentro && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      if (e.key === 'ArrowRight') { e.preventDefault(); sgParar(); sgEstado.i = Math.min(sgEstado.passos.length - 1, sgEstado.i + 1); sgPintar(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); sgParar(); sgEstado.i = Math.max(0, sgEstado.i - 1); sgPintar(); }
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); sgReproduzir(); }
    }
    if (e.key === 'Tab' && dentro) {   /* laço de foco simples dentro da janela */
      const f = [...$('#sg-painel').querySelectorAll('button:not([hidden]), a[href], textarea, select, input')]
        .filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const primeiro = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });
  sgPintar();
}

/* chamado pelo router: ao mudar de página a sequência para, e se o painel estiver
   em modo "esta página" volta a ler o texto novo */
function signerParar() {
  if (!sgEstado.aberto) { sgParar(); return; }
  sgParar();
  if (sgEstado.modo === 'pagina') {
    setTimeout(() => {
      const t = sgTextoPagina();
      const ta = $('#sg-texto'); if (ta) ta.value = t;
      sgEstado.texto = t; sgPassar();
    }, 0);
  }
}

/* atalhos espalhados pelo site: qualquer [data-signer] abre o painel com texto */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-signer]');
  if (!b) return;
  e.preventDefault();
  const alvo = b.closest('#conteudo') ? (b.dataset.texto || (b.closest('article,li') || b).innerText.slice(0, 240)) : (b.dataset.texto || '');
  sgAbrir(alvo);
});

/* ============================================================================
   13. COLHEITA PARTICIPADA — qualquer pessoa pode acrescentar sinais
   Regras de integridade:
     - O site não envia NADA. As contribuições vivem no aparelho de quem as fez
       e saem num ficheiro que a pessoa escolhe enviar (README, secção Colheita).
     - ninguém que usa este site pode marcar um sinal como "validado": isso é
       trabalho de um sinalizador surdo angolano. O estado máximo é "colhido".
     - A câmara é opcional, nunca grava som, e as imagens não saem do browser.
   ============================================================================ */

const CH_COLHEITA = 'vs.colheita';
const CH_LACUNAS = 'vs.lacunas';
const CH_EXTRA = 'vs.extra';
const SCHEMA_COLHEITA = 1;

/* palavras sem sinal, contadas neste aparelho — é a lista de compras da equipa */
function lerLacunas() {
  try { return JSON.parse(localStorage.getItem(CH_LACUNAS) || '{}') || {}; } catch (e) { return {}; }
}
function registrarLacunas(palavras) {
  if (!palavras || !palavras.length) return;
  const d = lerLacunas();
  palavras.map(w => norm(w)).filter(Boolean).forEach(w => { d[w] = (d[w] || 0) + 1; });
  try { localStorage.setItem(CH_LACUNAS, JSON.stringify(d)); } catch (e) { /* aparelho cheio */ }
}
function apagarLacunas() { try { localStorage.removeItem(CH_LACUNAS); } catch (e) { /* nada guardado */ } }

function lerColheita() {
  try { const d = JSON.parse(localStorage.getItem(CH_COLHEITA) || '[]'); return Array.isArray(d) ? d : []; } catch (e) { return []; }
}
function guardarColheita(lista) {
  try { localStorage.setItem(CH_COLHEITA, JSON.stringify(lista)); return true; }
  catch (e) { return false; }   /* quota: o aviso aparece na própria página */
}

/* --- 13.1 o que entra no glossário: o MESMO formato de um pacote de colheita ---
   Três canais chegam aqui: assets/glossario-extra.json (o que a equipa publicou),
   o pacote importado neste aparelho, e nada mais. Sem entradas, nada muda. */
const COLHIDAS = new Map();
function indexarTermo(palavraRaw, tema, estado, extra) {
  const chave = norm(palavraRaw).replace(/[….:;?!]/g, '').trim();
  if (!chave) return false;
  const entrada = { palavra: String(palavraRaw), tema: tema || 'Colheita', estado: estado || 'colhido', sinal: (extra && extra.video) || null };
  if (!PAMOSSI_INDICE.has(chave)) PAMOSSI_INDICE.set(chave, entrada);
  const partes = [];
  tokenizar(chave).forEach(tk => dividirPalavra(tk).forEach(p => partes.push(norm(p))));
  if (partes.length > 1) {
    const k = partes.join(' ');
    if (!PAMOSSI_EXPRESSOES.has(k)) PAMOSSI_EXPRESSOES.set(k, entrada);
    PAMOSSI_EXP_MAX = Math.max(PAMOSSI_EXP_MAX, partes.length);
  }
  if (extra) COLHIDAS.set(chave, extra);
  return true;
}
function grupoTema(tema) {
  let g = GLOSSARIO.find(x => x.tema === tema);
  if (!g) { g = { tema: tema, termos: [] }; GLOSSARIO.push(g); }
  return g;
}
function registrarExtra(termos) {
  const vista = [];
  const contadas = new Set();   /* o mesmo termo pode chegar por três canais: conta uma vez */
  (Array.isArray(termos) ? termos : []).forEach(t => {
    if (!t || typeof t.palavra !== 'string') return;
    const palavra = t.palavra.trim();
    if (!palavra || palavra.length > 48) return;
    const chave = norm(palavra).replace(/[….:;?!]/g, '').trim();
    const estado = t.estado === 'confirmado' ? 'confirmado' : 'colhido';
    const tema = t.tema || 'Colheita';
    const g = grupoTema(tema);
    if (!g.termos.some(x => norm(x.palavra) === chave)) {
      g.termos.push({ palavra: palavra, estado: estado, sinal: t.video || null });
    }
    indexarTermo(palavra, tema, estado, t);
    if (!contadas.has(chave)) { contadas.add(chave); vista.push(palavra); }
  });
  return vista;
}
async function carregarGlossarioExtra() {
  let publicados = [];
  try {
    const res = await fetch('assets/glossario-extra.json', { cache: 'no-cache' });
    const dados = res.ok ? await res.json() : null;
    publicados = dados && Array.isArray(dados.termos) ? dados.termos : [];
  } catch (e) { /* o ficheiro ainda não existe: o site continua igual */ }
  const locais = (function () { try { const d = JSON.parse(localStorage.getItem(CH_EXTRA) || '[]'); return Array.isArray(d) ? d : []; } catch (e) { return []; } })();
  /* os registos que a própria pessoa guardou neste aparelho valem como glossário local:
     sem isto «kuduro» aparecia no dicionário até carregares de novo, e depois sumia-se */
  const n = registrarExtra(publicados.concat(locais, lerColheita())).length;
  if (n) {
    const aviso = $('#route-live');
    if (aviso) aviso.textContent = `${n} ${n === 1 ? 'sinal em fase de colheita disponível' : 'sinais em fase de colheita disponíveis'} neste aparelho.`;
  }
}

function pacote() {
  return {
    schema: SCHEMA_COLHEITA,
    tipo: 'pamosii-colheita',
    geradoEm: new Date().toISOString(),
    aparelho: 'local',
    entrada: lerColheita(),
    lacunas: lerLacunas(),
  };
}
function descarregarFicheiro(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo || 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}
function textoPacote(p) {
  return [
    'PAMOSII — COLHEITA DE SINAIS LGA',
    'Gerado em ' + p.geradoEm + ' (esquema ' + p.schema + ')',
    '',
    'PALAVAS SEM SINAL ENCONTRADAS NAS TRADUÇÕES (' + Object.keys(p.lacunas).length + '):',
    Object.entries(p.lacunas).sort((a, b) => b[1] - a[1]).map(([w, n]) => '  ' + w + ' — vista ' + n + '×').join('\n') || '  (nenhuma)',
    '',
    'SINAIS REGISTADOS (' + p.entrada.length + '):',
    ...p.entrada.map((e, i) => [
      '  ' + (i + 1) + '. ' + e.palavra + '  [' + (e.tema || 'Colheita') + ']',
      '     configuração da mão: ' + (e.configuracao || '—'),
      '     lugar: ' + (e.lugar || '—'),
      '     movimento: ' + (e.movimento || '—'),
      '     expressão/corpo: ' + (e.mnm || '—'),
      '     quem ensinou: ' + (e.fonte || '—'),
      '     vídeo/URL: ' + (e.video || '—'),
      '     estado: colhido (à espera de validação por um sinalizador surdo)',
    ].join('\n')),
    '',
    'Este ficheiro não foi enviado por ninguém: saiu deste aparelho quando a pessoa carregou em "Exportar".',
  ].join('\n');
}

/* --- 13.2 a página --- */
const CH_TEMAS = () => [...GLOSSARIO.map(g => g.tema), 'Colheita'];

function colheitaHTML(palavra) {
  const lacunas = Object.entries(lerLacunas()).sort((a, b) => b[1] - a[1]).slice(0, 40);
  const minhas = lerColheita();
  const temas = [...new Set(CH_TEMAS())];
  return `
<div class="wrap page-head">
  <p class="eyebrow">${I.access} Colheita participada</p>
  <h1 class="ch-h">Ajudar a encher o dicionário de LGA</h1>
  <p class="lead">O glossário deste site tem poucas centenas de palavras e o que falta só existe na memória
  de quem sinaliza. Esta página serve para <strong>registar um sinal com método</strong>, guardá-lo neste
  aparelho e exportar um ficheiro para a equipa validar.</p>
</div>
<div class="wrap">
  <div class="note-band">
    <p>${I.shield} <strong>O que acontece aos teus dados:</strong> nada é enviado por este site. Não há servidor,
    não há contas, não há análise. O que escreves e as fotografias que tirares ficam no <strong>teu</strong> browser
    e só saem quando fores tu a descarregar o ficheiro e a enviá-lo. Não precisamos do teu nome,
    nem de telefone, nem de informação médica.</p>
    <p>${I.info} <strong>Ninguém aqui marca um sinal como validado.</strong> O estado máximo é “colhido”.
    Um sinal só entra no dicionário como confirmado depois de uma pessoa surda sinalizadora o rever — é essa
    a entrega da equipa (README, lista de materiais).</p>
  </div>

  <section class="ch-backlog" aria-labelledby="ch-backlog-h">
    <h2 id="ch-backlog-h">${I.target} Palavras que ficaram sem sinal neste aparelho</h2>
    <p class="muted">Contador local: cada vez que uma tradução teu tropeça numa palavra, ela sobe nesta lista.
    É a tua lista de compras para a equipa — e o ponto de partida mais útil para contribuir.</p>
    ${lacunas.length ? `<ul class="ch-lacunas">${lacunas.map(([w, n]) => `
      <li><span class="ch-lac-w">${esc(w)}</span><span class="ch-lac-n">${n}×</span>
        <button class="btn btn-o btn-sm" type="button" data-ch-preenche="${esc(w)}">Registar este sinal</button>
        <a class="btn btn-o btn-sm" href="#/pamosii">Ver no Pamosii</a></li>`).join('')}</ul>`
      : '<p class="ch-vazio">Ainda sem registos. Faz uma frase no <a href="#/pamosii">Pamosii</a> com palavras que o dicionário não tenha, e volta aqui.</p>'}
    <p class="ch-lac-act"><button class="btn btn-o btn-sm" type="button" id="ch-lac-limpar">Apagar este contador</button></p>
  </section>

  <section class="ch-form" aria-labelledby="ch-form-h">
    <h2 id="ch-form-h">${I.doc} Registar um sinal</h2>
    <p class="muted">Descreve por partes — é assim que os dicionários de língua gestual são escritos.
    Se te enganares, apaga e volta a gravar: nada disto sai do teu aparelho.</p>
    <form id="ch-novo" class="ch-campos">
      <p class="ch-campo ch-campo-lg">
        <label for="ch-palavra">Palavra ou frase em português</label>
        <input id="ch-palavra" name="palavra" type="text" maxlength="48" autocomplete="off"
          required value="${esc(palavra || '')}" placeholder="ex.: banana">
      </p>
      <p class="ch-campo">
        <label for="ch-tema">Tema (para o dicionário)</label>
        <select id="ch-tema" name="tema">${temas.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
      </p>
      <p class="ch-campo"><label for="ch-config">Configuração da mão (que mão, como está)</label>
        <input id="ch-config" name="configuracao" type="text" maxlength="120" autocomplete="off" placeholder="ex.: mão em Y, palma para cima"></p>
      <p class="ch-campo"><label for="ch-lugar">Lugar (onde toca / de onde parte)</label>
        <input id="ch-lugar" name="lugar" type="text" maxlength="120" autocomplete="off" placeholder="ex.: à frente da boca"></p>
      <p class="ch-campo"><label for="ch-mov">Movimento (trajeto, repetição)</label>
        <input id="ch-mov" name="movimento" type="text" maxlength="120" autocomplete="off" placeholder="ex.: corta no ar duas vezes"></p>
      <p class="ch-campo ch-campo-lg"><label for="ch-mnm">Expressão facial ou corporal (faz parte do sinal)</label>
        <input id="ch-mnm" name="mnm" type="text" maxlength="160" autocomplete="off" placeholder="ex.: sobrancelhas baixas, cabeça inclinada"></p>
      <p class="ch-campo"><label for="ch-fonte">Onde aprendeste este sinal</label>
        <input id="ch-fonte" name="fonte" type="text" maxlength="120" autocomplete="off"
          placeholder="ex.: professora surda na escola do Lubango / aula da Viva Surdo"></p>
      <p class="ch-campo"><label for="ch-video">URL do vídeo (opcional, se existir em público)</label>
        <input id="ch-video" name="video" type="url" maxlength="200" autocomplete="off" placeholder="https://…"></p>
      <p class="ch-campo"><label for="ch-nota">Nota livre (variação regional, idade, contexto)</label>
        <textarea id="ch-nota" name="nota" rows="2" maxlength="400" placeholder="ex.: em Benguela fazem com a outra mão"></textarea></p>
      <p class="ch-ac"><button class="btn btn-p btn-sm" type="submit">${I.check} Guardar neste aparelho</button>
        <span class="muted">Fica marcado como <strong>colhido</strong>, nunca como validado.</span></p>
    </form>
  </section>

  <section class="ch-cam" aria-labelledby="ch-cam-h">
    <h2 id="ch-cam-h">${I.video} Fotografia do sinal (opcional)</h2>
    <p class="muted">Até haver vídeos gravados, uma sequência de 3 a 4 fotografias do meio do sinal já
    permite à equipa desenhar o glifo certo. <strong>A câmara nunca grava som</strong>, nada é enviado,
    e as imagens vivem apenas neste browser.</p>
    <div class="ch-cam-grid">
      <video id="ch-cam" playsinline muted aria-label="Pré-visualização da câmara"></video>
      <ul class="ch-fotos" id="ch-fotos" aria-label="Fotografias tiradas"></ul>
    </div>
    <p class="ch-ac">
      <button class="btn btn-p btn-sm" type="button" id="ch-on">${I.video} Ligar a câmara</button>
      <button class="btn btn-a btn-sm" type="button" id="ch-shot" disabled>Capturar 4 quadros</button>
      <button class="btn btn-o btn-sm" type="button" id="ch-off">Desligar e apagar</button>
    </p>
    <p class="ch-msg" id="ch-msg" role="status"></p>
  </section>

  <section class="ch-minhas" aria-labelledby="ch-minhas-h">
    <h2 id="ch-minhas-h">${I.book} O que guardaste neste aparelho <span class="ch-n" id="ch-n">${minhas.length}</span></h2>
    ${minhas.length ? `<ul class="ch-lista" id="ch-lista">${minhas.map(chItemHTML).join('')}</ul>`
      : '<p class="ch-vazio">Ainda não guardaste sinais.</p>'}
    <p class="ch-ac">
      <button class="btn btn-a btn-sm" type="button" id="ch-export">${I.doc} Exportar pacote (JSON)</button>
      <button class="btn btn-o btn-sm" type="button" id="ch-export-txt">Exportar para ler (texto)</button>
      <button class="btn btn-o btn-sm" type="button" id="ch-copiar">Copiar resumo</button>
    </p>
    <p class="ch-ac">
      <label class="ch-import" for="ch-import-file">${I.search} Importar um pacote para ver os sinais <span class="muted">(só neste aparelho)</span></label>
      <input id="ch-import-file" type="file" accept="application/json,.json">
    </p>
    <p class="ch-msg" id="ch-status" role="status"></p>
    <p class="ch-ac"><button class="btn btn-o btn-sm" type="button" id="ch-apagar-tudo">Apagar tudo o que guardei</button></p>
  </section>

  <section class="ch-envio" aria-labelledby="ch-envio-h">
    <h2 id="ch-envio-h">${I.chat} Como isto chega ao dicionário</h2>
    <ol class="ch-passo">
      <li><strong>Exportas</strong> o pacote aqui em cima → descarrega <code>pamosii-colheita-AAAA-MM-DD.json</code>.</li>
      <li><strong>Envias</strong> o ficheiro pela equipa, no <a href="#/contacto">Contacto</a> (o site não o envia por ti).</li>
      <li><strong>A equipa valida</strong> com um sinalizador surdo: confirma, corrige ou junta variações.</li>
      <li><strong>Entramos no site</strong> com <code>tools/ingerir-colheita.cjs</code>, que escreve
        <code>assets/glossario-extra.json</code>. O Pamosii, o dicionário e o Signer passam a conhecer o sinal
        sem se tocar no código.</li>
    </ol>
    <details class="ch-esquema">
      <summary>O formato do ficheiro (para quem prepara dados fora daqui)</summary>
      <pre class="ch-json"><code>${esc(JSON.stringify({
        schema: SCHEMA_COLHEITA, tipo: 'pamosii-colheita',
        entrada: [{ palavra: 'banana', tema: 'Comida e bebida', configuracao: 'mão em Y', lugar: 'à frente da boca',
          movimento: 'corta no ar duas vezes', mnm: 'sem expressão', fonte: 'professora surda, Lubango',
          video: '', estado: 'colhido', nota: '', fotos: ['data:image/jpeg;base64,…'] }],
        lacunas: { zungu: 3 }
      }, null, 2))}</code></pre>
    </details>
  </section>

  <section class="bib-vlibras" aria-labelledby="ch-humano-h">
    <h3 id="ch-humano-h">${I.users} O que este site nunca vai inventar</h3>
    <p class="muted" style="max-width:66ch">A falta de sinal não se tapa com um desenho: o glifo animado mostra
    a família de movimento, e ponto. Enquanto um sinal não for filmado ou descrito por alguém da comunidade surda
    angolana, ele aparece como <em>sem sinal</em> — e é exactamente essa lista que a colheita transforma em trabalho.</p>
  </section>
</div>`;
}

function chItemHTML(e, i) {
  /* o índice vem de quem desenha a lista: lerColheita().indexOf() re-analisa o JSON e por
     isso nunca apanha o mesmo objecto — dava sempre -1 e o botão "Apagar" não apagava nada. */
  const n = Number.isInteger(i) ? i : 0;
  return `<li class="ch-item" data-i="${n}">
    <p class="ch-item-p">${esc(e.palavra)} <span class="dic-badge is-colhido">Colhido</span><span class="ch-item-t">${esc(e.tema || 'Colheita')}</span></p>
    ${e.configuracao || e.lugar || e.movimento ? `<p class="ch-item-d">${esc([e.configuracao && ('mão: ' + e.configuracao), e.lugar && ('lugar: ' + e.lugar), e.movimento && ('movimento: ' + e.movimento), e.mnm && ('expressão: ' + e.mnm)].filter(Boolean).join(' · '))}</p>` : ''}
    ${e.fonte ? `<p class="ch-item-f">${esc(e.fonte)}${e.video ? ' · <a href="' + esc(e.video) + '" target="_blank" rel="noopener">vídeo<span class="sr-only"> (abre em nova janela)</span></a>' : ''}</p>` : ''}
    ${e.nota ? `<p class="ch-item-n">${esc(e.nota)}</p>` : ''}
    ${e.fotos && e.fotos.length ? `<div class="ch-item-fotos">${e.fotos.map((f, n) => `<img src="${esc(f)}" alt="Fotografia ${n + 1} do sinal de ${esc(e.palavra)}" loading="lazy" decoding="async">`).join('')}</div>` : ''}
    <p class="ch-item-a"><button class="btn btn-o btn-sm" type="button" data-ch-apaga="${n}">Apagar</button></p>
  </li>`;
}

function vistaColheita(args) {
  const palavra = args && args.palavra ? decodeURIComponent(args.palavra) : '';
  return {
    active: '/colher',
    h: shell(colheitaHTML(palavra), '/colher'),
    bind: bindColheita,
    meta: { t: 'Colheita participada de sinais LGA — ajuda a encher o dicionário', d: 'Registar sinais de Língua Gestual Angolana com método: configuração da mão, lugar, movimento e expressão. Tudo fica no teu aparelho e é exportado num ficheiro para a equipa validar.' },
  };
}

let chCam = null;
function desligarColheitaCam() {
  if (!chCam) return;
  try { chCam.stream && chCam.stream.getTracks().forEach(t => t.stop()); } catch (e) { /* já parada */ }
  chCam = null;
}

function bindColheita() {
  const aviso = (t) => { const m = $('#ch-status'); if (m) m.textContent = t; };

  document.querySelectorAll('[data-ch-preenche]').forEach(b => b.addEventListener('click', () => {
    const inp = $('#ch-palavra');
    if (!inp) return;
    inp.value = b.dataset.chPreenche;
    inp.focus();
    $('#ch-form-h').scrollIntoView({ block: 'center', behavior: movReduzido() ? 'auto' : 'smooth' });
  }));
  const limpar = $('#ch-lac-limpar');
  if (limpar) limpar.addEventListener('click', () => {
    apagarLacunas();
    const sec = document.querySelector('.ch-backlog');
    const temp = document.createElement('div');
    temp.innerHTML = '<ul class="ch-lacunas"><li><span class="ch-vazio">Contador apagado. volta a traduzir para o encher outra vez.</span></li></ul>';
    const ul = sec && sec.querySelector('.ch-lacunas');
    if (ul) ul.replaceWith(temp.firstElementChild);
    aviso('Contador de palavras sem sinal apagado deste aparelho.');
  });

  const form = $('#ch-novo');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const palavra = String(fd.get('palavra') || '').trim();
    if (palavra.length < 2) { aviso('Escreve a palavra primeiro.'); $('#ch-palavra').focus(); return; }
    const lista = lerColheita();
    const registo = {
      palavra: palavra,
      tema: String(fd.get('tema') || 'Colheita'),
      configuracao: String(fd.get('configuracao') || '').trim(),
      lugar: String(fd.get('lugar') || '').trim(),
      movimento: String(fd.get('movimento') || '').trim(),
      mnm: String(fd.get('mnm') || '').trim(),
      fonte: String(fd.get('fonte') || '').trim(),
      video: String(fd.get('video') || '').trim(),
      nota: String(fd.get('nota') || '').trim(),
      estado: 'colhido',
      data: new Date().toISOString().slice(0, 10),
      fotos: (chCam && chCam.fotos.slice()) || [],
    };
    const duplicado = lista.findIndex(x => norm(x.palavra) === norm(palavra));
    if (duplicado >= 0) lista[duplicado] = { ...lista[duplicado], ...registo };
    else lista.unshift(registo);
    if (!guardarColheita(lista)) { aviso('Este aparelho já não tem espaço para guardar mais: exporta o pacote e apaga registos antigos.'); return; }
    registrarExtra([registo]);
    aviso(`Guardado: «${palavra}» fica já visível no dicionário e no Pamosii como colhido, só neste aparelho.`);
    const listaEl = $('#ch-lista');
    const vazio = document.querySelector('.ch-minhas .ch-vazio');
    if (vazio) vazio.remove();
    /* a página vinha com "ainda não guardaste sinais" no sítio da lista: sem isto o primeiro
       registo guardava-se mas nunca aparecia em ecrã */
    if (!listaEl) {
      document.querySelector('.ch-minhas h2').insertAdjacentHTML('afterend', '<ul class="ch-lista" id="ch-lista"></ul>');
    }
    document.getElementById('ch-lista').insertAdjacentHTML('afterbegin', chItemHTML(lista[0]));
    const n = $('#ch-n'); if (n) n.textContent = String(lista.length);
    reindexarLista();
    if (chCam) { chCam.fotos.length = 0; pintarFotos(); }
    form.reset();
    $('#ch-palavra').focus();
  });

  /* câmara: só vídeo, 4 quadros, sempre locais */
  const on = $('#ch-on'), shot = $('#ch-shot'), off = $('#ch-off'), msg = $('#ch-msg');
  if (on && shot && off) {
    const pode = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!pode) {
      on.disabled = true; shot.disabled = true;
      msg.textContent = 'Este browser não dá acesso a câmara. Podes continuar a registar por descrição — é a parte que mais ajuda.';
    }
    on.addEventListener('click', async () => {
      msg.textContent = 'A pedir a câmara…';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false });
        const v = $('#ch-cam');
        v.srcObject = stream; v.classList.add('on'); await v.play().catch(() => {});
        chCam = { stream: stream, fotos: [] };
        shot.disabled = false;
        msg.textContent = 'Câmara ligada. Sem som. Nada sai deste browser.';
      } catch (e) {
        msg.textContent = 'A câmara não abriu (permissão negada ou indisponível). A descrição escrita continua a funcionar.';
      }
    });
    shot.addEventListener('click', () => {
      if (!chCam) return;
      const v = $('#ch-cam');
      const c = document.createElement('canvas');
      c.width = 320; c.height = 240;
      const ctx = c.getContext('2d');
      ctx.drawImage(v, 0, 0, 320, 240);
      try { chCam.fotos.push(c.toDataURL('image/jpeg', 0.6)); } catch (e) { msg.textContent = 'O browser bloqueou a leitura da imagem.'; return; }
      if (chCam.fotos.length >= 4) { msg.textContent = 'Quatro quadros chegados: já descrevem o sinal. Captura de novo se quiseres trocar.'; }
      pintarFotos();
    });
    off.addEventListener('click', () => {
      desligarColheitaCam();
      $('#ch-cam').classList.remove('on');
      shot.disabled = true;
      pintarFotos();
      msg.textContent = 'Câmara desligada e imagens apagadas deste browser.';
    });
  }

  ['ch-export', 'ch-export-txt'].forEach(id => { const b = $('#' + id); if (b) b.addEventListener('click', () => {
    const p = pacote();
    if (!p.entrada.length && !Object.keys(p.lacunas).length) { aviso('Não há nada para exportar ainda.'); return; }
    const dia = new Date().toISOString().slice(0, 10);
    if (id === 'ch-export') descarregarFicheiro(`pamosii-colheita-${dia}.json`, JSON.stringify(p, null, 2));
    else descarregarFicheiro(`pamosii-colheita-${dia}.txt`, textoPacote(p), 'text/plain;charset=utf-8');
    aviso(`Ficheiro descarregado: ${p.entrada.length} sinal(is) e ${Object.keys(p.lacunas).length} palavra(s) sem sinal. Envia-o pela equipa no Contacto — o site não o envia por ti.`);
  }); });
  const copiar = $('#ch-copiar');
  if (copiar) copiar.addEventListener('click', () => copiarTexto(textoPacote(pacote()), copiar));

  const imp = $('#ch-import-file');
  if (imp) imp.addEventListener('change', () => {
    const f = imp.files && imp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let dados;
      try { dados = JSON.parse(String(r.result)); } catch (e) { aviso('Esse ficheiro não é JSON válido.'); return; }
      const termos = Array.isArray(dados.entrada) ? dados.entrada : (Array.isArray(dados.termos) ? dados.termos : null);
      if (!termos) { aviso('Formato não reconhecido: esperava entrada[] ou termos[].'); return; }
      if (dados.schema && dados.schema > SCHEMA_COLHEITA) { aviso('Este pacote é de um esquema mais novo que este site.'); return; }
      const vistas = registrarExtra(termos);
      try {
        const atual = JSON.parse(localStorage.getItem(CH_EXTRA) || '[]');
        const merge = (Array.isArray(atual) ? atual : []).concat(termos.filter(t => t && t.palavra));
        localStorage.setItem(CH_EXTRA, JSON.stringify(merge.filter((x, i, a) => norm(x.palavra) && a.findIndex(y => norm(y.palavra) === norm(x.palavra)) === i)));
      } catch (e) { aviso('Importado para esta sessão, mas o aparelho não tinha espaço para o guardar fixo.'); }
      aviso(`${vistas.length} sinal(is) carregados deste ficheiro — visíveis já no dicionário, no Pamosii e no Signer, só neste aparelho.`);
      imp.value = '';
    };
    r.readAsText(f);
  });

  const apagar = $('#ch-apagar-tudo');
  if (apagar) apagar.addEventListener('click', () => {
    if (!guardarColheita([])) { aviso('Não foi possível apagar.'); return; }
    try { localStorage.removeItem(CH_EXTRA); } catch (e) { /* nada importado */ }
    document.querySelectorAll('.ch-item').forEach(x => x.remove());
    const n = $('#ch-n'); if (n) n.textContent = '0';
    aviso('Apagado deste aparelho. Se não exportaste antes, os registos perderam-se — não há cópia em servidor nenhum.');
  });
}

/* Um único listener delegado para «apagar este registo»: ligado uma vez, serve todas as
   renderizações da página. Dentro de bindColheita() acrescentava mais um a cada visita. */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ch-apaga]');
  if (!b) return;
  const lista = lerColheita();
  const i = Number(b.dataset.chApaga);
  if (!Number.isInteger(i) || !lista[i]) return;
  const nome = lista[i].palavra;
  lista.splice(i, 1);
  guardarColheita(lista);
  const item = b.closest('.ch-item');
  if (item) item.remove();
  const n = $('#ch-n'); if (n) n.textContent = String(lista.length);
  reindexarLista();
  const m = $('#ch-status'); if (m) m.textContent = `Removido: «${nome}».`;
});
function reindexarLista() {
  document.querySelectorAll('.ch-minhas .ch-item').forEach((li, n) => {
    li.dataset.i = String(n);
    const b = li.querySelector('[data-ch-apaga]');
    if (b) b.dataset.chApaga = String(n);
  });
}
function pintarFotos() {
  const ul = $('#ch-fotos');
  if (!ul) return;
  const fotos = (chCam && chCam.fotos) || [];
  ul.innerHTML = fotos.map((f, n) => `<li><img src="${esc(f)}" alt="Pré-visualização ${n + 1} do sinal, só neste aparelho" loading="lazy" decoding="async"></li>`).join('')
    + (fotos.length ? `<li class="ch-fotos-n">${fotos.length}/4 quadros</li>` : '<li class="ch-fotos-n">Sem fotografias tiradas.</li>');
}

on('/colher', () => vistaColheita(null));
on('/colher/:palavra', ({ args }) => vistaColheita(args));

/* ============================================================================
   14. MARCAÇÃO DE TEMPOS POR SINAL — `#/marcar`
   ----------------------------------------------------------------------------
   Para que serve: ver uma aula e registar em que segundos da aula começa e
   acaba o sinal de uma palavra. É o passo que transforma «a palavra X é
   ensinada nesta aula» em «o sinal X é este clipe de 3 segundos» — sem estas
   marcações não há clipe isolado no dicionário, no Pamosii nem no Signer, e
   por isso é a primeira coisa desta fase (README, FASE 1B).

   Regras de integridade (ler antes de editar):
     - O estado de qualquer marcação nova é «por validar». Marcar um momento
       num vídeo NÃO valida o sinal: validar é trabalho de um sinalizador surdo
       angolano (a fila de validação é outra ferramenta, ainda por construir).
     - Nada é enviado por este site. As marcações ficam no localStorage do
       aparelho e saem num ficheiro JSON que a pessoa escolhe entregar à equipa.
     - O leitor do YouTube é opcional. Se o script não carregar (sem rede,
       bloqueado, política da escola), a ferramenta continua a funcionar com os
       tempos escritos à mão — e diz isso mesmo em vez de fingir que lê a hora.
     - O JSON exportado traz sempre {aula, palavra, inicio, fim, estado}, o
       formato combinado com a equipa; as chaves a mais servem para saber de
       onde veio cada marcação.
   ============================================================================ */

const MK_CHAVE = 'vs.marcar';
const SCHEMA_MK = 1;
const MK_MAX_DURACAO = 120;   /* segundos: um sinal isolado não é uma aula inteira */
const pl = (n, um, mais) => n === 1 ? um : mais;

function lerMarcacoes() {
  try { const d = JSON.parse(localStorage.getItem(MK_CHAVE) || '[]'); return Array.isArray(d) ? d : []; } catch (e) { return []; }
}
function guardarMarcacoes(l) {
  try { localStorage.setItem(MK_CHAVE, JSON.stringify(l)); invalidarMkIndice(); return true; } catch (e) { return false; }
}

const mkId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const chavePalavra = (p) => norm(p).replace(/[….:;?!]/g, '').trim();
const aulaPorId = (id) => LGA_AULAS.find(a => a.id === id) || null;

/* As marcações que a equipa publicou em assets/marcacoes.json (depois de juntar os
   ficheiros de toda a gente). Juntam-se às deste aparelho: é isto que faz um cartão do
   dicionário dizer «o sinal está em 0:31–0:34 desta aula» em vez de «é nesta aula». */
let MARCADAS = [];
let MK_INDICE = null;
function invalidarMkIndice() { MK_INDICE = null; }
function mkIndice() {
  if (MK_INDICE) return MK_INDICE;
  const local = lerMarcacoes().map(m => ({ ...m, palavraChave: m.palavraChave || chavePalavra(m.palavra), estado: m.estado === 'por validar' ? 'a validar' : m.estado }));
  MK_INDICE = new Map();
  MARCADAS.concat(local).forEach(m => {
    const c = m.palavraChave;
    if (!c) return;
    if (!MK_INDICE.has(c)) MK_INDICE.set(c, []);
    MK_INDICE.get(c).push(m);
  });
  MK_INDICE.forEach(l => l.sort((a, b) => a.inicio - b.inicio));
  return MK_INDICE;
}
function momentoDe(palavra, aulaId) {
  const c = chavePalavra(palavra);
  if (!c) return null;
  const pool = mkIndice().get(c);
  if (!pool || !pool.length) return null;
  const desta = aulaId ? pool.filter(m => m.aula === aulaId) : [];
  return desta.length ? desta[0] : pool[0];
}
const chipMomento = (m) => m
  ? 'Sinal visível em ' + fmtT(m.inicio) + ' → ' + fmtT(m.fim) + ' desta aula (' +
    (m.estado === 'confirmado' ? 'momento confirmado' : 'momento ainda por validar') + ').'
  : '';

/* mm:ss.d — é o formato que a equipa lê em voz alta ("31 vírgula 4 segundos") */
function fmtT(s) {
  if (s == null || !isFinite(s)) return '—';
  let t = Math.round(Math.max(0, s) * 10) / 10;
  let m = Math.floor(t / 60), seg = Math.round((t - m * 60) * 10) / 10;
  if (seg >= 60) { m += 1; seg -= 60; }
  return m + ':' + seg.toFixed(1).padStart(4, '0');
}
function parseT(x) {
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
}

/* estado vivo da ferramenta (não é persistido: só as marcações é que contam) */
const mk = { aula: LGA_AULAS[1].id, t: 0, player: null, rel: null, mod: 'manual', rever: null, editar: null, campo: 'inicio', mao: false };
let mkTecla = null, mkTempoYT = null;

function mkInfoPalavra(p) {
  const c = chavePalavra(p);
  if (!c) return null;
  const idx = typeof PAMOSSI_INDICE !== 'undefined' ? PAMOSSI_INDICE.get(c) : null;
  if (idx) return { tema: idx.tema, estado: idx.estado };
  for (const g of GLOSSARIO) {
    const t = g.termos.find(x => chavePalavra(x.palavra) === c);
    if (t) return { tema: g.tema, estado: t.estado };
  }
  return null;
}
const mkPalavras = () => {
  const vistas = new Set(), out = [];
  GLOSSARIO.forEach(g => g.termos.forEach(t => {
    const c = chavePalavra(t.palavra);
    if (c && !vistas.has(c)) { vistas.add(c); out.push(t.palavra); }
  }));
  return out.sort((a, b) => a.localeCompare(b, 'pt'));
};

/* --- 14.1 o leitor: lê a hora do vídeo quando puder, e diz quando não puder --- */
function mkPintarModo(msg) {
  const el = $('#mk-mod');
  if (el) el.textContent = msg || '';
  const cap = $$('[data-mk-capt]');
  cap.forEach(b => { b.disabled = mk.mod !== 'leitor'; });
  const play = $('#mk-play');
  if (play) play.disabled = mk.mod !== 'leitor';
  const relogio = $('#mk-relogio');
  if (relogio) relogio.dataset.vivo = mk.mod === 'leitor' ? 'sim' : 'nao';
}

function mkNovoPlayer(id) {
  const caixa = $('#mk-video');
  if (!caixa || !(window.YT && window.YT.Player)) return;
  caixa.innerHTML = '<div id="mk-leitor"></div>';
  try {
    mk.player = new window.YT.Player('mk-leitor', {
      host: 'https://www.youtube-nocookie.com',
      videoId: id,
      playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
      events: {
        onReady: () => { mk.mod = 'leitor'; mkPintarModo('O leitor está ligado: a hora do vídeo é lida automaticamente. Usa Capturar (ou as teclas i e f).'); mkIniciarTick(); },
        onStateChange: (ev) => { const p = $('#mk-play'); if (p && mk.player) p.textContent = ev.data === 1 ? 'Pausar' : 'Reproduzir'; },
        onError: (ev) => { mk.mod = 'manual'; mkPintarModo('O YouTube não deixou abrir o vídeo neste browser (código ' + ev.data + '). Podes marcar os tempos à mão — a ferramenta não depende do leitor.'); },
      },
    });
  } catch (e) {
    mk.mod = 'manual';
    mkPintarModo('Não foi possível usar o leitor neste browser. Marca os tempos à mão.');
  }
}

function mkMontarLeitor(id) {
  mkPararLeitor();
  mk.aula = id;
  if (!$('#mk-video')) return;
  if (!navigator.onLine) { mk.mod = 'manual'; mkPintarModo('Sem ligação: o vídeo não abre aqui, mas podes marcar os tempos à mão (vê a aula noutro ecrã e escreve mm:ss).'); return; }
  mk.mod = 'a-carregar'; mkPintarModo('A carregar o leitor do YouTube…');
  if (window.YT && window.YT.Player) { mkNovoPlayer(id); return; }
  window.onYouTubeIframeAPIReady = () => { if (!mk.player) mkNovoPlayer(mk.aula); };
  clearTimeout(mkTempoYT);
  mkTempoYT = setTimeout(() => {
    if (!mk.player) { mk.mod = 'manual'; mkPintarModo('O leitor demorou a responder. Marca os tempos à mão, ou muda de aula para tentar de novo.'); }
  }, 12000);
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.async = true;
  s.onerror = () => { mk.mod = 'manual'; mkPintarModo('A rede bloqueou o leitor do YouTube. A marcação manual continua a funcionar.'); };
  document.head.appendChild(s);
}

function mkIniciarTick() {
  if (mk.rel) clearInterval(mk.rel);
  mk.rel = setInterval(mkPulsar, 200);
}
function mkPulsar() {
  const p = mk.player;
  if (!p || !p.getCurrentTime) return;
  let t;
  try { t = Number(p.getCurrentTime()) || 0; } catch (e) { return; }
  mk.t = t;
  const c = $('#mk-relogio');
  if (c) {
    let dur = '';
    try { const d = Number(p.getDuration && p.getDuration()); dur = d > 0 ? ' / ' + fmtT(d) : ''; } catch (e) { /* ainda sem duração */ }
    c.textContent = fmtT(t) + dur;
  }
  if (mk.rever != null && t >= mk.rever) {
    mk.rever = null;
    try { p.pauseVideo(); } catch (e) { /* já parado */ }
    const m = $('#mk-status');
    if (m) m.textContent = 'Chegaste ao fim da marcação — parei o vídeo.';
  }
}
function mkPararLeitor() {
  if (mk.rel) { clearInterval(mk.rel); mk.rel = null; }
  clearTimeout(mkTempoYT);
  mk.rever = null;
  const p = mk.player; mk.player = null;
  if (p && typeof p.destroy === 'function') { try { p.destroy(); } catch (e) { /* leitor ainda não estava pronto */ } }
  mk.mod = 'manual'; mk.t = 0;
}
/* chamado em cada mudança de rota, ao lado dos outros desligadores */
function desligarMarcacoes() {
  mkPararLeitor();
  if (mkTecla) { document.removeEventListener('keydown', mkTecla); mkTecla = null; }
  mk.editar = null;
}

function mkCapturar(qual) {
  if (mk.mod !== 'leitor') {
    const m = $('#mk-status');
    if (m) m.textContent = 'Sem leitor ligado não há hora para capturar — escreve mm:ss no campo de ' + (qual === 'inicio' ? 'início' : 'fim') + '.';
    return;
  }
  const campo = $(qual === 'inicio' ? '#mk-inicio' : '#mk-fim');
  if (!campo) return;
  campo.value = fmtT(mk.t);
  mk.campo = qual;
  mkRegra();
}
function mkAjustar(d) {
  const campo = $(mk.campo === 'fim' ? '#mk-fim' : '#mk-inicio');
  if (!campo) return;
  const base = parseT(campo.value);
  const valor = base == null ? (mk.mod === 'leitor' ? mk.t : 0) : base;
  campo.value = fmtT(Math.max(0, valor + d));
  mkRegra();
}
/* o leitor só serve para ouvir o trecho marcado: início → fim, e pára */
function mkRever(id) {
  const m = lerMarcacoes().find(x => x.id === id);
  if (!m) return;
  if (mk.mod !== 'leitor') {
    const a = $('#mk-status');
    if (a) a.textContent = 'Sem leitor ligado não consigo saltar para o momento. A marcação continua guardada.';
    return;
  }
  try {
    mk.rever = m.fim;
    mk.player.seekTo(m.inicio, true);
    mk.player.playVideo();
    window.scrollTo({ top: 0, behavior: movReduzido() ? 'auto' : 'smooth' });
  } catch (e) {
    mk.rever = null;
    const a = $('#mk-status');
    if (a) a.textContent = 'O leitor não aceitou o salto. Tenta reproduzir normalmente.';
  }
}
function mkPlayPause() {
  if (mk.mod !== 'leitor' || !mk.player) return;
  try {
    if (mk.player.getPlayerState && mk.player.getPlayerState() === 1) mk.player.pauseVideo();
    else mk.player.playVideo();
  } catch (e) { /* leitor ainda a carregar */ }
}

/* --- 14.2 regras e gravação --- */
function mkRegra() {
  const i = parseT(($('#mk-inicio') || {}).value), f = parseT(($('#mk-fim') || {}).value);
  const d = $('#mk-dur');
  if (d) d.textContent = (i == null || f == null) ? '—' : (f > i ? fmtT(f - i).replace(/^\d+:/, '') + 's' : 'fim depois do início?');
  return true;
}
function mkGuardar(form) {
  const fd = new FormData(form);
  const palavra = String(fd.get('palavra') || '').trim();
  const inicio = parseT(fd.get('inicio')), fim = parseT(fd.get('fim'));
  const msg = (t) => { const m = $('#mk-status'); if (m) m.textContent = t; };

  if (palavra.length < 2) { msg('Escreve a palavra primeiro.'); $('#mk-palavra').focus(); return; }
  if (palavra.length > 48) { msg('Palavra demasiado longa (máx. 48 caracteres).'); return; }
  if (inicio == null) { msg('Falta o tempo de início — captura do leitor ou escreve mm:ss.'); $('#mk-inicio').focus(); return; }
  if (fim == null) { msg('Falta o tempo de fim — captura do leitor ou escreve mm:ss.'); $('#mk-fim').focus(); return; }
  if (fim <= inicio) { msg('O fim tem de vir depois do início.'); $('#mk-fim').focus(); return; }
  if (fim - inicio > MK_MAX_DURACAO) {
    msg('Demasiado longo para um sinal isolado (' + fmtT(fim - inicio) + '). Marca só o momento do sinal, não a explicação toda.');
    return;
  }

  const lista = lerMarcacoes();
  const info = mkInfoPalavra(palavra);
  const registo = {
    id: mk.editar || mkId(),
    aula: mk.aula,
    videoId: mk.aula,
    aulaTitulo: (aulaPorId(mk.aula) || {}).titulo || '',
    temaDaAula: (aulaPorId(mk.aula) || {}).tema || '',
    palavra: palavra,
    palavraChave: chavePalavra(palavra),
    tema: info ? info.tema : 'Fora do glossário',
    estadoGlossario: info ? info.estado : null,
    inicio: inicio,
    fim: fim,
    estado: 'por validar',
    origem: mk.editar ? 'correção' : (mk.mod === 'leitor' ? (mk.mao ? 'leitor + escrito à mão' : 'leitor') : 'escrito à mão'),
    marcadoEm: new Date().toISOString(),
    nota: String(fd.get('nota') || '').trim(),
  };
  const i = lista.findIndex(x => x.id === registo.id);
  if (i >= 0) { lista[i] = Object.assign({}, lista[i], registo, { corrigidoEm: new Date().toISOString() }); }
  else lista.push(registo);
  if (!guardarMarcacoes(lista)) { msg('O aparelho está cheio: exporta e apaga marcações antigas, depois tenta de novo.'); return; }

  const antigo = mk.editar;
  mk.editar = null;
  mk.mao = false;
  $('#mk-inicio').value = ''; $('#mk-fim').value = '';
  $$('[data-mk-estado]').forEach(b => b.remove());
  msg((antigo ? 'Corrigida: ' : 'Guardada: ') + '«' + palavra + '» ' + fmtT(inicio) + ' → ' + fmtT(fim) +
    ' · estado: por validar (só um sinalizador surdo confirma).');
  mkPintarLista();
  mkPintarContadores();
  mkRegra();
  $('#mk-palavra').focus();
}
function mkApagar(id) {
  const lista = lerMarcacoes();
  const m = lista.find(x => x.id === id);
  const fica = lista.filter(x => x.id !== id);
  guardarMarcacoes(fica);
  if (mk.editar === id) { mk.editar = null; $('#mk-palavra').value = ''; $('#mk-inicio').value = ''; $('#mk-fim').value = ''; }
  mkPintarLista();
  mkPintarContadores();
  const s = $('#mk-status');
  if (s) s.textContent = 'Apagada a marcação de «' + ((m && m.palavra) || '?') + '» deste aparelho.';
}
function mkEditar(id) {
  const m = lerMarcacoes().find(x => x.id === id);
  if (!m) return;
  mk.editar = m.id;
  if (m.aula !== mk.aula) {
    const sel = $('#mk-aula');
    if (sel) { sel.value = m.aula; mkMontarLeitor(m.aula); mkPintarLista(); }
  }
  $('#mk-palavra').value = m.palavra;
  $('#mk-inicio').value = fmtT(m.inicio);
  $('#mk-fim').value = fmtT(m.fim);
  if (m.nota) $('#mk-nota').value = m.nota;
  mkRegra();
  const h = $('#mk-ac-h'); if (h) h.textContent = 'Guardar alteração';
  const b = mkEstadoBotao();
  $('#mk-ac').insertAdjacentElement('afterbegin', b);
  $('#mk-palavra').focus();
  const s = $('#mk-status');
  if (s) s.textContent = 'A corrigir «' + m.palavra + '». Muda os tempos e carrega em Guardar alteração.';
}
function mkEstadoBotao() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-o btn-sm';
  b.dataset.mkEstado = '';
  b.textContent = 'Cancelar correção';
  b.addEventListener('click', () => {
    mk.editar = null; b.remove();
    $('#mk-palavra').value = ''; $('#mk-inicio').value = ''; $('#mk-fim').value = '';
    const h = $('#mk-ac-h'); if (h) h.textContent = 'Guardar marcação';
  });
  return b;
}

/* --- 14.3 listas e contadores --- */
function mkItemHTML(m) {
  return `<li class="mk-item" data-mk-id="${esc(m.id)}">
    <p class="mk-item-p"><span class="mk-w">${esc(m.palavra)}</span>
      <span class="dic-badge is-a-validar">por validar</span>
      <span class="mk-chip">${esc(fmtT(m.inicio))} → ${esc(fmtT(m.fim))}</span>
      <span class="mk-chip mk-chip-d">${esc(fmtT(m.fim - m.inicio).replace(/^\d+:/, ''))}s</span></p>
    ${m.nota ? `<p class="mk-item-n">${esc(m.nota)}</p>` : ''}
    <p class="mk-item-a">
      <button class="btn btn-o btn-sm" type="button" data-mk-rev="${esc(m.id)}">${I.play} Rever o trecho</button>
      <button class="btn btn-o btn-sm" type="button" data-mk-edit="${esc(m.id)}">Corrigir</button>
      <button class="btn btn-o btn-sm" type="button" data-mk-apaga="${esc(m.id)}">Apagar</button>
    </p>
  </li>`;
}
const mkDaAula = (id) => lerMarcacoes().filter(m => m.aula === id).sort((a, b) => a.inicio - b.inicio);

function mkListaVazia() {
  return '<li class="ch-vazio">Ainda sem marcações nesta aula. Escolhe a aula, vê o momento do sinal e carrega em Capturar.</li>';
}
function mkPintarLista() {
  const ul = $('#mk-lista');
  if (!ul) return;
  const itens = mkDaAula(mk.aula);
  ul.innerHTML = itens.length ? itens.map(mkItemHTML).join('') : mkListaVazia();
  const n = $('#mk-n-aula');
  if (n) n.textContent = String(itens.length);
}
function mkPintarContadores() {
  const todas = lerMarcacoes();
  const unicas = new Set(todas.map(m => m.palavraChave));
  const glossario = mkPalavras();
  const cobertas = glossario.filter(p => unicas.has(chavePalavra(p))).length;
  const setEl = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
  setEl('#mk-n-tot', String(todas.length));
  setEl('#mk-n-pal', String(unicas.size));
  setEl('#mk-cob', String(cobertas));
  setEl('#mk-cob-total', String(glossario.length));
  const tabela = $('#mk-cobertura');
  if (tabela) {
    tabela.innerHTML = LGA_AULAS.map(a => {
      const ms = mkDaAula(a.id);
      const pal = new Set(ms.map(m => m.palavraChave)).size;
      return `<tr${a.id === mk.aula ? ' class="mk-aqui"' : ''}>
        <th scope="row">${esc(a.titulo)}</th>
        <td class="mk-num">${ms.length}</td>
        <td class="mk-num">${pal}</td>
        <td class="mk-num">${ms.length ? esc(fmtT(Math.max.apply(null, ms.map(m => m.fim)))) : '—'}</td>
      </tr>`;
    }).join('');
  }
}

/* --- 14.4 exportar e importar (o único caminho para fora do aparelho) --- */
function pacoteMarcacoes() {
  return {
    schema: SCHEMA_MK,
    tipo: 'pamosii-marcacoes',
    geradoEm: new Date().toISOString(),
    formato: '{aula, palavra, inicio, fim, estado} + origem de cada marcação',
    total: lerMarcacoes().length,
    marcacoes: lerMarcacoes(),
  };
}
function importarMarcacoes(texto) {
  const msg = (t) => { const m = $('#mk-status'); if (m) m.textContent = t; };
  let dados;
  try { dados = JSON.parse(texto); } catch (e) { msg('O ficheiro não é JSON válido.'); return; }
  const lista = Array.isArray(dados) ? dados : (dados && Array.isArray(dados.marcacoes) ? dados.marcacoes : null);
  if (!lista) { msg('Não encontrei a lista de marcações neste ficheiro.'); return; }
  if (dados && dados.schema && dados.schema > SCHEMA_MK) { msg('Este ficheiro é de um esquema mais novo que este site.'); return; }
  const actual = lerMarcacoes();
  const chaves = new Set(actual.map(m => [m.aula, m.palavraChave, m.inicio].join('|')));
  let novos = 0, repetidos = 0, maus = 0;
  lista.forEach(r => {
    const palavra = String((r && r.palavra) || '').trim();
    const inicio = parseT(r && r.inicio != null ? r.inicio : ''), fim = parseT(r && r.fim != null ? r.fim : '');
    const aula = String((r && r.aula) || '');
    if (!palavra || inicio == null || fim == null || fim <= inicio || fim - inicio > MK_MAX_DURACAO || !aulaPorId(aula)) { maus += 1; return; }
    const chave = [aula, chavePalavra(palavra), inicio].join('|');
    if (chaves.has(chave)) { repetidos += 1; return; }
    chaves.add(chave);
    novos += 1;
    actual.push({
      id: r.id || mkId(), aula: aula, videoId: aula,
      aulaTitulo: (aulaPorId(aula) || {}).titulo || r.aulaTitulo || '',
      temaDaAula: (aulaPorId(aula) || {}).tema || '',
      palavra: palavra, palavraChave: chavePalavra(palavra),
      tema: r.tema || (mkInfoPalavra(palavra) || {}).tema || 'Fora do glossário',
      estadoGlossario: (mkInfoPalavra(palavra) || {}).estado || null,
      inicio: inicio, fim: fim,
      estado: 'por validar',
      origem: 'importado',
      marcadoEm: r.marcadoEm || new Date().toISOString(),
      nota: String(r.nota || '').trim(),
    });
  });
  if (!guardarMarcacoes(actual)) { msg('Não coube tudo: o aparelho está cheio.'); return; }
  msg('Importação: ' + novos + ' ' + pl(novos, 'marcação nova', 'marcações novas') + ', '
    + repetidos + ' ' + pl(repetidos, 'que já cá estava', 'que já cá estavam') + ', '
    + maus + ' ' + pl(maus, 'sem formato válido (ignorada)', 'sem formato válido (ignoradas)') + '.');
  mkPintarLista();
  mkPintarContadores();
}

/* --- 14.5 o que a equipa publicou chega a todos os cartões --- */
async function carregarMarcacoes() {
  try {
    const res = await fetch('assets/marcacoes.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const dados = await res.json();
    const l = Array.isArray(dados) ? dados : (dados && Array.isArray(dados.marcacoes) ? dados.marcacoes : []);
    MARCADAS = l
      .filter(m => m && aulaPorId(m.aula) && isFinite(Number(m.inicio)) && isFinite(Number(m.fim)) && m.fim > m.inicio)
      .map(m => ({ ...m, inicio: Number(m.inicio), fim: Number(m.fim), palavraChave: chavePalavra(m.palavra) }));
    invalidarMkIndice();
  } catch (e) { /* sem ficheiro publicado (ou sem rede): ficam só as marcações deste aparelho */ }
}

/* --- 14.7 a página --- */
function marcacoesHTML() {
  const aulas = LGA_AULAS.map(a => `<option value="${esc(a.id)}">${esc(a.ordem + ' · ' + a.titulo)}</option>`).join('');
  const palavras = mkPalavras();
  return `
<div class="wrap page-head">
  <p class="eyebrow">${I.clock} Marcação de tempos</p>
  <h1 id="mk-h">Onde está o sinal dentro da aula?</h1>
  <p class="lead">As 17 aulas ensinam os sinais, mas o dicionário só consegue dizer «é nesta aula».
  Esta ferramenta serve para marcar <strong>os segundos em que o sinal de uma palavra começa e acaba</strong>.
  É esse mapa que permite depois mostrar um clipe curto do sinal em vez de uma aula inteira.</p>
</div>
<div class="wrap mk-wrap">
  <div class="note-band">
    <p>${I.shield} <strong>Marcar não é validar.</strong> Toda a marcação sai daqui com o estado
    <em>por validar</em>: tu dizes <em>onde</em> está o sinal, não <em>se</em> aquela palavra é mesmo aquele sinal.
    A confirmação é de uma pessoa surda sinalizadora de LGA.</p>
    <p>${I.info} <strong>Nada é enviado por este site.</strong> As marcações ficam guardadas neste aparelho
    e só saem quando fores tu a descarregar o ficheiro JSON. Não pedimos nome, telefone nem contas.</p>
  </div>

  <section class="mk-aula" aria-labelledby="mk-aula-h">
    <h2 id="mk-aula-h">${I.video} 1 · Escolhe a aula</h2>
    <p class="mk-campo">
      <label for="mk-aula">Aula do mini-curso</label>
      <select id="mk-aula">${aulas}</select>
    </p>
    <div class="vfacade mk-video" id="mk-video"><p class="mk-video-aviso">O leitor aparece aqui quando escolheres uma aula. Sem rede, a marcação continua a funcionar à mão.</p></div>
    <p class="mk-readout">
      <span class="mk-clock"><span class="mk-clock-k">hora no vídeo</span> <strong id="mk-relogio" data-vivo="nao">0:00.0</strong></span>
      <button class="btn btn-o btn-sm" type="button" id="mk-play" disabled>Reproduzir</button>
      <button class="btn btn-o btn-sm" type="button" data-mk-aj="-1" aria-label="Retroceder um segundo">−1s</button>
      <button class="btn btn-o btn-sm" type="button" data-mk-aj="1" aria-label="Avançar um segundo">+1s</button>
    </p>
    <p class="mk-msg" id="mk-mod" role="status"></p>
  </section>

  <section class="mk-form" aria-labelledby="mk-form-h">
    <h2 id="mk-form-h">${I.target} 2 · Marca um sinal</h2>
    <form id="mk-nova" class="mk-campos">
      <p class="mk-campo mk-campo-lg">
        <label for="mk-palavra">Palavra ou frase sinalizada</label>
        <input id="mk-palavra" name="palavra" type="text" maxlength="48" autocomplete="off" list="mk-palavras"
          required placeholder="ex.: obrigado">
        <span class="mk-hint" id="mk-info"></span>
      </p>
      <datalist id="mk-palavras">${palavras.map(p => `<option value="${esc(p)}"></option>`).join('')}</datalist>
      <p class="mk-campo">
        <label for="mk-inicio">Início do sinal</label>
        <span class="mk-time">
          <input id="mk-inicio" name="inicio" type="text" inputmode="decimal" autocomplete="off" placeholder="mm:ss">
          <button class="btn btn-a btn-sm" type="button" data-mk-capt="inicio" disabled>Capturar</button>
        </span>
      </p>
      <p class="mk-campo">
        <label for="mk-fim">Fim do sinal</label>
        <span class="mk-time">
          <input id="mk-fim" name="fim" type="text" inputmode="decimal" autocomplete="off" placeholder="mm:ss">
          <button class="btn btn-a btn-sm" type="button" data-mk-capt="fim" disabled>Capturar</button>
        </span>
      </p>
      <p class="mk-campo mk-campo-lg">
        <label for="mk-nota">Nota (opcional) — variante, mão, contexto</label>
        <input id="mk-nota" name="nota" type="text" maxlength="160" autocomplete="off"
          placeholder="ex.: faz duas vezes; em Luanda é com a mão direita">
      </p>
      <p class="mk-ac" id="mk-ac">
        <button class="btn btn-p btn-sm" type="submit">${I.check} <span id="mk-ac-h">Guardar marcação</span></button>
        <span class="mk-dur">duração: <strong id="mk-dur">—</strong></span>
        <span class="muted">estado: <strong>por validar</strong></span>
      </p>
    </form>
    <p class="mk-msg" id="mk-status" role="status" aria-live="polite"></p>
    <details class="mk-teclas">
      <summary>Atalhos de teclado desta ferramenta</summary>
      <ul>
        <li><kbd>i</kbd> capturar o início · <kbd>f</kbd> capturar o fim · <kbd>s</kbd> guardar</li>
        <li><kbd>espaço</kbd> reproduzir/pausar · <kbd>[</kbd> e <kbd>]</kbd> um segundo para trás / para a frente</li>
        <li>as teclas simples só actuam quando <strong>não</strong> estás a escrever num campo — se carregares
        dentro do leitor do YouTube, o teclado passa para ele; faz <kbd>Tab</kbd> até «Palavra» para voltar.</li>
      </ul>
    </details>
  </section>

  <section class="mk-minhas" aria-labelledby="mk-minhas-h">
    <h2 id="mk-minhas-h">${I.book} 3 · Marcações desta aula <span class="ch-n" id="mk-n-aula">0</span></h2>
    <ul class="mk-lista" id="mk-lista"></ul>
    <p class="mk-ac">
      <button class="btn btn-a btn-sm" type="button" id="mk-export">${I.doc} Exportar JSON ({aula, palavra, inicio, fim, estado})</button>
      <button class="btn btn-o btn-sm" type="button" id="mk-todas">Ver todas as aulas</button>
      <button class="btn btn-o btn-sm" type="button" id="mk-apagar-tudo">Apagar as marcações deste aparelho</button>
    </p>
    <p class="mk-ac">
      <label class="ch-import" for="mk-import-file">${I.search} Continuar o trabalho de outra pessoa <span class="muted">(importar JSON, só neste aparelho)</span></label>
      <input id="mk-import-file" type="file" accept="application/json,.json">
    </p>
  </section>

  <section class="mk-cobertura" aria-labelledby="mk-cob-h">
    <h2 id="mk-cob-h">${I.spark} 4 · Cobertura deste aparelho</h2>
    <p class="muted">Contas feitas às marcações guardadas aqui — é o que a equipa precisa de ver antes de
    cortar os clipes: quantas marcações, quantas palavras diferentes, e o ponto mais longe de cada aula.</p>
    <ul class="mk-stats">
      <li><strong id="mk-n-tot">0</strong><span>marcações no total</span></li>
      <li><strong id="mk-n-pal">0</strong><span>palavras diferentes</span></li>
      <li><strong><span id="mk-cob">0</span>/<span id="mk-cob-total">0</span></strong><span>palavras do glossário com momento marcado</span></li>
    </ul>
    <div class="mk-tab-wrap">
      <table class="mk-tab">
        <caption class="sr-only">Marcações por aula do mini-curso</caption>
        <thead><tr><th scope="col">Aula</th><th scope="col">Marcações</th><th scope="col">Palavras</th><th scope="col">Até</th></tr></thead>
        <tbody id="mk-cobertura"></tbody>
      </table>
    </div>
  </section>

  <section class="mk-para" aria-labelledby="mk-para-h">
    <h2 id="mk-para-h">${I.chat} Para que serve o ficheiro</h2>
    <ol class="ch-passo">
      <li><strong>Exportas</strong> aqui em cima → descarrega <code>pamosii-marcacoes-AAAA-MM-DD.json</code>.</li>
      <li><strong>A equipa junta</strong> os ficheiros de várias pessoas (cada sinalizador marca o que conhece) e
      elimina duplicados — o script <code>tools/ingerir-marcacoes.cjs</code> faz essa contagem.</li>
      <li><strong>Cortam-se os clipes</strong> nos momentos marcados e o dicionário passa a mostrar o sinal,
      não a aula inteira.</li>
      <li><strong>Um sinalizador surdo valida</strong> cada clipe (correto / variante regional / errado).
      Só depois a palavra muda de «por validar» para «confirmado».</li>
    </ol>
    <p class="muted">Enquanto não houver clipes cortados, o que a marcação muda no site é discreto mas honesto:
    os cartões do dicionário e do Pamosii passam a mostrar «o sinal está em 0:31–0:34 desta aula (a validar)」
    e o botão abre o vídeo nesse ponto.</p>
  </section>
</div>`;
}

function bindMarcacoes() {
  const sel = $('#mk-aula');
  if (sel) {
    sel.value = mk.aula;
    sel.addEventListener('change', () => { mkMontarLeitor(sel.value); mkPintarLista(); mkPintarContadores(); });
  }
  mkMontarLeitor(mk.aula);

  const form = $('#mk-nova');
  if (form) form.addEventListener('submit', e => { e.preventDefault(); mkGuardar(form); });

  $$('[data-mk-capt]').forEach(b => b.addEventListener('click', () => mkCapturar(b.dataset.mkCapt)));
  $$('[data-mk-aj]').forEach(b => b.addEventListener('click', () => mkAjustar(Number(b.dataset.mkAj))));
  const play = $('#mk-play');
  if (play) play.addEventListener('click', mkPlayPause);
  ['#mk-inicio', '#mk-fim'].forEach(s => { const i = $(s); if (i) i.addEventListener('input', () => { mk.mao = true; mkRegra(); }); });

  const palavra = $('#mk-palavra');
  if (palavra) palavra.addEventListener('input', () => {
    const h = $('#mk-info');
    if (!h) return;
    const info = mkInfoPalavra(palavra.value);
    h.textContent = !palavra.value.trim() ? ''
      : info ? `tema: ${info.tema} · no glossário: ${ESTADO_GLOSSARIO[info.estado] ? ESTADO_GLOSSARIO[info.estado].rotulo : info.estado}`
        : 'fora do glossário — mesmo assim vale: é uma palavra que falta';
  });

  const lista = $('#mk-lista');
  if (lista) lista.addEventListener('click', e => {
    const rev = e.target.closest('[data-mk-rev]');
    if (rev) return mkRever(rev.dataset.mkRev);
    const ed = e.target.closest('[data-mk-edit]');
    if (ed) return mkEditar(ed.dataset.mkEdit);
    const del = e.target.closest('[data-mk-apaga]');
    if (del) {
      const m = lerMarcacoes().find(x => x.id === del.dataset.mkApaga);
      if (!window.confirm('Apagar a marcação de «' + ((m && m.palavra) || '?') + '» deste aparelho?')) return;
      return mkApagar(del.dataset.mkApaga);
    }
  });

  const exp = $('#mk-export');
  if (exp) exp.addEventListener('click', () => {
    const p = pacoteMarcacoes();
    if (!p.total) { const s = $('#mk-status'); if (s) s.textContent = 'Ainda não há marcações para exportar.'; return; }
    descarregarFicheiro('pamosii-marcacoes-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(p, null, 2));
    const s = $('#mk-status');
    if (s) s.textContent = 'Ficheiro descarregado com ' + p.total + ' ' + pl(p.total, 'marcação.', 'marcações.') + ' Entrega-o à equipa — o site não o envia por ti.';
  });

  const imp = $('#mk-import-file');
  if (imp) imp.addEventListener('change', () => {
    const f = imp.files && imp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { importarMarcacoes(String(r.result || '')); imp.value = ''; };
    r.onerror = () => { const s = $('#mk-status'); if (s) s.textContent = 'Não consegui ler esse ficheiro.'; };
    r.readAsText(f);
  });

  const todas = $('#mk-todas');
  if (todas) todas.addEventListener('click', () => {
    const ul = $('#mk-lista');
    if (!ul) return;
    const mostrar = todas.dataset.mkModo === 'todas';
    if (mostrar) { todas.dataset.mkModo = ''; todas.textContent = 'Ver todas as aulas'; mkPintarLista(); return; }
    todas.dataset.mkModo = 'todas';
    todas.textContent = 'Ver só esta aula';
    const todas_itens = lerMarcacoes().sort((a, b) => a.inicio - b.inicio);
    ul.innerHTML = todas_itens.length ? todas_itens.map(m => `<li class="mk-item">
      <p class="mk-item-p"><span class="mk-w">${esc(m.palavra)}</span>
        <span class="dic-badge is-a-validar">por validar</span>
        <span class="mk-chip">${esc(fmtT(m.inicio))} → ${esc(fmtT(m.fim))}</span></p>
      <p class="mk-item-t">${esc(m.aulaTitulo || m.aula)}</p></li>`).join('') : mkListaVazia();
  });

  const limpar = $('#mk-apagar-tudo');
  if (limpar) limpar.addEventListener('click', () => {
    const n = lerMarcacoes().length;
    if (!n) { const s = $('#mk-status'); if (s) s.textContent = 'Não há nada guardado neste aparelho.'; return; }
    if (!window.confirm('Apagar as ' + n + ' ' + pl(n, 'marcação', 'marcações') + ' deste aparelho? Se ainda não exportaste, o trabalho perde-se.')) return;
    guardarMarcacoes([]);
    mkPintarLista(); mkPintarContadores();
    const s = $('#mk-status');
    if (s) s.textContent = 'Marcações apagadas deste aparelho.';
  });

  if (mkTecla) document.removeEventListener('keydown', mkTecla);
  mkTecla = (e) => {
    const alvo = e.target;
    const escreve = alvo && alvo.closest && alvo.closest('input,textarea,select,[contenteditable]');
    if (!escreve && mk.mod === 'leitor' && (e.key === ' ' || e.code === 'Space')) { e.preventDefault(); mkPlayPause(); return; }
    if (escreve || (alvo && alvo.closest && alvo.closest('button,a'))) return;
    const k = e.key.toLowerCase();
    if (k === 'i') { e.preventDefault(); mkCapturar('inicio'); }
    else if (k === 'f') { e.preventDefault(); mkCapturar('fim'); }
    else if (k === 's') { e.preventDefault(); const f = $('#mk-nova'); if (f) f.requestSubmit(); }
    else if (k === '[') { e.preventDefault(); mkAjustar(-1); }
    else if (k === ']') { e.preventDefault(); mkAjustar(1); }
  };
  document.addEventListener('keydown', mkTecla);

  mkPintarLista();
  mkPintarContadores();
  mkRegra();
  mkPintarModo($('#mk-mod') ? $('#mk-mod').textContent : '');
}

function vistaMarcacoes() {
  return {
    active: '/marcar',
    h: shell(marcacoesHTML(), '/marcar'),
    bind: bindMarcacoes,
    meta: { t: 'Marcação de tempos por sinal — Pamosii Viva Surdo', d: 'Ferramenta para marcar os segundos em que o sinal de cada palavra aparece nas 17 aulas de LGA. As marcações ficam no aparelho e exportam-se em JSON {aula, palavra, inicio, fim, estado} para a equipa cortar os clipes.' },
  };
}

on('/marcar', vistaMarcacoes);

function iniciarApp() {
  aplicarPrefs(lerPrefs());
  montarPainelA11y();
  montarSigner();
  render();
  carregarGlossarioExtra();
  carregarMarcacoes();
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
