"use client";

import type { LocalView } from "@/lib/view-data";
import { Disclosure } from "@/components/ui/Disclosure";
import { Fonte } from "@/components/ui/Fonte";
import { fmtData, fmtNum, useLang, useT } from "@/lib/i18n";
import estacoesRes from "@/data/validacao_estacoes.json";
import ibgeRes from "@/data/validacao_ibge_sul.json";

const E = estacoesRes as unknown as {
  meta: { estacoes: number };
  diario: { viesDiasFrios: number };
  safra: { principal: { geada: { concordancia: number } } };
  relevo: { diferencaBaixadaC: number | null };
};
const I = ibgeRes as unknown as { meta: { municipios: number }; principal: { seca: { A: { d: number } } } };

export function Rodape({ local }: { local: LocalView }) {
  const t = useT();
  const lang = useLang();
  const n0 = (x: number) => fmtNum(x, 0, lang);
  const n1 = (x: number) => fmtNum(x, 1, lang);
  const pp = (x: number) => `${x > 0 ? "+" : ""}${fmtNum(x * 100, 1, lang)}%`;
  const g = E.safra.principal.geada;
  return (
    <footer className="mt-8 border-t border-line pb-10 pt-6 text-sm">
      <Disclosure titulo={t("Fontes e limitações", "Sources and limitations")}>
        <div className="flex flex-col gap-3">
          <Fonte>
            {t("Dados:", "Data:")} NASA POWER Daily API, community AG (T2M_MIN, PRECTOTCORR, GWETROOT),{" "}
            {fmtData(local.periodoDados.inicio, lang)} {t("a", "to")} {fmtData(local.periodoDados.fim, lang)},{" "}
            {t("baixados em", "downloaded on")} {fmtData(local.downloadedAt.slice(0, 10), lang)}.{" "}
            <a href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/" target="_blank" rel="noreferrer">
              API
            </a>
            . {t("Limiar de 3 °C: diferença abrigo–relva de 3–6 °C", "3 °C threshold: screen-to-grass difference of 3–6 °C")} (
            <a
              href="https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1084446/1/ID442832017CBAGRO20MM398.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Embrapa Trigo
            </a>
            ,{" "}
            <a
              href="https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1139138/1/BolAgroClimatico-dez21.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Embrapa
            </a>
            ,{" "}
            <a
              href="https://ojs.uel.br/revistas/uel/index.php/semagrarias/article/download/30322/24555/166627"
              target="_blank"
              rel="noreferrer"
            >
              Semina/UEL
            </a>
            ).
          </Fonte>
          <Fonte>
            {t(
              `Limitações: o NASA POWER é uma grade de ~50 km (elevação média da célula: ${local.elevacaoGradeM ?? "?"} m) e a temperatura é do ar a 2 m, não da planta. Comparado a ${E.meta.estacoes} estações do INMET, concordou em ${n0(g.concordancia)}% das safras sobre geada na flor do milho (soja em 20/10), mas fica ${n1(E.diario.viesDiasFrios)} °C mais quente nos dias frios e perde parte das geadas fracas. Fases das culturas e limiares são hipóteses a calibrar. O ajuste de baixada usa +1 °C; o teste com estações mediu ${n1(Math.abs(E.relevo.diferencaBaixadaC ?? 0))} °C, e o relevo do talhão pode ser medido pelo GPS na aba Mais (Copernicus DEM 90 m). O histórico não é previsão do tempo: só o cartão “Posso plantar esta semana?” usa previsão; testada contra estações, ela acerta melhor de 1 a 3 dias antes e pouco para a semana inteira. Nos anos marcados com seca, o milho safrinha rendeu ${pp(I.principal.seca.A.d)} (${n0(I.meta.municipios)} municípios, IBGE), mas contando cada ano uma vez a diferença ainda não é conclusiva; para geada com soja em 20/10 não houve diferença. Detalhes em “Testes com dados reais”. Ferramenta de apoio: a decisão é do agricultor com o técnico.`,
              `Limitations: NASA POWER is a ~50 km grid (mean cell elevation: ${local.elevacaoGradeM ?? "?"} m) and temperature is 2 m air temperature, not at the plant. Against ${E.meta.estacoes} INMET stations it agreed in ${n0(g.concordancia)}% of seasons on frost at corn flowering (soybeans on Oct 20), but runs ${n1(E.diario.viesDiasFrios)} °C warmer on cold days and misses some light frosts. Crop stages and thresholds are hypotheses to calibrate. The lowland adjustment uses +1 °C; the station test measured ${n1(Math.abs(E.relevo.diferencaBaixadaC ?? 0))} °C, and each plot’s terrain can be measured by GPS in the More tab (Copernicus DEM 90 m). The history is not a weather forecast: only the “Can I plant this week?” card uses a forecast; tested against stations, it does better 1–3 days ahead and poorly for the whole week. In years flagged for drought, second-crop corn yielded ${pp(I.principal.seca.A.d)} (${n0(I.meta.municipios)} municipalities, IBGE), but counting each year once the difference is not yet conclusive; for frost with soybeans on Oct 20 there was no difference. Details in “Tests with real-world data”. A support tool: the decision belongs to the farmer together with the technician.`,
            )}
          </Fonte>
        </div>
      </Disclosure>
      <Fonte className="mt-4">
        {t(
          "Ferramenta de apoio à decisão: não substitui o agricultor nem o agrônomo. Feito para o NASA Space Apps Challenge 2026.",
          "Decision-support tool: it does not replace the farmer or the agronomist. Built for the NASA Space Apps Challenge 2026.",
        )}
      </Fonte>
    </footer>
  );
}
