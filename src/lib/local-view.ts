// Monta tudo que a tela precisa para UM local, a partir da série diária da NASA POWER.
// Módulo puro (sem importar arquivos de dados): roda no servidor (3 municípios pré-baixados)
// e no navegador (qualquer município, com dados baixados na hora).

import {
  PARAMS_PADRAO,
  riscoPorData,
  riscoGeadaTrigo,
  sensibilidadeTrigo,
  janelaTrigo,
  type SensibilidadeTrigo,
  restringirAnos,
  confianca,
  nivelRisco,
  type Nivel,
  type DadosDiarios,
  type EngineParams,
  type Confianca,
  type ResultadoRisco,
} from "./engine/index.ts";
import { FASES_ENSO, fasePorAno, type FaseEnso, type FiltroEnso, type IndiceEnso } from "./engine/enso.ts";
import {
  ROTACOES_IDS,
  calendarioRotacao,
  chuvaNaJanelaDescoberta,
  nivelErosaoPorDias,
  type ChuvaDescoberta,
  type NivelErosao,
  type RotacaoId,
  type Segmento,
} from "./engine/calendario.ts";

const DIA = 86_400_000;

export interface RiscoView {
  anosComEvento: number;
  totalAnos: number;
  frequencia: number;
  anos: number[];
  periodo: [number, number] | null;
  confianca: Confianca;
  nivel: Nivel;
  /** Só geada: anos com geada forte. */
  anosFortes?: number[];
  /** Só seca: anos por sinal. */
  detalheSeca?: { anosSoloSeco: number[]; anosVeranico: number[]; anosAmbos: number[] };
}

export interface ResultadosView {
  geada: RiscoView;
  geadaBaixada: RiscoView;
  seca: RiscoView;
}

/** Linha do ano de uma rotação: da soja até a próxima soja. */
export interface CampoView {
  segmentos: Segmento[];
  /** Dias do ano sem cultura e sem cobertura viva. */
  diasDescoberto: number;
  /** Dias sem cultura em cada mês civil (índice 0 = janeiro). */
  diasPorMes: number[];
  /** Erosão pelos dias sem cultura (regra da Metodologia; sem declive). */
  nivelErosao: NivelErosao;
  /** Trigo: dias que a colheita passa do plantio da soja seguinte. */
  atrasoSojaDias: number;
  /** Chuva do POWER nos dias sem cultura (média de todos os anos). */
  chuva: ChuvaDescoberta | null;
}

export interface DataView extends ResultadosView {
  /** "MM-DD" */
  dataSoja: string;
  colheitaSoja: string;
  plantioMilho: string;
  floracao: string;
  faseInicio: string;
  faseFim: string;
  /** Os mesmos resultados usando só os anos de cada fase do ENSO ("todos" = igual aos campos acima). */
  enso: Record<FiltroEnso, ResultadosView>;
  /** Anos (safrinha) de cada fase do ENSO para esta data de plantio. */
  anosPorFase: Record<FaseEnso, number[]>;
  /** Quando o campo fica sem cultura, por rotação. */
  campo: Record<RotacaoId, CampoView>;
}

export interface Prova2026 {
  disponivel: boolean;
  ultimaData: string;
  chuvaAbril2026: number | null;
  chuvaAbrilMedia: number;
  soloAbril2026: number | null;
  soloAbrilMedia: number;
  /** Posição de abril/2026 entre os abris de 1981–2026 (1 = mais seco). */
  soloAbrilRank: number | null;
  soloAbrilAnos: number;
  minMaio2026: number | null;
  minMaio2026Data: string | null;
  minJunho2026: number | null;
  minJunho2026Data: string | null;
  diasFrioMaioJunho2026: number | null;
}

