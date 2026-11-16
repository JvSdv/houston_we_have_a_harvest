"use client";

import { useState } from "react";
import type { DataView, TrigoView } from "@/lib/view-data";
import { FOCOS, MOTIVO_BLOQUEIO, NOTA_NITROGENIO, REGRA_ORDEM, RESTRICOES, type Foco, type Restricao } from "@/lib/rotacoes";
import {
  COR_AVALIACAO,
  Carinha,
  IcMilho,
  IcMilhoCapim,
  IcSoja,
  IcTrigo,
  SetaRotacao,
  type Avaliacao,
} from "@/components/wh/Arte";
import { CabecalhoInterno, MAIN_GRADE3 } from "@/components/wh/Moldura";
import { avaliacaoDoNivel, fraseDez, type ModeloRotacoes, type RotacaoAvaliada } from "@/components/wh/modelo";
import { fmtDia, useLang, useT } from "@/lib/i18n";
import { nivelPorFreq } from "@/components/ui/NivelBadge";

const ROTULO_AVAL: Record<Avaliacao, { pt: string; en: string }> = {
  bom: { pt: "bom", en: "good" },
  atencao: { pt: "atenção", en: "caution" },
  ruim: { pt: "ruim", en: "poor" },
};

const RESTRICAO_CURTA: Record<Restricao, { pt: string; en: string }> = {
  semTrigo: { pt: "Não planto trigo", en: "I don’t grow wheat" },
  semBraquiaria: { pt: "Não manejo braquiária", en: "No brachiaria" },
  poucaAgua: { pt: "Tenho pouca água", en: "Little water" },
};

const FOCO_CURTO: Record<Foco, { pt: string; en: string }> = {
  renda: { pt: "Renda", en: "Income" },
  "solo-agua": { pt: "Solo", en: "Soil" },
  equilibrio: { pt: "Os dois", en: "Both" },
};

function Selo({ a }: { a: Avaliacao }) {
  const t = useT();
  const c = COR_AVALIACAO[a];
  return (
    <span className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[15px] font-extrabold" style={{ background: c.fundo, color: c.cor }}>
      <Carinha a={a} size={26} />
      {t(ROTULO_AVAL[a].pt, ROTULO_AVAL[a].en)}
    </span>
  );
}

function Par({ id }: { id: string }) {
  const [fundo, icone] =
    id === "trigo"
      ? ["#F4EBD2", <IcTrigo key="t" />]
      : id === "milho-braquiaria"
        ? ["#FBEFD2", <IcMilhoCapim key="c" />]
        : ["#FBEFD2", <IcMilho key="m" />];
  return (
    <span aria-hidden="true" className="flex h-10 w-[102px] flex-none items-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-[#E3F2E1]">
        <IcSoja />
      </span>
      <svg width="22" height="40" viewBox="40 0 22 40">
        <SetaRotacao />
      </svg>
      <span className="flex size-10 items-center justify-center rounded-full" style={{ background: fundo }}>
        {icone}
      </span>
    </span>
  );
}

