// Escreve no README (EN e PT) a seção "Real-world tests" / "Testes com dados reais" a partir dos resultados em src/data/validacao_*.json.
// Substitui o conteúdo entre os marcadores <!-- testes:en --> … <!-- /testes:en --> e <!-- testes:pt --> … <!-- /testes:pt -->.
// Uso: node scripts/validacao/escrever_readme.mjs
import fs from "node:fs";

const E = JSON.parse(fs.readFileSync("src/data/validacao_estacoes.json", "utf8"));
const I = JSON.parse(fs.readFileSync("src/data/validacao_ibge_sul.json", "utf8"));
const F = JSON.parse(fs.readFileSync("src/data/validacao_previsao.json", "utf8"));

const num = (x, c, pt) => x.toLocaleString(pt ? "pt-BR" : "en-US", { minimumFractionDigits: c, maximumFractionDigits: c });
const pp = (x, pt) => `${x > 0 ? "+" : ""}${num(x * 100, 1, pt)}%`;
const fp = (p, pt) => (p < 0.001 ? `p < ${num(0.001, 3, pt)}` : `p = ${num(p, p < 0.01 ? 3 : 2, pt)}`);
const g = E.safra.principal.geada, gt = E.safra.todasAsDatas.geada, s = E.safra.principal.seca, r = E.relevo;
const { seca, geada, qualquer } = I.principal;
const tarde = I.porData["11-20"].geada.A;
const temF = F.meta.estacoes > 0 && F.regraDaSemana.n > 0;

