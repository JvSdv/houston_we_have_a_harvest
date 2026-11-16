"use client";

// Idioma da interface: inglês (padrão, exigido pelo NASA Space Apps) e português (usuários reais).
import { createContext, useContext } from "react";

export type Lang = "en" | "pt";

export const LangContext = createContext<Lang>("en");

export const useLang = (): Lang => useContext(LangContext);

/** t(português, inglês) */
export function useT() {
  const lang = useLang();
  return (pt: string, en: string) => (lang === "en" ? en : pt);
}

const MESES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "MM-DD" → "20/10" (pt) ou "Oct 20" (en). */
export function fmtDia(mmdd: string, lang: Lang): string {
  const m = Number(mmdd.slice(0, 2));
  const d = Number(mmdd.slice(3, 5));
  return lang === "en" ? `${MESES_EN[m - 1]} ${d}` : `${mmdd.slice(3, 5)}/${mmdd.slice(0, 2)}`;
}

/** "YYYY-MM-DD" → "20/10/2026" (pt) ou "Oct 20, 2026" (en). */
export function fmtData(iso: string, lang: Lang): string {
  const y = iso.slice(0, 4);
  return lang === "en" ? `${fmtDia(iso.slice(5, 10), "en")}, ${y}` : `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${y}`;
}

export function fmtNum(x: number, casas: number, lang: Lang): string {
  return x.toLocaleString(lang === "en" ? "en-US" : "pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Meses civis (janeiro primeiro). */
export const MESES_CURTOS: Record<Lang, string[]> = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export const NIVEL_EN: Record<string, string> = {
  Baixo: "Low",
  Médio: "Medium",
  Alto: "High",
  "Não calculado": "Not calculated",
};

/** Trimestres do ENSO → meses por extenso. */
export const TRIMESTRE_MESES: Record<string, { pt: string; en: string }> = {
  DJF: { pt: "dez–fev", en: "Dec–Feb" },
  JFM: { pt: "jan–mar", en: "Jan–Mar" },
  FMA: { pt: "fev–abr", en: "Feb–Apr" },
  MAM: { pt: "mar–mai", en: "Mar–May" },
  AMJ: { pt: "abr–jun", en: "Apr–Jun" },
  MJJ: { pt: "mai–jul", en: "May–Jul" },
  JJA: { pt: "jun–ago", en: "Jun–Aug" },
  JAS: { pt: "jul–set", en: "Jul–Sep" },
  ASO: { pt: "ago–out", en: "Aug–Oct" },
  SON: { pt: "set–nov", en: "Sep–Nov" },
  OND: { pt: "out–dez", en: "Oct–Dec" },
  NDJ: { pt: "nov–jan", en: "Nov–Jan" },
};

export const CONFIANCA_EN: Record<string, string> = { alta: "high", média: "medium", baixa: "low" };

export const MESES_EIXO: Record<Lang, string[]> = {
  pt: ["set", "out", "nov", "dez", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago"],
  en: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
};
