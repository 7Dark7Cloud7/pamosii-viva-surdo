# Pamosii Viva Surdo — site público

Site público da **Pamosii Viva Surdo**, iniciativa angolana dedicada à inclusão económica e social, à educação e à acessibilidade das pessoas surdas. **Viva Surdo** é a iniciativa cujos canais oficiais e aulas estão publicados aqui; **Pamosii** é a plataforma — e dá nome também à ferramenta de comunicação entre português e Língua Gestual Angolana (`#/pamosii`).

> **Aprender, ensinar e comunicar em Língua Gestual Angolana (LGA).**

Aplicação de página única em **JavaScript puro (sem framework, sem build)** — mantém a stack do projecto original (HTML + CSS + JS servidos como ficheiros estáticos). Não existe backend: todo o conteúdo real está no ficheiro `app/app.js` e os vídeos são do canal oficial no YouTube.

---

## Como executar

Não é preciso instalar nada. Basta servir a pasta `app/` como ficheiros estáticos:

```bash
# opção 1 — servidor do próprio projecto (URL estável usado nos testes: http://127.0.0.1:8123)
node tools/serve.cjs

# opção 2 — Python
cd app && python -m http.server 8080

# opção 3 — Node
npx http-server app -p 8080
```

Abrir <http://127.0.0.1:8123> (ou a porta escolhida). (Abrir o `index.html` directamente em `file://` também funciona, mas um servidor local é o cenário de teste recomendado — é também o que o módulo de câmara do Pamosii precisa: `getUserMedia` só funciona em contexto seguro.)

O motor de glosa do Pamosii é JavaScript puro, sem dependências, por isso testa-se fora do browser:

```bash
node tools/engine-test.cjs app/app.js   # corre as frases de exemplo e mostra glosa, cobertura, marcadores e alfabeto manual
```

O script corta as partes puras de `app.js` (glossário + motor) e executa-as em Node com `LGA_AULAS` simulado. Serve para ver o que o motor devolve por frase, para vigiar falsos positivos da regra de verbos regulares (a lista no fim da saída) e para confirmar que nenhuma palavra sem sinal é inventada. Não substitui a revisão humana do conteúdo — valida o mecanismo, não a LGA.

Na mesma rede Wi-Fi o servidor fica acessível no telemóvel em `http://192.168.8.18:8123` (o `tools/serve.cjs` escuta em todas as interfaces). Atenção: em `http://192.168.x.x` o browser **não** instala o service worker (só `https://` ou `127.0.0.1`), por isso o modo aplicação/sem rede só se pode confirmar no URL publicado ou em `127.0.0.1`.

---

## Publicação — onde está ao vivo

**URL público:** <https://7dark7cloud7.github.io/pamosii-viva-surdo/> (GitHub Pages, `https`, repo `7Dark7Cloud7/pamosii-viva-surdo`).

O que serve o site é a **branch `gh-pages`**, com os ficheiros na raiz (é o conteúdo de `app/`, copiado sem qualquer transformação). A branch `main` guarda o código com o `README` e não é publicada.

Verificado no URL ao vivo (2026-10-20):

| Verificação | Resultado |
| --- | --- |
| 10 ficheiros de `dist/` vs. servidos | **byte a byte iguais** (SHA-256), PNGs incluídos |
| `Content-Type` de `sw.js` | `application/javascript; charset=utf-8` |
| `Content-Type` de `manifest.webmanifest` | `application/manifest+json; charset=utf-8` |
| Service worker | instalado e a controlar; scope `…/pamosii-viva-surdo/` |
| Casulo sem rede | 10 entradas, 183.705 B; o pedido de navegação (`/pamosii-viva-surdo/`) **existe no cache** e devolve `text/html` |
| 10 rotas a 390×844 (mobile, DPR 2) | texto 1.575–5.325 caracteres, `overflow-x = 0`, barra inferior 65px, menor alvo de toque 64px |
| Quatro direcções de tradução | texto→sinais (4 blocos, 17 glifos, "3 frases analisadas · 4 de 7 elementos com sinal"), sinais→texto ("Olá bom dia boa tarde."), sinais→voz (`speechSynthesis` activo), voz→sinais (API de reconhecimento disponível; ditado exige microfone real) |
| Consola | nenhuma mensagem |

Limites honestos: a emulação "Offline" do DevTools **não bloqueia pedidos neste ambiente** (`navigator.onLine` fica `true` e os JPEGs do YouTube continuam a carregar), portanto a queda para o cache sem rede foi comprovada (a) matando o servidor local com o mesmo `sw.js` e (b) lendo as entradas do cache no host ao vivo — não por emulação. O reconhecimento de gestos continua inexistente: depende do corpus descrito em `docs/colheita-sinais-lga.md`.

### Actualizar o site publicado

```bash
cd .deploy-gh                     # clone de trabalho ligado ao repo
git checkout gh-pages
rm -rf app.js styles.css index.html sw.js manifest.webmanifest assets
cp -r ../app/. .                  # .nojekyll permanece
git add -A && git commit -m "actualizar o site publicado"
git push origin gh-pages
```

Se o `?v=` em `index.html`/`sw.js` for alterado (nova versão), a primeira visita ainda usa o casulo antigo; a segunda já abre a nova. Nunca publicar a partir de `dist/` sem reconstruir o `dist/` a partir de `app/` — a cópia é literal, não é um build.

Caminhos tentados e fechados, para que a equipa não perca tempo: o alojamento **Qoder Sites** respondeu `sites_unavailable` em todas as chamadas (`prepare_site`, `get_publish_status`, `list_sites`) — nada foi criado; e **activar as Pages por API** falha com `403 Resource not accessible by integration` porque este repo corre as Actions com token apenas de leitura. A branch `gh-pages` foi o caminho que funcionou, sem pedir credenciais a ninguém. **Nenhuma palavra-passe ou token foi guardado neste projecto.**

---

## Estrutura

```
app/
├── index.html          # documento base (idioma pt-AO, fontes, metadados, manifest, skip-link)
├── styles.css          # identidade visual (tokens em :root)
├── app.js              # TODA a aplicação: conteúdo + router + vistas
├── manifest.webmanifest# modo aplicação: nome, ícones, atalhos, cor, ecrã independente
├── sw.js               # service worker: o que fica guardado para funcionar sem rede
└── assets/
    ├── logo-mark.svg   # ⚠️ MARCA PROVISÓRIA — substituir (ver abaixo)
    ├── icon-192.png    #       └─ os 3 PNGs são a mesma marca rasterizada
    ├── icon-512.png
    ├── icon-maskable-512.png
    └── pattern-angola.svg
tools/
├── parse-yt.cjs        # utilitário usado para extrair os dados reais da playlist
├── make-icons.cjs      # gera os PNGs do manifest a partir da marca (node tools/make-icons.cjs)
├── engine-test.cjs     # corre o motor de glosa do Pamosii em Node (node tools/engine-test.cjs)
└── serve.cjs           # servidor estático de teste (porta 8123)
docs/
└── colheita-sinais-lga.md   # protocolo de gravação/validação necessário para alguma vez
                             # haver reconhecimento de sinais (não é código; ver abaixo)
```

