// Eventos da safra do produtor: a mesma lista alimenta o calendário, o relatório e a agenda (.ics).
// Só lê datas já calculadas pelo motor (DataView/LocalView); não calcula risco.
import type { DataView, LocalView } from "@/lib/view-data";
import { anoDaSafra, dataNaSafra, diasEntre, type EventoAgenda } from "@/components/wh/modelo";
import { dataDeIso, type LembreteId } from "@/components/wh/caderno";
import { fmtDia, type Lang } from "@/lib/i18n";

export type TipoEvento = "soja" | "colheita" | "milho" | "flor" | "geada";
export type Tr = (pt: string, en: string) => string;

export interface EventoSafra {
  tipo: TipoEvento;
  titulo: string;
  detalhe: string;
  inicio: Date;
  /** Último dia (inclusivo); sem fim = um dia só. */
  fim?: Date;
  cor: string;
  /** Data mudou porque o produtor marcou uma etapa anterior com a data real. */
  ajustado?: boolean;
  /** Data real em que foi feito (marcado pelo produtor). */
  feitoEm?: Date;
}

export const COR_EVENTO: Record<TipoEvento, string> = {
  soja: "#5BAE4A",
  colheita: "#C9A23A",
  milho: "#E0B63A",
  flor: "#E07A3E",
  geada: "#3E6EA8",
};

