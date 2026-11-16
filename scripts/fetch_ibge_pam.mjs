// Baixa do IBGE SIDRA (Pesquisa Agrícola Municipal, tabela 839) o rendimento e a área colhida
// do milho em grão 2ª safra (código 114254) dos 3 municípios, todos os anos disponíveis.
// Saída: src/data/ibge_pam_milho2.json (com a URL usada e a data do download).
import fs from "node:fs";

const MUNICIPIOS = { "pato-branco": "4118501", cascavel: "4104808", "francisco-beltrao": "4108403" };
const VARIAVEIS = { rendimentoKgHa: "112", areaColhidaHa: "216", producaoT: "214" };
const url = (cod, v) =>
  `https://apisidra.ibge.gov.br/values/t/839/n6/${cod}/v/${v}/p/all/c81/114254?formato=json`;

const out = { meta: { fonte: "IBGE SIDRA · Pesquisa Agrícola Municipal, tabela 839, Milho (em grão) 2ª safra", baixadoEm: new Date().toISOString(), urls: {} }, dados: {} };
for (const [id, cod] of Object.entries(MUNICIPIOS)) {
  out.dados[id] = {};
  for (const [nome, v] of Object.entries(VARIAVEIS)) {
    const u = url(cod, v);
    out.meta.urls[`${id}.${nome}`] = u;
    const r = await fetch(u);
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    const linhas = (await r.json()).slice(1);
    for (const l of linhas) {
      const ano = Number(l.D3C);
      const valor = /^\d+(\.\d+)?$/.test(l.V) ? Number(l.V) : null; // "-", "..", "X" = sem dado
      (out.dados[id][ano] ??= {})[nome] = valor;
    }
  }
}
fs.writeFileSync("src/data/ibge_pam_milho2.json", JSON.stringify(out, null, 1));
for (const [id, anos] of Object.entries(out.dados)) {
  const ys = Object.keys(anos).map(Number).sort();
  const ok = ys.filter((y) => anos[y].rendimentoKgHa);
  console.log(id, "anos:", ys[0], "-", ys[ys.length - 1], "com rendimento:", ok.length);
}