Fora do repositório de trabalho: `.deploy-gh/` é o clone ligado ao repo publicado (é daí que se faz o push descrito em "Actualizar o site publicado"), e `dist/` é uma cópia literal de `app/` usada para verificar os ficheiros publicados — nenhum dos dois é um build nem precisa de ser editado.

### Rotas

| Rota              | Página                        | Conteúdo |
|-------------------|-------------------------------|----------|
| `#/`              | Início                        | Herói, 3 percursos por público, destaque real, "Como funciona", canais oficiais |
| `#/cursos`        | Catálogo                      | Pesquisa + filtro por categoria; apenas cursos reais; categorias "em preparação" com estado honesto |
| `#/cursos/:slug`  | Detalhe de curso              | `mini-curso-lga` (17 aulas reais por tema, `<details>` nativo), detalhes laterais, notas honestas sobre inscrição/certificado |
| `#/aprender-lga`  | Aprender LGA                  | As 17 aulas organizadas por tema, com navegação por âncoras |
| `#/dicionario`    | Dicionário LGA                | Glossário pesquisável português → tema → aula onde o sinal é ensinado; estado de validação em cada entrada |
| `#/pamosii`       | Pamosii (português ↔ LGA)     | As quatro direcções em atalhos + frases de exemplo; glosa de uma ou várias frases com vídeo e glifo animado por sinal, barra de cobertura e alfabeto manual para o que não tem sinal; ditado por voz; construção de sequência de sinais → frase escrita e falada; módulo de câmara para gravar e rever o próprio sinal |
| `#/professores`   | Recursos para professores     | Aulas de referência (real) + recursos "Em breve" |
| `#/biblioteca`    | Biblioteca                    | Pesquisável; itens reais (vídeos) + itens planeados "Em breve" |
| `#/sobre`         | Sobre                         | Missão, modelo (fontes públicas), reconhecimento com atribuição de fonte, valores |
| `#/contacto`      | Contacto                      | Apenas canais verificados: Facebook, Instagram, YouTube + playlist |

A rota antiga `#/catalogo` redirecciona para `#/cursos`.

---

## Onde editar o conteúdo

Tudo está no topo de `app/app.js`, em blocos numerados e comentados:

1. **`CONTATOS`** — canais oficiais verificados. **Não adicionar** telefone/e-mail sem confirmação da equipa.
2. **`LGA_AULAS`** — aulas do mini-curso (ID do YouTube, tema, título, data). É a única fonte de conteúdo de curso.
3. **`CURSOS`** — catálogo. Copiar o formato de `mini-curso-lga` para adicionar um curso real. Não inventar preços nem durações.
4. **`CATEGORIAS`** — categorias do catálogo (`'com-conteudo'` ou `'em-breve'`).
5. **`BIB_EM_BREVE`** — itens planeados da biblioteca.
6. **`FONTES_PUBLICAS`** — fontes citadas na página Sobre (contexto editorial; a UNICEF é citada como fonte de notícia, nunca como operadora/patrocinadora).
7. **`GLOSSARIO`** + **`ESTADO_GLOSSARIO`** — o dicionário (13 temas, 203 palavras). Ver "Dicionário LGA" abaixo.
8. **`A11Y_*`** — preferências de acessibilidade do painel fixo (guardadas em `localStorage`, chave `vs.a11y`).
9. **`PAMOSSI_TIPOS`**, **`PAMOSSI_MAPA`**, **`PM_MARCAS`**, **`PM_MOVIMENTO`** — o motor e as ilustrações do Pamosii. O vocabulário **não** está duplicado aqui: o Pamosii usa o `GLOSSARIO` e as `LGA_AULAS` que já existem. Ver "Pamosii" abaixo.

Os textos institucionais (missão, valores, herói) estão nas vistas `on('/...')` do mesmo ficheiro.

### Como adicionar um vídeo de LGA

1. Confirmar que o vídeo está no canal oficial da Viva Surdo e autorizado pela equipa.
2. Adicionar a `LGA_AULAS`: `{ id: 'ID_DO_YOUTUBE', ordem: N, tema: 'Tema', titulo: 'Título', data: 'AAAA-MM-DD' }`.
3. Se for um tema novo, acrescentar a `TEMAS` (nome + ícone existente em `I`).
4. O vídeo aparece automaticamente em Aprender LGA, na página do curso e na Biblioteca.

Os vídeos usam o modo `youtube-nocookie` e **só carregam o leitor depois de o utilizador clicar** (boa performance em ligações lentas; nunca há reprodução automática sem acção do utilizador).

---

## Dicionário LGA ↔ português (`#/dicionario`)

**O que é hoje (e funciona):** um glossário real de 13 temas e 203 palavras.

- **Português → LGA:** o utilizador escreve uma palavra (a pesquisa ignora acentos e maiúsculas, e também aceita nomes de tema, ex.: "num") e recebe as palavras correspondentes com o tema, o estado de validação e o botão **"Ver o sinal em uso"**, que carrega a aula oficial onde esse conjunto de sinais é ensinado.
- **LGA → português:** o utilizador escolhe um tema e vê o vocabulário completo dessa aula.

**O que deliberadamente NÃO é:** um tradutor automático. Converter fala em LGA, ou gestos em português, exigiria tecnologia reconhecida e validada por pessoas suras utilizadoras de LGA — isso não existe neste site e não será simulado. A página diz isso ao utilizador logo no topo.

### Modelo de dados

```js
{ tema: 'Saudações', termos: [{ palavra: 'olá', estado: 'a-validar', sinal: null }] }
```

- `estado`: `'a-validar'` (associação palavra ↔ aula inferida do programa público do mini-curso) ou `'confirmado'` (revisto por pessoa sura utilizadora de LGA). O rótulo é visível em cada entrada — nunca há aparência de autoridade que ainda não existe.
- `sinal`: reservado para o ID do vídeo curto do sinal isolado. Enquanto for `null`, a entrada remete para a aula completa; quando existir um vídeo gravado e aprovado, passa a ser mostrado ao lado da palavra.

### Fluxo de validação (o que a equipa tem de fazer)

