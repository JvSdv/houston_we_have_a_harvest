"use client";

import { CircleCheck, CircleMinus, OctagonAlert, TriangleAlert } from "lucide-react";
import { useT } from "@/lib/i18n";

export type Nivel = "Baixo" | "Médio" | "Alto";

/** Mesmo critério de antes: ≤1 em 10 = Baixo, 2–3 = Médio, ≥4 = Alto. */
export function nivelPorFreq(f: number): Nivel {
  const x = Math.round(f * 10);
  return x <= 1 ? "Baixo" : x <= 3 ? "Médio" : "Alto";
}

const ESTILO = {
  Baixo: { cls: "bg-low-soft text-low border-low/30", Icone: CircleCheck },
  Médio: { cls: "bg-mid-soft text-mid border-mid-line", Icone: TriangleAlert },
  Alto: { cls: "bg-high-soft text-high border-high/30", Icone: OctagonAlert },
  "Não calculado": { cls: "bg-surface-2 text-ink-muted border-line", Icone: CircleMinus },
} as const;

const TEXTO: Record<Nivel | "Não calculado", { pt: [string, string]; en: [string, string] }> = {
  // [sem prefixo, com prefixo]
  Baixo: { pt: ["Risco baixo", "baixo"], en: ["Low risk", "low"] },
  Médio: { pt: ["Risco médio", "médio"], en: ["Medium risk", "medium"] },
  Alto: { pt: ["Risco alto", "alto"], en: ["High risk", "high"] },
  "Não calculado": { pt: ["Não calculado", "não calculado"], en: ["Not calculated", "not calculated"] },
};

export function NivelBadge({
  nivel,
  prefixo,
  tamanho = "sm",
}: {
  nivel: Nivel | "Não calculado";
  prefixo?: string;
  tamanho?: "sm" | "md";
}) {
  const t = useT();
  const { cls, Icone } = ESTILO[nivel];
  const x = TEXTO[nivel];
  const i = prefixo ? 1 : 0;
  const texto = prefixo ? `${prefixo}: ${t(x.pt[i], x.en[i])}` : t(x.pt[0], x.en[0]);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border py-1 font-semibold ${
        tamanho === "md" ? "px-3 text-sm" : "px-2.5 text-[13px]"
      } ${cls}`}
    >
      <Icone className="size-4 shrink-0" aria-hidden="true" />
      {texto}
    </span>
  );
}
