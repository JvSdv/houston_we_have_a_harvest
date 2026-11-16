import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  faseEnso,
  faseDoMes,
  trimestreDoMes,
  meioDaFase,
  fasePorAno,
  ultimoTrimestre,
  FASES_ENSO,
  type IndiceEnso,
} from "./enso.ts";
import { restringirAnos, riscoGeada, riscoSeca, type DadosDiarios, type ResultadoRisco } from "./index.ts";

const real = JSON.parse(fs.readFileSync(new URL("../../data/enso.json", import.meta.url), "utf8")) as {
  roni: IndiceEnso;
  oni: IndiceEnso;
};
const pb = JSON.parse(
  fs.readFileSync(new URL("../../data/power_daily_pato-branco.json", import.meta.url), "utf8"),
) as DadosDiarios;

test("limites: +0,5 e -0,5 contam; entre os dois é neutro; sem dado é null", () => {
  assert.equal(faseEnso(0.5), "el-nino");
  assert.equal(faseEnso(0.49), "neutro");
  assert.equal(faseEnso(0), "neutro");
  assert.equal(faseEnso(-0.49), "neutro");
  assert.equal(faseEnso(-0.5), "la-nina");
  assert.equal(faseEnso(undefined), null);
  assert.equal(faseEnso(Number.NaN), null);
});

test("trimestre pelo mês central", () => {
  assert.equal(trimestreDoMes(1), "DJF");
  assert.equal(trimestreDoMes(4), "MAM");
  assert.equal(trimestreDoMes(5), "AMJ");
  assert.equal(trimestreDoMes(12), "NDJ");
});

test("faseDoMes usa o trimestre certo e ignora trimestre inexistente", () => {
  const idx: IndiceEnso = { AMJ2000: 0.9, MAM2000: -0.9 };
  assert.equal(faseDoMes(idx, 2000, 5), "el-nino");
  assert.equal(faseDoMes(idx, 2000, 4), "la-nina");
  assert.equal(faseDoMes(idx, 2000, 6), null);
});

test("meio da fase crítica: soja 20/10 → maio; soja 20/09 → abril", () => {
  assert.deepEqual(meioDaFase("10-20", 2003), { ano: 2003, mes: 5 });
  assert.deepEqual(meioDaFase("09-20", 2003), { ano: 2003, mes: 4 });
  assert.deepEqual(meioDaFase("11-30", 2003), { ano: 2003, mes: 6 });
});

test("dados reais da NOAA: RONI de abr–jun de 1997 e 1999 e valor mais recente", () => {
  assert.equal(faseDoMes(real.roni, 1997, 5), "el-nino"); // AMJ 1997 = +0,83
  assert.equal(faseDoMes(real.roni, 1999, 5), "la-nina"); // AMJ 1999 = -0,81
  const u = ultimoTrimestre(real.roni);
  assert.equal(u?.ano, 2026);
  assert.equal(u?.fase, "el-nino");
});

test("as três fases particionam os anos avaliados (nenhum ano em duas fases)", () => {
  const anos = riscoGeada(pb, "10-20").porAno.map((a) => a.ano);
  const mapa = fasePorAno(real.roni, "10-20", anos);
  const porFase = FASES_ENSO.map((f) => anos.filter((a) => mapa.get(a) === f));
  const soma = porFase.reduce((s, l) => s + l.length, 0);
  assert.equal(soma, anos.length); // todos os anos 1982–2026 têm índice
  assert.equal(new Set(porFase.flat()).size, anos.length);
  assert.ok(porFase.every((l) => l.length >= 7), "cada fase tem amostra razoável");
});

test("restringirAnos: refaz contagem, anos e detalhe da seca sem alterar o original", () => {
  const r = riscoSeca(pb, "10-20");
  const antes = JSON.stringify(r);
  const so = new Set([1997, 1998, 1999, 2000, 2001]);
  const sub = restringirAnos(r, so);
  assert.equal(JSON.stringify(r), antes, "original intacto");
  assert.ok(sub.porAno.every((a) => so.has(a.ano)));
  assert.equal(sub.totalAnos, sub.porAno.length);
  assert.deepEqual(
    sub.anosListados,
    r.anosListados.filter((a) => so.has(a)),
  );
  assert.ok(sub.detalheSeca && sub.detalheSeca.anosAmbos.every((a) => so.has(a)));
  assert.equal(sub.anosFortes, undefined);
});

test("restringirAnos na geada mantém os anos de geada forte do subconjunto", () => {
  const r = riscoGeada(pb, "10-20");
  const so = new Set(r.porAno.map((a) => a.ano).filter((a) => a % 2 === 0));
  const sub: ResultadoRisco = restringirAnos(r, so);
  assert.deepEqual(
    sub.anosFortes,
    (r.anosFortes ?? []).filter((a) => so.has(a)),
  );
  assert.equal(restringirAnos(r, new Set(r.porAno.map((a) => a.ano))).anosComEvento, r.anosComEvento);
  assert.equal(restringirAnos(r, new Set()).totalAnos, 0);
  assert.equal(restringirAnos(r, new Set()).periodo, null);
});