1. Revisar um tema de cada vez com uma pessoa sura utilizadora de LGA.
2. Para cada palavra correcta, mudar `estado: 'confirmado'` no bloco `GLOSSARIO` de `app/app.js`.
3. Para palavras incorrectas ou inexistentes, corrigir a lista ou remover a entrada (o site nunca apresenta "A validar" como facto).
4. Se houver vídeo do sinal isolado, preencher `sinal: 'ID_DO_YOUTUBE'` e ligá-lo na vista `on('/dicionario')`.

---

## Pamosii — português ↔ LGA (`#/pamosii`)

É a ferramenta que dá o nome ao projecto. Faz **glosa** (sequência de sinais), não tradução automática — e diz isso ao utilizador no topo da página.

### O que está implementado e funciona

| Painel | Como funciona (de verdade) |
|--------|----------------------------|
| **Português → LGA** | O texto é dividido em frases (`[.!?…]`), tokenizado por caracteres Unicode (acentos, apóstrofos, hyphens e números preservados) e analisado por ordem: primeiro a **expressão** mais longa que o glossário conhece (`bom dia`, `onde fica?`, `por favor`, `quanto custa?`, `chamo-me…`, `casa de banho` — um só sinal para várias palavras), depois a **palavra** exacta, depois o **plural** (`-s`), depois o **lema** (`quero → querer`, `escreve → escrever`) e, para verbos regulares que estão no glossário, a raiz + infinitivo (`compra → comprar`, `trabalha → trabalhar`, `preciso → precisar`). Só quando nada disto existe é que a palavra vai para **alfabeto manual**, e o cartão diz que são letras, não um sinal. Nomes próprios com maiúscula no meio da frase vão sempre em datilologia. As palavras pequenas (`a`, `de`, `eu`, `meu`, `se`) são **omitidas** com a razão escrita, e os **marcadores** que a LGA pede no lugar delas (apontar, espaço, expressão facial) aparecem como itens próprios; o `?` acrescenta o marcador de pergunta (sobrancelas + cabeça). Cada frase mostra a **glosa**, uma **barra de cobertura** ("5/9 com sinal · 56% do glossário"), os cartões numerados por ordem e a nota honesta. |
| **As quatro direcções** | Quatro atalhos no topo do painel — Texto → Sinais, Voz → Sinais, Sinais → Texto, Sinais → Voz — abrem o painel certo e põem o foco no controlo onde a pessoa actua. São mesmo os quatro caminhos, cada um com o seu motor real: digitação/ditado para sinais, e escolha de sinais para texto escrito e `speechSynthesis`. |
| **Frases de exemplo** | Cinco frases prontas (saudação com nome próprio, pergunta na rua, sala de aula, mercado, família/escola) que preenchem o campo e correm a análise no clique. É a forma de ver o mecanismo a funcionar sem ter de inventar texto. |
| **Soletrar (datilologia)** | Modo para nomes próprios: cada letra vira o grafema do alfabeto manual, com o `<text>` do glifo a mostrar **a letra certa** e a aula do Abecedário por baixo. |
| **Ditar por voz → LGA** | `SpeechRecognition` do browser, em `pt-PT`. O ditado escreve no mesmo campo de texto e relança a glosa. Se o browser não tiver o serviço, o painel mostra essa limitação e sugere o ditado por teclado do telemóvel; os erros (`not-allowed`, `no-speech`, `network`…) têm mensagem própria em português. |
| **LGA → português (voz e escrita)** | O utilizador escolhe um tema e carrega nos sinais por ordem; a sequência pode ser reordenada (◀ ▶), removida e ouvida em voz alta (`speechSynthesis`, voz `pt-PT` → `pt-BR` → qualquer `pt`) ou copiada. É o caminho inverso feito **pela escolha da pessoa**, não por reconhecimento de gestos. |
| **Gravar e rever o próprio sinal** | `getUserMedia` (vídeo, sem áudio) + `MediaRecorder` com sonda de MIME (`vp9 → vp8 → webm → mp4`). Grava, reproduz para revisão com **velocidade 0,5× / 0,75× / 1×**, e captura quadros para PNG descarregável. A pré-visualização só acende a pedido; ao sair da rota as faixas são paradas e os objectos URL libertados. |

### O que o Pamosii deliberadamente NÃO faz

- **Não reconhece gestos.** Não existe tecnologia validada que leia Língua Gestual Angolana a partir da câmara, e o módulo de câmara é apresentado como ferramenta de gravação/revisão — nunca como análise.
- **Não produz frases gramaticais de LGA.** A glosa é uma ajuda de estudo; a ordem, o espaço e os marcadores faciais têm de ser confirmados por pessoas suras.
- **Não inventa sinais.** Palavra sem entrada no glossário aparece como "Ainda sem sinal no glossário" com convite para a equipa dizer qual é — nunca uma glosa fabricada.

### Privacidade (verificado)

Nada sai do navegador além do que o próprio browser envia: o reconhecimento de voz é o serviço do browser, a síntese de voz é local, e o `getUserMedia`/`MediaRecorder`/quadros ficam em memória do separador (`blob:`/`data:`), sem qualquer pedido de rede deste site. Não há formulários, não há contas, não há upload. O aviso está na página, junto ao módulo, incluindo "não graves terceiros sem consentimento".

### Como estender

1. **Mais vocabulário** → editar `GLOSSARIO` (o Pamosii passa a reconhecê-lo automaticamente; `PAMOSSI_INDICE` é derivado).
2. **Mais famílias de movimento** → acrescentar a `PM_MARCAS` (traços SVG com `class="pm-…"`) e mapear o tema em `PM_MOVIMENTO`; a animação entra em `styles.css` como `@keyframes pm-*` + `.pm-mov-*`.
3. **Funções gramaticais novas** → `PAMOSSI_TIPOS` (`acao: 'omitir' | 'marcador' | 'sinal'`) e as listas de palavras em `PAMOSSI_MAPA`.
4. **Vídeos do sinal isolado** → preencher `sinal` na entrada do glossário; os cartões passam a mostrar esse vídeo em vez do quadro da aula completa. Como gravar, com que metadados e com que consentimento está definido em [`docs/colheita-sinais-lga.md`](docs/colheita-sinais-lga.md).

---

## Painel de acessibilidade (fixo, em todas as páginas)

Botão **"Acessibilidade"** no canto inferior direito. Opções reais, sem promessas vazias:

