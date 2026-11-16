"use client";

import type { DataView } from "@/lib/view-data";
import { nivelPorFreq } from "@/components/ui/NivelBadge";
import { IcAlerta, IcEscudoPequeno, IcMilho, IcRelogio, IcSino, IcSoja, IcTrigo } from "@/components/wh/Arte";
import { AbasModo, Coluna, Grupo, LinhaEscolha } from "@/components/wh/Moldura";
import { LINK_ZARC } from "@/components/wh/VouPlantar";
import { anoDaSafra, dataNaSafra, diaLongo, diasEntre, fraseDez } from "@/components/wh/modelo";
import { fmtDia, useLang, useT } from "@/lib/i18n";

function Passo({
  n,
  icone,
  fundo,
  titulo,
  texto,
  ultimo = false,
  children,
}: {
  n: number;
  icone: React.ReactNode;
  fundo: string;
  titulo: string;
  texto: string;
  ultimo?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className={`flex gap-3.5 py-3.5 ${ultimo ? "" : "border-b border-divisor lg:border-b-0"}`}>
      <span className="relative flex size-12 flex-none items-center justify-center rounded-full" style={{ background: fundo }}>
        {icone}
        <span className="absolute -left-1 -top-1 flex size-[22px] items-center justify-center rounded-full bg-texto text-xs font-black text-white">
          {n}
        </span>
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-extrabold">{titulo}</span>
        <span className="text-[15px] leading-[1.4] text-texto-2">{texto}</span>
        {children}
      </div>
    </li>
  );
}

const ETIQUETA = "mt-1 self-start rounded-full bg-[#E3F2E1] px-3 py-[5px] text-sm font-extrabold text-lavoura-escura";

