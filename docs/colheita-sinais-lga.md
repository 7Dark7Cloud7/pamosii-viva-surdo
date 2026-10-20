# Protocolo de recolha e validação de sinais (LGA)

Este documento é a especificação que falta para o Pamosii passar de **glosa de estudo**
(português → sequência de sinais, com vídeos reais por sinal) para **reconhecimento**
(sinais feitos pela pessoa → texto/voz). Não é código: nenhuma parte daqui está
implementada no site hoje, e o site diz isso mesmo ao utilizador.

**Porquê este documento primeiro:** não existe nenhum conjunto público de sinais de
Língua Gestual Angolana anotados. As ferramentas que fazem reconhecimento (Hand Talk,
VLibras, SLT do Google) só funcionam porque têm corpus próprios — a Libras brasileira
tem milhões de quadros anotados; o LGA tem zero. Isto não se obtém por engenharia
reversa de aplicativos alheios: o que se pode replicar é o **método**, e o método
começa com gravações feitas pela Viva Surdo.

---

## 1. Onde estamos hoje (estados honestos)

| Direcção | Estado no site | O que falta para ser automático |
|---|---|---|
| texto → sinais | **Funcional**: glosa frase a frase, vídeo real por sinal, glifos animados | nada (é estudo, não tradução automática — e o site diz) |
| voz → sinais | **Funcional**: ditado por voz (`SpeechRecognition`) → mesma glosa | nada; depende do browser ter ditado |
| sinais → texto | **Funcional por escolha**: a pessoa carrega nos sinais e o site escreve a frase | corpus para o site *ver* a mão e escolher sozinho |
| sinais → voz | **Funcional**: a frase escrita é lida em voz alta (`speechSynthesis`) | idem |

As duas linhas de cima para baixo ("sinais →") são hoje feitas **pela pessoa**, não por
uma IA. É essa a limitação que este protocolo remove, gradualmente.

---

## 2. Prioridade absoluta: datilologia (o alfabeto manual)

É o único alvo tecnicamente alcançável numa 1.ª fase, e o mais útil para as pessoas
surdas em Angola: nomes próprios, bairros, marcas e palavras sem sinal adoptado
— exatamente o modo "Soletrar letras" que já existe no Pamosii.

Porquê:
- 26 poses estáticas, mãos isoladas e visíveis — não exige ler movimento contínuo;
- é o único segmento da LGA com material internacional comparável (ASL/LSF/LGP),
  o que reduz o risco de treinar um modelo com dados insuficientes;
- um protótipo útil já nasce de **imagens paradas**, não de vídeo.

Meta concreta: **300–500 imagens por letra** (ver §9 para o mínimo de arranque).

---

## 3. Especificação de gravação

Vale para datilologia e para sinais isolados. Quem grava pode ser um telemóvel
android de gama média — não é preciso câmara profissional, é preciso **obedecer a isto**.

| Item | Requisito | Porque |
|---|---|---|
| Resolução | mínimo 1280×720, preferido 1920×1080 | as mãos ocupam ~15% do quadro; abaixo disto os dedos fundem-se |
| Fotogramas | 30 fps fixo (vídeo); imagem parada para datilologia | movimento suave só importa na fase 2 |
| Enquadramento | cabeça, ombros, mãos e antebraços dentro do quadro; mãos ao nível do peito, nunca cortadas na borda | a expressão facial e a cabeça são gramática, não enfeite |
| Distância | 60–80 cm entre pessoa e câmara | campo suficiente para sinais largos sem perder os dedos |
| Fundo | liso e neutro (cinza claro, parede bege, ou tecido verde sólido), a 1 m de distância da pessoa | fundo estampado/confuso é a causa nº 1 de reconhecimento falhado |
| Iluminação | frontal e suave; sem luz por trás da pessoa; sem sombra das mãos sobre o corpo | contraluz esconde os dedos |
| Vestuário | camisa/t-shirt lisa, sem padrões; mangas até ao pulso; evitar pulseiras/anelos reflexivos | brilho e padrões geram "movimento" falso |
| Mãos | unhas curtas e sem esmalte escuro; sem luvas; mãos secas | o modelo vê contornos |
| Orientação | vertical para telemóvel (9:16) em sinais de mão única; horizontal (16:9) para sinais de duas mãos largas | evitar rotações posteriores |
| Formato | MP4 (H.264) ou o original do telemóvel sem re-encoding; JPEG/HEIC para imagens | nunca exportar do WhatsApp (comprime e descolore) |
| Sem edição | sem filtros, sem embelezamento, sem estabilização artificial, sem zoom digital | filtros inventam pixels que não existiam |

