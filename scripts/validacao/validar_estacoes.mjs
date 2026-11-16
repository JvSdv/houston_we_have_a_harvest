// Testes 1 e 2: NASA POWER (o que o app usa) contra o que as estações automáticas do INMET mediram no chão.
//
// REGRAS FIXADAS ANTES DE VER O RESULTADO (não mudar depois de rodar):
// Teste 1 — o satélite enxerga a geada e a seca?
//  a) Diário: viés (POWER − estação), erro médio absoluto e correlação da mínima a 2 m, em todos os dias com os dois valores.
//  b) Dia frio: "evento" = mínima <= 3 °C (o limite do app). Acerto (POD) = eventos da estação que o POWER também marcou;
//     alarme falso (FAR) = dias que o POWER marcou e a estação não.
//  c) O que o app afirma, por safra: para cada estação, ano e data de soja do app, a janela de floração e enchimento do milho
//     (soja + 120 + 5 dias; +55 a +100 dias) é marcada como "geada" se algum dia tiver mínima <= 3 °C. Só entram janelas
//     com >= 90% dos dias medidos pela estação. Mede-se a concordância POWER × estação (e o kappa de Cohen).
//  d) Seca, por safra: veranico de >= 15 dias seguidos com chuva < 1 mm na janela, só a parte da chuva (a estação não mede
//     umidade do solo). Só janelas com >= 95% dos dias de chuva medidos.
// Teste 2 — baixada (relevo):
//  Para cada estação, "quanto a estação é mais fria que o satélite" nas noites frias (POWER <= 8 °C), já descontada a diferença
//  de altitude entre o ponto e a célula do POWER (-0,65 °C por 100 m). Compara-se com a posição no relevo (TPI = altitude do
//  ponto − média da grade 7×7 a 500 m, Copernicus DEM 90 m). "Baixada" = TPI <= −10 m.
//  Resultado: inclinação (°C a cada 10 m de TPI), correlação, p-valor por permutação, e diferença média baixada × demais.
//  Hipótese do app a confirmar ou corrigir: baixada é cerca de 1 °C mais fria.
//
// Entrada: .cache/validacao/estacoes.json (scripts/validacao/fetch_estacoes.mjs)
// Saída: src/data/validacao_estacoes.json
import fs from "node:fs";
import path from "node:path";
import { CACHE, media, rng, salvarJson } from "./comum.mjs";
import { PARAMS_PADRAO as P } from "../../src/lib/engine/params.ts";

const LIMITE = P.limiteGeadaC; // 3 °C
const DATAS_SOJA = ["09-15", "09-20", "09-25", "10-01", "10-05", "10-10", "10-15", "10-20", "10-25", "10-30", "11-05", "11-10", "11-15", "11-20", "11-25", "11-30", "12-05", "12-10", "12-15"];
const PRINCIPAL = "10-20";
const TPI_BAIXADA = -10;
const LAPSE = -0.0065; // °C por metro

const { estacoes, baixadoEm } = JSON.parse(fs.readFileSync(path.join(CACHE, "estacoes.json"), "utf8"));
const DIA = 86_400_000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);

