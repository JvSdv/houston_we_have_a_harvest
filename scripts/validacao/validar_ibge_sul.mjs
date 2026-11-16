// Teste 3: os anos que o app marca produziram menos milho safrinha? Agora com todos os municípios do PR e de SC
// que plantam safrinha (o teste antigo tinha só 3 municípios e era pequeno demais para enxergar efeito).
//
// REGRAS FIXADAS ANTES DE VER O RESULTADO (não mudar depois de rodar):
//  - municípios: >= 12 anos com área colhida >= 500 ha e rendimento informado (fetch_ibge_sul.mjs);
//  - data da soja principal: 20/10 (a do app); as demais datas entram só como sensibilidade;
//  - anomalia = (rendimento − tendência linear do município) / tendência (tira o ganho de tecnologia);
//  - A (principal, igual ao teste antigo): diferença da anomalia média, anos marcados − não marcados;
//    p-valor por permutação das marcas DENTRO de cada município (5.000 sorteios);
//  - B (secundário): a mesma coisa, mas tirando de cada ano a média de todos os municípios naquele ano
//    (compara, no mesmo ano, municípios marcados com não marcados; tira preço, tecnologia e efeitos do ano);
//  - eventos: geada, seca, qualquer um dos dois.
// Entrada: .cache/validacao/ibge_sul.json e .cache/validacao/power_mun/*.json
// Saída: src/data/validacao_ibge_sul.json
import fs from "node:fs";
import path from "node:path";
import { CACHE, media, rng, salvarJson } from "./comum.mjs";
import { riscoGeada, riscoSeca, PARAMS_PADRAO } from "../../src/lib/engine/index.ts";

const PRINCIPAL = "10-20";
const DATAS = ["09-20", "10-01", "10-10", "10-20", "10-30", "11-10", "11-20", "11-30"];
const N = 5000;

const ibge = JSON.parse(fs.readFileSync(path.join(CACHE, "ibge_sul.json"), "utf8"));
function ols(x, y) {
  const mx = media(x), my = media(y);
  const b = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0) / x.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  return (xi) => my + b * (xi - mx);
}

const muns = [];
for (const m of ibge.municipios) {
  const arq = path.join(CACHE, "power_mun", `${m.cod}.json`);
  if (!fs.existsSync(arq)) continue;
  const f = ols(m.anos.map((p) => p.ano), m.anos.map((p) => p.y));
  muns.push({ ...m, dados: JSON.parse(fs.readFileSync(arq, "utf8")), pts: m.anos.map((p) => ({ ano: p.ano, anom: (p.y - f(p.ano)) / f(p.ano) })) });
}
// versão B: tira a média do ano
const mediaAno = {};
for (const m of muns) for (const p of m.pts) (mediaAno[p.ano] ??= []).push(p.anom);
for (const m of muns) for (const p of m.pts) p.anomAno = p.anom - media(mediaAno[p.ano]);

function teste(flags, campo, semente = 42) {
  const dif = (fl) => {
    const a = [], b = [];
    muns.forEach((m, i) => m.pts.forEach((p) => (fl[i].has(p.ano) ? a : b).push(p[campo])));
    return { d: media(a) - media(b), nMarc: a.length, nNao: b.length, mMarc: media(a), mNao: media(b) };
  };
  const obs = dif(flags);
  const R = rng(semente);
  let extremo = 0;
  for (let k = 0; k < N; k++) {
    const sh = muns.map((m, i) => {
      const anos = m.pts.map((p) => p.ano);
      const nM = anos.filter((a) => flags[i].has(a)).length;
      for (let j = anos.length - 1; j > 0; j--) {
        const r = Math.floor(R() * (j + 1));
        [anos[j], anos[r]] = [anos[r], anos[j]];
      }
      return new Set(anos.slice(0, nM));
    });
    if (Math.abs(dif(sh).d) >= Math.abs(obs.d) - 1e-12) extremo++;
  }
  const r = (x) => Math.round(x * 10000) / 10000;
  return { d: r(obs.d), nMarc: obs.nMarc, nNao: obs.nNao, mMarc: r(obs.mMarc), mNao: r(obs.mNao), p: r((extremo + 1) / (N + 1)) };
}

