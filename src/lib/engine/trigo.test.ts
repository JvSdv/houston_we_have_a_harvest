// Testes do risco de geada do trigo (fase sensível: 70–110 dias após a semeadura em 15/05 → 24/jul a 02/set).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { riscoGeadaTrigo, sensibilidadeTrigo, janelaTrigo, PARAMS_PADRAO, type DadosDiarios } from "./index.ts";

const DIA = 86_400_000;

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
const idx = (d: DadosDiarios, iso: string) =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${d.meta.start}T00:00:00Z`)) / DIA);

test("janela do trigo: 24/jul a 02/set para semeadura em 15/05", () => {
  assert.deepEqual(janelaTrigo(PARAMS_PADRAO), { inicio: "07-24", fim: "09-02" });
});

test("sem geada na janela: nenhum ano com evento e 6 anos avaliados", () => {
  const r = riscoGeadaTrigo(sintetico());
  assert.equal(r.anosComEvento, 0);
  assert.equal(r.totalAnos, 6);
});

test("limites da janela: 24/07 e 02/09 contam; 23/07 e 03/09 não", () => {
  for (const [iso, esperado] of [
    ["2003-07-24", true],
    ["2003-09-02", true],
    ["2003-07-23", false],
    ["2003-09-03", false],
  ] as const) {
    const d = sintetico();
    d.data.T2M_MIN[idx(d, iso)] = 2;
    const r = riscoGeadaTrigo(d);
    assert.equal(r.anosListados.includes(2003), esperado, iso);
  }
});

test("geada forte (<= 1 °C) e baixada (+1 °C no limite)", () => {
  const d = sintetico();
  d.data.T2M_MIN[idx(d, "2002-08-10")] = 0.5; // forte
  d.data.T2M_MIN[idx(d, "2004-08-10")] = 3.5; // só conta na baixada (limite 4 °C)
  const normal = riscoGeadaTrigo(d);
  assert.deepEqual(normal.anosListados, [2002]);
  assert.deepEqual(normal.anosFortes, [2002]);
  const baixada = riscoGeadaTrigo(d, PARAMS_PADRAO, true);
  assert.deepEqual(baixada.anosListados, [2002, 2004]);
});

test("dado faltante na janela descarta o ano (não vira 'sem geada')", () => {
  const d = sintetico();
  d.data.T2M_MIN[idx(d, "2001-08-01")] = null;
  const r = riscoGeadaTrigo(d);
  assert.equal(r.totalAnos, 5);
  assert.ok(!r.porAno.some((a) => a.ano === 2001));
});

test("sensibilidade: a mesma geada de 30/07 conta com semeadura em 15/05 mas não em 15/06", () => {
  const d = sintetico();
  d.data.T2M_MIN[idx(d, "2003-07-30")] = 2;
  const s = Object.fromEntries(sensibilidadeTrigo(d).map((x) => [x.semeadura, x.anosComEvento]));
  assert.equal(s["05-15"], 1);
  assert.equal(s["06-15"], 0); // janela 24/ago–03/out
});

/** Conferência independente com os dados reais: recalcula por datas ISO, sem usar o motor. */
test("dados reais: contagem do motor = contagem independente (3 municípios, limite 3 °C)", () => {
  for (const id of ["pato-branco", "cascavel", "francisco-beltrao"]) {
    const dados = JSON.parse(fs.readFileSync(`src/data/power_daily_${id}.json`, "utf8")) as DadosDiarios;
    const t0 = Date.parse(`${dados.meta.start}T00:00:00Z`);
    const porData = new Map<string, number | null>();
    dados.data.T2M_MIN.forEach((v, i) => porData.set(new Date(t0 + i * DIA).toISOString().slice(0, 10), v));
    let total = 0;
    const comGeada: number[] = [];
    for (let ano = 1981; ano <= 2026; ano++) {
      const semeadura = Date.UTC(ano, 4, 15);
      const minimas: number[] = [];
      let completo = true;
      for (let k = 70; k <= 110; k++) {
        const v = porData.get(new Date(semeadura + k * DIA).toISOString().slice(0, 10));
        if (v === undefined || v === null) {
          completo = false;
          break;
        }
        minimas.push(v);
      }
      if (!completo) continue;
      total++;
      if (Math.min(...minimas) <= 3) comGeada.push(ano);
    }
    const r = riscoGeadaTrigo(dados);
    assert.equal(r.totalAnos, total, id);
    assert.deepEqual(r.anosListados, comGeada, id);
    assert.equal(total, 46, id);
  }
});
