import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  calendarioRotacao,
  nivelErosaoPorDias,
  chuvaNaJanelaDescoberta,
  ROTACOES_IDS,
  DIAS_NO_ANO,
  type CalendarioRotacao,
} from "./calendario.ts";
import { PARAMS_PADRAO, type DadosDiarios } from "./index.ts";

const DIA = 86_400_000;
const soma = (c: CalendarioRotacao, tipo: string) =>
  c.segmentos.filter((s) => s.tipo === tipo).reduce((a, s) => a + (s.ate - s.de), 0);

test("os segmentos cobrem os 365 dias sem sobreposição, em ordem (as 3 rotações, todas as datas)", () => {
  for (const id of ROTACOES_IDS)
    for (const data of ["09-20", "10-01", "10-20", "11-10", "11-30"]) {
      const c = calendarioRotacao(id, data);
      let cursor = 0;
      for (const s of c.segmentos) {
        assert.equal(s.de, cursor, `${id} ${data}: buraco ou sobreposição em ${s.tipo}`);
        assert.ok(s.ate > s.de);
        cursor = s.ate;
      }
      assert.equal(cursor, DIAS_NO_ANO, `${id} ${data}`);
      assert.equal(c.diasPorMes.reduce((a, b) => a + b, 0), c.diasDescoberto);
    }
});

test("soja → milho: 110 dias sem cultura (5 do intervalo + 105 depois do milho)", () => {
  const c = calendarioRotacao("milho", "10-20");
  assert.equal(soma(c, "soja"), 120);
  assert.equal(soma(c, "milho"), 135);
  assert.equal(c.diasDescoberto, 110);
  assert.equal(soma(c, "cobertura"), 0);
});

test("soja → milho + braquiária: só os 5 dias do intervalo sem cultura, o resto é cobertura", () => {
  const c = calendarioRotacao("milho-braquiaria", "10-20");
  assert.equal(c.diasDescoberto, 5);
  assert.equal(soma(c, "cobertura"), 105);
});

test("soja → trigo em 20/10: semeadura em 15/05 (dia 207), colheita no dia 337, 115 dias sem cultura", () => {
  const c = calendarioRotacao("trigo", "10-20");
  const trigo = c.segmentos.find((s) => s.tipo === "trigo")!;
  assert.equal(trigo.de, 207);
  assert.equal(trigo.ate, 337);
  assert.equal(c.diasDescoberto, 115);
  assert.equal(c.atrasoSojaDias, 0);
});

test("trigo atrasa a soja seguinte quando a soja é plantada cedo (20/09)", () => {
  const c = calendarioRotacao("trigo", "09-20");
  assert.equal(c.atrasoSojaDias, 2);
  assert.equal(c.segmentos.at(-1)?.ate, DIAS_NO_ANO);
  assert.equal(calendarioRotacao("trigo", "10-01").atrasoSojaDias, 0);
});

test("os dias sem cultura não mudam com a data da soja, mas os meses mudam", () => {
  const a = calendarioRotacao("milho", "09-20");
  const b = calendarioRotacao("milho", "11-30");
  assert.equal(a.diasDescoberto, b.diasDescoberto);
  assert.notDeepEqual(a.diasPorMes, b.diasPorMes);
});

test("nível de erosão pelos dias sem cultura: tolerância 15, limite 60", () => {
  assert.equal(nivelErosaoPorDias(0), "Baixo");
  assert.equal(nivelErosaoPorDias(15), "Baixo");
  assert.equal(nivelErosaoPorDias(16), "Médio");
  assert.equal(nivelErosaoPorDias(60), "Médio");
  assert.equal(nivelErosaoPorDias(61), "Alto");
  assert.equal(nivelErosaoPorDias(110), "Alto");
  assert.equal(nivelErosaoPorDias(5), "Baixo");
});

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

test("chuva nos dias sem cultura: média em mm e dias de chuva forte, só anos completos", () => {
  const d = sintetico();
  const cal = calendarioRotacao("milho", "10-01");
  const r0 = chuvaNaJanelaDescoberta(d, "10-01", cal)!;
  assert.equal(r0.anos, 5); // plantios de 2000 a 2004 (o de 2005 passa do fim da série)
  assert.equal(r0.mediaMm, 550); // 110 dias × 5 mm
  assert.equal(r0.diasChuvaForteAno, 0);

  // um dia de 60 mm dentro da janela sem cultura de 2002 (dia 300 depois de 01/10/2002)
  const idx = Math.round((Date.UTC(2002, 9, 1) + 300 * DIA - Date.UTC(2000, 0, 1)) / DIA);
  d.data.PRECTOTCORR[idx] = 60;
  const r1 = chuvaNaJanelaDescoberta(d, "10-01", cal)!;
  assert.equal(r1.diasChuvaForteAno, 0.2); // 1 dia em 5 anos
  assert.equal(r1.mediaMm, 561); // (550×5 + 55) / 5
});

test("dados reais de Pato Branco: milho sozinho deixa o campo sem cultura em pleno inverno", () => {
  const real = JSON.parse(
    fs.readFileSync(new URL("../../data/power_daily_pato-branco.json", import.meta.url), "utf8"),
  ) as DadosDiarios;
  const cal = calendarioRotacao("milho", "10-20");
  const r = chuvaNaJanelaDescoberta(real, "10-20", cal)!;
  assert.ok(r.anos >= 40, `anos=${r.anos}`);
  assert.ok(r.mediaMm > 100 && r.mediaMm < 1200, `mediaMm=${r.mediaMm}`);
  assert.ok(r.diasChuvaForteAno >= 0 && r.diasChuvaForteAno < 5);
});

test("cobertura viva (braquiária) quase não gera janela sem cultura: 5 dias", () => {
  const real = JSON.parse(
    fs.readFileSync(new URL("../../data/power_daily_pato-branco.json", import.meta.url), "utf8"),
  ) as DadosDiarios;
  const cal = calendarioRotacao("milho-braquiaria", "10-20");
  const r = chuvaNaJanelaDescoberta(real, "10-20", cal, PARAMS_PADRAO)!;
  assert.ok(r.mediaMm < 150, `mediaMm=${r.mediaMm}`); // só 5 dias de janela
});
