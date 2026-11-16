"use client";

import { useEffect, useRef } from "react";
import type { DataView, LocalView } from "@/lib/view-data";
import { nivelPorFreq, type Nivel } from "@/components/ui/NivelBadge";
import {
  Broto,
  IcColheita,
  IcEscudo,
  IcFlor,
  IcGeada,
  IcMilho,
  IcPin,
  IcSatelite,
  IcSoja,
  IcSol,
  IcSolPequeno,
} from "@/components/wh/Arte";
import { AbasModo, Coluna, Grupo } from "@/components/wh/Moldura";
import { emDez, fraseDez, melhorDataGeada, mesAbrev, pior } from "@/components/wh/modelo";
import { fmtDia, useLang, useT } from "@/lib/i18n";

export const LINK_ZARC = "https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f";

const PILULA: Record<Nivel, { fundo: string; cor: string; ponto: string; pt: string; en: string }> = {
  Alto: { fundo: "#FDE3D3", cor: "#9A3D0B", ponto: "#B4480E", pt: "Risco alto para o milho", en: "High risk for the corn" },
  Médio: { fundo: "#FBEBC8", cor: "#7A520F", ponto: "#B7791F", pt: "Risco médio para o milho", en: "Medium risk for the corn" },
  Baixo: { fundo: "#DDF0DC", cor: "#1F5A34", ponto: "#2E7D4A", pt: "Risco baixo para o milho", en: "Low risk for the corn" },
};

/** Cores da barra/etiqueta de cada data pelo número de anos em 10. */
function corDaBarra(n: number, sel: boolean) {
  if (n <= 1) return { barra: sel ? "#4E9A43" : "#7CC46A", rotulo: "#2E7D4A", pilula: "#2E7D4A" };
  if (n === 2) return { barra: sel ? "#7CC46A" : "#A8D88F", rotulo: "#2E7D4A", pilula: "#2E7D4A" };
  if (n === 3) return { barra: sel ? "#E0A33A" : "#F2C46A", rotulo: "#9A6A12", pilula: "#9A6A12" };
  return { barra: sel ? "#E07A3E" : "#E9A17A", rotulo: "#9A3D0B", pilula: "#B4480E" };
}

/** Rola uma faixa horizontal para mostrar o item escolhido, sem mexer na página. */
function useRolarAte(idx: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = ref.current;
    const el = c?.children[idx] as HTMLElement | undefined;
    if (!c || !el) return;
    const esq = el.offsetLeft - c.offsetLeft;
    const dir = esq + el.clientWidth;
    if (esq < c.scrollLeft) c.scrollTo({ left: esq, behavior: "smooth" });
    else if (dir > c.scrollLeft + c.clientWidth) c.scrollTo({ left: dir - c.clientWidth, behavior: "smooth" });
  }, [idx]);
  return ref;
}

const PESO: Record<Nivel, number> = { Baixo: 0, Médio: 1, Alto: 2 };

const PILULA_ESCOLHA =
  "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-none bg-campo px-3.5 text-[15px] font-extrabold text-texto";

