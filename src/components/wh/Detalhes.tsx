"use client";

import type { BacktestView, DataView, EnsoInfo, LocalView } from "@/lib/view-data";
import type { EngineParams } from "@/lib/engine/index.ts";
import type { FaseEnso, FiltroEnso } from "@/lib/engine/enso.ts";
import { Segmented } from "@/components/ui/Segmented";
import { Evidencias } from "@/components/gt/Evidencias";
import { Rodape } from "@/components/gt/Rodape";
import { AMOSTRA_MINIMA, FILTROS_ENSO } from "@/components/gt/format";
import { TRIMESTRE_MESES, fmtNum, useLang, useT } from "@/lib/i18n";

/** "Detalhes técnicos (El Niño, fontes, método)": tudo o que era da camada de provas, recolhido. */
export function Detalhes({
  local,
  d,
  dEf,
  baixada,
  fase,
  onFase,
  filtroTexto,
  params,
  backtest,
  enso,
}: {
  local: LocalView;
  d: DataView;
  dEf: DataView;
  baixada: boolean;
  fase: FiltroEnso;
  onFase: (f: FiltroEnso) => void;
  filtroTexto: string;
  params: EngineParams;
  backtest: BacktestView;
  enso: EnsoInfo;
}) {
  const t = useT();
  const lang = useLang();
  const anos = fase === "todos" ? [] : d.anosPorFase[fase as FaseEnso];
  const ult = enso.ultimo;
  const ultFase = ult?.fase === "el-nino" ? "El Niño" : ult?.fase === "la-nina" ? "La Niña" : null;
  return (
    <section id="detalhes" aria-labelledby="wh-detalhes" className="rounded-3xl bg-white px-4 pt-4">
      <h2 id="wh-detalhes" className="m-0 text-lg font-black tracking-normal">
        {t("Detalhes técnicos (El Niño, fontes, método)", "Technical details (El Niño, sources, method)")}
      </h2>
      <div className="flex flex-col gap-4 pb-4 pt-1">
        <p className="m-0 text-[13px] leading-[1.5] text-texto-2">
          {t(
            "Filtro por anos de El Niño / La Niña, dados ano a ano, relevo, checagem com o IBGE, glossário e limitações.",
            "Filter by El Niño / La Niña years, year-by-year data, relief, IBGE check, glossary and limitations.",
          )}
        </p>

        <section className="flex flex-col gap-2 rounded-2xl bg-campo p-3.5">
          <h3 className="m-0 text-base font-extrabold">{t("Ver só anos de El Niño ou La Niña", "See only El Niño or La Niña years")}</h3>
          <p className="m-0 text-sm leading-[1.45] text-texto-2">
            {t(
              "El Niño e La Niña são mudanças na temperatura do Oceano Pacífico que alteram o frio e a chuva no Sul do Brasil. Escolha uma opção para contar só os anos parecidos. O app não prevê qual fase virá.",
              "El Niño and La Niña are changes in Pacific Ocean temperature that alter cold and rain in southern Brazil. Pick one to count only similar years. The app does not predict which phase is coming.",
            )}
          </p>
          <Segmented
            label={t("Anos a considerar", "Years to consider")}
            cols={2}
            value={fase}
            onChange={onFase}
            options={FILTROS_ENSO.map((f) => ({
              id: f.id,
              label: t(f.pt, f.en),
              sub: `(${f.id === "todos" ? d.geada.totalAnos : d.anosPorFase[f.id as FaseEnso].length})`,
            }))}
          />
          {fase !== "todos" && (
            <p className="m-0 text-sm text-texto-2">{t(`Anos contados: ${anos.join(", ")}.`, `Years counted: ${anos.join(", ")}.`)}</p>
          )}
          {fase !== "todos" && anos.length < AMOSTRA_MINIMA && (
            <p className="m-0 rounded-xl bg-[#FBEBC8] p-3 text-sm text-[#7A520F]">
              {t(
                `Poucos anos (${anos.length}): um ano a mais ou a menos muda bastante o resultado. Leia com cautela.`,
                `Few seasons (${anos.length}): one more or one fewer year changes the result a lot. Read with caution.`,
              )}
            </p>
          )}
          {ult && (
            <p className="m-0 text-sm text-texto-2">
              {t(
                `Hoje a NOAA indica condições ${ultFase ? `de ${ultFase}` : "neutras"} (última leitura, ${TRIMESTRE_MESES[ult.trimestre]?.pt ?? ult.trimestre}/${ult.ano}: ${ult.valor > 0 ? "+" : ""}${fmtNum(ult.valor, 2, lang)}). Não é uma previsão da próxima safra.`,
                `Today NOAA indicates ${ultFase ?? "neutral"} conditions (latest reading, ${TRIMESTRE_MESES[ult.trimestre]?.en ?? ult.trimestre} ${ult.ano}: ${ult.valor > 0 ? "+" : ""}${fmtNum(ult.valor, 2, lang)}). It is not a forecast for the coming season.`,
              )}
            </p>
          )}
        </section>

        <Evidencias local={local} d={d} dEf={dEf} baixada={baixada} filtroTexto={filtroTexto} params={params} backtest={backtest} />
        <Rodape local={local} />
      </div>
    </section>
  );
}
