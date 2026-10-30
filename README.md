# Agatha — texto em, sinais out

Protótipo da **Viva Surdo** para ver uma frase em Língua Gestual Angolana (LGA) e
procurar palavras num dicionário de sinais. Duas funções, duas páginas:

| Rota | Função |
| --- | --- |
| `#/` | Colar texto, legendas (`.srt`/`.vtt`) ou um PDF e ver a glosa em sinais animados |
| `#/dicionario` | Procurar uma palavra por tema e ver a forma da mão |

Não é tradução automática. A glosa é uma **sequência de estudo**: artigos e
preposições caem, o tempo vai à frente, o «não» vai ao fim. A ordem, o espaço de
sinalização e a expressão facial de um sinalizador surdo não cabem numa lista de
palavras — por isso o site diz, em dois sítios, que as associações estão **por
validar** por sinalizadores surdos.

## Correr

Sem build, sem dependências, sem backend. Servir `app/` como ficheiros estáticos:

```bash
node tools/serve.cjs          # http://127.0.0.1:8123
```

Em `localhost` o service worker fica desligado de propósito (escondia ficheiros
acabados de editar). Para o testar: `http://127.0.0.1:8123/?sw=1`.

```
app/
  index.html            página única, carrega dados → mãos → app
  styles.css            tokens, temas claro/escuro/alto contraste, telemóvel
  dados.js              glossário (12 temas, 179 palavras) + glosador
  maos.js               rig das mãos em SVG + notação dos sinais (191 sinais)
  app.js                duas vistas, leitor (SRT/VTT), PDF local, acessibilidade
  sw.js                 casulo offline (VERSAO = ?v= do index)
  manifest.webmanifest  instalação e atalhos
  assets/               marca e ícones
```

## Como o sinal é desenhado

Cada sinal é uma notação de três palavras — **forma · lugar · movimento** — e o
prefixo `2:` marca dois mãos:

```
'água': 'curva boca baixo'      'casa': '2:curva telhado baixo'
```

As 32 formas de mão (`A`–`Z` e `abre`, `plano`, `punho`, `aponta`, `curva`,
`garra`) são **ângulos de articulação**, não desenhos. Entre dois sinais o rig
interpola os ângulos (`formaMisturar`), por isso a mão **dobra-se** em vez de
trocar de imagem. O corpo é uma silhueta fixa; os braços têm ombro, cotovelo e
pulso, ordenados por profundidade com uma câmara em perspectiva simples.

O dicionário mostra a forma de cada sinal (`maoFigura`); a página inicial anima
a sequência completa (`maoCena`) a 760 ms por sinal e 340 ms por letra
soletrada.

## Entradas

- **Texto** colado.
- **Ficheiro** `.txt`.
- **Legendas** `.srt` / `.vtt`; com um vídeo aberto, os sinais seguem o tempo
  das falas.
- **PDF** com camada de texto, lido no próprio browser
  (`DecompressionStream`, sem bibliotecas). PDF digitalizado não tem texto — a
  página di-lo em vez de inventar.

Nada é enviado para fora: não há `fetch`, microfone, `sendBeacon` nem POST. O
único `localStorage` é `vs.a11y` (opções de acessibilidade).

## Testes

```bash
node tools/integridade-test.cjs   # claims, privacidade, versão do casulo, notação, acessibilidade
node tools/engine-test.cjs        # glosa de 7 frases + lemas e plurais
```

O teste de integridade avalia `dados.js` + `maos.js` num `vm` e falha se um
sinal tiver forma, lugar ou movimento que o rig não conhece, se os três
ficheiros declararem a mesma `const` (o segundo deixaria de correr) ou se o
`?v=` do index não bater com o `VERSAO` do service worker.

Os restantes scripts em `tools/` (`ingerir-*`, `sonda-*`, `auditoria-visual`,
`fetch-biblia`, `parse-yt`, `yt-search`) são do site maior que este branch
substituiu — não são usados por esta app.

## Regras de honestidade

A interface não pode afirmar o que o código não faz:

- não é tradução automática nem tradutor português ↔ LGA;
- não reconhece sinais por câmara, nem voz, nem microfone;
- nenhum sinal está «validado pela comunidade surda»;
- não se usa «pessoas normais»;
- não se inventam preços, depoimentos, mentores ou contagens;
- o texto da Open Minds Academy não se reutiliza.

Estas regras vivem em `tools/integridade-test.cjs`; se alguém escrever a
promessa no site, o teste falha.

## Publicação

O site publicado em <https://7dark7cloud7.github.io/pamosii-viva-surdo/> é a
versão anterior (18 rotas). Este branch (`simplify-soundfit`) ainda não está
publicado. Para publicar: copiar `app/` para a branch `gh-pages`, mudar
`const VERSAO` em `app/sw.js` **e** todos os `?v=` em `app/index.html` para o
mesmo valor, e voltar a correr os dois testes.

## Limites conhecidos

- A notação não tem expressão facial, uso do espaço, nem orientação de palma
  por sinal (só o lugar `telhado` tem uma inclinação própria); é um treino de
  estrutura, não um vídeo de referência.
- A ordem das palavras segue seis regras simples de glosa; não é a gramática
  da LGA.
- A soletração usa uma forma por letra e não distingue variantes regionais.
