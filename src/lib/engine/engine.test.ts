// Testes do motor: node --test (Node 24 executa TypeScript direto).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  cronograma,
  riscoGeada,
  riscoSeca,
  riscoPorData,
  confianca,
  nivelRisco,
  percentil,
  deCada10,
  PARAMS_PADRAO,
  type DadosDiarios,
} from "./index.ts";

const DIA = 86_400_000;

/** Série sintética: 2000-01-01 a 2005-12-31, tudo "bom" (quente, chuvoso, solo úmido). */
function sintetico(): DadosDiarios {
  const ini = Date.UTC(2000, 0, 1);
  const n = Math.round((Date.UTC(2005, 11, 31) - ini) / DIA) + 1;
  return {
    meta: { start: "2000-01-01", end: "2005-12-31" },
    data: {
      T2M_MIN: Array(n).fill(12),
      T2M_MAX: Array(n).fill(25),
      PRECTOTCORR: Array(n).fill(5),
      GWETROOT: Array(n).fill(0.7),
      GWETTOP: Array(n).fill(0.7),
    },
  };
}
function idx(d: DadosDiarios, iso: string) {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${d.meta.start}T00:00:00Z`)) / DIA);
}
function preenche(serie: (number | null)[], i: number, n: number, v: number) {
  for (let k = 0; k < n; k++) serie[i + k] = v;
}

test("cronograma: colheita, plantio do milho, floração e fase crítica 55–100 dias", () => {
  const c = cronograma(new Date(Date.UTC(2024, 9, 1)), PARAMS_PADRAO); // 01/10/2024
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  assert.equal(iso(c.colheitaSoja), "2025-01-29"); // +120
  assert.equal(iso(c.plantioMilho), "2025-02-03"); // +5
  assert.equal(iso(c.floracaoMilho), "2025-04-09"); // +65
  assert.equal(iso(c.faseInicio), "2025-03-30"); // +55
  assert.equal(iso(c.faseFim), "2025-05-14"); // +100
});

test("riscoGeada conta frio só dentro da fase crítica e separa geada forte", () => {
  const d = sintetico();
  // Soja 01/10/2001 → milho 03/02/2002 → fase 30/03 a 14/05/2002
  d.data.T2M_MIN[idx(d, "2002-04-12")] = 2.5; // provável, não forte
  d.data.T2M_MIN[idx(d, "2004-05-01")] = 0.5; // forte (fase 2004: 30/03 a 14/05)
  d.data.T2M_MIN[idx(d, "2003-07-01")] = -3; // fora da fase: não conta
  const r = riscoGeada(d, "10-01");
  assert.equal(r.totalAnos, 5); // safrinhas 2001..2005
  assert.deepEqual(r.anosListados, [2002, 2004]);
  assert.deepEqual(r.anosFortes, [2004]);
});

test("riscoGeada em baixada sobe o limite em 1 °C", () => {
  const d = sintetico();
  d.data.T2M_MIN[idx(d, "2002-04-12")] = 3.6;
  assert.equal(riscoGeada(d, "10-01").anosComEvento, 0);
  assert.deepEqual(riscoGeada(d, "10-01", PARAMS_PADRAO, true).anosListados, [2002]);
});

test("riscoGeada ignora anos com dado ausente na fase", () => {
  const d = sintetico();
  d.data.T2M_MIN[idx(d, "2002-04-09")] = null;
  assert.equal(riscoGeada(d, "10-01").totalAnos, 4);
});

test("riscoSeca conta veranico OU solo seco e separa os sinais", () => {
  const d = sintetico();
  // 2003: só veranico de 15 dias
  preenche(d.data.PRECTOTCORR, idx(d, "2003-04-01"), 15, 0.2);
  // 2004: veranico de 20 dias + solo mais seco da série → os dois
  preenche(d.data.PRECTOTCORR, idx(d, "2004-04-01"), 20, 0);
  preenche(d.data.GWETROOT, idx(d, "2004-03-30"), 46, 0.3);
  const r = riscoSeca(d, "10-01");
  assert.deepEqual(r.anosListados, [2003, 2004]);
  assert.deepEqual(r.detalheSeca?.anosVeranico, [2003, 2004]);
  assert.deepEqual(r.detalheSeca?.anosSoloSeco, [2004]);
  assert.deepEqual(r.detalheSeca?.anosAmbos, [2004]);
  assert.equal(r.porAno.find((a) => a.ano === 2004)?.valor, 20);
});

test("riscoSeca conta ano só com solo seco, sem veranico", () => {
  const d = sintetico();
  preenche(d.data.GWETROOT, idx(d, "2005-03-30"), 46, 0.3);
  const r = riscoSeca(d, "10-01");
  assert.deepEqual(r.anosListados, [2005]);
  assert.deepEqual(r.detalheSeca?.anosVeranico, []);
  assert.deepEqual(r.detalheSeca?.anosAmbos, []);
});

test("riscoPorData retorna as 5 datas padrão com geada normal e de baixada", () => {
  const r = riscoPorData(sintetico(), PARAMS_PADRAO, undefined, 2003);
  assert.deepEqual(
    r.map((x) => x.dataSoja),
    ["10-01", "10-10", "10-20", "10-30", "11-10"],
  );
  assert.ok(r.every((x) => x.geada.totalAnos > 0 && x.geadaBaixada.totalAnos > 0 && x.seca.totalAnos > 0));
});

test("confiança, nível e utilitários", () => {
  assert.equal(confianca(45), "alta");
  assert.equal(confianca(12), "alta");
  assert.equal(confianca(11), "média");
  assert.equal(confianca(7), "média");
  assert.equal(confianca(6), "baixa");
  assert.equal(nivelRisco(0.1), "Baixo");
  assert.equal(nivelRisco(0.25), "Médio");
  assert.equal(nivelRisco(0.4), "Alto");
  assert.equal(percentil([1, 2, 3, 4, 5], 50), 3);
  assert.equal(deCada10(0.27), 3);
});

test("dados reais de Pato Branco cobrem ~45 safras desde 1981", () => {
  const real = JSON.parse(
    fs.readFileSync(new URL("../../data/power_daily_pato-branco.json", import.meta.url), "utf8"),
  ) as DadosDiarios;
  const r = riscoGeada(real, "10-01");
  assert.ok(r.totalAnos >= 44, `totalAnos=${r.totalAnos}`);
  assert.equal(r.periodo?.[0], 1982);
});
