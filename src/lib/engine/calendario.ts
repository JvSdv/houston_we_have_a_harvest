// Calendário do campo ao longo de um ano (da soja até a próxima soja) para as 3 rotações: funções puras, sem React.
//
// ⚠️ Ciclos do milho e do trigo e a data de semeadura do trigo são HIPÓTESES a validar com agronomia/ZARC.
// Cada linha cobre 365 dias a partir do plantio da soja; assume-se que a soja do ano seguinte é plantada na mesma data.
// Como os ciclos são fixos, a QUANTIDADE de dias sem cultura não muda com a data da soja; o que muda é EM QUAIS
// MESES o campo fica sem cultura (e quanto chove nesses meses).

import { PARAMS_PADRAO, type DadosDiarios, type EngineParams } from "./index.ts";

export type RotacaoId = "milho" | "trigo" | "milho-braquiaria";
export type TipoSegmento = "soja" | "milho" | "trigo" | "cobertura" | "descoberto";

/** Trecho da linha do ano, em dias desde o plantio da soja: [de, ate). */
export interface Segmento {
  tipo: TipoSegmento;
  de: number;
  ate: number;
}

export interface CalendarioRotacao {
  id: RotacaoId;
  segmentos: Segmento[];
  /** Dias do ano sem cultura e sem cobertura viva (só resíduo de palha). */
  diasDescoberto: number;
  /** Dias sem cultura em cada mês civil (índice 0 = janeiro). */
  diasPorMes: number[];
  /** Trigo: dias que a colheita passa da data de plantio da soja seguinte (0 = cabe no ano). */
  atrasoSojaDias: number;
}

export const DIAS_NO_ANO = 365;
const DIA_MS = 86_400_000;

/** Ano de referência sem 29/fev entre o plantio e o plantio seguinte (2025-09 a 2026-08 não tem bissexto). */
const ANO_REF = 2025;

function diaDoAno(mmdd: string, ano: number): number {
  const [m, d] = mmdd.split("-").map(Number);
  return Date.UTC(ano, m - 1, d);
}

/** Dias desde o plantio da soja até a próxima ocorrência de `mmdd` no ou depois do dia `aPartirDeDias`. */
function proximaData(plantioSoja: string, mmdd: string, aPartirDeDias: number): number {
  const base = diaDoAno(plantioSoja, ANO_REF);
  for (const ano of [ANO_REF, ANO_REF + 1, ANO_REF + 2]) {
    const off = Math.round((diaDoAno(mmdd, ano) - base) / DIA_MS);
    if (off >= aPartirDeDias) return off;
  }
  return aPartirDeDias;
}

const limitar = (x: number) => Math.min(Math.max(x, 0), DIAS_NO_ANO);

export function calendarioRotacao(
  id: RotacaoId,
  dataSoja: string,
  params: EngineParams = PARAMS_PADRAO,
): CalendarioRotacao {
  const colheitaSoja = params.cicloSoja;
  const inicioSegunda = colheitaSoja + params.intervalo;
  const segs: Segmento[] = [{ tipo: "soja", de: 0, ate: colheitaSoja }];
  let atraso = 0;

  const add = (tipo: TipoSegmento, de: number, ate: number) => {
    const a = limitar(de);
    const b = limitar(ate);
    if (b > a) segs.push({ tipo, de: a, ate: b });
  };

  if (id === "trigo") {
    const semeadura = proximaData(dataSoja, params.semeaduraTrigo, inicioSegunda);
    const colheita = semeadura + params.cicloTrigo;
    add("descoberto", colheitaSoja, semeadura);
    add("trigo", semeadura, colheita);
    add("descoberto", colheita, DIAS_NO_ANO);
    atraso = Math.max(0, colheita - DIAS_NO_ANO);
  } else {
    const colheita = inicioSegunda + params.cicloMilho;
    add("descoberto", colheitaSoja, inicioSegunda);
    add("milho", inicioSegunda, colheita);
    add(id === "milho-braquiaria" ? "cobertura" : "descoberto", colheita, DIAS_NO_ANO);
  }

  // dias sem cultura por mês civil
  const diasPorMes = Array<number>(12).fill(0);
  const base = diaDoAno(dataSoja, ANO_REF);
  let total = 0;
  for (const s of segs) {
    if (s.tipo !== "descoberto") continue;
    for (let dia = s.de; dia < s.ate; dia++) {
      diasPorMes[new Date(base + dia * DIA_MS).getUTCMonth()]++;
      total++;
    }
  }
  return { id, segmentos: segs, diasDescoberto: total, diasPorMes, atrasoSojaDias: atraso };
}