| Opção | O que faz |
|-------|-----------|
| **Tamanho do texto** | 100% → 115% → 130% → 150% (`zoom` do documento; escala também o leitor de ecrã segue o mesmo texto) |
| **Contraste alto** | tokens CSS para preto/cinza puro sobre branco, bordas mais fortes, sublinhado sempre nos links |
| **Tema escuro** | tokens alternativos com contraste AA verificado (medido, não assumido) |
| **Movimento reduzido** | desliga animações/transições mesmo em sistemas sem `prefers-reduced-motion` |
| **Leitura simples** | coluna única, texto maior, ilustração decorativa escondida |
| **Ler esta página em voz alta** | usa a síntese de voz já instalada no browser (`speechSynthesis`), preferindo voz `pt-PT`, depois `pt-BR`, depois qualquer `pt`. Lê apenas o texto do `<main>`, frase a frase, e pára ao mudar de rota, com Escape ou no botão "Parar de ler". Se o browser não tiver síntese de voz, o painel diz isso e aponta para NVDA / TalkBack / VoiceOver. |

**Privacidade:** as escolhas vivem em `localStorage` sob a chave `vs.a11y` e são aplicadas por um script inline em `index.html` **antes do primeiro paint** (evita o "salto" de tema). Nada é enviado para servidor algum; o site continua sem formulários e sem recolha de dados pessoais.

---

## Modo aplicação: instalar e usar sem rede

O site é uma única página sem *build*, por isso o "modo app" é feito com duas peças nativas do browser — `manifest.webmanifest` e `sw.js` — e nenhum framework.

**Porquê que isto importa em Angola:** o glossário (203 palavras), as 17 aulas, o motor do Pamosii e os textos estão **dentro de `app.js`**. Guardar o `app.js` é ficar com o site completo. Medido: o "casulo" offline são **179 KiB** (10 ficheiros) e as páginas passam a abrir sem gastar dados outra vez — o único peso novo por visita é o HTML (3,4 KiB), quando há rede para actualizar.

| O que fica guardado | Estratégia | Porque |
|---------------------|------------|--------|
| `index.html` (navegações) | rede primeiro, casulo se falhar | a página tem de poder actualizar-se |
| `styles.css`, `app.js`, `manifest.webmanifest`, `logo-mark.svg`, `pattern-angola.svg`, 3 ícones PNG | casulo pré-guardado nas chaves **com o `?v=`**; depois rede e guardar | abrir logo e sem repetir descargas |
| Tipos Google (`fonts.googleapis.com`, `fonts.gstatic.com`) | servir da cache, renovar em segundo plano | o texto ampliado/temas dependem dos tipos; 81 KiB |
| Miniaturas dos vídeos já vistas (`i.ytimg.com`) | servir da cache, renovar em segundo plano; no máximo 120 entradas | as listas de aulas ficam legíveis offline |
| **Vídeos do YouTube** | **não são interceptados** | precisam de ligação; o site diz isso quando se carrega em Reproduzir sem rede |
| **Texto escrito, voz ditada, vídeos gravados pela pessoa** | nunca passam por aqui | o service worker só vê pedidos `GET`; as gravações do Pamosii vivem na memória do browser até sair da rota |

Sem ligação, carregado com o servidor de teste **desligado** (não é simulação: `taskkill` no processo e recarregar):

- As 10 rotas montam-se com conteúdo real (1.262 a 11.627 caracteres por página), barra inferior presente, `scroll horizontal = 0`, 0 alvos de toque < 44px.
- Glosa PT → sinais funciona: `Bom dia! Onde fica a escola? Eu quero água. Chamo-me Ana.` → "4 frases analisadas · 5 de 11 elementos com sinal no glossário".
- Sinais → português funciona: escolher 3 sinais dá `Olá bom dia boa tarde.`; a síntese de voz (`speechSynthesis`) é local, por isso também funciona sem rede.
- Carregar em "Reproduzir" sem rede não cria `iframe` e mostra o aviso com `role="status"`; ao voltar a ligação (`online`) o aviso desaparece e o mesmo botão cria o leitor.

**Publicar (o ponto que se esquece):** o `sw.js` tem `const VERSAO = 'vsNN'` **e** o `index.html` pede `styles.css?v=vsNN` / `app.js?v=vsNN`. Mudam-se os dois em cada publicação. Se mudares o conteúdo sem mudar o `?v=`, quem já tem o site guardado continua a ver a versão antiga. A primeira visita depois de publicar ainda usa o casulo antigo; a segunda já vem com o novo (o service worker troca-se a si próprio com `skipWaiting`).

**Limite honesto:** a instalabilidade real ("Adicionar ao ecrã principal") depende do browser da pessoa; neste ambiente verificou-se o que o Chrome pede para oferecer o app — manifest válido com `name`, `short_name`, `start_url`/`scope` dentro da origem, `display: standalone`, `theme_color`, ícones PNG 192/512 + `maskable` (os tamanhos declarados batem com os reais, medido), um `fetch` handler no service worker e contexto seguro (`https` ou `127.0.0.1`). O *prompt* em si e o iOS não foram observados aqui.

---

## Substituir a marca provisória

Não existe logótipo oficial no repositório, por isso o site usa:

- **Wordmark textual "Viva Surdo"** no cabeçalho/rodapé (estilizado em CSS — sem imagem);
- **Marca provisória** `app/assets/logo-mark.svg` (V estilizado + dois pontos = comunicação entre duas pessoas; **não representa nenhum sinal de LGA**);
- **Três PNG derivados** (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) para o manifest — o iOS e vários launchers Android ignoram SVG para o ícone da aplicação. O `maskable` tem a marca dentro da zona segura de 80% (medido: o pixel âmbar mais afastado do centro fica a 78% do raio útil), porque esses launchers recortam o ícone em círculo.

Para aplicar o logótipo aprovado, há duas rotas:

1. **Substituir o SVG** (`app/assets/logo-mark.svg`) e correr `node tools/make-icons.cjs` — o script volta a gerar os três PNG com o mesmo desenho (fundo sangrado na variante `maskable`, marca ajustada à zona segura). É rasterização, não criação: nenhuma forma nova é inventada pelo código.
2. **Receber os PNG do designer** e colocá-los em `app/assets/` com os mesmos nomes.

Ajustar, se necessário, o bloco `.brand` em `styles.css`. Nada mais precisa de mudar. Depois de trocar os ficheiros, publicar com `VERSAO` nova (ver "Modo aplicação"), senão o casulo offline continua a mostrar a marca velha.

---

## O que funciona de verdade vs. o que está deliberadamente pendente

