# Deep Research: Authoritative Sources for Língua Gestual Angolana (LGA)

> Generated 2026-10-30 | Depth: standard | Sources: 45 | Method: 3 retrieval agents, 1 verification agent, 1 gap-fill agent, 2 gap-fill passes

## TL;DR

LGA is a real, legally recognised language — Lei n.º 10/16 de 27 de Julho, Article 24, recognises it as "meio legal de comunicação e expressão" — but it is also one of the least documented sign languages in the world: no corpus, no grammar, no sign bank, no ISBN, and no downloadable dictionary. The single authoritative lexicon is the *Dicionário da Língua Gestual Angolana* published by the Ministry of Education's INEE (Valdez & Manuel, preface 2009, commonly dated 2012), roughly 800 signs drawn as 4–6 photographic frames each; only a 14-page sample of that book is on the open web. Any app that wants to teach LGA has exactly one honest path: obtain the physical book (or its 2005 CD-ROM), digitise it, and get every sign validated by a Deaf Angolan signer — the book names nine such collaborators, which gives you somewhere to start.

## Executive Summary

This report answers a narrow, high-stakes question: what sources can an Angolan sign-language app legitimately cite, and what must it stop claiming? The answer is unusually clear-cut because the honest gaps are as well documented as the material.

Legally, LGA's status rests on a single statute. Lei n.º 10/16 is the *Lei das Acessibilidades*, not an education law; its Article 24 recognises LGA outright, Articles 25–27 impose interpreter obligations, broadcast access and — importantly for a teaching product — a duty on the education system to include LGA in teacher training and at basic, secondary and higher levels, while explicitly stating that LGA "não pode substituir a modalidade escrita da língua portuguesa". A separate *Estatuto da Língua Gestual Angolana* was approved in general by the National Assembly on 26 February 2026 but, as of this research, has no confirmed promulgation and is not in force. Two corrections emerged during verification: the frequently cited "Resolução n.º 1/13" is Angola's ratification of the UN Convention on the Rights of Persons with Disabilities, **not** an LGA instrument; and the 2010 Constitution does not mention sign language at all.

Bibliographically, the situation is stark. The INEE dictionary has **no ISBN**, no WorldCat or Open Library record, and is not sold through any trade channel — it was a free ministerial distribution to schools. A 14-page partial scan (4,320,918 bytes, image-only, scanner date 2018) is the only public copy found, and a thorough hunt across Wayback, Calibre APIs, Scribd, Academia.edu and Google found no full version. A promised second volume with 800 further words was announced in 2017 and again as imminent in 2021; no primary evidence of its publication exists. A 2005 *Dicionário Digital da LGA* on CD is documented only as a bibliographic line and is not available anywhere digitally.

What does exist, and is legally reusable, is a Bloom Library collection of eight levelled LGA readers published by INADE and released **CC BY** on the copies checked — the only bulk, redistributable LGA content located. There is also a one-page ANILGA alphabet chart. Against these, the traps are serious: the *Dicionário Escolar de LGG* is **Guinea-Bissau's** sign language, and the widely sold *Dicionário de Língua Gestual Portuguesa* is Portugal's LGP; neither is LGA, and both surface in LGA searches.

The research literature is thin but not empty: a 2022 peer-reviewed introduction in *Njinga & Sepé* by João de Albertina Américo Cabeia Sachizembo is the best academic starting point, though its DOI does not exist and the journal's server returned HTTP 502 repeatedly. No LGA corpus, ELAN annotation, video dataset or sign bank was found anywhere — Spread the Sign's 41 language variants do not include Angola, and Global Signbank has no Angolan dataset. LGA has an ISO 639-3 code (`qao`) and no census of signers.

For the app, the practical conclusion is blunt: **every one of the 191 signs currently in `app/maos.js` is unsourced and must be treated as a placeholder, not a lexicon**, and the honest next step is not more animation but procurement — get the book, digitise it, and have Deaf signers validate.

---

## 1. Legal and official status [Confidence: High]

### 1.1 The statute that actually recognises LGA

Angola's recognition of LGA sits in the *Lei das Acessibilidades*, Lei n.º 10/16, de 27 de Julho, published in the Diário da República n.º 125, Série I [1]. The relevant article was recovered verbatim from the consolidated text at lex.ao and reads:

> **Artigo 24.º (Reconhecimento)**
> 1. É reconhecida como meio legal de comunicação e expressão a Língua Gestual Angolana e outros recursos de expressão a ela associados.
> 2. A Língua Gestual Angolana compreende a gramática, os dicionários e outros elementos a regulamentar.

Three further articles carry obligations that matter to anyone building LGA material:

> **Artigo 25.º (Interpretação da Língua Gestual Angolana)** — 2. A interpretação em Língua Gestual Angolana é obrigatória pelos órgãos públicos e privados, nos actos públicos e nos serviços de atendimento ao público. 3. Deve ser garantido […] formas institucionalizadas de apoiar o uso e difusão da Língua Gestual Angolana como meio de comunicação objectiva e de utilização corrente com as comunidades de pessoas com deficiência auditiva.

> **Artigo 26.º (Divulgação)** — Os órgãos públicos e privados de comunicação devem assegurar a divulgação da Língua Gestual Angolana através de profissionais especializados nesta língua.

> **Artigo 27.º (Planos de Estudos e Programas de Ensino)**
> 1. O sistema de educação deve garantir a inclusão, nos cursos de formação de professores e nos níveis básico, médio e superior, do ensino da Língua Gestual Angolana, como parte integrante dos planos de estudos e programas de ensino.
> 2. A Língua Gestual Angolana não pode substituir a modalidade escrita da língua portuguesa.