const somar = (x: Date, n: number) => new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
const mmdd = (x: Date) => `${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

/**
 * Datas da safra. Quando o produtor marca uma etapa como feita, as etapas seguintes andam junto:
 * soja plantada 5 dias depois → colheita, milho e flor 5 dias depois (mesmos intervalos do motor).
 * O risco de geada e seca continua o calculado para a data planejada.
 */
export function eventosDaSafra(args: {
  d: DataView;
  local: LocalView;
  cicloMilho?: number;
  hoje: Date;
  t: Tr;
  lang: Lang;
  feitos?: Partial<Record<LembreteId, string>>;
  modo?: "vou" | "ja";
}): EventoSafra[] {
  const { d, local, hoje, t, lang, feitos = {}, modo } = args;
  const ano = anoDaSafra(hoje);
  const dt = (m: string) => dataNaSafra(m, ano);
  const dia = (x: Date) => fmtDia(mmdd(x), lang);
  const ep = local.epocaGeada;

  const real = (id: LembreteId) => (feitos[id] ? dataDeIso(feitos[id]!) : id === "soja" && modo === "ja" ? dt(d.dataSoja) : undefined);
  let desvio = 0;
  const etapa = (id: LembreteId, planejada: Date) => {
    const prevista = somar(planejada, desvio);
    const feitoEm = real(id);
    const ajustado = desvio !== 0;
    if (feitoEm && id !== "flor") desvio += diasEntre(prevista, feitoEm);
    return { quando: feitoEm && id !== "flor" ? feitoEm : prevista, feitoEm, ajustado: ajustado || (!!feitoEm && id !== "flor" && diasEntre(prevista, feitoEm) !== 0) };
  };
  const soja = etapa("soja", dt(d.dataSoja));
  const colheita = etapa("colheita", dt(d.colheitaSoja));
  const milho = etapa("milho", dt(d.plantioMilho));
  const florIni = somar(dt(d.faseInicio), desvio);
  const florFim = somar(dt(d.faseFim), desvio);
  const flor = { feitoEm: real("flor") };

  const lista: EventoSafra[] = [
    { tipo: "soja", titulo: t("Plantar a soja", "Plant soybeans"), detalhe: dia(soja.quando), inicio: soja.quando, cor: COR_EVENTO.soja, ajustado: soja.ajustado, feitoEm: soja.feitoEm },
    {
      tipo: "colheita",
      titulo: t("Colher a soja", "Harvest soybeans"),
      detalhe: colheita.feitoEm ? dia(colheita.quando) : t(`perto de ${dia(colheita.quando)}`, `around ${dia(colheita.quando)}`),
      inicio: colheita.quando,
      cor: COR_EVENTO.colheita,
      ajustado: colheita.ajustado,
      feitoEm: colheita.feitoEm,
    },
    {
      tipo: "milho",
      titulo: t("Plantar o milho safrinha", "Plant second-crop corn"),
      detalhe: milho.feitoEm ? dia(milho.quando) : t(`até ${dia(milho.quando)}, logo após a colheita`, `by ${dia(milho.quando)}, right after harvest`),
      inicio: milho.quando,
      cor: COR_EVENTO.milho,
      ajustado: milho.ajustado,
      feitoEm: milho.feitoEm,
    },
    {
      tipo: "flor",
      titulo: t("Flor do milho", "Corn flowering"),
      detalhe: t(`${dia(florIni)} a ${dia(florFim)} · fase sensível a geada e seca`, `${dia(florIni)} to ${dia(florFim)} · stage sensitive to frost and drought`),
      inicio: florIni,
      fim: florFim,
      cor: COR_EVENTO.flor,
      ajustado: desvio !== 0,
      feitoEm: flor.feitoEm,
    },
  ];
  if (ep)
    lista.push({
      tipo: "geada",
      titulo: t("Época de geada", "Frost season"),
      detalhe: t(`${dia(dt(ep.inicio))} a ${dia(dt(ep.fim))} · nos anos passados`, `${dia(dt(ep.inicio))} to ${dia(dt(ep.fim))} · in past years`),
      inicio: dt(ep.inicio),
      fim: dt(ep.fim),
      cor: COR_EVENTO.geada,
    });
  return lista;
}

/** Dias em que a flor do milho e a época de geada se encontram (null se não se encontram). */
export function encontroFlorGeada(eventos: EventoSafra[]): { inicio: Date; fim: Date } | null {
  const f = eventos.find((e) => e.tipo === "flor");
  const g = eventos.find((e) => e.tipo === "geada");
  if (!f?.fim || !g?.fim) return null;
  const inicio = f.inicio > g.inicio ? f.inicio : g.inicio;
  const fim = f.fim < g.fim ? f.fim : g.fim;
  return inicio <= fim ? { inicio, fim } : null;
}

const chave = (x: Date) => x.getFullYear() * 10000 + (x.getMonth() + 1) * 100 + x.getDate();

/** Eventos que acontecem em um dia (inclui os que duram vários dias). */
export function eventosDoDia(eventos: EventoSafra[], dia: Date): EventoSafra[] {
  const k = chave(dia);
  return eventos.filter((e) => chave(e.inicio) <= k && k <= chave(e.fim ?? e.inicio));
}

export const mesmoDia = (a: Date, b: Date) => chave(a) === chave(b);

export function paraAgenda(eventos: EventoSafra[], nomeLocal: string, nota: string): EventoAgenda[] {
  return eventos.map((e) => ({ titulo: e.titulo, inicio: e.inicio, fim: e.fim, descricao: `${nomeLocal} · ${e.detalhe}. ${nota}` }));
}

/** Baixa um arquivo de texto (relatório .txt ou planilha .csv). */
export function baixarTexto(conteudo: string, nome: string, tipo: string) {
  const blob = new Blob(["﻿" + conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const aspas = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function montarCsv(eventos: EventoSafra[], notas: { dia: Date; texto: string }[] = [], rotuloNota = "Anotação"): string {
  const f = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return [
    "evento,inicio,fim,detalhe",
    ...eventos.map((e) => [aspas(e.titulo), f(e.inicio), f(e.fim ?? e.inicio), aspas(e.detalhe + (e.feitoEm ? " (feito)" : ""))].join(",")),
    ...notas.map((n) => [aspas(rotuloNota), f(n.dia), f(n.dia), aspas(n.texto)].join(",")),
  ].join("\r\n");
}
