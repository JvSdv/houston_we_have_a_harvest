// Conferência independente com os dados reais: refaz geada e seca do milho safrinha por datas ISO e mapas,
// sem usar os índices nem as funções do motor, e exige resultado idêntico em toda a grade
// (3 municípios × 8 datas de soja × 6 medidas).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { riscoGeada, riscoSeca, PARAMS_PADRAO, type DadosDiarios } from "./index.ts";

const DATAS = ["09-20", "10-01", "10-10", "10-20", "10-30", "11-10", "11-20", "11-30"];
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const soma = (ms: number, d: number) => ms + d * 86_400_000;

for (const id of ["pato-branco", "cascavel", "francisco-beltrao"]) {
  test(`geada e seca recalculadas à parte = motor (${id}, 8 datas)`, () => {
    const p = JSON.parse(fs.readFileSync(`src/data/power_daily_${id}.json`, "utf8")) as DadosDiarios;
    const t0 = Date.parse(`${p.meta.start}T00:00:00Z`);
    const T = new Map<string, number | null>();
    const P = new Map<string, number | null>();
    const G = new Map<string, number | null>();
    p.data.T2M_MIN.forEach((v, i) => {
      const k = iso(soma(t0, i));
      T.set(k, v);
      P.set(k, p.data.PRECTOTCORR[i]);
      G.set(k, p.data.GWETROOT[i]);
    });
    for (const d of DATAS) {
      const linhas: { ano: number; frost: boolean; strong: boolean; veranico: boolean; umid: number; solo: boolean }[] = [];
      for (let y = 1981; y <= 2026; y++) {
        const soja = Date.UTC(y, Number(d.slice(0, 2)) - 1, Number(d.slice(3, 5)));
        const plantioMilho = soma(soja, PARAMS_PADRAO.cicloSoja + PARAMS_PADRAO.intervalo);
        const dias: string[] = [];
        for (let k = PARAMS_PADRAO.faseCriticaInicio; k <= PARAMS_PADRAO.faseCriticaFim; k++) dias.push(iso(soma(plantioMilho, k)));
        if (dias.some((x) => T.get(x) == null || P.get(x) == null || G.get(x) == null)) continue;
        const mins = dias.map((x) => T.get(x) as number);
        let seq = 0;
        let melhor = 0;
        for (const x of dias) {
          if ((P.get(x) as number) < PARAMS_PADRAO.chuvaDiaSecoMm) melhor = Math.max(melhor, ++seq);
          else seq = 0;
        }
        const gs = dias.map((x) => G.get(x) as number);
        linhas.push({
          ano: Number(dias[0].slice(0, 4)),
          frost: Math.min(...mins) <= PARAMS_PADRAO.limiteGeadaC,
          strong: Math.min(...mins) <= PARAMS_PADRAO.limiteGeadaForteC,
          veranico: melhor >= PARAMS_PADRAO.sequenciaSecaDias,
          umid: gs.reduce((a, b) => a + b, 0) / gs.length,
          solo: false,
        });
      }
      const ord = linhas.map((l) => l.umid).sort((a, b) => a - b);
      const pos = (PARAMS_PADRAO.percentilUmidadeSolo / 100) * (ord.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      const limite = ord[lo] + (ord[hi] - ord[lo]) * (pos - lo);
      for (const l of linhas) l.solo = l.umid < limite;
      const g = riscoGeada(p, d, PARAMS_PADRAO);
      const s = riscoSeca(p, d, PARAMS_PADRAO);
      const anos = (f: (l: (typeof linhas)[number]) => boolean) => linhas.filter(f).map((l) => l.ano);
      assert.equal(g.totalAnos, linhas.length, `${id} ${d} n`);
      assert.deepEqual(g.anosListados, anos((l) => l.frost), `${id} ${d} geada`);
      assert.deepEqual(g.anosFortes, anos((l) => l.strong), `${id} ${d} geada forte`);
      assert.deepEqual(s.detalheSeca?.anosVeranico, anos((l) => l.veranico), `${id} ${d} veranico`);
      assert.deepEqual(s.detalheSeca?.anosSoloSeco, anos((l) => l.solo), `${id} ${d} solo seco`);
      assert.deepEqual(s.anosListados, anos((l) => l.veranico || l.solo), `${id} ${d} seca`);
    }
  });
}