function Abre() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function VouPlantar({
  local,
  datas,
  idx,
  onIdx,
  baixada,
  onBaixada,
  onTrocarLocal,
  onTrocarData,
  onModo,
  onVerCalendario,
  semana,
  rodape,
}: {
  local: LocalView;
  /** Datas com o filtro de El Niño/La Niña já aplicado. */
  datas: DataView[];
  idx: number;
  onIdx: (i: number) => void;
  baixada: boolean;
  onBaixada: (b: boolean) => void;
  onTrocarLocal: () => void;
  onTrocarData: () => void;
  onModo: (m: "vou" | "ja") => void;
  onVerCalendario: () => void;
  /** Cartão "Posso plantar esta semana?". */
  semana?: React.ReactNode;
  /** Conteúdo extra no fim da tela (ex.: botão de compartilhar). */
  rodape?: React.ReactNode;
}) {
  const t = useT();
  const lang = useLang();
  const dia = (x: string) => fmtDia(x, lang);
  const g = (x: DataView) => (baixada ? x.geadaBaixada : x.geada);
  const d = datas[idx];
  const geada = g(d);
  const ns = emDez(d.seca);
  const nivel = pior(nivelPorFreq(geada.frequencia), nivelPorFreq(d.seca.frequencia));
  const pil = PILULA[nivel];
  const nG = nivelPorFreq(geada.frequencia);
  const nS = nivelPorFreq(d.seca.frequencia);
  const causa = nivel === "Baixo" ? null : nG === nS ? t("geada e seca", "frost and drought") : PESO[nS] > PESO[nG] ? t("seca", "drought") : t("geada", "frost");
  const anel = Math.max(geada.anosComEvento > 0 ? 12 : 0, geada.frequencia * 490);
  const ate = melhorDataGeada(datas, baixada);
  const alvo = datas[ate];
  const ok = idx <= ate;
  const secaSobe = d.seca.anosComEvento < alvo.seca.anosComEvento;
  const escala = Math.max(5, ...datas.map((x) => emDez(g(x)).n));
  const refBarras = useRolarAte(idx);
  const ep = local.epocaGeada;
  const nomeLocal = local.personalizado || /\(/.test(local.nome) ? local.nome : `${local.nome}, PR`;

  return (
    <>
      <Coluna>
      <Grupo ordem={1}>
      <section className="wh-in flex flex-col gap-3 rounded-3xl bg-white p-3 shadow-[0_6px_20px_rgba(20,35,26,.07)] lg:flex-row lg:items-center lg:gap-4 lg:[&>[role=tablist]]:w-[230px] lg:[&>[role=tablist]]:flex-none">
        <AbasModo modo="vou" onModo={onModo} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onTrocarLocal} aria-label={t(`Município: ${nomeLocal}. Trocar`, `Municipality: ${nomeLocal}. Change`)} className={PILULA_ESCOLHA}>
            <IcPin />
            {local.nome}
            <Abre />
          </button>
          <button type="button" onClick={onTrocarData} aria-label={t(`Soja em ${dia(d.dataSoja)}. Mudar data`, `Soybeans on ${dia(d.dataSoja)}. Change date`)} className={PILULA_ESCOLHA}>
            <IcSoja size={20} />
            {t("Soja", "Soy")} {dia(d.dataSoja)}
            <Abre />
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={baixada}
            onClick={() => onBaixada(!baixada)}
            className={`${PILULA_ESCOLHA} ${baixada ? "!bg-[#DCE8F6] text-[#2F5A92]" : ""}`}
          >
            {t("Baixada", "Lowland")}
            <span className="font-bold">{baixada ? t("sim", "yes") : t("não", "no")}</span>
          </button>
        </div>
      </section>

      <section
        aria-label={t("Resposta", "Answer")}
        aria-live="polite"
        className="wh-in relative flex flex-col items-center gap-3 overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#E4EEFA_0%,#F4F8FD_100%)] px-[18px] pb-[18px] pt-5 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:content-center lg:gap-x-10 lg:gap-y-4 lg:px-10 lg:py-9"
        style={{ animationDelay: ".1s" }}
      >
        <svg aria-hidden="true" width="390" height="120" viewBox="0 0 390 120" className="absolute -left-4 top-0 opacity-50">
          <g fill="none" stroke="#B9D2EE" strokeWidth="1.6" strokeLinecap="round">
            <path d="M40 20v14M33 27h14M35 22l10 10M45 22 35 32" />
            <path d="M330 46v10M325 51h10M326.5 47.5l7 7M333.5 47.5l-7 7" />
            <path d="M300 14v8M296 18h8" />
          </g>
        </svg>
        <div className="relative flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 rounded-full px-3.5 py-1.5 text-center text-[13px] font-extrabold lg:col-start-2 lg:row-start-1 lg:flex-nowrap lg:self-end lg:justify-self-start lg:whitespace-nowrap" style={{ background: pil.fundo, color: pil.cor }}>
          <span className="size-2 rounded-full" style={{ background: pil.ponto }} />
          {t(pil.pt, pil.en)}
          {causa && <span className="font-bold">· {t(`por causa da ${causa}`, `due to ${causa}`)}</span>}
        </div>
        <p className="relative m-0 hidden text-[17px] leading-[1.45] text-texto lg:col-start-2 lg:row-start-2 lg:block">
          {t(
            `Com a soja em ${dia(d.dataSoja)}, o milho safrinha floresce perto de ${dia(d.floracao)}. O anel mostra em quantas safras a geada pegou essa flor${baixada ? " (lavoura em baixada)" : ""}.`,
            `With soybeans on ${dia(d.dataSoja)}, the second-crop corn flowers around ${dia(d.floracao)}. The ring shows in how many seasons frost hit that flowering${baixada ? " (lowland field)" : ""}.`,
          )}
        </p>
        <div className="relative size-[210px] lg:col-start-1 lg:row-span-3 lg:row-start-1">
          <svg aria-hidden="true" width="210" height="210" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="wh-g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7FB3F0" />
                <stop offset="1" stopColor="#3E6EA8" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="78" fill="#FFFFFF" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="#D6E4F5" strokeWidth="18" />
            {anel > 0 && (
              <circle
                key={`${idx}-${baixada}-${anel}`}
                className="wh-ring"
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="url(#wh-g1)"
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={`${anel} 490`}
                transform="rotate(-90 100 100)"
                style={{ ["--wh-len" as string]: anel }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <IcGeada size={30} />
            <span className="text-[52px] font-black leading-none tracking-[-0.03em] text-texto">
              {fraseDez(geada, lang).replace("%", "")}
              <span className="text-2xl text-texto-2">%</span>
            </span>
            <span className="text-center text-sm font-extrabold leading-[1.15] text-[#33507A]">
              {t("risco de geada", "frost risk")}
              <br />
              {t("na flor do milho", "at corn flowering")}
            </span>
          </div>
        </div>
        <span className="relative flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-center text-sm font-bold text-texto lg:col-start-2 lg:row-start-3 lg:self-start lg:justify-self-start">
          <IcSatelite />
          {t(
            `Geada em ${geada.anosComEvento} das ${geada.totalAnos} safras${geada.periodo ? ` (${geada.periodo[0]}–${geada.periodo[1]})` : ""}${baixada ? ", baixada" : ""}`,
            `Frost in ${geada.anosComEvento} of ${geada.totalAnos} seasons${geada.periodo ? ` (${geada.periodo[0]}–${geada.periodo[1]})` : ""}${baixada ? ", lowland" : ""}`,
          )}
        </span>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="wh-in flex flex-col gap-2 rounded-[22px] bg-[#FFF4DC] p-3.5" style={{ animationDelay: ".15s" }}>
          <div className="flex items-center justify-between">
            <IcSol />
            <span className="text-[26px] font-black">
              {fraseDez(d.seca, lang).replace("%", "")}
              <span className="text-sm text-[#7A520F]">%</span>
            </span>
          </div>
          <span className="text-[15px] font-extrabold leading-[1.2]">{t("Seca na flor do milho", "Drought at corn flowering")}</span>
          <div className="flex gap-[3px]" role="img" aria-label={t(`Risco de seca: ${fraseDez(d.seca, lang)}`, `Drought risk: ${fraseDez(d.seca, lang)}`)}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="h-2 flex-1 rounded" style={{ background: i < ns.n ? "#E0A33A" : "#F2E2BC" }} />
            ))}
          </div>
        </div>
        <a
          href={LINK_ZARC}
          target="_blank"
          rel="noreferrer"
          className="wh-in flex flex-col gap-2 rounded-[22px] bg-[#E3F2E1] p-3.5 text-texto no-underline"
          style={{ animationDelay: ".2s" }}
        >
          <div className="flex items-center justify-between">
            <IcEscudo />
            <span className="text-[22px] font-black text-lavoura">›</span>
          </div>
          <span className="text-[15px] font-extrabold leading-[1.2]">{t("Seguro e crédito", "Insurance and credit")}</span>
          <span className="text-[13px] leading-[1.35] text-lavoura-escura">
            {t(`Confira se ${dia(d.dataSoja)} está no calendário oficial (ZARC)`, `Check that ${dia(d.dataSoja)} is in the official calendar (ZARC)`)}
          </span>
        </a>
      </div>

      </Grupo>

      <Grupo ordem={3}>
      <section className="wh-in flex flex-col gap-3.5 rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]" style={{ animationDelay: ".3s" }}>
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-lg font-black tracking-normal">{t("E se eu plantar em outra data?", "What if I plant on another date?")}</h2>
          <span className="text-sm text-texto-2">{t("Risco de geada na flor do milho em cada data", "Frost risk at corn flowering for each date")}</span>
        </div>
        <div
          ref={refBarras}
          className="wh-scroll grid grid-flow-col gap-2.5 overflow-x-auto [grid-auto-columns:calc((100%-50px)/6)] lg:[grid-auto-columns:calc((100%-110px)/12)]"
        >
          {datas.map((x, i) => {
            const sel = i === idx;
            const n = emDez(g(x));
            const c = corDaBarra(n.n, sel);
            const h = (Math.max(n.n, 0.4) / escala) * 110;
            return (
              <button
                key={x.dataSoja}
                type="button"
                onClick={() => onIdx(i)}
                aria-label={t(
                  `Soja em ${dia(x.dataSoja)}: geada em ${g(x).anosComEvento} de ${g(x).totalAnos} safras`,
                  `Soybeans on ${dia(x.dataSoja)}: frost in ${g(x).anosComEvento} of ${g(x).totalAnos} seasons`,
                )}
                aria-pressed={sel}
                className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0"
              >
                <span className="flex h-[150px] w-full flex-col items-center justify-end gap-1.5">
                  {sel ? (
                    <span className="rounded-full px-2 py-px text-sm font-black text-white" style={{ background: c.pilula }}>
                      {fraseDez(g(x), lang)}
                    </span>
                  ) : (
                    <span className="text-sm font-extrabold" style={{ color: c.rotulo }}>
                      {fraseDez(g(x), lang)}
                    </span>
                  )}
                  <span
                    key={`${x.dataSoja}-${baixada}`}
                    className="wh-bar block w-full rounded-xl"
                    style={{
                      height: h,
                      background: c.barra,
                      animationDelay: `${i * 0.05}s`,
                      boxShadow: sel ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${c.barra}` : undefined,
                    }}
                  />
                </span>
                <span className={`text-sm ${sel ? "font-black text-texto" : "font-bold text-texto-2"}`}>{dia(x.dataSoja)}</span>
              </button>
            );
          })}
        </div>
        <p className="m-0 text-[15px] leading-[1.45] text-texto-2">
          {t("Quanto mais cedo a soja, mais cedo o milho floresce, longe do frio.", "The earlier the soybeans, the earlier the corn flowers, away from the cold.")}
        </p>
      </section>
      </Grupo>
      </Coluna>

      <Coluna lado>
      <Grupo ordem={2}>
      {semana}

      <section className="wh-in flex items-start gap-3 rounded-3xl bg-[#E6F4E4] p-4" style={{ animationDelay: ".25s" }}>
        <Broto size={52} className="flex-none" />
        <div className="flex flex-1 flex-col gap-2.5 rounded-[18px_18px_18px_4px] bg-white px-3.5 py-3">
          <span className="text-xs font-extrabold text-lavoura">{t("Dica do Broto", "Broto’s tip")}</span>
          {ok ? (
            <span className="text-base font-bold leading-[1.35]">
              {t("Boa data! Com soja em ", "Good date! With soybeans on ")}
              <strong>{dia(d.dataSoja)}</strong>
              {t(", o risco de geada no milho fica em ", ", the frost risk on the corn stays at ")}
              <strong>{fraseDez(geada, lang)}</strong>
              {t(", o menor entre as datas.", ", the lowest of all dates.")}
            </span>
          ) : (
            <span className="text-base font-bold leading-[1.35]">
              {t("Plante a soja em ", "Plant soybeans on ")}
              <strong>{dia(alvo.dataSoja)}</strong>
              {t(" e o risco de geada no milho cai para ", " and the frost risk on the corn drops to ")}
              <strong>{fraseDez(g(alvo), lang)}</strong>.
            </span>
          )}
          {!ok && secaSobe && (
            <span className="flex items-start gap-1.5 rounded-xl bg-[#FFF4DC] px-2.5 py-2 text-sm leading-[1.35] text-[#7A520F]">
              <IcSolPequeno />
              {t(
                `Mas nessa data o risco de seca sobe para ${fraseDez(alvo.seca, lang)}. Veja os dois antes de decidir.`,
                `But on that date the drought risk rises to ${fraseDez(alvo.seca, lang)}. Weigh both before deciding.`,
              )}
            </span>
          )}
          {!ok && (
            <button
              type="button"
              onClick={() => {
                onIdx(ate);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="min-h-11 cursor-pointer self-start rounded-full border-none bg-lavoura px-[18px] text-sm font-extrabold text-white"
            >
              {t(`Ver ${dia(alvo.dataSoja)}`, `See ${dia(alvo.dataSoja)}`)}
            </button>
          )}
        </div>
      </section>
      </Grupo>

      <Grupo ordem={4}>
      <section className="wh-in flex flex-col gap-3.5 rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]" style={{ animationDelay: ".35s" }}>
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-lg font-black tracking-normal">{t("Sua safra", "Your season")}</h2>
          <button type="button" onClick={onVerCalendario} className="min-h-11 cursor-pointer border-none bg-transparent text-sm font-extrabold text-lavoura">
            {t("Ver calendário ›", "See calendar ›")}
          </button>
        </div>
        <div className="relative grid grid-cols-5 text-center">
          <div className="absolute left-8 right-8 top-[25px] border-t-[2.5px] border-dashed border-[#D6CFBE]" />
          {(
            [
              { ic: <IcSoja />, fundo: "#E3F2E1", nome: t("Soja", "Soybean"), quando: dia(d.dataSoja) },
              { ic: <IcColheita />, fundo: "#FBEFD2", nome: t("Colheita", "Harvest"), quando: dia(d.colheitaSoja) },
              { ic: <IcMilho />, fundo: "#FBEFD2", nome: t("Milho", "Corn"), quando: dia(d.plantioMilho) },
              { ic: <IcFlor />, fundo: "#FDE3D3", nome: t("Flor", "Flowering"), quando: dia(d.faseInicio), cor: "#9A3D0B", anel: true },
              {
                ic: <IcGeada size={26} />,
                fundo: "#DCE8F6",
                nome: t("Geada", "Frost"),
                quando: ep ? `${mesAbrev(Number(ep.inicio.slice(0, 2)) - 1, lang)}–${mesAbrev(Number(ep.fim.slice(0, 2)) - 1, lang)}` : "—",
                cor: "#2F5A92",
              },
            ] as { ic: React.ReactNode; fundo: string; nome: string; quando: string; cor?: string; anel?: boolean }[]
          ).map((m) => (
            <div key={m.nome} className="relative flex flex-col items-center gap-1.5">
              <span
                className="flex size-[50px] items-center justify-center rounded-full"
                style={{ background: m.fundo, boxShadow: m.anel ? "0 0 0 3px #FFFFFF, 0 0 0 5px #E07A3E" : undefined }}
              >
                {m.ic}
              </span>
              <span className="text-sm font-extrabold" style={{ color: m.cor }}>
                {m.nome}
              </span>
              <span className="text-[13px]" style={{ color: m.cor ?? "#4A5A50" }}>
                {m.quando}
              </span>
            </div>
          ))}
        </div>
      </section>

      {rodape}
      </Grupo>
      </Coluna>
    </>
  );
}