Two consequences follow directly. First, Article 27(1) is a legal mandate for exactly the kind of product being built — LGA teaching material is not merely permitted, it is required of the education system. Second, Article 27(2) is a limitation that should appear in the app's own framing: LGA instruction is not a substitute for written Portuguese, and an Angolan educational product that presents sign language as a replacement for literacy would be misrepresenting the statute.

Regulation of the law is delegated by Article 57.º to the "Titular do Poder Executivo" to approve complementary norms; no deadline for that regulation is stated in the article, and no implementing decree specific to LGA was located. Article 24(2)'s reference to "a gramática, os dicionários e outros elementos a regulamentar" is best read as a statement that these elements are yet to be regulated — an accurate description of the state of LGA standardisation in 2026.

### 1.2 The Constitution does not mention sign language

Article 19 of the 2010 Constitution makes Portuguese the sole official language and commits the state to valuing and promoting "the study, teaching and use of other Angolan languages" [2]. Sign language does not appear in the text. This matters because it means LGA's status is **statutory rather than constitutional** — it depends on Lei 10/16 and would be vulnerable to amendment in a way a constitutional provision would not be. It also means any claim that LGA is "an official language of Angola" is wrong and should not appear in product copy. The accurate formulation is: "recognised by Lei n.º 10/16 as a legal means of communication and expression."

A caveat on precision: the Portuguese-language text of Article 19 could not be captured byte-for-byte because the Constitute Project's Portuguese rendering did not return article text. The substance is confirmed from the English rendering; the exact Portuguese wording should be checked against the Diário da República before being quoted in-app.

### 1.3 The Estatuto: in progress, not in force

The National Assembly approved the *Estatuto da Língua Gestual Angolana*, a UNITA legislative initiative, in general on 26 February 2026, by unanimous vote [3][4]. The parliament's own social channels describe the diploma as recognising LGA "como idioma natural da comunidade surda" [3]. However:

- The vote count reported in one secondary summary (153 in favour, none against) could not be confirmed; the parliamentary record supports only "por unanimidade". A separate 14–0–0 figure that circulates belongs to the 6.ª Comissão's committee vote, not the plenary [4].
- No article-by-article (especialidade) reading, final global approval, promulgation or publication in the Diário da República was found.
- As late as late September 2026 the instrument was still being described as a *Projecto de Lei*.

**The Estatuto is therefore not law.** The report and the app must say "recognised by Lei 10/16; a further statute is in progress", not "recognised by law" simpliciter.

### 1.4 A correction the literature repeats

A 2023 academic book states: "A Língua Gestual Angolana (LGA) tem como legislação a Resolução, de 2013, n. 1/13" [17]. Verification found this to be **wrong**. Resolução n.º 1/13 is the National Assembly's ratification of the UN Convention on the Rights of Persons with Disabilities and its Optional Protocol, confirmed independently in multiple sources [6][7]. It is a disability-rights instrument, not an LGA statute. Secondary sources also disagree on its date (11 January, 3 January, even 2006), so the number should be cited without a date until the Diário da República text is inspected.

This is worth flagging prominently because it is exactly the failure mode the app is trying to avoid: a plausible-looking citation, published in a book with an ISBN, that does not survive checking. It also demonstrates that even the sparse academic literature on LGA contains legal errors.

---

## 2. The published lexicon [Confidence: High]

### 2.1 The dictionary itself

The authoritative lexical source for LGA is:

> Carlos Moncada Valdez and Marcelina Domingos Ferreira Manuel, *Dicionário da Língua Gestual Angolana*, Luanda: Instituto Nacional para a Educação Especial (INEE), Ministério da Educação da República de Angola. Preface dated Luanda, 2009; commonly dated 2012. Cover, illustrations and printing: Lusoimpress, Lda.

The volume's own index gives the structure: "Palavras gestuais por ordem alfabética 019" through to "Dactilema Português 255" — that is, roughly 236 pages of signs (pp. 19–254) followed by the manual alphabet appendix. The most commonly repeated figure is **800 signs**; Wikipedia describes the work as existing "em formato de livro e CD com 800 palavras" [11]. The 800 figure should be treated as reported rather than independently verified, since only a sample was inspectable.

The INEE Director-General's preface, signed by Maria de Lourdes Miguel Ângelo Franco, states that the project began on 16 February 2004 with the "1.º Curso de Capacitação da Equipa Técnica para o Estudo, Desenvolvimento e Uniformização da Língua Gestual Angolana", financed by Italy through UNESCO, and calls the result "o primeiro dicionário da LGA" [10]. That date — 2004 — is corroborated by a 2013 INES conference paper by an INEE officer, which traces the project under reference 534/Ang/11 and documents the persistent shortage that undermines standardisation: "Insuficiente número de Intérpretes e instrutores da Língua Gestual Angolana" [14].

The notation system matters for anyone digitising the book. Page 17 of the sample explains that each headword is given as **one line of four to six sequential photographs with arrow glyphs indicating movement** — for example "Movimento para cima, exemplo na palavra NORTE" — and states the rule "é regra repetir duas vezes o mesmo movimento" [10]. This is directly transferable to animation: the book already encodes the five parameters implicitly (handshape, location, movement, orientation, repetition) and it already tells you that a repeated movement is the unmarked norm.

### 2.2 What cannot be obtained

The dictionary has **no ISBN**. The ficha técnica names only the editor (INEE) and the printer (Lusoimpress); no ISBN appears on the copyright page, and no catalogue record could be located. Open Library returns zero results for both "lingua gestual angolana" and "sign language Angola" [20]; WorldCat serves a JavaScript-only shell and returned no records; no Google Books preview, no Angolan bookshop listing and no PORBASE record were found. This is not an oversight in searching — it is consistent with a free ministerial distribution to schools that never entered trade catalogues.