### Implementado e funcional
- Navegação completa entre as 9 páginas do menu: no telemóvel os quatro destinos principais vivem numa **barra fixa no fundo do ecrã** (tipo app) e o 5.º botão, "Mais", abre o mesmo menu completo; em tablet/desktop a barra de topo com os 9 rótulos, ou o hambúrguer. Tudo operável por teclado.
- Catálogo com pesquisa e filtro, sem conteúdo fictício.
- Reprodução das 17 aulas reais de LGA (leitor YouTube carregado a pedido do utilizador).
- Biblioteca pesquisável com itens reais e planeados.
- **Dicionário português ↔ LGA** pesquisável, com estado de validação visível em cada entrada.
- **Pamosii** (`#/pamosii`): glosa de uma ou várias frases com vídeo real por sinal e glifos vectoriais animados, modo de datilologia, ditado por voz, sequência de sinais → frase escrita e falada, e módulo de câmara para gravar/rever/capturar. Ver secção própria.
- **Painel de acessibilidade** (tamanho de texto, contraste alto, tema escuro, movimento reduzido, leitura simples, leitura em voz alta) — ver secção acima.
- **Modo aplicação**: instalável ("Adicionar ao ecrã principal") e **a funcionar sem rede** — as 10 rotas, o dicionário, a glosa do Pamosii e a frase falada abrem com o servidor desligado (179 KiB de casulo; ver "Modo aplicação").
- Metadados por página (`title`, `description`, `og:*`).
- **Experiência de telemóvel tratada como app** (sem framework, sem build): **barra de navegação no fundo do ecrã até 720px** (Início · Aprender · Pamosii · Dicionário · Mais), com estado actual em âmbar e `aria-current`; o "Mais" controla o mesmo painel do hambúrguer (`aria-controls="nav-links"`), e por isso o hambúrguer do cabeçalho fica escondido no telemóvel — um interruptor, não dois. Gaveta de navegação em cartão (não uma faixa esticada) entre 721px e 1280px; filas de filtros em *scroll-snap* horizontal em vez de cinco linhas que empurram o conteúdo; pré-visualização da câmara a 3/4 em pé e 4/3 deitado; `viewport-fit=cover` com `env(safe-area-inset-*)` no cabeçalho fixo, no menu, no botão de acessibilidade e na barra inferior; `text-size-adjust:100%`, `touch-action:manipulation` e `-webkit-tap-highlight-color:transparent`; bloco próprio para ecrãs de pouca altura (`max-height:470px`); `preconnect`/`dns-prefetch` para `i.ytimg.com` e `youtube-nocookie.com`, e `decoding="async"` nas miniaturas.
- Acessibilidade de base: skip-link, HTML semântico, foco visível, `aria-current`, `<details>` nativo nos módulos, alvos de toque ≥44px (também os botões pequenos, a partir de 720px), `prefers-reduced-motion` e desligador manual de animação (os glifos param), ordem de títulos verificada, conteúdo duplicado do ponto de vista de quem ouve (cartões e sequência) marcado `data-no-read`, imagens decorativas `alt=""`.

### "Em breve" por decisão (estados honestos, sem simulação)
- **Contas e progresso** — não há backend nem autenticação; nenhum botão de registo é mostrado.
- **Inscrição formal em cursos** — o mini-curso é livre; a inscrição com progresso será anunciada quando existir.
- **Certificados** — nenhuma emissão nesta fase; dito explicitamente na página do curso.
- **Pagamentos** — nada de preços inventados; nenhum fluxo de pagamento existe.
- **Tradução automática fala ↔ LGA** — não existe tecnologia validada; o Pamosii faz glosa de estudo e o dicionário é glossário. Ambos o dizem ao utilizador.
- **Reconhecimento de gestos pela câmara** — o módulo grava e mostra o teu sinal; não analisa. Nenhum botão sugere que "a IA lê a tua mão". O caminho para algum dia analisar está definido em [`docs/colheita-sinais-lga.md`](docs/colheita-sinais-lga.md): é preciso corpus angolano anotado por pessoas surdas (não existe nenhum para LGA), e a primeira fase viável é a datilologia, a correr no dispositivo.
- **Sinal isolado por palavra** — só com vídeo gravado e aprovado (campo `sinal` já reservado nos dados; especificação de gravação no mesmo documento).
- **Aulas ao vivo, tutor IA, comunidade** — fora do MVP; nenhuns simulados.
- **Telefone/e-mail** — divulgados apenas quando confirmados pela equipa.

### Integrações pendentes (backend)
Não há chamadas de API no código. Quando existir backend, os pontos naturais de integração são: lista de cursos (substituir `CURSOS` por fetch), inscrições, progresso e autenticação. Até lá o site é 100% estático e não depende de nenhum serviço além do YouTube e das fontes Google.

---

## Verificações

```bash
node --check app/app.js     # sintaxe JS (sem build/lint configurados no projecto)
node --check app/sw.js      # idem para o service worker
node tools/make-icons.cjs   # regenera os PNG do manifest a partir da marca (sem dependências)
node tools/serve.cjs        # http://127.0.0.1:8123 — URL estável usado nestes testes
```

Teste manual recomendado: navegar por todas as rotas, abrir pelo menos um vídeo em cada página, pesquisar no catálogo/biblioteca/dicionário, escrever uma frase no Pamosii (e outra com "Soletrar letras"), gravar um clipe de 5s e rever a 0,5×, e percorrer o site apenas com o teclado (Tab/Enter/Escape no menu móvel, na barra inferior — incluir o "Mais" — e no painel de acessibilidade). Para o offline: abrir o site uma vez com rede, depois desligar a internet (ou desligar o servidor de teste) e recarregar — as páginas, o dicionário e o Pamosii devem responder, e um vídeo deve mostrar o aviso de "precisa de rede" em vez de um leitor em branco. Para a instalação: no Chrome de telemóvel, menu → "Adicionar ao ecrã principal"; o ícone e o nome vêm do `manifest.webmanifest`.

Verificado nesta entrega (medição no browser em `http://127.0.0.1:8123`; telemóvel 320px / 360px / 390px, tablet 1012px, e escala de texto do painel de acessibilidade a 100% / 130% / 150%):