function correl(x, y) {
  const mx = media(x), my = media(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}
const r2 = (x) => Math.round(x * 100) / 100;
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

function tabela(pares) {
  // pares: [obs(bool), app(bool)]
  let a = 0, b = 0, c = 0, d = 0; // a = ambos, b = só app, c = só estação, d = nenhum
  for (const [o, s] of pares) {
    if (o && s) a++;
    else if (s) b++;
    else if (o) c++;
    else d++;
  }
  const n = a + b + c + d;
  const po = (a + d) / n;
  const pe = ((a + b) / n) * ((a + c) / n) + ((c + d) / n) * ((b + d) / n);
  return {
    n,
    ambos: a,
    soApp: b,
    soEstacao: c,
    nenhum: d,
    concordancia: pct(a + d, n),
    acerto: pct(a, a + c), // dos eventos medidos, quantos o app pegou
    alarmeFalso: pct(b, a + b), // dos eventos do app, quantos a estação não viu
    kappa: r2((po - pe) / (1 - pe)),
  };
}

// --- a) e b) diário
const difs = [], est = [], pow = [], difsFrio = [];
const diaFrio = [];
for (const s of estacoes)
  for (const [, [te, , tp]] of Object.entries(s.dias)) {
    if (te === null || tp === null) continue;
    difs.push(tp - te);
    est.push(te);
    pow.push(tp);
    if (te <= 8) difsFrio.push(tp - te);
    diaFrio.push([te <= LIMITE, tp <= LIMITE]);
  }
const diario = {
  dias: difs.length,
  vies: r2(media(difs)),
  erroMedio: r2(media(difs.map(Math.abs))),
  correlacao: r2(correl(est, pow)),
  viesDiasFrios: r2(media(difsFrio)),
  geada: tabela(diaFrio),
};

// --- c) e d) por safra
function janela(dataSoja, anoSafrinha) {
  const [m, d] = dataSoja.split("-").map(Number);
  const soja = Date.UTC(anoSafrinha - 1, m - 1, d);
  const milho = soja + (P.cicloSoja + P.intervalo) * DIA;
  return { ini: milho + P.faseCriticaInicio * DIA, fim: milho + P.faseCriticaFim * DIA };
}
function porSafra(dataSoja) {
  const geada = [], seca = [];
  const linhas = [];
  for (const s of estacoes) {
    for (let ano = 2017; ano <= new Date().getFullYear(); ano++) {
      const { ini, fim } = janela(dataSoja, ano);
      const dias = [];
      for (let t = ini; t <= fim; t += DIA) dias.push(s.dias[iso(t)] ?? [null, null, null, null]);
      const comTmin = dias.filter((x) => x[0] !== null && x[2] !== null).length;
      if (comTmin >= 0.9 * dias.length) {
        const o = dias.some((x) => x[0] !== null && x[0] <= LIMITE);
        const a = dias.some((x) => x[2] !== null && x[2] <= LIMITE);
        geada.push([o, a]);
        linhas.push({ id: s.id, ano, estacao: o, app: a });
      }
      const comChuva = dias.filter((x) => x[1] !== null && x[3] !== null).length;
      if (comChuva >= 0.95 * dias.length) {
        const veranico = (k) => {
          let seq = 0, max = 0;
          for (const x of dias) {
            seq = x[k] !== null && x[k] < P.chuvaDiaSecoMm ? seq + 1 : 0;
            max = Math.max(max, seq);
          }
          return max >= P.sequenciaSecaDias;
        };
        seca.push([veranico(1), veranico(3)]);
      }
    }
  }
  return { geada: tabela(geada), seca: tabela(seca), linhas };
}
const principal = porSafra(PRINCIPAL);
const todas = DATAS_SOJA.map((d) => ({ dataSoja: d, ...porSafra(d) }));
const todasGeada = tabela(todas.flatMap((x) => x.linhas.map((l) => [l.estacao, l.app])));

// --- Teste 2: baixada
const porEstacao = [];
for (const s of estacoes) {
  const frias = [];
  for (const [, [te, , tp]] of Object.entries(s.dias)) if (te !== null && tp !== null && tp <= 8) frias.push(te - tp);
  if (frias.length < 30 || s.elevPower === null || s.relevo?.ponto == null) continue;
  const ajusteAltitude = LAPSE * (s.relevo.ponto - s.elevPower); // quanto a altitude sozinha explica
  porEstacao.push({
    id: s.id,
    nome: s.nome,
    lat: s.lat,
    lon: s.lon,
    noites: frias.length,
    maisFria: r2(media(frias)), // estação − POWER nas noites frias (negativo = estação mais fria)
    maisFriaSemAltitude: r2(media(frias) - ajusteAltitude),
    tpi: s.relevo.tpi,
    altitude: s.relevo.ponto,
    altitudePower: s.elevPower,
  });
}
const x = porEstacao.map((e) => e.tpi), y = porEstacao.map((e) => e.maisFriaSemAltitude);
const inclinacao = (xs, ys) => {
  const mx = media(xs), my = media(ys);
  return xs.reduce((a, xi, i) => a + (xi - mx) * (ys[i] - my), 0) / xs.reduce((a, xi) => a + (xi - mx) ** 2, 0);
};
const b = inclinacao(x, y);
const R = rng(7);
let extremo = 0;
const N = 10000;
for (let k = 0; k < N; k++) {
  const ys = [...y].sort(() => R() - 0.5);
  if (Math.abs(inclinacao(x, ys)) >= Math.abs(b)) extremo++;
}
const baixadas = porEstacao.filter((e) => e.tpi <= TPI_BAIXADA);
const outras = porEstacao.filter((e) => e.tpi > TPI_BAIXADA);
const relevo = {
  estacoes: porEstacao.length,
  regraBaixadaTpiM: TPI_BAIXADA,
  inclinacaoCPor10m: r2(b * 10),
  correlacao: r2(correl(x, y)),
  p: Math.round(((extremo + 1) / (N + 1)) * 1000) / 1000,
  baixadas: baixadas.length,
  outras: outras.length,
  diferencaBaixadaC: baixadas.length && outras.length ? r2(media(baixadas.map((e) => e.maisFriaSemAltitude)) - media(outras.map((e) => e.maisFriaSemAltitude))) : null,
};

const resultado = {
  meta: {
    fonte: "Estações automáticas do INMET (cópia NOAA/NCEI Global Summary of the Day) × NASA POWER Daily (community AG); relevo Copernicus DEM 90 m (API de elevação do Open-Meteo)",
    baixadoEm,
    estacoes: estacoes.length,
    limiteGeadaC: LIMITE,
    dataPrincipal: PRINCIPAL,
    anos: [Math.min(...estacoes.flatMap((s) => Object.keys(s.dias).slice(0, 1).map((d) => +d.slice(0, 4)))), new Date().getFullYear()],
  },
  diario,
  safra: { principal: { geada: principal.geada, seca: principal.seca }, todasAsDatas: { geada: todasGeada } },
  relevo,
  porEstacao,
};
salvarJson("src/data/validacao_estacoes.json", resultado);
console.log(JSON.stringify({ diario, safraPrincipal: resultado.safra.principal, todasGeada, relevo }, null, 1));