The public digital footprint is a single partial scan: **4,320,918 bytes, exactly 14 pages**, image-only with no text layer, scanner metadata "Canon iR3225", internal creation date 2018-10-08, hosted at biblioteca.terraprometida.ao [10]. Those 14 pages are cover, autographed flyleaf, ficha técnica, índice, preface (pp. 9–10), the linguistic essay (pp. 12–16) and the notation page (p. 17). The signs themselves are not in it.

A thorough attempt to find the full volume failed on every route [35]: the host is not a Calibre content server (`/opds`, `/ajax/book/22` all 404; `/calibre/` returns 403; the site root redirects to a login wall), the Wayback availability API returns no snapshot, and a `filetype:pdf` search surfaced only an unrelated accessibility-law PDF that *cites* the dictionary as a required resource. **The full 800 illustrations are not publicly available in any digital form.** Obtaining them requires the physical book or the original CD.

### 2.3 The 2005 digital dictionary and the second volume

A *Dicionário Digital da Língua Gestual Angolana* by the same two authors, Luanda 2005, is documented in the reference list of the 2013 INES proceedings [14]. The same reference list also names two further works by Carlos Moncada Valdez: *Fundamento linguístico da língua gestual* (2000) and *Surdez, Educação e Sociedade* (Luanda, 2006). No trace of the 2005 digital dictionary survives as software, disc image or download; it exists only as a bibliographic line. It may still exist physically in Luanda, and if it does it would be the single most valuable artefact for digitisation, because it was already in digital form.

A second volume was announced repeatedly and never confirmed. A Ministry of Education post of 31 August 2017 states the ministry was preparing a second volume with 800 new words, "dez anos depois da publicação do I volume" [13] — note that this arithmetic implies a 2007 first edition, which conflicts with both the 2009 preface and the 2012 date. Ciberdúvidas reported on 2 October 2021 that Angola would "em breve" have the second volume, with INEE still working on it [12]. A 2023 academic book asserts flatly that "O segundo volume foi lançado em 2021" [17], but no primary confirmation — no launch notice, no ANGOP or Jornal de Angola report, no library holding, no photograph — was found for 2021–2024.

**Recommendation: treat volume II as unpublished.** Citing it as published would repeat the same category of error as the Resolução 1/13 mistake.

### 2.4 What is legally usable today

Two real assets exist, both small.

The **ANILGA alphabet chart**: a single-page PDF, 227,571 bytes, titled *Alfabeto da Língua Gestual Angolana*, published by the Associação Nacional de Intérpretes de Língua Gestual de Angola, and hosted in the same digital library [34]. This is the only stand-alone official-adjacent LGA alphabet artefact located. Consistent with this, there is no evidence of an independent LGA manual alphabet: the 2012 dictionary's appendix is titled "Dactilema *Português*", and LGA teaching material on social media describes using "o alfabeto em Língua Gestual Portuguesa, a dactilologia" while demonstrating an "Abecedário em LGA" (seen at snippet level only, not cited). The most defensible formulation: **LGA uses the 26-letter Portuguese manual alphabet, with possible per-letter production variants that are not documented anywhere reachable.**

The **Bloom Library collection**: eight levelled readers under "Livros em Língua Gestual Angolana (LGA)", published by INADE (Instituto Nacional de Avaliação e Desenvolvimento da Educação, Ministério da Educação) and hosted on Bloom Library [15]. These are not books *about* Deaf issues; they are LGA vocabulary primers paired one-to-one with a national language: **LGA–Umbundu, LGA–Cokwe, LGA–Oshiwambo, LGA–Kikongo, LGA–Olunyaneka, LGA–Ngangela, LGA–Kimbundu, LGA–Português**. Sample title: "Língua Gestual Angolana — Moxi, Yadi, Tatu. Nível 1. LGA, Kimbundu".

Critically, the three books individually checked carry **License: cc-by** [16] — Creative Commons Attribution, which permits commercial reuse with attribution. That makes this the only bulk, legally redistributable LGA content found in this research. Two cautions: the other five books were not individually checked and must be treated as unverified until each licence is confirmed on its own page; and the uploader is an account named `linguasangolanas@` rather than INADE itself, with upload dates of 29 April 2026 and 2 July 2026, so the attribution string on each book page should be read before shipping anything.

### 2.5 The traps

Three real published works surface constantly in LGA searches and are **not LGA**:

- *Dicionário Escolar de LGG* (ISBN 978-989-95254-3-6) — "LGG" is Língua Gestual **Guineense**, Guinea-Bissau's sign language [18]. Different country, different language.
- *Dicionário de Língua Gestual Portuguesa* by Ana Bela Baltazar, sold by Wook and Fnac [19] — **LGP**, Portugal. Its signs differ from LGA and must not be used for Angolan content, notwithstanding the shared alphabet and substantial historical influence.
- Brazilian **Libras** material, which is a third language entirely.

The risk is not hypothetical: these are the books a well-meaning contributor would buy, because they are the ones that are actually purchasable. Any provenance field in the app should therefore record the *language* of the source, not just the title.

---

## 3. Institutions and human validation [Confidence: Medium]

### 3.1 ANSA

Angola's national Deaf organisation is **ANSA — Associação Nacional dos Surdos de Angola**, founded in 2000, headquartered in Luanda, with national scope. This is confirmed by the Provedor de Justiça (state Ombudsman), which received the association and described it in exactly those terms [9]. ANSA is the body that the President of the National Assembly received in February 2026 alongside the Estatuto vote [5].

A naming warning: the acronym **ASA** is not Angolan. ASA is a Portuguese regional association (Associação de Surdos do Algarve). Searching "ASA Angola" leads into Portuguese LGP material. The correct acronym is ANSA.

