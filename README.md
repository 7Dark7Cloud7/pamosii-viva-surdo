# Agatha Viva Surdo — site público

Site público da **Agatha Viva Surdo**, plataforma angolana dedicada à inclusão económica e social, à educação e à acessibilidade das pessoas surdas. **Agatha** é o nome da plataforma; a **Viva Surdo** é a iniciativa angolana que a publica; o **Pamosii** é o motor de glosa de estudo que mostra a sequência de sinais (`#/pamosii`), e dá nome também ao Signer e à extensão.

> A divisão de nomes é deliberada e aparece no site: `#/sobre` diz que «Agatha é o nome desta plataforma; a Viva Surdo é a iniciativa angolana que a publica». O motor continua a chamar-se Pamosii para não renomear dados, ficheiros de exportação (`pamosii-*.jsonl`), chaves de `localStorage` (`vs.*`) e a extensão publicada — renomear isso quebraria ficheiros que a equipa já usa.

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

Verificado no URL ao vivo (2026-10-24, publicação `vs65`; as medidas de layout e de toque são da mesma visita ao host):

| Verificação | Resultado |
| --- | --- |
| 14 ficheiros publicados vs. `app/` | **byte a byte iguais** (SHA-256 de cada um), PNGs e o ZIP da extensão incluídos |
| `sw.js` e `index.html` ao vivo | `const VERSAO = 'vs65'` e `app.js?v=vs65` — o par de versões bate certo no host |
| `extensao/pamosii-signer.zip` | `200`, 16.367 B, `application/x-zip-compressed` |
| `Content-Type` de `sw.js` | `application/javascript; charset=utf-8` |
| `Content-Type` de `manifest.webmanifest` | `application/manifest+json; charset=utf-8` |
| Service worker | activo e a controlar no host publicado; scope `…/pamosii-viva-surdo/`; cache `casulo-vs65` com **13 entradas / 463.465 B** e `externo-vs65` com 3 (fontes); a cache da publicação anterior (`casulo-vs58`) desaparece ao activar o novo service worker (2026-10-24) |
| Consola no host publicado | nenhuma mensagem (2026-10-24) |
| `#/colher` no host publicado | a pista da sessão existe (`sess-palavra`, `sess-comecar`, `sess-msg`, `ch-sess-pista`). Neste ambiente o `getUserMedia` **fica pendurado** (o pedido de permissão não chega a ser respondido): em `vs64` o botão ficava desactivado para sempre; em `vs65`, aos 25 s, **o formulário volta a ficar utilizável**, a palavra escrita mantém-se e não é criada nenhuma sessão fantasma — medido no host publicado, não em local (2026-10-24) |
| 21 route-slugs a 320×640 (mobile, DPR 2), texto a **150%** | `overflow-x = 0` em **todas**: `/`, `/cursos`, `/cursos/mini-curso-lga`, `/aprender-lga`, `/dicionario`, `/pamosii`, `/professores`, `/biblioteca`, `/biblia`, `/biblia/genesis-1`, `/biblia/joao-3-16`, `/biblia/salmos-23`, `/biblia/marcos-7-31`, `/evangelismo`, `/sobre`, `/contacto`, `/colher`, `/colher/ola`, `/marcar`, `/fora`, `/nao-existe` (2026-10-24, local; os mesmos valores a 130% nas 7 primeiras rotas) |
| Alvos de toque a 320×640 | em todas as rotas o menor alvo não-inline é **≥ 44 px** excepto: ligações **no meio do texto** (`d=inline`, excepção explícita do WCAG 2.5.8), os `input` de checkbox/rádio (19–22 px) **dentro** de `<label>` de 46–48 px, e os dois elos do caminho-de-navegação em `/cursos/mini-curso-lga` (47×26 e 59×26, acima do mínimo de 24 px). As ligações dentro de bandas flex (`/biblia`, `/evangelismo`) foram corrigidas em `vs64` para 24 px de altura; «Repor opções» do painel de acessibilidade passou de 87×33 para **87×44** |
| Painel de acessibilidade a 320 px com texto a 150% | botões 44×44 (A−/A+) e 244×46–72 (temas, leitura em voz alta); «Repor opções» 87×44; painel entre `x=24` e `x=308` (não sai do ecrã) e sem scroll horizontal |
| Contraste dos quatro modos | medido composstando cada fundo sobre branco (o método anterior dava rácios impossíveis): claro **5.4–13.3**, escuro **7.4–12.5**, contraste alto e escuro+alto **15.3–21** — o pior caso (5,4:1) passa o mínimo AA de 4,5:1 (2026-10-24) |
| Quatro direcções de tradução | texto→sinais (4 blocos, 17 glifos, "3 frases analisadas · 4 de 7 elementos com sinal"), sinais→texto ("Olá bom dia boa tarde."), sinais→voz (`speechSynthesis` activo), voz→sinais (API de reconhecimento disponível; ditado exige microfone real) **(2026-10-20; o motor não mudou desde então)** |
| Sessão de gravação completa | corrida em `127.0.0.1:8123` com uma máquina de filmar sintética (`canvas.captureStream`) a servir de câmara: **4 repetições, 12 quadros, 20 s de sinal, 4 clipes, `dur_ms` 4000/4000/4000/8000**, estado `colhido`, verificador a marcar 4/4 repetições com as queixas por repetição, e o JSONL exportado com `schema: 2`, `consentimento.em`, `audio: false`, 3 quadros por repetição (2026-10-24) |
| Casulo sem rede | 13 entradas, 463.465 B em `vs65` (medido no host publicado; `vs47` tinha 10 entradas / 183.705 B) |

**Publicação `vs76` (2026-10-25)** — as duas páginas novas do FASE 1B ao vivo:

| Verificação | Resultado no host publicado |
| --- | --- |
| 14 ficheiros publicados vs. `app/` | **byte a byte iguais** (SHA-256 de cada um, incluindo os PNGs e o ZIP da extensão) |
| `sw.js` e `index.html` ao vivo | `const VERSAO = 'vs76'` e os dois `?v=vs76` — o par bate certo no host |
| `#/ouvir` no host | título «Ouvir e ver → sinais LGA — Agatha Viva Surdo», `<h1>` «Ouvir, ver um filme e chegar aos sinais», as três secções («Ditar e ver», «Vídeo ou filme com legendas», «O que ainda não há, e porque é que se diz isso») e os 28 ids do painel (`ov-mic`, `ov-texto`, `ov-video`, `ov-legenda`, `ov-agora-g`, …) todos presentes; 12 botões |
| `#/alfabeto` no host | «0 de 26 letras com forma confirmada · 0 com descrição registada» — a página lê o glossário de origem, sem números de teste |
| Service worker | `activo`, caches **só** `casulo-vs76` + `externo-vs76`; as caches da publicação anterior (`casulo-vs56`, `externo-vs56`) desaparecem no recarregamento seguinte (verificado: presentes à primeira visita, ausentes à segunda) |
| Casulo sem rede no host | **13 entradas, 589.529 B** em `casulo-vs76`, com `app.js?v=vs76` e `styles.css?v=vs76`, o documento, o manifest e os 8 ficheiros de `assets/` (`vs65` tinha 13 entradas / 463.465 B — o crescimento é o `app.js` com as duas páginas novas) |
| Consola no host publicado | nenhuma mensagem |
| Barra de navegação (local, `vs76`) | 12 itens numa linha de 68px com 22px de folga a 1281/1366/1440px; `Alfabeto` e `Ouvir` entram nos 12, `Evangelismo` passou para o painel «Mais» e continua acessível abaixo de 1281px |

**Publicação `vs78` (2026-10-25)** — o planeador de aula de `#/professores` ao vivo:

| Verificação | Resultado no host publicado |
| --- | --- |
| 14 ficheiros publicados vs. `app/` | **byte a byte iguais** (SHA-256 de cada um, PNGs e o ZIP da extensão incluídos) — 14/14 |
| `sw.js` e `index.html` ao vivo | `const VERSAO = 'vs78'` e os dois `?v=vs78` — o par bate certo no host |
| `#/professores` no host | `node tools/sonda-professores.cjs --base=https://…` corrido **contra o site publicado**: 29 casos, **0 falhas, 0 erros de consola** — planos de 30/45/90 min com a soma dos blocos a bater certo, `Demonstração` fora do `select`, «Diálogos» com 12 pedidas e 4 dadas, glosa marcada «a validar», «Treino em pares» no Alfabeto, os quatro contextos com a sua nota, e copiar/descarregar sem erro |
| `localStorage` no host | **vazio** à entrada e à saída da sonda — nem fixtures de teste, nem nada que o planeador escreva |
| Service worker | 1 registação com o `scriptURL` do host; passa a **controlar** a página a partir da segunda carga; caches **só** `casulo-vs78` + `externo-vs78` (as da publicação anterior já não existem) |
| Casulo sem rede no host | **13 entradas** em `casulo-vs78`, com as chaves exactas `app.js?v=vs78` e `styles.css?v=vs78`, o documento, o `index.html`, o manifest e os 8 ficheiros de `assets/` = **624.459 B**; `externo-vs78` com 3 entradas de tipos (`vs76` tinha 589.529 B — os +34,9 KiB são o planeador em `app.js` e a secção 24 em `styles.css`) |
| Consola no host publicado | nenhuma mensagem em três cargas seguidas de `#/professores` |

Limite desta medição: o tamanho do casulo é a **soma dos ficheiros servidos**, não a leitura dos corpos dentro da `Cache API` — neste Chrome `headless` os corpos devolvem 0 bytes (e os tipos da Google são respostas opacas, que nem sequer se podem ler). As 13 **chaves** e os dois `?v=vs78` foram lidos da cache no browser; os bytes vêm dos ficheiros byte a byte iguais acima.

**Publicação `vs79` (2026-10-25)** — o plano de aula sai para o papel:

| Verificação | Resultado no host publicado |
| --- | --- |
| 14 ficheiros publicados vs. `app/` | **byte a byte iguais** (SHA-256 de cada um, PNGs e o ZIP da extensão incluídos) — 14/14 |
| `sw.js` e `index.html` ao vivo | `const VERSAO = 'vs79'` e os dois `?v=vs79` — o par bate certo no host |
| Folha de impressão no host | lida por `fetch` ao URL publicado: `@media print{` presente, `#app{zoom:1!important;--escala:1!important}` presente, a conversão de `.btn`/`.chip`/`.band`/`.vlink` para preto sobre branco presente; em `app.js`, `data-prof-print`, `window.print()`, o `<p class="prof-cab">` e o `.vlink` de cada aula |
| `#/professores` no host | `node tools/sonda-professores.cjs --base=https://…` corrido **contra o site publicado**: 45 casos, **0 falhas, 0 erros de consola** — aos 29 do planeador somaram-se 16: `window.print()` uma vez por clique sem mudar de rota, o que estava visível no ecrã e some no papel, 6 blocos e 1 617 px de plano no papel, o `.vlink` da aula a sobreviver, o cabeçalho como primeiro elemento e segunda linha do `.txt`, e 150% de texto a chegar ao `#app` no ecrã (`zoom 1,5`) e a valer `1` no papel |
| `localStorage` no host | **vazio** à entrada e à saída — a sonda escreve `vs.a11y` de propósito para medir a escala, apaga-a no fim e tem caso próprio a confirmar `Object.keys(localStorage).length === 0` |
| Service worker | 1 registação com o `scriptURL` do host, `ativo=true` e `controlado=true` à segunda carga; **só** `casulo-vs79` — `casulo-vs78` e `externo-vs78` já não existem |
| Casulo sem rede no host | **13 entradas** em `casulo-vs79`, com as chaves exactas `app.js?v=vs79` e `styles.css?v=vs79`, o documento `/`, o `index.html`, o manifest e os 8 ficheiros de `assets/` = **628.232 B** (`vs78` tinha 624.459 B — os **+3.773 B** são a secção 25 de `styles.css` e o botão de imprimir em `app.js`) |
| Consola no host publicado | nenhuma mensagem de erro ou aviso em duas cargas seguidas de `#/professores` |

Limite desta medição: como em `vs78`, o tamanho do casulo é a **soma dos ficheiros servidos**, não a leitura dos corpos dentro da `Cache API` (que neste Chrome `headless` devolvem 0 bytes). As 13 **chaves** e os dois `?v=vs79` foram lidos da cache no browser. Nesta corrida o `externo-vs79` nem chegou a ser criado pelo site — o perfil de teste era novo e a página não pediu os tipos externos; a cache vazia que aparece na listagem foi criada pelo próprio verificador, que a abre para a ler.

**Publicação `vs80` (2026-10-25)** — a folha A–Z de datilologia sai para o papel:

| Verificação | Resultado no host publicado |
| --- | --- |
| 14 ficheiros publicados vs. `app/` | **byte a byte iguais** (SHA-256 de cada um, PNGs e o ZIP da extensão incluídos) — 14/14 |
| `sw.js` e `index.html` ao vivo | `const VERSAO = 'vs80'` no `sw.js` servido e os dois `?v=vs80` no `index.html` servido |
| Folha A–Z no host | lida por `fetch` ao URL publicado: em `styles.css`, `.alf-folha{` no ecrã **e** `@media print{ … .alf-folha-grelha{…repeat(2…` mais `main:has(.alf-folha)`; em `app.js`, `id="alf-folha"`, `data-alf-print`, o `window.print()` do alfabeto e a frase «não desenha formas de mão» dentro da folha |
| `#/alfabeto` no host | `node tools/sonda-alfabeto.cjs --base=https://…` corrido **contra o site publicado**: 22 casos, **0 falhas, 0 erros de consola** — estado de cada letra igual ao da grelha, 52 linhas pautadas, zero `<img>`, `window.print()` 1 vez, e no papel 978 px de folha para 1017 px de página |
| `#/professores` no host (regressão) | `node tools/sonda-professores.cjs --base=https://…`: **45 casos, 0 falhas, 0 erros de consola** — a entrega anterior continua intacta, com o plano a caber no papel a 150% (`939/985`) |
| `localStorage` no host | **vazio** à entrada e à saída (a sonda escreve `vs.a11y` para medir a escala e apaga-o no fim) |
| Service worker | 1 registação com o `scriptURL` do host, `ativo=true` e `controlado=true` à segunda carga; **só** `casulo-vs80` — as caches de `vs79` já não existem |
| Casulo sem rede no host | **13 entradas** em `casulo-vs80`, com as chaves exactas `app.js?v=vs80` e `styles.css?v=vs80` = **633.310 B** (`vs79` tinha 628.232 B; os **+5.078 B** são a folha em `app.js` e as regras `.alf-folha` em `styles.css`) |
| Impressão medida no host, sob SW | com o service worker a controlar a página, `#/alfabeto` em media `print` a 688×1017: folha **641×978**, 26 letras, `.site-head`, `#alf-grade` e `#alf-treino` escondidos; `[data-alf-print]` clicado chamou `window.print()` **1 vez** |
| Consola no host publicado | **zero** mensagens (nem avisos) em três cargas — `#/professores` duas vezes e `#/alfabeto` |

