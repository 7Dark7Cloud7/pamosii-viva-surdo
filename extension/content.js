/* Agatha Signer — extensão Chrome (Manifest V3)

   O que faz: põe um botão em qualquer site; ao clicar, abre o painel do Agatha Signer
   (o mesmo painel do site, carregado dentro de um iframe) e dá duas formas de escolher
   o texto: «Apontar» (carregar numa frase ou parágrafo da página) ou «Sinalizar a
   selecção» (o texto que a pessoa marcou).

   Regras de integridade — lê antes de mexer:
     - A extensão NÃO tem permissões: nem "storage", nem "tabs", nem host permissions.
       Não lê o conteúdo da página para lado nenhum: o único texto que sai daqui é o
       trecho que a pessoa escolheu, enviado por postMessage para o iframe do Pamosii,
       que por sua vez não envia nada a servidores (o glossário está dentro de app.js).
     - Não há reconhecimento de imagem nem de voz: a extensão só mostra texto escrito.
     - O resultado é glosa de estudo, não tradução automática, e o glossário está
       "A validar" pela comunidade surda angolana. A wording aparece no painel.
     - Se o painel não carregar (sem rede, site em baixo), diz isso mesmo — nunca finge.

   Mudar de alojamento: basta trocar SITE abaixo (e o exclude_matches no manifest.json). */