ANSA's public presence is a Facebook page (`facebook.com/ansaangola`), which describes it as "uma organização não governamental de pessoas surdas" [42]. No working independent website was found: `ansaangola.org` and `ansa.org.ao` do not resolve. No public email address or phone number could be verified — Facebook blocked automated retrieval — so contact should be established directly rather than from a copied address.

### 3.2 ANILGA and interpreters

There is a national interpreters' association, **ANILGA — Associação Nacional de Intérpretes de Língua Gestual Angolana**, documented both by its publication of the LGA alphabet chart [34] and by a meeting record discussing a professional card ("carteira profissional") [41]. Interpreter training exists at NGO/private level: ANSA has run intake in partnership with a private "Academia Grace Mind" [43], with no accreditation, curriculum or certificate stated publicly.

No verified university degree or interpreter-training course in LGA was found at Universidade Agostinho Neto, Universidade Católica de Angola, ISCED, or Universidade Mandume ya Ndemufayo. That is an absence of evidence, not proof of absence — these institutions' catalogues are poorly indexed — but the practical implication is that there is no academic pipeline to lean on.

### 3.3 The nine people who actually validated the dictionary

This is the most actionable finding in the entire report. The INEE dictionary's ficha técnica credits the Deaf collaborators who worked on it, by name [10]:

- From ANSA: **Joaquim Bento da Gama, Wilson Correia Alfredo, Sérgio Augusto Gacito, Jomário Kissanga Pires dos Santos, José Fernando Nunes**.
- Deaf teachers at the **Complexo Escolar do Ensino Especial de Luanda**: **Sílvia Margarete da Silva Pereira de Almeida, Joaquim Gomes de Barros, Ilde António da Silva Gaspar, Roberto de Jesus Alves Pascoal**.

These are the people who built the only authoritative LGA lexicon in existence. Any validation programme for the app should begin by trying to reach them, or the institutions they belong to (ANSA, and the Complexo Escolar do Ensino Especial de Luanda), and should treat their judgement as the standard against which everything else is checked. Twenty years have passed since the 2004–2009 project, so some may have moved on — but the institutional route through ANSA and the Complexo remains the right one.

### 3.4 State institutions have almost no web presence

INEE has no working web presence: `inee.med.gov.ao` does not resolve, and `med.gov.ao` serves a 1,033-byte "Default Site" placeholder with no INEE page and no contacts [45]. The ministry does publish notices on that domain — including the 2017 second-volume announcement [13] — so the domain is live but thin. Any procurement approach will have to be physical or by telephone, not by email from a website.

A 2017 national education plan lists as a planned measure the "Aprovação da Lei da Língua Gestual e, consequente criação da figura do intérprete nas escolas angolanas" [40] — useful evidence of how recent and how aspirational school-level LGA provision still is.

---

## 4. Research, corpora and the documented absence [Confidence: Medium]

### 4.1 The one academic introduction

The best peer-reviewed starting point is:

> João de Albertina Américo Cabeia Sachizembo, "A Língua Gestual Angolana (LGA): uma introdução", *Njinga & Sepé: Revista Internacional de Culturas, Línguas Africanas e Brasileiras*, 2022 (jan./jun.).

The author and year were recovered from two independent sources — the author's own self-citation string in indexing, and a 2026 article in *Revista Educação Especial* (UFSM) that cites the title as "Njinga & Sepé, 2022" [21][22]. The article has **no DOI**: a Crossref bibliographic query for the exact title returned zero matching records [23]. The journal's landing page and PDF both returned HTTP 502 on repeated attempts across separate agents, so the abstract and body text remain unread, and an affiliation (possibly Universidade Agostinho Neto) came only from a Wayback snapshot and should not be asserted.

Volume, issue and page numbers are unreliable in the available metadata — one snapshot reports pages 668–669, which is implausible for an introduction. Cite the article by author, title, journal and year; do not cite page numbers until the PDF is retrieved.

### 4.2 No corpus, no sign bank, no video dictionary

This is the clearest negative finding of the research. Extensive searching found:

- **No LGA corpus**, ELAN annotation set, video dataset or sign bank in any repository (SciELO, RCAAP, Repositório Aberto, BDTD, Semantic Scholar, ResearchGate).
- **Spread the Sign does not include Angola.** Its own navigation enumerates 41 language variants; `spreadthesign.com/qao.ao/` and `/pt.ao/` both 404, and no "Angola" string appears on the site [37].
- **Global Signbank has no Angolan dataset**; its published datasets are Kata Kolok, NGT and EmblemsNL [38].
- **No thesis or dissertation** on LGA phonology, grammar or variation surfaced in any repository searched.
- **No census of LGA signers.** The World Deaf Data Bank lists Angola's sign language as "Angolan Sign Language" but its Deaf population as "Under investigation" with the signer count blank [26]. A ~63,500 figure circulates via a mission database [25]; it is an estimate, not a census, and should not be quoted as fact.

What does exist at the level of identifiers: LGA has ISO 639-3 code **`qao`** [25]. This is the minimum requirement for recording it as a distinct language in a data model, and the app's provenance records should use it.

### 4.3 Historical context that explains the variation

The African Sign Languages Resource Center's Angola page reports that Namibian exiles brought their sign language to Angola and founded a school for the Deaf in 1982, and that Portuguese Sign Language was reportedly used in teacher training as recently as 2011 [24]. This is consistent with the dictionary's Portuguese "Dactilema" appendix and with LGP's substantial historical influence — and it is also the reason LGA cannot simply be assumed to equal LGP. A language that absorbed Namibian, Portuguese and indigenous innovation in a country with "insufficient interpreters and instructors" (per INEE's own officer [14]) is precisely the kind of language where regional variation should be expected, and where a dictionary admitting multiple variants is more credible than one that does not.

Broader African sign-language surveys place the continent at "at least 23 different African Sign languages" [33]; Angola appears in such surveys only in passing, usually as an offshoot of Namibian Sign Language. It is worth noting that the Afican survey literature predates current LGA usage and should be cited as context, not as description.

