// Teste 5: o cartão "Posso plantar esta semana?" acerta? Usa as previsões que o Open-Meteo de fato publicou com
// 1 a 7 dias de antecedência (API "previous runs", 2024 em diante) e compara com o que as estações do INMET mediram.
//
// REGRAS FIXADAS ANTES DE VER O RESULTADO (não mudar depois de rodar):
//  - estações: as que têm mínima medida em >= 50% dos dias desde 01/01/2024 (máximo 40, as de mais dias).
//    MUDANÇA DECLARADA: a regra original era >= 80%, mas nenhuma estação chegou a isso (a cópia da NOAA tem falhas e
//    para no meio de 2025; a melhor tem 57%). Mudado para 50% olhando só a cobertura, antes de ver qualquer acerto;
//  - dia (UTC, como o GSOD): mínima prevista = menor valor horário previsto; chuva prevista = soma horária;
//  - por antecedência k = 1..7 dias: geada = mínima <= 3 °C; acerto (POD), alarme falso (FAR) e viés da mínima;
//  - regra do app, por semana: num dia D, o app diria "melhor esperar" se em D+1..D+7 a previsão (feita em D, ou seja,
//    antecedência k para o dia D+k) tiver mínima <= 3 °C ou chuva >= 50 mm num dia. "Aconteceu" = a estação mediu isso
//    em D+1..D+7 (só semanas com os 7 dias medidos).
// Entrada: .cache/validacao/estacoes.json. Saída: src/data/validacao_previsao.json
import fs from "node:fs";
import path from "node:path";
import { CACHE, buscarJson, media, salvarJson } from "./comum.mjs";

const INICIO = "2024-01-01";
const LIMITE = 3;
const CHUVA_FORTE = 50;
const fimData = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);

const { estacoes } = JSON.parse(fs.readFileSync(path.join(CACHE, "estacoes.json"), "utf8"));
const totalDias = Math.round((Date.parse(fimData) - Date.parse(INICIO)) / 86_400_000) + 1;
const escolhidas = estacoes
  .map((s) => ({ s, n: Object.entries(s.dias).filter(([d, v]) => d >= INICIO && d <= fimData && v[0] !== null).length }))
  .filter((x) => x.n >= 0.5 * totalDias)
  .sort((a, b) => b.n - a.n)
  .slice(0, 40)
  .map((x) => x.s);
console.log(`${escolhidas.length} estações com >= 50% dos dias medidos desde ${INICIO}`);

const K = [1, 2, 3, 4, 5, 6, 7];
const vars = K.flatMap((k) => [`temperature_2m_previous_day${k}`, `precipitation_previous_day${k}`]).join(",");
const porLead = Object.fromEntries(K.map((k) => [k, { pares: [], difs: [] }]));
const semanas = [];

function tab(pares) {
  let a = 0, b = 0, c = 0, d = 0;
  for (const [o, s] of pares) {
    if (o && s) a++;
    else if (s) b++;
    else if (o) c++;
    else d++;
  }
  const p = (x, y) => (y ? Math.round((x / y) * 1000) / 10 : null);
  return { n: a + b + c + d, ambos: a, soPrevisao: b, soEstacao: c, nenhum: d, acerto: p(a, a + c), alarmeFalso: p(b, a + b), concordancia: p(a + d, a + b + c + d) };
}

for (const [i, s] of escolhidas.entries()) {
  process.stdout.write(`[${i + 1}/${escolhidas.length}] ${s.nome} … `);
  const j = await buscarJson(
    `https://previous-runs-api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&start_date=${INICIO}&end_date=${fimData}&hourly=${vars}&timezone=GMT`,
    path.join("previsao", `${s.id}.json`),
    { pausa: 800 },
  );
  const h = j.hourly;
  // agrega por dia UTC
  const prev = {}; // dia -> k -> {tmin, chuva}
  h.time.forEach((t, idx) => {
    const dia = t.slice(0, 10);
    for (const k of K) {
      const tv = h[`temperature_2m_previous_day${k}`][idx];
      const cv = h[`precipitation_previous_day${k}`][idx];
      const o = ((prev[dia] ??= {})[k] ??= { tmin: Infinity, chuva: 0, nT: 0, nC: 0 });
      if (tv !== null) {
        o.tmin = Math.min(o.tmin, tv);
        o.nT++;
      }
      if (cv !== null) {
        o.chuva += cv;
        o.nC++;
      }
    }
  });
  const ok = (o) => o && o.nT >= 20;
  for (const [dia, ks] of Object.entries(prev)) {
    const obs = s.dias[dia];
    if (!obs || obs[0] === null) continue;
    for (const k of K)
      if (ok(ks[k])) {
        porLead[k].pares.push([obs[0] <= LIMITE, ks[k].tmin <= LIMITE]);
        porLead[k].difs.push(ks[k].tmin - obs[0]);
      }
  }
  // semanas: dia de consulta D
  const dias = Object.keys(prev).sort();
  for (const D of dias) {
    const alvo = K.map((k) => new Date(Date.parse(D) + k * 86_400_000).toISOString().slice(0, 10));
    const obs = alvo.map((d) => s.dias[d]);
    if (obs.some((o) => !o || o[0] === null || o[1] === null)) continue;
    const fc = alvo.map((d, n) => prev[d]?.[K[n]]);
    if (fc.some((o) => !ok(o) || o.nC < 20)) continue;
    const aconteceu = obs.some((o) => o[0] <= LIMITE || o[1] >= CHUVA_FORTE);
    const avisou = fc.some((o) => o.tmin <= LIMITE || o.chuva >= CHUVA_FORTE);
    const geadaObs = obs.some((o) => o[0] <= LIMITE);
    const geadaPrev = fc.some((o) => o.tmin <= LIMITE);
    semanas.push({ aconteceu, avisou, geadaObs, geadaPrev });
  }
  console.log("ok");
}

const r2 = (x) => Math.round(x * 100) / 100;
salvarJson("src/data/validacao_previsao.json", {
  meta: {
    fonte: "Previsões publicadas do Open-Meteo (API previous runs, modelo padrão) × estações automáticas do INMET (cópia NOAA/NCEI GSOD)",
    periodo: [INICIO, fimData],
    estacoes: escolhidas.length,
    limiteGeadaC: LIMITE,
    chuvaForteMm: CHUVA_FORTE,
  },
  geadaPorAntecedencia: K.map((k) => ({ dias: k, ...tab(porLead[k].pares), viesMinimaC: r2(media(porLead[k].difs)) })),
  regraDaSemana: tab(semanas.map((x) => [x.aconteceu, x.avisou])),
  geadaDaSemana: tab(semanas.map((x) => [x.geadaObs, x.geadaPrev])),
});
console.log("ok");
