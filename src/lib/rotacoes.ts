// Comparação das 3 rotações (exigência do desafio Field Shift).
// Regras: documento "GroundTruth — Metodologia e validação" — cada rotação recebe um NÍVEL por critério,
// sem nota única escondida; as prioridades do agricultor mudam a ORDEM e o destaque, não os números de risco.
//
// ⚠️ Textos agronômicos e níveis das prioridades são QUALITATIVOS e A VALIDAR COM TÉCNICO.
// Só o risco climático do milho vem de cálculo (motor + NASA POWER).
// Todos os textos existem em português (pt) e inglês (en).

export type Prioridade = "agua" | "forragem" | "nitrogenio" | "erosao" | "materiaOrganica" | "mercado";

export const PRIORIDADES: { id: Prioridade; pt: string; en: string }[] = [
  { id: "agua", pt: "Água no solo", en: "Soil water" },
  { id: "forragem", pt: "Forragem", en: "Forage" },
  { id: "nitrogenio", pt: "Nitrogênio", en: "Nitrogen" },
  { id: "erosao", pt: "Menos erosão", en: "Less erosion" },
  { id: "materiaOrganica", pt: "Matéria orgânica", en: "Organic matter" },
  { id: "mercado", pt: "Mercado / renda", en: "Market / income" },
];

/** Quanto a rotação atende cada prioridade: 1 = pouco, 2 = médio, 3 = bem. Qualitativo, a validar. */
export type Atende = 1 | 2 | 3;

export interface TextosRotacao {
  nome: string;
  rotulo: string;
  /** Para rotações sem cálculo: texto do risco climático qualitativo. */
  riscoQualitativo?: string;
  soloDescoberto: string;
  justificativa: string;
  evidencia: string[];
  beneficios: string[];
  riscos: string[];
  lacunas: string[];
}

export interface Rotacao {
  id: "milho" | "trigo" | "milho-braquiaria";
  /** Usa o risco calculado do milho safrinha (geada e seca na fase crítica)? */
  riscoCalculado: boolean;
  atende: Record<Prioridade, Atende>;
  pt: TextosRotacao;
  en: TextosRotacao;
}

