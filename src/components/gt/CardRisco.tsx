"use client";

import { Snowflake, SunDim } from "lucide-react";
import type { RiscoView } from "@/lib/view-data";
import { NivelBadge } from "@/components/ui/NivelBadge";
import { CONFIANCA_EN, useLang, useT } from "@/lib/i18n";
import { deCada10 } from "@/components/gt/format";

export function CardRisco({
  titulo,
  tipo,
  r,
  regra,
  extra,
  filtro,
}: {
  titulo: string;
  tipo: "geada" | "seca";
  r: RiscoView;
  regra: string;
  extra?: React.ReactNode;
  /** Texto do filtro de ENSO ativo (vazio = todos os anos). */
  filtro?: string;
}) {
  const t = useT();
  const lang = useLang();
  const Icone = tipo === "geada" ? Snowflake : SunDim;
  const cor = tipo === "geada" ? "text-frost" : "text-drought";
  const barra = tipo === "geada" ? "bg-frost" : "bg-drought";
  const x = deCada10(r, lang);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Icone className={`size-5 shrink-0 ${cor}`} aria-hidden="true" />
          {titulo}
        </h3>
        <NivelBadge nivel={r.nivel} />
      </div>
      <p className="text-base">
        <b>{x.frase}</b>
        {t(
          `: aconteceu em ${r.anosComEvento} de ${r.totalAnos} safras`,
          `: happened in ${r.anosComEvento} of ${r.totalAnos} seasons`,
        )}
        {r.periodo ? ` (${r.periodo[0]}–${r.periodo[1]})` : ""}.
      </p>
      <div>
        <div
          className="flex gap-[2px]"
          role="img"
          aria-label={t("Anos com evento: ", "Years with the event: ") + (r.anos.join(", ") || t("nenhum", "none"))}
        >
          {r.periodo &&
            Array.from({ length: r.periodo[1] - r.periodo[0] + 1 }, (_, i) => r.periodo![0] + i).map((ano) => (
              <span
                key={ano}
                title={String(ano)}
                className={`h-6 flex-1 rounded-[2px] ${r.anos.includes(ano) ? barra : "bg-surface-2"}`}
              />
            ))}
        </div>
        {r.periodo && (
          <div className="mt-1 flex justify-between text-[13px] text-ink-faint" aria-hidden="true">
            <span>{r.periodo[0]}</span>
            <span>{r.periodo[1]}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-ink-muted">
        {r.anos.length
          ? `${t("Anos", "Years")}: ${r.anos.join(", ")}`
          : t("Nenhum ano com o evento neste período.", "No year with the event in this period.")}
        {r.anosFortes && r.anosFortes.length > 0 && (
          <>
            {" "}
            · <b className="text-frost-ink">{t("Geada forte", "Strong frost")}</b> (≤ 1 °C): {r.anosFortes.join(", ")}
          </>
        )}
      </p>
      {r.detalheSeca && (
        <ul className="grid gap-1 rounded-xl bg-surface-2 p-3 text-sm">
          <li>
            {t("Solo muito seco:", "Very dry soil:")} <b>{r.detalheSeca.anosSoloSeco.length}</b>{" "}
            {t(`de ${r.totalAnos} anos`, `of ${r.totalAnos} years`)}
          </li>
          <li>
            {t("Veranico de 15+ dias:", "Dry spell of 15+ days:")} <b>{r.detalheSeca.anosVeranico.length}</b>{" "}
            {t(`de ${r.totalAnos} anos`, `of ${r.totalAnos} years`)}
          </li>
          <li>
            {t("Os dois juntos (mais graves):", "Both together (most severe):")} <b>{r.detalheSeca.anosAmbos.length}</b>
            {r.detalheSeca.anosAmbos.length ? ` (${r.detalheSeca.anosAmbos.join(", ")})` : ""}
          </li>
        </ul>
      )}
      <p className="text-sm text-ink-muted">{regra}</p>
      {extra}
      <p className="mt-auto text-[13px] font-semibold text-ink-faint">
        NASA POWER {r.periodo ? `${r.periodo[0]}–${r.periodo[1]}` : ""}
        {filtro ? ` · ${filtro}` : ""} · {t("confiança", "confidence")}{" "}
        {t(r.confianca, CONFIANCA_EN[r.confianca] ?? r.confianca)}
      </p>
    </div>
  );
}