(() => {
  'use strict';

  /* em iframes de outros sites não fazemos nada: o painel é sempre o topo da página */
  if (window.top !== window) return;
  if (document.getElementById('pamosii-signer-host')) return;

  const SITE = 'https://7dark7cloud7.github.io/pamosii-viva-surdo';
  const WIDGET = SITE + '/?emb=1';
  const MAX_TEXTO = 6000;
  const BLOCOS = 'p,li,h1,h2,h3,h4,h5,h6,figcaption,blockquote,td,summary';
  const INTERACTIVO = 'a[href],button,summary,input,select,textarea,label,[role="button"],[contenteditable]';

  const estado = { aberto: false, aponta: false, pronto: false, espera: '', alvo: null };
  let host, sombra, painel, caixote, botao, iframe;

  /* ---------- 1. o painel (shadow DOM fechado: a página não nos vê por dentro) ---------- */
  function montar() {
    host = document.createElement('div');
    host.id = 'pamosii-signer-host';
    sombra = host.attachShadow({ mode: 'closed' });
    sombra.innerHTML = `
<style>
  :host{all:initial;position:fixed;z-index:2147483646;right:0;top:0;bottom:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  .col{display:flex;flex-direction:column;align-items:flex-end;gap:10px;padding:12px 12px calc(12px + env(safe-area-inset-bottom));height:100%;box-sizing:border-box}
  .fab{display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:0 16px 0 12px;border:0;border-radius:999px;
    background:#10342F;color:#fff;font:inherit;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 8px 26px rgba(0,0,0,.28)}
  .fab:hover{background:#1B5147}
  .fab svg{width:22px;height:22px;flex:none}
  .fab[aria-expanded="true"]{background:#F7C948;color:#10342F}
  .caixote{display:none;flex:1 1 auto;width:min(430px,calc(100vw - 24px));min-height:0;flex-direction:column;
    background:#FFFDF7;border-radius:16px;box-shadow:0 18px 54px rgba(0,0,0,.34);overflow:hidden}
  .caixote.on{display:flex}
  .barra{display:flex;flex-wrap:wrap;gap:7px;padding:10px 12px;background:#10342F;color:#fff}
  .barra strong{flex:1 1 100%;font-size:13.5px;font-weight:700;letter-spacing:.2px}
  .btn{min-height:40px;padding:0 13px;border-radius:11px;border:1.5px solid rgba(255,255,255,.45);
    background:transparent;color:#fff;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
  .btn:hover{border-color:#F7C948;color:#F7C948}
  .btn[aria-pressed="true"]{background:#F7C948;border-color:#F7C948;color:#10342F}
  .btn.x{margin-left:auto}
  .recado{margin:0;padding:9px 12px;font-size:12.5px;line-height:1.5;background:#FBEFD4;color:#8A5600}
  .recado a{color:#8A5600}
  .leito{flex:1 1 auto;min-height:0;position:relative;background:#FFFDF7}
  iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#FFFDF7}
  @media (prefers-reduced-motion:reduce){.fab,.btn{transition:none}}
  @media (max-width:520px){
    :host{left:0;right:0;top:auto;bottom:0}
    .col{padding:8px}
    .caixote{width:100%}
    .caixote.on{max-height:min(78vh,620px)}
  }
</style>
<div class="col">
  <button class="fab" type="button" aria-expanded="false" aria-controls="painel">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle><path d="M8.5 14.5c1.2-3.4 5.8-3.4 7 0"></path>
      <circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none"></circle>
      <circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none"></circle>
    </svg>
    <span>Agatha</span>
  </button>
  <div class="caixote" id="painel" role="region" aria-label="Agatha Signer">
    <div class="barra">
      <strong>Agatha Signer — apontar para sinalizar</strong>
      <button class="btn" type="button" id="aponta" aria-pressed="false">Apontar a um texto</button>
      <button class="btn" type="button" id="selec">Sinalizar a selecção</button>
      <button class="btn x" type="button" id="fecha" aria-label="Fechar o painel do Agatha Signer">×</button>
    </div>
    <p class="recado" id="recado" hidden></p>
    <p class="recado">Glosa de estudo feita com o glossário do Pamosii, ainda <strong>A validar</strong> pela
      comunidade surda angolana. Não é tradução automática e nada do que apontas é enviado para um servidor.</p>
    <div class="leito" id="leito"></div>
  </div>
</div>`;
    botao = sombra.querySelector('.fab');
    caixote = sombra.getElementById('painel');
    painel = sombra.getElementById('leito');
    const reca = sombra.getElementById('recado');

    sombra.querySelector('.fab').addEventListener('click', alternar);
    sombra.getElementById('fecha').addEventListener('click', fecharPainel);
    sombra.getElementById('aponta').addEventListener('click', () => { estado.aponta ? apontarDesligar() : apontarLigar(); });
    sombra.getElementById('selec').addEventListener('click', mandarSeleccao);
    document.body.appendChild(host);

    setTimeout(() => {
      if (!estado.pronto) {
        reca.hidden = false;
        reca.innerHTML = 'O painel ainda não respondeu. Precisa de rede para falar com o site do Pamosii — '
          + 'ou o site está indisponível. Podes abrir <a href="' + SITE + '/#/pamosii" target="_blank" rel="noopener">o Pamosii numa janela</a>.';
      }
    }, 9000);
  }

  function abrirPainel() {
    caixote.classList.add('on');
    botao.setAttribute('aria-expanded', 'true');
    if (!iframe) carregarIframe();
  }
  function fecharPainel() {
    apontarDesligar();
    caixote.classList.remove('on');
    botao.setAttribute('aria-expanded', 'false');
  }
  function alternar() {
    estado.aberto = !estado.aberto;
    estado.aberto ? abrirPainel() : fecharPainel();
  }

  function carregarIframe() {
    iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Agatha Signer');
    iframe.setAttribute('src', WIDGET + '#/pamosii');
    iframe.setAttribute('allow', 'fullscreen');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    painel.appendChild(iframe);
  }

  /* ---------- 2. mandar texto para o painel ---------- */
  function mandar(texto) {
    const limpo = String(texto || '').replace(/\u0000/g, '').trim().slice(0, MAX_TEXTO);
    if (limpo.length < 2) { aviso('Não havia texto suficiente nesse ponto.'); return; }
    if (!estado.aberto) { estado.aberto = true; abrirPainel(); }
    if (!estado.pronto) { estado.espera = limpo; return; }
    try { iframe.contentWindow.postMessage({ tipo: 'pamosii-sinalizar', texto: limpo }, SITE); }
    catch (e) { estado.espera = limpo; }
  }

  function mandarSeleccao() {
    const t = String(window.getSelection() || '').trim();
    if (!t) { aviso('Primeiro marca um texto na página, depois carrega em “Sinalizar a selecção”.'); return; }
    apontarDesligar();
    mandar(t);
  }

  function aviso(texto) {
    const r = sombra.getElementById('recado');
    if (!r) return;
    r.hidden = false;
    r.textContent = texto;
  }

  window.addEventListener('message', (ev) => {
    if (!ev.data || ev.data.tipo !== 'pamosii-signer-pronto') return;
    if (ev.origin !== new URL(SITE).origin) return;
    estado.pronto = true;
    const r = sombra.getElementById('recado');
    if (r) r.hidden = true;
    if (estado.espera) { const t = estado.espera; estado.espera = ''; mandar(t); }
  });

  /* ---------- 3. modo apontar na página da pessoa ---------- */
  function blocosPagina() {
    return Array.from(document.querySelectorAll(BLOCOS))
      .filter(e => !e.closest('#pamosii-signer-host') && !e.matches(INTERACTIVO)
        && !e.querySelector(BLOCOS) && (e.textContent || '').trim().length > 2);
  }

  function textoDoBloco(el) {
    const partes = [];
    let s = '';
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const t = n.nodeValue || ''; if (t.length) { partes.push({ no: n, len: t.length }); s += t; } }
      else if (n.nodeName === 'BR') { partes.push({ no: null, len: 1 }); s += ' '; }
    }
    return { s, partes };
  }

  function frasesDoTexto(s) {
    const out = [];
    const re = /[.!?…]+[»"')\]]*\s*|[;:]\s+|\n+/g;
    let ini = 0, m;
    while ((m = re.exec(s))) {
      const fim = m.index + m[0].length;
      if (s.slice(ini, fim).trim().length > 2) out.push([ini, fim]);
      ini = fim;
    }
    if (s.slice(ini).trim().length > 2) out.push([ini, s.length]);
    return out;
  }

  function indiceDasPartes(partes, no, off) {
    let ac = 0;
    for (const p of partes) {
      if (p.no === no) return ac + Math.min(off, p.len);
      ac += p.len;
    }
    return -1;
  }

  /* a frase por baixo do cursor; se não houver cursor (teclado), o bloco todo */
  function trechoApontado(el, x, y) {
    const { s, partes } = textoDoBloco(el);
    const sel = window.getSelection();
    const marcada = sel ? String(sel).trim() : '';
    const dentro = sel && sel.anchorNode && el.contains(sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode);
    if (marcada.length > 2 && dentro) {
      const i = s.indexOf(marcada);
      if (i >= 0) {
        const letra = (c) => /[\p{L}\p{N}]/u.test(c || '');
        let a = i, b = i + marcada.length;
        while (a > 0 && letra(s[a - 1])) a--;
        while (b < s.length && letra(s[b])) b++;
        return s.slice(a, b);
      }
      return marcada;
    }
    const frases = frasesDoTexto(s);
    if (!frases.length) return s;
    let idx = -1;
    if (typeof document.caretRangeFromPoint === 'function') {
      const r = document.caretRangeFromPoint(x, y);
      if (r && r.startContainer) idx = indiceDasPartes(partes, r.startContainer, r.startOffset);
    } else if (typeof document.caretPositionFromPoint === 'function') {
      const p = document.caretPositionFromPoint(x, y);
      if (p && p.offsetNode) idx = indiceDasPartes(partes, p.offsetNode, p.offset);
    }
    if (idx < 0) return s;
    const f = frases.find(([a, b]) => idx >= a && idx <= b) || frases[0];
    return s.slice(f[0], f[1]);
  }

  function marcar(el) {
    if (estado.alvo === el) return;
    if (estado.alvo) estado.alvo.classList.remove('pamosii-alvo');
    estado.alvo = el;
    if (estado.alvo) {
      estado.alvo.classList.add('pamosii-alvo');
      estado.alvo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function onMousemove(e) {
    if (!estado.aponta) return;
    const el = e.target && e.target.closest && e.target.closest(BLOCOS);
    if (!el || el.closest('#pamosii-signer-host') || el.matches(INTERACTIVO)) return;
    if (el.querySelector(BLOCOS)) return;
    marcar(el);
  }

  function onClick(e) {
    if (!estado.aponta) return;
    if (e.button && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest('#pamosii-signer-host')) return;
    /* links e botões continuam a ser links e botões */
    if (e.target && e.target.closest && e.target.closest(INTERACTIVO)) return;
    const el = e.target && e.target.closest && e.target.closest(BLOCOS);
    if (!el || el.querySelector(BLOCOS)) { aviso('Aí não havia texto. Carrega em cima de uma frase ou parágrafo.'); return; }
    e.preventDefault();
    e.stopPropagation();
    const t = trechoApontado(el, e.clientX, e.clientY);
    apontarDesligar();
    mandar(t);
  }

  function onTecla(e) {
    if (!estado.aponta) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); apontarDesligar(); return; }
    const lista = blocosPagina();
    if (!lista.length) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      const passo = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      const actual = lista.indexOf(estado.alvo);
      const prox = Math.max(0, Math.min(lista.length - 1, (actual < 0 ? 0 : actual + passo)));
      marcar(lista[prox]);
      return;
    }
    if (e.key === 'Enter' && estado.alvo) {
      e.preventDefault(); e.stopPropagation();
      const r = estado.alvo.getBoundingClientRect();
      const t = trechoApontado(estado.alvo, r.left + Math.min(20, r.width / 2), r.top + Math.min(12, r.height / 2));
      apontarDesligar();
      mandar(t);
    }
  }

  function apontarLigar() {
    estado.aponta = true;
    document.documentElement.classList.add('pamosii-a-apontar');
    sombra.getElementById('aponta').setAttribute('aria-pressed', 'true');
    aviso('Modo apontar ligado: carrega numa frase ou parágrafo desta página. Com o teclado, ← e → percorrem os textos e Enter sinaliza. Esc para sair.');
    document.addEventListener('mousemove', onMousemove, { passive: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onTecla, true);
    marcar(blocosPagina()[0] || null);
  }

  function apontarDesligar() {
    estado.aponta = false;
    document.documentElement.classList.remove('pamosii-a-apontar');
    const b = sombra && sombra.getElementById('aponta');
    if (b) b.setAttribute('aria-pressed', 'false');
    document.removeEventListener('mousemove', onMousemove);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onTecla, true);
    if (estado.alvo) { estado.alvo.classList.remove('pamosii-alvo'); estado.alvo = null; }
  }

  /* ---------- 4. arrancar ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.tipo === 'pamosii-alternar') alternar();
    });
  }
})();