- Consola sem erros nas 10 rotas (`#`, `/cursos`, `/cursos/mini-curso-lga`, `/aprender-lga`, `/dicionario`, `/pamosii`, `/professores`, `/biblioteca`, `/sobre`, `/contacto`) e na 404, depois de percorrer todas as rotas em três larguras e de encher cada ecrã de testes (glosa, soletração, cadeia LGA, voz, câmara).
- **Zero scroll horizontal**: 320px, 360px, 390px e 1012px × escala 100/130/150 × 10 rotas = 90 medições, todas com `scrollWidth − clientWidth = 0`.
- **Zero alvos de toque abaixo de 44px** nessas mesmas 90 combinações (a verificação ignora links dentro de texto corrido e inputs envolvidos por `<label>` clicável, que já são o alvo). Alvos corrigados por causa desta medição: `.brand` (31px → 44px), `.foot-brand` (36px → 44px) e os links do mapa do site no rodapé (32px → 44px).
- **Excepção "texto corrido" revista caso a caso, em vez de aceite cegamente:** o link "Início" do caminho de navegação (`/cursos/:slug`) media 35×16 — estava dentro de uma lista, não de uma frase, mas a exclusão genérica o engolia. Passou a 47×26 com `padding:5px 6px; margin:-5px -6px` (a margem devolve o espaço à linha: a linha do `.crumbs` continua com 22px e no mesmo sítio, medido). 26px cumpre o mínimo de 24px do WCAG 2.2 para alvos de toque; links *dentro de frases* continuam excluídos, como a própria norma permite.
- Contraste AA medido por luminância, nos quatro modos (claro, escuro, contraste alto, escuro + contraste alto): 0 falhas. Correcção feita por causa dessa medição: em contraste alto o âmbar passou a `#FFD666` — com o valor anterior (`#7A4E00`) os botões `.btn-a` ficavam a 2,92:1 com texto preto.
- Motor do Pamosii testado com `Bom dia! Onde fica a escola? Eu quero água. Chamo-me Ana.` → 4 frases, glosa correcta, 1 marcador de posse + 1 de pergunta, 2 palavras omitidas com justificação, "quero"/"Ana" assinaladas como por confirmar; `Chamo-me Ana e o Pedro é professor.` → 2 de 27 elementos com sinal sem soletrar, 27 com "Soletrar letras" (datilologia cartão a cartão); palavra fora do glossário ("zebra") → estatuto honesto `2 de 5 elementos com sinal no glossário`, nunca traduzida à força.
- Os quatro sentidos estão rotulados no próprio ecrã (`.pm-io`): *entra texto/voz → saem sinais*, *entra sinais escolhidos → sai texto escrito e voz*.
- LGA → português: escolha por tema, reordenar ("Mover … uma posição para a frente/trás"), remover ("Remover … da sequência"), limpar e frase em português reconstruída; síntese de voz a responder (`speechSynthesis.speaking = true`, `aria-pressed` a alternar).
- Câmara testada pelos três caminhos sem acender a câmara real: permissão negada (`NotAllowedError`) → "Deste permissão à câmara? Sem permissão não é possível gravar — o site não insiste nem guarda nada."; dispositivo ausente/occupied → "Não foi possível acender a câmara neste dispositivo/browser."; sem `mediaDevices` → os três botões ficam `disabled` na ligação. Em todos os estados o vídeo não ganha a classe `on` e os botões "Gravar"/"Capturar quadro" continuam bloqueados.
- Leitor de vídeo em fachada (só carrega o iframe do YouTube depois do clique, sempre sem autoplay e com `decoding="async"` na miniatura): testado nos cartões do Pamosii, do dicionário e da biblioteca, e nas listas de cursos, sem scroll horizontal em nenhuma largura.
- Animação dos glifos activa no estado normal e `animation-name: none` com "Movimento reduzido" ligado.
- Leitura em voz alta na página do Pamosii: 29 frases, inclui a glosa, ignora os glifos SVG e os cartões duplicados.

**Sem rede e instalável (medido em `http://127.0.0.1:8123` a 390×844: a bateria completa de 10 rotas com a escala de texto do painel a 150% — o caso mais apertado — e a verificação final da versão publicada a 100%):**

- A prova de offline foi feita **a desligar o servidor de teste** (`taskkill` no processo `node tools/serve.cjs`, confirmado com `curl` a devolver `000`) e a recarregar a página: as 10 rotas montaram-se com conteúdo real (1.262 a 11.627 caracteres), barra inferior em todas, `scroll horizontal = 0`, 0 alvos < 44px.
- Motores a funcionar sem ligação: glosa PT → sinais ("4 frases analisadas · 5 de 11 elementos com sinal no glossário") e sinais → PT (3 sinais escolhidos → `Olá bom dia boa tarde.`), com `speechSynthesis` disponível (é síntese local).
- Cache: `casulo-vsNN` com 10 entradas = **179 KiB**; `externo-vsNN` com os 2 tipos letra-a-letra (81 KiB) + miniaturas. As miniaturas são respostas **opacas** (cross-origin): o browser permite re-servi-las mas não dá a leitura do corpo — `arrayBuffer()` devolve 0 bytes, e é por isso que o tamanho delas não aparece na medição.
- Rotação de versão: ao publicar `vsNN` novo, o service worker antigo é substituído (`skipWaiting` + `clients.claim`) e `activate` **apaga as caches das versões anteriores** — verificado em duas subir de versão (vs33→vs34→vs35 e vs35→vs36): no fim só existiam as caches com o número corrente.
- Bug apanhado por esta medição (e corrigido): o *service worker velho* servia o `styles.css` novo a partir do cache antigo porque o `caches.match()` tinha `ignoreSearch: true` — quem carregava `?v=vs33` recebia o CSS do `vs32`. O `ignoreSearch` foi removido: a chave é exacta (com `?v=`) e o casulo pré-guarda já as chaves versionadas. Ficar sem fallback é o que torna a actualização previsível; o custo é que uma URL nova sem o ficheiro no casulo vai sempre à rede.
- Manifest validado no browser: `Content-Type: application/manifest+json`, todos os campos pedidos pelo Chrome presentes (`name`, `short_name`, `start_url`, `scope`, `display`, `icons`, `theme_color`, `background_color`, `lang`), `start_url` dentro da origem/escopo, os 3 ícones a responder 200 com `image/png` e o tamanho **declarado = tamanho real** (192/512/512), e os 2 atalhos (`Pamosii`, `Dicionário`) a responder 200. Ícone `maskable`: desenho medido dentro da zona segura (78% do raio útil).
- Aviso "este vídeo precisa de rede" (`role="status"`): 0 `iframe` criados, o botão de Reproduzir fica intacto para tentar de novo, e o `online` remove o aviso. Contraste do aviso nos quatro modos de tema: 12,3:1 (claro), 15,5:1 (escuro), 21:1 (contraste alto, claro e escuro).
- Consola limpa também com o servidor em baixo. Correcção feita por causa da consola: a `meta apple-mobile-web-app-capable` gerava aviso de *deprecated* no Chrome — passou a `mobile-web-app-capable`, mantendo o `apple-touch-icon` e o `apple-mobile-web-app-title` (iOS ≥ 16.4 usa o manifest).
- Limite desta verificação: não foi observado o *prompt* "Adicionar ao ecrã principal" nem o comportamento em iOS/Android reais — este ambiente só tem Chrome de desktop com janela até ~1024px. A instalabilidade foi confirmada pelos critérios que o Chrome exige, não pelo gesto do utilizador.

