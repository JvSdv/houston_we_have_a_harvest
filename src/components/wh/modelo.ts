// Cálculos de apresentação das telas novas (datas da safra, avaliação das rotações, resumo e agenda).
// Não mexe no motor: só lê o que src/lib/local-view.ts já calculou.
import type { DataView, RiscoView, TrigoView } from "@/lib/view-data";
import {
  ROTACOES,
  PRIORIDADES,
  MOTIVO_BLOQUEIO,
  ordenarRotacoes,
  prioridadesDoCampo,
  type Foco,
  type Restricao,
  type Rotacao,
} from "@/lib/rotacoes";
import { nivelPorFreq, type Nivel } from "@/components/ui/NivelBadge";
import { fmtDia, type Lang } from "@/lib/i18n";
import type { Avaliacao } from "@/components/wh/Arte";

const DIA = 86_400_000;

// ---------- datas ----------

/** Dias desde 1º de setembro (o ano da safra vai de setembro a agosto). */
export function diaEixo(mmdd: string): number {
  const m = Number(mmdd.slice(0, 2));
  const d = Number(mmdd.slice(3, 5));
  const ano = m >= 9 ? 2025 : 2026;
  return Math.round((Date.UTC(ano, m - 1, d) - Date.UTC(2025, 8, 1)) / DIA);
}

/** "MM-DD" + n dias → "MM-DD" (ano sem 29/02). */
export function somarDias(mmdd: string, n: number): string {
  const m = Number(mmdd.slice(0, 2));
  const d = Number(mmdd.slice(3, 5));
  const x = new Date(Date.UTC(2025, m - 1, d) + n * DIA);
  return `${String(x.getUTCMonth() + 1).padStart(2, "0")}-${String(x.getUTCDate()).padStart(2, "0")}`;
}

/** Ano em que começou a safra atual (setembro a agosto). */
export function anoDaSafra(hoje: Date): number {
  return hoje.getMonth() >= 8 ? hoje.getFullYear() : hoje.getFullYear() - 1;
}

/** Data civil de um "MM-DD" dentro da safra que começa em `ano`. */
export function dataNaSafra(mmdd: string, ano: number): Date {
  const m = Number(mmdd.slice(0, 2));
  const d = Number(mmdd.slice(3, 5));
  return new Date(m >= 9 ? ano : ano + 1, m - 1, d);
}

