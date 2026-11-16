// scripts/fetch_srtm_relief.mjs
// Baixa a altitude real (NASA SRTM, 30 m) do ponto de cada município e de uma amostra de pontos ao redor,
// para mostrar o relevo local (baixadas acumulam ar frio).
//
// Serviço: OpenTopoData, dataset "srtm30m" (SRTM v3, 1 arco-segundo, NASA/USGS). https://www.opentopodata.org/datasets/srtm/
// Uso: node scripts/fetch_srtm_relief.mjs        Saída: src/data/srtm_relief.json
//
// Se o serviço falhar, usa a altitude média da célula do NASA POWER e marca como ESTIMADO.

import fs from "node:fs";
import path from "node:path";

const LOCATIONS = [
  { id: "pato-branco", lat: -26.2295, lon: -52.6716 },
  { id: "cascavel", lat: -24.9578, lon: -53.4595 },
  { id: "francisco-beltrao", lat: -26.0811, lon: -53.0558 },
];

const DATASET = "srtm30m";
const ESPACAMENTO_M = 500; // distância entre pontos da amostra
const RAIO_PONTOS = 3; // grade (2*3+1)² = 49 pontos, ±1,5 km
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function grade(lat, lon) {
  const pts = [];
  const dLat = ESPACAMENTO_M / 111_320;
  const dLon = ESPACAMENTO_M / (111_320 * Math.cos((lat * Math.PI) / 180));
  for (let i = -RAIO_PONTOS; i <= RAIO_PONTOS; i++)
    for (let j = -RAIO_PONTOS; j <= RAIO_PONTOS; j++)
      pts.push({ lat: +(lat + i * dLat).toFixed(6), lon: +(lon + j * dLon).toFixed(6) });
  return pts;
}

async function consulta(pts) {
  const locs = pts.map((p) => `${p.lat},${p.lon}`).join("|");
  const url = `https://api.opentopodata.org/v1/${DATASET}?locations=${locs}`;
  for (let t = 1; t <= 3; t++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== "OK") throw new Error(json.error ?? json.status);
      return { url, valores: json.results.map((r) => r.elevation) };
    } catch (e) {
      if (t === 3) throw e;
      await sleep(2000 * t);
    }
  }
}

function estimaDoPower(id) {
  try {
    const m = JSON.parse(fs.readFileSync(path.resolve(`src/data/power_daily_${id}.json`), "utf8")).meta;
    return typeof m.gridElevationM === "number" ? Math.round(m.gridElevationM) : null;
  } catch {
    return null;
  }
}

const out = {};
for (const [i, loc] of LOCATIONS.entries()) {
  if (i > 0) await sleep(1500); // limite público: 1 requisição por segundo
  const pts = grade(loc.lat, loc.lon);
  const centro = Math.floor(pts.length / 2);
  try {
    const { url, valores } = await consulta(pts);
    const ok = valores.filter((v) => typeof v === "number");
    const media = ok.reduce((a, b) => a + b, 0) / ok.length;
    out[loc.id] = {
      estimado: false,
      fonte: "NASA SRTM 30 m (SRTM v3, 1 arco-segundo) via OpenTopoData",
      fonteUrl: "https://www.opentopodata.org/datasets/srtm/",
      url,
      baixadoEm: new Date().toISOString(),
      pontoM: valores[centro],
      amostra: {
        pontos: ok.length,
        espacamentoM: ESPACAMENTO_M,
        raioM: ESPACAMENTO_M * RAIO_PONTOS,
        minM: Math.min(...ok),
        maxM: Math.max(...ok),
        mediaM: Math.round(media),
      },
    };
    console.log(`✓ ${loc.id}: ponto ${valores[centro]} m, amostra ${out[loc.id].amostra.minM}–${out[loc.id].amostra.maxM} m`);
  } catch (e) {
    const p = estimaDoPower(loc.id);
    out[loc.id] = {
      estimado: true,
      fonte: "ESTIMADO: altitude média da célula do NASA POWER (SRTM indisponível no momento do download)",
      pontoM: p,
      amostra: null,
      erro: String(e.message ?? e),
      baixadoEm: new Date().toISOString(),
    };
    console.warn(`! ${loc.id}: SRTM falhou (${e.message}); usando estimativa do POWER (${p} m)`);
  }
}

fs.writeFileSync(path.resolve("src/data/srtm_relief.json"), JSON.stringify(out, null, 2));
console.log("Salvo em src/data/srtm_relief.json");