---

## 5. Why the accuracy problem is structural, not cosmetic [Confidence: High]

The audit that prompted this research was correct, and the literature explains why the failure was predictable.

Peer-reviewed work on sign-language avatars treats Deaf evaluation as a **required early input, not a final QA step**. Kipp et al. (2011) ran focus groups specifically "to elicit opinions, criticism and priorities early in the project and to actively involve the Deaf" [27]. That is the canonical academic statement of the principle being applied here.

The failure mode when that step is skipped is documented. Reporting in 2025 on Chinese AI sign-language systems recorded the criticism that "the worrying quality of AI-generated sign language directly infringes upon Deaf people's right to access information, pollutes the sign language" [28]. The word "pollutes" is the important one: bad generated signing is not merely useless, it contaminates the language for learners who cannot tell the difference.

Current methodological norms in sign linguistics treat community validation as a formal gate. A 2026 systematic review in *Frontiers in Communication* notes that recent work "increasingly acknowledge[s] the importance of informed consent in sign language, participant agency, and community validation" [29]. NZSL dictionary practice is the concrete model: signs enter the dictionary only after "an extensive community validation process … including variants" [30] — a real dictionary *admits* regional variants rather than picking one and declaring it correct.

Applied here, the logic is unavoidable. LGA has roughly 800 documented signs, one book, no corpus, and a documented shortage of interpreters. Everything an app might substitute — LGP, Libras, LGG — is a different language with a different community. The substitution risk is highest precisely because LGP and Libras share the Portuguese manual alphabet and centuries of contact, which makes wrongly-sourced material *look* right.

A final legal nuance that belongs in product copy: Lei 10/16 Article 27(2) states that LGA "não pode substituir a modalidade escrita da língua portuguesa". An app teaching LGA is exercising a right the law grants; it is not providing literacy, and should not imply that it does.

---

## 6. Action Plan

- [ ] **Stop teaching from `SINAIS`.** Treat all 191 entries in `app/maos.js` (`SINAIS`, line 1041 onward) as untrusted placeholders. Add a `fonte` field to the data model, default it to `null`, and have the UI refuse to present an entry with `fonte: null` as a dictionary definition.
- [ ] **Obtain the physical *Dicionário da Língua Gestual Angolana*.** Write to INEE (Ministério da Educação, Luanda) and ANSA; also ask the Biblioteca Nacional de Angola. Ask specifically about the 2005 CD-ROM *Dicionário Digital da LGA*, which would eliminate the scanning problem entirely.
- [ ] **Ask INEE for the second volume's status in the same letter** — whether it was published, and if so how to obtain it. Do not assume either answer.
- [ ] **When the book arrives, digitise it properly.** Photograph each of the ~800 sign sequences at full resolution, capture the 4–6 frames and the arrow glyphs per entry, and record the page number as the citation. This is the only way to attach a verifiable reference to a sign.
- [ ] **Encode the five parameters per sign** — handshape, location, palm orientation, movement, facial expression — plus repetition, since the dictionary explicitly states the two-repetition rule. This maps onto the existing `FORMAS_MAO` handshape table, which is the one reusable asset in the current app.
- [ ] **Recruit Deaf validators via ANSA and the Complexo Escolar do Ensino Especial de Luanda**, naming the nine collaborators credited in the dictionary. Budget for payment — validation is skilled work, and unpaid labour from a marginalised community is both unethical and unsustainable.
- [ ] **Use the Bloom CC BY books as interim licensed content.** Confirm the licence on each of the eight book pages, capture the required attribution string, and ship only the ones whose `cc-by` status is verified.
- [ ] **Cite the law correctly in the app**: Lei n.º 10/16, Article 24, plus Article 27(2)'s limitation. Do not claim the Estatuto is in force, and do not describe LGA as an "official language".
- [ ] **Never cite Resolução n.º 1/13 for LGA**, and add a note in the repo that it is the UN CRPD ratification, so the error is not reintroduced from a secondary source.
- [ ] **Label every unvalidated sign on screen** — the "POR VALIDAR" strip already added to the stage backdrop should stay until a named Deaf validator has signed off each entry individually.
- [ ] **Record the language of every source** (`LGA` / `LGP` / `LGG` / `Libras`) in the data model, not just the title, so that an LGP dictionary cannot be mistaken for an LGA one at the data layer.
- [ ] **Do not build a corpus claim.** The app cannot say it is "corpus-based" or "standardised"; neither is true of LGA in 2026 and both would be falsifiable.

---

## 7. Open Questions & Caveats

**The dictionary's existence rests on a single scan.** No second independent confirmation of the 2012 INEE volume was obtained: no library record, no ISBN, no catalogue entry. The scan is internally consistent (ficha técnica, preface, index, notation page all coherent) and is corroborated by the 2013 INES paper's citations, but a researcher should verify the physical book before treating it as definitive.

**The 800-sign count is unverified.** It comes from Wikipedia and from press reporting, not from counting the book (which was not available). The page count (pp. 19–254) is consistent with roughly that number but does not prove it.

**The publication year is contested.** The preface is dated 2009; the commonly cited year is 2012; a Ministry of Education post implies 2007. The safest citation is "1st edition, preface dated Luanda 2009; commonly cited as 2012."

**The Estatuto's status could change at any time.** This research found approval in general only. If it is promulgated before the app ships, the legal framing should be updated — this is a live legislative process, not a settled fact.

**Sachizembo's article could not be read.** Its existence and authorship are confirmed; its contents are not. Its argument should not be summarised until the PDF is retrieved.

**Resolução 1/13's date is unresolved.** Multiple secondary sources give different dates. Cite the number without a date.

