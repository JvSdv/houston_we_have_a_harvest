# Roteiro v2 · weharvest (nova identidade) · ~79 s · inglês · legendas em inglês

Base visual: o artefato de design (5 telas: 1 Vou plantar, 2 Já plantei, 3 Calendário, 4 Rotações, 5 Identidade). O vídeo usa a identidade dele, não a antiga.

## Linguagem visual do vídeo (tirada da tela 5, Identidade)
- **Cores:** Céu `#0A1424` (fundo do começo e do fim), Lavoura `#2E7D4A`, Broto `#9BE36B`, Milho `#C9A23A`, Palha `#F5F2EA` (fundo claro das telas), Geada `#3E6EA8`, Atenção `#B7791F`, Risco alto `#B4480E`.
- **Letras:** Archivo 900 nos títulos, IBM Plex Mono só em números e etiquetas ("19 OF 45 SEASONS").
- **Logo:** círculo escuro com lavoura, broto verde e a **órbita tracejada com satélite**. A órbita é o fio do vídeo: liga o céu da NASA à roça. Ela aparece no começo, atravessa a tela do app e fecha na cartela.
- **Mascote:** o Broto (a "Dica do Broto"). Aparece curto, só para dar a dica de data.
- **Movimento:** barras que crescem (`wh-bar`), anel que se fecha (`wh-ring`), elementos que sobem suave (`wh-rise`). Mesmo vocabulário do app, então motion e tela parecem a mesma coisa.
- **Tela do app:** celular (390 px) no centro, fundo Céu em volta. Gravar em **inglês**.

## Roteiro

| # | Tempo | Tipo | O que se vê | Texto na tela | Fala (inglês) | Fonte / depende de |
|---|---|---|---|---|---|---|
| 1★ | 0–5 | motion | Céu escuro, estrelas. Satélite desenha a órbita tracejada até uma lavoura verde. O broto nasce. | One date. Two harvests. | "In Brazil, one planting date decides two harvests." | README "What it is" |
| 2★ | 5–18 | motion | Calendário de set a ago, fácil de ler: barra verde da soja (plantio 20/out, colheita 17/fev), barra dourada do milho (plantio 22/fev), flor 18/abr a 2/jun em destaque, barra azul da geada (mai–ago) e uma coluna laranja onde a flor encontra a geada: "Flowering meets frost. That is the risk." | Soy first. Corn second. | "Farmers plant soybeans, then second-crop corn. The soybean date decides when the corn flowers, and flowering is when the corn is most sensitive to frost and drought. In 2026, both hit fields in more than one state." | README; Deral/Cultivar 2026 |
| 3 | 18–27 | motion | Barra "111 Mt" dentro de "143 Mt", Palha sobre Céu. | 78% of Brazil's corn is second-crop | "Second-crop corn is about three quarters of Brazil's corn. Even in a record year, frost and drought hit fields in several states. A bad date can put frost on the corn at its worst moment." | Conab 11º levantamento (ago/2026). 78% é cálculo nosso. **Conferir no relatório oficial.** |
| 4 | 27–34 | motion | Ilustração de lavoura sob o céu, com a órbita do satélite (sem mapa). | We're from the Brazilian countryside | "We are a team from the countryside of Brazil. We grew up around this problem. So we built something for it." | fala da equipe |
| 5★ | 34–49 | **tela 1 · Vou plantar** | Celular entra. Header Céu "Hello, producer!". Município Pato Branco. O seletor de datas com barras de risco: o dedo troca de 20 Oct para 20 Sep e o anel grande muda ("4 /10" → "1 /10"). | Move the date. See the risk. · "19 of 45 seasons · about 4 in 10" | "Pick your town and a soybean date. The answer comes first: in how many of the last forty-five seasons did frost or drought reach your corn? It is history, not a forecast." | Tela 1; números reais do app (Pato Branco: 20/10 geada 19 de 45; 20/09 geada 4 de 45) |
| 6 | 49–55 | **tela 1 · Dica do Broto** | O Broto sobe: "Plant on 20/09 and frost drops. But early soy meets more drought. See both before you decide." | See both before you decide. | "And it never hides the trade-off. An earlier date can cut frost but meet more drought." | Dica deve ser calculada, não fixa (ver pendências) |
| 7 | 55–61 | **tela 4 · Rotações** | Três cartões: Geada / Solo / Renda com selos bom, atenção, ruim; chips Renda · Solo · Os dois. | Three rotations. Your priorities. | "Then it compares three rotations, ranked by what matters to you." | Tela 4; lógica de `rotacoes.ts` |
| 8 | 61–71 | motion + tela | Quatro cartas entram sobre Céu: NASA POWER · NASA SRTM 30 m · NOAA RONI · Open-Meteo. Selo "in your browser, ~2 s". | NASA POWER, 1981–2026 | "Under the hood: NASA POWER daily data for minimum temperature, rain and soil wetness. SRTM relief. NOAA's El Niño index. Everything runs in the browser, in about two seconds. The forecast only checks the planting week." | README "What the NASA data does" |
| 9★ | 71–79 | motion | Volta ao Céu. Logo grande com a órbita. Link. | Not a forecast. A decision aid. | "It's not a forecast. It's history, to help farmers choose. Try it at houston-we-have-a-harvest dot vercel dot app." | README "Limitations" |