**Cabeçalho e navegação (reescrito nesta fase):**
- A barra tem 9 itens com rótulos compactos (13,5px) como estado base; medido no browser, `marca + 9 rótulos` precisa de **1052px** e a coluna de conteúdo (`.wrap`, máx. 1120px) dá sempre **1076px**. O menu hambúrguer assume a `max-width:1280px`, por isso acima disso a barra cabe numa linha com folga garantida.
- **O CTA do cabeçalho foi removido** (`Começar a aprender`): com 9 itens ele nunca coube nos 1076px — a 1321px–1580px a barra sairia do sítio ou partiria em duas linhas. O herói já tem `Começar a aprender LGA` para o mesmo destino, e o rodapé repete a navegação.
- Grelhas fluidas (`minmax(min(290px,100%),1fr)`), `min-width:0` nos filhos de grelha e `overflow-wrap:anywhere` nos títulos: eram pisos fixos em px que as media queries não vêem, e eram a causa do scroll horizontal com texto ampliado.
- Escala de texto aplicada a `#app`, não ao `<body>`: o painel de acessibilidade é `position:fixed` e vivia fora, senão o próprio painel saía do ecrã com texto grande. A escala é exposta como `--escala`, e as alturas em `vh` (gaveta do menu, pré-visualização da câmara) e os `env(safe-area-inset-*)` (menu, barra inferior) dividem por essa variável — `vh`/`dvh` e `env()` são pixels do ecrã e não sentem o zoom. O script inline do `<head>` já escreve `--escala` no `<html>` antes do primeiro *paint*, para o botão de acessibilidade e a barra inferior acertarem a geometria mesmo antes de o `app.js` montar o `#app` escalado.
- Gaveta do menu: uma coluna a 100%/130%/150% (o `flex-wrap` do modo barra transformava-a em três colunas com texto ampliado) e `overflow-y:auto` quando os 9 itens não cabem. A altura máxima **desconta o botão flutuante de acessibilidade**: medido a 810×560 com texto a 150%, o cartão terminava na dobra (682px) por cima do botão (494px) e a última linha, "Contacto", ficava inatingível ao toque; agora o fim do menu fica 6px acima do botão em qualquer largura.

**Barra inferior do telemóvel (nova nesta fase, medido a 320×568, 390×844, 844×390 deitado e 810×560 em tablet):**
- Aparece com `@media(max-width:720px), (orientation:landscape) and (max-height:500px)`: em pé é a largura que manda, deitado é a altura (844×390 já não é "largura de telemóvel", mas o polegar e a altura curta são o mesmo problema). As mesmas regras escondem o hambúrguer e descontam a barra na gaveta e no botão de acessibilidade, por isso a condição é partilhada. No tablet (721–1280px com altura normal) ficam o hambúrguer e o cartão alinhado com o conteúdo.
- É `position:sticky; bottom:0` dentro de `#app`, não `position:fixed`: a barra ocupa espaço no fluxo, por isso nunca tapa o rodapé nem exige reservar `padding-bottom` calculado — e continua colada ao fundo do ecrã durante toda a página (verificado a 0, a meio e no fim do scroll).
- Rótulos a `calc(11px / var(--escala,1))`, i.e. **tamanho físico constante**: com a escala a 150% cada item tem só 52px de layout (390 ÷ 1,5 ÷ 5) e "Aprender"/"Dicionário" iam a **3 linhas**. Agora: 1 linha, 11px físicos, em 100% e 150%. A barra é o cais da aplicação, não o conteúdo que a pessoa ampliou.
- Geometria: 390×844 a 150% → barra com 97px renderizados, itens 78×96; 320×568 a 100% → barra 65px, itens 64×64. Todos acima de 44px, `scroll horizontal = 0` nas 10 rotas a 100% e a 150%.
- Corrente de foco: o botão "Mais" vem **depois** do menu no DOM, por isso abrir o menu a partir dele move o foco para o primeiro item (senão o Tab saía do menu para o fim da página); Escape fecha e devolve o foco ao "Mais"; carregar num item fecha o menu e navega. O listener do Escape passou a ser substituído em cada render (antes acumulava um por mudança de rota).
- O painel de acessibilidade (fora de `#app`, não escalado) foi corrigido nas duas contas que a barra alterou: sobe `12px + 64px × escala` para não ficar por cima da barra, e o seu `max-height` desconta a barra — medido a 320×568, com a barra e sem o desconto, a primeira linha de opções ficava cortada no topo. (A sobreposição voltou quando estas duas regras foram movidas para o bloco da barra, mais acima no ficheiro: perdiam na cascata contra `.a11y{bottom:18px}`. Ficam logo depois das regras base, e a 844×390 o botão volta a terminar 11px acima da barra.)
- Contraste da barra nos quatro modos (texto medido sobre o fundo, com alfa misturado): inactivo 10,2:1 → 14,9:1, item activo (âmbar) 8,6:1 → 15,1:1. Em contraste alto só o item activo fica sublinhado.
- Em telemóvel: filas de chips com scroll horizontal e `scroll-snap`, cabeçalho de 58px, `env(safe-area-inset-*)` com `viewport-fit=cover`, câmara em 3/4 (vertical) e bloco próprio para telemóvel deitado (`max-height:470px`).
- Limite honesto desta verificação: a janela do browser deste ambiente não produziu mais de 1024px CSS, portanto a banda ">1280px" foi confirmada pela medição do comprimento intrínseco da barra, não por desenho real nesse tamanho.

---

## O que a equipa da Viva Surdo precisa fornecer antes de divulgar amplamente

O site **já está publicado** em <https://7dark7cloud7.github.io/pamosii-viva-surdo/> (ver "Publicação"), mas esse URL é **provisório**: pertence à conta GitHub de quem desenvolveu, não à Viva Surdo. Nada abaixo foi inventado para o preencher — os itens são literalmente o que falta.