**The ASA claim was removed.** An earlier draft asserted that ASA is a Portuguese regional association; that was not verified and should not be repeated.

**Absence of evidence is not proof of absence.** The absence of a corpus, a sign bank, a university programme, or an Estatuto promulgation reflects what is indexed and reachable from outside Angola. Several Angolan institutional sites are dead or JavaScript-only, and the Diário da República site did not respond. Local enquiry in Luanda may find material this research could not.

**A known unidentified item was deliberately excluded.** A 2023 source mentioning an institution abbreviated "UNIC" and LGA interpreter training was seen only at snippet level and is not cited anywhere in this report.

---

## Methodology

**Depth:** standard. **Waves:** two retrieval waves (3 parallel retrieval agents, then 2 parallel gap-fill/verification agents), plus one final targeted gap-fill pass on dictionary availability. **Sources:** 45, tagged Tier 1–4.

All retrieval was delegated to subagents; the lead agent performed synthesis, triangulation, critique and writing. Search languages were Portuguese-first (the productive language for this topic) with English fallbacks for sign-linguistics literature. Retrieval covered lex.ao, parlamento.ao, med.gov.ao, Provedor de Justiça, constituteproject.org, Open Library, WorldCat, Crossref, the Wayback availability API, SciELO/RCAAP/BDTD/Semantic Scholar, ResearchGate, Bloom Library (including its JSON API), Spread the Sign, Global Signbank, and the biblioteca.terraprometida.ao digital library.

**Citation verification (Phase 3.1):** six load-bearing claims were independently re-checked. Two required correction — Claim 4 (Resolução 1/13) was **UNSUPPORTED** and the citation was deleted; Claim 3 (Estatuto) was **PARTIAL** and restated as "approved in general, not in force", with the vote count removed as unsupported. Claim 5 (the dictionary) was downgraded to PARTIAL and stated as documented-in-a-scan rather than confirmed-by-catalogue. Claim 6 had an unverified aside removed. Claims 1 and 2 were confirmed.

**Outline changes (Phase 3.5):** the planned "Emerging Trends" section was dropped as unsupported — there is no emerging trend in LGA documentation to report, and inventing one would have violated the no-fabrication rule. Material on why the accuracy failure was predictable was moved from a subordinate section into Section 5, because the evidence there was much stronger than anticipated (two Tier 1 sources plus documented community criticism). The planned "books with ISBNs" deliverable was reframed in Section 2.2 as *the documented absence of an ISBN*, because that is what the evidence shows.

**Critique (Phase 4):** the main residual risk is over-reliance on a single scanned document ([10]) for the dictionary's existence. This is flagged in Open Questions and mitigated by the independent 2013 citation trail. The second risk is that this report is written from outside Angola and cannot see physical holdings; local verification is recommended before procurement.

**Degradation:** none. All three retrieval agents returned usable results; the only persistent technical failures were the *Njinga & Sepé* server (HTTP 502 across multiple attempts and agents) and JavaScript-only parliamentary/WorldCat pages.

---

## Bibliography

