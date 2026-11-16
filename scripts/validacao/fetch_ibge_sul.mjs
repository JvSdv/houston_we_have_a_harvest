// Teste 3 (dados): milho 2ª safra do IBGE (PAM, tabela 839) para TODOS os municípios do Paraná e de Santa Catarina,
// e a NASA POWER diária (1981 em diante) no centro de cada município que planta safrinha de verdade.
// Seleção, fixada antes de ver qualquer resultado: >= 12 anos com área colhida >= 500 ha e rendimento informado.
// Saída: .cache/validacao/ibge_sul.json e .cache/validacao/power_mun/<código>.json
// Uso: node scripts/validacao/fetch_ibge_sul.mjs
import path from "node:path";
import fs from "node:fs";
import { CACHE, buscarJson, buscarTexto, salvarJson } from "./comum.mjs";
import { urlPower, compactarPower } from "../../src/lib/power.ts";

const MIN_AREA_HA = 500;
const MIN_ANOS = 12;
const UFS = "41,42"; // PR, SC

const sidra = async (v) =>
  (
    await buscarJson(
      `https://apisidra.ibge.gov.br/values/t/839/n6/in%20n3%20${UFS.replace(",", "%2C")}/v/${v}/p/all/c81/114254?formato=json`,
      path.join("sidra", `t839_v${v}.json`),
    )
  ).slice(1);

const num = (v) => (/^\d+(\.\d+)?$/.test(v) ? Number(v) : null);
const dados = {};
for (const [nome, v] of [
  ["rendimentoKgHa", "112"],
  ["areaColhidaHa", "216"],
]) {
  for (const l of await sidra(v)) {
    const cod = l.D1C;
    ((dados[cod] ??= { nome: l.D1N, anos: {} }).anos[l.D3C] ??= {})[nome] = num(l.V);
  }
}
const coords = Object.fromEntries(
  (await buscarTexto("https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv", "municipios.csv"))
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.split(","))
    .map((c) => [c[0], { lat: +c[2], lon: +c[3] }]),
);

const escolhidos = Object.entries(dados)
  .map(([cod, m]) => ({
    cod,
    nome: m.nome,
    ...coords[cod],
    anos: Object.entries(m.anos)
      .map(([a, x]) => ({ ano: +a, y: x.rendimentoKgHa, area: x.areaColhidaHa }))
      .filter((p) => p.y && p.area >= MIN_AREA_HA),
  }))
  .filter((m) => m.anos.length >= MIN_ANOS && Number.isFinite(m.lat));
console.log(`${Object.keys(dados).length} municípios no PR+SC; ${escolhidos.length} com >= ${MIN_ANOS} anos de safrinha >= ${MIN_AREA_HA} ha`);

const hoje = new Date();
for (const [k, m] of escolhidos.entries()) {
  const arq = path.join(CACHE, "power_mun", `${m.cod}.json`);
  if (fs.existsSync(arq)) continue;
  process.stdout.write(`[${k + 1}/${escolhidos.length}] ${m.nome} … `);
  const url = urlPower(m.lat, m.lon, hoje);
  const bruto = await buscarJson(url, path.join("power_mun_bruto", `${m.cod}.json`), { pausa: 1500 });
  salvarJson(arq, compactarPower(bruto, { id: m.cod, nome: m.nome, lat: m.lat, lon: m.lon }, url, hoje));
  fs.rmSync(path.join(CACHE, "power_mun_bruto", `${m.cod}.json`));
  console.log("ok");
}
salvarJson(path.join(CACHE, "ibge_sul.json"), {
  fonte: "IBGE SIDRA · PAM tabela 839, Milho (em grão) 2ª safra, municípios do PR e SC",
  baixadoEm: new Date().toISOString(),
  minAreaHa: MIN_AREA_HA,
  minAnos: MIN_ANOS,
  municipios: escolhidos,
});
console.log("ok");
