import { test } from "node:test";
import assert from "node:assert/strict";
import { avaliarPrevisao, PARAMS_PREVISAO, type PrevisaoDiaria } from "./previsao.ts";

function base(n = 16): PrevisaoDiaria {
  const time = Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 10, 14 + i)).toISOString().slice(0, 10));
  return {
    time,
    temperature_2m_min: Array(n).fill(15),
    temperature_2m_max: Array(n).fill(27),
    precipitation_sum: Array(n).fill(5),
  };
}

test("sem eventos → sem alerta", () => {
  const r = avaliarPrevisao(base());
  assert.equal(r.nivel, "sem-alerta");
  assert.equal(r.eventos.length, 0);
  assert.equal(r.chuvaSemanaMm, 35);
});

test("geada na primeira semana → não plante esta semana", () => {
  const p = base();
  p.temperature_2m_min[3] = 2.5;
  const r = avaliarPrevisao(p);
  assert.equal(r.nivel, "nao-plantar");
  assert.equal(r.titulo, "Não plante esta semana");
  assert.deepEqual(r.eventos.map((e) => [e.tipo, e.data]), [["geada", "2026-11-17"]]);
});

test("baixada sobe o limite de geada em 1 °C", () => {
  const p = base();
  p.temperature_2m_min[2] = 3.5;
  assert.equal(avaliarPrevisao(p).nivel, "sem-alerta");
  assert.equal(avaliarPrevisao(p, PARAMS_PREVISAO, 1).nivel, "nao-plantar");
});

test("chuva forte depois da primeira semana → só atenção", () => {
  const p = base();
  p.precipitation_sum[9] = 53.4;
  const r = avaliarPrevisao(p);
  assert.equal(r.nivel, "atencao");
  assert.equal(r.eventos[0].dia, 9);
});

test("chuva forte na primeira semana → não plantar", () => {
  const p = base();
  p.precipitation_sum[1] = 60;
  assert.equal(avaliarPrevisao(p).nivel, "nao-plantar");
});

test("semana seca → atenção", () => {
  const p = base();
  for (let i = 0; i < 7; i++) p.precipitation_sum[i] = 0.5;
  const r = avaliarPrevisao(p);
  assert.equal(r.nivel, "atencao");
  assert.equal(r.titulo, "Atenção: semana seca");
});

test("mensagens em inglês", () => {
  const p = base();
  p.temperature_2m_min[3] = 2.5;
  const r = avaliarPrevisao(p, PARAMS_PREVISAO, 0, "en");
  assert.equal(r.titulo, "Do not plant this week");
  assert.match(r.mensagens[0], /frost forecast on Nov 17/);
  const seco = base();
  for (let i = 0; i < 7; i++) seco.precipitation_sum[i] = 0.5;
  assert.equal(avaliarPrevisao(seco, PARAMS_PREVISAO, 0, "en").titulo, "Caution: dry week");
});

test("valores nulos não quebram e previsão curta funciona", () => {
  const p = base(3);
  p.temperature_2m_min[1] = null;
  p.precipitation_sum[2] = null;
  const r = avaliarPrevisao(p);
  assert.equal(r.diasAvaliados, 3);
  assert.equal(r.nivel, "sem-alerta");
});