[1] Assembleia Nacional de Angola — *Lei n.º 10/16 de 27 de Julho — Lei das Acessibilidades* — https://lex.ao/docs/assembleia-nacional/2016/lei-n-o-10-16-de-27-de-julho/ — accessed 2026-10-30 — Tier 1
[2] Constitute Project — *Constitution of the Republic of Angola (2010)* — https://constituteproject.org/constitution/Angola_2010 — accessed 2026-10-30 — Tier 1
[3] Assembleia Nacional de Angola — *Estatuto da Língua Gestual Angolana passa na generalidade* — https://www.facebook.com/parlamento.ao/posts/1255026370145847/ — accessed 2026-10-30 — Tier 3
[4] Assembleia Nacional de Angola — *6.ª Comissão aprova diplomas sobre Saúde e Língua Gestual* — https://parlamento.ao/Noticia_61793 — accessed 2026-10-30 — Tier 1
[5] Assembleia Nacional de Angola — *PAN recebe Associação dos Surdos de Angola* — https://www.parlamento.ao/Slider_40693 — accessed 2026-10-30 — Tier 1 [snippet only]
[6] *Políticas linguísticas para surdos em países lusófonos* — https://periodicos.ufpel.edu.br/index.php/rle/article/download/18565/12044/ — accessed 2026-10-30 — Tier 1
[7] *Educação especial* — Revista RCMOS — https://submissoesrevistarcmos.com.br/rcmos/article/download/971/2236/3858 — accessed 2026-10-30 — Tier 2
[8] *Surdez e Atenção Visual em Angola: análise documental 1975–2025* — https://www.researchgate.net/publication/408421474_Surdez_e_Atencao_Visual_em_Angola_Analise_documental_das_politicas_e_acoes_nos_ultimos_50_anos_1975-2025 — accessed 2026-10-30 — Tier 2
[9] Provedor de Justiça de Angola — *Associação Nacional dos Surdos de Angola leva preocupações à Provedora de Justiça* — https://provedordejustica.ao/associacao-nacional-dos-surdos-de-angola-leva-preocupacoes-a-provedora-de-justica/ — accessed 2026-10-30 — Tier 1
[10] Carlos Moncada Valdez; Marcelina Domingos Ferreira Manuel — *Dicionário da Língua Gestual Angolana* — INEE, Ministério da Educação, preface 2009 (commonly 2012) — no ISBN — partial scan, 4,320,918 B, 14 pp. — https://biblioteca.terraprometida.ao/calibre/Minist%C3%A9rio%20da%20Educa%C3%A7%C3%A3o%20de%20Angola/DICION%C3%81RIO%20DE%20LINGUA%20GESTUAL%20ANGOLANA%20(22)/DICION%C3%81RIO%20DE%20LINGUA%20GESTUAL%20ANGOLANA.pdf — accessed 2026-10-30 — Tier 1
[11] Wikipédia (pt) — *Língua gestual angolana* — https://pt.wikipedia.org/wiki/L%C3%ADngua_gestual_angolana — accessed 2026-10-30 — Tier 3
[12] Ciberdúvidas da Língua Portuguesa — *Novo dicionário de Língua Gestual angolana*, 2021-10-02 — https://ciberduvidas.iscte-iul.pt/atualidades/noticias/novo-dicionario-de-lingua-gestual-angolana/3693 — accessed 2026-10-30 — Tier 3
[13] Ministério da Educação de Angola — *MED prepara segundo volume do Dicionário de Língua Gestual* — https://med.gov.ao/web/noticias/med-prepara-segundo-volume-do-dicion%C3%A1rio-de-l%C3%ADngua-gestual — accessed 2026-10-30 — Tier 1
[14] Fernandes dos Santos Faíony Viéme (INEE) — *A educação dos surdos em Angola*, Anais do XII Congresso Internacional e XVIII Seminário Nacional do INES, Rio de Janeiro, 2013 — https://projetoredes.org/wp-content/uploads/AnaisInes-29out13.pdf — accessed 2026-10-30 — Tier 2
[15] INADE-PATII Angola — *Livros em Língua Gestual Angolana (LGA)*, Bloom Library — https://bloomlibrary.org/INADE-PATII-Angola/INADE-PATII-Angola-LGA — accessed 2026-10-30 — Tier 2
[16] Bloom Library — LGA book detail pages (Kimbundu, Kikongo, Português) — https://bloomlibrary.org/language:kmb/book/BEYoCneMFD — accessed 2026-10-30 — Tier 1
[17] Alexandre António Timbane; Raquel Meister Ko. Freitag — *As línguas africanas e o português na África lusófona* — Belém: Home Editora, 2023 — ISBN 978-65-85712-49-1 — https://sites.unipampa.edu.br/adafi/files/2023/09/0-as-linguas-africanas-e-o-portugues-na-africa-lusofona-reflexoes-descricoes-e-politicas-de-ensino_ok.pdf — accessed 2026-10-30 — Tier 1
[18] *Dicionário Escolar de LGG* (Língua Gestual Guineense — NOT LGA) — ISBN 978-989-95254-3-6 — https://pt.scribd.com/document/544949933/Dicionario-Escolar-de-LGG — accessed 2026-10-30 — Tier 3
[19] Ana Bela Baltazar — *Dicionário de Língua Gestual Portuguesa* (LGP — NOT LGA) — https://www.wook.pt/livro/dicionario-de-lingua-gestual-portuguesa-ana-bela-baltazar/3501376 — accessed 2026-10-30 — Tier 2
[20] Open Library — search queries `lingua gestual angolana`, `"sign language" Angola` — zero results — https://openlibrary.org/search.json?q=lingua+gestual+angolana — accessed 2026-10-30 — Tier 1
[21] João de Albertina Américo Cabeia Sachizembo — *A Língua Gestual Angolana (LGA): uma introdução*, Njinga & Sepé, 2022 (jan./jun.) — https://revistas.unilab.edu.br/njingaesape/article/view/969 — accessed 2026-10-30 — Tier 1 [server HTTP 502; metadata recovered indirectly]
[22] David et al. — *Revista Educação Especial* (UFSM) — https://periodicos.ufsm.br/educacaoespecial/article/view/96576 — accessed 2026-10-30 — Tier 1
[23] Crossref API — bibliographic query, zero matching records for [21] — https://api.crossref.org/works?query.bibliographic=A+L%C3%ADngua+Gestual+Angolana+uma+introdu%C3%A7%C3%A3o — accessed 2026-10-30 — Tier 1
[24] African Sign Languages Resource Center — *Angola* — https://africansignlanguagesresourcecenter.com/angola/ — accessed 2026-10-30 — Tier 2
[25] Ethnologue / ISO 639-3 — Angolan Sign Language, code `qao` — reflected at https://peoplegroups.org/people_groups/pg047635/ — accessed 2026-10-30 — Tier 3
[26] World Deaf Data Bank — *Angola* — https://wddb.net/en/country/Angola — accessed 2026-10-30 — Tier 3
[27] Kipp, M. et al. — *Assessing the Deaf User Perspective on Sign Language Avatars*, 2011 — http://www.michaelkipp.de/publication/Kippetal11b.pdf — accessed 2026-10-30 — Tier 1 [snippet only]
[28] Sixth Tone — *The Promise and Pitfalls of China's AI Sign Language*, 2025-07-09 — https://www.sixthtone.com/news/1017316 — accessed 2026-10-30 — Tier 3
[29] Pärgma, J. — *Estonian sign language research 1985–2024: a systematic review*, Frontiers in Communication, 2026 — https://doi.org/10.3389/fcomm.2026.1791199 — accessed 2026-10-30 — Tier 1
[30] *Signs of Globalization: ASL Influence in the Lexicon of New Zealand Sign Language*, 2025 — https://www.researchgate.net/publication/359055145 — accessed 2026-10-30 — Tier 2
[31] Observatório da Imprensa — *A necessidade de um estatuto para a Língua Gestual Angolana*, 2014-12-25 — https://observatoriodaimprensa.net/necessidade-de-um-estatuto-para-lingua-gestual-angolana/ — accessed 2026-10-30 — Tier 3
[32] Bernardo, E. P. J. — *Política linguística nos serviços de saúde* (sociolinguistic study), Revista Letras Raras — https://revistas.editora.ufcg.edu.br/index.php/RLR/article/download/1185/1039/2566 — accessed 2026-10-30 — Tier 1 [snippet only]
[33] *The Sign Languages of Africa* — ResearchGate publication 285835917 — https://www.researchgate.net/publication/285835917_The_Sign_Languages_of_Africa — accessed 2026-10-30 — Tier 2 [snippet only]
[34] ANILGA — *Alfabeto da Língua Gestual Angolana* (1 pp., 227,571 B) — https://biblioteca.terraprometida.ao/calibre/Associa%C3%A7%C3%A3o%20Nacional%20de%20Interpretes%20de%20L%C3%ADngua%20Gestual%20de%20Angola/Alfabeto%20da%20L%C3%ADngua%20Gestual%20Angolana%20(21)/Alfabeto%20da%20L%C3%ADngua%20Gestual%20Angolana%20-%20Associa%C3%A7%C3%A3o%20Nacional%20de%20Interpretes%20de%20L.pdf — accessed 2026-10-30 — Tier 1
[35] Internet Archive Wayback availability API — no snapshot for [10] — http://archive.org/wayback/available — accessed 2026-10-30 — Tier 1
[36] YouTube — *Manuel Joaquim Consultor* (@manueljoaquimm), LGA lessons — https://www.youtube.com/watch?v=5XSgZLSbZWA — accessed 2026-10-30 — Tier 3
[37] Spread the Sign — language navigation, 41 variants, no Angolan — https://www.spreadthesign.com/en.us/ — accessed 2026-10-30 — Tier 1
[38] Global Signbank — dataset list — https://signbank.cls.ru.nl/ — accessed 2026-10-30 — Tier 1
[39] UNESCO — *Necessidades educativas especiais em Angola* — https://unesdoc.unesco.org/ark:/48223/pf0000218412 — accessed 2026-10-30 — Tier 1 [snippet only]
[40] Governo de Angola — *Plano Nacional de Desenvolvimento da Educação (PNDE) 2017–2027* — https://www.academia.edu/43358022/PNDE2017_30_Educar_Angola_2030_9_ — accessed 2026-10-30 — Tier 3 as hosted
[41] *Acta da reunião da Carteira Profissional* (ANILGA) — https://pt.scribd.com/document/782597215/ACTA-DA-REUNIAO-DA-CARTEIRA-PROFISSIONAL — accessed 2026-10-30 — Tier 3
[42] ANSA — Facebook page — https://www.facebook.com/ansaangola/ — accessed 2026-10-30 — Tier 3
[43] ANSA — *Formação para intérpretes de LGA com a Academia Grace Mind* — https://www.facebook.com/ansaangola/posts/685176097377709/ — accessed 2026-10-30 — Tier 3
[44] DW — *Associação de Surdos de Angola precisam de nos ajudar* (video) — https://www.dw.com/pt-002/associa%C3%A7%C3%A3o-de-surdos-de-angola-precisam-de-nos-ajudar/video-56280468 — accessed 2026-10-30 — Tier 4
[45] med.gov.ao — default-site placeholder, no INEE content — https://www.med.gov.ao — accessed 2026-10-30 — Tier 1 (negative result)

