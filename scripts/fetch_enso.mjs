// scripts/fetch_enso.mjs
// Baixa os índices oficiais de El Niño / La Niña da NOAA (Climate Prediction Center) e salva em src/data/enso.json.
//
//  - RONI (Relative Oceanic Niño Index): índice usado pela NOAA para monitorar e prever o ENSO
//    (NWS Public Information Statement 26-05). É o índice PRINCIPAL do app.
//    https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/
//  - ONI (versão 5 do ERSST): índice mais antigo, guardado só para referência/comparação.
//    https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/oni/v5/
//
// Formato dos arquivos: linhas "SEAS YR [TOTAL] ANOM" (trimestres DJF, JFM, ..., NDJ).
// Saída: { meta, roni: { "AMJ1997": 0.83, ... }, oni: { ... } }
//
// Uso: node scripts/fetch_enso.mjs

import fs from "node:fs";
import path from "node:path";

const FONTES = {
  roni: "https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt",
  oni: "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt",
};

function parse(texto) {
  const out = {};
  for (const linha of texto.split("\n")) {
    const p = linha.trim().split(/\s+/);
    if (p.length >= 3 && /^[A-Z]{3}$/.test(p[0]) && /^\d{4}$/.test(p[1])) {
      const v = Number.parseFloat(p[p.length - 1]);
      if (Number.isFinite(v)) out[`${p[0]}${p[1]}`] = v;
    }
  }
  return out;
}

const meta = { baixadoEm: new Date().toISOString(), fontes: {} };
const dados = {};
for (const [nome, url] of Object.entries(FONTES)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${nome}: HTTP ${res.status}`);
  const texto = await res.text();
  dados[nome] = parse(texto);
  const chaves = Object.keys(dados[nome]);
  meta.fontes[nome] = {
    url,
    atualizadoPelaNoaaEm: res.headers.get("last-modified"),
    registros: chaves.length,
    primeiro: chaves[0],
    ultimo: chaves[chaves.length - 1],
  };
  console.log(`✓ ${nome}: ${chaves.length} trimestres (${chaves[0]} → ${chaves[chaves.length - 1]})`);
}

fs.writeFileSync(path.resolve("src/data/enso.json"), JSON.stringify({ meta, roni: dados.roni, oni: dados.oni }));
console.log("Salvo em src/data/enso.json");
