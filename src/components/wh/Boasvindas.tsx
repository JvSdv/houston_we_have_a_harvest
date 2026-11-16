"use client";

import type { DataView, LocalView } from "@/lib/view-data";
import type { EngineParams } from "@/lib/engine/index.ts";
import type { IndiceEnso } from "@/lib/engine/enso.ts";
import { EscolherLugar } from "@/components/gt/EscolherLugar";
import { Broto, CeuAnimado, Chave, IcBaixada, IcGeada, IcPin, IcSatelite, IcSoja, IcTrigo, Logo } from "@/components/wh/Arte";
import { SeletorDia } from "@/components/wh/SeletorDia";
import type { Lang } from "@/lib/i18n";
import { useT } from "@/lib/i18n";

export type EtapaIntro = "intro" | "cidade" | "soja";

function Idioma({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div role="group" aria-label={lang === "en" ? "Language" : "Idioma"} className="flex rounded-full border border-ceu-line p-0.5">
      {(["en", "pt"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`min-h-11 min-w-12 cursor-pointer rounded-full border-none px-3 font-mono text-[13px] font-semibold ${
            lang === l ? "bg-broto text-ceu" : "bg-transparent text-claro"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Passos({ atual }: { atual: 1 | 2 }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs tracking-[0.14em] text-broto">{t(`PASSO ${atual} DE 2`, `STEP ${atual} OF 2`)}</span>
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2].map((i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i <= atual ? "bg-broto" : "bg-ceu-line"}`} />
        ))}
      </span>
    </div>
  );
}

function CabecalhoPasso({ atual, titulo, sub, onVoltar }: { atual: 1 | 2; titulo: string; sub: string; onVoltar: () => void }) {
  const t = useT();
  return (
    <header className="flex flex-col gap-3 bg-ceu px-5 pb-10 pt-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={t("Voltar", "Back")}
          onClick={onVoltar}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ceu-line bg-transparent"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2F5EE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <Passos atual={atual} />
        <span className="w-11" />
      </div>
      <h1 className="m-0 text-[27px] font-black leading-[1.1] text-claro">{titulo}</h1>
      <p className="m-0 text-[15px] text-claro-2">{sub}</p>
    </header>
  );
}

const BOTAO_PRINCIPAL =
  "min-h-14 w-full cursor-pointer rounded-full border-none bg-lavoura text-[17px] font-extrabold text-white shadow-[0_6px_16px_rgba(46,125,74,.35)]";