export const ROTACOES: Rotacao[] = [
  {
    id: "milho",
    riscoCalculado: true,
    atende: { agua: 1, forragem: 1, nitrogenio: 1, erosao: 1, materiaOrganica: 2, mercado: 3 },
    pt: {
      nome: "Soja → milho safrinha",
      rotulo: "Atual",
      soloDescoberto: "Da colheita do milho (inverno) até a soja: solo pode ficar com pouca palha.",
      justificativa: "É o sistema mais comum na região: duas safras de grãos por ano na mesma área.",
      evidencia: [
        "Risco de geada e seca na floração e enchimento do milho calculado com os dados diários da NASA POWER desde 1981.",
        "Deral (mai/2026): geadas queimaram folhas do milho safrinha em baixadas.",
      ],
      beneficios: ["Maior potencial de renda com grãos.", "Mercado e logística já conhecidos."],
      riscos: [
        "Geada no pendoamento e enchimento quando a soja é plantada tarde.",
        "Veranico com solo seco na floração e enchimento.",
        "Pouca cobertura do solo depois da colheita.",
      ],
      lacunas: ["Cultivar e ciclo reais do milho", "Adubação", "Preço do milho na época", "Janela do ZARC"],
    },
    en: {
      nome: "Soybean → second-crop corn",
      rotulo: "Current",
      soloDescoberto: "From the corn harvest (winter) until soybean: the soil may be left with little straw.",
      justificativa: "The most common system in the region: two grain crops a year on the same field.",
      evidencia: [
        "Frost and drought risk in the critical stage computed from NASA POWER daily data since 1981.",
        "Deral (May 2026): frosts burned second-crop corn leaves in lowlands.",
      ],
      beneficios: ["Highest income potential from grain.", "Market and logistics already known."],
      riscos: [
        "Frost at tasseling and grain fill when soybean is planted late.",
        "Dry spell with dry soil in the critical stage.",
        "Little soil cover after harvest.",
      ],
      lacunas: ["Actual corn cultivar and cycle", "Fertilization", "Corn price at the time", "ZARC planting window"],
    },
  },
  {
    id: "trigo",
    riscoCalculado: false,
    atende: { agua: 2, forragem: 2, nitrogenio: 1, erosao: 2, materiaOrganica: 2, mercado: 2 },
    pt: {
      nome: "Soja → trigo",
      rotulo: "Adaptação térmica",
      riscoQualitativo:
        "Não calculado no app (fase sensível do trigo é o espigamento, 70–110 dias). Deral (mai/2026): o trigo não teve dano significativo com as geadas que atingiram o milho.",
      soloDescoberto: "Coberto no inverno, com o trigo; sem cultura da colheita da soja até a semeadura do trigo e entre o trigo e a próxima soja.",
      justificativa:
        "Trocar o milho safrinha por um cereal de inverno onde a geada na floração e enchimento do milho é frequente (por exemplo, em baixadas).",
      evidencia: [
        "Deral (mai/2026): com as mesmas geadas, o trigo (ainda vegetativo) não teve dano significativo.",
        "Geada no espigamento do trigo calculada com a NASA POWER para uma semeadura fixa (hipótese); a seca do trigo não é calculada.",
      ],
      beneficios: [
        "Tolera melhor o frio na fase vegetativa.",
        "Cobertura do solo no inverno.",
        "Quebra o ciclo de pragas do milho.",
      ],
      riscos: [
        "Geada no espigamento e chuva na colheita também causam perdas no trigo.",
        "Renda costuma ser menor e mais dependente de preço.",
      ],
      lacunas: ["Cultivar de trigo e época de semeadura (ZARC)", "Preço e liquidez do trigo", "Doenças no inverno úmido"],
    },
    en: {
      nome: "Soybean → wheat",
      rotulo: "Thermal adaptation",
      riscoQualitativo:
        "Not computed in the app (wheat's sensitive stage is heading, 70–110 days). Deral (May 2026): wheat had no significant damage from the frosts that hit corn.",
      soloDescoberto: "Covered in winter by the wheat; no crop from the soybean harvest until wheat sowing, and between wheat and the next soybean.",
      justificativa:
        "Replace second-crop corn with a winter cereal where frost in corn's critical stage is frequent (for example, in lowlands).",
      evidencia: [
        "Deral (May 2026): with the same frosts, wheat (still vegetative) had no significant damage.",
        "Frost at wheat heading is computed from NASA POWER for a fixed sowing date (hypothesis); wheat drought is not computed.",
      ],
      beneficios: [
        "Tolerates cold better in the vegetative stage.",
        "Winter soil cover.",
        "Breaks the corn pest cycle.",
      ],
      riscos: [
        "Frost at heading and rain at harvest also cause wheat losses.",
        "Income is usually lower and more price-dependent.",
      ],
      lacunas: ["Wheat cultivar and sowing date (ZARC)", "Wheat price and liquidity", "Diseases in a wet winter"],
    },
  },
  {
    id: "milho-braquiaria",
    riscoCalculado: true,
    atende: { agua: 3, forragem: 3, nitrogenio: 1, erosao: 3, materiaOrganica: 3, mercado: 2 },
    pt: {
      nome: "Soja → milho + braquiária",
      rotulo: "Solo e resiliência hídrica",
      soloDescoberto: "Braquiária mantém o solo coberto depois do milho até a dessecação para a soja.",
      justificativa:
        "Semear braquiária junto com o milho safrinha para manter o solo coberto e formar palha para a próxima soja.",
      evidencia: [
        "O milho continua exposto ao mesmo risco de geada e seca calculado com a NASA POWER.",
        "Consórcio milho–braquiária é técnica difundida pela pesquisa agropecuária brasileira (a validar para a sua área).",
      ],
      beneficios: [
        "Mais palha e cobertura: menos erosão e menos perda de umidade.",
        "Raízes ajudam a estrutura do solo.",
        "Pode servir de pasto no inverno.",
      ],
      riscos: [
        "Mesmo risco climático do milho.",
        "Competição com o milho se o manejo falhar.",
        "Exige dessecação bem-feita antes da soja.",
      ],
      lacunas: [
        "Espécie e dose de semente da braquiária",
        "Manejo de herbicida",
        "Efeito real na produtividade da soja seguinte",
      ],
    },
    en: {
      nome: "Soybean → corn + brachiaria",
      rotulo: "Soil and water resilience",
      soloDescoberto: "Brachiaria keeps the soil covered after corn until it is desiccated before soybean.",
      justificativa:
        "Sow brachiaria (a tropical forage grass) together with second-crop corn to keep the soil covered and build straw for the next soybean.",
      evidencia: [
        "Corn is still exposed to the same frost and drought risk computed from NASA POWER.",
        "Corn–brachiaria intercropping is a technique widely promoted by Brazilian agricultural research (to be validated for your area).",
      ],
      beneficios: [
        "More straw and cover: less erosion and less moisture loss.",
        "Roots help soil structure.",
        "Can serve as winter pasture.",
      ],
      riscos: [
        "Same climate risk as corn.",
        "Competition with corn if management fails.",
        "Requires well-done desiccation before soybean.",
      ],
      lacunas: [
        "Brachiaria species and seed rate",
        "Herbicide management",
        "Real effect on the following soybean yield",
      ],
    },
  },
];

export const NOTA_NITROGENIO = {
  pt: "Nenhuma das 3 rotações inclui leguminosa de inverno; para nitrogênio, avaliar com o técnico uma opção como ervilhaca ou tremoço.",
  en: "None of the 3 rotations includes a winter legume; for nitrogen, discuss an option such as vetch or lupin with the technician.",
};

