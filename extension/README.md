# Agatha Signer — extensão Chrome (Manifest V3)

Põe o painel de sinais do Pamosii em **qualquer site**. Ao carregar no ícone, abre do
lado direito do ecrã o mesmo painel do site, e a pessoa escolhe o texto de duas formas:

- **Apontar a um texto** — carrega numa frase ou parágrafo da página e só esse trecho é
  sinalizado;
- **Sinalizar a selecção** — marca primeiro o texto, depois carrega no botão.

Com o teclado, em modo apontar: `←` `→` percorrem os textos da página, `Enter` sinaliza
o que está marcado, `Esc` sai do modo.

## O que a extensão é — e o que não é

O painel mostra uma **glosa de estudo**: procura as palavras no glossário do Pamosii e
apresenta os sinais por ordem. **Não é tradução automática** de português para Língua
Gestual Angolana, e o glossário está **A validar** pela comunidade surda angolana. A
forma correcta de cada sinal está nos vídeos das aulas, não aqui.

A extensão **não tem reconhecimento de imagem nem de voz**. Só trabalha com texto já
escrito.

## Privacidade

`manifest.json` **não declara uma única permissão**: sem `storage`, sem `tabs`, sem
`host_permissions`, sem `<all_urls>`.

- O `background.js` limita-se a dizer «abre/fecha» quando a pessoa carrega no ícone.
- O `content.js` não lê o DOM da página para lado nenhum. O único texto que sai do
  script é o trecho que **a pessoa escolheu**, entregue por `postMessage` ao iframe do
  Pamosii.
- O iframe **não tem servidores**: todo o glossário vive dentro de `app.js` do site.
- Não há analítica, não há contas, não há cookie de identificação.

O painel é este site carregado dentro de um iframe (`?emb=1`, modo sem navegação). Por
isso a extensão **precisa de ligação à internet** — a primeira vez, e sempre que o
service worker do site não tiver a página em cache. Se o painel não responder em 9
segundos, a própria extensão diz isso e sugere abrir o site numa janela.

## Instalar (modo programador)

1. Copia esta pasta (`extension/`) para o teu computador.
2. No Chrome, abre `chrome://extensions`.
3. Liga o **Modo de programador** (canto superior direito).
4. Carrega em **Carregar sem compactar** e escolhe a pasta `extension/`.
5. Carrega no ícone **Agatha** na barra do Chrome, em qualquer site.

Para compactar num `.zip` distribuível: comprime o **conteúdo** desta pasta (não a pasta
mãe), de forma que `manifest.json` fique na raiz do zip.

## Mudar de alojamento

O painel aponta para o site publicado. Para mudar de URL:

1. `SITE` em `content.js` (usado também no `WIDGET`, no `postMessage` e na verificação
   de origem);
2. `exclude_matches` em `manifest.json` (para não montar dois painéis dentro do próprio
   site);
3. `homepage_url` em `manifest.json`.

O site tem de continuar a **não enviar `X-Frame-Options` nem CSP `frame-ancestors`**,
senão o iframe não carrega. GitHub Pages não envia nenhum dos dois.

## Ficheiros

| Ficheiro | Para que serve |
| --- | --- |
| `manifest.json` | MV3, sem permissões, injeta `content.js` + `signer.css` |
| `background.js` | service worker: ícone → mensagem para a aba |
| `content.js` | botão flutuante, painel em iframe, modo apontar, envio do trecho |
| `signer.css` | apenas o cursor de mira e o anel do texto marcado na página |
| `icon-192.png`, `icon-512.png` | ícone da barra e da página de gestão (marca provisória, ver README do projecto) |

## Limites conhecidos

- Sites com `Content-Security-Policy` restritiva podem bloquear o iframe; a extensão
  mostra o aviso e não finge que funciona.
- PDFs, `chrome://`, a Web Store e a página de nova separador não recebem content
  script — o Chrome não permite.
- Em páginas virtualizadas (o texto só existe ao rolar) o modo apontar só vê o que está
  montado no DOM naquele momento.
- O texto é limitado a 6 000 caracteres por mensagem.
