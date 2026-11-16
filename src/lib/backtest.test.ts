// Confere o teste com o IBGE (src/data/backtest_ibge.json) com uma conta independente do script que o gerou.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { riscoGeada, riscoSeca, PARAMS_PADRAO, type DadosDiarios } from "./engine/index.ts";

const ler = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const bt = ler("src/data/backtest_ibge.json");
const ibge = ler("src/data/ibge_pam_milho2.json");
const IDS = ["pato-branco", "cascavel", "francisco-beltrao"];

test("marcados + não marcados = total de anos-município, em todas as datas e tipos", () => {
  const total = Object.values(bt.meta.anosPorMunicipio as Record<string, number>).reduce((a, b) => a + b, 0);
  for (const [data, r] of Object.entries(bt.porData as Record<string, Record<string, { nMarc: number; nNao: number; p: number }>>)) {
    for (const [tipo, v] of Object.entries(r)) {
      assert.equal(v.nMarc + v.nNao, total, `${data} ${tipo}`);
      assert.ok(v.p > 0 && v.p <= 1, `${data} ${tipo} p`);
    }
  }
});

test("anomalia de produtividade: recalculada à parte (tendência linear) bate com o arquivo, nos 3 municípios", () => {
  for (const id of IDS) {
    const pts = Object.entries(ibge.dados[id] as Record<string, { rendimentoKgHa: number | null; areaColhidaHa: number | null }>)
      .map(([a, v]) => ({ ano: Number(a), y: v.rendimentoKgHa, area: v.areaColhidaHa }))
      .filter((p): p is { ano: number; y: number; area: number } => !!p.y && !!p.area && p.area >= bt.meta.minAreaHa);
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p.ano, 0) / n;
    const my = pts.reduce((s, p) => s + p.y, 0) / n;
    const b = pts.reduce((s, p) => s + (p.ano - mx) * (p.y - my), 0) / pts.reduce((s, p) => s + (p.ano - mx) ** 2, 0);
    for (const p of pts) {
      const ajuste = my + b * (p.ano - mx);
      const esperado = Math.round(((p.y - ajuste) / ajuste) * 1000) / 10;
      const noArquivo = (bt.anosPrincipal[id] as { ano: number; anomalia: number }[]).find((a) => a.ano === p.ano);
      assert.ok(noArquivo, `${id} ${p.ano}`);
      assert.ok(Math.abs(noArquivo.anomalia - esperado) < 0.11, `${id} ${p.ano}: ${noArquivo.anomalia} x ${esperado}`);
    }
    assert.equal(n, bt.meta.anosPorMunicipio[id]);
  }
});

test("só entram anos com área colhida mínima e rendimento informado", () => {
  for (const id of IDS)
    for (const a of bt.anosPrincipal[id] as { areaHa: number; rendimento: number }[]) {
      assert.ok(a.areaHa >= bt.meta.minAreaHa);
      assert.ok(a.rendimento > 0);
    }
});

test("as marcações de geada e seca do arquivo = as do motor para a data principal", () => {
  for (const id of IDS) {
    const dados = ler(`src/data/power_daily_${id}.json`) as DadosDiarios;
    const g = new Set(riscoGeada(dados, bt.meta.dataPrincipal, PARAMS_PADRAO).anosListados);
    const s = new Set(riscoSeca(dados, bt.meta.dataPrincipal, PARAMS_PADRAO).anosListados);
    for (const a of bt.anosPrincipal[id] as { ano: number; geada: boolean; seca: boolean }[]) {
      assert.equal(a.geada, g.has(a.ano), `${id} ${a.ano} geada`);
      assert.equal(a.seca, s.has(a.ano), `${id} ${a.ano} seca`);
    }
  }
});
