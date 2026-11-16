"use client";

import type { BacktestView } from "@/lib/view-data";
import { Callout } from "@/components/ui/Callout";
import { Fonte } from "@/components/ui/Fonte";
import { TriangleAlert } from "lucide-react";
import { fmtData, fmtDia, fmtNum, useLang, useT } from "@/lib/i18n";

/** Teste retrospectivo: anos marcados pelo app × anomalia de produtividade do milho 2ª safra (IBGE PAM). */
export function ConfrontoIbge({ b }: { b: BacktestView }) {
  const t = useT();
  const lang = useLang();
  const pct = (x: number) => `${x > 0 ? "+" : ""}${fmtNum(x * 100, 1, lang)}%`;
  const linha = (rotulo: string, s: BacktestView["principal"]["qualquer"]) => (
    <li>
      <b>{rotulo}:</b> {t("anos marcados", "flagged years")} {pct(s.mMarc)} ({s.nMarc}) {t("contra", "vs")}{" "}
      {t("não marcados", "not flagged")} {pct(s.mNao)} ({s.nNao}) · p = {fmtNum(s.p, 2, lang)}
    </li>
  );
  return (
    <div>
      <h3 className="text-lg font-bold">
        {t("Os anos marcados produziram menos?", "Did the flagged years yield less?")}
      </h3>
      <p className="text-[13px] text-ink-faint">
        {t("Teste com dados reais de produtividade", "Reality check with real yield data")} · IBGE PAM
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {t(
          `Comparamos os anos que o app marca (soja em ${fmtDia(b.dataPrincipal, lang)}) com a produtividade do milho 2ª safra do IBGE (Pesquisa Agrícola Municipal), nos 3 municípios, sem o ganho de tecnologia ao longo dos anos (tendência linear). ${b.total} anos-município com pelo menos ${b.minAreaHa} ha colhidos.`,
          `We compared the years the app flags (soybean on ${fmtDia(b.dataPrincipal, lang)}) with IBGE's second-crop corn yield (Municipal Agricultural Survey), in the 3 municipalities, after removing the technology trend (linear). ${b.total} municipality-years with at least ${b.minAreaHa} ha harvested.`,
        )}
      </p>
      <Callout tom="cautela" icone={TriangleAlert} className="mt-3">
        <p className="text-sm">
        <b>{t("Resultado: sem diferença detectável. ", "Result: no detectable difference. ")}</b>
        {t(
          "Não conseguimos confirmar que os anos marcados tiveram produtividade menor. Os níveis do app descrevem com que frequência o evento climático ocorre na floração e enchimento do milho, não uma perda de produtividade prevista.",
          "We could not confirm that flagged years had lower yields. The app's levels describe how often the weather event occurs in the critical stage, not a predicted yield loss.",
        )}
        </p>
      </Callout>
      <ul className="mt-3 space-y-1 text-sm">
        {linha(t("Geada ou seca", "Frost or drought"), b.principal.qualquer)}
        {linha(t("Só geada", "Frost only"), b.principal.geada)}
        {linha(t("Só seca", "Drought only"), b.principal.seca)}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">
        {t(
          `Nas ${b.testes} comparações (8 datas de soja × 3 tipos de evento), ${b.significativos} teve p < 0,05; com tantos testes se esperaria cerca de ${fmtNum(b.esperadosPorAcaso, 1, lang)} só por acaso.`,
          `Across the ${b.testes} comparisons (8 soybean dates × 3 event types), ${b.significativos} had p < 0.05; with that many tests about ${fmtNum(b.esperadosPorAcaso, 1, lang)} would be expected by chance alone.`,
        )}
      </p>
      <Fonte className="mt-3">
        {t(
          "Por que o teste pode não enxergar o efeito: as produtividades municipais são estimativas (muitos valores redondos); a grade da NASA tem ~50 km; a data real de plantio varia entre lavouras; mais da metade dos anos é marcada (pouco contraste); e são poucos anos. O p-valor vem de permutação dentro de cada município. Não é uma prova de que o risco não existe, e sim de que este teste não o confirma.",
          "Why the test may miss the effect: municipal yields are estimates (many round values); the NASA grid is ~50 km; real planting dates vary between farms; more than half of the years are flagged (little contrast); and there are few years. The p-value comes from permutation within each municipality. It does not prove the risk is absent, only that this test does not confirm it.",
        )}{" "}
        {t("Dados do IBGE baixados em", "IBGE data downloaded on")} {fmtData(b.baixadoEm.slice(0, 10), lang)}.{" "}
        <a
          href="https://sidra.ibge.gov.br/tabela/839"
          target="_blank"
          rel="noreferrer"
        >
          {t("Fonte", "Source")}
        </a>
        .
      </Fonte>
    </div>
  );
}
