"use client";

import type { CSSProperties } from "react";
import type { CampoView, DataView } from "@/lib/view-data";
import type { EngineParams } from "@/lib/engine/params.ts";
import type { TipoSegmento } from "@/lib/engine/calendario.ts";
import { ROTACOES } from "@/lib/rotacoes";
import { MESES_CURTOS, fmtDia, useLang, useT } from "@/lib/i18n";
import { NivelBadge } from "@/components/ui/NivelBadge";
import { Callout } from "@/components/ui/Callout";
import { Fonte } from "@/components/ui/Fonte";
import { TriangleAlert } from "lucide-react";

const DIAS = 365;

const FUNDO: Record<TipoSegmento, CSSProperties> = {
  soja: { background: "var(--color-soy)" },
  milho: { background: "var(--color-corn)" },
  trigo: { background: "var(--color-wheat)" },
  cobertura: {
    backgroundImage:
      "repeating-linear-gradient(135deg, var(--color-soy) 0 5px, var(--color-brand-soft) 5px 10px)",
  },
  descoberto: {
    backgroundImage:
      "repeating-linear-gradient(135deg, var(--color-drought) 0 4px, var(--color-drought-soft) 4px 10px)",
  },
};

export function CampoDescoberto({
  d,
  nomeLocal,
  params,
}: {
  d: DataView;
  nomeLocal: string;
  params: EngineParams;
}) {
  const t = useT();
  const lang = useLang();
  const meses = MESES_CURTOS[lang];
  const mesPlantio = Number(d.dataSoja.slice(0, 2)) - 1;
  const eixo = Array.from({ length: 12 }, (_, i) => meses[(mesPlantio + i) % 12]);

  const rotulo = (tipo: TipoSegmento) =>
    ({
      soja: t("Soja", "Soybean"),
      milho: t("Milho", "Corn"),
      trigo: t("Trigo", "Wheat"),
      cobertura: t("Braquiária", "Brachiaria"),
      descoberto: t("sem cultura", "no crop"),
    })[tipo];

  /** Meses com 10 dias ou mais sem cultura, ex.: "Jul (31 d), Aug (31 d)". */
  const mesesSemCultura = (c: CampoView) =>
    c.diasPorMes
      .map((n, i) => ({ n, i }))
      .filter((x) => x.n >= 10)
      .map((x) => `${meses[x.i]} (${x.n} ${t("d", "d")})`)
      .join(", ");

  return (
    <div>
      <h3 className="text-lg font-bold">
        {t("Quando o campo fica sem cultura?", "When is the field left without a crop?")}
      </h3>
      <p className="text-[13px] text-ink-faint">
        {t("Campo descoberto ao longo do ano", "Bare field through the year")} · {nomeLocal} · {t("soja em", "soybean on")}{" "}
        {fmtDia(d.dataSoja, lang)}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {t(
          "Cada linha vai do plantio desta soja até o plantio da próxima. Sem cultura = só resíduo de palha no solo.",
          "Each row runs from this soybean planting to the next one. No crop = only crop residue left on the soil.",
        )}
      </p>

      {/* eixo dos meses, começando no mês do plantio */}
      <div className="mt-4 flex text-[13px] text-ink-faint max-sm:[&>span:nth-child(even)]:invisible" aria-hidden="true">
        {eixo.map((m, i) => (
          <span key={`${m}-${i}`} className="flex-1 text-center">
            {m}
          </span>
        ))}
      </div>

      <ul className="mt-1 flex flex-col gap-5">
        {ROTACOES.map((r) => {
          const c = d.campo[r.id];
          const x = lang === "en" ? r.en : r.pt;
          const meses10 = mesesSemCultura(c);
          return (
            <li key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold">{x.nome}</h4>
                <NivelBadge nivel={c.nivelErosao} prefixo={t("Erosão", "Erosion")} />
              </div>
              <div
                className="relative mt-1.5 h-9 overflow-hidden rounded-lg border border-line bg-surface-2"
                role="img"
                aria-label={t(
                  `${x.nome}: ${c.diasDescoberto} dias do ano sem cultura`,
                  `${x.nome}: ${c.diasDescoberto} days a year without a crop`,
                )}
              >
                {c.segmentos.map((s) => {
                  const largura = ((s.ate - s.de) / DIAS) * 100;
                  return (
                    <div
                      key={`${s.tipo}-${s.de}`}
                      className="absolute inset-y-0 flex items-center overflow-hidden"
                      style={{ left: `${(s.de / DIAS) * 100}%`, width: `${largura}%`, ...FUNDO[s.tipo] }}
                    >
                      {largura >= 11 && (
                        <span
                          className={`truncate px-1.5 text-[13px] font-bold ${
                            s.tipo === "soja"
                              ? "text-white"
                              : s.tipo === "milho" || s.tipo === "trigo"
                                ? "text-ink"
                                : "rounded bg-surface/80 text-ink"
                          }`}
                        >
                          {rotulo(s.tipo)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-1.5 text-sm">
                <b>{c.diasDescoberto}</b> {t("dias do ano sem cultura", "days a year without a crop")}
                {c.diasDescoberto > params.toleranciaCobertoDias
                  ? meses10
                    ? ` ${t("— sobretudo em", "— mostly in")} ${meses10}.`
                    : "."
                  : ` ${t("— praticamente sempre coberto.", "— practically always covered.")}`}
                {c.chuva && c.diasDescoberto > params.toleranciaCobertoDias && (
                  <>
                    {" "}
                    {t(
                      `Nesses dias chovem em média ${c.chuva.mediaMm} mm por ano e há ${String(c.chuva.diasChuvaForteAno).replace(".", ",")} dia(s) por ano com chuva de ${params.chuvaForteMm} mm ou mais (grade da NASA POWER, ${c.chuva.anos} anos).`,
                      `On those days it rains ${c.chuva.mediaMm} mm a year on average, with ${c.chuva.diasChuvaForteAno} day(s) a year of ${params.chuvaForteMm} mm or more (NASA POWER grid, ${c.chuva.anos} years).`,
                    )}
                  </>
                )}
              </p>
              {c.atrasoSojaDias > 0 && (
                <Callout tom="cautela" icone={TriangleAlert} className="mt-2 !p-2 text-sm">
                  {t(
                    `Com a semeadura do trigo em ${fmtDia(params.semeaduraTrigo, lang)} (valor de exemplo), a colheita passa ${c.atrasoSojaDias} dia(s) da data de plantio da próxima soja.`,
                    `With wheat sown on ${fmtDia(params.semeaduraTrigo, lang)} (example value), harvest runs ${c.atrasoSojaDias} day(s) past the next soybean planting date.`,
                  )}
                </Callout>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-faint">
        {(["soja", "milho", "trigo", "cobertura", "descoberto"] as const).map((tipo) => (
          <span key={tipo} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded-sm border border-line" style={FUNDO[tipo]} />
            {tipo === "cobertura"
              ? t("braquiária (cobertura viva e palha)", "brachiaria (living cover, then straw)")
              : tipo === "descoberto"
                ? t("sem cultura (só palha)", "no crop (residue only)")
                : rotulo(tipo)}
          </span>
        ))}
      </p>

      <div className="mt-3 flex flex-col gap-1">
        <Fonte>
          {t(
            `Hipóteses a validar com agronomia/ZARC: soja ${params.cicloSoja} dias, intervalo ${params.intervalo} dias, milho ${params.cicloMilho} dias, trigo semeado em ${fmtDia(params.semeaduraTrigo, lang)} com ${params.cicloTrigo} dias de ciclo. Como os ciclos são fixos, os dias sem cultura são os mesmos para qualquer data da soja; o que muda é em quais meses eles caem.`,
            `Hypotheses to validate with agronomy/ZARC: soybean ${params.cicloSoja} days, ${params.intervalo}-day gap, corn ${params.cicloMilho} days, wheat sown on ${fmtDia(params.semeaduraTrigo, lang)} with a ${params.cicloTrigo}-day cycle. Because cycles are fixed, the days without a crop are the same for any soybean date; what changes is which months they fall in.`,
          )}
        </Fonte>
        <Fonte>
          {t(
            `Nível de erosão (Metodologia do time): mais de ${params.limiteErosaoAltaDias} dias sem cultura = Alto; até ${params.toleranciaCobertoDias} = Baixo; entre os dois = Médio. Não considera o declive do terreno nem o mês da chuva, e a chuva é a média da grade de ~50 km, que subestima temporais locais.`,
            `Erosion level (team methodology): more than ${params.limiteErosaoAltaDias} days without a crop = High; up to ${params.toleranciaCobertoDias} = Low; in between = Medium. It ignores terrain slope and the month of the rain, and rainfall is the ~50 km grid average, which understates local storms.`,
          )}
        </Fonte>
      </div>
    </div>
  );
}