export const REGRA_ORDEM = {
  pt:
    "Ordem: rotações que você consegue fazer primeiro; depois, soma de quanto cada uma atende ao que pesa mais para você (1 = pouco, 3 = bem; qualitativo). " +
    "Empate: menor risco climático primeiro (o trigo fica neutro: seu risco depende da data de semeadura, que é hipótese). As prioridades não mudam os números de risco. " +
    "Nível de risco (Metodologia): Baixo até 10% dos anos, Médio 20 a 30%, Alto 40% ou mais.",
  en:
    "Order: rotations you can do first; then the sum of how well each meets what matters most to you (1 = little, 3 = well; qualitative). " +
    "Ties: lower climate risk first (wheat stays neutral: its risk depends on the sowing date, which is a hypothesis). Priorities never change the risk numbers. " +
    "Risk level (methodology): Low up to 10% of years, Medium 20–30%, High 40% or more.",
};

// ---------------------------------------------------------------------------------------------
// "Seu campo": o que pesa mais para o agricultor e o que ele NÃO consegue fazer.
// Só muda a ORDEM e as etiquetas; os números de risco (geada, seca, dias sem cultura) nunca mudam.
// Quais prioridades cada foco aplica é uma decisão QUALITATIVA, a validar com técnico.
// ---------------------------------------------------------------------------------------------

export type Foco = "renda" | "solo-agua" | "equilibrio";

export const FOCOS: { id: Foco; pt: string; en: string; prioridades: Prioridade[] }[] = [
  { id: "renda", pt: "Renda", en: "Income", prioridades: ["mercado"] },
  {
    id: "solo-agua",
    pt: "Proteger o solo e a água",
    en: "Protect soil and water",
    prioridades: ["agua", "erosao", "materiaOrganica"],
  },
  {
    id: "equilibrio",
    pt: "Equilíbrio",
    en: "Balance",
    prioridades: ["agua", "erosao", "materiaOrganica", "mercado"],
  },
];

export type Restricao = "semTrigo" | "semBraquiaria" | "poucaAgua";

export const RESTRICOES: { id: Restricao; pt: string; en: string }[] = [
  { id: "semTrigo", pt: "Plantar trigo (sem máquina ou comprador)", en: "Grow wheat (no machinery or buyer)" },
  { id: "semBraquiaria", pt: "Manejar braquiária", en: "Manage brachiaria" },
  { id: "poucaAgua", pt: "Pouca água disponível", en: "Little water available" },
];

/** Qual rotação cada restrição de "não consigo fazer" tira de cena (poucaAgua não tira nenhuma). */
export const RESTRICAO_BLOQUEIA: Partial<Record<Restricao, Rotacao["id"]>> = {
  semTrigo: "trigo",
  semBraquiaria: "milho-braquiaria",
};

export const MOTIVO_BLOQUEIO: Record<"semTrigo" | "semBraquiaria", { pt: string; en: string }> = {
  semTrigo: { pt: "sem máquina ou comprador de trigo", en: "no wheat machinery or buyer" },
  semBraquiaria: { pt: "sem como manejar a braquiária", en: "no way to manage brachiaria" },
};

/** Prioridades efetivas: as do foco, mais "água" se o agricultor tem pouca água. */
export function prioridadesDoCampo(foco: Foco, restricoes: Restricao[]): Prioridade[] {
  const base = FOCOS.find((f) => f.id === foco)!.prioridades;
  return restricoes.includes("poucaAgua") && !base.includes("agua") ? [...base, "agua"] : base;
}

export interface RotacaoOrdenada {
  id: Rotacao["id"];
  soma: number;
  /** Restrições "não consigo" que tornam a rotação inaplicável. */
  bloqueios: ("semTrigo" | "semBraquiaria")[];
}

/**
 * Ordem: rotações aplicáveis primeiro; dentro de cada grupo, maior soma de prioridades;
 * empate: menor risco climático. Nenhuma rotação é removida.
 * `risco` = peso do risco climático por rotação (0 baixo, 1 médio, 2 alto).
 */
export function ordenarRotacoes(
  rotacoes: Pick<Rotacao, "id" | "atende">[],
  prioridades: Prioridade[],
  restricoes: Restricao[],
  risco: Record<Rotacao["id"], number>,
): RotacaoOrdenada[] {
  return rotacoes
    .map((r) => ({
      id: r.id,
      soma: prioridades.reduce((s, p) => s + r.atende[p], 0),
      bloqueios: (["semTrigo", "semBraquiaria"] as const).filter(
        (k) => restricoes.includes(k) && RESTRICAO_BLOQUEIA[k] === r.id,
      ),
    }))
    .sort(
      (a, b) =>
        Number(a.bloqueios.length > 0) - Number(b.bloqueios.length > 0) ||
        b.soma - a.soma ||
        risco[a.id] - risco[b.id],
    );
}
