// Fase do ENSO (El Niño / La Niña / Neutro) de cada safrinha: funções puras, sem React.
//
// Índice: RONI da NOAA (índice oficial de monitoramento do ENSO, NWS PIS 26-05); o ONI antigo (ERSST v5) fica
// no arquivo só para referência. Regra simplificada da Metodologia do time: em cada temporada de 3 meses,
// El Niño se o índice >= +0,5, La Niña se <= -0,5, Neutro entre os dois. A NOAA usa 5 temporadas seguidas
// para declarar um episódio histórico; aqui classificamos a temporada que cobre a fase crítica do milho.

import { cronograma, PARAMS_PADRAO, type EngineParams } from "./index.ts";

export type FaseEnso = "el-nino" | "la-nina" | "neutro";
export type FiltroEnso = "todos" | FaseEnso;
export const FASES_ENSO: readonly FaseEnso[] = ["el-nino", "la-nina", "neutro"];

/** Limite de classificação (°C de anomalia). */
export const LIMITE_ENSO = 0.5;

/** Trimestre cujo mês central é o mês dado (1 = jan → DJF, ..., 12 = dez → NDJ). */
const TRIMESTRES = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"];
export const trimestreDoMes = (mes: number): string => TRIMESTRES[mes - 1];

/** Índice por trimestre e ano, ex.: { "AMJ1997": 0.83 }. */
export type IndiceEnso = Record<string, number>;

export function faseEnso(anomalia: number | undefined): FaseEnso | null {
  if (anomalia === undefined || !Number.isFinite(anomalia)) return null;
  if (anomalia >= LIMITE_ENSO) return "el-nino";
  if (anomalia <= -LIMITE_ENSO) return "la-nina";
  return "neutro";
}

/** Fase do ENSO no trimestre centrado no mês `mes` do ano `ano`. `null` se o índice não tem esse trimestre. */
export function faseDoMes(indice: IndiceEnso, ano: number, mes: number): FaseEnso | null {
  return faseEnso(indice[`${trimestreDoMes(mes)}${ano}`]);
}

/**
 * Meio da fase crítica do milho para uma data de plantio da soja ("MM-DD") cuja fase cai no ano `anoFase`.
 * Retorna o ano e o mês desse ponto médio (usados para escolher o trimestre do índice).
 */
export function meioDaFase(
  dataSoja: string,
  anoFase: number,
  params: EngineParams = PARAMS_PADRAO,
): { ano: number; mes: number } | null {
  const [mm, dd] = dataSoja.split("-").map(Number);
  for (const anoPlantio of [anoFase - 1, anoFase]) {
    const c = cronograma(new Date(Date.UTC(anoPlantio, mm - 1, dd)), params);
    if (c.faseInicio.getUTCFullYear() !== anoFase) continue;
    const meio = new Date((c.faseInicio.getTime() + c.faseFim.getTime()) / 2);
    return { ano: meio.getUTCFullYear(), mes: meio.getUTCMonth() + 1 };
  }
  return null;
}

/** Fase do ENSO de cada ano de fase crítica para uma data de plantio. Anos sem índice ficam fora do mapa. */
export function fasePorAno(
  indice: IndiceEnso,
  dataSoja: string,
  anos: readonly number[],
  params: EngineParams = PARAMS_PADRAO,
): Map<number, FaseEnso> {
  const out = new Map<number, FaseEnso>();
  for (const ano of anos) {
    const m = meioDaFase(dataSoja, ano, params);
    if (!m) continue;
    const f = faseDoMes(indice, m.ano, m.mes);
    if (f) out.set(ano, f);
  }
  return out;
}

/** Último trimestre disponível no índice (para mostrar o valor mais recente da NOAA). */
export function ultimoTrimestre(indice: IndiceEnso): { trimestre: string; ano: number; valor: number; fase: FaseEnso } | null {
  const chaves = Object.keys(indice);
  if (!chaves.length) return null;
  const k = chaves[chaves.length - 1];
  const fase = faseEnso(indice[k]);
  return fase ? { trimestre: k.slice(0, 3), ano: Number(k.slice(3)), valor: indice[k], fase } : null;
}