/** "MM-DD" de hoje. */
export function hojeMMDD(hoje: Date): string {
  return `${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

/** Dias inteiros de a até b (b − a). */
export function diasEntre(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DIA);
}

const MESES_LONGOS: Record<Lang, string[]> = {
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const MESES_ABREV: Record<Lang, string[]> = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** "20 de outubro" / "October 20". */
export function diaLongo(mmdd: string, lang: Lang): string {
  const m = Number(mmdd.slice(0, 2)) - 1;
  const d = Number(mmdd.slice(3, 5));
  return lang === "en" ? `${MESES_LONGOS.en[m]} ${d}` : `${d} de ${MESES_LONGOS.pt[m]}`;
}

/** { dia: "20", mes: "out" } para os botões de data. */
export function diaEMes(mmdd: string, lang: Lang): { dia: string; mes: string } {
  return { dia: mmdd.slice(3, 5), mes: MESES_ABREV[lang][Number(mmdd.slice(0, 2)) - 1] };
}

export function mesAbrev(i: number, lang: Lang): string {
  return MESES_ABREV[lang][i];
}

// ---------- risco ----------

/** Quantos anos em 10 (arredondado), com "<1" quando aconteceu mas é raro. */
export function emDez(r: RiscoView): { n: number; texto: string } {
  const x = Math.round(r.frequencia * 10);
  if (r.anosComEvento > 0 && x === 0) return { n: 0, texto: "<1" };
  return { n: x, texto: String(x) };
}

/** Risco em porcentagem dos anos do histórico: "30%" (ou "<1%" quando aconteceu, mas é raro). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fraseDez(r: RiscoView, _lang?: Lang): string {
  const n = Math.round(r.frequencia * 100);
  if (r.anosComEvento > 0 && n === 0) return "<1%";
  return `${n}%`;
}

export const PESO_NIVEL: Record<Nivel, number> = { Baixo: 0, Médio: 1, Alto: 2 };

export function pior(a: Nivel, b: Nivel): Nivel {
  return PESO_NIVEL[a] >= PESO_NIVEL[b] ? a : b;
}

export function avaliacaoDoNivel(n: Nivel | "Não calculado"): Avaliacao {
  return n === "Baixo" ? "bom" : n === "Médio" ? "atencao" : n === "Alto" ? "ruim" : "atencao";
}

/** Data com menos geada (a mais tardia entre as de menor contagem) — mesma regra da recomendação anterior. */
export function melhorDataGeada(datas: DataView[], baixada: boolean): number {
  const g = (d: DataView) => (baixada ? d.geadaBaixada : d.geada);
  const min = Math.min(...datas.map((d) => g(d).anosComEvento));
  let ate = 0;
  datas.forEach((d, i) => {
    if (g(d).anosComEvento === min) ate = i;
  });
  return ate;
}

// ---------- rotações ----------

export interface RotacaoAvaliada {
  r: Rotacao;
  soma: number;
  bloqueios: (keyof typeof MOTIVO_BLOQUEIO)[];
  geada: Avaliacao;
  solo: Avaliacao;
  renda: Avaliacao;
}

export interface ModeloRotacoes {
  avaliadas: RotacaoAvaliada[];
  melhor: RotacaoAvaliada;
  motivo: string;
  climaMilho: string;
  nivelGeadaMilho: Nivel;
  geadaTrigo: RiscoView;
}

export function avaliarRotacoes(args: {
  d: DataView;
  trigo: TrigoView;
  baixada: boolean;
  foco: Foco;
  restricoes: Restricao[];
  lang: Lang;
}): ModeloRotacoes {
  const { d, trigo, baixada, foco, restricoes, lang } = args;
  const t = (pt: string, en: string) => (lang === "en" ? en : pt);
  const prios = prioridadesDoCampo(foco, restricoes);
  const geada = baixada ? d.geadaBaixada : d.geada;
  const nivelGeada = nivelPorFreq(geada.frequencia);
  const nivelSeca = nivelPorFreq(d.seca.frequencia);
  const geadaTrigo = baixada ? trigo.geadaBaixada : trigo.geada;
  const nivelClimaMilho = pior(nivelGeada, nivelSeca);
  const riscoPorRotacao = Object.fromEntries(
    ROTACOES.map((r) => [r.id, r.riscoCalculado ? PESO_NIVEL[nivelClimaMilho] : 1]),
  ) as Record<Rotacao["id"], number>;
  const avaliadas: RotacaoAvaliada[] = ordenarRotacoes(ROTACOES, prios, restricoes, riscoPorRotacao).map((o) => {
    const r = ROTACOES.find((q) => q.id === o.id)!;
    return {
      r,
      soma: o.soma,
      bloqueios: o.bloqueios as (keyof typeof MOTIVO_BLOQUEIO)[],
      geada: avaliacaoDoNivel(r.riscoCalculado ? nivelGeada : geadaTrigo.nivel),
      solo: avaliacaoDoNivel(d.campo[r.id].nivelErosao),
      renda: r.atende.mercado === 3 ? "bom" : r.atende.mercado === 2 ? "atencao" : "ruim",
    };
  });
  const melhor = avaliadas[0];
  const fortes = prios.filter((p) => melhor.r.atende[p] === 3).map((p) => PRIORIDADES.find((q) => q.id === p)!);
  const motivo =
    fortes.length > 0
      ? t("Atende bem: ", "Meets well: ") + fortes.map((p) => t(p.pt, p.en).toLowerCase()).join(", ") + "."
      : t("Melhor soma entre as opções que você consegue fazer.", "Best total among the options you can do.");
  const climaMilho = melhor.r.riscoCalculado
    ? t(
        ` Risco do milho nesta data: geada em ${geada.anosComEvento} e seca em ${d.seca.anosComEvento} de ${geada.totalAnos} safras.`,
        ` Corn risk on this date: frost in ${geada.anosComEvento} and drought in ${d.seca.anosComEvento} of ${geada.totalAnos} seasons.`,
      )
    : melhor.r.id === "trigo"
      ? t(
          ` Geada no espigamento do trigo: ${geadaTrigo.anosComEvento} de ${geadaTrigo.totalAnos} safras (depende da data de semeadura).`,
          ` Wheat frost at heading: ${geadaTrigo.anosComEvento} of ${geadaTrigo.totalAnos} seasons (depends on the sowing date).`,
        )
      : "";
  return { avaliadas, melhor, motivo, climaMilho, nivelGeadaMilho: nivelGeada, geadaTrigo };
}

/** Texto para WhatsApp (mesmo conteúdo do antigo "Copiar resumo", mais a resposta principal). */
export function montarResumo(args: {
  nomeLocal: string;
  d: DataView;
  baixada: boolean;
  modelo: ModeloRotacoes;
  lang: Lang;
  /** Link que abre o app já com esta cidade e data. */
  link?: string;
}): string {
  const { nomeLocal, d, baixada, modelo, lang, link } = args;
  const t = (pt: string, en: string) => (lang === "en" ? en : pt);
  const geada = baixada ? d.geadaBaixada : d.geada;
  const txt = (r: Rotacao) => (lang === "en" ? r.en : r.pt);
  const linhas = [
    `weharvest · ${nomeLocal} · ${t("soja em", "soybean on")} ${fmtDia(d.dataSoja, lang)}${baixada ? " · " + t("baixada", "lowland") : ""}`,
    t(
      `Risco de geada na flor do milho: ${fraseDez(geada, lang)} (${geada.anosComEvento} de ${geada.totalAnos} safras). Risco de seca: ${fraseDez(d.seca, lang)} (${d.seca.anosComEvento} de ${d.seca.totalAnos}).`,
      `Frost risk at corn flowering: ${fraseDez(geada, lang)} (${geada.anosComEvento} of ${geada.totalAnos} seasons). Drought risk: ${fraseDez(d.seca, lang)} (${d.seca.anosComEvento} of ${d.seca.totalAnos}).`,
    ),
    `${t("Para o seu campo", "For your field")}: ${txt(modelo.melhor.r).nome}. ${modelo.motivo}${modelo.climaMilho}`,
    ...modelo.avaliadas.map((a, i) => {
      const k = a.bloqueios[0];
      return `${i + 1}. ${txt(a.r).nome}${k ? " — " + t("não se aplica: ", "not applicable: ") + t(MOTIVO_BLOQUEIO[k].pt, MOTIVO_BLOQUEIO[k].en) : ""}`;
    }),
    t(
      "Dados: NASA POWER, 1981–2026. Apoio à decisão, a validar com técnico.",
      "Data: NASA POWER, 1981–2026. Decision support, to be validated with an agronomist.",
    ),
    ...(link ? ["", `${t("Veja no app:", "See it in the app:")} ${link}`] : []),
  ];
  return linhas.join("\n");
}

// ---------- agenda (.ics) ----------

export interface EventoAgenda {
  titulo: string;
  inicio: Date;
  /** Último dia (inclusivo). */
  fim?: Date;
  descricao?: string;
}

const ymd = (x: Date) =>
  `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function montarIcs(eventos: EventoAgenda[]): string {
  const agora = new Date();
  const stamp = `${ymd(agora)}T000000Z`;
  const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//weharvest//safra//PT", "CALSCALE:GREGORIAN"];
  eventos.forEach((e, i) => {
    const fim = new Date((e.fim ?? e.inicio).getTime());
    fim.setDate(fim.getDate() + 1);
    linhas.push(
      "BEGIN:VEVENT",
      `UID:weharvest-${ymd(e.inicio)}-${i}@weharvest`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.inicio)}`,
      `DTEND;VALUE=DATE:${ymd(fim)}`,
      `SUMMARY:${esc(e.titulo)}`,
      ...(e.descricao ? [`DESCRIPTION:${esc(e.descricao)}`] : []),
      "END:VEVENT",
    );
  });
  linhas.push("END:VCALENDAR");
  return linhas.join("\r\n");
}

export function baixarIcs(eventos: EventoAgenda[], nome: string) {
  const blob = new Blob([montarIcs(eventos)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Link que abre o Google Agenda com o evento preenchido (no Android abre o app de agenda). */
export function linkGoogleAgenda(e: EventoAgenda): string {
  const fim = new Date((e.fim ?? e.inicio).getTime());
  fim.setDate(fim.getDate() + 1);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.titulo, dates: `${ymd(e.inicio)}/${ymd(fim)}` });
  if (e.descricao) q.set("details", e.descricao);
  return `https://calendar.google.com/calendar/render?${q.toString().replace(/\+/g, "%20")}`;
}