export const ROTACOES_IDS: readonly RotacaoId[] = ["milho", "trigo", "milho-braquiaria"];

export type NivelErosao = "Baixo" | "Médio" | "Alto";

/**
 * Nível de erosão pelos dias sem cultura (Metodologia): mais de `limiteErosaoAltaDias` = Alto; até a tolerância = Baixo;
 * entre os dois = Médio. NÃO considera declive (o SRTM ainda não classifica talhões) nem o mês da chuva.
 */
export function nivelErosaoPorDias(dias: number, params: EngineParams = PARAMS_PADRAO): NivelErosao {
  if (dias <= params.toleranciaCobertoDias) return "Baixo";
  if (dias <= params.limiteErosaoAltaDias) return "Médio";
  return "Alto";
}

export interface ChuvaDescoberta {
  /** Chuva média por ano nos dias sem cultura (mm). */
  mediaMm: number;
  /** Média de dias por ano com chuva >= chuvaForteMm dentro desses dias. */
  diasChuvaForteAno: number;
  /** Anos de plantio com dados completos nas janelas. */
  anos: number;
}

/**
 * Chuva (NASA POWER, PRECTOTCORR) nos dias em que o campo fica sem cultura, de todos os anos com dados completos.
 * Os dias são os dos segmentos "descoberto" do calendário, contados a partir do plantio da soja de cada ano.
 */
export function chuvaNaJanelaDescoberta(
  dados: DadosDiarios,
  dataSoja: string,
  cal: CalendarioRotacao,
  params: EngineParams = PARAMS_PADRAO,
): ChuvaDescoberta | null {
  const inicioSerie = Date.parse(`${dados.meta.start}T00:00:00Z`);
  const fimSerie = Date.parse(`${dados.meta.end}T00:00:00Z`);
  const chuva = dados.data.PRECTOTCORR;
  const janelas = cal.segmentos.filter((s) => s.tipo === "descoberto");
  if (!janelas.length) return null;
  const [m, d] = dataSoja.split("-").map(Number);
  const anoIni = new Date(inicioSerie).getUTCFullYear();
  const anoFim = new Date(fimSerie).getUTCFullYear();
  let somaMm = 0;
  let somaForte = 0;
  let anos = 0;
  for (let ano = anoIni; ano <= anoFim; ano++) {
    const plantio = Date.UTC(ano, m - 1, d);
    let total = 0;
    let forte = 0;
    let completo = true;
    for (const s of janelas) {
      for (let dia = s.de; dia < s.ate && completo; dia++) {
        const idx = Math.round((plantio + dia * DIA_MS - inicioSerie) / DIA_MS);
        const v = idx >= 0 && idx < chuva.length ? chuva[idx] : null;
        if (v === null || plantio + dia * DIA_MS > fimSerie) {
          completo = false;
          break;
        }
        total += v;
        if (v >= params.chuvaForteMm) forte++;
      }
      if (!completo) break;
    }
    if (!completo) continue;
    somaMm += total;
    somaForte += forte;
    anos++;
  }
  return anos
    ? { mediaMm: Math.round(somaMm / anos), diasChuvaForteAno: Math.round((somaForte / anos) * 100) / 100, anos }
    : null;
}