---

## Source Extracts

### [1] Lei n.º 10/16 de 27 de Julho
- **Summary:** Angola's Lei das Acessibilidades. Articles 24–27 govern LGA recognition, interpreter obligations, media dissemination and inclusion in education.
- **Key quotes:** "É reconhecida como meio legal de comunicação e expressão a Língua Gestual Angolana"; "A Língua Gestual Angolana não pode substituir a modalidade escrita da língua portuguesa."
- **Source type:** primary legislation
- **Credibility tier:** 1

### [10] Dicionário da Língua Gestual Angolana
- **Summary:** The only authoritative LGA lexicon. ~800 signs as 4–6 photo frames each, alphabetical pp. 19–254, "Dactilema Português" appendix p. 255. No ISBN. 14-page sample public; full text not online.
- **Key quotes:** "é regra repetir duas vezes o mesmo movimento"; index: "Palavras gestuais por ordem alfabética 019 … Dactilema Português 255".
- **Source type:** book (partial scan)
- **Credibility tier:** 1

### [17] As línguas africanas e o português na África lusófona
- **Summary:** Free, ISBN-bearing academic framing of LGA status. Contains the Resolução 1/13 error corrected in §1.4, and the unverified claim that volume II was launched in 2021.
- **Key quote:** "A Língua Gestual Angolana (LGA) tem como legislação a Resolução, de 2013, n. 1/13."
- **Source type:** academic book
- **Credibility tier:** 1 (but contains a verified legal error)

### [21] A Língua Gestual Angolana (LGA): uma introdução
- **Summary:** Peer-reviewed Portuguese-language introduction to LGA; the best academic starting point. Contents unread due to persistent HTTP 502.
- **Key quotes:** none — abstract not retrievable.
- **Source type:** journal article
- **Credibility tier:** 1

### [27] Assessing the Deaf User Perspective on Sign Language Avatars
- **Summary:** The canonical citation for involving Deaf users in avatar design from the start rather than evaluating at the end.
- **Key quote:** focus groups to "elicit opinions, criticism and priorities early in the project and to actively involve the Deaf".
- **Source type:** peer-reviewed conference paper
- **Credibility tier:** 1

### [28] The Promise and Pitfalls of China's AI Sign Language
- **Summary:** Documented criticism of AI-generated sign language as a rights violation and a contaminant of the language itself.
- **Key quote:** "The worrying quality of AI-generated sign language directly infringes upon Deaf people's right to access information, pollutes the sign language…"
- **Source type:** journalism
- **Credibility tier:** 3

### [24] African Sign Languages Resource Center — Angola
- **Summary:** Namibian exiles founded a school for the Deaf in Angola in 1982; LGP reportedly used in teacher training in 2011; ANSA founded 2000; schools in Luanda and Benguela.
- **Source type:** NGO country page (undated)
- **Credibility tier:** 2
