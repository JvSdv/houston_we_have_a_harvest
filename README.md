# weharvest 🛰️🌱 — Houston, We Have a Harvest

**NASA Space Apps Challenge 2026 · Challenge _Field Shift: Adapting Farms with NASA Data_**

🔗 **App:** https://weharvest.vercel.app

[English](#english) · [Português](#português)

---

## English

> **App language:** English by default (required by NASA Space Apps); a phone set to Portuguese opens it in Portuguese. Either language is one tap away on the first screen and in the **More** tab. Every screen, rule and message exists in both languages. The choice is remembered, and `?lang=pt` or `?lang=en` in the link forces a language.

### What it is

In southern Brazil the same field yields two crops a year: soybean in summer, then _safrinha_ (second-season) corn. **The soybean planting date decides when the corn reaches its critical stage** (tasseling and grain fill), and so its frost and drought risk.

weharvest answers one question:

> _"If I plant soybeans on this date, in how many of the last ~45 seasons would the second-crop corn have met frost or drought in its critical stage?"_

It then compares three rotations (soybean → corn, soybean → wheat, soybean → corn + _Brachiaria_ grass) for the farmer's own field. The farmer says what matters most (income, protect soil and water, balance) and what they cannot do (grow wheat, manage brachiaria, little water), and the options are re-ordered with the reason shown. It is a **decision-support tool**: it does not replace the farmer or the agronomist.

Demonstration case: southwestern Paraná (Pato Branco, Cascavel, Francisco Beltrão), where the April 2026 drought and the May 2026 frost caused losses reported by Deral (the Paraná state agriculture department).

### What the NASA data does here

NASA data is the core of the answer, not decoration. **NASA POWER daily data (1981–2026)** gives, for each municipality, the minimum air temperature (frost), rainfall and root-zone soil wetness (drought). **NASA SRTM 30 m** gives the elevation and the relief around each point. **Any municipality in southern Brazil:** the user can search a municipality by name (Open-Meteo geocoding) or use their location, and the app downloads the 45 years of NASA POWER data for that point **straight from NASA, in the browser** (about 2 seconds, 1.3 MB), then runs the same engine there. Three municipalities (Pato Branco, Cascavel, Francisco Beltrão) are also stored with the code (`src/data/`), so the app still works without a live connection for them, and they include the SRTM relief and the 2026 comparison. We checked that a fresh download of Cascavel equals the stored file (67,004 values, 0 differences). The app only computes south of 22°S (PR, SC, RS and nearby areas): the cycles and the drought rule were calibrated there, and elsewhere (for example the dry season in Mato Grosso) the drought rule would flag normal conditions as risk.

### Run locally

```bash
nvm use            # Node 24 (.nvmrc)
npm install
npm run dev        # http://localhost:3000
npm test           # 48 automated tests of the risk engine and the rotation ordering
npm run data:fetch # re-download NASA POWER, NOAA RONI and SRTM data
npm run data:ibge  # re-download IBGE yield data, then: npm run backtest
```

### Data sources

| Source | Use | Link |
|---|---|---|
| **NASA POWER Daily API** (community=AG) | Daily T2M_MIN, T2M_MAX, PRECTOTCORR, GWETROOT, GWETTOP, 1981-01-01 to the latest day available, for Pato Branco (-26.2295, -52.6716), Cascavel (-24.9578, -53.4595) and Francisco Beltrão (-26.0811, -53.0558) | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ |
| **NASA SRTM 30 m** (SRTM v3, via OpenTopoData, dataset `srtm30m`) | Elevation at each municipality point and relief within 1.5 km (49 points every 500 m) | https://www.opentopodata.org/datasets/srtm/ |
| **NOAA CPC · RONI** (Relative Oceanic Niño Index); the older ONI (ERSST v5) is kept only for comparison | El Niño / La Niña phase of each season (optional "See only El Niño or La Niña years" link inside "Understand the numbers") | https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/ |
| **Open-Meteo** (CC BY 4.0, non-commercial use) | 16-day forecast for the "can I plant this week?" check and the week view in the calendar, read in the browser (only the municipality coordinates are sent) | https://open-meteo.com/ |
| **Deral via Revista Cultivar**, Apr 9 and May 19, 2026 | Field reports used only for the "2026 proof" card | https://revistacultivar.com.br/noticias/pr-safra-2025-26-estiagem-e-calor-afetam-feijao-e-milho · https://revistacultivar.com.br/noticias/pr-safra-2025-26-milho-e-feijao-sofrem-impacto-das-geadas |
| **IBGE SIDRA · Municipal Agricultural Survey (PAM), table 839** | Second-crop corn yield and harvested area (Cascavel, Francisco Beltrão, Pato Branco) for the reality check | https://sidra.ibge.gov.br/tabela/839 |
| **ZARC (Brazilian Ministry of Agriculture)** | Reference for official planting windows; **not yet integrated** | https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f |

Each data file stores the arrays per variable, the start date, the URL used and the download date. For municipalities chosen by the user, the same format is built in the browser from the API response (`src/lib/power.ts`; tests check the conversion and that the result equals the pre-downloaded path). Only the typed name (to Open-Meteo) or the coordinates (to NASA POWER, if "use my location") leave the device; nothing is stored.

### How risk is computed

Code in `src/lib/engine/` (pure functions with tests); parameters in `src/lib/engine/params.ts`. The rules follow the team's methodology document, with the deviations listed below.

1. **Calendar:** soybean harvest = planting + 120 days; corn planting = harvest + 5 days; **corn critical stage** = 55 to 100 days after corn planting.
2. **Likely frost:** a season counts if the 2 m minimum air temperature (T2M_MIN) was **≤ 3 °C** on any day of the critical stage; **strong frost** ≤ 1 °C. Why 3 °C: screen-height and grass-level temperatures differ by 3–6 °C, so 3 °C at 2 m ≈ frost on the grass ([Embrapa Trigo](https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1084446/1/ID442832017CBAGRO20MM398.pdf), [Embrapa agroclimatic bulletin](https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1139138/1/BolAgroClimatico-dez21.pdf), [Semina/UEL](https://ojs.uel.br/revistas/uel/index.php/semagrarias/article/download/30322/24555/166627)).
3. **Drought:** a season counts when, in the critical stage, **either** signal holds: a dry spell of **15+ consecutive days with rain < 1 mm**, **or** mean root-zone soil wetness (GWETROOT) **below the 20th percentile** of the same series for the same calendar dates. The screen shows both signals separately and the years with **both** (the most severe). **Deviation from the methodology:** the document asked for "and"; we use "or" because the "and" rule did not flag the documented 2026 drought. Because the soil signal is relative, about 1 in 5 years always shows up as dry soil; the rule should be calibrated with yield statistics (IBGE), which is future work.
4. **Lowland:** the frost limit rises by **+1 °C** (3 → 4 °C), because lowlands pool cold air. A hypothesis to calibrate: the station test below measured about 0.4 °C. Each plot can now be classified by GPS in the app (point 10 m or more below the mean terrain within 1.5 km, Copernicus DEM 90 m), and the SRTM relief of the 3 demo towns is still shown.
5. **Frequency:** event seasons ÷ evaluated seasons, shown as "X in 10" and "N of 45 seasons". **Level:** Low (up to 1 in 10), Medium (2–3), High (4 or more). **Confidence:** high (≥ 12 seasons), medium (7–11), low (< 7).
6. **Rotations:** each rotation shows levels per criterion (frost, drought, erosion), with no hidden single score. In **"For your field"** the farmer chooses what matters most and what they cannot do; this changes only the **order** and the labels (a qualitative 1–3 sum), never the risk numbers. A rotation the farmer cannot do moves to the end with the reason; it is not removed. A "Copy summary" button makes a short text to share.
7. **Wheat:** the risk of **frost at heading** (70–110 days after sowing on May 15, i.e. Jul 24 to Sep 2) is computed from the same NASA POWER series and the same limits as corn; it does **not depend on the soybean date**. The screen also shows the result for sowing on Apr 30, May 30 and Jun 15, because it depends strongly on that assumption (Pato Branco: 36, 33, 30 and 19 of 46 seasons for Apr 30, May 15, May 30 and Jun 15). Wheat drought and the El Niño filter are **not** applied to wheat, and wheat stays neutral in the tie-break of the rotation order.

### 2026 test (Pato Branco, soybean planted Oct 20)

- **Frost in the critical stage in 2026: yes** (also with the lowland limit), consistent with the Deral report of May 2026.
- **Drought in the critical stage in 2026:** POWER shows the 5th driest April soil moisture since 1981 but no 15-day dry spell. The original "dry spell **and** dry soil" rule said "no", against Deral's drought report; with "dry spell **or** dry soil" the year is flagged. The screen shows the signals separately so the technician can see what supports the number.
- **Wheat heading window (Jul 24–Sep 2, 2026):** lowest minimum 4.4 °C, no frost ≤ 3 °C. The Deral report on wheat is from May, with the crop still vegetative, so it does **not** test this window.

### El Niño / La Niña ("similar years") — optional

Inside "Understand the numbers" (under the answer), a link "See only El Niño or La Niña years" opens a short plain-language explanation and the choice. The user can restrict every count to **All / El Niño / La Niña / Neutral** seasons. The app **never guesses** the phase of the coming season: it only shows NOAA's latest published value (informative) and a link to the seasonal outlook.

- **Index:** NOAA's **RONI**. NOAA's ONI page says it has moved and that RONI is the index now used for official ENSO monitoring. The older ONI is downloaded too (`scripts/fetch_enso.mjs`, `src/data/enso.json`) only for comparison; it would classify about **15%** of the April–August seasons (1982–2026) differently.
- **Phase of each season:** the 3-month season centered on the **middle of the corn critical stage** for that planting date. **El Niño** if the index ≥ +0.5, **La Niña** if ≤ −0.5, **Neutral** in between. This is a simplification (NOAA declares an episode only after 5 consecutive seasons).
- **Drought limits** (20th percentile of soil wetness) are still computed with **all** years; the filter only counts how many years of the phase had the event.
- **Sample size:** each phase has 8–25 seasons depending on the date. Below 12 seasons the screen warns to read with caution and confidence drops.
- **What the data shows (Pato Branco, soybean on Oct 20):** frost in 3 of 8 El Niño seasons, 6 of 12 La Niña and 10 of 25 neutral (19 of 45 overall). The difference between phases is small next to the uncertainty of such short samples: **there is no strong El Niño/La Niña signal here**, and the app does not pretend there is.

### Bare field through the year

For each rotation and planting date the app builds the 365-day line from one soybean planting to the next (`src/lib/engine/calendario.ts`, with tests) and shows when the field has **no crop** (only residue), living cover (brachiaria) or a crop.

- **Cycle hypotheses (to validate with agronomy/ZARC):** soybean 120 days, 5-day gap, corn 135 days, wheat sown on May 15 with a 130-day cycle. Because cycles are fixed, the **days without a crop are the same for any soybean date** (110 for corn, 115 for wheat, 5 for brachiaria); what changes is **which months** they fall in.
- **Rain on those days:** average rainfall and days with 50 mm or more, computed from NASA POWER daily data (1981–2025) on the no-crop days only. It is a ~50 km grid average and understates local storms.
- **Erosion level** (team methodology), computed from days without a crop: more than 60 = **High**; up to 15 = **Low** (our tolerance, equal to the sowing gap); in between = **Medium**. It ignores terrain slope and the month of the rain.
- **Wheat and the next soybean:** with the example sowing on May 15, wheat harvest runs past the next soybean planting date when soybean is planted up to about Sep 29; the screen warns.

### 16-day check before planting

The app reads the 16-day Open-Meteo forecast in the browser (only the municipality's public coordinates are sent; if the service fails, the page keeps working). Rules in `src/lib/engine/previsao.ts`, with tests: minimum air temperature ≤ 3 °C (4 °C in lowlands) or rain ≥ 50 mm in the next 7 days = **"Do not plant this week"**; less than 10 mm of rain in 7 days, or the same events after the first week = **caution**. These are **hypotheses to validate with agronomy**; a forecast is not a guarantee and uncertainty grows after about 7 days.

### Reality check with IBGE yield data (first version, 3 municipalities: inconclusive — see the larger test in Real-world tests)

We tested whether the seasons the app flags had lower **second-crop corn yields**, using IBGE's Municipal Agricultural Survey (PAM, table 839, "Milho 2ª safra"; `scripts/fetch_ibge_pam.mjs`). Rules fixed **before** looking at the result (`scripts/backtest_ibge.mjs`, `npm run backtest`): main soybean date Oct 20; only years with at least 500 ha harvested; yield anomaly = (yield − municipal linear trend) ÷ trend, to remove the technology trend; difference of mean anomaly between flagged and not flagged years, with a permutation p-value inside each municipality.

- **Result: no detectable difference.** 57 municipality-years (Cascavel 23, Francisco Beltrão 23, Pato Branco 11). Frost or drought: flagged years +0.5% (35) vs not flagged −1.2% (22), p = 0.79. Frost only: +1.0% vs −0.5%, p = 0.84. Drought only: −0.2% vs −0.1%, p = 0.99. Across all 24 comparisons (8 soybean dates × 3 event types) one had p < 0.05, about what chance alone gives (1.2). Continuous measures (lowest minimum temperature, mean soil wetness) also showed correlations near zero (−0.17 to +0.26).
- **What we conclude:** we could **not** confirm that flagged years produced less. The app's levels describe how often the weather event occurs in the critical stage; they are **not** a predicted yield loss.
- **Why the test may miss it:** municipal yields are estimates (many round values; Cascavel reports the same harvested area, 58,000 ha, in 2021–2024); the NASA grid is ~50 km; real planting dates vary between farms; 61% of the years are flagged (little contrast); few years. Absence of evidence here is not evidence of absence.
- Tests (`src/lib/backtest.test.ts`) re-compute the yield anomalies and the flags independently of the script.

### Real-world tests

<!-- testes:en -->
We ran four tests against real measured data. Each test’s rules were written at the top of its script **before** running it; anything changed afterwards is marked. Results are shown in the app (More tab › Tests with real-world data) as they came out. Scripts: `scripts/validacao/`; to redo: `node scripts/validacao/fetch_estacoes.mjs`, `fetch_ibge_sul.mjs`, `validar_estacoes.mjs`, `validar_ibge_sul.mjs`, `validar_previsao.mjs`.

- **1. Satellite × stations (frost).** 113 INMET automatic stations in southern Brazil (NOAA/NCEI Global Summary of the Day copy), 2016–2026, 307,517 days. NASA POWER’s minimum tracks the measured one (correlation 0.90, mean error 1.8 °C), but on cold days it runs 0.7 °C warmer. In the corn flowering window with soybeans on Oct 20, app and station agreed in 84% of 744 seasons (kappa 0.51): the app caught 56% of seasons with measured frost, and 33% of its flags did not show up at the station. Across all 19 planting dates: caught 76%, false alarms 15% (kappa 0.70). **Drought:** only 28 seasons had complete station rain; too few to conclude.
- **2. Lowland × terrain.** For 103 stations, we compared how much colder the station is than NASA on cold nights (after altitude) with its terrain position (point − mean terrain within 1.5 km, Copernicus DEM 90 m). Each 10 m below the surroundings: 0.19 °C colder (correlation 0.31, p = 0.003). The 17 lowland stations (≥ 10 m below the surroundings) were 0.4 °C colder than the other 86. **Terrain matters, but the app’s +1 °C looks overstated** (measured: ~0.4 °C). The app now measures each plot’s terrain by GPS (More tab) and turns "lowland" on with the same rule.
- **3. Flagged years × yield (IBGE).** 269 municipalities in PR and SC, 5,652 municipality-years (PAM table 839, second crop ≥ 500 ha, ≥ 12 years), anomaly against each municipality’s trend. Soybeans on Oct 20: in years flagged for **drought** corn yielded **-7.5%** (p < 0.001); frost or drought -7.7%; **frost** -1.2% (p = 0.30, no difference — at that date it is rare in Paraná). With soybeans on Nov 20 frost hits flowering more often and flagged years yielded -12.4%. Caveats: comparing municipalities within the same year, the difference disappears (drought -0.4%, p = 0.37); and drought hits the whole region at once, so municipalities are not independent. In an extra check, **added after seeing the result**, counting each year once (23 seasons), the direction holds (-11.5% in a fully flagged year) but could be chance (p = 0.18). Conclusion: years the app flags for drought tend to yield less, but this is not yet firmly established; the levels measure weather frequency, not predicted loss.
- **5. Weekly forecast × measured.** Forecasts Open-Meteo actually published (previous-runs API), 2024–2026, 40 stations. The "Can I plant this week?" rule (frost ≤ 3 °C or rain ≥ 50 mm within 7 days): of the weeks when this happened at the station, the warning caught 15%; 68% of warnings were false alarms (797 weeks). Frost forecast 1 day ahead: caught 59% (false alarms 26%); 7 days ahead: 35% (false alarms 51%). Declared change: the coverage rule went from 80% to 50% of days because no station had 80%, decided before seeing any hit rate. **Conclusion:** the forecast helps for the next 1–3 days, but the whole-week warning misses most frosts and heavy rains; so the card now says "No alert in the forecast" (not "Good to plant") and shows this result.
- **4. Crop insurance (PSR/MAPA)** was left out: the ministry portal does not open from the development environment. The test is designed (flagged years × frost and drought claims on corn, by municipality) and will run once `dados_abertos_psr_2016a2024csv.csv` is downloaded from https://dados.agricultura.gov.br/dataset/sisser3.
<!-- /testes:en -->

### Hypotheses and what is estimated

- Cycles (soybean 120, gap 5, corn 135, wheat 130 days; wheat sowing on May 15), the critical stage (55–100 days), the frost limits (3 °C and 1 °C), the lowland adjustment (+1 °C) and the drought criteria are **starting hypotheses to validate with agronomy and ZARC**.
- **Wheat sensitive stage:** the literature points to booting-to-flowering as the stage of serious frost damage, with minimum temperatures at the plant around 0 to −2 °C ([Revista Cultivar](https://revistacultivar.com.br/noticias/como-ocorrem-os-danos-por-geada-no-trigo); [GRDC](https://grdc.com.au/resources-and-publications/grdc-update-papers/tab-content/grdc-update-papers/2015/02/preliminary-rating-of-wheat-varieties-for-susceptibility-to-reproductive-frost-damage)). The 70–110-day window after sowing and the 3 °C screen limit are **hypotheses** to validate with Embrapa Trigo and ZARC.
- How well each rotation meets the farmer's priorities, and the mapping of "what matters most" to those priorities, are **qualitative** (marked "to be validated with an agronomist"). The erosion level is **computed** from the days without a crop (example cycles) and ignores slope.
- If the SRTM service fails, `scripts/fetch_srtm_relief.mjs` falls back to the mean elevation of the POWER cell and the screen marks the value as **estimated**. POWER temperature gets no elevation correction.

### Limitations

- NASA POWER is a **~50 km grid**: it does not represent the microclimate of a single field.
- Temperature is **2 m air temperature**, not surface temperature. Frost on grass or leaves can occur with the 2 m air above 0 °C; hence the 3 °C limit.
- Crop cycles are **examples**; cultivar, management and region change everything.
- **Not a weather forecast.** It is historical frequency; only the "Can I plant this week?" card uses a forecast; tested against stations, it does better 1–3 days ahead and poorly for the whole week (see Real-world tests, test 5).
- NASA POWER runs about 0.7 °C warmer than stations on cold days and misses some light frosts (Real-world tests, test 1).
- Wheat drought is not computed, and the wheat frost result depends strongly on the assumed sowing date.
- ENSO classification uses NOAA's official table but with a simplified rule, and samples per phase are short.
- Yield link: in 269 municipalities, years flagged for drought yielded about 7.5% less, but counting each year once the difference is not yet conclusive; frost with soybeans on Oct 20 showed no difference (Real-world tests, test 3).
- For municipalities chosen by the user, SRTM relief and the 2026 proof are not available, and results rest on the same hypotheses (check ZARC); outside southern Brazil the app does not compute.
- Not built yet: local soil data (for example SoilGrids), vegetation stress (NASA MODIS NDVI), an interactive map, ZARC integration and the crop-insurance test (needs the MAPA PSR file).

### Technology

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · tests with Node's built-in test runner · deployed on Vercel (no secret keys in the code). Font: Archivo (Google Fonts, SIL Open Font License); icons: Lucide (ISC). The app contains no photographs, no images of people and no NASA logos.

---

## Português

> **Idioma do app:** inglês por padrão (exigência do NASA Space Apps); celular em português abre em português. A troca fica a um toque na primeira tela e na aba **Mais**. Todas as telas, regras e mensagens existem nos dois idiomas. A escolha fica guardada, e `?lang=pt` ou `?lang=en` no link força um idioma.

### O que é

No Sul do Brasil a mesma terra tem duas safras por ano: soja no verão e milho safrinha logo depois. **A data de plantio da soja define quando o milho safrinha floresce** e, portanto, o risco de geada e de seca nessa fase.

O weharvest responde:

> _"Se eu plantar a soja nesta data, em quantos dos últimos ~45 anos o milho safrinha teria pegado geada ou seca na fase crítica?"_

E compara três rotações (soja → milho safrinha, soja → trigo, soja → milho + braquiária) segundo as prioridades do agricultor (renda, menos risco, solo). É uma ferramenta de **apoio à decisão**: não substitui o agricultor nem o técnico.

Caso de demonstração: Sudoeste do Paraná (Pato Branco), onde estiagem (abril/2026) e geada (maio/2026) causaram perdas relatadas pelo Deral.

### Como rodar

```bash
nvm use            # Node 24 (.nvmrc)
npm install
npm run dev        # http://localhost:3000
npm test           # 48 testes automáticos do motor e da ordem das rotações
npm run data:fetch # baixa de novo os dados diários da NASA POWER, o RONI e o SRTM
npm run data:ibge  # baixa a produtividade do IBGE; depois: npm run backtest
```

### Fontes de dados

| Fonte | Uso | Link |
|---|---|---|
| **NASA POWER Daily API** (community=AG) | T2M_MIN, T2M_MAX, PRECTOTCORR, GWETROOT, GWETTOP diários, 01/01/1981 até o último dia disponível, para Pato Branco (-26.2295, -52.6716), Cascavel (-24.9578, -53.4595) e Francisco Beltrão (-26.0811, -53.0558) | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ |
| **Deral / Revista Cultivar, 9 abr 2026** | Estiagem e calor afetam feijão e milho (card "Prova 2026") | https://revistacultivar.com.br/noticias/pr-safra-2025-26-estiagem-e-calor-afetam-feijao-e-milho |
| **Deral / Revista Cultivar, 19 mai 2026** | Geadas: milho safrinha em baixadas com queima de folhas; feijão 2ª safra com perdas; trigo sem dano significativo | https://revistacultivar.com.br/noticias/pr-safra-2025-26-milho-e-feijao-sofrem-impacto-das-geadas |
| **NOAA CPC · RONI** (Relative Oceanic Niño Index) e ONI antigo (ERSST v5) | Fase do El Niño / La Niña de cada safra (filtro "anos parecidos"); o ONI antigo fica no arquivo só para comparação | https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/ · https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt |
| **NASA SRTM 30 m** (SRTM v3, via OpenTopoData, dataset `srtm30m`) | Altitude do ponto de cada município e desnível do entorno (1,5 km) | https://www.opentopodata.org/datasets/srtm/ |
| **Open-Meteo** (previsão, CC BY 4.0, uso não comercial) | Previsão de 16 dias (mínima, máxima e chuva) para a checagem "posso plantar agora?" | https://open-meteo.com/ |
| **IBGE SIDRA · PAM, tabela 839** | Rendimento e área colhida do milho 2ª safra (3 municípios), para o teste com dados reais | https://sidra.ibge.gov.br/tabela/839 |
| **ZARC (MAPA)** | Referência para janelas de semeadura (ainda não integrado ao app) | https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f |

Os dados dos 3 municípios de demonstração ficam em `src/data/power_daily_<id>.json` (arrays por parâmetro + data inicial, com a URL usada e a data do download) e funcionam sem a API ao vivo. **Qualquer município do Sul do Brasil** (ao sul de 22°S) pode ser escolhido pelo nome ou pela localização: o navegador baixa na hora os 45 anos da NASA POWER daquele ponto (cerca de 2 s) e roda o mesmo motor (`src/lib/power.ts`, `src/lib/local-view.ts`). Fora do Sul o app não calcula, porque os ciclos e a regra de seca foram calibrados lá. Municípios escolhidos não têm o relevo SRTM nem a comparação com 2026.

### Como os riscos são calculados

Regras do documento do time **"GroundTruth — Metodologia e validação"**. Código em `src/lib/engine/` (funções puras, com testes); parâmetros em `src/lib/engine/params.ts`.

1. **Cronograma:** colheita da soja = plantio + 120 dias; plantio do milho = colheita + 5 dias; **fase crítica do milho** (pendoamento e enchimento de grãos) = 55 a 100 dias após o plantio do milho. Na tela, em português, a fase crítica aparece como **"floração e enchimento"**, com as datas, e há um glossário de uma linha por palavra ("O que significam essas palavras?").
2. **Geada provável:** um ano conta se a mínima do ar a 2 m (T2M_MIN) ficou **≤ 3 °C** em algum dia da fase crítica. **Geada forte:** ≤ 1 °C. Por que 3 °C: a diferença entre abrigo e relva é de 3–6 °C; 3 °C no abrigo ≈ −1 °C na relva ([Embrapa Trigo](https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1084446/1/ID442832017CBAGRO20MM398.pdf), [Embrapa, boletim agroclimático](https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1139138/1/BolAgroClimatico-dez21.pdf), [Semina/UEL](https://ojs.uel.br/revistas/uel/index.php/semagrarias/article/download/30322/24555/166627)).
3. **Seca:** um ano conta quando, na fase crítica, vale **um dos dois** sinais: veranico de **15+ dias seguidos com chuva < 1 mm** **ou** umidade média do solo na raiz (GWETROOT) **abaixo do percentil 20** da própria série para as mesmas datas do ano. A tela mostra os dois sinais separados e os anos com **os dois juntos** (casos mais graves). **Desvio da Metodologia:** o documento pedia "e"; trocamos por "ou" porque a regra "e" não marcou a estiagem de 2026 registrada pelo Deral. Como o sinal de solo é relativo, cerca de 1 em cada 5 anos sempre aparece como solo seco; a regra deve ser calibrada com dados de produtividade (o teste com o IBGE PAM, abaixo, não foi conclusivo).
4. **Baixada:** o limite de geada sobe **+1 °C** (de 3 para 4 °C), porque baixadas acumulam ar frio. Hipótese a calibrar. O teste com estações (abaixo) mediu cerca de 0,4 °C. Agora cada talhão pode ser classificado pelo GPS no app (ponto 10 m ou mais abaixo da média do terreno em 1,5 km, Copernicus DEM 90 m); o relevo SRTM das 3 cidades de demonstração continua na tela.
5. **Frequência:** anos com evento ÷ anos avaliados, mostrada como "X/10 anos" e "N de 45 safras". **Nível:** Baixo (até 1 em 10), Médio (2 ou 3), Alto (4 ou mais).
6. **Confiança:** alta (≥ 12 anos), média (7–11), baixa (< 7). A Metodologia também pede concordância com Deral/IBGE para "alta"; o teste com o IBGE (abaixo) não foi conclusivo.
7. **Rotações:** cada rotação mostra níveis por critério (geada, seca, erosão), sem nota única escondida. O painel **Seu campo** pergunta o que pesa mais (renda, proteger solo e água, equilíbrio) e o que o agricultor não consegue fazer (trigo, braquiária, pouca água). Isso muda só a **ordem** e as etiquetas, por uma soma qualitativa de 1 a 3; a rotação inaplicável vai para o fim com o motivo, sem sumir. Há um botão para copiar o resumo. **Trigo:** o risco de **geada no espigamento** (70–110 dias após a semeadura em 15/05, isto é, 24/jul a 02/set) é calculado com a mesma série da NASA POWER e os mesmos limites do milho; vale para qualquer data da soja. A tela mostra também o resultado para semeadura em 30/04, 30/05 e 15/06, porque ele depende muito dessa hipótese (em Pato Branco: 36, 33, 30 e 19 de 46 safras). A seca do trigo e o filtro de El Niño **não** são aplicados ao trigo.

### Teste com 2026 (Pato Branco, soja em 20/10)

- **Geada na fase crítica em 2026: sim** (também com o limite de baixada), coerente com o Deral de maio/2026.
- **Seca na fase crítica em 2026:** o POWER mostra o 5º abril com solo mais seco desde 1981, mas sem veranico de 15 dias. Pela regra original "veranico **e** solo seco" o app dizia "não", contra o relato de estiagem do Deral; com "veranico **ou** solo seco" o ano é marcado. A tela mostra os sinais separados para que o técnico veja o que sustenta o número.

### Anos de El Niño / La Niña ("anos parecidos")

O usuário escolhe **Todos / El Niño / La Niña / Neutro** e a tela recalcula geada, seca, recomendação, gráfico e rotações usando só os anos daquela fase. O app **não adivinha** a fase da próxima safra: mostra apenas o último valor publicado pela NOAA (informativo) e o link da previsão sazonal.

- **Índice:** **RONI** da NOAA. A página do ONI citada na Metodologia (ERSST v5) avisa que mudou e que o RONI é o índice usado hoje no monitoramento oficial do ENSO (NWS Public Information Statement 26-05). O ONI antigo é baixado junto (`scripts/fetch_enso.mjs`, `src/data/enso.json`) só para comparação: ele classificaria **cerca de 15%** dos trimestres de abril a agosto (1982–2026) de outra forma, inclusive 2026 (ONI: El Niño; RONI: neutro por 0,01).
- **Fase de cada safra:** trimestre de 3 meses centrado no **meio da fase crítica do milho** para aquela data de plantio (ex.: soja em 20/10 → fase de 18/04 a 02/06 → trimestre AMJ). **El Niño** se o índice ≥ +0,5; **La Niña** se ≤ −0,5; **Neutro** entre os dois.
- **Simplificação:** a NOAA só declara um episódio com 5 trimestres seguidos acima do limite; aqui classificamos o trimestre que cobre a fase crítica. É a regra da Metodologia do time.
- **Limites de seca:** o percentil 20 de umidade do solo continua calculado com **todos** os anos; o filtro só conta quantos anos da fase tiveram o evento.
- **Amostra:** cada fase tem de 8 a 25 anos conforme a data. Abaixo de 12 anos a tela avisa para ler com cautela, e a confiança cai (alta ≥ 12, média 7–11, baixa < 7).
- **O que os dados mostram (Pato Branco, soja em 20/10):** geada em 3 de 8 anos de El Niño, 6 de 12 de La Niña e 10 de 25 neutros (19 de 45 no total). A diferença entre as fases é pequena frente à incerteza de amostras tão curtas; **não há um sinal forte de El Niño/La Niña aqui**, e o app não finge que há.

### Campo descoberto ao longo do ano

Para cada rotação e data de plantio o app monta a linha de 365 dias da soja até a próxima soja (`src/lib/engine/calendario.ts`, com testes) e mostra quando o campo fica **sem cultura** (só palha), com cobertura viva (braquiária) ou com cultura.

- **Hipóteses de ciclo (a validar com agronomia/ZARC):** soja 120 dias, intervalo de 5 dias, milho 135 dias, trigo semeado em 15/05 com 130 dias de ciclo. Os ciclos são fixos, então os **dias sem cultura são os mesmos para qualquer data da soja** (110 no milho, 115 no trigo, 5 na braquiária); o que muda é **em quais meses** eles caem.
- **Chuva nesses dias:** média de chuva e de dias com 50 mm ou mais, calculadas dos dados diários do NASA POWER (1981–2025) só nos dias sem cultura. É a média de uma grade de ~50 km e subestima temporais locais.
- **Nível de erosão** (regra da Metodologia do time), agora calculado pelos dias sem cultura: mais de 60 = **Alto**; até 15 = **Baixo** (tolerância nossa, equivale ao intervalo de semeadura); entre os dois = **Médio**. Não considera o declive do terreno (o SRTM ainda não classifica talhões) nem o mês da chuva. Isso substituiu os rótulos de erosão escritos à mão.
- **Trigo e a soja seguinte:** com a semeadura de exemplo em 15/05, a colheita do trigo passa da data de plantio da soja seguinte quando a soja é plantada até ~29/09 (em 20/09, 2 dias); a tela avisa.
- **O que os dados mostram (Pato Branco, soja em 20/10):** soja → milho fica 110 dias sem cultura, de julho a outubro, com ~524 mm de chuva média e ~0,9 dia por ano com 50 mm ou mais; a braquiária mantém o solo coberto o ano todo, exceto 5 dias.

### Checagem de 16 dias antes de plantar

O app lê a previsão de 16 dias da Open-Meteo no navegador (só as coordenadas públicas do município são enviadas; se o serviço falhar, a página continua funcionando). Regras em `src/lib/engine/previsao.ts`, com testes: mínima do ar ≤ 3 °C (4 °C em baixada) ou chuva ≥ 50 mm nos próximos 7 dias = **"Não plante esta semana"**; menos de 10 mm de chuva em 7 dias, ou os mesmos eventos depois da primeira semana = **atenção**. São **hipóteses a validar com agronomia**; previsão não é garantia e a incerteza cresce depois de ~7 dias.

### Teste com produtividade do IBGE (primeira versão, 3 municípios: sem resultado conclusivo — veja o teste maior em Testes com dados reais)

Testamos se as safras marcadas pelo app tiveram **produtividade menor do milho 2ª safra**, com a Pesquisa Agrícola Municipal do IBGE (PAM, tabela 839, "Milho 2ª safra"; `scripts/fetch_ibge_pam.mjs`). Regras fixadas **antes** de ver o resultado (`scripts/backtest_ibge.mjs`, `npm run backtest`): data principal da soja 20/10; só anos com pelo menos 500 ha colhidos; anomalia = (rendimento − tendência linear do município) ÷ tendência, para tirar o ganho de tecnologia; diferença da anomalia média entre anos marcados e não marcados, com p-valor por permutação dentro de cada município.

- **Resultado: sem diferença detectável.** 57 anos-município (Cascavel 23, Francisco Beltrão 23, Pato Branco 11). Geada ou seca: anos marcados +0,5% (35) contra −1,2% (22), p = 0,79. Só geada: +1,0% contra −0,5%, p = 0,84. Só seca: −0,2% contra −0,1%, p = 0,99. Nas 24 comparações (8 datas × 3 tipos) uma teve p < 0,05, o que o acaso sozinho produz (1,2). Medidas contínuas (menor mínima, umidade média do solo) também deram correlações perto de zero (−0,17 a +0,26).
- **Conclusão:** **não** conseguimos confirmar que os anos marcados produziram menos. Os níveis do app descrevem a frequência do evento climático na fase crítica; **não** são perda de produtividade prevista.
- **Por que o teste pode não enxergar:** produtividades municipais são estimativas (muitos valores redondos; Cascavel informa a mesma área colhida, 58.000 ha, em 2021–2024); a grade da NASA tem ~50 km; a data real de plantio varia; 61% dos anos são marcados (pouco contraste); poucos anos. Ausência de evidência aqui não é evidência de ausência.
- Os testes (`src/lib/backtest.test.ts`) recalculam as anomalias e as marcações sem usar o script.

### Testes com dados reais

<!-- testes:pt -->
Rodamos quatro testes com dados medidos de verdade. As regras de cada um foram escritas no topo do script **antes** de rodar; o que mudou depois está marcado. Os resultados aparecem no app (aba Mais › Testes com dados reais) como saíram. Scripts: `scripts/validacao/`; para refazer: `node scripts/validacao/fetch_estacoes.mjs`, `fetch_ibge_sul.mjs`, `validar_estacoes.mjs`, `validar_ibge_sul.mjs`, `validar_previsao.mjs`.

- **1. Satélite × estações (geada).** 113 estações automáticas do INMET no Sul (cópia NOAA/NCEI Global Summary of the Day), 2016–2026, 307.517 dias. A mínima da NASA POWER acompanha a medida (correlação 0,90, erro médio 1,8 °C), mas nos dias frios fica 0,7 °C mais quente. Na janela da flor do milho com soja em 20/10, app e estação concordaram em 84% de 744 safras (kappa 0,51): o app pegou 56% das safras com geada medida e 33% das marcações dele não apareceram na estação. Somando as 19 datas de plantio: pegou 76%, alarme falso 15% (kappa 0,70). **Seca:** só 28 safras tinham a chuva completa na estação; pouco para concluir.
- **2. Baixada × relevo.** Para 103 estações, comparamos quanto a estação é mais fria que a NASA nas noites frias (descontada a altitude) com a posição no relevo (ponto − média do terreno em 1,5 km, Copernicus DEM 90 m). Cada 10 m abaixo do entorno: 0,19 °C mais frio (correlação 0,31, p = 0,003). As 17 estações em baixada (≥ 10 m abaixo do entorno) ficaram 0,4 °C mais frias que as outras 86. **O relevo pesa, mas o +1 °C do app parece exagerado** (medido: ~0,4 °C). O app agora mede o relevo do talhão pelo GPS (aba Mais) e liga "baixada" com a mesma regra.
- **3. Anos marcados × produtividade (IBGE).** 269 municípios do PR e SC, 5.652 anos-município (PAM tabela 839, safrinha ≥ 500 ha, ≥ 12 anos), anomalia contra a tendência de cada município. Soja em 20/10: nos anos marcados com **seca** o milho rendeu **-7,5%** (p < 0,001); geada ou seca -7,7%; **geada** -1,2% (p = 0,30, sem diferença — nessa data ela é rara no PR). Com soja em 20/11 a geada pega a flor mais vezes e os anos marcados renderam -12,4%. Ressalvas: comparando municípios no mesmo ano a diferença some (seca -0,4%, p = 0,37); e a seca pega a região toda junto, então os municípios não são independentes. Numa verificação extra, **feita depois de ver o resultado**, contando cada ano uma vez (23 safras), a direção se mantém (-11,5% num ano todo marcado) mas pode ser acaso (p = 0,18). Conclusão: os anos que o app marca com seca tendem a render menos, mas ainda não dá para afirmar com segurança; os níveis medem frequência do clima, não perda prevista.
- **5. Previsão da semana × medido.** Previsões que o Open-Meteo de fato publicou (API previous runs), 2024–2026, 40 estações. Regra do cartão "Posso plantar esta semana?" (geada ≤ 3 °C ou chuva ≥ 50 mm em 7 dias): das semanas em que isso aconteceu na estação, o aviso pegou 15%; 68% dos avisos foram alarme falso (797 semanas). Geada prevista 1 dia antes: pegou 59% (alarme falso 26%); 7 dias antes: 35% (alarme falso 51%). Mudança declarada: a regra de cobertura passou de 80% para 50% dos dias porque nenhuma estação tinha 80%, decidido antes de ver qualquer acerto. **Conclusão:** a previsão ajuda nos próximos 1 a 3 dias, mas o aviso da semana inteira deixa passar a maioria das geadas e chuvas fortes; por isso o cartão agora diz "Sem alerta na previsão" (não "Pode plantar") e mostra esse resultado.
- **4. Seguro rural (PSR/MAPA)** ficou de fora: o portal do MAPA não abre a partir do ambiente de desenvolvimento. O teste está desenhado (anos marcados × indenizações por geada e seca no milho, por município) e roda quando o arquivo `dados_abertos_psr_2016a2024csv.csv` for baixado de https://dados.agricultura.gov.br/dataset/sisser3.
<!-- /testes:pt -->

### Hipóteses e o que é estimado

- Ciclos (soja 120, intervalo 5, milho 135 e trigo 130 dias, semeadura do trigo em 15/05), fase crítica (55–100 dias), limites de geada (3 °C e 1 °C), ajuste de baixada (+1 °C) e critérios de seca são **hipóteses de partida a validar com agronomia/ZARC**.
- **Trigo, fase sensível:** a literatura aponta que o dano grave da geada no trigo vem do emborrachamento ao florescimento, com mínimas na planta em torno de 0 °C a −2 °C ([Revista Cultivar](https://revistacultivar.com.br/noticias/como-ocorrem-os-danos-por-geada-no-trigo); [GRDC](https://grdc.com.au/resources-and-publications/grdc-update-papers/tab-content/grdc-update-papers/2015/02/preliminary-rating-of-wheat-varieties-for-susceptibility-to-reproductive-frost-damage)). A janela de 70–110 dias após a semeadura e o limite de 3 °C no abrigo são **hipóteses** a validar com a Embrapa Trigo/ZARC. O relato do Deral de maio 2026 sobre o trigo é de lavoura ainda vegetativa e não testa essa janela.
- Quanto cada rotação atende às prioridades (e o que cada "o que pesa mais" significa) são **qualitativos** (marcados "a validar com técnico"). O nível de erosão é **calculado** pelos dias sem cultura (ciclos de exemplo) e ignora o declive.
- O relevo vem de `scripts/fetch_srtm_relief.mjs` (altitude do ponto e 49 pontos a cada 500 m ao redor). Se o serviço falhar, o script usa a altitude média da célula do POWER e a tela marca o valor como **estimado**. A temperatura do POWER não recebe correção de altitude.

### Limitações

- O NASA POWER é uma **grade de ~50 km**: não representa o microclima de uma lavoura.
- A temperatura é a **do ar a 2 m**, não da superfície. Geadas na relva/folha acontecem com o ar a 2 m acima de 0 °C; por isso o limite de 3 °C.
- Os ciclos das culturas são **exemplos**; cultivar, manejo e região mudam tudo.
- **Não é previsão do tempo.** É frequência histórica; só o cartão "Posso plantar esta semana?" usa previsão; testado contra estações, ele acerta melhor de 1 a 3 dias antes e pouco para a semana inteira (teste 5).
- O NASA POWER fica cerca de 0,7 °C mais quente que as estações nos dias frios e perde parte das geadas fracas (teste 1).
- Produtividade: em 269 municípios, os anos marcados com seca renderam cerca de 7,5% menos, mas contando cada ano uma vez a diferença ainda não é conclusiva; geada com soja em 20/10 não fez diferença (teste 3).
- A classificação de El Niño/La Niña usa a tabela oficial da NOAA (a tabela antiga digitada à mão foi removida), mas é uma regra simplificada e as amostras por fase são curtas.

### Tecnologia

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · testes com `node:test` · deploy no Vercel (sem chaves secretas no código). Fonte: Archivo (Google Fonts, SIL OFL); ícones: Lucide (ISC).