**Por sinal, no caso de sinais isolados (fase 2):**
1. posição de descanso → executar o sinal → voltar ao descanso (o início e o fim são a âncora);
2. **3 repetições** em velocidade natural, pausadas entre si;
3. **1 repetição lenta** (para anotação de trajectória);
4. não trocar de mão dominante a meio, mesmo que pareça "mais bonito".

**Por letra, no caso da datilologia:**
1. cada letra isolada, 3 vezes;
2. 3 ângulos do corpo: frontal, 3/4 esquerdo, 3/4 direito;
3. 2 condições de luz (janela natural; luz artificial da sala);
4. 2 fundos (claro; escuro) — ensina o modelo a ignorar o fundo.

---

## 4. Metadados por sinal (JSONL)

Um ficheiro por sessão de gravação, uma linha por sinal, UTF-8, sem vírgulas
portuguesas escapadas (escrever `agua` **com** acento é permitido: `água`).

```json
{
  "id": "lga-0001",
  "sinal": "água",
  "glosa": "ÁGUA",
  "tipo": "palavra",
  "letra": null,
  "tema": "casa",
  "regiao": "Luanda",
  "variantes": ["ÁGUA"],
  "expressao_obrigatoria": null,
  "sinalizadores": ["A1", "A2"],
  "revisor_sordo": "C1",
  "estado": "aprovado",
  "data_colheita": "2026-11-03",
  "ficheiros": ["lga-0001-A1-1.mp4", "lga-0001-A1-2.mp4", "lga-0001-A2-1.mp4"],
  "notas": "em Benguela há uma variante com a mão em copo — por confirmar"
}
```

Campos de datilologia: `"tipo": "datilologia"`, `"letra": "k"`, `"sinal": null`.

Regras de dados (as mesmas que o site já cumpre):
- **Identificadores pseudónimos** (`A1`, `A2`, `C1`). O nome civil da pessoa vive apenas
  no termo de consentimento físico/arquivo privado, nunca no JSONL e nunca no repositório;
- **não recolher informação de saúde**, diagnóstico, grau de audição ou dados biométricos;
  nada de "observações clínicas" nas notas;
- menores só com assinatura do encarregado de educação;
- nada de áudio no ficheiro de sinal (não é necessário; e o áudio do ambiente pode conter
  vozes de terceiros sem consentimento);
- este repositório/JSONL não é publicado sem decisão da equipa.

---

## 5. Consentimento — o mínimo a pedir por escrito

Meia página, linguagem simples, uma assinatura por pessoa. Conteúdos obrigatórios:

1. o que é gravado (vídeo/imagem das mãos, braços, ombros e rosto), por quem e onde fica guardado;
2. que o material servirá para construir ferramentas de tradução/estudo de LGA (Pamosii) e
   pode ser publicado na aplicação e em materiais de formação;
3. que a participação é gratuita e revogável a qualquer momento, com pedido por Facebook/e-mail
   da Viva Surdo, e que a recolha de material já publicado será interrompida;
4. se a pessoa aceita aparecer identificada (nome/crédito) ou prefere aparecer só pelo código;
5. contacto para dúvidas e para revogar;
6. para menores: nome e assinatura do encarregado de educação.

Nunca: prometer pagamento implícito, pedir BI/carta de identidade "para o arquivo",
ou pedir dados sobre a surdez da pessoa ou da família.

---

## 6. Fluxo de validação (3 passos, o mesmo do dicionário)

```
por_gravar → gravado → por_rever → aprovado (2 pessoas) → publicado
```

