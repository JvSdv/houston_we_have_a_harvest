// Parâmetros do motor de risco do GroundTruth.
// Alinhados ao documento "GroundTruth — Metodologia e validação" (time, 14/11/2026).
//
// ⚠️ HIPÓTESES DE PARTIDA — A VALIDAR com agronomia / ZARC (MAPA) e com o caso de 2026.
// Ciclos variam com a cultivar, a região e o manejo. Não são recomendação técnica.

export interface EngineParams {
  /** Dias do plantio à colheita da soja. */
  cicloSoja: number;
  /** Dias entre a colheita da soja e o plantio do milho safrinha. */
  intervalo: number;
  /** Dias do plantio do milho até o florescimento (marcador na linha do tempo). */
  diasAteFlorescer: number;
  /** Fase crítica do milho safrinha (pendoamento e enchimento de grãos): início, em dias após o plantio. */
  faseCriticaInicio: number;
  /** Fase crítica do milho safrinha: fim, em dias após o plantio. */
  faseCriticaFim: number;
  /** Geada provável: T2M_MIN (ar a 2 m) <= este valor. Base: diferença abrigo–relva de 3–6 °C (Embrapa, UEL). */
  limiteGeadaC: number;
  /** Geada forte: T2M_MIN <= este valor. */
  limiteGeadaForteC: number;
  /** Em baixadas (acúmulo de ar frio), o limite de geada sobe este tanto. */
  ajusteBaixadaC: number;
  /** Abaixo deste valor (mm/dia) o dia conta como seco. */
  chuvaDiaSecoMm: number;
  /** Veranico: sequência mínima de dias secos. */
  sequenciaSecaDias: number;
  /** Percentil de GWETROOT (mesmas datas do ano) abaixo do qual o solo está seco. */
  percentilUmidadeSolo: number;
  /** Dias do plantio à colheita do milho safrinha (hipótese a validar). */
  cicloMilho: number;
  /** Semeadura do trigo depois da soja, "MM-DD" (hipótese: valor de exemplo; o ZARC define a janela real). */
  semeaduraTrigo: string;
  /** Dias do plantio à colheita do trigo (hipótese a validar). */
  cicloTrigo: number;
  /** Fase sensível do trigo (emborrachamento ao florescimento): dias após a semeadura (hipótese a validar). */
  espigamentoTrigoInicio: number;
  espigamentoTrigoFim: number;
  /** Até este número de dias sem cultura o campo conta como coberto (tolerância do intervalo de semeadura). */
  toleranciaCobertoDias: number;
  /** Mais dias sem cultura que isto = erosão Alta (Metodologia: "descoberto mais de 60 dias"). */
  limiteErosaoAltaDias: number;
  /** Chuva diária (mm) que conta como chuva forte, relevante para erosão (Metodologia: 50 mm). */
  chuvaForteMm: number;
}

export const PARAMS_PADRAO: EngineParams = {
  cicloSoja: 120,
  intervalo: 5,
  diasAteFlorescer: 65,
  faseCriticaInicio: 55,
  faseCriticaFim: 100,
  limiteGeadaC: 3,
  limiteGeadaForteC: 1,
  ajusteBaixadaC: 1,
  chuvaDiaSecoMm: 1,
  sequenciaSecaDias: 15,
  percentilUmidadeSolo: 20,
  cicloMilho: 135,
  semeaduraTrigo: "05-15",
  cicloTrigo: 130,
  espigamentoTrigoInicio: 70,
  espigamentoTrigoFim: 110,
  toleranciaCobertoDias: 15,
  limiteErosaoAltaDias: 60,
  chuvaForteMm: 50,
};

/** Datas de plantio da soja comparadas (dia/mês), no formato "MM-DD". */
export const DATAS_SOJA_PADRAO = ["10-01", "10-10", "10-20", "10-30", "11-10"] as const;