Correcção de medição, e vale para as tabelas de `vs78` e `vs79` acima: os corpos dentro da `Cache API` **leem-se**, o que ali dava 0 bytes era erro do verificador — `cache.keys()` devolve **`Request`** objects, cujos corpos são efectivamente vazios. Com `cache.matchAll()` (as `Response`) o `casulo-vs80` deu **633.310 B**, o mesmo número da soma dos 13 ficheiros servidos por `fetch`, medido por dois caminhos independentes. Continua por provar o que não se pode provar daqui: o PDF de cada browser e as impressoras reais.

**Publicação `vs82` (2026-10-26)** — a plataforma passa a chamar-se **Agatha Viva Surdo**, recebe a pele pública nova e a folha de colheita. O `vs81`, publicado minutos antes, é a mesma entrega; o `vs82` só lhe retira o nome antigo de três assets (o `aria-label` da marca, a nota do `glossario-extra.json` e o cabeçalho do `styles.css`):

| Verificação | Resultado no host publicado |
| --- | --- |
| Ficheiros alterados vs. `app/` | **byte a byte iguais** (SHA-256) nos dois passos: os cinco de `vs81` (`app.js`, `styles.css`, `sw.js`, `index.html`, `manifest.webmanifest`) e os cinco de `vs82` (`index.html`, `styles.css`, `sw.js`, `assets/glossario-extra.json`, `assets/logo-mark.svg`); os restantes não foram tocados |
| `sw.js` e `index.html` ao vivo | `const VERSAO = 'vs82'` no `sw.js` servido e os dois `?v=vs82` no `index.html` servido |
| Nome ao vivo | `<title>` «Agatha Viva Surdo — Aprender, ensinar e comunicar em Língua Gestual Angolana»; cabeçalho com a marca `Agatha · Viva Surdo · Língua Gestual Angolana`; manifest com `Agatha Viva Surdo — Língua Gestual Angolana` / `Agatha`; os ficheiros de exportação e a extensão continuam `pamosii-*` (ver a nota de nomes no topo) |
| `#/cobertura` no host | `node tools/sonda-cobertura.cjs --base=https://…` corrido **contra o site publicado**, três vezes no conjunto das duas publicações: **26 casos, 0 falhas, 0 erros de consola** — 14 linhas com os estados do dicionário, duas células de resposta vazias por palavra, «Esta folha não ensina nada», o aviso do que ficou de fora, `window.print()` 1 vez, e no papel **641×916 px** com texto preto e células de 29 px |
| `#/alfabeto` no host (regressão) | `node tools/sonda-alfabeto.cjs --base=https://…`, três vezes no conjunto: **22 casos, 0 falhas, 0 erros de consola** — a folha A–Z continua a caber numa página (978 px numa página de 1017) |
| `localStorage` no host | **vazio** à entrada e à saída das sondas |
| Service worker | `controlado=true`, scope `…/pamosii-viva-surdo/`; caches **só** `casulo-vs82` e `externo-vs82` |
| Casulo sem rede no host | **13 entradas / 660.188 B** lidos com `matchAll()` em `casulo-vs82` (`vs80` tinha 633.310 B; os **+26.878 B** são a pele nova e a folha de colheita em `styles.css`/`app.js`); `externo-vs82` com 3 respostas opacas (os tipos da Google), como antes |
| Impressão no local | 19 rotas a 794×1123 px (A4 a 96 dpi) em media `print`: **0 problemas** — foi esta medição que apanhou o contraste 1:1 da pele nova no papel e obrigou a forçar as superfícies escuras a branco |
| Consola no host publicado | **zero** mensagens em duas cargas de `#/cobertura` e `#/alfabeto` e no verificador de cache. Numa primeira carga a frio de `vs81`, num perfil novo, ficaram registados três `ERR_SSL_PROTOCOL_ERROR` de recursos externos (tipos/miniaturas); as cargas seguintes não repetiram o erro, pelo que foi tratado como falha de rede do ambiente, não do site |

Limite desta publicação: os testes de impressão acima são a folha `@media print` renderizada no DOM (o Chrome `headless` não abre diálogo de impressão); o PDF de cada browser e as impressoras reais continuam por verificar. A paleta continua sem manual de marca oficial verificável (ver «De onde vem a identidade visual»).

Limites honestos: a emulação "Offline" do DevTools **não bloqueia pedidos neste ambiente** (`navigator.onLine` fica `true` e os JPEGs do YouTube continuam a carregar), portanto a queda para o cache sem rede foi comprovada (a) matando o servidor local com o mesmo `sw.js` e (b) lendo as entradas do cache no host ao vivo — não por emulação. A sessão de gravação **nunca foi corrida com uma pessoa real nem com uma câmara real neste ambiente**: o que está medido acima é o cano completo com uma fonte de imagem sintética, mais o caminho de falha (câmara pendurada) no host publicado. O reconhecimento de gestos continua inexistente: depende do corpus descrito em `docs/colheita-sinais-lga.md`.

### Actualizar o site publicado

```bash
cd .deploy-gh                     # clone de trabalho ligado ao repo
git checkout gh-pages
cp -r ../app/. .                  # app/ é um superconjunto da árvore publicada; .nojekyll permanece
# (se algum ficheiro publicado deixou de existir em app/, remover esse ficheiro à mão antes do add)
git add -A && git status --short  # confirmar que não há nada de mais
git -c user.name="Agatha Viva Surdo" -c user.email="deploy@agatha.local" \
    commit -m "vsNN no site publicado: <o que mudou>"
git push origin gh-pages
```

A identidade é dada **no comando**, com `-c user.name=`/`-c user.email=`: não se corre `git config` neste projecto, para não alterar a configuração global da máquina.

Duas armadilhas já pagadas com factos, e como se vêem:

