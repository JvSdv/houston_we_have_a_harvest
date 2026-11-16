// scripts/fetch_power_daily.mjs
// Baixa dados DIÁRIOS reais da NASA POWER (community=AG) para os locais do GroundTruth.
// Docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
//
// Uso: node scripts/fetch_power_daily.mjs
// Saída: src/data/power_daily_<id>.json  (formato compacto, ver comentário em toCompact)

import fs from "node:fs";
import path from "node:path";

const LOCATIONS = [
  { id: "pato-branco", name: "Pato Branco", lat: -26.2295, lon: -52.6716 },
  { id: "cascavel", name: "Cascavel", lat: -24.9578, lon: -53.4595 },
  { id: "francisco-beltrao", name: "Francisco Beltrão", lat: -26.0811, lon: -53.0558 },
];

const PARAMETERS = ["T2M_MIN", "T2M_MAX", "PRECTOTCORR", "GWETROOT", "GWETTOP"];
const START = "19810101";
const PAUSE_MS = 3000; // pausa entre requisições para respeitar a API
const OUT_DIR = path.resolve("src/data");

function yyyymmdd(d) {
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

function buildUrl(loc, end) {
  const qs = new URLSearchParams({
    parameters: PARAMETERS.join(","),
    community: "AG",
    longitude: String(loc.lon),
    latitude: String(loc.lat),
    start: START,
    end,
    format: "JSON",
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${qs}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === tries) throw err;
      console.warn(`  tentativa ${i} falhou (${err.message}); tentando de novo...`);
      await sleep(PAUSE_MS * i);
    }
  }
}

/**
 * Formato compacto:
 * {
 *   meta: { ..., start: "1991-01-01", end: "2026-11-11", days: N },
 *   data: { T2M_MIN: [..N valores..], ... }   // índice i = start + i dias
 * }
 * Valores ausentes (fill_value -999 da NASA) viram null.
 * Dias finais sem nenhum dado (ainda não processados pela NASA) são removidos.
 */
function toCompact(loc, json, url) {
  const fill = json.header?.fill_value ?? -999;
  const params = json.properties.parameter;
  const dates = Object.keys(params[PARAMETERS[0]]).sort();

  const clean = (v) => (v === fill || v === null || v === undefined ? null : v);

  // remove dias finais em que TODOS os parâmetros estão ausentes
  let last = dates.length - 1;
  while (last >= 0 && PARAMETERS.every((p) => clean(params[p][dates[last]]) === null)) last--;
  const kept = dates.slice(0, last + 1);

  const data = {};
  const missing = {};
  for (const p of PARAMETERS) {
    data[p] = kept.map((d) => clean(params[p][d]));
    missing[p] = data[p].filter((v) => v === null).length;
  }

  const fmt = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return {
    meta: {
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      source: "NASA POWER Daily API (community=AG)",
      sourceDocs: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
      url,
      downloadedAt: new Date().toISOString(),
      apiVersion: json.header?.api?.version ?? null,
      dataSources: json.header?.sources ?? [],
      gridElevationM: json.geometry?.coordinates?.[2] ?? null,
      timeStandard: json.header?.time_standard ?? null,
      units: Object.fromEntries(PARAMETERS.map((p) => [p, json.parameters?.[p]?.units ?? null])),
      start: fmt(kept[0]),
      end: fmt(kept[kept.length - 1]),
      days: kept.length,
      missingValues: missing,
    },
    data,
  };
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const end = yyyymmdd(new Date());

  for (const [i, loc] of LOCATIONS.entries()) {
    if (i > 0) await sleep(PAUSE_MS);
    const url = buildUrl(loc, end);
    console.log(`Baixando ${loc.name}...`);
    const json = await fetchJson(url);
    const compact = toCompact(loc, json, url);
    const file = path.join(OUT_DIR, `power_daily_${loc.id}.json`);
    fs.writeFileSync(file, JSON.stringify(compact));
    const m = compact.meta;
    console.log(`  ✓ ${file}: ${m.start} → ${m.end} (${m.days} dias), ausentes: ${JSON.stringify(m.missingValues)}`);
  }
}

run().catch((err) => {
  console.error("Falhou:", err);
  process.exit(1);
});