★ = corte de 30 s para o envio (1, 2, 5, 9). Fala total ~140 palavras ≈ 78 s com pausas.

## O que ficou de fora de propósito
Da tela 1, 2 e 3 do artefato: **WhatsApp, lembretes, selo "Dá pra fazer seguro (ZARC)", previsão de pulverização e "Já plantei" com anel de dias.** O próprio artefato marca isso como ilustrativo e o README diz que o ZARC ainda não está integrado. Regra do repositório de vídeo: a tela vem do produto real, sem inventar recurso. Só entram no vídeo se o outro Claude os implementar de verdade. Se entrarem, acrescentamos uma batida de 6 s (ex.: tela 2 ou 3).

## Pendências que dependem do outro Claude (app novo)
1. **Datas do seletor.** O app hoje usa 01/10, 10/10, 20/10, 30/10, 10/11. O artefato mostra 20/09 a 30/10. A batida 5 e 6 usam 20/09 vs 20/10, então a data 20/09 precisa existir no app novo.
2. **Dica do Broto calculada** a partir do risco real, com a seca da data sugerida aparecendo. Se for texto fixo, não gravar.
3. **Idioma.** O artefato diz "português primeiro". O envio ao NASA exige inglês. Para o vídeo, gravar em EN.
4. **Texto exato das telas.** Os "Texto na tela" e falas acima citam o artefato em inglês livre. Confirmar os rótulos em EN quando o app novo estiver pronto, e regravar as telas só depois.

## Telas a capturar (quando o app novo estiver no ar)
Tela 1: Pato Branco, soja 20/10, depois 20/09, com o anel animando. Tela 1: Dica do Broto. Tela 4: Rotações com "Os dois" selecionado. Em EN, conta de demonstração, sem dado real.

## Peças de motion
Céu com satélite e órbita · linha do tempo soja/milho/geada · barra 111 de 143 Mt · ilustração de lavoura com a órbita do satélite · cartas de dados · pilha de stack · cartela final com logo.

## Onde preciso de você
1. Aprova a estrutura (10 batidas, ~75 s) e o fio da órbita?
2. A batida 6 (dica do Broto) fica, ou cortamos para encurtar?
3. Quando o app novo estiver pronto, me avise para eu fechar as falas com os textos reais.

## Correções da leitura cega (aplicadas)
- Calendário passou de 10 para 13 s e a voz explica que a floração é o momento sensível do milho.
- Fonte do Deral aparece na tela na batida 2.
- Frase "cost a farm its season" trocada por "put frost on the corn at its worst moment".
- Mapa ganhou a legenda "Where we grew up" (sem nome de cidade).
- Batida 5: tela mostra "19 of 45 seasons · about 4 in 10" e a voz diz que é histórico, não previsão.
- Batida 8: cada cartão diz o que muda na resposta; a previsão aparece como "planting-week check only".
- Pendente: a legenda do app novo (batida 5) precisa mostrar 45 safras ao lado do "X em 10".