const porData = {};
for (const data of DATAS) {
  const g = muns.map((m) => new Set(riscoGeada(m.dados, data, PARAMS_PADRAO).anosListados));
  const s = muns.map((m) => new Set(riscoSeca(m.dados, data, PARAMS_PADRAO).anosListados));
  const q = g.map((x, i) => new Set([...x, ...s[i]]));
  const ev = { geada: g, seca: s, qualquer: q };
  porData[data] = {};
  for (const [k, fl] of Object.entries(ev))
    porData[data][k] = data === PRINCIPAL ? { A: teste(fl, "anom"), B: teste(fl, "anomAno") } : { A: teste(fl, "anom") };
  console.log(data, JSON.stringify(porData[data]));
}
// C — VERIFICAÇÃO EXTRA, ADICIONADA DEPOIS DE VER A e B (não estava nas regras fixadas):
// seca e geada costumam pegar a região inteira no mesmo ano, então os municípios não são independentes e o p de A
// pode estar otimista. Aqui cada ano conta uma vez só: para cada ano, a fração de municípios marcados × a anomalia média
// de todos os municípios naquele ano. p por permutação dos anos (10.000 sorteios). Bem mais conservador.
function testeAnos(flags, semente = 11) {
  const anos = Object.keys(mediaAno).map(Number).filter((a) => mediaAno[a].length >= 50).sort();
  const frac = [], anomMedia = [];
  for (const a of anos) {
    let marc = 0, tot = 0;
    muns.forEach((m, i) => {
      if (m.pts.some((p) => p.ano === a)) {
        tot++;
        if (flags[i].has(a)) marc++;
      }
    });
    frac.push(marc / tot);
    anomMedia.push(media(mediaAno[a]));
  }
  const inc = (x, y) => {
    const mx = media(x), my = media(y);
    return x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0) / x.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  };
  const cor = (x, y) => {
    const mx = media(x), my = media(y);
    let a = 0, b = 0, c = 0;
    x.forEach((xi, i) => {
      a += (xi - mx) * (y[i] - my);
      b += (xi - mx) ** 2;
      c += (y[i] - my) ** 2;
    });
    return a / Math.sqrt(b * c);
  };
  const b = inc(frac, anomMedia);
  const R = rng(semente);
  let extremo = 0;
  const NA = 10000;
  for (let k = 0; k < NA; k++) {
    const y = [...anomMedia];
    for (let j = y.length - 1; j > 0; j--) {
      const r = Math.floor(R() * (j + 1));
      [y[j], y[r]] = [y[r], y[j]];
    }
    if (Math.abs(inc(frac, y)) >= Math.abs(b)) extremo++;
  }
  const r4 = (x) => Math.round(x * 10000) / 10000;
  return {
    anos: anos.length,
    /** variação da anomalia média de um ano sem nenhum município marcado para um ano com todos marcados */
    efeitoTodosMarcados: r4(b),
    correlacao: r4(cor(frac, anomMedia)),
    p: r4((extremo + 1) / (NA + 1)),
    porAno: anos.map((a, i) => ({ ano: a, fracaoMarcados: r4(frac[i]), anomaliaMedia: r4(anomMedia[i]) })),
  };
}
{
  const g = muns.map((m) => new Set(riscoGeada(m.dados, PRINCIPAL, PARAMS_PADRAO).anosListados));
  const s = muns.map((m) => new Set(riscoSeca(m.dados, PRINCIPAL, PARAMS_PADRAO).anosListados));
  const q = g.map((x, i) => new Set([...x, ...s[i]]));
  for (const [k, fl] of Object.entries({ geada: g, seca: s, qualquer: q })) porData[PRINCIPAL][k].C = testeAnos(fl);
  console.log("C (por ano)", JSON.stringify(Object.fromEntries(Object.entries(porData[PRINCIPAL]).map(([k, v]) => [k, { ...v.C, porAno: undefined }]))));
}
const todos = Object.values(porData).flatMap((x) => Object.values(x).map((y) => y.A));
salvarJson("src/data/validacao_ibge_sul.json", {
  meta: {
    fonte: ibge.fonte,
    baixadoEm: ibge.baixadoEm,
    municipios: muns.length,
    anosMunicipio: muns.reduce((a, m) => a + m.pts.length, 0),
    minAreaHa: ibge.minAreaHa,
    minAnos: ibge.minAnos,
    dataPrincipal: PRINCIPAL,
    permutacoes: N,
  },
  principal: porData[PRINCIPAL],
  porData,
  testes: todos.length,
  significativos: todos.filter((x) => x.p < 0.05).length,
  municipiosUsados: muns.map((m) => ({ cod: m.cod, nome: m.nome, anos: m.pts.length })),
});
