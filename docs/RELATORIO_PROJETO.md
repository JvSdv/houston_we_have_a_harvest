# weharvest — Relatório de funcionamento do projeto

**Para:** time · **Projeto:** Houston, We Have a Harvest (NASA Space Apps 2026) · **Site:** https://weharvest.vercel.app

## Resumo para o time

A parte de **dados e a parte técnica estão funcionais e testadas**. O que falta é **melhorar o design e gravar o vídeo**.

- Dados reais da NASA entram, o motor calcula e a tela mostra o resultado, de ponta a ponta.
- 61 testes automáticos passam; lint e build passam; o site está no ar na Vercel.
- O redesign visual (tema claro, seletor de data com barras de risco, layout em 2 colunas) já foi implementado e publicado; falta a revisão final de design.
- Falta: **vídeo de apresentação** e **polimento de design** (revisão com usuários reais, ajustes finos).

## 1. O que o app responde

> "Se eu plantar a soja nesta data, em quantos dos últimos 45 anos o milho safrinha teria pego geada ou seca na fase crítica?"

Para o produtor do Sul do Brasil, o app mostra o risco histórico de **geada** e **seca** no milho safrinha conforme a **data de plantio da soja** (8 datas, de 20/09 a 30/11), com veredito (risco baixo / moderado / alto), "X em 10 anos", melhor data só pensando na geada e calendário da safra.

## 2. Como funciona (ponta a ponta)

1. **Dados:** NASA POWER (diário, desde 1981: temperatura mínima, chuva, umidade do solo). Pato Branco, Cascavel e Francisco Beltrão já vêm prontos em `src/data/`. Qualquer outro município ao sul de 22°S é baixado na hora, no navegador (~2 s).
2. **Motor de cálculo** (`src/lib/engine/`, funções puras com testes): cronograma da soja e do milho, fase crítica (55–100 dias após o plantio do milho), regra de geada (mínima ≤ 3 °C; ≤ 4 °C em baixada), regra de seca (15+ dias secos ou solo entre os 20% mais secos), frequência e nível de risco (Baixo ≤ 1 em 10, Médio 2–3, Alto ≥ 4), confiança por tamanho da amostra.
3. **Filtro El Niño / La Niña** (índice RONI da NOAA): recalcula tudo só com anos parecidos, com aviso quando a amostra é pequena (< 12 anos).
4. **Rotações** (soja → milho safrinha / milho + braquiária / trigo): comparação por geada, seca e erosão, com ordem pelo que o produtor prioriza (renda, solo e água, equilíbrio) e pelo que ele não consegue fazer. Botão de **WhatsApp** e de copiar o resumo.
5. **Previsão de 16 dias** (Open-Meteo): "posso plantar esta semana?". Só consulta quando o usuário toca no botão; envia apenas as coordenadas públicas do município.
6. **Provas e detalhes:** anos em que o evento ocorreu, comparação com a safrinha 2026 (relatos do Deral), relevo (NASA SRTM), campo descoberto ao longo do ano, teste com produtividade do IBGE, glossário e método.
7. **Bilíngue (PT/EN)** em toda a tela, com `?lang=` para compartilhar link.

## 3. Estado de cada parte

| Parte | Estado |
|---|---|
| Coleta de dados (NASA POWER, RONI, SRTM, IBGE) | Funcional (scripts em `scripts/`) |
| Motor de risco (geada, seca, ENSO, calendário, previsão) | Funcional, 61 testes passando |
| Busca de qualquer município do Sul | Funcional (testado com Guarapuava) |
| Rotações, WhatsApp, copiar | Funcional |
| Interface (PT/EN, celular e desktop) | Implementada e no ar; sem rolagem lateral, alvos de toque ≥ 44 px |
| Deploy | Vercel, produção |
| **Design — refinamento final** | **Pendente** |
| **Vídeo de apresentação** | **Pendente** |

## 4. Números de referência (para conferir a demonstração)

Pato Branco, soja em 20/10: **geada 19 de 45 safras (4 em 10 anos), seca 15 de 45 (3 em 10 anos)**. Com "lavoura em baixada", a geada sobe para 30 de 45. Com filtro La Niña (12 anos): geada 6 de 12, seca 3 de 12.

## 5. O que dizer com honestidade (importante para o vídeo e para a banca)

"Funcional" aqui significa que o fluxo de dados e o cálculo funcionam e estão testados. Isto **não** significa que os limiares estejam validados no campo:

- Ciclos das culturas, fase crítica, limite de geada (3 °C), ajuste de baixada (+1 °C) e critério de seca são **hipóteses de partida a validar com agronomia/ZARC**.
- O **teste com a produtividade do IBGE não foi conclusivo**: não conseguimos confirmar que os anos marcados produziram menos. Os níveis descrevem a **frequência histórica do evento**, não perda de produtividade.
- A grade da NASA POWER tem ~50 km e a temperatura é do ar a 2 m: não representa o microclima de uma lavoura.
- Não é previsão do tempo; é apoio à decisão, que não substitui o agricultor nem o agrônomo.

## 6. O que falta (próximos passos)

1. **Vídeo:** roteiro curto (problema → escolher município e data → veredito "X em 10 anos" → melhor data → rotações e WhatsApp → provas e limitações). Sugestão de cena principal: Pato Branco, soja em 20/10, e o botão "Ver com 20/09".
2. **Design:** revisão visual final; teste com 2–3 agricultores (roteiro em `TESTE_COM_AGRICULTOR.md`); ajuste da altura do painel "Sua lavoura" no celular (hoje 661 px, meta do plano era 560 px) e do seletor de datas em telas pequenas (a 8ª data exige rolar de lado).
3. Conferir no site publicado que o visual novo carregou (cache).

## 7. Como rodar

```bash
nvm use && npm install
npm run dev     # http://localhost:3000
npm test        # 61 testes
npm run lint && npm run build
```

Documentação completa do método, fontes e limitações: `README.md`. Plano do redesign: `docs/PLANO_UI_UX.md`.
