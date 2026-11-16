// Testes do caminho "qualquer município": resposta da NASA POWER → formato compacto → resultados da tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { compactarPower, urlPower, PARAMETROS_POWER } from "./power.ts";
import { buildLocalView } from "./local-view.ts";
import { interpretarBusca, dentroDoBrasil, noSulDoBrasil, idDoPonto } from "./lugares.ts";
import type { DadosDiarios } from "./engine/index.ts";
import type { IndiceEnso } from "./engine/enso.ts";

const ler = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const DIA = 86_400_000;
const indiceEnso = ler("src/data/enso.json").roni as IndiceEnso;

/** Monta uma resposta no formato da API da NASA a partir de um arquivo pré-baixado (nulos viram -999). */
function respostaDe(dados: DadosDiarios, diasFinaisSemDado = 0) {
  const t0 = Date.parse(`${dados.meta.start}T00:00:00Z`);
  const n = dados.data.T2M_MIN.length;
  const parameter: Record<string, Record<string, number>> = {};
  for (const p of PARAMETROS_POWER) {
    parameter[p] = {};
    for (let i = 0; i < n + diasFinaisSemDado; i++) {
      const k = new Date(t0 + i * DIA).toISOString().slice(0, 10).replaceAll("-", "");
      const v = i < n ? (dados.data[p as keyof DadosDiarios["data"]][i] as number | null) : null;
      parameter[p][k] = v === null ? -999 : v;
    }
  }
  return {
    header: { fill_value: -999, api: { version: "teste" }, sources: ["MERRA2"], time_standard: "LST" },
    geometry: { coordinates: [-53.46, -24.96, 523.8] },
    properties: { parameter },
    parameters: Object.fromEntries(PARAMETROS_POWER.map((p) => [p, { units: "u" }])),
  };
}

const loc = { id: "ponto-teste", nome: "Ponto de teste", lat: -24.9578, lon: -53.4595 };

test("compactar: resposta da API → mesmos arrays do arquivo pré-baixado (com nulos e dias finais sem dado)", () => {
  const stored = ler("src/data/power_daily_cascavel.json") as DadosDiarios;
  // acrescenta 3 dias finais sem dado e 2 buracos no meio, que devem virar null
  const resp = respostaDe(stored, 3);
  resp.properties.parameter.T2M_MIN["19900105"] = -999;
  resp.properties.parameter.PRECTOTCORR["19900106"] = -999;
  const c = compactarPower(resp, loc, "http://x");
  assert.equal(c.meta.start, stored.meta.start);
  assert.equal(c.meta.end, stored.meta.end); // dias finais sem dado foram cortados
  assert.equal(c.meta.days, stored.data.T2M_MIN.length);
  assert.equal(c.meta.gridElevationM, 523.8);
  const i = Math.round((Date.parse("1990-01-05T00:00:00Z") - Date.parse("1981-01-01T00:00:00Z")) / DIA);
  assert.equal(c.data.T2M_MIN[i], null);
  assert.equal(c.data.PRECTOTCORR[i + 1], null);
  for (const p of PARAMETROS_POWER) {
    const a = c.data[p].filter((_, k) => k !== i && k !== i + 1);
    const b = stored.data[p].filter((_, k) => k !== i && k !== i + 1);
    assert.deepEqual(a, b, p);
  }
});

test("resultados da tela: o caminho 'baixado na hora' dá o mesmo resultado que o pré-baixado", () => {
  const stored = ler("src/data/power_daily_pato-branco.json") as DadosDiarios;
  const viaApi = compactarPower(respostaDe(stored, 2), { ...loc, nome: "Pato Branco" }, "http://x");
  const a = buildLocalView({ id: "a", nome: "Pato Branco", lat: -26.2295, lon: -52.6716, dados: stored, relevo: null, indiceEnso });
  const b = buildLocalView({ id: "b", nome: "Pato Branco", lat: -26.2295, lon: -52.6716, dados: viaApi, relevo: null, indiceEnso, personalizado: true });
  assert.deepEqual(b.datas, a.datas);
  assert.deepEqual(b.trigo, a.trigo);
  assert.deepEqual(b.epocaGeada, a.epocaGeada);
  assert.deepEqual(b.prova2026, a.prova2026);
  assert.equal(b.personalizado, true);
  assert.equal(a.personalizado, undefined);
});

test("compactar: resposta inesperada ou com poucos dados lança erro", () => {
  assert.throws(() => compactarPower({}, loc, "u"), /inesperada/);
  assert.throws(() => compactarPower({ properties: { parameter: { T2M_MIN: {} } } }, loc, "u"), /inesperada/);
  const curta = respostaDe(ler("src/data/power_daily_cascavel.json"));
  for (const p of PARAMETROS_POWER) {
    const ks = Object.keys(curta.properties.parameter[p]).slice(0, 400);
    curta.properties.parameter[p] = Object.fromEntries(ks.map((k) => [k, 1]));
  }
  assert.throws(() => compactarPower(curta, loc, "u"), /poucos dados/);
});

test("url da NASA POWER: parâmetros, comunidade, coordenadas e datas", () => {
  const u = new URL(urlPower(-24.9578, -53.4595, new Date("2026-11-14T10:00:00Z")));
  assert.equal(u.hostname, "power.larc.nasa.gov");
  assert.equal(u.searchParams.get("parameters"), "T2M_MIN,T2M_MAX,PRECTOTCORR,GWETROOT,GWETTOP");
  assert.equal(u.searchParams.get("community"), "AG");
  assert.equal(u.searchParams.get("latitude"), "-24.9578");
  assert.equal(u.searchParams.get("longitude"), "-53.4595");
  assert.equal(u.searchParams.get("start"), "19810101");
  assert.equal(u.searchParams.get("end"), "20261114");
});

test("busca de município: só Brasil, sem repetidos, dentro da caixa do país, coordenadas arredondadas", () => {
  const r = interpretarBusca({
    results: [
      { name: "Guarapuava", latitude: -25.39048, longitude: -51.46541, country_code: "BR", admin1: "Paraná", population: 189630 },
      { name: "Guarapuava", latitude: -25.4, longitude: -51.5, country_code: "BR", admin1: "Paraná" }, // repetido
      { name: "Palmas", latitude: -10.2, longitude: -48.3, country_code: "BR", admin1: "Tocantins" },
      { name: "Palmas", latitude: 10, longitude: -70, country_code: "VE" }, // outro país
      { name: "Fora", latitude: 40, longitude: -3, country_code: "BR" }, // coordenadas impossíveis
      { latitude: -20, longitude: -50, country_code: "BR" }, // sem nome
    ],
  });
  assert.deepEqual(r.map((x) => `${x.nome}/${x.estado}`), ["Guarapuava/Paraná", "Palmas/Tocantins"]);
  assert.equal(r[0].lat, -25.3905);
  assert.deepEqual(interpretarBusca({}), []);
  assert.deepEqual(interpretarBusca(null), []);
});

test("caixa do Brasil, Sul do Brasil e identificador do ponto", () => {
  assert.ok(dentroDoBrasil(-26.23, -52.67));
  assert.ok(!dentroDoBrasil(40.4, -3.7));
  assert.ok(!dentroDoBrasil(-26.23, -20)); // Atlântico, fora da caixa
  assert.ok(noSulDoBrasil(-26.23));
  assert.ok(!noSulDoBrasil(-12.5));
  assert.equal(idDoPonto(-26.2295, -52.6716), "ponto--26.230_-52.672");
});