1. **Gravação** — um professor/colaborador ouvinte ou sinalizador grava conforme §3 e
   preenche o JSONL com `estado: "gravado"`.
2. **Revisão por pessoa surda** — uma pessoa surda (ou filho CODA fluente) confirma que o
   sinal é usado em Angola, que a forma é correcta e que a glosa corresponde; assina como
   `revisor_sordo`. É este passo que o site já reflecte como `validado` no dicionário, e é
   o passo que **ninguém pode saltar automaticamente**.
3. **Duplicação** — um segundo sinalizador, pessoa diferente, faz o mesmo sinal. Sem isto
   o futuro reconhecedor só sabe reconhecer uma mão. Só com 2 assinaturas independentes
   o registo passa a `aprovado`.

Um sinal pode ficar `aprovado` para estudo (aparecer no dicionário) e mesmo assim
`por_rever` para reconhecimento automático: a exigência de variação entre pessoas é maior.

---

## 7. Como isto entra no site (sem reescrever nada)

- O campo `sinal` em cada entrada do glossário **já está reservado**: quando houver o vídeo
  do sinal isolado, os cartões do Pamosii e do dicionário passam a mostrá-lo automaticamente
  (a fachada de vídeo já trata do resto: miniatura, clique, sem autoplay).
- Ficheiros em `app/media/sinais/`, com o nome do registo: `lga-0001-A1-1.mp4`.
- O dicionário lê o `estado`/`validado` por entrada; um registo `por_rever` aparece com o
  aviso existente "a validar", sem esconder nada.
- Nada de chaves de API nem credenciais no frontend; se houver hospedagem de vídeo
  (YouTube não-listado, R2, bucket próprio), decide-se na fase de backend.

---

## 8. Quando houver corpus: a sequência técnica realista

**Fase A — datilologia no browser.** Detecção das 21 articulações da mão no dispositivo
(p. ex. MediaPipe Hands) + classificador de 26 classes treinado nos vossos dados.
Custos honestos a aceitar antes de começar:
- ~2–3 MB de modelo descarregado de CDN: a primeira utilização custa dados ao utilizador,
  e o site tem de o dizer antes de acender a câmara;
- não funciona sem ligação na primeira vez, a menos que se empacote numa app;
- só LGA **angolano**: se o alfabeto manual usado pela Viva Surdo divergir do que outros
  materiais mostram, é o vosso corpus que manda, não o modelo;
- o reconhecimento acontece **no dispositivo**: nada de vídeo sai do telemóvel, e isso tem
  de estar escrito no ecrã (é o mesmo princípio que já rege o módulo de câmara actual);
- gama baixa: precisa de bateria de testes em android reais, não só em Chrome de computador.

**Fase B — palavra isolada.** Classificação de clips curtos (3 repetições × N pessoas).
Exige, no mínimo, ~200–500 exemplos por palavra aprovados por revisor surdo.

**Fase C — frase contínua.** Não prometer. Reconhecimento de discurso contínuo em língua
de sinais não está resolvido em nenhum idioma, e para LGA não existe o corpus anotado
que seria preciso. Enquanto a Fase C não existir, a interface continua a dizer
"glosa de estudo" e nunca "traduz automaticamente".

---

## 9. Checklist de arranque (para uma decisão, não para produção)

Quantidades mínimas para responder "vale a pena investir na Fase A?":

- 26 letras × 3 pessoas diferentes × 3 ângulos × 3 repetições = **702 clips de letra**;
- 50 palavras mais procuradas do dicionário × 2 pessoas × 3 repetições = **300 clips**;
- 1 pessoa surda com tempo reservado para revisão (estimativa: 1 dia por cada 150 registos);
- 1 responsável pela guarda dos consentimentos;
- verificação: 1 sessão em sala com janela e 1 com luz artificial, para cobrir as condições.

Esforço típico: 2 dias de gravação (2 pessoas a gravar em paralelo) + 1 semana de revisão.

Com este material decide-se, com números da realidade angolana e não de um conjunto
de dados estrangeiro, se a Fase A vale o trabalho — e é a única forma honesta de o site passar a
dizer que reconhece sinais.
