/* Viva Surdo — extensão Chrome (Manifest V3)

   Usa o mesmo código web do Pamosii, empacotado em widget/, para renderização local.
   Os content_scripts em sites HTTP/HTTPS exigem acesso de instalação a esses sites,
   mesmo sem permissions ou host_permissions adicionais. Não lê campos de formulário,
   não acompanha alterações de texto, não guarda nem envia texto a servidores.
   A glosa e o rig (dados.js + maos.js) são materiais de estudo por validar, não tradução.
   Texto pendente fica só em memória, até confirmação do iframe ou nova escolha. */

(() => {
  'use strict';

  /* em iframes de outros sites não fazemos nada: o painel é sempre o topo da página */
  if (window.top !== window) return;
  if (document.getElementById('pamosii-signer-host')) return;

  const WIDGET = chrome.runtime.getURL('widget/index.html?emb=1');
  const URL_WIDGET = new URL(WIDGET);
  const DESTINO = `${URL_WIDGET.protocol}//${URL_WIDGET.host}`;
  /* Chrome serializa esta origem; outros parsers URL podem devolver "null". */
  const ORIGEM = URL_WIDGET.origin === 'null' ? DESTINO : URL_WIDGET.origin;
  const LOGO = chrome.runtime.getURL('icon-192.png');
  const MAX_TEXTO = 6000;
  const PRAZO_PRONTO = 12000;
  const PRAZO_ACK = 3000;
  const MAX_ENVIOS = 3;
  const BLOCOS = 'p,li,h1,h2,h3,h4,h5,h6,figcaption,blockquote,td,summary';
  const CAMPOS = 'input,select,textarea,[contenteditable],[role="textbox"],[role="searchbox"],[role="combobox"],[role="spinbutton"]';
  const INTERACTIVO = `${CAMPOS},a[href],button,summary,label,audio,video,[tabindex],[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="slider"],[role="menuitem"],[role="tab"],[role="listbox"],[role="option"]`;
  const IGNORAR_TEXTO = `${CAMPOS},script,style,noscript,template,[hidden],[inert],[aria-hidden="true"],#pamosii-signer-host`;

  const estado = { aberto: false, aponta: false, pronto: false, falhaPronto: false, espera: null, alvo: null };
  let host, sombra, painel, caixote, botao, iframe;
  let prazoPronto = null, prazoAck = null, sequencia = 0;
  const sessao = Date.now().toString(36);

  /* ---------- 1. o painel (shadow DOM fechado: isolamento de estilos, não segurança) ---------- */
  function montar() {
    host = document.createElement('div');
    host.id = 'pamosii-signer-host';
    sombra = host.attachShadow({ mode: 'closed' });
    sombra.innerHTML = `
<style>
  :host{all:initial;position:fixed;z-index:2147483646;right:0;top:0;bottom:0;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  [hidden]{display:none!important}
  .col{display:flex;flex-direction:column;align-items:flex-end;gap:10px;padding:12px 12px calc(12px + env(safe-area-inset-bottom));height:100%;box-sizing:border-box}
  .fab,.caixote{pointer-events:auto}
  .fab{display:inline-flex;flex:none;align-items:center;gap:9px;min-height:48px;padding:0 16px 0 12px;border:0;border-radius:999px;
    background:#2155a3;color:#fff;font:inherit;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 8px 26px rgba(18,53,106,.22)}
  .fab:hover{background:#12356a}
  .fab img{width:36px;height:36px;flex:none;border-radius:50%;object-fit:contain}
  .fab[aria-expanded="true"]{background:#eef4fc;color:#12356a;box-shadow:0 0 0 1px #2155a3,0 8px 26px rgba(18,53,106,.18)}
  .caixote{display:none;flex:1 1 auto;width:min(430px,calc(100vw - 24px));min-height:0;max-height:760px;flex-direction:column;
    background:#fff;border:1px solid #d4e1f4;border-radius:16px;box-shadow:0 18px 54px rgba(18,53,106,.24);overflow:auto;overscroll-behavior:contain}
  .caixote.on{display:flex}
  .barra{display:flex;flex:none;flex-wrap:wrap;gap:7px;padding:10px 12px;background:#fff;color:#12356a;border-bottom:1px solid #d4e1f4}
  .barra strong{flex:1 1 100%;font-size:13.5px;font-weight:700;letter-spacing:.2px}
  .btn{min-height:44px;padding:0 13px;border-radius:11px;border:1.5px solid #2155a3;
    background:#fff;color:#2155a3;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
  .btn:hover{background:#eef4fc;color:#12356a}
  .btn[aria-pressed="true"]{background:#2155a3;border-color:#2155a3;color:#fff}
  .btn.x{margin-left:auto;min-width:44px}
  button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #2155a3;outline-offset:2px}
  .status,.nota,.privacidade{flex:none;background:#eef4fc;color:#12356a;font-size:12px;line-height:1.4}
  .recado,.nota{margin:0;padding:6px 12px}
  .privacidade{padding:0 12px 6px}
  .privacidade summary{width:fit-content;min-height:24px;cursor:pointer;font-weight:700}
  .privacidade p{margin:4px 0}
  .ajuda{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:0 12px 9px}
  .ajuda a{display:inline-flex;align-items:center;min-height:44px;color:#2155a3}
  .leito{flex:1 0 240px;min-height:240px;position:relative;background:#fff}
  iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#fff}
  @media (max-width:520px){
    :host{left:0;right:0;top:auto;bottom:0}
    .col{height:auto;padding:8px 8px calc(8px + env(safe-area-inset-bottom))}
    .caixote{flex:none;width:100%;height:min(78vh,620px);height:min(78dvh,620px);
      max-height:calc(100vh - 74px - env(safe-area-inset-bottom));max-height:calc(100dvh - 74px - env(safe-area-inset-bottom))}
  }
</style>
<div class="col">
  <button class="fab" type="button" aria-expanded="false" aria-controls="painel">
    <img src="${LOGO}" alt="" width="36" height="36">
    <span>Viva Surdo</span>
  </button>
  <div class="caixote" id="painel" role="region" aria-label="Viva Surdo — sinalizar texto">
    <div class="barra">
      <strong>Viva Surdo — texto escolhido por ti</strong>
      <button class="btn" type="button" id="aponta" aria-pressed="false">Sinalizar um texto</button>
      <button class="btn" type="button" id="selec">Sinalizar a selecção</button>
      <button class="btn x" type="button" id="fecha" aria-label="Fechar o painel Viva Surdo">×</button>
    </div>
    <div class="status" id="status" hidden>
      <p class="recado" id="recado" role="status" aria-live="polite"></p>
      <div class="ajuda" id="ajuda" hidden>
        <button class="btn" type="button" id="tenta">Tentar novamente</button>
        <a href="${WIDGET}" target="_blank" rel="noopener noreferrer">Abrir painel local</a>
      </div>
    </div>
    <p class="nota">Glosa de estudo <strong>por validar</strong>, não tradução. Usa Reproduzir para iniciar.</p>
    <details class="privacidade">
      <summary>Privacidade e acesso</summary>
      <p>O mesmo leitor web está incluído na extensão e renderiza localmente. Só o trecho que escolhes é passado ao painel, em memória; não é guardado nem enviado a servidores.</p>
      <p>Não lê campos de formulário, conteúdo editável ou texto oculto. A instalação pede acesso aos sites HTTP/HTTPS abrangidos.</p>
    </details>
    <div class="leito" id="leito"></div>
  </div>
</div>`;
    botao = sombra.querySelector('.fab');
    caixote = sombra.getElementById('painel');
    painel = sombra.getElementById('leito');

    botao.addEventListener('click', alternar);
    sombra.getElementById('fecha').addEventListener('click', fecharPainel);
    sombra.getElementById('aponta').addEventListener('click', () => { estado.aponta ? apontarDesligar() : apontarLigar(); });
    const selec = sombra.getElementById('selec');
    /* Evita perder a selecção ou esconder o foco num campo antes de a verificar. */
    selec.addEventListener('pointerdown', (ev) => { if (ev.button === 0) ev.preventDefault(); });
    selec.addEventListener('click', mandarSeleccao);
    sombra.getElementById('tenta').addEventListener('click', tentarNovamente);
    document.body.appendChild(host);
  }

  function abrirPainel() {
    estado.aberto = true;
    caixote.classList.add('on');
    botao.setAttribute('aria-expanded', 'true');
    if (!iframe) carregarIframe();
    else if (!estado.pronto) esperarPronto();
    else enviarPendente();
  }
  function fecharPainel() {
    estado.aberto = false;
    apontarDesligar();
    pararPrazos();
    caixote.classList.remove('on');
    botao.setAttribute('aria-expanded', 'false');
    if (document.activeElement === host) botao.focus({ preventScroll: true });
  }
  function alternar() {
    estado.aberto ? fecharPainel() : abrirPainel();
  }

  function pararPrazos() {
    clearTimeout(prazoPronto);
    clearTimeout(prazoAck);
    prazoPronto = prazoAck = null;
  }

  function esperarPronto() {
    if (!estado.aberto || estado.pronto || estado.falhaPronto || prazoPronto !== null) return;
    aviso('A carregar o painel local. O texto escolhido aguarda que o painel esteja pronto.');
    prazoPronto = setTimeout(() => {
      prazoPronto = null;
      estado.falhaPronto = true;
      aviso('O painel local não ficou pronto. Verifica o pacote da extensão ou se o site bloqueia a incorporação. A última escolha continua pendente; tenta novamente.', true);
    }, PRAZO_PRONTO);
  }

  function carregarIframe() {
    pararPrazos();
    estado.pronto = false;
    estado.falhaPronto = false;
    if (iframe) iframe.remove();
    iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Viva Surdo — glosa de estudo por validar');
    iframe.setAttribute('src', WIDGET);
    iframe.setAttribute('allow', 'fullscreen');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    painel.appendChild(iframe);
    esperarPronto();
  }

  /* ---------- 2. texto em memória: a última escolha substitui a anterior ---------- */
  function mandar(texto) {
    const limpo = String(texto || '').replace(/\u0000/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXTO);
    if (limpo.length < 2) { aviso('Não havia texto suficiente nesse ponto.'); return; }
    clearTimeout(prazoAck);
    prazoAck = null;
    estado.espera = { id: `signer-${sessao}-${++sequencia}`, texto: limpo, tentativas: 0, aguardaAck: false, falhou: false };
    abrirPainel();
    if (estado.falhaPronto) aviso('O painel não está pronto. A última escolha continua pendente; tenta novamente.', true);
  }

  function vigiarAck(pendente) {
    if (!estado.aberto || prazoAck !== null) return;
    prazoAck = setTimeout(() => {
      prazoAck = null;
      if (estado.espera !== pendente) return;
      pendente.aguardaAck = false;
      if (pendente.tentativas < MAX_ENVIOS) enviarPendente();
      else falharEnvio(pendente, 'O painel não confirmou o texto após três tentativas. A última escolha continua pendente; tenta novamente.');
    }, PRAZO_ACK);
  }

  function falharEnvio(pendente, texto) {
    pendente.aguardaAck = false;
    pendente.falhou = true;
    aviso(texto, true);
  }

  function enviarPendente() {
    const pendente = estado.espera;
    if (!estado.aberto || !estado.pronto || !pendente || pendente.falhou) return;
    if (pendente.aguardaAck) { vigiarAck(pendente); return; }
    if (pendente.tentativas >= MAX_ENVIOS) return;
    pendente.tentativas++;
    pendente.aguardaAck = true;
    aviso('A aguardar confirmação do texto pelo painel.');
    try {
      iframe.contentWindow.postMessage({ tipo: 'pamosii-sinalizar', id: pendente.id, texto: pendente.texto }, DESTINO);
    } catch (_) {
      /* Conta também falhas de envio; o prazo permite apenas MAX_ENVIOS tentativas. */
    }
    if (estado.espera === pendente && pendente.aguardaAck) vigiarAck(pendente);
  }

  function tentarNovamente() {
    if (estado.espera) {
      estado.espera.tentativas = 0;
      estado.espera.aguardaAck = false;
      estado.espera.falhou = false;
    }
    /* Recria o iframe também após falta de ack; pode ter navegado ou perdido o receptor. */
    carregarIframe();
  }

  function mandarSeleccao() {
    const t = textoDaSeleccao().trim();
    if (!t) { aviso('Marca texto da página, fora dos campos de formulário, e carrega em “Sinalizar a selecção”.'); return; }
    apontarDesligar();
    mandar(t);
  }

  function aviso(texto, repetir = false) {
    if (!sombra) return;
    sombra.getElementById('status').hidden = false;
    sombra.getElementById('recado').textContent = texto;
    sombra.getElementById('ajuda').hidden = !repetir;
  }

  window.addEventListener('message', (ev) => {
    if (!iframe || ev.source !== iframe.contentWindow || ev.origin !== ORIGEM) return;
    const dados = ev.data;
    if (!dados || typeof dados !== 'object') return;
    if (dados.tipo === 'pamosii-signer-pronto') {
      if (estado.pronto) return;
      estado.pronto = true;
      estado.falhaPronto = false;
      clearTimeout(prazoPronto);
      prazoPronto = null;
      if (!estado.aponta) aviso('Painel pronto. Escolhe um texto; depois usa Play no painel.');
      enviarPendente();
      return;
    }
    const pendente = estado.espera;
    if (dados.tipo !== 'pamosii-signer-recebido' || !pendente || dados.id !== pendente.id
        || pendente.tentativas === 0 || typeof dados.ok !== 'boolean') return;
    clearTimeout(prazoAck);
    prazoAck = null;
    if (!dados.ok) {
      falharEnvio(pendente, 'O painel recusou o texto. A última escolha continua pendente; tenta novamente ou escolhe outro trecho.');
      return;
    }
    /* Só a confirmação positiva com o mesmo id liberta o texto; nunca o mostramos no recado. */
    estado.espera = null;
    aviso('Texto recebido. O rig está em pausa: escolhe Play no painel para iniciar.');
  });

  /* ---------- 3. leitura apenas de texto público, visível e escolhido ---------- */
  function elementoDe(no) {
    return no && (no.nodeType === Node.ELEMENT_NODE ? no : no.parentElement);
  }

  function campoEmFoco() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return document.designMode === 'on' || !!(el && (el.isContentEditable || el.closest(CAMPOS)));
  }

  function textoIgnorado(no) {
    let el = elementoDe(no);
    if (!el || el.closest(IGNORAR_TEXTO) || el.isContentEditable || document.designMode === 'on') return true;
    /* Também exclui conteúdo oculto por CSS, inclusive em antepassados do bloco. */
    for (; el; el = el.parentElement) {
      const css = getComputedStyle(el);
      if (css.display === 'none' || css.visibility === 'hidden' || css.visibility === 'collapse'
          || css.contentVisibility === 'hidden' || css.opacity === '0') return true;
    }
    return false;
  }

  function textoDoBloco(el, intervalo = null) {
    const partes = [];
    let s = '';
    if (!el || textoIgnorado(el)) return { s, partes };
    const aceitar = (no) => !textoIgnorado(no) && (!intervalo || intervalo.intersectsNode(no));
    const juntar = (no) => {
      if (no.nodeType === Node.TEXT_NODE) {
        const inicio = intervalo && no === intervalo.startContainer ? intervalo.startOffset : 0;
        const fim = intervalo && no === intervalo.endContainer ? intervalo.endOffset : no.length;
        const t = no.nodeValue.slice(inicio, fim);
        if (t) { partes.push({ no, len: t.length }); s += t; }
      } else if (no.nodeName === 'BR' || (s && no.matches(BLOCOS))) {
        partes.push({ no: null, len: 1 }); s += '\n';
      }
    };
    /* FILTER_REJECT poda campos/zonas privadas inteiras, não apenas o primeiro nó. */
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: no => aceitar(no) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    if (aceitar(el)) juntar(el);
    let n;
    while ((n = w.nextNode())) juntar(n);
    return { s, partes };
  }

  function textoDaSeleccao() {
    if (campoEmFoco()) return '';
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return '';
    const trechos = [];
    for (let i = 0; i < sel.rangeCount; i++) {
      const r = sel.getRangeAt(i);
      trechos.push(textoDoBloco(r.commonAncestorContainer, r).s);
    }
    return trechos.join('\n');
  }

  /* ---------- 4. modo apontar na página da pessoa ---------- */
  function blocoElegivel(el) {
    return !!el && !el.closest(INTERACTIVO) && !textoIgnorado(el)
      && textoDoBloco(el).s.trim().length > 2
      && !Array.from(el.querySelectorAll(BLOCOS)).some(filho => !filho.closest(INTERACTIVO)
        && !textoIgnorado(filho) && textoDoBloco(filho).s.trim().length > 2);
  }

  function blocosPagina() {
    return Array.from(document.querySelectorAll(BLOCOS)).filter(blocoElegivel);
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
    const marcada = textoDaSeleccao().trim();
    const dentro = sel && sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer);
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
    if (!Number.isFinite(x) || !Number.isFinite(y)) return s;
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
    const origem = elementoDe(e.target);
    const el = origem && !origem.closest(INTERACTIVO) && !textoIgnorado(origem) && origem.closest(BLOCOS);
    marcar(blocoElegivel(el) ? el : null);
  }

  function onClick(e) {
    if (!estado.aponta || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const origem = elementoDe(e.target);
    /* Não cancela cliques nem a propagação: links, botões e acções do site mantêm-se. */
    if (!origem || origem.closest(INTERACTIVO) || textoIgnorado(origem)) return;
    const el = origem.closest(BLOCOS);
    if (!blocoElegivel(el)) { aviso('Aí não havia texto. Carrega em cima de uma frase ou parágrafo.'); return; }
    const t = trechoApontado(el, e.clientX, e.clientY);
    apontarDesligar();
    mandar(t);
  }

  function onTecla(e) {
    if (!estado.aponta || e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const origem = elementoDe(e.target);
    /* Não rouba setas, Enter ou Escape de formulários, controlos ou do próprio painel. */
    if (campoEmFoco() || !origem || origem.closest(INTERACTIVO) || textoIgnorado(origem)) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); apontarDesligar(); return; }
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
    const lista = blocosPagina();
    if (!lista.length) { marcar(null); return; }
    if (e.key !== 'Enter') {
      e.preventDefault(); e.stopPropagation();
      const passo = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      const actual = lista.indexOf(estado.alvo);
      const prox = Math.max(0, Math.min(lista.length - 1, (actual < 0 ? 0 : actual + passo)));
      marcar(lista[prox]);
      return;
    }
    if (lista.includes(estado.alvo)) {
      e.preventDefault(); e.stopPropagation();
      const t = trechoApontado(estado.alvo);
      apontarDesligar();
      mandar(t);
    } else marcar(null);
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