export function JaPlantei({
  d,
  baixada,
  cicloSoja,
  hoje,
  onModo,
  onMudarData,
  onRotacoes,
  rodape,
}: {
  d: DataView;
  baixada: boolean;
  cicloSoja: number;
  hoje: Date;
  onModo: (m: "vou" | "ja") => void;
  onMudarData: () => void;
  onRotacoes: () => void;
  /** Botões de compartilhar, no fim (celular) ou na coluna lateral (computador). */
  rodape?: React.ReactNode;
}) {
  const t = useT();
  const lang = useLang();
  const dia = (x: string) => fmtDia(x, lang);
  const geada = baixada ? d.geadaBaixada : d.geada;
  const plantio = dataNaSafra(d.dataSoja, anoDaSafra(hoje));
  const dias = diasEntre(plantio, hoje);
  const falta = dias < 0;
  const colhida = dias > cicloSoja;
  const feitos = Math.min(Math.max(dias, 0), cicloSoja);
  const anel = (feitos / cicloSoja) * 490;
  const baixo = nivelPorFreq(geada.frequencia) === "Baixo";

  return (
    <>
      <Coluna>
      <Grupo ordem={1}>
      <section className="wh-in flex flex-col gap-3.5 rounded-3xl bg-white p-4 shadow-[0_6px_20px_rgba(20,35,26,.07)] lg:flex-row lg:items-center lg:p-3 lg:[&>*:last-child]:flex-1 lg:[&>[role=tablist]]:w-[230px] lg:[&>[role=tablist]]:flex-none">
        <AbasModo modo="ja" onModo={onModo} />
        <LinhaEscolha
          alto={56}
          icone={
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[#E3F2E1]">
              <IcSoja size={22} />
            </span>
          }
          rotulo={t("Plantei a soja em", "I planted soybeans on")}
          valor={diaLongo(d.dataSoja, lang)}
          acao={t("Mudar", "Change")}
          onClick={onMudarData}
        />
      </section>
      </Grupo>
      <Grupo ordem={3}>
      <section className="wh-in flex items-center gap-3 rounded-[22px] bg-[#FDF0E7] p-4" style={{ animationDelay: ".15s" }}>
        <IcAlerta />
        <span className="text-base leading-[1.4] text-[#6B2C08]">
          {baixo
            ? t("Com esta data, a geada na flor do milho é rara: ", "With this date, frost at corn flowering is rare: ")
            : t("Com esta data, o risco de geada na flor do milho é de ", "With this date, the frost risk at corn flowering is ")}
          <strong>{fraseDez(geada, lang)}</strong>
          {baixo ? t(". Mesmo assim:", ". Even so:") : t(". Ainda dá pra diminuir:", ". You can still lower it:")}
        </span>
      </section>

      <ol
        className="wh-in m-0 flex list-none flex-col rounded-3xl bg-white px-4 py-1.5 shadow-[0_6px_20px_rgba(20,35,26,.05)] lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-6 lg:py-3"
        style={{ animationDelay: ".2s" }}
      >
        <Passo
          n={1}
          fundo="#FBEFD2"
          icone={<IcMilho size={26} />}
          titulo={t("Escolha um milho mais precoce", "Choose an earlier corn hybrid")}
          texto={t("Ele floresce antes e foge do frio de maio e junho.", "It flowers sooner and escapes the May–June cold.")}
        />
        <Passo
          n={2}
          fundo="#E3F2E1"
          icone={<IcRelogio />}
          titulo={t("Plante o milho logo após colher", "Plant the corn right after harvest")}
          texto={t("Cada semana de atraso empurra a flor para mais perto da geada.", "Each week of delay pushes flowering closer to frost.")}
        >
          <span className={ETIQUETA}>{t(`Meta: até ${dia(d.plantioMilho)}`, `Goal: by ${dia(d.plantioMilho)}`)}</span>
        </Passo>
        <Passo
          n={3}
          fundo="#E3F2E1"
          icone={<IcEscudoPequeno />}
          titulo={t("Faça o seguro do milho", "Insure the corn")}
          texto={t(
            `Confira se plantar até ${dia(d.plantioMilho)} fica dentro do calendário oficial (ZARC) do seu município.`,
            `Check that planting by ${dia(d.plantioMilho)} is within your municipality’s official calendar (ZARC).`,
          )}
        >
          <a href={LINK_ZARC} target="_blank" rel="noreferrer" className={`${ETIQUETA} no-underline`}>
            {t("Ver o calendário oficial ›", "See the official calendar ›")}
          </a>
        </Passo>
        <Passo
          n={4}
          fundo="#F4EBD2"
          icone={<IcTrigo />}
          titulo={t("Ou troque o milho por trigo", "Or swap the corn for wheat")}
          texto={t("Compare o risco de geada de cada opção.", "Compare the frost risk of each option.")}
          ultimo
        >
          <button
            type="button"
            onClick={onRotacoes}
            className="mt-1 min-h-11 cursor-pointer self-start border-none bg-transparent p-0 text-left text-[15px] font-extrabold text-lavoura"
          >
            {t("Ver o que plantar depois ›", "See what to plant next ›")}
          </button>
        </Passo>
      </ol>
      </Grupo>
      </Coluna>

      <Coluna lado>
      <Grupo ordem={2}>
      <section
        className="wh-in flex items-center gap-4 rounded-[28px] bg-[linear-gradient(180deg,#E3F2E1_0%,#F4FAF2_100%)] px-[18px] py-5"
        style={{ animationDelay: ".1s" }}
      >
        <div className="relative size-[140px] flex-none">
          <svg aria-hidden="true" width="140" height="140" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="wh-g2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#9BE36B" />
                <stop offset="1" stopColor="#2E7D4A" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="78" fill="#FFFFFF" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="#D2EACD" strokeWidth="20" />
            {anel > 0 && (
              <circle
                className="wh-ring"
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="url(#wh-g2)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={`${anel} 490`}
                transform="rotate(-90 100 100)"
                style={{ ["--wh-len" as string]: anel }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black leading-none">{feitos}</span>
            <span className="text-[13px] font-bold text-lavoura-escura">{t(`de ${cicloSoja} dias`, `of ${cicloSoja} days`)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xl font-black leading-[1.15]">
            {falta
              ? t("Sua soja ainda vai ser plantada", "Your soybeans are not planted yet")
              : colhida
                ? t("Hora de colher a soja", "Time to harvest the soybeans")
                : t("Sua soja está crescendo", "Your soybeans are growing")}
          </span>
          <span className="text-[15px] leading-[1.4] text-[#2E5A3B]">
            {falta ? (
              t(`Faltam ${-dias} dias para ${dia(d.dataSoja)}.`, `${-dias} days to go until ${dia(d.dataSoja)}.`)
            ) : (
              <>
                {t("Colheita perto de ", "Harvest around ")}
                <strong>{dia(d.colheitaSoja)}</strong>
                {t(". Daí, o milho entra.", ". Then the corn goes in.")}
              </>
            )}
          </span>
        </div>
      </section>
      </Grupo>
      <Grupo ordem={4}>
      <section className="wh-in flex items-center gap-3.5 rounded-3xl bg-ceu p-[18px]" style={{ animationDelay: ".25s" }}>
        <IcSino />
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-extrabold text-claro">{t("Avisar quando vier geada", "Warn me before frost")}</span>
          <span className="text-sm text-claro-2">{t("no WhatsApp, 3 dias antes", "on WhatsApp, 3 days ahead")}</span>
        </div>
        <span className="flex-none rounded-full border border-ceu-line px-3 py-1.5 text-[13px] font-bold text-broto">
          {t("Em breve", "Coming soon")}
        </span>
      </section>
      {rodape}
      </Grupo>
      </Coluna>
    </>
  );
}