function CartaoRotacao({
  a,
  i,
  texto,
  seca,
}: {
  a: RotacaoAvaliada;
  i: number;
  texto: string;
  /** Seca na flor do milho (vale para as opções com milho; para o trigo não é calculada). */
  seca: Avaliacao;
}) {
  const t = useT();
  const lang = useLang();
  const [aberto, setAberto] = useState(false);
  const x = lang === "en" ? a.r.en : a.r.pt;
  const fora = a.bloqueios.length > 0;
  const primeiro = i === 0 && !fora;
  const etiqueta = fora
    ? { pt: "NÃO SE APLICA", en: "NOT FOR YOU", cor: "#8A7F6A" }
    : primeiro
      ? { pt: "MELHOR PRA SUA DATA", en: "BEST FOR YOUR DATE", cor: "#2E7D4A" }
      : a.r.id === "milho-braquiaria"
        ? { pt: "MELHOR PRO SOLO", en: "BEST FOR THE SOIL", cor: "#3E6EA8" }
        : a.r.id === "milho"
          ? { pt: "O QUE VOCÊ FAZ HOJE", en: "WHAT YOU DO TODAY", cor: "#4A5A50" }
          : { pt: "OUTRA OPÇÃO", en: "ANOTHER OPTION", cor: "#4A5A50" };
  return (
    <article
      className={`wh-in flex flex-col gap-3.5 rounded-3xl bg-white p-[18px] ${fora ? "opacity-75" : ""}`}
      style={{ animationDelay: `${0.1 + i * 0.06}s`, border: primeiro ? "2px solid #2E7D4A" : "1px solid #E3DDCF" }}
    >
      <span className="self-start rounded-full px-3 py-[5px] text-[13px] font-extrabold tracking-[0.02em] text-white" style={{ background: etiqueta.cor }}>
        {t(etiqueta.pt, etiqueta.en)}
      </span>
      <div className="flex items-center gap-3">
        <Par id={a.r.id} />
        <h2 className="m-0 text-[21px] font-black leading-[1.15] tracking-normal">{x.nome}</h2>
      </div>
      {fora && (
        <p className="m-0 rounded-xl bg-[#FBEBC8] px-3 py-2 text-[15px] text-[#7A520F]">
          {t("Você marcou que não consegue: ", "You said you can’t: ")}
          {t(MOTIVO_BLOQUEIO[a.bloqueios[0]].pt, MOTIVO_BLOQUEIO[a.bloqueios[0]].en)}.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {(
          [
            [t("Geada", "Frost"), a.geada],
            [t("Seca", "Drought"), a.r.id === "trigo" ? null : seca],
            [t("Cuidado com o solo", "Soil care"), a.solo],
            [t("Renda", "Income"), a.renda],
          ] as [string, Avaliacao | null][]
        ).map(([r, v]) => (
          <div key={r} className="flex items-center justify-between">
            <span className="text-base">{r}</span>
            {v ? <Selo a={v} /> : <span className="text-sm text-texto-2">{t("não calculada", "not computed")}</span>}
          </div>
        ))}
      </div>
      <p className="m-0 text-[15px] leading-[1.45] text-texto-2">{texto}</p>
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className={`min-h-12 cursor-pointer rounded-full text-base font-extrabold lg:mt-auto ${
          primeiro ? "border-none bg-lavoura text-white" : "border-[1.5px] border-[#D6CFBE] bg-white text-texto"
        }`}
      >
        {aberto ? t("Fechar detalhes", "Hide details") : t("Ver detalhes", "See details")}
      </button>
      {aberto && (
        <div className="flex flex-col gap-3 rounded-2xl bg-campo p-3.5 text-[15px] leading-[1.45]">
          <p className="m-0">{x.justificativa}</p>
          {(
            [
              [t("Evidência", "Evidence"), x.evidencia, "#2F5A92"],
              [t("Benefícios", "Benefits"), x.beneficios, "#2E7D4A"],
              [t("Riscos", "Risks"), x.riscos, "#9A3D0B"],
              [t("Confirmar com o agrônomo", "Confirm with an agronomist"), x.lacunas, "#4A5A50"],
            ] as [string, string[], string][]
          ).map(([titulo, itens, cor]) => (
            <div key={titulo}>
              <p className="m-0 text-sm font-extrabold" style={{ color: cor }}>
                {titulo}
              </p>
              <ul className="m-0 mt-1 list-disc pl-5 text-texto-2">
                {itens.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="m-0 text-sm text-texto-2">
            {t("Solo descoberto:", "Bare soil:")} {x.soloDescoberto}
          </p>
        </div>
      )}
    </article>
  );
}

export function TelaRotacoes({
  nomeLocal,
  d,
  trigo,
  baixada,
  modelo,
  foco,
  onFoco,
  restricoes,
  onRestricao,
  onVoltar,
  onMenu,
}: {
  nomeLocal: string;
  d: DataView;
  datas: DataView[];
  trigo: TrigoView;
  baixada: boolean;
  modelo: ModeloRotacoes;
  foco: Foco;
  onFoco: (f: Foco) => void;
  restricoes: Restricao[];
  onRestricao: (r: Restricao) => void;
  onVoltar?: () => void;
  onMenu?: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const dia = (x: string) => fmtDia(x, lang);
  const geada = baixada ? d.geadaBaixada : d.geada;
  const fGeada = fraseDez(geada, lang);
  const secaMilho = avaliacaoDoNivel(nivelPorFreq(d.seca.frequencia));

  const texto = (a: RotacaoAvaliada) =>
    a.r.id === "milho"
      ? t(
          `Rende mais quando dá certo, mas com soja em ${dia(d.dataSoja)} o risco na flor é de ${fGeada} de geada e ${fraseDez(d.seca, lang)} de seca.`,
          `Pays the most when it works, but with soybeans on ${dia(d.dataSoja)} the risk at flowering is ${fGeada} frost and ${fraseDez(d.seca, lang)} drought.`,
        )
      : a.r.id === "milho-braquiaria"
        ? t(
            `Capim cobre o chão depois do milho. Na flor do milho: ${fGeada} de geada e ${fraseDez(d.seca, lang)} de seca.`,
            `Grass covers the ground after the corn. At corn flowering: ${fGeada} frost and ${fraseDez(d.seca, lang)} drought.`,
          )
        : t(
            `Risco de geada na espiga do trigo: ${fraseDez(modelo.geadaTrigo, lang)} (semeado em ${dia(trigo.semeadura)}), para qualquer data da soja.`,
            `Frost risk at wheat heading: ${fraseDez(modelo.geadaTrigo, lang)} (sown on ${dia(trigo.semeadura)}), for any soybean date.`,
          );

  return (
    <>
      <CabecalhoInterno
        titulo={t("O que plantar depois da soja?", "What to plant after soybeans?")}
        subtitulo={t(`${nomeLocal} · soja em ${dia(d.dataSoja)}`, `${nomeLocal} · soybeans on ${dia(d.dataSoja)}`)}
        onVoltar={onVoltar}
        onMenu={onMenu}
      />
      <main className={`-mt-6 flex flex-col gap-3.5 px-4 pb-10 ${MAIN_GRADE3}`}>
        <section className="flex flex-col gap-2.5 rounded-3xl bg-white p-4 shadow-[0_6px_20px_rgba(20,35,26,.07)] lg:col-span-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-x-6 lg:gap-y-3 lg:px-6">
          <span id="wh-foco" className="text-base font-extrabold">
            {t("O que pesa mais pra você?", "What matters most to you?")}
          </span>
          <div role="radiogroup" aria-labelledby="wh-foco" className="grid grid-cols-3 gap-1.5 lg:w-[280px]">
            {FOCOS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={foco === f.id}
                onClick={() => onFoco(f.id)}
                className={`min-h-12 cursor-pointer rounded-full border-none text-[15px] font-extrabold ${
                  foco === f.id ? "bg-texto text-white" : "bg-campo text-texto"
                }`}
              >
                {t(FOCO_CURTO[f.id].pt, FOCO_CURTO[f.id].en)}
              </button>
            ))}
          </div>
          <span id="wh-restr" className="mt-1.5 text-[15px] font-extrabold lg:mt-0">
            {t("Algo não serve pra você?", "Anything that doesn’t work for you?")}
          </span>
          <div role="group" aria-labelledby="wh-restr" className="flex flex-wrap gap-1.5">
            {RESTRICOES.map((k) => {
              const on = restricoes.includes(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onRestricao(k.id)}
                  className={`min-h-11 cursor-pointer rounded-full border-[1.5px] px-3.5 text-sm font-extrabold ${
                    on ? "border-texto bg-texto text-white" : "border-[#D6CFBE] bg-white text-texto"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {t(RESTRICAO_CURTA[k.id].pt, RESTRICAO_CURTA[k.id].en)}
                </button>
              );
            })}
          </div>
        </section>

        {modelo.avaliadas.map((a, i) => (
          <CartaoRotacao key={a.r.id} a={a} i={i} texto={texto(a)} seca={secaMilho} />
        ))}

        <details className="rounded-[18px] bg-white px-4 lg:col-span-3">
          <summary className="flex min-h-[52px] cursor-pointer items-center text-base font-bold">{t("Como escolhemos a ordem", "How we pick the order")}</summary>
          <div className="flex flex-col gap-3 pb-4">
            <p className="m-0 text-sm leading-[1.5] text-texto-2">{t(REGRA_ORDEM.pt, REGRA_ORDEM.en)}</p>
            <p className="m-0 text-sm leading-[1.5] text-texto-2">{t(NOTA_NITROGENIO.pt, NOTA_NITROGENIO.en)}</p>
          </div>
        </details>
        <p className="m-0 px-1 text-sm leading-[1.5] text-texto-2 lg:col-span-3">
          {t(
            "Os números mostram com que frequência o clima atrapalhou no passado. Não garantem a próxima safra. Converse com seu agrônomo antes de decidir.",
            "The numbers show how often the weather got in the way in the past. They do not guarantee the next season. Talk to your agronomist before deciding.",
          )}
        </p>
      </main>
    </>
  );
}
