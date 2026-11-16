import { test } from "node:test";
import assert from "node:assert/strict";
import { ROTACOES, ordenarRotacoes, prioridadesDoCampo } from "./rotacoes.ts";

const RISCO = { milho: 1, trigo: 1, "milho-braquiaria": 1 } as const;
const ids = (x: { id: string }[]) => x.map((r) => r.id);

test("equilíbrio sem restrições: braquiária lidera e nenhuma rotação some", () => {
  const o = ordenarRotacoes(ROTACOES, prioridadesDoCampo("equilibrio", []), [], RISCO);
  assert.equal(o.length, 3);
  assert.equal(o[0].id, "milho-braquiaria");
  assert.ok(o.every((r) => r.bloqueios.length === 0));
});

test("renda sem restrições: milho lidera", () => {
  const o = ordenarRotacoes(ROTACOES, prioridadesDoCampo("renda", []), [], RISCO);
  assert.equal(o[0].id, "milho");
});

test("sem trigo: trigo vai para o fim com bloqueio, mesmo se fosse a melhor", () => {
  const trigoMelhor = ROTACOES.map((r) =>
    r.id === "trigo" ? { ...r, atende: { ...r.atende, mercado: 3 as const } } : r,
  );
  const o = ordenarRotacoes(trigoMelhor, ["mercado"], ["semTrigo"], RISCO);
  assert.equal(o[2].id, "trigo");
  assert.deepEqual(o[2].bloqueios, ["semTrigo"]);
  assert.equal(o.length, 3);
});

test("sem braquiária: milho+braquiária fica por último", () => {
  const o = ordenarRotacoes(ROTACOES, prioridadesDoCampo("solo-agua", []), ["semBraquiaria"], RISCO);
  assert.equal(o[2].id, "milho-braquiaria");
  assert.deepEqual(o[2].bloqueios, ["semBraquiaria"]);
  assert.deepEqual(ids(o).slice(0, 2).sort(), ["milho", "trigo"]);
});

test("pouca água acrescenta a prioridade água uma única vez", () => {
  assert.deepEqual(prioridadesDoCampo("renda", ["poucaAgua"]), ["mercado", "agua"]);
  assert.deepEqual(prioridadesDoCampo("solo-agua", ["poucaAgua"]), ["agua", "erosao", "materiaOrganica"]);
});

test("empate de soma: menor risco climático primeiro", () => {
  const dois: Parameters<typeof ordenarRotacoes>[0] = [
    { id: "milho" as const, atende: { agua: 2, forragem: 2, nitrogenio: 2, erosao: 2, materiaOrganica: 2, mercado: 2 } },
    { id: "trigo" as const, atende: { agua: 2, forragem: 2, nitrogenio: 2, erosao: 2, materiaOrganica: 2, mercado: 2 } },
  ];
  const o = ordenarRotacoes(dois, ["agua"], [], { milho: 2, trigo: 0, "milho-braquiaria": 0 });
  assert.equal(o[0].id, "trigo");
});