export interface LocalView {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  elevacaoGradeM: number | null;
  periodoDados: { inicio: string; fim: string };
  downloadedAt: string;
  url: string;
  datas: DataView[];
  /** Época típica de geada (mediana do 1º e do último dia <= limite, 1981–2025), "MM-DD". */
  epocaGeada: { inicio: string; fim: string; anosComGeada: number; anosTotal: number } | null;
  prova2026: Prova2026;
  relevo: Relevo | null;
  /** Geada na fase sensível do trigo (independe da data da soja). */
  trigo: TrigoView;
  /** true = município escolhido pelo usuário, com dados da NASA POWER baixados na hora. */
  personalizado?: boolean;
}

export interface TrigoView {
  geada: RiscoView;
  geadaBaixada: RiscoView;
  /** Resultado por data de semeadura (mostra o quanto depende da hipótese). */
  sensibilidade: SensibilidadeTrigo[];
  sensibilidadeBaixada: SensibilidadeTrigo[];
  semeadura: string;
  /** Limite de geada forte (°C, no abrigo) e ajuste da baixada, para os textos. */
  limiteForteC: number;
  ajusteBaixadaC: number;
  janela: { inicio: string; fim: string };
  /** Menor mínima do ar na janela do trigo em 2026 (semeadura em 15/05 por padrão); null se a janela ainda não terminou nos dados. */
  minimaJanela2026: number | null;
}

export interface Relevo {
  /** true = valor estimado (SRTM indisponível no download); false = medido pelo SRTM. */
  estimado: boolean;
  fonte: string;
  fonteUrl: string | null;
  baixadoEm: string;
  pontoM: number | null;
  amostra: { pontos: number; espacamentoM: number; raioM: number; minM: number; maxM: number; mediaM: number } | null;
}

/** Datas de plantio da soja oferecidas na tela, a cada ~5 dias de 15/09 a 15/12 (inclui as 5 datas padrão do motor). */
function datasSoja(): string[] {
  return [
    "09-15", "09-20", "09-25", "10-01", "10-05", "10-10", "10-15", "10-20", "10-25", "10-30",
    "11-05", "11-10", "11-15", "11-20", "11-25", "11-30", "12-05", "12-10", "12-15",
  ];
}

const mmdd = (d: Date) => d.toISOString().slice(5, 10);
const r1 = (x: number) => Math.round(x * 10) / 10;

function serieComDatas(d: DadosDiarios) {
  const ini = Date.parse(`${d.meta.start}T00:00:00Z`);
  return (i: number) => new Date(ini + i * DIA);
}

