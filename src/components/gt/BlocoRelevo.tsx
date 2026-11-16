"use client";

import type { LocalView } from "@/lib/view-data";
import { Fonte } from "@/components/ui/Fonte";
import { fmtData, fmtNum, useLang, useT } from "@/lib/i18n";

export function BlocoRelevo({ local, baixada }: { local: LocalView; baixada: boolean }) {
  const t = useT();
  const lang = useLang();
  const r = local.relevo;
  if (!r || r.pontoM === null) return null;
  const dif = local.elevacaoGradeM === null ? null : r.pontoM - local.elevacaoGradeM;
  const a = r.amostra;
  const fonte = r.estimado
    ? t(r.fonte, "ESTIMATED: mean elevation of the NASA POWER cell (SRTM unavailable at download time)")
    : t(r.fonte, "NASA SRTM 30 m (SRTM v3, 1 arc-second) via OpenTopoData");
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <h3 className="text-lg font-bold">
        {t("Relevo", "Relief")} · {r.estimado ? t("valor ESTIMADO", "ESTIMATED value") : "NASA SRTM 30 m"}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        <li>
          {t(`Altitude no ponto de ${local.nome}:`, `Elevation at the ${local.nome} point:`)} <b>{r.pontoM} m</b>
          {r.estimado ? t(" (estimativa: média da célula do POWER)", " (estimate: NASA POWER cell average)") : ""}.
        </li>
        {local.elevacaoGradeM !== null && (
          <li>
            {t("Altitude média da célula do NASA POWER:", "Mean elevation of the NASA POWER cell:")}{" "}
            <b>{local.elevacaoGradeM} m</b>
            {dif !== null && !r.estimado
              ? t(
                  ` (o ponto está ${Math.abs(dif)} m ${dif >= 0 ? "acima" : "abaixo"})`,
                  ` (the point is ${Math.abs(dif)} m ${dif >= 0 ? "above" : "below"})`,
                )
              : ""}
            .
          </li>
        )}
        {a && (
          <li>
            {t(
              `Em ${fmtNum(a.raioM / 1000, 1, lang)} km ao redor (${a.pontos} pontos a cada ${a.espacamentoM} m) a altitude varia de `,
              `Within ${fmtNum(a.raioM / 1000, 1, lang)} km around (${a.pontos} points every ${a.espacamentoM} m) elevation ranges from `,
            )}
            <b>
              {a.minM} {t("a", "to")} {a.maxM} m
            </b>{" "}
            {t(`(${a.maxM - a.minM} m de desnível). O ponto fica `, `(${a.maxM - a.minM} m of relief). The point sits `)}
            {Math.abs(r.pontoM - a.mediaM)} m {r.pontoM >= a.mediaM ? t("acima", "above") : t("abaixo", "below")}{" "}
            {t("da média desse entorno.", "the average of that surrounding area.")}
          </li>
        )}
      </ul>
      <p className="mt-2 text-sm text-ink-muted">
        {baixada
          ? t(
              "Você marcou baixada: o limite de geada sobe +1 °C (hipótese). O relevo mostra o desnível do entorno, mas ainda não classifica cada talhão.",
              "You ticked lowland: the frost limit rises +1 °C (hypothesis). Relief shows the height range around the point but does not yet classify each plot.",
            )
          : t(
              "Se a sua lavoura fica num fundo de vale, marque “baixada”: o ar frio escorre e se acumula ali.",
              "If your field is in a valley bottom, tick “lowland”: cold air drains and pools there.",
            )}{" "}
        {t(
          "A temperatura do POWER é a da célula, sem correção de altitude.",
          "POWER temperature is the grid-cell value, without elevation correction.",
        )}
      </p>
      <Fonte className="mt-2">
        {fonte}. {t("Baixado em", "Downloaded on")} {fmtData(r.baixadoEm.slice(0, 10), lang)}.
        {r.fonteUrl && (
          <>
            {" "}
            <a href={r.fonteUrl} target="_blank" rel="noreferrer">
              {t("Fonte", "Source")}
            </a>
            .
          </>
        )}
      </Fonte>
    </div>
  );
}