- **`git checkout` com a árvore suja imprime `Aborting` e fica onde estava.** Se depois disso se correr o `cp` e o `commit`, o commit aterrar na branch errada. Confirmar sempre `git branch --show-current` antes do `git add`.
- **As duas branches têm árvores diferentes.** Na `gh-pages` os ficheiros estão na **raiz** (`cp -r ../app/. .`); na `main` estão dentro de **`app/`** (`cp -r ../app/. app/`). Usar a forma da `gh-pages` estando na `main` cria cópias órfãs na raiz (`app.js`, `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `assets/`, `extensao/`) que entram no commit. Verificar com `git ls-tree --name-only HEAD` antes de cometer, e `git reset --mixed HEAD~1` + apagar os ficheiros órfãos para recuperar (nada é empurrado enquanto o `push` não correr).
- **O `cp` de ficheiros idênticos suja a árvore só por fins-de-linha** (o git deste ambiente tem `autocrlf` ligado: os `M` aparecem em `assets/*.json`, `logo-mark.svg`, `pattern-angola.svg`, `manifest.webmanifest` com `git diff --numstat` a dar `0 0`). Isso trava o `git checkout main` a seguir ao commit na `gh-pages`. Verificar que é só EOL (`git diff --ignore-cr-at-eol --stat` vazio) e **empurrar sem mudar de branch**: `git push origin refs/heads/main:refs/heads/main`. Não se usa `checkout -f` nem `stash` para «limpar» isto — apagaria trabalho alheio por um problema que não existe.

Depois publica-se o código-fonte na branch `main` (que não é servida), para que o repo e o site não divirjam:

```bash
git checkout main
cp -r ../app/. app/ && cp ../README.md . && cp -r ../extension . 
cp ../docs/*.md docs/ && cp ../tools/*.cjs ../tools/*.html tools/ && cp -r ../tools/exemplos tools/
git add -A && git status --short && git diff --cached --stat   # rever o que entra
git -c user.name="Agatha Viva Surdo" -c user.email="deploy@agatha.local" commit -m "vsNN: <o que mudou>"
git push origin main
```

Antes do `git add -A` na `main`, verificar que não há segredos nos ficheiros novos (`grep -rniE "(ghp_|token|password|api[_-]?key)"` sobre as pastas a adicionar) e que `tools/serve.log` ou outros artefactos locais não entram.

Depois do push, confirmar no URL publicado: `curl -s …/sw.js | grep VERSAO` → `vsNN`, `curl -s …/index.html | grep 'app.js?v='` → `?v=vsNN`, e o SHA-256 de cada ficheiro publicado igual ao de `app/`.

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
    ├── pattern-angola.svg
    ├── biblia.json            # texto bíblico real (Almeida, domínio público) usado em #/biblia
    └── glossario-extra.json   # sinais publicados pela equipa a partir da Colheita (gerado)
tools/
├── parse-yt.cjs         # utilitário usado para extrair os dados reais da playlist
├── yt-search.cjs        # pesquisa de vídeos públicos do canal (usado na recolha de fontes)
├── fetch-biblia.cjs     # foi assim que biblia.json foi obtido e conferido
├── make-icons.cjs       # gera os PNGs do manifest a partir da marca (node tools/make-icons.cjs)
├── engine-test.cjs      # corre o motor de glosa do Pamosii em Node (node tools/engine-test.cjs)
├── integridade-test.cjs # lê o código-fonte e falha se alguma interface prometer o que não existe
├── ingerir-colheita.cjs # pacote JSON ou JSONL da Colheita → glossario-extra.json (--dry-run, --mostra)
├── ingerir-validacoes.cjs # veredictos de #/validar → estados do glossario-extra.json (--dry-run, --mostra)
├── ingerir-marcacoes.cjs # marcações de tempos exportadas → segmentos para cortar os clipes
├── auditoria-visual.cjs # Chrome headless por CDP: overflow, alvos de toque e contraste nas rotas
├── teste-embed.html     # página mínima para provar o postMessage do Signer incorporado
├── serve.cjs            # servidor estático de teste (porta 8123)
└── exemplos/
    ├── sessoes-exemplo.jsonl    # sessões exportadas pelo browser (quadros substituídos por marcador)
    └── validacoes-exemplo.jsonl # todos os casos da fila de validação, incluindo os que devem ser recusados
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
| `#/alfabeto`      | Alfabeto manual (datilologia) | As 26 letras com o estado de cada uma (confirmada / a validar / sem registo), a aula real do Abecedário, soletração com controlo de velocidade e treino da ordem, e **folha A–Z imprimível** numa só página de A4 com linhas pautadas para apontar a forma |
| `#/pamosii`       | Pamosii (português ↔ LGA)     | As quatro direcções em atalhos + frases de exemplo; glosa de uma ou várias frases com vídeo e glifo animado por sinal, barra de cobertura e alfabeto manual para o que não tem sinal; ditado por voz; construção de sequência de sinais → frase escrita e falada; módulo de câmara para gravar e rever o próprio sinal |
| `#/ouvir`         | Ouvir e ver → sinais           | Ditar ao microfone (ditado por voz do browser) e ver a glosa contínua, ou escolher um vídeo/filme local + legendas `.srt`/`.vtt` e acompanhar a glosa da fala que está a tocar; painel explícito do que ainda não há |
| `#/professores`   | Professores — planeador de aula | Monta um plano de 30/45/60/90 min a partir das 17 aulas reais e do dicionário, com o estado de cada sinal à vista; checklist de preparação, copiar, descarregar e **imprimir** o plano numa folha A4 sem interface à volta. Recursos que ainda não há ficam "Em breve" |
| `#/biblioteca`    | Biblioteca                    | Pesquisável; itens reais (vídeos) + itens planeados "Em breve" |
| `#/biblia`        | Bíblia                        | Passagens reais (Almeida, domínio público) em texto, leitura em voz alta e **glosa de sinais versículo a versículo**; `#/biblia/:chave` abre uma passagem (`genesis-1`, `joao-3-16`, `salmos-23`, `marcos-7-31`) |
| `#/evangelismo`   | Evangelismo                   | Roteiros de partilha com frases prontas, cada uma com a sequência de sinais e o modo de teste em Libras |
| `#/colher`        | Colheita participada          | Qualquer pessoa regista sinais que conhece — por escrito ou numa sessão de gravação guiada (consentimento + 3 repetições + 1 lenta, sem áudio); lista das palavras sem sinal encontradas no site; exportação local em JSON/TXT/JSONL |
| `#/colher/:palavra` | Registar uma palavra        | Abre o formulário já preenchido com essa palavra (venha do dicionário, do Pamosii, da Bíblia ou do Signer) |
| `#/validar`       | Fila de validação              | Três veredictos por sinal colhido — **correcto / variante regional / errado** — assinados por um apelido, com região; fica no aparelho e exporta-se em JSONL para a equipa. A página nunca promove estados |
| `#/cobertura`     | Cobertura do glossário         | Contas honestas: quantas palavras têm sinal confirmado/aprovado, quantas estão colhidas ou só em demonstração, a cobertura por tema, o que a equipa publicou e as lacunas pedidas neste aparelho. Lê estados, nunca os promove. Inclui a **folha de colheita imprimível** por tema (uma página de A4 para levar à comunidade) |
| `#/marcar`        | Marcação de tempos            | Ferramenta de revisão: marca os segundos em que o sinal de cada palavra aparece nas 17 aulas; exporta JSON/TXT e come-se em `tools/ingerir-marcacoes.cjs` |
| `#/fora`          | Fora deste site               | As três formas de usar o Signer fora desta página: partilhar no Android, extensão Chrome, e incorporar por iframe |
| `#/sobre`         | Sobre                         | Missão, modelo (fontes públicas), reconhecimento com atribuição de fonte, valores |
| `#/contacto`      | Contacto                      | Apenas canais verificados: Facebook, Instagram, YouTube + playlist |

A rota antiga `#/catalogo` redirecciona para `#/cursos`. Além destas 21 vistas registadas, há dois widgets que não são rotas: o **Pamosii Signer** (botão flutuante presente em todas as páginas) e o **painel de acessibilidade**.

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
10. **`PM_MAOS`** + **`SG_MAOS`** e a função `sgFigura()` — o boneco do **Pamosii Signer** (cabeça, corpo, duas mãos e a marca de movimento). As famílias de movimento vêm do mesmo `PM_MOVIMENTO` do Pamosii; `styles.css` tem os `@keyframes sg-*`.
11. **`app/assets/biblia.json`** + bloco `BIBLIA` — as passagens reais (tradução, licença, data de obtenção e versículos). Não é texto inventado: vem de Almeida, domínio público, e foi conferido com `tools/fetch-biblia.cjs`. **Não existe Bíblia em LGA** (ver "Bíblia" abaixo), por isso aqui só há português + glosa.
12. **`app/assets/glossario-extra.json`** — sinais já publicados pela equipa a partir da Colheita. Gerado por `tools/ingerir-colheita.cjs`; é o único ficheiro de dados que o site lê por `fetch` em tempo de execução (e por isso tem a sua própria regra no `sw.js`: rede primeiro, casulo se falhar).
13. **Chaves de `localStorage`** — `vs.a11y` (preferências), `vs.biblia` (última passagem lida), `vs.colheita` (registos desta pessoa), `vs.lacunas` (palavras sem sinal encontradas), `vs.extra` (o último `glossario-extra.json` visto). Nada é enviado para lado nenhum.

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

## Pamosii Signer — o boneco animado que acompanha todas as páginas

Um botão flutuante (``Pamosii Signer``, canto inferior esquerdo, ao lado do botão de acessibilidade) abre uma janela fixa que está **fora** do `#app` e por isso permanece aberta enquanto se navega. É o protótipo do leitor de sinais estilo VLibras, feito com o que já existe neste repositório — os mesmos glifos vectoriais do Pamosii, agora montados como figura.

**O que faz (verificado no browser):**

| Peça | Comportamento real |
|------|--------------------|
| Texto → sequência | O campo aceita texto; "Sinalizar" divide por frases (todas, não só a primeira) e faz **um passo por palavra**, com o alfabeto manual letra a letra para o que não tem sinal. Medido com `Bom dia! Onde fica a escola?`: 3 passos; com soletração de `banana`: 11 chips, incluindo B-A-N-A-N-A. |
| "Sinalizar esta página" | Reúne o texto visível do `<main>` e sinaliza essa sequência — o pedido de acessibilidade mais comum, sem nenhum servidor. |
| Boneco | `sgFigura()` desenha cabeça, corpo, duas mãos e a marca de movimento da família do tema. Cada família tem o seu `@keyframes` (`sg-aceno`, `sg-conversa`, `sg-grafema`, `sg-contar`, `sg-objeto`, `sg-ponto`, `sg-qualidade`, `sg-ciclo`, `sg-sobe`). A velocidade (`0,5× / 0,75× / 1× / 1,5×`) escreve `--sg-d` no palco, e todas as durações são `calc(Xs * var(--sg-d))`. |
| Vídeo real por palavra | Quando a palavra tem aula com vídeo, o palco mostra a fachada do YouTube (só carrega depois do clique, nunca com autoplay) e a nota *"O vídeo é que faz fé: o boneco só mostra a família de movimento."* |
| Transporte | Anterior · Reproduzir/Pausar · Seguinte · Repetir este sinal · Velocidade, sempre visível: no telemóvel a barra fica `position:sticky` no fundo da janela. Medido a 390×844: duas linhas, 119px, botões a 44px, janela de 760px sem tocar na barra inferior. |
| Teclado | Esc fecha (o listener vive no `documento`, por isso fecha mesmo com o foco no botão flutuante); ← → percorrem; Espaço reproduz; Tab fica em laço **dentro da janela** quando o foco já lá está. O foco vai para "Reproduzir" ao abrir. |
| Falta de sinal | Cada palavra sem sinal no glossário aparece em `#sg-falta` com link directo para `#/colher/<palavra>` — o Signer é também a entrada da Colheita. |

**As quatro superfícies do Signer (todas o mesmo widget, nenhum servidor):**

| Superfície | Como se usa | O que está implementado |
|---|---|---|
| Dentro do site | Botão flutuante em todas as páginas | Janela fixa fora do `#app`; descrito na tabela acima. |
| **Apontar** | "Apontar" no topo da janela → a pessoa clica numa frase ou parágrafo do `<main>` e **só esse trecho** é sinalizado | O `click` captura o elemento, extrai-lhe o texto, fecha o modo de apontamento e monta a sequência. Sai com Esc, com o botão, ou ao mudar de rota. Sem leitor de ecrã, o mesmo resultado obtém-se com "Sinalizar esta página" e as setas. |
| **Incorporada** | `<iframe src="…/app/index.html?emb=1#/pamosii">` — o site nasce sem cabeçalho, rodapé nem barra de tabs, para um site de parceiro ou de uma escola | Verificado com um iframe real: o painel dentro do iframe recebe `{tipo:'pamosii-sinalizar', texto}` do pai e monta a sequência ("Eu quero água" → 2 sinais). Duas travas: o `?emb=1` tira a navegação, e o painel **só aceita ordens quando está dentro de um iframe** (`window.parent !== window`) — o mesmo `postMessage` atirado contra a página aberta sozinho é ignorado, medido. O texto entra sanitizado (string, sem `\0`, limitado a `SG_EMB_MAX`). Limite honesto: não há lista permitida de origens — qualquer página que incruste o iframe pode mandar texto ao painel, que é só isso que o painel faz com o campo de escrita. |
| **Fora do site** | `manifest.webmanifest` com `share_target` (`text/plain`, `title`, `url`): no Android, "Partilhar → Pamosii" a partir do WhatsApp, Chrome ou Notes | A partilha abre `#/fora?text=…`, uma página que mostra o texto recebido e o sinaliza — o gesto que o VLibras tem, sem instalação extra. A mesma página explica como usar o Signer **fora** deste site (extensão Chrome em `extension/`, e o iframe). |

**O que o Signer NÃO é, e diz isso na própria janela:** não traduz automaticamente, não lê gestos, e o boneco **não é um sinalizador surdo angolano**. Enquanto não houver vídeo gravado e aprovado, o boneco é uma ilustração de apoio; o aviso aparece no topo da janela, e as páginas de "Sinais animados" repetem-no. Um boneco não pode imitar a cara, a voz ou o estilo de uma pessoa real sem **autorização escrita, prévia e separada** — está dito no `docs/colheita-sinais-lga.md` §5 e é a razão por que a fase "clipes reais em cadeia" (ver abaixo na lista da equipa) vem antes de qualquer avatar personificado.

## Bíblia — texto real, áudio e sinais (`#/biblia`, `#/biblia/:chave`)

Passagens em português (Almeida, domínio público, obtidas e conferidas a 2026-10-22 — `tools/fetch-biblia.cjs`), com leitura em voz alta frase a frase (`speechSynthesis`, pára ao mudar de rota ou com Escape) e **glosa de sinais versículo a versículo** pelo mesmo motor do Pamosii. Há também um bloco reservado para "Bíblia em sinais + áudio para pessoas cegas", apresentado como **pendente**: sem vídeo aprovado, diz "Em breve" em vez de fingir que existe.

**Verificado, e é a razão do estado honesto:** não existe Bíblia em Língua Gestual Angolana — nem vídeo completo, nem canal com Génesis em LGA. O que existe publicamente é **Libras** (LSL/Librês, Brasil) e **ASL** (inglês). Por isso:

- o texto é português real;
- a sequência de sinais é **glosa derivada do glossário**, claramente rotulada como apoio de estudo;
- as palavras sem sinal (em Génesis 1 são muitas — `deus` 98×, `criou` 22×, `disse` 40×) entram automaticamente na lista de lacunas da Colheita, com link `#/colher/<palavra>`;
- o **modo de teste em Libras** (abaixo) está disponível para comparação, sempre rotulado como brasileiro e "não é LGA".

## Modo de teste em Libras — avatar VLibras (não é LGA)

Nas páginas da Bíblia, do Evangelismo e do Pamosii há um bloco explícito para ligar o avatar **VLibras** (`https://vlibras.gov.br/app`), que sinaliza em **Língua Brasileira de Sinais**. Está desligado por omissão: nenhum pedido é feito a serviços externos até a pessoa carregar em "Ligar". A mensagem de estado diz `Desligado. Nenhum pedido é feito a serviços externos.`, e ao ligar passa a nomear o serviço. É um modo de **comparação** para quem está a aprender — nunca uma apresentação de LGA, e a própria página o sublinha (`um avatar brasileiro; não é LGA`).

Consequência prática registada: ao ligá-lo, o browser passa a fazer pedidos a infra-estrutura brasileira (o plugin VLibras chega a contactar hosts de telemetria próprios, por exemplo `csm.sg.plot0.ru`). Nada disso vem do código deste site, e nada do que a pessoa escreve é enviado — mas a equipa deve saber que "Ligar o avatar" significa tráfego de terceiros, o que reforça a decisão de o manter opt-in.

## Colheita participada (`#/colher`) — qualquer pessoa ajuda a encher o dicionário

O gargalo real do projecto não é o código: é não haver dicionário de LGA suficiente. Esta página transforma cada visitante em recolha de dados, com o privacidade como limite duro.

**O ciclo completo (verificado ponta a ponta):**

1. **Entrada.** Onde falta um sinal — dicionário, cartões do Pamosii, versículos da Bíblia, roteiros de evangelismo, e o próprio Signer — há um link `#/colher/<palavra>` que abre o formulário já preenchido. As palavras sem sinal ficam contadas em `vs.lacunas` e aparecem como backlog ordenado por pedidos ("deus — 98×").
2. **Registo.** A pessoa descreve o sinal nos campos que `docs/colheita-sinais-lga.md` define: palavra, tema, **configuração da mão**, **lugar**, **movimento**, **marcador não manual** (expressão facial/corporal), **onde o aprendeu**, URL opcional de vídeo e nota livre (variação regional). Guarda-se com `estado: 'colhido'` e data.
3. **Fotografias (opcional).** Até haver vídeo, 3–4 quadros JPEG do meio do sinal chegam para desenhar o glifo certo. A câmara **nunca grava som** (`audio:false`), as imagens ficam no browser (máximo 4 por registo) e só saem se a pessoa carregar em exportar.
4. **Usar no site imediatamente.** Os registos desta pessoa entram no índice de procura: pesquisar "kuduro" no dicionário devolve a entrada com etiqueta **Colhido** (tracejada) e a nota *"Registado por alguém da comunidade via Colheita. Ninguém aqui validou…"*. O contador discreto em `#route-live` diz quantos sinais estão em fase de colheita neste aparelho.
5. **Exportar.** Um pacote JSON (esquema `pamosii-colheita`, com `entrada[]` e `lacunas{}`) e uma versão TXT legível por quem não tem terminal. A exportação é sempre acto deliberado: nada sai do browser sozinha.
6. **Ingerir (equipa).** `node tools/ingerir-colheita.cjs pacote.json [--dry-run]` junta pacotes de muitas pessoas, elimina duplicados (fica com o registo mais completo), **recusa** texto que pareça URL ou base64, reduz `fotos` a `tem_fotos` (para o JSON não rebentar), e só promove a `confirmado` quando o registo traz `validado_por`. Escreve `app/assets/glossario-extra.json`, que o site passa a ler no arranque.

**Modo sessão de gravação (a parte que desbloqueia a fase 2).** Descrever um sinal por palavras é o mínimo; para treinar ou desenhar glifos é preciso vê-lo. A página tem por isso uma sessão guiada que cumpre o protocolo de gravação (`docs/colheita-sinais-lga.md` §3), com o consentimento como portão e não como rodapé:

1. **Consentimento primeiro.** Quatro confirmações (gravação das mãos/rosto, uso no Pamosii, pagamento proporcionado ao tempo e ao uso, e — se quem sinaliza não é a pessoa que grava — a autorização dessa pessoa). Sem as três obrigatórias marcadas o botão "Aceitar e começar" não desbloqueia, e a câmara nem é pedida. A qualquer momento há um **Revogar e apagar** que desliga a câmara e deita fora quadros e clipes sem guardar nada.
2. **Câmara sem áudio.** `getUserMedia({video:…, audio:false})` — o pedido é literalmente sem faixa de áudio, por duas razões: não é preciso para ver um sinal, e o som ambiente capta vozes de terceiros sem consentimento. Se a câmara falhar, a mensagem diz isso e o formulário escrito continua disponível.
3. **4 repetições guiadas.** 3 ao ritmo natural (4 s) e 1 lenta (8 s), com pré-aviso de 1,6 s por repetição, barra de tempo, contador "Repetição 2 de 4", e pausa que descarta o clipe a meio (um clipe incompleto não serve para anotar trajectória). É o mesmo cronómetro da parede que depois escreve `dur_ms` — a base do pagamento proporcional.
4. **Prova visual.** De cada repetição ficam 3 quadros (20%, 55%, 90% do movimento) a 320×240 JPEG — o meio do sinal, que é o que falta para desenhar o glifo. Além disso um `MediaRecorder` grava a repetição inteira; **os clipes vivem só na memória da visita**, cada um com o seu link "Descarregar repetição N", e a própria sessão avisa para os descarregar antes de sair.
5. **Verificador de qualidade (mede o quadro, não o sinal).** Uma faixa na pista da sessão mostra quatro números em linguagem simples — **luz**, **contraste**, **nitidez** e **movimento** — calculados sobre o próprio vídeo reduzido a 96×72, uma amostra a cada 500 ms, com conselho prático ("Está escuro de mais: vira-te para a luz ou acende a divisão"). Não bloqueia nada: no fim resume quais as repetições marcadas, e a pessoa decide. O que deliberadamente **não** afirma: que detecta mãos, braços ou cara — isso exigiria um modelo que a aplicação não carrega, por isso a própria faixa diz que o enquadramento é a pessoa que confirma. Os limiares (`QUAL_LIMIAR` em `app/app.js`) estão escritos à mão e **por calibrar com as primeiras centenas de gravações reais**; os valores brutos vão todos no ficheiro para essa calibração se poder fazer.
6. **Guardar.** O registo entra em `vs.colheita` com `tipo:'sessao'`, `estado:'colhido'`, o `consentimento` (quem sinaliza, hora, `audio:false`), as 4 repetições medidas e, em cada uma, o resumo do verificador (`qualidade`). Aparece logo na lista da página e no dicionário com etiqueta **Sessão**. O texto descritivo continua a ser pedido: a gravação sozinha não chega para o dicionário.
7. **Exportar.** `Exportar sessões (JSONL)` escreve **uma linha por repetição** (`pamosii-sessoes-AAAA-MM-DD.jsonl`, `application/x-ndjson`), exactamente o formato do §4 do protocolo (`schema: 2`). O pacote JSON e o TXT também levam o bloco `sessao`.
8. **Ingerir.** `node tools/ingerir-colheita.cjs <ficheiro>.jsonl [--dry-run] [--mostra]` aceita JSONL, agrupa as linhas por palavra, soma os segundos, e **recusa** qualquer sessão sem consentimento registado. Lê os esquemas 1 e 2 do `SCHEMA_SESSAO` e recusa um mais recente do que ele; de cada repetição com `qualidade` marcada saem `sessao.regravar` (ex. `"4ª:brilho/movimento"`) e `sessao.leitura` com os números, para a fila de «há que filmar outra vez» não depender de abrir clipes um a um. Com `--mostra` imprime só os termos limpos, para rever antes de escrever `glossario-extra.json`. `tools/exemplos/sessoes-exemplo.jsonl` é o exemplo de teste (dry-run apenas).

**Porque é que isto não é "validação":** o site usa estados separados e visíveis — `a-validar` (inferido do programa público), `colhido` (registo da comunidade, sem revisão), `confirmado` (revisto por uma pessoa surda utilizadora de LGA), `aprovado` (dois sinalizadores diferentes) e `rejeitado` (um sinalizador surdo disse que não é LGA). Só a Colheita escreve `colhido`; `confirmado`, `aprovado` e `rejeitado` **só** saem de `tools/ingerir-colheita.cjs` e `tools/ingerir-validacoes.cjs`, nunca do browser. A ingestão automática **nunca** escreve `confirmado` sem `validado_por`, e as entradas `colhido` não ganham vídeo nem honram a autoridade de uma aula. Uma gravação guardada também não vale por si: fica `colhido` até haver revisão humana.

---

## Fila de validação (`#/validar`) — o §6 do protocolo, no browser

A Colheita junta sinais; esta página é onde uma pessoa surda angolana diz o que valem. É deliberadamente pequena, porque um veredicto sem gente por trás não vale nada:

1. **Quem valida assina.** Um **apelido** (não o nome completo), a região onde sinaliza e a declaração «uso LGA» (pessoa surda que sinaliza ou CODA). Sem as duas primeiras, os botões explicam o que falta e põem o foco no campo — não falham em silêncio. A caixa é uma declaração, não uma verificação: a equipa confirma quem assina antes de publicar.
2. **Três veredictos, com o sentido escrito por baixo.** `Correcto` (é este o sinal em Angola e a descrição corresponde), `Variante regional` (também é LGA, mas na minha região faz-se assim — a variação fica assinada com a palavra) e `Errado` (não é este o sinal; assim não se ensina). Cada botão é `aria-pressed`, tem 44px, e o foco volta ao botão que a pessoa carregou depois da repintura da fila.
3. **A fila vem de onde já há dados.** Junta os registos deste aparelho (`vs.colheita`), os pacotes importados antes (`vs.extra`) e um pacote largado na própria página — só nesta visita, porque os quadros são de quem gravou e não há razão para os fixar aqui. Cada cartão mostra o que existe para julgar: descrição (configuração, lugar, movimento, expressão), consentimento, repetições/quadros/segundos, as bandeiras do verificador de qualidade e até 4 quadros (um por repetição).
4. **Nota opcional e desfazer.** A nota (`maxlength 400`, normalizada) fica gravada por veredicto. Carregar no mesmo veredicto outra vez retira-o, e «Retirar o meu veredicto» faz o mesmo — não é preciso assinatura para desfazer o que se fez.
5. **Filtros «À espera / Já validei / Tudo»** com `aria-pressed`, uma região `role="status"` que anuncia «A mostrar 2 sinais à espera.» e foco devolvido ao filtro (a fila é redesenhada, e sem isso o teclado caía no `<body>`).
6. **Exportar.** `Exportar validações (JSONL)` escreve `pamosii-validacoes-AAAA-MM-DD.jsonl` (`application/x-ndjson`), **uma linha por veredicto**, com `schema: 1`, `tipo: "pamosii-validacao"`, `validado_por`, `validadora_surda`, `regiao`, `validado_em`, `estado_antes: "colhido"` e a nota. Há também JSON e «Copiar resumo». `Apagar os meus veredictos` pede confirmação e avisa que não há cópia em lado nenhum.
7. **Ingerir (equipa).** `node tools/ingerir-validacoes.cjs <veredictos>.jsonl [--dry-run] [--mostra] [--destino=…]` aplica as regras do §6.1 do protocolo e escreve os estados em `app/assets/glossario-extra.json`. Recusa linha anónima, linha de quem não declarou usar LGA, veredicto fora do vocabulário, esquema mais novo e data em falta; um empate não move nada; o mesmo apelido a corrigir-se conta uma vez; correr duas vezes não duplica a nota de proveniência. `tools/exemplos/validacoes-exemplo.jsonl` cobre todos esses casos.

O que a página **não** faz, e `tools/integridade-test.cjs` vigia: nenhuma interface escreve `confirmado`/`aprovado`/`rejeitado`, não há pedidos de rede, e o texto continua a dizer que o sinal só muda de estado quando a equipa importar o ficheiro.

---

## Cobertura do glossário (`#/cobertura`) — contas, não promessas

Uma página para responder à pergunta que o site tem de saber responder sem inventar: **quanto é que isto já cobre?** Não mede a LGA inteira — não existe censo público de sinais — mede o site. Separa sempre três fontes:

1. **O glossário do site.** 236 palavras no total: **203 ligadas às 17 aulas** e **33 só de demonstração** (sem vídeo, marcadas como não-LGA). Uma constante `GLOSSARIO_BASE_QTD` guarda esse retrato antes de a colheita acrescentar palavras, para as duas contas nunca se misturarem.
2. **`assets/glossario-extra.json`** — o que a equipa publicou. A página mostra quantos sinais tem o ficheiro, quantos são `confirmado`, `aprovado`, `colhido` ou `rejeitado`, e quantos trazem vídeo. Se o ficheiro estiver vazio (estado actual), a página diz que é o ponto de partida — não finge uma cobertura que não existe.
3. **Este aparelho** — `vs.colheita`, `vs.extra`, `vs.validar` e `vs.lacunas`, com uma frase que não deixa dúvida: não há servidor, e nada disto foi enviado para a equipa até alguém exportar.

O que a página faz, em concreto:

- **Barra + tabela do mesmo número.** Os seis estados (`a-validar`, `colhido`, `confirmado`, `aprovado`, `demonstracao`, `rejeitado`) com contagem, percentagem e a explicação de cada um. A barra é decorativa e tem um padrão próprio por segmento, para não depender da cor; os números estão na tabela ao lado.
- **Cobertura por tema**: palavras, com sinal da equipa, colhidas, a validar, demonstração e quantas aulas cobrem o tema. Temas sem aula (Demonstração, Colheita) mostram `—`.
- **Lacunas**: as palavras que o Pamosii procurou e não encontrou, ordenadas por vezes pedidas, cada uma com um atalho «Registar este sinal» para `#/colher/:palavra`. Nenhum nome ou dado pessoal entra nesta lista.
- **Quanto falta para se poder treinar uma mão** (`vs77`): um medidor com os clipes gravados **neste aparelho** contra a meta do protocolo (§9: 26 letras × 3 pessoas × 3 ângulos × 3 repetições = **702 clipes** de datilologia) e a meta de imagens por letra (§2: 300–500). Vem sempre acompanhado de uma lista do que o contador **não pode contar** — as três pessoas diferentes (não há contas nem nomes), as duas condições de luz, os três ângulos, a revisão (≈1 dia por 150 registos) e a entrega (não há upload). É o único sítio do site que fala de treino, e diz que nenhum modelo corre aqui.
- **Como um número sobe**: gravar → validar → importar (`tools/ingerir-validacoes.cjs`) → o site relê o ficheiro. O último passo é o único que muda o que a página conta.

### A folha de colheita imprimível (`#/cobertura` → «A folha de colheita»)

A cobertura responde a «quanto temos?»; a folha resolve o passo anterior — ir perguntar a quem sinaliza. É uma tabela de papel, por tema, que a equipa imprime e leva a escolas, associações e encontros da comunidade surda:

- **Um tema por folha** (`select#cov-folha-tema`), preenchido com `covFolhaTema()` a partir do mesmo `covDados()` da página: tema, palavras e estados nunca são uma segunda cópia dos números.
- **Quatro colunas**: *Palavra* · *Estado* (o rótulo de `ESTADO_GLOSSARIO`, por extenso) · *Como é que se faz?* · *Quem respondeu · onde · quando*. As duas últimas saem **vazias de propósito** — são para escrever à mão. A folha não pré-escreve uma descrição de sinal que ninguém confirmou.
- **Duas linhas de resposta por palavra**: quem sabe desenha/descreve, quem recolhe assina e data. É o formato que o protocolo (§2) pede para a descrição escrita.
- **Limite de 24 palavras por folha** (`COV_FOLHA_LIMITE`); quando o tema tem mais, a nota diz quantas **ficaram de fora** e a folha seguinte começa onde esta acabou. Silêncio sobre o que não coube seria a mesma desonestidade que inventar números.
- **A frase que impede a folha de ser lida como dicionário**: «Esta folha não ensina nada. É para perguntar. Só depois da revisão da equipa é que uma palavra passa a `confirmado`.» Também leva a data de impressão (`fmtData(new Date())`) e a contagem «N de M palavras deste tema».
- **Rodapé com o caminho de volta**: `#/colher` (registar em linha) e a explicação de que o papel só entra no site quando alguém transcrever e a equipa importar.
- O botão «Imprimir a folha» chama `window.print()`; a folha imprime em **A4, uma página, texto preto em fundo branco**, sem cabeçalho, rodapé, barra de tabs, botão de acessibilidade, selector, medidor ou qualquer outro bloco da página. A regra `@media print` esconde tudo o resto e força `table-layout:fixed` + `color:#000!important` (a especificidade de `tbody th{color:var(--ink)}` já tinha apanhado esta folha uma vez).
- **Nada é guardado nem enviado**: a folha é derivada dos dados que a página já tem; `tools/integridade-test.cjs` confirma que o bloco não tem `fetch`/`localStorage`/XHR/`sendBeacon`.

Duas regras de integridade que esta vista obrigou a tornar explícitas no código:

- **Um estado publicado sobe a entrada que já existia.** `registrarExtra()` e `indexarTermo()` comparam com `RANK_ESTADO` (`demonstracao < a-validar < colhido < confirmado < aprovado < rejeitado`) e só aceitam um estado mais forte. Sem isto, uma palavra de origem que a equipa confirmasse continuava «A validar» no dicionário e no Pamosii, e a cobertura contradizia o ficheiro. O movimento é sempre para cima: um pacote antigo não desfaz uma decisão da equipa.
- **A vista nunca promove nada.** Lê `EXTRA_PUBLICADO`, `vs.*` e o `GLOSSARIO` já carregado; não escreve estado nenhum. `tools/integridade-test.cjs` continua a falhar se alguma página escrever `confirmado`/`aprovado`/`rejeitado`.

---

## Marcação de tempos por sinal (`#/marcar`)

Para o Signer deixar de ser um boneco e passar a mostrar **o sinal real de cada palavra** é preciso saber em que segundos de cada aula ele aparece. Ninguém tem esse mapa — é trabalho de revisão, e faz-se aqui, no browser de quem revê, sem backend:

1. **Escolher a aula** (as 17 do mini-curso, com o vídeo do YouTube num reader acessível: Espaço = reproduzir/pausar, 0,5× e 1×).
2. **Marcar.** Escreve a palavra, carrega "Capturar início / fim" (ou `i` / `f` no teclado) e o tempo do leitor entra na ficha; `[` e `]` ajustam 0,1 s, `s` grava. Cada marcação fica com `estado: 'por validar'` — a ferramenta não se auto-valida, e `tools/integridade-test.cjs` falha se alguém escrever código que o faça.
3. **Guardar e exportar.** Em `vs.marcar` neste aparelho; exporta JSON (`{aula, palavra, inicio, fim, estado}`) e TXT. Nada é enviado.
4. **Ingerir (equipa).** `node tools/ingerir-marcacoes.cjs marcacoes.json --dry-run` ordena por tempo, junta duplicados da mesma palavra na mesma aula e produz os segmentos a cortar — a matéria-prima dos clipes por sinal que o Signer encadeia.

---

## Usar o Signer fora deste site (`#/fora`)

O VLibras não vive só no site do CELIB — vive na página de quem lê. Aqui há três caminhos, todos no mesmo código e nenhum com servidor:

| Caminho | Como | Estado verificado |
|---|---|---|
| **Partilhar de qualquer app** (Android) | `manifest.webmanifest` → `share_target` (GET, `title`/`text`/`url`, `action: "./"`) | Instala-se ("Adicionar ao ecrã principal") e o Pamosii aparece na folha de partilha; `iniciarApp()` detecta `?text=`, limpa o endereço com `history.replaceState` e abre `#/pamosii` com a sequência já montada — sem a pessoa reescrever nada. O `url` partilhado **não** entra na sequência (um link não é uma frase); só aparece como nota. No iPhone, onde o `share_target` não existe, a página `#/fora` diz isso e aponta para o campo do painel. |
| **Extensão Chrome** | pasta `extension/` (MV3), carregar como "descompactada" em `chrome://extensions` | `content.js` injecta o painel na página que a pessoa está a ler; `background.js` **não faz rede nem guarda dados** (verificado por `tools/integridade-test.cjs`, que também confirma que cada ficheiro declarado no `manifest.json` existe). Não imita a cara nem o estilo de uma pessoa real: mostra os mesmos glifos de estudo do site. |
| **Incorporar** | `?emb=1` num `<iframe>` (o `tools/teste-embed.html` é uma página de teste local desse canal) | Corrido num iframe real neste ambiente: texto enviado pelo pai aparece no painel e monta a sequência. Ver também a linha "Incorporada" da tabela do Signer, onde está o limite (não há lista permitida de origens). |

A página `#/fora` explica os três à pessoa que chega do dicionário ou do Signer, com o aviso de sempre: é **glosa de estudo**, não tradução automática, e continua `a validar` pela comunidade surda angolana.

---

## Alfabeto manual (`#/alfabeto`) — datilologia

Soletrar é o recurso de emergência de quem sinaliza: serve para nomes próprios e para palavras ainda sem sinal. Esta página é o primeiro produto completo do FASE 1B porque é a única coisa do site que **já existe sem inventar nada**: o Abecedário é uma das 17 aulas reais do canal oficial.

Cinco blocos, todos com o mesmo princípio — a forma da mão vem do vídeo, nunca do código:

- **A aula do Abecedário** — a fonte das formas, com fachada de vídeo acessível (reprodução só por toque) e link directo para o YouTube. Se alguma letra já tiver segundos marcados em `#/marcar`, o leitor abre nesse momento.
- **As 26 letras e o estado de cada uma** — cada cartão leva o estado que está no glossário (`a validar`, `colhido`, `confirmado`, `aprovado`, …) e o detalhe mostra a descrição que alguém registou na Colheita (configuração da mão, lugar, movimento, expressão, onde se aprendeu) mais um atalho «Registar a forma» para `#/colher/:letra`. A contagem («X de 26 letras com forma confirmada») é lida dos dados, não escrita à mão.
- **Treinar a ordem** — escreve-se um nome e a página soletra a sequência, com anterior/reproduzir/seguinte, ritmo lento/normal/rápido (`1600`/`950`/`620` ms por letra) e contador. O texto da página diz explicitamente que mostra a **ordem**, não a forma da mão.
- **Como é que uma letra deixa de estar «a validar»** — os quatro passos do fluxo real (descrever → confirmar na fila → importar → a página relê), para ninguém ficar à espera que o site promova uma letra sozinho.
- **Folha A–Z para imprimir** (`#alf-folha`) — uma folha com as 26 letras, o estado de cada uma escrito por extenso («a validar», «confirmada»…), duas linhas pautadas vazias por letra para apontar a configuração **depois de ver o vídeo**, a data em que o estado foi lido, a contagem do dicionário e, no rodapé, a aula de onde vêm as formas. É o que está no ecrã: o bloco vê-se aqui, não é uma folha escondida que só aparece na pré-visualização. O botão **Imprimir folha A–Z** chama `window.print()`, e no papel sai só a folha — o `@media print` esconde o cabeçalho da página, o aviso, o vídeo, a grelha clicável, o treino e os botões (`main:has(.alf-folha)` + `.alf-bloco:has(.alf-folha) > :not(.alf-folha)`), passa a grelha para duas colunas com `break-inside:avoid` em cada letra, e converte as caixas para preto sobre branco.

Medido com a media `print` emulada numa A4 útil (182×269 mm = 688×1017 px a 96 dpi, já com as margens de 14 mm do `@page` descontadas): a folha media **978 px de alto para 1017 px de página** — 39 px de folga, uma folha só. Com o texto do painel de acessibilidade a 150 %, a folha continua a caber na largura (641 px num papel de 673 px) porque o `zoom` inline do `#app` volta a 1 no papel. A sonda (`tools/sonda-alfabeto.cjs`, 22 casos) verifica ainda que as letras da folha são A–Z por ordem, que o estado impresso de cada letra é **o mesmo que a grelha diz** (comparação letra a letra com os `aria-label` dos cartões), que a contagem «X de 26» é a do `alfDados()` e não um número escrito, que a folha traz a data de hoje por extenso, que não há uma única `<img>` nela e que o rodapé aponta para a aula real (`https://www.youtube.com/watch?v=…`) ou diz que ainda não há aula.

**Limite honesto da folha:** hoje ela sai com as 26 letras **todas «a validar»** — `alfDados()` lê o glossário de origem (`GLOSSARIO` tema «Alfabeto», 26 termos com `estado: 'a-validar'`) e a equipa ainda não publicou nenhuma letra em `assets/glossario-extra.json`. É exactamente por isso que a folha tem linhas pautadas vazias e a frase «este site não desenha formas de mão»: impressa, ela continua a ser um guião de aula a partir do vídeo, nunca um quadro oficial de datilologia. No dia em que a equipa publicar `A`, `B`, `C` como `confirmado`, a mesma folha passa a dizer «3 de 26» sozinha.

Regra de integridade que vive no código (`tools/integridade-test.cjs` falha se for partida): **o site não desenha formas de mão**. Não há SVG de mão por letra, nem glifo inventado a partir do português — o Signer mostra a letra como glifo e remete para o vídeo. Desde a folha A–Z, o verificador (secção 16) tem cinco regras a mais, todas negativas e testadas por controlo: se existir `id="alf-folha"`, têm de continuar lá a frase «este site não desenha formas de mão», a data lida com `fmtData(new Date())`, o estado de cada letra via `ALF_ESTADO_F[x.estado]`, o espaço pautado, o «Fonte das formas:» do rodapé e um `window.print()` ligado ao `data-alf-print`; a folha `@media print` tem de esconder o resto do `#/alfabeto`, assentar as letras em duas colunas com `break-inside:avoid`, e **nunca** esconder o próprio `#alf-folha`. Retirar à mão um destes itens faz o teste falhar com a frase que ficou em falta — foi assim que ele foi validado (as três tentativas de estrago deram três falhas, e o ficheiro restaurado voltou a 0).

---

## Ouvir e ver → sinais (`#/ouvir`)

A resposta honesta ao pedido «falo, escreve e mostra-me os sinais» e «tenho um filme, quero os sinais de cada fala». A página abre no microfone, porque é o único caminho que já funciona hoje no browser, sem servidor e sem gastar dinheiro.

**Modo 1 — ditado contínuo.** Quem transcreve o áudio é o **ditado por voz do próprio browser** (`SpeechRecognition`: Chrome/Edge, e com internet, porque é o serviço do browser que transcreve). O site **não grava som, não tem `getUserMedia` nesta página, não envia nada a lado nenhum e não guarda o texto ditado em `localStorage`**. O microfone liga com um toque e desliga-se ao sair da rota (`ovSair()` no `render()`), há contador de segundos, e o ditado aparece sempre **editável**, com o aviso de que a transcrição automática erra (nomes, números, sotaque). Cada frase final vai para o mesmo motor de glosa do Pamosii e entra no painel ao vivo (últimas 8 frases), com atalho para o Signer. Se o cursor estiver dentro do campo de texto, a frase ditada é **juntada ao que a pessoa escreveu** (`ovJuntarFrase()`) em vez de a substituir — perder ditado por causa do foco seria a pior avaria possível aqui.

**Modo 2 — vídeo ou filme com legendas.** A pessoa escolhe, no próprio aparelho, o ficheiro de vídeo (`<input type="file">`, `accept` com lista explícita de tipos) e o ficheiro de legendas `.srt` ou `.vtt`. O parser lê as cues, mostra a fala que está a tocar e faz a glosa dela com o glossário; há navegação de fala em fala, saltar para a cue seguinte em paralelo com o vídeo, e o resumo de cobertura. É instantâneo mesmo num filme de duas horas e funciona sem internet, porque **as legendas já são texto transcrito por pessoas** — o site só traduz para glosa, não ouve som. Os ficheiros ficam na memória do separador e desaparecem ao sair.

**Modo 3 — o que ainda não há** (um painel com três estados «Em breve», não uma promessa):

| Falta | Porque não se finge |
|---|---|
| Transcrever o som de um vídeo **sem** legendas | exige um modelo de fala num servidor: custa dinheiro por minuto, demora, e tira do aparelho o som de terceiros sem consentimento. |
| LGA → texto pela câmara | não há dados de sinais angolanos marcados nem modelo treinável; o caminho real é Colheita → validação → marcação de tempos (`#/marcar`). |
| Avatar que faça LGA fluida | os glifos são ilustrações de estudo; nenhum avatar imita a cara, voz ou estilo de uma pessoa real sem autorização escrita prévia, e as pessoas que sinalizam têm de ser pagas. |

Regras verificadas por `tools/integridade-test.cjs`: nenhuma frase desta página pode afirmar que o site traduz fala para LGA; a página tem de manter «não grava som», o aviso de transcrição errável, os `role="status"`, o `type="file"`, as mensagens de erro do microfone (`OV_ERROS`) e os estados «Em breve»; e `ovSair();` tem de continuar no `render()`, para o microfone e o vídeo não passarem para a página seguinte.

---

## Professores — planeador de aula (`#/professores`)

O pedido de quem ensina não é «mais conteúdo», é «como é que eu monto uma aula de 45 minutos com o que existe». Esta página responde com **montagem**, não com material inventado: o planeador só usa as 17 aulas reais do mini-curso, o `GLOSSARIO` com o estado de cada sinal e as marcações de tempo feitas **neste aparelho** em `#/marcar`.

**Como se usa.** Escolhe-se tema (só os temas com palavras não-`demonstracao` aparecem no `select`), duração (**30 / 45 / 60 / 90 min**), contexto (turma inteira · aluno surdo numa turma de ouvintes · professor/a a aprender · família ou grupo pequeno), quantidade de palavras (**5 / 8 / 12**) e, opcionalmente, uma frase e o cabeçalho do plano. Cada campo redesenha o plano (`#prof-live`, `role="status"`, diz em voz alta o que mudou).

**O que sai.** Uma lista numerada de blocos com minutos e «aos N min»: acolhimento só em sinais (5 min, com atalho para ver os sinais de entrada no Signer), ver a aula do tema, as palavras novas **com o badge de estado cada uma** e a hora do sinal quando já foi marcada, prática com o Pamosii (ou a glosa da frase escrita, com o aviso de que é material de estudo e não tradução aprovada), datilologia — ou «Treino em pares» quando o tema é o Alfabeto — (3 min) e fecho e lacunas (4 min). Os minutos dos três blocos centrais dividem-se pelo que sobra da duração com o **método do maior resto** (`profMinutos`), por isso a soma nunca é 43 numa aula de 45 — medido a 30, 45 e 90 min. Botões **Copiar plano**, **Descarregar .txt** (`pamosii-aula-<tema>-<dur>min.txt`) e **Imprimir plano**: o ficheiro leva os blocos, a lista de palavras com estado, os links do YouTube, a checklist marcada e um parágrafo final «O que este plano não é…».

**Estados honestos.** Cinco cartões de recursos: três `Disponível` (aulas de referência, planos por tema, listas com estado de validação) e dois `soonBadge()` (cartões/fichas ilustradas e orientações de acessibilidade para a escola) — nada de ficheiros falsos para descarregar. A nota fixa da página lembra que quem sinaliza tem de ser pago e aponta para `#/contacto`.

**Impressão — o plano vai para a parede da sala.** Um plano que só existe num ecrã de telemóvel não se usa numa sala de aula cheia, por isso o planeador tem o terceiro botão, **Imprimir plano**, que chama mesmo `window.print()` (medido: 1 chamamento por clique, sem mudar de rota). A secção 25 de `styles.css` (`@media print` + `@page{margin:14mm}`) faz quatro coisas, todas verificadas com a media `print` emulada:

- **esconde a interface**: cabeçalho, rodapé, barra inferior, painel de acessibilidade, Signer flutuante, fachadas de vídeo, `iframe`, todos os `button` e o formulário do planeador. No papel só fica o plano. Medido selector a selector — e só conta o que estava visível no ecrã, porque a barra inferior, por exemplo, já não aparece em janela larga;
- **volta tudo a preto sobre branco**: os tokens (`--ink`, `--primary`, `--surface`, …) são reescritos dentro do bloco `print` para as três combinações de tema (claro, escuro, contraste alto), e as classes que no ecrã são cor preenchida com texto claro (`.btn`, `.chip`, `.band`, `.prof-num`, `.vlink`, …) passam a fundo branco com texto preto. Isto não é cosmético: o Chrome não pinta fundos em papel a menos que a pessoa ligue «background graphics», por isso um botão `.btn-a` de fundo âmbar com texto escuro imprimir-se-ia como **texto branco sobre branco**. Foi exactamente o que a primeira medição apanhou (contraste `1:1` em quatro links-botão do plano);
- **não leva o zoom do painel**: a escala de texto do painel de acessibilidade é um `zoom` em **estilo inline no `#app`**, por isso `html,body{zoom:1}` não a anulava. `#app{zoom:1!important;--escala:1!important}` anula. Verificado com o controlo negativo: sem a regra, com texto a 150% o `#app` ia para o papel com `zoom 1,5` e o plano media 1 477 px para um papel de 985 px;
- **os links sobrevivem ao papel**: `main a[href^="https://"]::after{content:" (" attr(href) ")"}` escreve o endereço por extenso depois do texto, por isso «Abrir no YouTube» traz o `watch?v=` de cada aula, e a lista `ANTES DE COMEÇAR` mantém as caixas `[x]`/`[ ]` visíveis com `print-color-adjust:exact`. Tipografia em `pt` (título 20, blocos 15, texto 11/1,5) e `break-inside:avoid` nos blocos, para nenhum bloco se partir a meio entre duas folhas.

O cabeçalho escrito no campo «Cabeçalho do plano» é o primeiro elemento do plano impresso — e vai também na segunda linha do texto que se copia ou descarrega, medido com `Escola Primária 45 · Luanda · 3ª classe`.

**A segunda folha que sai do site é a A–Z.** O mesmo bloco `@media print` passou a servir o `#/alfabeto`: lá, em vez de esconder controlos à volta do conteúdo, ele esconde **tudo** excepto a folha (`main:has(.alf-folha) .page-head / .note-band / .alf-bloco:not(:has(.alf-folha))` e `.alf-bloco:has(.alf-folha) > :not(.alf-folha)`), porque imprimir o `#/alfabeto` sem isto dava duas páginas e meia de vídeo, grelha clicável e treino para quem só queria o quadro das letras. Verificado selector a selector com a media `print` emulada: o que estava visível no ecrã (`#alf-aula-sec`, `#alf-grade`, `.alf-ac` com o botão, `#alf-treino`, `.note-band`, `.page-head`) passa a `display:none`, e `#alf-folha` continua visível com as 26 letras. Detalhe de impressão que a primeira medição rebentou: com a janela de papel em 688 px, o `@media (max-width:720px)` do telemóvel **ainda se aplicava** e punha as letras numa coluna — 2 447 px de alto, três folhas. O bloco `print` passou a ter a grelha de duas colunas explícita e tamanhos em `mm`/`pt` (caixa da letra 10 mm, linhas pautadas 5 mm, texto 8–9 pt), e a folha ficou em 978 px numa página de 1017 px.

**Limite honesto:** o que se mediu foi a folha `print` renderizada no DOM com a media emulada (geometria, visibilidade, contraste) e o chamamento de `window.print()`. Não se mediu o PDF final de cada browser nem impressoras reais — o resultado depende do diálogo de impressão do aparelho, e «graphics de fundo» continua a ser escolha de quem imprime (por isso nada no plano depende de um fundo pintado).

**Regra de integridade** verificada por `tools/integridade-test.cjs`: o bloco do planeador **não pode** fazer `fetch`, escrever em `localStorage`, `sendBeacon`, `XMLHttpRequest` nem `indexedDB`; tem de dizer que «não foi revisto por uma pessoa surda», que só `confirmado`/`aprovado` se ensinam como LGA, que não substitui um intérprete, e que o site não guarda nada; tem de manter os dois botões de exportação, o `role="status"`, o `for="prof-tema"`, o `soonBadge()` e as ligações ao dicionário e à Colheita. Desde esta entrega, se existir o botão `data-prof-print`, o verificador exige que ele chame `window.print()` e que a folha `@media print` esconda `.tabbar`, `.site-head`, `.site-foot`, `.sg-fab`, `.sg-painel` e `#a11y-root`, anule a escala no `#app` com `!important`, converta `.btn` e as etiquetas de cor preenchida em preto sobre branco, escreva os endereços dos links com `attr(href)` e continue a partir os blocos limpiamente — um botão de imprimir que não imprime, uma folha que leva a barra inferior para o papel, ou uns botões que se imprimem em branco sobre branco, passam a falhar o teste em vez de passar despercebido.

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

### De onde vem a identidade visual — e o que não foi possível confirmar

A pele pública actual é uma **reinterpretação** do esqueleto da Open Minds Academy (`open-mind-academy.vercel.app`): herói escuro com manchas SVG, pílula de etiqueta, cartões flutuantes, faixa de confiança, carris de cartões, faixa escura com objectivos e passos, par de promoções e rodapé em coluna. O que **não** foi copiado foi a cor: violeta/azul-marinho/chama do original deram lugar ao **verde-azulado, âmbar e creme** que a Viva Surdo já usava neste projecto.

**Limite honesto, registado em vez de disfarçado:** não foi encontrado nenhum manual de marca, logótipo ou paleta oficial da Viva Surdo publicamente verificável (site, redes ou materiais da UNICEF). A paleta teal/âmbar/creme é a que já estava no repositório e a que os canais da iniciativa usam nas peças públicas observadas; não é uma amostra oficial. A UNICEF aparece **apenas** como fonte da notícia sobre o Desafio Genial (Abril de 2025) e **nunca** como operadora, patrocinadora ou autora do site. Nenhum logótipo da UNICEF, da Viva Surdo ou de terceiros foi desenhado, redesenhado ou imitado: a marca do cabeçalho continua a ser a provisória descrita abaixo.

Os tokens ficam todos em `:root` (`--teal`, `--teal-deep`, `--amber`, `--cream`, `--ink`, `--line`): trocar a paleta por valores aprovados é editar essas linhas, sem tocar no HTML.

### A marca provisória

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
- Navegação completa entre as 18 páginas do menu: no telemóvel os quatro destinos principais vivem numa **barra fixa no fundo do ecrã** (tipo app) e o 5.º botão, "Mais", abre o mesmo menu completo; em tablet/desktop a barra de topo mostra os **12 rótulos não-`extra`** (Início, Cursos, Aprender, Alfabeto, Pamosii, Ouvir, Dicionário, Professores, Biblioteca, Bíblia, Sobre, Contacto — medidos a 1281/1366/1440px: 1 linha, 68px, 22px de folga), e os seis itens de trabalho (`extra`: Evangelismo, Colheita, Validação, Cobertura, Marcação, Fora deste site) ficam no painel "Mais"/hambúrguer, onde continuam acessíveis em qualquer largura. `styles.css` esconde os `.nav-extra` **só** acima de 1280px — nada fica inacessível no telemóvel. Tudo operável por teclado. O item "Pamosii" da barra inferior usa o **boneco do Signer** em vez de um ícone genérico, parado (um ícone em movimento na navegação distraía do próprio Signer).
- Catálogo com pesquisa e filtro, sem conteúdo fictício.
- Reprodução das 17 aulas reais de LGA (leitor YouTube carregado a pedido do utilizador).
- Biblioteca pesquisável com itens reais e planeados.
- **Dicionário português ↔ LGA** pesquisável, com estado de validação visível em cada entrada, mini-glifo por palavra e atalho "Registar este sinal" quando a procura não encontra nada.
- **Pamosii** (`#/pamosii`): glosa de uma ou várias frases com vídeo real por sinal e glifos vectoriais animados, modo de datilologia, ditado por voz, sequência de sinais → frase escrita e falada, e módulo de câmara para gravar/rever/capturar. Ver secção própria.
- **Alfabeto manual** (`#/alfabeto`): as 26 letras com o estado de cada uma, a aula real do Abecedário, registo da forma a partir da Colheita, treino da soletração com ritmo e **folha A–Z imprimível** numa só página de A4 (estado de cada letra + linhas pautadas + data + fonte das formas). Não desenha formas de mão que ninguém confirmou. Ver secção própria.
- **Ouvir e ver → sinais** (`#/ouvir`): ditado contínuo pelo serviço do browser (sem gravar som, sem rede própria, texto sempre editável) e leitura de um vídeo/filme local com legendas `.srt`/`.vtt`, com a glosa da fala que está a tocar; painel explícito do que ainda não há. Ver secção própria.
- **Professores — planeador de aula** (`#/professores`): escolhe tema, duração (30/45/60/90 min), contexto e número de palavras, e recebe a aula montada em blocos com minutos, as aulas reais do tema, o vocabulário com o **estado de validação à vista**, a glosa da frase escrita e os atalhos para o Signer, dicionário, Pamosii, Colheita e Marcação. Copia-se, descarrega-se em `.txt` ou **imprime-se** numa folha A4 (folha `@media print`: só o plano, links por extenso, escala de texto anulada no papel). Não escreve nada em `localStorage` nem pede dados. Ver secção própria.
- **Pamosii Signer**: leitor de sinais flutuante em todas as páginas, com figura animada por família de movimento, velocidade, transporte por teclado e convite directo para registar a palavra que falta. Ver secção própria.
- **Bíblia** (`#/biblia`) com texto real de Almeida e glosa versículo a versículo; **Evangelismo** (`#/evangelismo`) com roteiros e cada frase sinalizável; **modo de teste em Libras** (VLibras, opt-in, claramente rotulado como brasileiro).
- **Colheita participada** (`#/colher`): backlog de palavras sem sinal, formulário dos campos do protocolo, fotografias locais, **sessão de gravação guiada** (consentimento → 3 repetições naturais + 1 lenta, sem áudio, quadros + clipes na memória) e **verificador de qualidade do quadro** (luz, contraste, nitidez e movimento medidos ao vivo, com o resumo a sair no JSONL como `qualidade`), exportação JSON/TXT/JSONL e ingestão por `tools/ingerir-colheita.cjs`.
- **Pele pública revista (`vs82`)**: o esqueleto de página foi refeito a partir do da Open Minds Academy — herói escuro com manchas SVG, pílula de etiqueta, cartão de pré-visualização com dois selos flutuantes, faixa de confiança com três promessas, carril de aulas e carril de percursos, faixa escura larga com seis objectivos e quatro passos, par de promoções e rodapé em coluna — com a paleta da Viva Surdo (teal/âmbar/creme) e a marca `Agatha`. Botões «autocolante» com sombra sólida e afundamento ao premir, cabeçalho com barra de cor e chip do logótipo. O conteúdo, as rotas, os `id` e as funções não mudaram com a pele; só o `shell()` e o CSS. Ver "Substituir a marca provisória" para o limite de verificação da marca.
- **Folha de colheita imprimível** (`#/cobertura`): uma tabela A4 por tema, com as palavras, o estado de cada uma e duas colunas vazias para a comunidade preencher à mão («Como é que se faz?», «Quem respondeu · onde · quando»), limitada a 24 palavras com aviso do que ficou de fora. A frase «Esta folha não ensina nada» impede que o papel seja lido como dicionário. Ver secção própria.
- **Painel de acessibilidade** (tamanho de texto, contraste alto, tema escuro, movimento reduzido, leitura simples, leitura em voz alta) — ver secção acima.
- **Modo aplicação**: instalável ("Adicionar ao ecrã principal") e **a funcionar sem rede** — as rotas, o dicionário, a glosa do Pamosii, a Bíblia e a frase falada abrem com o servidor desligado (ver "Modo aplicação").
- Metadados por página (`title`, `description`, `og:*`).
- **Experiência de telemóvel tratada como app** (sem framework, sem build): **barra de navegação no fundo do ecrã até 720px** (Início · Aprender · Pamosii · Dicionário · Mais), com estado actual em âmbar e `aria-current`; o "Mais" controla o mesmo painel do hambúrguer (`aria-controls="nav-links"`), e por isso o hambúrguer do cabeçalho fica escondido no telemóvel — um interruptor, não dois. Gaveta de navegação em cartão (não uma faixa esticada) entre 721px e 1280px; filas de filtros em *scroll-snap* horizontal em vez de cinco linhas que empurram o conteúdo; pré-visualização da câmara a 3/4 em pé e 4/3 deitado; `viewport-fit=cover` com `env(safe-area-inset-*)` no cabeçalho fixo, no menu, no botão de acessibilidade e na barra inferior; `text-size-adjust:100%`, `touch-action:manipulation` e `-webkit-tap-highlight-color:transparent`; bloco próprio para ecrãs de pouca altura (`max-height:470px`); `preconnect`/`dns-prefetch` para `i.ytimg.com` e `youtube-nocookie.com`, e `decoding="async"` nas miniaturas.
- Acessibilidade de base: skip-link, HTML semântico, foco visível, `aria-current`, `<details>` nativo nos módulos, alvos de toque ≥44px (também os botões pequenos, a partir de 720px), `prefers-reduced-motion` e desligador manual de animação (os glifos param), ordem de títulos verificada, conteúdo duplicado do ponto de vista de quem ouve (cartões e sequência) marcado `data-no-read`, imagens decorativas `alt=""`.

### "Em breve" por decisão (estados honestos, sem simulação)
- **Contas e progresso** — não há backend nem autenticação; nenhum botão de registo é mostrado.
- **Inscrição formal em cursos** — o mini-curso é livre; a inscrição com progresso será anunciada quando existir.
- **Certificados** — nenhuma emissão nesta fase; dito explicitamente na página do curso.
- **Pagamentos** — nada de preços inventados; nenhum fluxo de pagamento existe.
- **Tradução automática fala ↔ LGA** — não existe tecnologia validada; o Pamosii faz glosa de estudo e o dicionário é glossário. Ambos o dizem ao utilizador.
- **Bíblia em LGA** — não existe (verificado em Outubro de 2026, inclusive no YouTube: só há Libras e ASL). O site dá texto português real + glosa derivada do glossário, e guarda um bloco reservado para "Bíblia em sinais", com "Em breve".
- **Avatar 3D que sinalize LGA** — o Pamosii Signer é o protótipo com os glifos que existem; um avatar que sinalize LGA de verdade precisa do mesmo corpus de vídeo angolano que ainda não foi gravado. Não há animação que faça de conta que sabe LGA: o boneco mostra a *família de movimento* e o aviso diz isso na página.
- **Colheita validada automaticamente** — os registos entram como `colhido`; só a equipa (com um revisor surdo) promove a `confirmado`. O site nunca mostra um registo da comunidade como LGA confirmada.
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
node tools/engine-test.cjs  # frases de exemplo no motor de glosa (exit 0 = OK)
node tools/integridade-test.cjs      # lê app.js/index.html/sw.js/extension e falha se alguma
                              # interface prometer o que o código não faz (claims, links mortos,
                              # chaves, versão do casulo, invariante das marcações e das sessões)
node tools/ingerir-colheita.cjs tools/exemplos/sessoes-exemplo.jsonl --dry-run
node tools/ingerir-validacoes.cjs tools/exemplos/validacoes-exemplo.jsonl --dry-run
node tools/auditoria-visual.cjs      # abre o Chrome instalado em headless (CDP, sem dependências)
                              # e mede as 19 rotas: scroll horizontal, alvos <24px e contraste
                              # (<4,5:1, ou 3:1 em texto grande). Flags: --rotas=/validar,/colher,
                              # --largura=, --altura=, --escala=150, --tema=claro|escuro|alto,
                              # --pre=<expressão JS> (abre um painel escondido antes de medir),
                              # --media=print (mede a FOLHA DE IMPRESSÃO: 794×1123 é uma folha A4
                              # a 96 dpi; os alvos de toque não se aplicam ao papel e são ignorados)
node tools/make-icons.cjs   # regenera os PNG do manifest a partir da marca (sem dependências)
node tools/sonda-professores.cjs --porta=5307
                              # corre o planeador de #/professores no Chrome por CDP: 45 casos
                              # (minutos que batem certo, tema de demonstração de fora, quantidade
                              # limitada ao glossário, glosa «a validar», copiar/descarregar, o botão
                              # de imprimir a chamar window.print(), e o que sobe e o que desce com a
                              # media «print» emulada) e falha se algo for prometido e não acontecer,
                              # ou se a consola falar
node tools/sonda-alfabeto.cjs --porta=5308
                              # o mesmo harness CDP para a folha A–Z do #/alfabeto: 22 casos
                              # (as 26 letras por ordem, o estado de cada letra igual ao da grelha,
                              # a contagem lida de alfDados(), a data de hoje, as linhas pautadas,
                              # nenhuma <img> na folha, o botão a chamar window.print(), e o papel:
                              # o que desaparece, o que fica, e se a folha cabe numa página de A4)
node tools/sonda-cobertura.cjs --porta=5309
                              # a folha de colheita do #/cobertura no Chrome por CDP: 26 casos
                              # (a folha existe, o tema escolhido manda nas linhas e no rótulo de
                              # estado, as duas colunas de resposta vazias, a frase «Esta folha não
                              # ensina nada», a data de hoje, a contagem «N de M», o aviso do que
                              # ficou de fora, o atalho para #/colher, o selector só com temas com
                              # lacunas, impressão a chamar window.print() uma vez, mudança de tema a
                              # redesenhar a folha e a região viva, e no papel: cabe numa A4, texto
                              # preto, células de escrita ≥20px, e o zoom a 150% não a estoura)
node tools/serve.cjs        # http://127.0.0.1:8123 — URL estável usado nestes testes
```

Depois de mexer em `app.js`, `styles.css` ou `sw.js`: **mexer na versão do casulo** (`VERSAO` em `sw.js` e o `?v=` em `index.html`, sempre em par), senão o browser continua a servir o ficheiro velho — foi precisamente assim que uma edição da sessão pareceu não ter efeito nenhum. Para testar sem o service worker no meio: `evaluate` → `getRegistrations()`/`unregister()` + apagar as caches, e recarregar.

Teste manual recomendado: navegar por todas as rotas, abrir pelo menos um vídeo em cada página, pesquisar no catálogo/biblioteca/dicionário, escrever uma frase no Pamosii (e outra com "Soletrar letras"), gravar um clipe de 5s e rever a 0,5×, e percorrer o site apenas com o teclado (Tab/Enter/Escape no menu móvel, na barra inferior — incluir o "Mais" — e no painel de acessibilidade). Para o offline: abrir o site uma vez com rede, depois desligar a internet (ou desligar o servidor de teste) e recarregar — as páginas, o dicionário e o Pamosii devem responder, e um vídeo deve mostrar o aviso de "precisa de rede" em vez de um leitor em branco. Para a instalação: no Chrome de telemóvel, menu → "Adicionar ao ecrã principal"; o ícone e o nome vêm do `manifest.webmanifest`.

Verificado nesta entrega (medição no browser em `http://127.0.0.1:8123`; telemóvel 320px / 360px / 390px, tablet 1012px, e escala de texto do painel de acessibilidade a 100% / 130% / 150%):

- **As 17 rotas de `tools/auditoria-visual.cjs`** medidas a 320×640 com texto a 150% (claro) e a 390×844 (escuro) — mais `#/cobertura` em contraste alto a 150%: `scrollWidth − clientWidth = 0`, 0 alvos abaixo de 24×24 e 0 falhas de contraste em todas. A ferramenta é nova nesta entrega porque o Chrome de depuração deste ambiente deixou de responder a meio da sessão: passou a falar CDP directo com o Chrome instalado (Node 24 traz `WebSocket` global), sem `puppeteer` nem dependências.
- **As 19 rotas medidas em papel** (`tools/auditoria-visual.cjs --media=print`, folha A4 = 794×1123 px a 96 dpi): `scrollWidth − clientWidth = 0` e **0 falhas de contraste** nas 19. `#/professores` foi medida com o cabeçalho escrito e um tema escolhido; depois repetiu-se `#/professores`, `#/cobertura` e `#/dicionario` a **150% de texto com contraste alto** — o `zoom` computado do `#app` é `1` no papel e `1,5` no ecrã, medido pela ferramenta (que passou a ler `getComputedStyle`, porque o valor inline não diz o que é renderizado). Os alvos de toque são propositalmente ignorados com `--media=print`: não há toque numa folha.
- **Dois bug apanhados por esta medição e corrigidos.** (1) Quatro links-botão do plano («Registar o que faltou», «Ver as aulas», «Ver o dicionário», «Falar com a Viva Surdo») davam contraste **1:1 no papel**: eram texto claro sobre cor preenchida, e o Chrome não pinta fundos em impressão a menos que a pessoa ligue «graphics de fundo» — ou seja, imprimiram **branco sobre branco**. As classes de cor preenchida (`.btn`, `.chip`, `.f-chip`, `.dic-badge`, `.mk-chip`, `.soon`, `.eyebrow`, `.pm-mode`, `.pm-num`, `.mod-n`, `.band`, `.vlink`) passaram a fundo branco com texto preto e borda. (2) A escala de texto do painel ia toda para o papel: `html,body{zoom:1!important}` não toca no `zoom` em **estilo inline no `#app`** que `aplicarPrefs()` escreve. Confirmado por controlo negativo — sem `#app{zoom:1!important;--escala:1!important}`, com 150% o `#app` chegava ao papel com `zoom 1,5` e o plano media **1 477 px num papel de 985 px**; com a regra, 939 px.
- **O botão «Imprimir plano» medido selector a selector** (`tools/sonda-professores.cjs`, que passou a 45 casos com a media `print` emulada): `window.print()` é chamado **exactamente uma vez** por clique e a rota não muda; `.site-head`, `.site-foot`, `.sg-fab`, `.prof-ac` e `#prof-tema` estão **visíveis no ecrã e escondidos no papel** (a `.tabbar` ficou de fora da asserção porque a 1000 px já não aparece no ecrã — a sonda só compara o que estava visível); `#prof-plano` sai inteiro, com **6 blocos e 1 617 px de altura**; o link `.vlink` da aula continua no papel; o cabeçalho escrito é o **primeiro** elemento do plano e a **segunda** linha do texto copiado/descarregado. O que isto **não** prova: o PDF final de cada browser e as impressoras reais — foi a folha `@media print` renderizada no DOM, com `window.print()` interceptado porque o Chrome `headless` não tem diálogo de impressão.
- **A folha A–Z impressa, à medida (2026-10-25, `vs80`)** — `tools/sonda-alfabeto.cjs` (ferramenta nova, 22 casos, 0 falhas, consola silenciosa) mede-a no ecrã e no papel. No ecrã: as letras da folha são `ABCDEFGHIJKLMNOPQRSTUVWXYZ` por ordem, cada uma com estado escrito (0 vazias, 0 «undefined»), **52 linhas pautadas** (2 por letra), **zero `<img>`** dentro da folha, a frase «este site não desenha formas de mão» presente, a data de hoje por extenso («a 25 de outubro de 2026»), a contagem «**0** de 26» igual a `alfDados().confirmadas`, e o estado de cada letra **identico ao do `aria-label` do cartão correspondente** na grelha (comparação letra a letra, 0 divergências). O clique no botão chama `window.print()` 1 vez e escreve a explicação no `#alf-live`. No papel (688×1017 px = A4 útil com as margens de 14 mm): `.page-head`, `.note-band`, `#alf-aula-sec`, `#alf-grade`, `.alf-ac` e `#alf-treino`, que estavam todos visíveis no ecrã, passam a escondidos; `#alf-folha` fica com as **26 letras**, medidas **978 px de alto para uma página de 1017 px (39 px de folga)** e 641 px de largura para 673 px; as caixas das letras saem a `rgb(0, 0, 0)`. Com texto a 150% (escrita em `localStorage` de propósito, apagado no fim — a sonda fecha a verificar que o aparelho fica com **0 chaves**), o `zoom` do `#app` volta a `1` no papel e a folha continua dentro da largura. O primeiro valor medido foi **2 447 px**, três folhas: o `@media (max-width:720px)` de uma coluna aplicava-se à janela de 688 px do papel, pelo que a folha `print` passou a fixar duas colunas e a encolher caixa, pauta e texto. Depois disto, e antes da republicação, as 19 rotas voltaram a ser auditadas em papel (0 problemas), a 320×640 com texto a 150% (0 problemas) e a 1366×900 (0 problemas).
- **A folha de colheita impressa, à medida (2026-10-26, `vs82`)** — `tools/sonda-cobertura.cjs` (ferramenta nova, 26 casos, 0 falhas, 0 erros de consola). No ecrã: a folha existe, o tema escolhido manda nas linhas e no rótulo de estado (comparado palavra a palavra com `covFolhaTema(covDados(), tema)`), as 24 linhas trazem as duas células de resposta **vazias**, a frase «Esta folha não ensina nada» está presente, a data é a de hoje por `fmtData(new Date())`, a contagem é «N de M» e, quando o tema tem mais palavras do que o limite, a nota di-lo com o número que ficou de fora. O selector lista só temas com lacunas, o atalho leva a `#/colher`, o botão chama `window.print()` **1 vez**, e mudar de tema redesenha a folha e escreve na região viva. No papel (688×1017 px = A4 útil com margens de 14 mm): a folha fica **641×898 px**, com o mesmo número de linhas do ecrã, texto a `rgb(0, 0, 0)`, células de escrita com **29 px** de altura, e o cabeçalho, rodapé, barra de tabs, botão de acessibilidade, medidor e selector todos escondidos. A 150% de texto, o `#app` volta a `zoom 1` no papel e a folha mede **656 de 688 px** de largura — cabe. A sonda fecha a confirmar que o `localStorage` ficou **sem chaves** (o teste não semeia dados persistentes no aparelho).
- **A pele nova medida, não apenas vista (2026-10-26, `vs82`)**: as 19 rotas a 1366×900, e a inicial a 320×640 com texto a 150% nos três temas (claro, escuro, contraste alto), deram `scrollWidth − clientWidth = 0`, 0 alvos abaixo de 24×24 e 0 falhas de contraste. Dois defeitos foram apanhados por esta medição e corrigidos: os quatro passos dentro da faixa escura ficavam com texto branco sobre cartão branco (**1:1**) porque `.band p` ganhava a `.step p` — os passos passaram a vidro translúcido com tinta clara e número âmbar; e o texto do herói tocava a margem do ecrã no telemóvel (h1 a `x=0`) porque `.hero-in` e `.wrap` eram o mesmo elemento — passaram a pai/filho, medido a 16 px a 390 px. Os dois selos flutuantes do herói também tapavam o rótulo e a nota do cartão; foram movidos para fora do cartão (f1 até 229 px, cartão começa a 236; f2 começa a 531, cartão acaba a 527).
- **Terceiro defeito, só visível no papel**: a auditoria a `--media=print` apanhou **7 falhas de contraste no papel** na página inicial (herói, cartão «Tradutor Pamosii», os quatro passos e «Abrir →»). A causa é a mesma de sempre — o Chrome não pinta fundos em impressão — mas agora com outra origem: o `a{color:#000!important}` do bloco de impressão herdava para dentro das superfícies escuras da pele nova (herói, cartões escuros, promoções), ficando preto sobre o preto de `--teal-dark`. A correcção força essas superfícies a papel branco com tinta preta e borda, tal como já se fazia com `.band`. Re-medido: **19 rotas a 794×1123 px (A4 a 96 dpi) em `print`, 0 problemas**.
- **A folha e o alfabeto na consola**: as duas sondas de impressão fecharam com a consola silenciosa (0 erros em 26 e em 22 casos, com o service worker a controlar a página). O que isto **não** prova: que a paleta corresponde a um manual de marca da Viva Surdo — não foi encontrado nenhum publicamente verificável (ver "De onde vem a identidade visual").
- **`#/validar` com dados reais na fila** (três registos, um deles com sessão de 4 repetições × 3 quadros): o filtro «À espera» → 2 cartões, «Já validei» → 1, «Tudo» → 3, com foco devolvido ao chip e aviso `role="status"` («A mostrar 2 sinais à espera.»); veredicto registado → contagens `1 Correcto · 1 Variante regional · 0 Errado`, medidor «2 de 3 sinais têm veredicto neste aparelho · 1 à espera», foco no botão carregado e `aria-pressed` só nesse; nota escrita → normalizada (`no Namibe fazem a palma virada para fora`) e lida de volta **depois de recarregar**; carregar no mesmo veredicto → retirado (contagens voltam a 1/0/0, foco no primeiro botão do cartão); «Apagar» → confirmação, `vs.validar` removido e mensagem «Apagado 1 veredicto».
- **Pacote da equipa largado em `#/validar`** (3 linhas JSONL: 2 repetições de uma palavra nova + 1 linha `estado:'aprovado'`): entraram as 2 repetições como «manga · 2 repetições · 0 quadros · 8 segundos · origem: pacote da equipa», a linha já aprovada foi ignorada (a fila só julga `colhido`), o `input` volta a vazio e nada foi guardado no `localStorage`.
- **Exportação real capturada** (blob interceptado antes do download): `pamosii-validacoes-2026-10-24.jsonl`, `application/x-ndjson;charset=utf-8`, 2 linhas com `schema:1`, assinatura, região, data e nota. O ficheiro foi escrito em disco e passado por `tools/ingerir-validacoes.cjs`: `colhido → confirmado` nos dois termos, `variantes: ["Huíla — Lubango: no Namibe fazem a palma virada para fora"]`, e uma segunda execução não mexeu em nada («já está em confirmado, estado não desce») nem duplicou a nota de proveniência.
- **Bug apanhado por esta medição e corrigido:** as contagens do cabeçalho da fila liam `.veredicto` de um registo de sinal (que não tem esse campo) e mostravam sempre `0 Correcto / 0 Variante regional / 0 Errado`. Passaram a contar os veredictos, não os sinais.
- **`#/cobertura` medida com e sem dados:** em repouso mostra `236` palavras (`203` ligadas às aulas + `33` de demonstração), todos os estados a zero excepto «A validar 203 / 86%» e «Demonstração 33 / 14%», e o bloco «O que a equipa publicou» diz que o ficheiro está vazio. Com um pacote local que traz `água` como `confirmado`, a palavra passa a «Confirmado» no **dicionário** (antes continuava «A validar») e a cobertura conta `1` confirmada, `202` a validar e `1` em «Comida e bebida» — o ficheiro de dados não foi tocado. **Re-medido a 2026-10-25 com o aparelho limpo** (foram apagados os dois fixtures de teste que esta sessão tinha semeado, `vs.extra` com a letra `C` e `vs.lacunas` com `vai`): `A validar 203 / 86%`, `Demonstração 33 / 14%`, tudo o resto a zero, `#/alfabeto` a ler «0 de 26 letras com forma confirmada · 0 com descrição registada». Os números que a pessoa vê são os do glossário de origem, não os de um teste.
- **Frescura do desenho:** a cobertura e o dicionário desenham-se antes de `assets/glossario-extra.json` chegar (o `fetch` é assíncrono). Quando os estados entram, `carregarGlossarioExtra()` redesenha só essas duas vistas — sem isso, a primeira visita mostrava sempre o glossário de origem e parecia que o ficheiro publicado estava a ser ignorado.
- **`#/alfabeto` e `#/ouvir` ao navegador (2026-10-25, `vs76`):** as duas rotas novas medidas por `tools/auditoria-visual.cjs` a 320×640 com texto a 150% nos três temas (claro, escuro, contraste alto) e a 1366×900 — `scrollWidth − clientWidth = 0` em todas as seis execuções, 0 alvos abaixo de 24×24, 0 falhas de contraste. Os painéis escondidos do `#/ouvir` (legendas, «O que ainda não há», ditado) foram medidos com o novo `--pre=<expressão>` da ferramenta, que abre o painel antes de medir — o que está escondido não se audita. Em 1366–1440px a barra de topo continua com **12 itens numa linha de 68px** com 22px de folga, com `flex-wrap` a não disparar.
- **Ditado por voz verificado ao nível dos gestores** (o `SpeechRecognition` real deste ambiente responde `not-allowed`, por isso chamou-se `rec.onresult`/`rec.onend` com o formato que o browser usa): frase final → entra no painel ao vivo e no campo editável, com o aviso «Confirma o texto — nomes e números costumam errar»; resultado parcial → só o `interim`; quatro silêncios seguidos → o ditado pára sozinho; sair da rota → `ovSair()` desliga o microfone. **Bug apanhado por esta verificação e corrigido:** com o cursor dentro do campo de texto, a frase ditada era posta no estado e não no campo — ouvia-se e não se via. Passou por `ovJuntarFrase()`, que junta a frase ao que a pessoa escreveu e devolve o cursor ao fim (medido: `Chamo-me Ana Bom dia!`, cursor na posição 21).
- **Legendas verificadas com ficheiros reais** (`filme.srt` e `filme.vtt` carregados por `DataTransfer`, sem rede): três cues analisadas, glosa por fala, salta de fala em fala com as setas, sincronização pelo tempo do leitor quando há vídeo, e — quando só há legendas sem vídeo — a página mostra logo a primeira fala em vez de «Sem fala» e o estado diz «falta o ficheiro do vídeo para sincronizar».
- **Planeador de `#/professores` corrido no browser (2026-10-25, `vs78`)** — sonda CDP com 29 casos, **0 falhas e 0 erros de consola**, cada caso a mexer num controlo e a ler o DOM resultante: 30, 45 e 90 min escolhidos dão planos cuja soma dos blocos **bate certo** com a duração (o bug apanhado ainda antes de montar a página era este — os minutos do vídeo eram contados duas vezes e uma aula de 30 min fechava em 22); `Demonstração` não aparece no `select` (13 temas, todos com pelo menos uma aula ligada — por isso o ramo «Sem aula ligada a este tema» está escrito mas nunca dispara com os dados de hoje); pedir 12 palavras no tema «Diálogos», que só tem 4, dá **4 cartões** e o plano avisa que o tema tem menos; cada palavra leva o seu `.dic-badge` de estado; escrever «Onde fica a escola?» produz «Glosa (a validar): ONDE-FICA? · ESCOLA» e o botão leva a frase para o Pamosii (medido: `#/pamosii` com `pmEstado.texto` = «Onde fica a escola?»); o tema Alfabeto troca a datilologia por «Treino em pares» e o plano soletra `A B C D E F G H`; os quatro contextos mostram a sua nota, e o da turma inclusiva avisa que **não substitui um intérprete** (no bloco) e que **não interpreta a aula** (nos avisos); o texto exportado lido directamente de `profTextoPlano()` tem 3.285 caracteres, diz «não foi revisto por uma pessoa surda», traz a checklist em `[x]`/`[ ]` e **não leva uma única etiqueta HTML**; «Copiar plano» e «Descarregar .txt» correm sem erro. **`Object.keys(localStorage)` igual antes e depois dos 29 casos** — a página não escreve nada no aparelho.
- **Auditoria visual com o planeador cheio** (não com a página em repouso): `/professores` medido a 320×640 e texto a 150% nos três temas (claro, escuro, contraste alto) e a 390×844 a 150% em escuro e contraste alto — `scrollWidth − clientWidth = 0`, 0 alvos abaixo de 24×24, 0 falhas de contraste; e as 19 rotas voltaram a passar limpas a 1366×900 (100%) e a 320×640 (150%). Dois alvos corrigidos por esta medição: o `input type="text"` do planeador media 21 px de altura (a regra `.f-field` só apanhava `type="search"`) — passou a 46 px com as mesmas regras, incluindo `width:100%;min-width:0`; e `a.vlink` em `/aprender-lga` media 308×**22** no desktop (o override de 44 px só existia no telemóvel) — levou `min-height:24px`, o mínimo do WCAG 2.2 para alvos de toque.

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
- **Sessão de gravação corrida ponta a ponta no browser** (câmara sintética, porque este ambiente não tem câmara real): as três confirmações desbloqueiam o botão, o pedido de câmara é `audio:false`, as 4 repetições disparam na ordem do protocolo, e o registo guardado traz `completa:true`, `dur_ms` = 4000/4000/4000/8000 (o cronómetro da parede, não uma contagem de fotogramas), 12 quadros (3 por repetição), 4 clipes descarregáveis e `consentimento {quem:'eu', audio:false}`. O `Exportar sessões (JSONL)` produziu 1 linha por repetição em `pamosii-sessoes-2026-10-22.jsonl` (`application/x-ndjson`), e esse ficheiro real foi lido por `tools/ingerir-colheita.cjs --dry-run --mostra`, que agrupou as 4 linhas em 1 registo com **20 segundos** e 12 quadros — os segundos que servem de base ao pagamento proporcional.
- Estados de erro da sessão, medidos: permissão negada → "A câmara não abriu (permissão negada ou indisponível). A descrição escrita continua a funcionar." e o botão volta a ficar activo; pausa → descarta o clipe e os quadros da repetição a meio e volta a começar essa repetição; revogar → desliga as faixas, conta o que se perdeu e devolve o formulário de consentimento. Bug apanhado por esta medição e corrigido: o `<p id="sess-msg">` vivia **dentro** da pista, que só é montada depois da câmara abrir — por isso uma falha de câmara não mostrava nada a ninguém. O aviso passou a viver ao lado da pista.
- **Verificador de qualidade, com números medidos (e não afirmados).** Com fotogramas sintéticos, porque este ambiente não tem câmara real: um quadro uniforme a cinzento médio devolve `luz 50 · contraste 0 · nitidez 0 · movimento —`, e um xadrez preto/branco devolve `contraste 58 · nitidez 100 · movimento 64` — as quatro contas mexem-se na direcção certa. Uma sessão completa com uma câmara falsa (`canvas.captureStream`) guardou `qualidade` nas 4 repetições (`amostras` 5/7/4/7, luz 58, contraste 52, nitidez 4,1–4,7, movimento 1,1–4,3 e `bandeiras` vazias; na corrida anterior, com menos amostras por repetição, a lenta ficou marcada por `nitidez` e `movimento`, o que mostra o veredicto a mudar conforme os dados) e o JSONL exportado trouxe `schema:2` com `qualidade` em cada linha. `tools/ingerir-colheita.cjs` lê o esquema 2, escreve `sessao.regravar` (ex. `"4ª:brilho/contraste/nitidez/movimento"`) e `sessao.leitura`, e **recusa** um `schema:3` com "esquema acima de 2". Bug apanhado por esta medição e corrigido: `SESS.medEm` não era reiniciado quando a fase `gravar` começava, por isso as repetições ficavam com 2–4 amostras em vez de ~8. O que esta medição **não** prova: que os limiares (`QUAL_LIMIAR`) servem para vídeo real de telemóvel — `nitidez` de um desenho sintético suave deu 4,1–4,7, exactamente em cima do limite de 4, o que é precisamente a razão para os valores brutos irem todos no ficheiro e a calibração se fazer com as primeiras gravações da equipa.
- Âncoras no endereço: `#/…` são rotas; `#tema-alfabeto` é um ponto da página `/aprender-lga` e recarregar com ele no URL deixava um 404. Agora `render()` procura a âncora, vai à página que a contém e faz scroll (verificado: `?t=…#tema-alfabeto` → h1 "Aprender Língua Gestual Angolana", `.theme-sec` encontrada, 0 erros na consola). Os botões "Descrever agora" deixaram de ser `<a href="#…">` por essa razão.
- As três superfícies do Signer, corridas no browser nesta entrega: **partilha** (`?text=Deus%20criou%20o%20mundo&url=…` → o endereço limpa-se para `#/pamosii`, o campo enche-se com o texto e o `sg-live` diz explicitamente *"18 caracteres, sem o link"* — o URL não entra na sequência); **incorporada** (iframe real com `?emb=1`: sem cabeçalho/rodapé/barra de tabs, `postMessage` do pai → textarea com "Eu quero água" e 2 sinais montados; o mesmo `postMessage` atirado contra a página aberta sozinha é ignorado, porque `EM_IFRAME` é falso); **apontar** (`#/evangelismo`: ligar "Apontar a um texto" → `aria-pressed="true"` → clicar num parágrafo → 269 caracteres desse parágrafo, 171 sinais, e nada do resto da página).

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
11. **Decisão sobre transcrições/legendas** das aulas. Este item deixou de ser burocrático: o `#/ouvir` já lê `.srt`/`.vtt` e faz a glosa de cada fala sincronizada, por isso **uma legenda por aula transforma essa aula em material de estudo sinal a sinal** — sem backend, sem custo por minuto, sem pedir autorização a mais ninguém. O que falta é da equipa: gerar/rever as legendas (o YouTube tem transcrição automática, mas é errável e está em português do Brasil), decidir em que formato se publicam e confirmar que quem transcreveu é pago pelo §6 do protocolo. Enquanto não houver ficheiros, a página serve os vídeos que a pessoa já tem no aparelho.
12. **Condições de certificados e inscrições** (ou confirmação de que ficam "Em breve").
13. **Lote de gravação de datilologia** — o único alvo honesto para reconhecimento na fase A: 26 letras × 3 sinalizadores × 3 repetições = 702 clipes, com duas condições de luz (§9 do mesmo documento; ~2 dias de gravação).
14. **Revisor surdo utilizador de LGA** — pessoa que valida cada sinal gravado e assina a revisão; nenhum vídeo é publicado sem duas aprovações (§6).
15. **Consentimentos assinados** — um por sinalizador, com os seis pontos mínimos de §5 (incluindo menores) e sem pagamento implícito; os nomes ficam fora do ficheiro de dados, que usa pseudónimos.

16. **Nome aprovado para a aplicação instalada** — hoje o manifest usa `Agatha Viva Surdo — Língua Gestual Angolana` (nome completo) e `Agatha` (nome curto debaixo do ícone); o atalho de ecrã do motor continua `Pamosii`. Se a equipa preferir que o telemóvel mostre «Agatha Viva Surdo» inteiro, é `short_name` em `app/manifest.webmanifest` — mas a esse tamanho o Android corta a segunda linha.
17. **Logótipo oficial nos três formatos de ícone** (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) ou autorização para gerar a partir do SVG com `node tools/make-icons.cjs` — ver "Substituir a marca provisória".
18. **Domínio e alojamento da marca** — o alojamento actual (GitHub Pages, `https://7dark7cloud7.github.io/pamosii-viva-surdo/`) já cumpre os três requisitos técnicos que o `tools/serve.cjs` cumpre no local: `https` (obrigatório para o service worker, o microfone e a câmara), `sw.js` na raiz do site e `manifest.webmanifest` com `Content-Type: application/manifest+json` — os três verificados no URL ao vivo. O que falta é a decisão da equipa: um domínio próprio (por ex. `pamosii.ao` / `vivasurdo.ao`) apontado para o mesmo conteúdo estático, e a conta que o controla. Trocar de alojamento não muda uma linha de código; muda só o `CNAME`/DNS e onde se faz `git push`.
19. **Remover o tema de demonstração do glossário** — o último grupo do `GLOSSARIO` (`'Demonstração (sem vídeo)'`, 33 palavras: `mercado`, `autocarro`, `dinheiro`, `hospital`, `comprar`, `cedo`…) **não é LGA**. Foi acrescentado só para o painel conseguir mostrar frases do dia a dia — o motor, os cartões, a cobertura e os marcadores — antes de haver glossário validado. Não tem vídeo, não vem de nenhuma aula da Viva Surdo e não foi visto por ninguém surdo. Está marcado em três sítios para ninguém o ler como confirmado: o estado `'demonstracao'` (rótulo "Demonstração" em cada entrada do dicionário), o cartão tracejado âmbar nos resultados do Pamosii, e duas faixas de aviso (`note-band is-demo`) no dicionário e no painel. **Para o retirar:** apagar o objecto do tema em `GLOSSARIO` (app/app.js) — as faixas de aviso, os cartões e as etiquetas desaparecem sozinhos, porque são derivados do estado das entradas; depois trocar as frases de exemplo `PM_EXEMPLOS` por frases feitas só com vocabulário validado e actualizar `app/sw.js` + `index.html` (`?v=`). As frases que hoje tocam esse vocabulário são as do mercado e do hospital.

20. **Lote de gravação da Bíblia em sinais** — se a equipa quiser mesmo o bloco reservado de "Bíblia em LGA", o mínimo honesto é Génesis 1 versículo a versículo, com um sinalizador surdo angolano e um revisor surdo (§6 do protocolo). Sem isso a página continua a dizer "Em breve", que é o que diz hoje. A questão de fundo tem de ser respondida pela equipa, não pelo código: **existe alguma tradução escrita de passages bíblicas em LGA?** A pesquisa pública de Outubro de 2026 não encontrou nenhuma (só Libras e ASL), e a própria existência de vocabulário religioso em LGA (anjo, pastor, cruz, orar, aleluia…) precisa de ser confirmada com pessoas surdas angolanas.
21. **Política para os registos da Colheita** — quem revisa, com que cadência, e com que compensação (se houver). O texto actual diz "ninguém aqui validou"; a equipa tem de decidir se publica no `glossario-extra.json` só depois de revisão, e se quer pagar ou não aos contribuintes (o protocolo exige que **não** haja pagamento implícito no consentimento).
22. **Consentimento específico para as fotografias** — a Colheita permite 3–4 quadros do próprio sinal, tirados e guardados no browser da pessoa. Para a equipa receber esses quadros é preciso: (a) um destino combinado (e-mail/nuvem) e um consentimento escrito por pessoa, com a autorização de uso público; (b) regra explícita para **menores** (o formulário aceita registos de qualquer idade, mas não pede idade — a equipa deve decidir se aceita registos de menores sem tutor). Menores e terceiros não podem ser publicados sem §5 do protocolo cumprido.
23. **Uso do modo de teste em Libras na comunicação pública** — o avatar VLibras é brasileiro e está claramente rotulado como "não é LGA". A equipa deve decidir se o mantém visível ao público (ajuda quem está a aprender, mas pode confundir quem não conhece a diferença), e se avisa que ligá-lo gera tráfego para serviços do Brasil.
24. **Legenda/atribuição das passagens bíblicas** — o texto é Almeida, domínio público, com `traducao`/`licenca`/`obtidoEm` registados em `app/assets/biblia.json`. Confirmar se a equipa quer outra versão (por exemplo uma revisão portuguesa actualizada) ou se mantém, e se o nome da versão aparece no rodapé da página.
25. **Quem assina na fila de validação, e como é pago** — `#/validar` pede um apelido e uma declaração de que a pessoa usa LGA, mas não verifica identidade nenhuma; essa verificação é da equipa. Falta decidir: a lista de sinalizadores autorizados a assinar, a ligação entre apelido e consentimento assinado (§5), o valor pago por sinal revisto (§6), e quem reúne os JSONL exportados e corre `tools/ingerir-validacoes.cjs`. Até essa decisão, os veredictos só entram em `glossario-extra.json` quando alguém da equipa corre o script à mão — é de propósito.

Sem 13, 14 e 15 **não há** reconhecimento de gestos a prometer: o site continuaria a dizer "glosa de estudo" e "a tua escolha de sinais", que é o que faz hoje. Sem 21, 22 e 25 **não há** como receber os registos da Colheita ou os veredictos de forma responsável: o ciclo está construído e testado no aparelho de quem escreve, mas falta o destino, o consentimento e o pagamento.

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
- **`#/ouvir` não traduz fala para LGA, e diz isso na página.** O que existe é (a) o ditado por voz do browser — o som vai para o serviço de transcrição do próprio browser do utilizador, que devolve texto; este site não grava áudio, não tem `getUserMedia` nesta página, não envia nada a um servidor e não guarda o texto ditado em `localStorage` — e (b) a glosa feita por este site sobre esse texto, que é **apoio de estudo** baseado no glossário `a-validar`. O texto transcrito aparece sempre editável e com o aviso de que erra nomes e números. Num filme ou vídeo sem legendas não há transcrição possível sem servidor (custa dinheiro por minuto e tira do aparelho o som de terceiros sem consentimento), por isso a página só acompanha legendas `.srt`/`.vtt` que a pessoa escolhe no próprio aparelho: o site lê texto, nunca áudio, e os ficheiros ficam na memória do separador e desaparecem ao sair da rota. A regra está vigiada por `tools/integridade-test.cjs`, que falha se o `#/ouvir` alguma vez prometer tradução automática ou deixar de desligar o microfone ao mudar de página (`ovSair()` no `render()`).
- **Câmara na Colheita:** `getUserMedia` com `audio:false` (nunca grava som), máximo 4 quadros JPEG por registo, guardados como `data:` no `localStorage` do aparelho. Não há upload: a única forma de as imagens saírem é a pessoa carregar em "Exportar" e enviar ela própria o ficheiro. Os quadros são removidos do pacote JSON na ingestão (`fotos` → `tem_fotos`), para nenhuma imagem acabar num repositório público por acidente.
- **Termos de pesquisa verificados, não assumidos:** "Bíblia em Língua Gestual Angolana", "LGA Gênesis vídeos", "Língua Gestual Angolana dicionário online" e a leitura pública dos canais da Viva Surdo / UNILGA não devolvem corpus de LGA — a página da Bíblia e o bloco reservado estão escritos com essa limitação à vista, e nunca com sinais inventados.
- O **avatar VLibras** é um serviço brasileiro de Libras, carregado só por escolha explícita da pessoa. Além de nunca ser apresentado como LGA, a página diz que ligá-lo fala com `vlibras.gov.br`; o plugin faz pedidos a infra-estrutura própria (telemetria/CDN do fornecedor), que não pertencem a este site.
- Estados de validação são **três e nunca se confundem**: `a-validar` (inferido), `colhido` (comunidade, sem revisão), `confirmado` (revisto por pessoa surda utilizadora de LGA). A ingestão automática só escreve `confirmado` se o registo trouxer `validado_por`.
