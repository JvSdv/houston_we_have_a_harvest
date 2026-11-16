// Teste retrospectivo: os anos que o app marca como de geada/seca tiveram produtividade menor do milho 2ª safra (IBGE PAM)?
// Regras fixadas ANTES de olhar o resultado (para não escolher o que "dá certo"):
//  - data principal da soja: 20/10 (a data de demonstração do app); as outras datas entram só como sensibilidade;
//  - só anos com área colhida >= 500 ha e rendimento informado;
//  - anomalia = (rendimento − tendência linear do município) / tendência, para tirar o ganho tecnológico;
//  - teste: diferença de média da anomalia (anos marcados − não marcados), p-valor por permutação dentro de cada município.
import fs from "node:fs";
import { riscoGeada, riscoSeca, PARAMS_PADRAO } from "../src/lib/engine/index.ts";

const MIN_AREA_HA = 500;
const DATAS = ["09-20", "10-01", "10-10", "10-20", "10-30", "11-10", "11-20", "11-30"];
const PRINCIPAL = "10-20";
const ids = ["pato-branco", "cascavel", "francisco-beltrao"];
const ibge = JSON.parse(fs.readFileSync("src/data/ibge_pam_milho2.json", "utf8"));

function ols(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  const b = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0) / x.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  return (xi) => my + b * (xi - mx);
}
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// anomalias por município
const anom = {};
for (const id of ids) {
  const pts = Object.entries(ibge.dados[id]).map(([a, v]) => ({ ano: +a, y: v.rendimentoKgHa, area: v.areaColhidaHa })).filter((p) => p.y && p.area >= MIN_AREA_HA);
  const f = ols(pts.map((p) => p.ano), pts.map((p) => p.y));
  anom[id] = pts.map((p) => ({ ...p, anom: (p.y - f(p.ano)) / f(p.ano) }));
}

function teste(flagsPorMun, semente = 42) {
  // flagsPorMun: id -> Set(anos marcados). Estatística: dif. de médias (marcados − não marcados), pooled.
  const dif = (flags) => {
    const a = [], b = [];
    for (const id of ids) for (const p of anom[id]) (flags[id].has(p.ano) ? a : b).push(p.anom);
    return { d: a.length && b.length ? media(a) - media(b) : NaN, nMarc: a.length, nNao: b.length, mMarc: media(a), mNao: media(b) };
  };
  const obs = dif(flagsPorMun);
  const R = rng(semente);
  let extremo = 0;
  const N = 10000;
  for (let k = 0; k < N; k++) {
    const sh = {};
    for (const id of ids) {
      const anos = anom[id].map((p) => p.ano), nM = anom[id].filter((p) => flagsPorMun[id].has(p.ano)).length;
      const emb = [...anos].sort(() => R() - 0.5);
      sh[id] = new Set(emb.slice(0, nM));
    }
    if (Math.abs(dif(sh).d) >= Math.abs(obs.d) - 1e-12) extremo++;
  }
  return { ...obs, p: (extremo + 1) / (N + 1) };
}

const resultado = { meta: { ibge: ibge.meta.fonte, baixadoEm: ibge.meta.baixadoEm, minAreaHa: MIN_AREA_HA, dataPrincipal: PRINCIPAL, anosPorMunicipio: Object.fromEntries(ids.map((i) => [i, anom[i].length])) }, porData: {}, anosPrincipal: {} };
for (const data of DATAS) {
  const flags = { geada: {}, seca: {}, qualquer: {} };
  for (const id of ids) {
    const dados = JSON.parse(fs.readFileSync(`src/data/power_daily_${id}.json`, "utf8"));
    const g = new Set(riscoGeada(dados, data, PARAMS_PADRAO).anosListados);
    const s = new Set(riscoSeca(dados, data, PARAMS_PADRAO).anosListados);
    flags.geada[id] = g; flags.seca[id] = s; flags.qualquer[id] = new Set([...g, ...s]);
  }
  resultado.porData[data] = Object.fromEntries(Object.entries(flags).map(([k, f]) => [k, teste(f)]));
  if (data === PRINCIPAL) for (const id of ids) resultado.anosPrincipal[id] = anom[id].map((p) => ({ ano: p.ano, rendimento: p.y, areaHa: p.area, anomalia: Math.round(p.anom * 1000) / 10, geada: flags.geada[id].has(p.ano), seca: flags.seca[id].has(p.ano) }));
}
fs.writeFileSync("src/data/backtest_ibge.json", JSON.stringify(resultado, null, 1));
const f = (x) => (x * 100).toFixed(1) + "%";
for (const [data, r] of Object.entries(resultado.porData)) {
  console.log(data, Object.entries(r).map(([k, v]) => `${k}: marc ${v.nMarc} (${f(v.mMarc)}) vs não ${v.nNao} (${f(v.mNao)}) dif ${f(v.d)} p=${v.p.toFixed(3)}`).join(" | "));
}
console.log("anos por município:", JSON.stringify(resultado.meta.anosPorMunicipio));
