import type { RiscoView } from "@/lib/view-data";
import type { Lang } from "@/lib/i18n";
import type { FiltroEnso } from "@/lib/engine/enso.ts";

export const FILTROS_ENSO: { id: FiltroEnso; pt: string; en: string; fpt: string; fen: string }[] = [
  { id: "todos", pt: "Todos os anos", en: "All years", fpt: "todos os anos", fen: "all years" },
  { id: "el-nino", pt: "Anos de El Niño", en: "El Niño years", fpt: "anos de El Niño", fen: "El Niño years" },
  { id: "la-nina", pt: "Anos de La Niña", en: "La Niña years", fpt: "anos de La Niña", fen: "La Niña years" },
  { id: "neutro", pt: "Anos neutros", en: "Neutral years", fpt: "anos neutros", fen: "neutral years" },
];

/** Amostra pequena: abaixo disso a leitura pede cautela (regra de confiança da Metodologia: 12 anos). */
export const AMOSTRA_MINIMA = 12;

/** "X/10" e frase honesta para frequências pequenas. */
export function deCada10(r: RiscoView, lang: Lang): { grande: string; frase: string } {
  const x = Math.round(r.frequencia * 10);
  if (r.anosComEvento === 0)
    return { grande: "0/10", frase: lang === "en" ? "none in 10 years" : "nenhum ano em 10" };
  if (x === 0)
    return { grande: "<1/10", frase: lang === "en" ? "fewer than 1 in every 10 years" : "menos de 1 de cada 10 anos" };
  return { grande: `${x}/10`, frase: lang === "en" ? `${x} in every 10 years` : `${x} de cada 10 anos` };
}

/** Número grande sem "/10": "4", "<1" ou "0". */
export function numeroGrande(r: RiscoView, lang: Lang): string {
  return deCada10(r, lang).grande.replace("/10", "");
}

/** Quantos dos 10 círculos ficam preenchidos. */
export function pontos10(r: RiscoView): number {
  return r.anosComEvento === 0 ? 0 : Math.round(r.frequencia * 10);
}