function mediana(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function epocaGeada(d: DadosDiarios, limite: number): LocalView["epocaGeada"] {
  const dataDe = serieComDatas(d);
  const porAno = new Map<number, number[]>(); // dia do ano (desde 1/jan) com frio
  const anos = new Set<number>();
  d.data.T2M_MIN.forEach((v, i) => {
    const dt = dataDe(i);
    const y = dt.getUTCFullYear();
    if (y > 2025) return;
    anos.add(y);
    if (v === null || v > limite) return;
    const doy = Math.round((dt.getTime() - Date.UTC(y, 0, 1)) / DIA);
    if (!porAno.has(y)) porAno.set(y, []);
    porAno.get(y)!.push(doy);
  });
  if (porAno.size === 0) return null;
  const primeiros = [...porAno.values()].map((xs) => Math.min(...xs));
  const ultimos = [...porAno.values()].map((xs) => Math.max(...xs));
  const toMMDD = (doy: number) => mmdd(new Date(Date.UTC(2025, 0, 1) + Math.round(doy) * DIA));
  return {
    inicio: toMMDD(mediana(primeiros)),
    fim: toMMDD(mediana(ultimos)),
    anosComGeada: porAno.size,
    anosTotal: anos.size,
  };
}

function prova2026(d: DadosDiarios, limite: number): Prova2026 {
  const dataDe = serieComDatas(d);
  const chuvaAbril = new Map<number, { s: number; n: number }>();
  const soloAbril = new Map<number, { s: number; n: number }>();
  let minMaio: number | null = null;
  let minMaioData: string | null = null;
  let minJun: number | null = null;
  let minJunData: string | null = null;
  let diasFrio = 0;
  let temMaioJun = false;

  d.data.T2M_MIN.forEach((t, i) => {
    const dt = dataDe(i);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    if (m === 4) {
      const p = d.data.PRECTOTCORR[i];
      const g = d.data.GWETROOT[i];
      if (p !== null) {
        const a = chuvaAbril.get(y) ?? { s: 0, n: 0 };
        a.s += p;
        a.n++;
        chuvaAbril.set(y, a);
      }
      if (g !== null) {
        const a = soloAbril.get(y) ?? { s: 0, n: 0 };
        a.s += g;
        a.n++;
        soloAbril.set(y, a);
      }
    }
    if (y === 2026 && (m === 5 || m === 6) && t !== null) {
      temMaioJun = true;
      if (t <= limite) diasFrio++;
      if (m === 5 && (minMaio === null || t < minMaio)) {
        minMaio = t;
        minMaioData = dt.toISOString().slice(0, 10);
      }
      if (m === 6 && (minJun === null || t < minJun)) {
        minJun = t;
        minJunData = dt.toISOString().slice(0, 10);
      }
    }
  });

  const completos = (mp: Map<number, { s: number; n: number }>) =>
    [...mp.entries()].filter(([, v]) => v.n === 30);
  const histChuva = completos(chuvaAbril).filter(([y]) => y <= 2025);
  const histSolo = completos(soloAbril).filter(([y]) => y <= 2025);
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const c26 = chuvaAbril.get(2026);
  const s26 = soloAbril.get(2026);
  const solo26 = s26 && s26.n === 30 ? s26.s / 30 : null;
  const todosSolo = completos(soloAbril).map(([, v]) => v.s / v.n);
  const rank = solo26 === null ? null : todosSolo.filter((x) => x < solo26).length + 1;

  return {
    disponivel: !!c26 && c26.n === 30,
    ultimaData: d.meta.end,
    chuvaAbril2026: c26 && c26.n === 30 ? Math.round(c26.s) : null,
    chuvaAbrilMedia: Math.round(media(histChuva.map(([, v]) => v.s))),
    soloAbril2026: solo26 === null ? null : Math.round(solo26 * 100) / 100,
    soloAbrilMedia: Math.round(media(histSolo.map(([, v]) => v.s / v.n)) * 100) / 100,
    soloAbrilRank: rank,
    soloAbrilAnos: todosSolo.length,
    minMaio2026: minMaio === null ? null : r1(minMaio),
    minMaio2026Data: minMaioData,
    minJunho2026: minJun === null ? null : r1(minJun),
    minJunho2026Data: minJunData,
    diasFrioMaioJunho2026: temMaioJun ? diasFrio : null,
  };
}

export interface EntradaLocal {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  dados: DadosDiarios;
  relevo: Relevo | null;
  params?: EngineParams;
  /** Série RONI da NOAA, usada para classificar cada safra como El Niño, La Niña ou neutra. */
  indiceEnso: IndiceEnso;
  /** true = município escolhido pelo usuário (dados baixados na hora, fora dos 3 de demonstração). */
  personalizado?: boolean;
}

/** Calcula todos os resultados de um local (riscos por data de soja, ENSO, campo descoberto, trigo, 2026). */
export function buildLocalView(e: EntradaLocal): LocalView {
  const { id, dados, indiceEnso } = e;
  const params = e.params ?? PARAMS_PADRAO;
  const m = dados.meta as Record<string, unknown>;
  const riscos = riscoPorData(dados, params, datasSoja(), 2025);
  const view = (r: ResultadoRisco): RiscoView => ({
    anosComEvento: r.anosComEvento,
    totalAnos: r.totalAnos,
    frequencia: r.frequencia,
    anos: r.anosListados,
    ...(r.anosFortes ? { anosFortes: r.anosFortes } : {}),
    ...(r.detalheSeca ? { detalheSeca: r.detalheSeca } : {}),
    nivel: nivelRisco(r.frequencia),
    periodo: r.periodo,
    confianca: confianca(r.totalAnos),
  });
  return {
      id,
      nome: e.nome,
      lat: e.lat,
      lon: e.lon,
      elevacaoGradeM: typeof m.gridElevationM === "number" ? Math.round(m.gridElevationM) : null,
      periodoDados: { inicio: dados.meta.start, fim: dados.meta.end },
      downloadedAt: String(m.downloadedAt),
      url: String(m.url),
      datas: riscos.map((r): DataView => {
        // Fase do ENSO de cada safrinha avaliada para esta data de plantio (RONI, trimestre do meio da fase crítica).
        const mapa = fasePorAno(
          indiceEnso,
          r.dataSoja,
          r.geada.porAno.map((a) => a.ano),
          params,
        );
        const anosPorFase = Object.fromEntries(
          FASES_ENSO.map((f) => [f, [...mapa].filter(([, fase]) => fase === f).map(([ano]) => ano)]),
        ) as Record<FaseEnso, number[]>;
        const resultados = (anos?: ReadonlySet<number>): ResultadosView =>
          anos
            ? {
                geada: view(restringirAnos(r.geada, anos)),
                geadaBaixada: view(restringirAnos(r.geadaBaixada, anos)),
                seca: view(restringirAnos(r.seca, anos)),
              }
            : { geada: view(r.geada), geadaBaixada: view(r.geadaBaixada), seca: view(r.seca) };
        const todos = resultados();
        const campo = Object.fromEntries(
          ROTACOES_IDS.map((rid) => {
            const cal = calendarioRotacao(rid, r.dataSoja, params);
            const v: CampoView = {
              segmentos: cal.segmentos,
              diasDescoberto: cal.diasDescoberto,
              diasPorMes: cal.diasPorMes,
              nivelErosao: nivelErosaoPorDias(cal.diasDescoberto, params),
              atrasoSojaDias: cal.atrasoSojaDias,
              chuva: chuvaNaJanelaDescoberta(dados, r.dataSoja, cal, params),
            };
            return [rid, v];
          }),
        ) as Record<RotacaoId, CampoView>;
        return {
          dataSoja: r.dataSoja,
          colheitaSoja: mmdd(r.cronograma.colheitaSoja),
          plantioMilho: mmdd(r.cronograma.plantioMilho),
          floracao: mmdd(r.cronograma.floracaoMilho),
          faseInicio: mmdd(r.cronograma.faseInicio),
          faseFim: mmdd(r.cronograma.faseFim),
          ...todos,
          anosPorFase,
          campo,
          enso: {
            todos,
            "el-nino": resultados(new Set(anosPorFase["el-nino"])),
            "la-nina": resultados(new Set(anosPorFase["la-nina"])),
            neutro: resultados(new Set(anosPorFase.neutro)),
          },
        };
      }),
      epocaGeada: epocaGeada(dados, params.limiteGeadaC),
      prova2026: prova2026(dados, params.limiteGeadaC),
      relevo: e.relevo,
      ...(e.personalizado ? { personalizado: true } : {}),
      trigo: (() => {
        const g = riscoGeadaTrigo(dados, params, false);
        const gb = riscoGeadaTrigo(dados, params, true);
        return {
          geada: view(g),
          geadaBaixada: view(gb),
          sensibilidade: sensibilidadeTrigo(dados, params, false),
          sensibilidadeBaixada: sensibilidadeTrigo(dados, params, true),
          semeadura: params.semeaduraTrigo,
          limiteForteC: params.limiteGeadaForteC,
          ajusteBaixadaC: params.ajusteBaixadaC,
          janela: janelaTrigo(params),
          minimaJanela2026: g.porAno.find((a) => a.ano === 2026)?.valor ?? null,
        } satisfies TrigoView;
      })(),
    } satisfies LocalView;
}
