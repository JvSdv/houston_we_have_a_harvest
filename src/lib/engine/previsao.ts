// Avaliação da previsão de 16 dias (Open-Meteo) para o plantio da soja: funções puras, sem React.
//
// ⚠️ Os limites abaixo são HIPÓTESES a validar com agronomia. Previsão não é garantia: depois de ~7 dias
// a incerteza cresce muito. Isto apoia a conversa com o técnico; não substitui o ZARC nem o vazio sanitário.

export interface PrevisaoDiaria {
  time: string[]; // "YYYY-MM-DD"
  temperature_2m_min: (number | null)[];
  temperature_2m_max: (number | null)[];
  precipitation_sum: (number | null)[];
}

export interface ParamsPrevisao {
  /** Quantos dias à frente contam como "esta semana". */
  diasSemana: number;
  /** Mínima do ar a 2 m <= este valor = risco de geada sobre a soja recém-emergida. */
  limiteGeadaC: number;
  /** Chuva diária igual ou acima disto (mm) = campo encharcado / erosão (valor citado na Metodologia). */
  chuvaForteMm: number;
  /** Chuva total da semana abaixo disto (mm) = pouca umidade para a soja germinar. */
  chuvaMinSemanaMm: number;
}

export const PARAMS_PREVISAO: ParamsPrevisao = {
  diasSemana: 7,
  limiteGeadaC: 3,
  chuvaForteMm: 50,
  chuvaMinSemanaMm: 10,
};

export type NivelAlerta = "nao-plantar" | "atencao" | "sem-alerta";

export interface EventoPrevisao {
  tipo: "geada" | "chuva-forte";
  /** "YYYY-MM-DD" */
  data: string;
  valor: number;
  /** Índice do dia (0 = hoje). */
  dia: number;
}

export interface AvaliacaoPrevisao {
  nivel: NivelAlerta;
  titulo: string;
  mensagens: string[];
  eventos: EventoPrevisao[];
  chuvaSemanaMm: number | null;
  diasAvaliados: number;
}

export type Idioma = "pt" | "en";

const MESES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtData = (iso: string, l: Idioma) =>
  l === "en" ? `${MESES_EN[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}` : `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const fmtN = (x: number, l: Idioma, max = 1) =>
  x.toLocaleString(l === "en" ? "en-US" : "pt-BR", { maximumFractionDigits: max });

/**
 * Regras (hipóteses a validar):
 *  - geada (mínima <= limite) ou chuva forte (>= chuvaForteMm) nos primeiros `diasSemana` dias → "Não plante esta semana";
 *  - semana com chuva total < chuvaMinSemanaMm → "Atenção" (pouca umidade);
 *  - os mesmos eventos depois da primeira semana → "Atenção" (acompanhe, a previsão ainda muda).
 * Em baixada, o limite de geada sobe `ajusteBaixadaC`.
 */
export function avaliarPrevisao(
  p: PrevisaoDiaria,
  params: ParamsPrevisao = PARAMS_PREVISAO,
  ajusteBaixadaC = 0,
  idioma: Idioma = "pt",
): AvaliacaoPrevisao {
  const t = (pt: string, en: string) => (idioma === "en" ? en : pt);
  const n = Math.min(p.time.length, p.temperature_2m_min.length, p.precipitation_sum.length);
  const limite = params.limiteGeadaC + ajusteBaixadaC;
  const eventos: EventoPrevisao[] = [];
  let chuvaSemana = 0;
  let diasComChuva = 0;

  for (let i = 0; i < n; i++) {
    const tmin = p.temperature_2m_min[i];
    const chuva = p.precipitation_sum[i];
    if (tmin !== null && tmin <= limite) eventos.push({ tipo: "geada", data: p.time[i], valor: tmin, dia: i });
    if (chuva !== null && chuva >= params.chuvaForteMm)
      eventos.push({ tipo: "chuva-forte", data: p.time[i], valor: chuva, dia: i });
    if (i < params.diasSemana && chuva !== null) {
      chuvaSemana += chuva;
      diasComChuva++;
    }
  }

  const naSemana = eventos.filter((e) => e.dia < params.diasSemana);
  const depois = eventos.filter((e) => e.dia >= params.diasSemana);
  const semanaSeca = diasComChuva >= params.diasSemana && chuvaSemana < params.chuvaMinSemanaMm;
  const txt = (e: EventoPrevisao) =>
    e.tipo === "geada"
      ? t(
          `geada prevista em ${fmtData(e.data, idioma)} (mínima ${fmtN(e.valor, idioma)} °C, limite ${limite} °C)`,
          `frost forecast on ${fmtData(e.data, idioma)} (minimum ${fmtN(e.valor, idioma)} °C, limit ${limite} °C)`,
        )
      : t(
          `chuva forte em ${fmtData(e.data, idioma)} (${fmtN(e.valor, idioma)} mm)`,
          `heavy rain on ${fmtData(e.data, idioma)} (${fmtN(e.valor, idioma)} mm)`,
        );

  const mensagens: string[] = [];
  naSemana.forEach((e) => mensagens.push(t(`Nesta semana: ${txt(e)}.`, `This week: ${txt(e)}.`)));
  if (semanaSeca)
    mensagens.push(
      t(
        `Semana seca: ${fmtN(chuvaSemana, idioma)} mm previstos em ${params.diasSemana} dias (abaixo de ${params.chuvaMinSemanaMm} mm). Pouca umidade para a soja germinar.`,
        `Dry week: ${fmtN(chuvaSemana, idioma)} mm forecast in ${params.diasSemana} days (below ${params.chuvaMinSemanaMm} mm). Little moisture for soybean to germinate.`,
      ),
    );
  depois.forEach((e) =>
    mensagens.push(t(`Mais adiante: ${txt(e)}. A previsão ainda pode mudar.`, `Later on: ${txt(e)}. The forecast may still change.`)),
  );

  let nivel: NivelAlerta = "sem-alerta";
  let titulo = t(`Sem alerta nos próximos ${params.diasSemana} dias`, `No alert in the next ${params.diasSemana} days`);
  if (naSemana.length > 0) {
    nivel = "nao-plantar";
    titulo = t("Não plante esta semana", "Do not plant this week");
  } else if (semanaSeca || depois.length > 0) {
    nivel = "atencao";
    titulo = semanaSeca
      ? t("Atenção: semana seca", "Caution: dry week")
      : t("Atenção nas próximas semanas", "Caution in the coming weeks");
  }
  if (mensagens.length === 0)
    mensagens.push(t("Nenhum dos eventos monitorados aparece na previsão.", "None of the monitored events appear in the forecast."));

  return {
    nivel,
    titulo,
    mensagens,
    eventos,
    chuvaSemanaMm: diasComChuva ? Math.round(chuvaSemana * 10) / 10 : null,
    diasAvaliados: n,
  };
}
