"use client";

import type { DataView, LocalView } from "@/lib/view-data";
import { Fonte } from "@/components/ui/Fonte";
import { fmtData, fmtDia, fmtNum, useLang, useT } from "@/lib/i18n";

export function Prova2026({ local, d, limite }: { local: LocalView; d: DataView; limite: number }) {
  const t = useT();
  const lang = useLang();
  const p = local.prova2026;
  const app2026 = {
    geada: d.geada.anos.includes(2026),
    geadaBaixada: d.geadaBaixada.anos.includes(2026),
    seca: d.seca.anos.includes(2026),
  };
  const simNao = (b: boolean) => (b ? t("sim", "yes") : t("não", "no"));
  return (
    <div>
      <h3 className="text-lg font-bold">
        {t("O que o satélite viu na safrinha 2026", "What the satellite saw in the 2026 second crop")} · {local.nome}
      </h3>
      {!p.disponivel ? (
        <p className="mt-3 text-ink-muted">
          {t(
            "Os dados diários de 2026 ainda não estão disponíveis no NASA POWER para este local.",
            "Daily 2026 data are not yet available in NASA POWER for this location.",
          )}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-frost-soft p-4 text-frost-ink">
            <p className="text-[13px] font-semibold uppercase tracking-wide">
              NASA POWER · {t("dados diários", "daily data")}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <b>{t("Umidade do solo na raiz (GWETROOT), abril/2026:", "Root-zone soil moisture (GWETROOT), April 2026:")}</b>{" "}
                {fmtNum(p.soloAbril2026 ?? 0, 2, lang)} ({t("média", "mean")} 1981–2025: {fmtNum(p.soloAbrilMedia, 2, lang)}).{" "}
                {t(
                  `${p.soloAbrilRank}º abril mais seco em ${p.soloAbrilAnos} anos.`,
                  `April 2026 ranks #${p.soloAbrilRank} driest out of ${p.soloAbrilAnos} years.`,
                )}
              </li>
              <li>
                <b>{t("Chuva em abril/2026:", "Rainfall in April 2026:")}</b> {p.chuvaAbril2026} mm ({t("média", "mean")}{" "}
                1981–2025: {p.chuvaAbrilMedia} mm).
                {p.chuvaAbril2026 !== null && p.chuvaAbril2026 > p.chuvaAbrilMedia && (
                  <>
                    {" "}
                    {t(
                      "A chuva total ficou acima da média; o solo, mesmo assim, ficou seco.",
                      "Total rain was above average; the soil was still dry.",
                    )}
                  </>
                )}
              </li>
              {p.minMaio2026 !== null && p.minMaio2026Data && (
                <li>
                  <b>{t("Menor temperatura do ar (2 m) em maio/2026:", "Lowest 2 m air temperature in May 2026:")}</b>{" "}
                  {fmtNum(p.minMaio2026, 1, lang)} °C {t("em", "on")} {fmtData(p.minMaio2026Data, lang)}.
                </li>
              )}
              {p.minJunho2026 !== null && p.minJunho2026Data && (
                <li>
                  <b>{t("Em junho/2026:", "In June 2026:")}</b> {fmtNum(p.minJunho2026, 1, lang)} °C {t("em", "on")}{" "}
                  {fmtData(p.minJunho2026Data, lang)}.
                </li>
              )}
              {p.diasFrioMaioJunho2026 !== null && (
                <li>
                  <b>
                    {t(
                      `Dias com mínima ≤ ${limite} °C em maio e junho/2026:`,
                      `Days with minimum ≤ ${limite} °C in May and June 2026:`,
                    )}
                  </b>{" "}
                  {p.diasFrioMaioJunho2026}.
                </li>
              )}
              {local.trigo.minimaJanela2026 !== null && (
                <li>
                  <b>
                    {t(
                      `Janela do espigamento do trigo (${fmtDia(local.trigo.janela.inicio, lang)}–${fmtDia(local.trigo.janela.fim, lang)}/2026):`,
                      `Wheat heading window (${fmtDia(local.trigo.janela.inicio, lang)}–${fmtDia(local.trigo.janela.fim, lang)}, 2026):`,
                    )}
                  </b>{" "}
                  {t("menor mínima", "lowest minimum")} {fmtNum(local.trigo.minimaJanela2026, 1, lang)} °C →{" "}
                  {local.trigo.minimaJanela2026 <= limite
                    ? t(`geada ≤ ${limite} °C.`, `frost ≤ ${limite} °C.`)
                    : t(`sem geada ≤ ${limite} °C. `, `no frost ≤ ${limite} °C. `)}
                  {t(
                    "Atenção: o relato do Deral sobre o trigo é de maio, com a lavoura ainda em fase vegetativa; esta janela é posterior e, portanto, não é testada por ele.",
                    "Note: the Deral report on wheat is from May, with the crop still vegetative; this window comes later, so it is not tested by that report.",
                  )}
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-xl bg-drought-soft p-4 text-drought-ink">
            <p className="text-[13px] font-semibold uppercase tracking-wide">
              Deral · {t("relatos de campo", "field reports")}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <b>{t("Abril/2026:", "April 2026:")}</b>{" "}
                {t(
                  "estiagem e calor afetaram o feijão e o milho da safra 2025/26 no Paraná.",
                  "drought and heat hit the beans and corn of the 2025/26 crop in Paraná.",
                )}{" "}
                <a
                  className="underline underline-offset-2"
                  href="https://revistacultivar.com.br/noticias/pr-safra-2025-26-estiagem-e-calor-afetam-feijao-e-milho"
                  target="_blank"
                  rel="noreferrer"
                >
                  Revista Cultivar, {t("9/4/2026", "Apr 9, 2026")}
                </a>
              </li>
              <li>
                <b>{t("Maio/2026:", "May 2026:")}</b>{" "}
                {t(
                  "geadas queimaram folhas do milho safrinha em baixadas; o feijão de 2ª safra teve perdas significativas; o trigo não teve dano significativo.",
                  "frosts burned second-crop corn leaves in lowlands; second-crop beans had significant losses; wheat had no significant damage.",
                )}{" "}
                <a
                  className="underline underline-offset-2"
                  href="https://revistacultivar.com.br/noticias/pr-safra-2025-26-milho-e-feijao-sofrem-impacto-das-geadas"
                  target="_blank"
                  rel="noreferrer"
                >
                  Revista Cultivar, {t("19/5/2026", "May 19, 2026")}
                </a>
              </li>
            </ul>
            <p className="mt-2 text-[13px]">
              {t(
                "Deral = Departamento de Economia Rural da Secretaria de Agricultura do Paraná.",
                "Deral = Rural Economy Department of the Paraná state agriculture secretariat.",
              )}
            </p>
          </div>
          <div className="rounded-xl bg-surface-2 p-4 md:col-span-2">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
              {t("O que o app marca para 2026", "What the app flags for 2026")} · {t("soja em", "soybean on")}{" "}
              {fmtDia(d.dataSoja, lang)}
            </p>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
              <li>
                {t(`Geada na floração e enchimento (≤ ${limite} °C):`, `Frost in the critical stage (≤ ${limite} °C):`)}{" "}
                <b>{simNao(app2026.geada)}</b>
              </li>
              <li>
                {t(`Geada em baixada (≤ ${limite + 1} °C):`, `Frost in a lowland (≤ ${limite + 1} °C):`)}{" "}
                <b>{simNao(app2026.geadaBaixada)}</b>
              </li>
              <li>
                {t("Seca na floração e enchimento:", "Drought in the critical stage:")} <b>{simNao(app2026.seca)}</b>
              </li>
            </ul>
          </div>
        </div>
      )}
      <div className="mt-3">
        <Fonte>
          {t(
            `Dados POWER até ${fmtData(p.ultimaData, lang)}. Grade de ~50 km; temperatura do ar a 2 m, não na superfície. Relatos do Deral são regionais, não medições no ponto do mapa. O resultado é mostrado como sai, bom ou ruim.`,
            `POWER data up to ${fmtData(p.ultimaData, lang)}. ~50 km grid; 2 m air temperature, not surface temperature. Deral reports are regional, not measurements at the map point. The result is shown as it comes out, good or bad.`,
          )}
        </Fonte>
      </div>
    </div>
  );
}
