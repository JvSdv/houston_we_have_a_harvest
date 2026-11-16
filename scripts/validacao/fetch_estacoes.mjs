// Baixa, para as estações automáticas do Sul do Brasil (INMET, via cópia da NOAA/NCEI "Global Summary of the Day"):
//  - mínima e chuva diárias medidas na estação (2016 em diante);
//  - NASA POWER (T2M_MIN, PRECTOTCORR) no MESMO ponto;
//  - relevo ao redor (Copernicus DEM 90 m via API de elevação do Open-Meteo): ponto + grade 7×7 a cada 500 m.
// Saída: .cache/validacao/estacoes.json (não versionado; refeito por este script).
// Uso: node scripts/validacao/fetch_estacoes.mjs
import path from "node:path";
import { CACHE, buscarJson, buscarTexto, lerCsv, salvarJson, sleep } from "./comum.mjs";

const ANO_INI = 2016;
const ANO_FIM = new Date().getFullYear();
const F2C = (f) => ((f - 32) * 5) / 9;

// 1) catálogo de estações
const hist = await buscarTexto("https://www.ncei.noaa.gov/pub/data/noaa/isd-history.csv", "isd-history.csv");
const estacoes = lerCsv(hist)
  .filter((s) => s.CTRY === "BR" && s.LAT && s.LON)
  .map((s) => ({ usaf: s.USAF, wban: s.WBAN, nome: s["STATION NAME"], lat: +s.LAT, lon: +s.LON, elev: +s["ELEV(M)"], ini: s.BEGIN, fim: s.END }))
  // Sul do Brasil, mesma região em que o app calcula (ao sul de 22°S)
  .filter((s) => s.lat <= -22 && s.lat >= -34 && s.lon >= -58 && s.lon <= -48)
  // dados recentes e pelo menos ~5 anos desde 2016
  .filter((s) => s.fim >= "20240101" && s.ini <= "20200101");
console.log(`${estacoes.length} estações no Sul com dados de 2016+`);

const saida = [];
for (const [k, s] of estacoes.entries()) {
  const id = `${s.usaf}${s.wban}`;
  process.stdout.write(`[${k + 1}/${estacoes.length}] ${s.nome} … `);
  // 2) estação: GSOD por ano
  const dias = {};
  for (let ano = ANO_INI; ano <= ANO_FIM; ano++) {
    const txt = await buscarTexto(
      `https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/${ano}/${id}.csv`,
      path.join("gsod", `${id}_${ano}.csv`),
      { vazioOk: true },
    );
    for (const l of lerCsv(txt)) {
      const min = +l.MIN;
      const prcp = +l.PRCP;
      dias[l.DATE] = [
        min > 9000 ? null : Math.round(F2C(min) * 10) / 10,
        // "I" = estação não informou chuva naquele dia: tratamos como falta, não como zero
        prcp > 99 || l.PRCP_ATTRIBUTES === "I" ? null : Math.round(prcp * 25.4 * 10) / 10,
        null,
        null,
      ];
    }
  }
  if (Object.keys(dias).length < 365) {
    console.log("poucos dias, pulando");
    continue;
  }
  // 3) NASA POWER no mesmo ponto
  const hoje = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const pw = await buscarJson(
    `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MIN,PRECTOTCORR&community=AG&latitude=${s.lat}&longitude=${s.lon}&start=${ANO_INI}0101&end=${hoje}&format=JSON`,
    path.join("power", `${id}.json`),
    { pausa: 1500 },
  );
  const p = pw.properties.parameter;
  for (const [d8, v] of Object.entries(p.T2M_MIN)) {
    const iso = `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}`;
    const x = dias[iso];
    if (!x) continue;
    x[2] = v <= -990 ? null : v;
    const c = p.PRECTOTCORR[d8];
    x[3] = c <= -990 ? null : c;
  }
  // 4) relevo: ponto + grade 7×7 (500 m) — mesmo desenho do relevo das cidades do app
  const lats = [], lons = [];
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++) {
      lats.push((s.lat + (i * 500) / 111_320).toFixed(5));
      lons.push((s.lon + (j * 500) / (111_320 * Math.cos((s.lat * Math.PI) / 180))).toFixed(5));
    }
  const el = await buscarJson(
    `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lons.join(",")}`,
    path.join("relevo", `${id}.json`),
    { pausa: 300 },
  );
  const alt = el.elevation;
  const ponto = alt[24];
  const mediaEntorno = alt.reduce((a, b) => a + b, 0) / alt.length;
  saida.push({
    id,
    nome: s.nome,
    lat: s.lat,
    lon: s.lon,
    elevEstacao: s.elev,
    elevPower: pw.geometry?.coordinates?.[2] ?? null,
    relevo: { ponto, media: Math.round(mediaEntorno * 10) / 10, min: Math.min(...alt), max: Math.max(...alt), tpi: Math.round((ponto - mediaEntorno) * 10) / 10 },
    dias,
  });
  console.log(`${Object.keys(dias).length} dias`);
  await sleep(200);
}
salvarJson(path.join(CACHE, "estacoes.json"), { baixadoEm: new Date().toISOString(), anoIni: ANO_INI, estacoes: saida });
console.log(`ok: ${saida.length} estações em .cache/validacao/estacoes.json`);
