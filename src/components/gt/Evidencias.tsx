"use client";

import { useEffect, useRef, useState } from "react";
import { Snowflake, X } from "lucide-react";
import type { BacktestView, DataView, LocalView } from "@/lib/view-data";
import type { EngineParams } from "@/lib/engine/index.ts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Fonte } from "@/components/ui/Fonte";
import { BlocoRelevo } from "@/components/gt/BlocoRelevo";
import { CampoDescoberto } from "@/components/gt/CampoDescoberto";
import { CardRisco } from "@/components/gt/CardRisco";
import { ConfrontoIbge } from "@/components/gt/ConfrontoIbge";
import { Prova2026 } from "@/components/gt/Prova2026";
import { fmtDia, useLang, useT } from "@/lib/i18n";

type Id = "anos" | "safra2026" | "solo" | "relevo" | "ibge" | "metodo";

export function Evidencias({
  local,
  d,
  dEf,
  baixada,
  filtroTexto,
  params,
  backtest,
}: {
  local: LocalView;
  d: DataView;
  dEf: DataView;
  baixada: boolean;
  filtroTexto: string;
  params: EngineParams;
  backtest: BacktestView;
}) {
  const t = useT();
  const lang = useLang();
  const dia = (x: string) => fmtDia(x, lang);
  const [ativo, setAtivo] = useState<Id | null>(null);
  const painel = useRef<HTMLDivElement>(null);

  const itens: { id: Id; pt: string; en: string; lpt: string; len: string; mostrar: boolean }[] = [
    { id: "anos", pt: "Em quais anos aconteceu", en: "Which years it happened", lpt: "Ano a ano, desde 1981", len: "Year by year since 1981", mostrar: true },
    { id: "safra2026", pt: "Safrinha 2026", en: "2026 second crop", lpt: "O que o satélite viu este ano", len: "What the satellite saw this year", mostrar: !local.personalizado },
    { id: "solo", pt: "Solo descoberto", en: "Bare soil", lpt: "Quando o campo fica sem cultura", len: "When the field has no crop", mostrar: true },
    { id: "relevo", pt: "Relevo", en: "Relief", lpt: "Altitude e baixadas (NASA SRTM)", len: "Elevation and lowlands (NASA SRTM)", mostrar: local.relevo?.pontoM != null },
    { id: "ibge", pt: "Teste com o IBGE", en: "IBGE check", lpt: "Os anos marcados produziram menos?", len: "Did flagged years yield less?", mostrar: true },
    { id: "metodo", pt: "Glossário e método", en: "Glossary and method", lpt: "Palavras e hipóteses usadas", len: "Terms and assumptions", mostrar: true },
  ];
  const visiveis = itens.filter((i) => i.mostrar);
  // se o item aberto deixou de existir (ex.: trocou para município buscado), nada é mostrado
  const idAtivo = visiveis.some((i) => i.id === ativo) ? ativo : null;

  useEffect(() => {
    if (idAtivo) painel.current?.scrollIntoView({ block: "nearest" });
  }, [idAtivo]);

  const geada = baixada ? dEf.geadaBaixada : dEf.geada;
  const limiteAtual = params.limiteGeadaC + (baixada ? params.ajusteBaixadaC : 0);
  const p = params;

  const GLOSSARIO = [
    ["Safrinha", "Second-crop corn (safrinha)", "É o milho plantado logo depois da colheita da soja, na mesma terra.", "Corn planted right after the soybean harvest, on the same field."],
    ["Geada", "Frost", "Contamos como geada quando a temperatura mínima do ar (a 2 m do chão) chega a 3 °C ou menos. Perto disso a planta já pode congelar. Geada forte: 1 °C ou menos.", "We count frost when the minimum air temperature (2 m above ground) reaches 3 °C or less. Near that, the plant itself can already freeze. Strong frost: 1 °C or less."],
    ["Seca e veranico", "Drought and dry spell (veranico)", "Veranico é um período de dias secos no meio da época de chuva. Contamos como seca 15 dias seguidos quase sem chuva, ou solo bem mais seco que o normal para a época.", "A veranico is a run of dry days in the middle of the rainy season. We count drought as 15 days in a row with almost no rain, or soil much drier than normal for the time of year."],
    ["Floração e enchimento", "Critical stage (flowering and grain fill)", "É a fase em que o milho mais sofre com frio e falta de água, mais ou menos de 55 a 100 dias depois que o milho é plantado.", "The stage when corn suffers most from cold and lack of water, about 55 to 100 days after the corn is planted."],
    ["Baixada", "Lowland", "Terreno baixo, onde o ar frio se acumula nas noites calmas. Ligue a chave “Lavoura em baixada” se a sua lavoura é assim.", "Low ground where cold air pools on calm nights. Turn on “Field in a lowland” if your field is like that."],
    ["ZARC", "ZARC", "Zoneamento Agrícola de Risco Climático, do Ministério da Agricultura. Define as datas de plantio permitidas para crédito e seguro. Confira a do seu município.", "Brazil's agricultural climate-risk zoning (Ministry of Agriculture). It sets the planting dates allowed for credit and crop insurance. Check your municipality's."],
  ] as const;

  const conteudo = (id: Id) => {
    switch (id) {
      case "anos":
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-muted">
              <b className="text-ink">{t("Fase do milho contada:", "Corn stage counted:")}</b>{" "}
              {t(
                `floração e enchimento de grãos, de ${dia(dEf.faseInicio)} a ${dia(dEf.faseFim)} (milho plantado em ${dia(dEf.plantioMilho)}).`,
                `flowering and grain fill, ${dia(dEf.faseInicio)} to ${dia(dEf.faseFim)} (corn planted on ${dia(dEf.plantioMilho)}).`,
              )}{" "}
              <b className="text-ink">{t("Risco:", "Risk:")}</b>{" "}
              {t("Baixo = até 1 ano em 10 · Médio = 2 ou 3 · Alto = 4 ou mais.", "Low = up to 1 year in 10 · Medium = 2 or 3 · High = 4 or more.")}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <CardRisco
                titulo={
                  baixada
                    ? t("Geada na floração e enchimento · baixada", "Frost in the critical stage · lowland")
                    : t("Geada na floração e enchimento", "Frost in the critical stage")
                }
                tipo="geada"
                r={geada}
                filtro={filtroTexto}
                regra={t(
                  `Ano com geada = em algum dia entre ${dia(d.faseInicio)} e ${dia(d.faseFim)} a temperatura mínima do ar chegou a ${limiteAtual} °C ou menos (medida a 2 m do chão; com ${p.limiteGeadaC} °C no ar, a planta já pode congelar, segundo a Embrapa).`,
                  `Frost year = 2 m air minimum ≤ ${limiteAtual} °C on any day between ${dia(d.faseInicio)} and ${dia(d.faseFim)}. ${p.limiteGeadaC} °C at screen height ≈ frost at grass level (Embrapa).`,
                )}
                extra={
                  baixada ? (
                    <div className="flex gap-2 rounded-xl bg-frost-soft p-3 text-sm text-frost-ink">
                      <Snowflake className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <p>
                        {t(
                          `Baixadas acumulam ar frio em noites calmas. Usamos +${p.ajusteBaixadaC} °C no limite (hipótese a calibrar); o risco local pode ser ainda maior. Sem baixada: ${dEf.geada.anosComEvento} de ${dEf.geada.totalAnos}.`,
                          `Lowlands trap cold air on calm nights. We add +${p.ajusteBaixadaC} °C to the limit (hypothesis to calibrate); local risk may be even higher. Without lowland: ${dEf.geada.anosComEvento} of ${dEf.geada.totalAnos}.`,
                        )}
                      </p>
                    </div>
                  ) : null
                }
              />
              <CardRisco
                titulo={t("Seca na floração e enchimento", "Drought in the critical stage")}
                tipo="seca"
                r={dEf.seca}
                filtro={filtroTexto}
                regra={t(
                  `Ano seco = ${p.sequenciaSecaDias} dias ou mais seguidos com menos de ${p.chuvaDiaSecoMm} mm de chuva por dia, OU solo na raiz entre os ${p.percentilUmidadeSolo}% mais secos da história para essas datas, entre ${dia(d.faseInicio)} e ${dia(d.faseFim)}. Como o solo é comparado com a própria história, cerca de 1 em cada 5 anos sempre aparece como solo seco.`,
                  `Drought year = ${p.sequenciaSecaDias}+ consecutive days with rain < ${p.chuvaDiaSecoMm} mm OR root-zone soil moisture among the ${p.percentilUmidadeSolo}% lowest for the same dates, between ${dia(d.faseInicio)} and ${dia(d.faseFim)}. Because soil is compared with its own history, about 1 in 5 years always shows up as dry soil.`,
                )}
              />
            </div>
          </div>
        );
      case "safra2026":
        return <Prova2026 local={local} d={d} limite={p.limiteGeadaC} />;
      case "solo":
        return <CampoDescoberto d={d} nomeLocal={local.nome} params={p} />;
      case "relevo":
        return <BlocoRelevo local={local} baixada={baixada} />;
      case "ibge":
        return <ConfrontoIbge b={backtest} />;
      case "metodo":
        return (
          <div className="flex flex-col gap-4">
            <dl className="space-y-3 text-sm text-ink-muted">
              {GLOSSARIO.map(([ptTermo, enTermo, ptTexto, enTexto]) => (
                <div key={ptTermo}>
                  <dt className="font-semibold text-ink">{t(ptTermo, enTermo)}</dt>
                  <dd>{t(ptTexto, enTexto)}</dd>
                </div>
              ))}
            </dl>
            <Fonte>
              {t(
                `Hipóteses a validar com agronomia/ZARC: soja ${p.cicloSoja} dias, intervalo ${p.intervalo} dias, floração e enchimento do milho de ${p.faseCriticaInicio} a ${p.faseCriticaFim} dias após o plantio.`,
                `Hypotheses to validate with agronomy/ZARC: soybean ${p.cicloSoja} days, gap ${p.intervalo} days, corn critical stage from ${p.faseCriticaInicio} to ${p.faseCriticaFim} days after planting.`,
              )}
            </Fonte>
          </div>
        );
    }
  };

  const itemAtivo = visiveis.find((i) => i.id === idAtivo);

  return (
    <Card>
      <CardHeader eyebrow={t("Para quem quer conferir", "For those who want to check")} title={t("Provas e detalhes", "Evidence and details")} />
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {visiveis.map((i) => {
          const sel = i.id === idAtivo;
          return (
            <button
              key={i.id}
              type="button"
              aria-expanded={sel}
              aria-controls="painel-evidencia"
              onClick={() => setAtivo(sel ? null : i.id)}
              className={`flex min-h-16 flex-col justify-center rounded-xl border p-3 text-left ${
                sel ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span className="font-bold">{t(i.pt, i.en)}</span>
              <span className="text-sm text-ink-muted">{t(i.lpt, i.len)}</span>
            </button>
          );
        })}
      </div>
      <div id="painel-evidencia" ref={painel} className="mt-4">
        {itemAtivo && (
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-xl font-extrabold">{t(itemAtivo.pt, itemAtivo.en)}</h3>
              <Button variant="secondary" className="shrink-0 !px-3" onClick={() => setAtivo(null)}>
                <X className="size-5" aria-hidden="true" />
                {t("Fechar", "Close")}
              </Button>
            </div>
            {conteudo(itemAtivo.id)}
          </div>
        )}
      </div>
    </Card>
  );
}