/** Primeiro acesso: apresentação, cidade e soja (data e baixada), um passo por tela. */
export function Boasvindas({
  etapa,
  onEtapa,
  lang,
  setLang,
  locais,
  localId,
  onLocal,
  onAdicionarLocal,
  params,
  indiceEnso,
  modo,
  onModo,
  datas,
  idx,
  onIdx,
  baixada,
  onBaixada,
  onConcluir,
  aviso,
}: {
  etapa: EtapaIntro;
  onEtapa: (e: EtapaIntro) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  locais: LocalView[];
  localId: string;
  onLocal: (id: string) => void;
  onAdicionarLocal: (l: LocalView) => void;
  params: EngineParams;
  indiceEnso: IndiceEnso;
  modo: "vou" | "ja";
  onModo: (m: "vou" | "ja") => void;
  datas: DataView[];
  idx: number;
  onIdx: (i: number) => void;
  baixada: boolean;
  onBaixada: (b: boolean) => void;
  onConcluir: () => void;
  /** Mensagem no passo da cidade (ex.: falha ao baixar a cidade guardada). */
  aviso?: string;
}) {
  const t = useT();

  if (etapa === "intro")
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-ceu px-6 pb-8 pt-5 text-claro">
        <CeuAnimado />
        <div className="relative flex justify-end">
          <Idioma lang={lang} setLang={setLang} />
        </div>
        <div className="relative mt-8 flex flex-col items-center gap-4 text-center">
          <Logo size={104} satelite estrelas />
          <div className="flex flex-col gap-1.5">
            <span className="text-5xl font-black leading-[0.95] tracking-[-0.04em]">weharvest</span>
            <span className="font-mono text-xs tracking-[0.14em] text-broto">HOUSTON, WE HAVE A HARVEST</span>
          </div>
        </div>
        <div className="relative mt-8 flex items-end gap-3">
          <h1 className="m-0 flex-1 text-[26px] font-black leading-[1.15]">
            {t("Plante a soja na hora certa e proteja o milho safrinha.", "Plant soybeans at the right time and protect your second-crop corn.")}
          </h1>
          <Broto size={64} />
        </div>
        <ul className="relative mt-6 flex list-none flex-col gap-3 p-0">
          {(
            [
              [
                <IcGeada key="g" size={24} cor="#7FB3F0" />,
                t("Veja em quantos anos a geada e a seca pegaram o milho na sua cidade.", "See in how many years frost and drought hit the corn in your town."),
              ],
              [<IcSatelite key="s" size={24} cor="#F2F5EE" />, t("45 safras de dados diários de satélite da NASA.", "45 seasons of NASA daily satellite data.")],
              [<IcTrigo key="t" size={24} />, t("Compare datas de plantio e o que plantar depois da soja.", "Compare planting dates and what to plant after soybeans.")],
            ] as [React.ReactNode, string][]
          ).map(([ic, txt]) => (
            <li key={txt} className="flex items-center gap-3 rounded-2xl bg-ceu-2 px-4 py-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-ceu">{ic}</span>
              <span className="text-[15px] leading-[1.4] text-claro-2">{txt}</span>
            </li>
          ))}
        </ul>
        <div className="relative mt-auto flex flex-col gap-3 pt-8">
          <button
            type="button"
            onClick={() => onEtapa("cidade")}
            className="min-h-14 w-full cursor-pointer rounded-full border-none bg-broto text-[17px] font-extrabold text-ceu"
          >
            {t("Começar", "Get started")}
          </button>
          <p className="m-0 text-center text-[13px] text-claro-2">
            {t("Apoio à decisão. Não substitui o seu agrônomo.", "Decision support. It does not replace your agronomist.")}
          </p>
        </div>
      </div>
    );

  if (etapa === "cidade")
    return (
      <div className="flex min-h-screen flex-col bg-palha">
        <CabecalhoPasso
          atual={1}
          titulo={t("Onde fica sua lavoura?", "Where is your field?")}
          sub={t("Escolha a cidade. Os dados da NASA são desse ponto.", "Pick the town. The NASA data come from that point.")}
          onVoltar={() => onEtapa("intro")}
        />
        <main className="-mt-6 flex flex-1 flex-col gap-3 px-4 pb-8">
          {aviso && <p className="m-0 rounded-2xl bg-[#FBEBC8] p-3 text-[15px] text-[#7A520F]">{aviso}</p>}
          <div className="rounded-3xl bg-white p-3 shadow-[0_6px_20px_rgba(20,35,26,.07)]">
            <EscolherLugar
              gpsDestaque
              params={params}
              indiceEnso={indiceEnso}
              onLocal={(l) => {
                onAdicionarLocal(l);
                onLocal(l.id);
                onEtapa("soja");
              }}
            />
          </div>
          <h2 className="m-0 px-1 pt-2 text-base font-extrabold">{t("Cidades com dados prontos", "Towns with data ready")}</h2>
          <div role="radiogroup" aria-label={t("Cidade", "Town")} className="flex flex-col gap-2 rounded-3xl bg-white p-3 shadow-[0_6px_20px_rgba(20,35,26,.07)]">
            {locais.map((l) => {
              const sel = l.id === localId;
              return (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => {
                    onLocal(l.id);
                    onEtapa("soja");
                  }}
                  className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 text-left ${
                    sel ? "border-lavoura bg-[#E3F2E1]" : "border-transparent bg-campo"
                  }`}
                >
                  <span className="flex size-10 flex-none items-center justify-center rounded-full bg-white">
                    <IcPin />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-lg font-extrabold">{l.nome}</span>
                    <span className="text-[13px] text-texto-2">{l.personalizado ? t("Dados baixados agora", "Data downloaded now") : t("Paraná · dados prontos", "Paraná · data ready")}</span>
                  </span>
                  <span className="text-xl font-black text-lavoura" aria-hidden="true">
                    ›
                  </span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-palha">
      <CabecalhoPasso
        atual={2}
        titulo={t("E a sua soja?", "And your soybeans?")}
        sub={t("Com a data da soja, a gente calcula o risco do milho que vem depois.", "With the soybean date, we work out the risk for the corn that follows.")}
        onVoltar={() => onEtapa("cidade")}
      />
      <main className="-mt-6 flex flex-1 flex-col gap-3.5 px-4 pb-8">
        <section className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-[0_6px_20px_rgba(20,35,26,.07)]">
          <span id="wh-q-modo" className="text-base font-extrabold">
            {t("Você já plantou?", "Have you planted yet?")}
          </span>
          <div role="radiogroup" aria-labelledby="wh-q-modo" className="grid grid-cols-2 gap-2">
            {(
              [
                ["vou", t("Ainda vou plantar", "Not yet"), t("quero escolher a data", "help me pick a date")],
                ["ja", t("Já plantei", "Already planted"), t("quero acompanhar", "help me follow up")],
              ] as ["vou" | "ja", string, string][]
            ).map(([m, titulo, sub]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={modo === m}
                onClick={() => onModo(m)}
                className={`flex min-h-[88px] cursor-pointer flex-col items-start justify-center gap-1 rounded-2xl border-2 px-3.5 text-left ${
                  modo === m ? "border-lavoura bg-[#E3F2E1]" : "border-transparent bg-campo"
                }`}
              >
                <IcSoja size={24} />
                <span className="text-base font-extrabold">{titulo}</span>
                <span className="text-[13px] text-texto-2">{sub}</span>
              </button>
            ))}
          </div>
          <SeletorDia
            datas={datas}
            idx={idx}
            onIdx={onIdx}
            baixada={baixada}
            titulo={modo === "ja" ? t("Quando você plantou a soja?", "When did you plant soybeans?") : t("Quando pensa em plantar a soja?", "When do you plan to plant soybeans?")}
          />
          <button
            type="button"
            role="switch"
            aria-checked={baixada}
            onClick={() => onBaixada(!baixada)}
            className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-none bg-[#EAF2FB] px-3.5 text-left"
          >
            <IcBaixada />
            <span className="flex flex-1 flex-col">
              <span className="text-[15px] font-extrabold text-texto">{t("Lavoura em baixada", "Field in a lowland")}</span>
              <span className="text-[13px] text-[#33507A]">{t("Fundo de vale, onde o frio se acumula", "Valley floor, where cold air pools")}</span>
            </span>
            <Chave ligada={baixada} />
          </button>
        </section>
        <div className="mt-auto pt-2">
          <button type="button" onClick={onConcluir} className={BOTAO_PRINCIPAL}>
            {t("Ver o resultado", "See the result")}
          </button>
        </div>
      </main>
    </div>
  );
}
