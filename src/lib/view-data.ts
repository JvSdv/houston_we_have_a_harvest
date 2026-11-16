// Prepara, no servidor (em tempo de build), tudo que a tela principal precisa para os 3 municípios de demonstração.
// Só usa dados reais da NASA POWER + o motor em src/lib/engine. O cálculo de cada local fica em local-view.ts
// (módulo puro), que o navegador também usa para qualquer outro município.

import pb from "@/data/power_daily_pato-branco.json";
import cv from "@/data/power_daily_cascavel.json";
import fb from "@/data/power_daily_francisco-beltrao.json";
import srtm from "@/data/srtm_relief.json";
import ensoData from "@/data/enso.json";
import backtestIbge from "@/data/backtest_ibge.json";
import { PARAMS_PADRAO, type DadosDiarios, type EngineParams } from "@/lib/engine/index.ts";
import { ultimoTrimestre, type FaseEnso, type IndiceEnso } from "@/lib/engine/enso.ts";
import { buildLocalView, type LocalView, type Relevo } from "@/lib/local-view.ts";

export type {
  RiscoView,
  ResultadosView,
  CampoView,
  DataView,
  Prova2026,
  LocalView,
  TrigoView,
  Relevo,
} from "@/lib/local-view.ts";

export interface EnsoInfo {
  /** Índice usado na classificação. */
  indice: "RONI";
  url: string;
  baixadoEm: string;
  atualizadoPelaNoaaEm: string | null;
  /** Valor mais recente publicado pela NOAA (informativo; não é previsão). */
  ultimo: { trimestre: string; ano: number; valor: number; fase: FaseEnso } | null;
}

export interface TesteIbge {
  nMarc: number;
  nNao: number;
  mMarc: number;
  mNao: number;
  d: number;
  p: number;
}

/** Teste retrospectivo com o IBGE (PAM): resultados de src/data/backtest_ibge.json, gerado por scripts/backtest_ibge.mjs. */
export interface BacktestView {
  baixadoEm: string;
  minAreaHa: number;
  /** Data principal da soja do teste, "MM-DD". */
  dataPrincipal: string;
  total: number;
  principal: { qualquer: TesteIbge; geada: TesteIbge; seca: TesteIbge };
  testes: number;
  significativos: number;
  esperadosPorAcaso: number;
}

export interface ViewData {
  params: EngineParams;
  locais: LocalView[];
  enso: EnsoInfo;
  backtest: BacktestView;
  /** Série RONI (NOAA) para o navegador classificar as safras de qualquer município. */
  indiceEnso: IndiceEnso;
}

function backtestView(): BacktestView {
  const b = backtestIbge as unknown as {
    meta: { baixadoEm: string; minAreaHa: number; dataPrincipal: string; anosPorMunicipio: Record<string, number> };
    porData: Record<string, Record<"qualquer" | "geada" | "seca", TesteIbge>>;
  };
  const todos = Object.values(b.porData).flatMap((x) => Object.values(x));
  return {
    baixadoEm: b.meta.baixadoEm,
    minAreaHa: b.meta.minAreaHa,
    dataPrincipal: b.meta.dataPrincipal,
    total: Object.values(b.meta.anosPorMunicipio).reduce((a, c) => a + c, 0),
    principal: b.porData[b.meta.dataPrincipal],
    testes: todos.length,
    significativos: todos.filter((x) => x.p < 0.05).length,
    esperadosPorAcaso: todos.length * 0.05,
  };
}

const FONTES: { id: string; dados: DadosDiarios }[] = [
  { id: "pato-branco", dados: pb as unknown as DadosDiarios },
  { id: "cascavel", dados: cv as unknown as DadosDiarios },
  { id: "francisco-beltrao", dados: fb as unknown as DadosDiarios },
];

function relevoDe(id: string): Relevo | null {
  const r = (srtm as unknown as Record<string, Record<string, unknown>>)[id];
  if (!r) return null;
  return {
    estimado: Boolean(r.estimado),
    fonte: String(r.fonte),
    fonteUrl: typeof r.fonteUrl === "string" ? r.fonteUrl : null,
    baixadoEm: String(r.baixadoEm),
    pontoM: typeof r.pontoM === "number" ? r.pontoM : null,
    amostra: (r.amostra as Relevo["amostra"]) ?? null,
  };
}

export function buildViewData(params: EngineParams = PARAMS_PADRAO): ViewData {
  const indiceEnso = (ensoData as unknown as { roni: IndiceEnso }).roni;
  const metaEnso = (ensoData as unknown as { meta: { baixadoEm: string; fontes: { roni: { url: string; atualizadoPelaNoaaEm: string | null } } } }).meta;
  const locais = FONTES.map(({ id, dados }) => {
    const m = dados.meta as Record<string, unknown>;
    return buildLocalView({
      id,
      nome: String(m.name),
      lat: Number(m.lat),
      lon: Number(m.lon),
      dados,
      relevo: relevoDe(id),
      params,
      indiceEnso,
    });
  });
  return {
    params,
    locais,
    backtest: backtestView(),
    indiceEnso,
    enso: {
      indice: "RONI",
      url: metaEnso.fontes.roni.url,
      baixadoEm: metaEnso.baixadoEm,
      atualizadoPelaNoaaEm: metaEnso.fontes.roni.atualizadoPelaNoaaEm,
      ultimo: ultimoTrimestre(indiceEnso),
    },
  };
}