1. **Logótipo oficial** (SVG preferencialmente) — substituir `app/assets/logo-mark.svg`.
2. **Texto institucional aprovado** para o Sobre (missão, modelo, valores) — hoje baseado apenas em fontes públicas.
3. **Responsáveis e canais de contacto definitivos** (telefone/e-mail, se aplicável) + política de privacidade, se algum formulário for adicionado.
4. **Cursos realmente disponíveis** (conteúdo, público, nível, formato, preço confirmado, condições de inscrição).
5. **Vídeos autorizados** — confirmação de que a playlist pública do mini-curso pode ser incorporada, e novos vídeos com direitos confirmados.
6. **Validação do dicionário** — rever as 203 palavras com pessoas suras utilizadoras de LGA e autorizar a mudança de `a-validar` para `confirmado` (ver "Fluxo de validação").
7. **Vídeos dos sinais isolados** (ou confirmação de que o dicionário continua a remeter para as aulas completas) — gravados segundo a especificação de [`docs/colheita-sinais-lga.md`](docs/colheita-sinais-lga.md) (§3): resolução, enquadramento, iluminação, fundo e formato sem re-encoding.
8. **Revisão das glosas do Pamosii** — confirmar com pessoas suras utilizadoras de LGA a ordem dos sinais, os marcadores não manuais ("omitir / marcador / sinal") e o modo "Soletrar letras"; hoje a glosa segue o vocabulário do glossário e é apresentada como apoio, nunca como gramática LGA.
9. **Autorização expressa sobre o microfone e a câmara** — o Pamosii usa `SpeechRecognition` e `getUserMedia` no dispositivo do utilizador. A equipa deve decidir se estes módulos ficam activos na versão pública, ficam atrás de uma opção, ou saem (ver "Notas de integridade editorial").
10. **Confirmação dos glifos animados** — os desenhos SVG representam *famílias de movimento* (mão + marca), não sinais certificados; validar com formadores de LGA ou substituir por fotografia/vídeo real do sinal.
11. **Decisão sobre transcrições/legendas** das aulas.
12. **Condições de certificados e inscrições** (ou confirmação de que ficam "Em breve").
13. **Lote de gravação de datilologia** — o único alvo honesto para reconhecimento na fase A: 26 letras × 3 sinalizadores × 3 repetições = 702 clipes, com duas condições de luz (§9 do mesmo documento; ~2 dias de gravação).
14. **Revisor surdo utilizador de LGA** — pessoa que valida cada sinal gravado e assina a revisão; nenhum vídeo é publicado sem duas aprovações (§6).
15. **Consentimentos assinados** — um por sinalizador, com os seis pontos mínimos de §5 (incluindo menores) e sem pagamento implícito; os nomes ficam fora do ficheiro de dados, que usa pseudónimos.

16. **Nome aprovado para a aplicação instalada** — hoje o manifest usa `Pamosii Viva Surdo — Língua Gestual Angolana` (nome completo) e `Pamosii` (atalho de ecrã); o nome curto é o que aparece debaixo do ícone no telemóvel.
17. **Logótipo oficial nos três formatos de ícone** (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) ou autorização para gerar a partir do SVG com `node tools/make-icons.cjs` — ver "Substituir a marca provisória".
18. **Domínio e alojamento da marca** — o alojamento actual (GitHub Pages, `https://7dark7cloud7.github.io/pamosii-viva-surdo/`) já cumpre os três requisitos técnicos que o `tools/serve.cjs` cumpre no local: `https` (obrigatório para o service worker, o microfone e a câmara), `sw.js` na raiz do site e `manifest.webmanifest` com `Content-Type: application/manifest+json` — os três verificados no URL ao vivo. O que falta é a decisão da equipa: um domínio próprio (por ex. `pamosii.ao` / `vivasurdo.ao`) apontado para o mesmo conteúdo estático, e a conta que o controla. Trocar de alojamento não muda uma linha de código; muda só o `CNAME`/DNS e onde se faz `git push`.
19. **Remover o tema de demonstração do glossário** — o último grupo do `GLOSSARIO` (`'Demonstração (sem vídeo)'`, 33 palavras: `mercado`, `autocarro`, `dinheiro`, `hospital`, `comprar`, `cedo`…) **não é LGA**. Foi acrescentado só para o painel conseguir mostrar frases do dia a dia — o motor, os cartões, a cobertura e os marcadores — antes de haver glossário validado. Não tem vídeo, não vem de nenhuma aula da Viva Surdo e não foi visto por ninguém surdo. Está marcado em três sítios para ninguém o ler como confirmado: o estado `'demonstracao'` (rótulo "Demonstração" em cada entrada do dicionário), o cartão tracejado âmbar nos resultados do Pamosii, e duas faixas de aviso (`note-band is-demo`) no dicionário e no painel. **Para o retirar:** apagar o objecto do tema em `GLOSSARIO` (app/app.js) — as faixas de aviso, os cartões e as etiquetas desaparecem sozinhos, porque são derivados do estado das entradas; depois trocar as frases de exemplo `PM_EXEMPLOS` por frases feitas só com vocabulário validado e actualizar `app/sw.js` + `index.html` (`?v=`). As frases que hoje tocam esse vocabulário são as do mercado e do hospital.

Sem 13, 14 e 15 **não há** reconhecimento de gestos a prometer: o site continuaria a dizer "glosa de estudo" e "a tua escolha de sinais", que é o que faz hoje.

---

## Notas de integridade editorial

- Nenhum número de alunos, avaliação, depoimento, mentor, preço ou estatística do protótipo anterior (Open Minds Academy) foi mantido.
- Terminologia: **"pessoas ouvintes"** (nunca "pessoas normais"); **Língua Gestual Angolana (LGA)**.
- O reconhecimento no Desafio Genial / Global Youth Challenge é apresentado com atribuição de fonte (UNICEF Angola, Abril de 2025); a UNICEF não é apresentada como operadora ou patrocinadora do site.
- Um número de telefone público de Outubro de 2026 **não** foi incluído como contacto geral (não confirmado para este fim).
- Este site não recolhe dados pessoais e não pede dados médicos ou detalhes de deficiência.
- O cache offline (`sw.js`) guarda **só conteúdo público do site** (página, estilo, motor, ícones, tipos letra-a-letra e miniaturas já vistas). Não guarda o que a pessoa escreve no Pamosii, o ditado do microfone nem as gravações da câmara — nada disso sai do browser, e o service worker só observa pedidos `GET` de ficheiros. Não há telemetria nem contadores de uso.
- Áudio e vídeo no Pamosii: a dictação por voz (`SpeechRecognition`) e a câmara (`getUserMedia` + `MediaRecorder`) correm **no dispositivo e no browser do utilizador**. Nada é enviado para um servidor nosso, nada é guardado depois de fechar a página, e as gravações só existem enquanto o utilizador não sair da rota ou não carregar em "Parar" (a faixa de vídeo é desligada em cada mudança de rota). As preferências do painel de acessibilidade vão para `localStorage`. Não há backend, logo não há base de dados nem telemetria.
- O Pamosii **não** reconhece sinais por câmara: a câmara serve para gravar e rever a própria demonstração, e a página diz isso ao utilizador.