function texto(pt) {
  const t = (a, b) => (pt ? a : b);
  const n0 = (x) => num(x, 0, pt), n1 = (x) => num(x, 1, pt), n2 = (x) => num(x, 2, pt);
  const L = [];
  L.push(
    t(
      "Rodamos quatro testes com dados medidos de verdade. As regras de cada um foram escritas no topo do script **antes** de rodar; o que mudou depois está marcado. Os resultados aparecem no app (aba Mais › Testes com dados reais) como saíram. Scripts: `scripts/validacao/`; para refazer: `node scripts/validacao/fetch_estacoes.mjs`, `fetch_ibge_sul.mjs`, `validar_estacoes.mjs`, `validar_ibge_sul.mjs`, `validar_previsao.mjs`.",
      "We ran four tests against real measured data. Each test’s rules were written at the top of its script **before** running it; anything changed afterwards is marked. Results are shown in the app (More tab › Tests with real-world data) as they came out. Scripts: `scripts/validacao/`; to redo: `node scripts/validacao/fetch_estacoes.mjs`, `fetch_ibge_sul.mjs`, `validar_estacoes.mjs`, `validar_ibge_sul.mjs`, `validar_previsao.mjs`.",
    ),
    "",
  );
  L.push(
    t(
      `- **1. Satélite × estações (geada).** ${n0(E.meta.estacoes)} estações automáticas do INMET no Sul (cópia NOAA/NCEI Global Summary of the Day), ${E.meta.anos[0]}–${E.meta.anos[1]}, ${n0(E.diario.dias)} dias. A mínima da NASA POWER acompanha a medida (correlação ${n2(E.diario.correlacao)}, erro médio ${n1(E.diario.erroMedio)} °C), mas nos dias frios fica ${n1(E.diario.viesDiasFrios)} °C mais quente. Na janela da flor do milho com soja em 20/10, app e estação concordaram em ${n0(g.concordancia)}% de ${n0(g.n)} safras (kappa ${n2(g.kappa)}): o app pegou ${n0(g.acerto)}% das safras com geada medida e ${n0(g.alarmeFalso)}% das marcações dele não apareceram na estação. Somando as 19 datas de plantio: pegou ${n0(gt.acerto)}%, alarme falso ${n0(gt.alarmeFalso)}% (kappa ${n2(gt.kappa)}). **Seca:** só ${n0(s.n)} safras tinham a chuva completa na estação; pouco para concluir.`,
      `- **1. Satellite × stations (frost).** ${n0(E.meta.estacoes)} INMET automatic stations in southern Brazil (NOAA/NCEI Global Summary of the Day copy), ${E.meta.anos[0]}–${E.meta.anos[1]}, ${n0(E.diario.dias)} days. NASA POWER’s minimum tracks the measured one (correlation ${n2(E.diario.correlacao)}, mean error ${n1(E.diario.erroMedio)} °C), but on cold days it runs ${n1(E.diario.viesDiasFrios)} °C warmer. In the corn flowering window with soybeans on Oct 20, app and station agreed in ${n0(g.concordancia)}% of ${n0(g.n)} seasons (kappa ${n2(g.kappa)}): the app caught ${n0(g.acerto)}% of seasons with measured frost, and ${n0(g.alarmeFalso)}% of its flags did not show up at the station. Across all 19 planting dates: caught ${n0(gt.acerto)}%, false alarms ${n0(gt.alarmeFalso)}% (kappa ${n2(gt.kappa)}). **Drought:** only ${n0(s.n)} seasons had complete station rain; too few to conclude.`,
    ),
  );
  L.push(
    t(
      `- **2. Baixada × relevo.** Para ${n0(r.estacoes)} estações, comparamos quanto a estação é mais fria que a NASA nas noites frias (descontada a altitude) com a posição no relevo (ponto − média do terreno em 1,5 km, Copernicus DEM 90 m). Cada 10 m abaixo do entorno: ${n2(r.inclinacaoCPor10m)} °C mais frio (correlação ${n2(r.correlacao)}, ${fp(r.p, pt)}). As ${n0(r.baixadas)} estações em baixada (≥ ${n0(-r.regraBaixadaTpiM)} m abaixo do entorno) ficaram ${n1(Math.abs(r.diferencaBaixadaC))} °C mais frias que as outras ${n0(r.outras)}. **O relevo pesa, mas o +1 °C do app parece exagerado** (medido: ~${n1(Math.abs(r.diferencaBaixadaC))} °C). O app agora mede o relevo do talhão pelo GPS (aba Mais) e liga "baixada" com a mesma regra.`,
      `- **2. Lowland × terrain.** For ${n0(r.estacoes)} stations, we compared how much colder the station is than NASA on cold nights (after altitude) with its terrain position (point − mean terrain within 1.5 km, Copernicus DEM 90 m). Each 10 m below the surroundings: ${n2(r.inclinacaoCPor10m)} °C colder (correlation ${n2(r.correlacao)}, ${fp(r.p, pt)}). The ${n0(r.baixadas)} lowland stations (≥ ${n0(-r.regraBaixadaTpiM)} m below the surroundings) were ${n1(Math.abs(r.diferencaBaixadaC))} °C colder than the other ${n0(r.outras)}. **Terrain matters, but the app’s +1 °C looks overstated** (measured: ~${n1(Math.abs(r.diferencaBaixadaC))} °C). The app now measures each plot’s terrain by GPS (More tab) and turns "lowland" on with the same rule.`,
    ),
  );
  L.push(
    t(
      `- **3. Anos marcados × produtividade (IBGE).** ${n0(I.meta.municipios)} municípios do PR e SC, ${n0(I.meta.anosMunicipio)} anos-município (PAM tabela 839, safrinha ≥ ${n0(I.meta.minAreaHa)} ha, ≥ ${n0(I.meta.minAnos)} anos), anomalia contra a tendência de cada município. Soja em 20/10: nos anos marcados com **seca** o milho rendeu **${pp(seca.A.d, pt)}** (${fp(seca.A.p, pt)}); geada ou seca ${pp(qualquer.A.d, pt)}; **geada** ${pp(geada.A.d, pt)} (${fp(geada.A.p, pt)}, sem diferença — nessa data ela é rara no PR). Com soja em 20/11 a geada pega a flor mais vezes e os anos marcados renderam ${pp(tarde.d, pt)}. Ressalvas: comparando municípios no mesmo ano a diferença some (seca ${pp(seca.B.d, pt)}, ${fp(seca.B.p, pt)}); e a seca pega a região toda junto, então os municípios não são independentes. Numa verificação extra, **feita depois de ver o resultado**, contando cada ano uma vez (${n0(seca.C.anos)} safras), a direção se mantém (${pp(seca.C.efeitoTodosMarcados, pt)} num ano todo marcado) mas pode ser acaso (${fp(seca.C.p, pt)}). Conclusão: os anos que o app marca com seca tendem a render menos, mas ainda não dá para afirmar com segurança; os níveis medem frequência do clima, não perda prevista.`,
      `- **3. Flagged years × yield (IBGE).** ${n0(I.meta.municipios)} municipalities in PR and SC, ${n0(I.meta.anosMunicipio)} municipality-years (PAM table 839, second crop ≥ ${n0(I.meta.minAreaHa)} ha, ≥ ${n0(I.meta.minAnos)} years), anomaly against each municipality’s trend. Soybeans on Oct 20: in years flagged for **drought** corn yielded **${pp(seca.A.d, pt)}** (${fp(seca.A.p, pt)}); frost or drought ${pp(qualquer.A.d, pt)}; **frost** ${pp(geada.A.d, pt)} (${fp(geada.A.p, pt)}, no difference — at that date it is rare in Paraná). With soybeans on Nov 20 frost hits flowering more often and flagged years yielded ${pp(tarde.d, pt)}. Caveats: comparing municipalities within the same year, the difference disappears (drought ${pp(seca.B.d, pt)}, ${fp(seca.B.p, pt)}); and drought hits the whole region at once, so municipalities are not independent. In an extra check, **added after seeing the result**, counting each year once (${n0(seca.C.anos)} seasons), the direction holds (${pp(seca.C.efeitoTodosMarcados, pt)} in a fully flagged year) but could be chance (${fp(seca.C.p, pt)}). Conclusion: years the app flags for drought tend to yield less, but this is not yet firmly established; the levels measure weather frequency, not predicted loss.`,
    ),
  );
  if (temF) {
    const a1 = F.geadaPorAntecedencia[0], a7 = F.geadaPorAntecedencia[F.geadaPorAntecedencia.length - 1], w = F.regraDaSemana;
    L.push(
      t(
        `- **5. Previsão da semana × medido.** Previsões que o Open-Meteo de fato publicou (API previous runs), ${F.meta.periodo[0].slice(0, 4)}–${F.meta.periodo[1].slice(0, 4)}, ${n0(F.meta.estacoes)} estações. Regra do cartão "Posso plantar esta semana?" (geada ≤ 3 °C ou chuva ≥ 50 mm em 7 dias): das semanas em que isso aconteceu na estação, o aviso pegou ${n0(w.acerto)}%; ${n0(w.alarmeFalso)}% dos avisos foram alarme falso (${n0(w.n)} semanas). Geada prevista 1 dia antes: pegou ${n0(a1.acerto)}% (alarme falso ${n0(a1.alarmeFalso)}%); 7 dias antes: ${n0(a7.acerto)}% (alarme falso ${n0(a7.alarmeFalso)}%). Mudança declarada: a regra de cobertura passou de 80% para 50% dos dias porque nenhuma estação tinha 80%, decidido antes de ver qualquer acerto. **Conclusão:** a previsão ajuda nos próximos 1 a 3 dias, mas o aviso da semana inteira deixa passar a maioria das geadas e chuvas fortes; por isso o cartão agora diz "Sem alerta na previsão" (não "Pode plantar") e mostra esse resultado.`,
        `- **5. Weekly forecast × measured.** Forecasts Open-Meteo actually published (previous-runs API), ${F.meta.periodo[0].slice(0, 4)}–${F.meta.periodo[1].slice(0, 4)}, ${n0(F.meta.estacoes)} stations. The "Can I plant this week?" rule (frost ≤ 3 °C or rain ≥ 50 mm within 7 days): of the weeks when this happened at the station, the warning caught ${n0(w.acerto)}%; ${n0(w.alarmeFalso)}% of warnings were false alarms (${n0(w.n)} weeks). Frost forecast 1 day ahead: caught ${n0(a1.acerto)}% (false alarms ${n0(a1.alarmeFalso)}%); 7 days ahead: ${n0(a7.acerto)}% (false alarms ${n0(a7.alarmeFalso)}%). Declared change: the coverage rule went from 80% to 50% of days because no station had 80%, decided before seeing any hit rate. **Conclusion:** the forecast helps for the next 1–3 days, but the whole-week warning misses most frosts and heavy rains; so the card now says "No alert in the forecast" (not "Good to plant") and shows this result.`,
      ),
    );
  }
  L.push(
    t(
      `- **4. Seguro rural (PSR/MAPA)** ficou de fora: o portal do MAPA não abre a partir do ambiente de desenvolvimento. O teste está desenhado (anos marcados × indenizações por geada e seca no milho, por município) e roda quando o arquivo \`dados_abertos_psr_2016a2024csv.csv\` for baixado de https://dados.agricultura.gov.br/dataset/sisser3.`,
      `- **4. Crop insurance (PSR/MAPA)** was left out: the ministry portal does not open from the development environment. The test is designed (flagged years × frost and drought claims on corn, by municipality) and will run once \`dados_abertos_psr_2016a2024csv.csv\` is downloaded from https://dados.agricultura.gov.br/dataset/sisser3.`,
    ),
  );
  return L.join("\n");
}

let md = fs.readFileSync("README.md", "utf8");
for (const [lang, pt] of [["en", false], ["pt", true]]) {
  const ini = `<!-- testes:${lang} -->`, fim = `<!-- /testes:${lang} -->`;
  const bloco = `${ini}\n${texto(pt)}\n${fim}`;
  if (md.includes(ini)) md = md.replace(new RegExp(`${ini}[\\s\\S]*?${fim}`), bloco);
  else throw new Error(`marcador ${ini} não encontrado no README`);
}
fs.writeFileSync("README.md", md);
console.log("README atualizado");
