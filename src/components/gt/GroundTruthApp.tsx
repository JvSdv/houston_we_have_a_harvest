"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { DataView, LocalView, ViewData } from "@/lib/view-data";
import type { Foco, Restricao } from "@/lib/rotacoes";
import type { FaseEnso, FiltroEnso } from "@/lib/engine/enso.ts";
import { EscolherLugar, carregarLocal } from "@/components/gt/EscolherLugar";
import { FILTROS_ENSO } from "@/components/gt/format";
import { Chave, IcBaixada, IcPin, IcSoja, Logo } from "@/components/wh/Arte";
import { BarraAbas, BotoesCompartilhar, CabecalhoInicio, CabecalhoInterno, Coluna, Folha, Grupo, InstalarApp, LinhaEscolha, MAIN_LARGO, type Aba } from "@/components/wh/Moldura";
import { Boasvindas, type EtapaIntro } from "@/components/wh/Boasvindas";
import { VouPlantar } from "@/components/wh/VouPlantar";
import { JaPlantei } from "@/components/wh/JaPlantei";
import { PlantarSemana } from "@/components/wh/PlantarSemana";
import { SeletorDia } from "@/components/wh/SeletorDia";
import { TelaSafra } from "@/components/wh/TelaSafra";
import { TelaCalendario } from "@/components/wh/TelaCalendario";
import { useCaderno } from "@/components/wh/caderno";
import { TelaRotacoes } from "@/components/wh/TelaRotacoes";
import { Detalhes } from "@/components/wh/Detalhes";
import { RelevoTalhao } from "@/components/wh/RelevoTalhao";
import { TestesReais } from "@/components/wh/TestesReais";
import validacaoEstacoes from "@/data/validacao_estacoes.json";
import { anoDaSafra, avaliarRotacoes, diaLongo, montarResumo } from "@/components/wh/modelo";
import { LangContext } from "@/lib/i18n";
import { useIdioma } from "@/lib/useIdioma";

type Etapa = EtapaIntro | "app";

/** Critério de baixada pelo relevo e resultado do teste com estações (scripts/validacao/validar_estacoes.mjs). */
const RELEVO = (validacaoEstacoes as unknown as { relevo: { estacoes: number; regraBaixadaTpiM: number; diferencaBaixadaC: number | null } }).relevo;
type FolhaAberta = null | "municipio" | "data";

/** Escolhas guardadas no aparelho, para pular a introdução na próxima visita. */
const CHAVE = "weharvest-lavoura";
/** Endereço público, usado no link que vai na mensagem do WhatsApp. */
const URL_APP = "https://weharvest.vercel.app/";
type Cidade = { nome: string; lat: number; lon: number };
/** `cidade`: município buscado pelo usuário (os dados são baixados de novo ao abrir). */
type Salvo = { localId: string; dataSoja: string; baixada: boolean; modo: "vou" | "ja"; cidade?: Cidade };

const semInscricao = () => () => {};
function isoDeHoje(): string {
  const x = new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
/** Link compartilhado (?cidade=…&soja=…) tem prioridade; senão, o que ficou guardado no aparelho. */
function lerSalvo(): string | null {
  try {
    const q = new URLSearchParams(window.location.search);
    const cidade = q.get("cidade");
    if (cidade) {
      const lat = Number(q.get("lat"));
      const lon = Number(q.get("lon"));
      const nome = q.get("nome");
      return JSON.stringify({
        localId: cidade,
        dataSoja: /^\d\d-\d\d$/.test(q.get("soja") ?? "") ? q.get("soja") : "10-20",
        baixada: q.get("baixada") === "1",
        modo: "vou",
        ...(nome && Number.isFinite(lat) && Number.isFinite(lon) && q.get("lat") ? { cidade: { nome, lat, lon } } : {}),
      });
    }
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}
function linkDoApp(local: LocalView, dataSoja: string, baixada: boolean, lang: "pt" | "en"): string {
  const q = new URLSearchParams({ lang, cidade: local.id, soja: dataSoja });
  if (baixada) q.set("baixada", "1");
  if (local.personalizado) {
    q.set("nome", local.nome);
    q.set("lat", String(local.lat));
    q.set("lon", String(local.lon));
  }
  return `${URL_APP}?${q.toString()}`;
}
function interpretar(s: string | null | undefined): Partial<Salvo> | null {
  if (!s) return null;
  try {
    const x = JSON.parse(s) as Partial<Salvo>;
    return typeof x === "object" && x ? x : null;
  } catch {
    return null;
  }
}

export function GroundTruthApp({ data }: { data: ViewData }) {
  const { lang, setLang } = useIdioma();
  const t = (pt: string, en: string) => (lang === "en" ? en : pt);

  // Só no navegador: o que ficou guardado e a data de hoje (a página é gerada no build).
  const salvoStr = useSyncExternalStore(semInscricao, lerSalvo, () => undefined);
  const salvo = useMemo(() => interpretar(salvoStr), [salvoStr]);
  const hojeIso = useSyncExternalStore(semInscricao, isoDeHoje, () => null);
  const hoje = useMemo(() => (hojeIso ? new Date(`${hojeIso}T12:00:00`) : null), [hojeIso]);
  /** Municípios escolhidos pelo usuário (dados da NASA baixados na hora), além dos 3 de demonstração. */
  const [extras, setExtras] = useState<LocalView[]>([]);
  const [erroRecarga, setErroRecarga] = useState(false);
  const [localIdSel, setLocalId] = useState<string | null>(null);
  const salvoDemo = !!salvo?.localId && data.locais.some((l) => l.id === salvo.localId);
  const salvoExtra = !!salvo?.localId && extras.some((l) => l.id === salvo.localId);
  const salvoValido = salvoDemo || salvoExtra;
  const precisaBaixar = !salvoValido && !!salvo?.cidade && !erroRecarga;

  const [etapaSel, setEtapa] = useState<Etapa | null>(null);
  const etapa: Etapa | "carregando" | "baixando" =
    etapaSel ??
    (salvoStr === undefined ? "carregando" : salvoValido ? "app" : precisaBaixar ? "baixando" : salvo ? "cidade" : "intro");

  // Reabrindo com uma cidade buscada antes: baixa de novo os dados da NASA para ela.
  const cidadeSalva = salvo?.cidade;
  useEffect(() => {
    if (etapa !== "baixando" || !cidadeSalva) return;
    let ativo = true;
    const ctrl = new AbortController();
    const limite = setTimeout(() => ctrl.abort(), 45_000);
    carregarLocal(cidadeSalva, data.params, data.indiceEnso, ctrl.signal)
      .then((l) => {
        if (!ativo) return;
        setExtras((xs) => (xs.some((x) => x.id === l.id) ? xs : [...xs, l]));
        setLocalId(l.id);
        if (l.id !== salvo?.localId) setEtapa("app");
      })
      .catch(() => {
        if (ativo) setErroRecarga(true);
      })
      .finally(() => clearTimeout(limite));
    return () => {
      ativo = false;
      clearTimeout(limite);
      ctrl.abort();
    };
  }, [etapa, cidadeSalva, data.params, data.indiceEnso, salvo?.localId]);
  const locais = useMemo(() => [...data.locais, ...extras], [data, extras]);
  const localId = localIdSel ?? (salvoValido ? salvo!.localId! : data.locais[0].id);
  const local = locais.find((l) => l.id === localId) ?? locais[0];
  const [dataSel, setDataSoja] = useState<string | null>(null);
  const dataSoja = dataSel ?? salvo?.dataSoja ?? "10-20";
  const idxAchado = local.datas.findIndex((d) => d.dataSoja === dataSoja);
  const idx = idxAchado >= 0 ? idxAchado : Math.max(local.datas.findIndex((d) => d.dataSoja === "10-20"), 0);
  const setIdx = (i: number) => setDataSoja(local.datas[i].dataSoja);
  const [baixadaSel, setBaixada] = useState<boolean | null>(null);
  const baixada = baixadaSel ?? salvo?.baixada === true;
  const [modoSel, setModo] = useState<"vou" | "ja" | null>(null);
  const modo = modoSel ?? (salvo?.modo === "ja" ? "ja" : "vou");

  const [fase, setFase] = useState<FiltroEnso>("todos");
  const [foco, setFoco] = useState<Foco>("equilibrio");
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [aba, setAbaEstado] = useState<Aba>("risco");
  const [folha, setFolha] = useState<FolhaAberta>(null);
  // Caderno de campo (feito + anotações), por município e safra; guardado só no aparelho.
  const { caderno, ...acoesCaderno } = useCaderno(hoje ? `weharvest-caderno-${local.id}-${anoDaSafra(hoje)}` : null);

  const p = data.params;
  const d = local.datas[idx]; // todos os anos
  const dEf: DataView = { ...d, ...d.enso[fase] };
  const datasEf: DataView[] = local.datas.map((x) => ({ ...x, ...x.enso[fase] }));
  const filtro = FILTROS_ENSO.find((q) => q.id === fase)!;
  const filtroTexto = fase === "todos" ? "" : `${t(filtro.pt, filtro.en)} (${d.anosPorFase[fase as FaseEnso].length})`;

  const modelo = avaliarRotacoes({ d: dEf, trigo: local.trigo, baixada, foco, restricoes, lang });
  const hrefWhatsApp =
    "https://wa.me/?text=" +
    encodeURIComponent(montarResumo({ nomeLocal: local.nome, d: dEf, baixada, modelo, lang, link: linkDoApp(local, d.dataSoja, baixada, lang) }));

  // Guarda as escolhas depois da introdução (e tira do endereço os dados de um link recebido).
  const cidadeAtual = local.personalizado ? JSON.stringify({ nome: local.nome, lat: local.lat, lon: local.lon }) : "";
  useEffect(() => {
    if (etapa !== "app") return;
    try {
      const salvar: Salvo = { localId: local.id, dataSoja: d.dataSoja, baixada, modo };
      if (cidadeAtual) salvar.cidade = JSON.parse(cidadeAtual) as Cidade;
      localStorage.setItem(CHAVE, JSON.stringify(salvar));
      const q = new URLSearchParams(window.location.search);
      if (q.has("cidade")) {
        ["cidade", "soja", "baixada", "nome", "lat", "lon"].forEach((k) => q.delete(k));
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${q.size ? `?${q}` : ""}`);
      }
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  }, [etapa, local.id, d.dataSoja, baixada, modo, cidadeAtual]);

  // Abas com o botão "voltar" do celular: voltar leva à aba Risco.
  const setAba = useCallback((x: Aba) => {
    setAbaEstado(x);
    setFolha(null);
    if (x !== "risco") window.history.pushState({ aba: x }, "");
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const aoVoltar = (e: PopStateEvent) => setAbaEstado((e.state?.aba as Aba) ?? "risco");
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);
  const fecharFolha = useCallback(() => setFolha(null), []);

  // Service worker (só no site publicado): deixa abrir o app com sinal fraco.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  const irEtapa = (e: Etapa) => {
    setEtapa(e);
    window.scrollTo({ top: 0 });
  };

  const adicionarLocal = (l: LocalView) => setExtras((xs) => (xs.some((x) => x.id === l.id) ? xs : [...xs, l]));

  const cartao = "flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-[0_6px_20px_rgba(20,35,26,.07)]";
  const difBaixada = RELEVO.diferencaBaixadaC;
  const evidenciaRelevo =
    difBaixada === null
      ? ""
      : t(
          `No teste com ${RELEVO.estacoes} estações do INMET, as de baixada ficaram ${Math.abs(difBaixada).toFixed(1).replace(".", ",")} °C mais frias nas noites frias (o app usa +1 °C).`,
          `In the test with ${RELEVO.estacoes} INMET stations, lowland ones were ${Math.abs(difBaixada).toFixed(1)} °C colder on cold nights (the app uses +1 °C).`,
        );

  let conteudo: React.ReactNode;
  if (etapa === "carregando" || etapa === "baixando") {
    conteudo = (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ceu px-8 text-center" aria-busy="true">
        <Logo size={88} satelite estrelas />
        {etapa === "baixando" && (
          <p role="status" className="m-0 text-base text-claro-2">
            {t(
              `Baixando os dados da NASA para ${salvo?.cidade?.nome ?? ""}… (alguns segundos)`,
              `Downloading NASA data for ${salvo?.cidade?.nome ?? ""}… (a few seconds)`,
            )}
          </p>
        )}
      </div>
    );
  } else if (etapa !== "app") {
    conteudo = (
      <Boasvindas
        etapa={etapa}
        onEtapa={irEtapa}
        lang={lang}
        setLang={setLang}
        locais={locais}
        localId={local.id}
        onLocal={setLocalId}
        onAdicionarLocal={adicionarLocal}
        params={p}
        indiceEnso={data.indiceEnso}
        modo={modo}
        onModo={setModo}
        datas={datasEf}
        idx={idx}
        onIdx={setIdx}
        baixada={baixada}
        onBaixada={setBaixada}
        onConcluir={() => {
          setAbaEstado("risco");
          irEtapa("app");
        }}
        aviso={
          erroRecarga && etapa === "cidade"
            ? t(
                `Não foi possível baixar os dados de ${salvo?.cidade?.nome ?? "sua cidade"} agora. Tente de novo ou escolha outra cidade.`,
                `Could not download the data for ${salvo?.cidade?.nome ?? "your town"} right now. Try again or pick another town.`,
              )
            : undefined
        }
      />
    );
  } else {
    conteudo = (
      <>
        {aba === "risco" && (
          <>
            {modo === "vou" ? (
              <CabecalhoInicio
                saudacao={t("Olá, produtor!", "Hello, farmer!")}
                titulo={t("Vamos proteger o seu milho safrinha?", "Shall we protect your second-crop corn?")}
                onMenu={() => setAba("mais")}
              />
            ) : (
              <CabecalhoInicio
                ceu={false}
                saudacao={t("Soja na terra!", "Soybeans in the ground!")}
                titulo={t("Agora vamos cuidar do milho que vem depois", "Now let’s look after the corn that comes next")}
                onMenu={() => setAba("mais")}
              />
            )}
            <main className={`relative flex flex-col gap-3.5 px-4 pb-28 ${MAIN_LARGO} ${modo === "vou" ? "-mt-[18px]" : "-mt-[22px]"}`}>
              {modo === "vou" ? (
                <VouPlantar
                  local={local}
                  datas={datasEf}
                  idx={idx}
                  onIdx={setIdx}
                  baixada={baixada}
                  onBaixada={setBaixada}
                  onTrocarLocal={() => setFolha("municipio")}
                  onTrocarData={() => setFolha("data")}
                  onModo={setModo}
                  onVerCalendario={() => setAba("calendario")}
                  semana={
                    <PlantarSemana
                      key={local.id}
                      nome={local.nome}
                      lat={local.lat}
                      lon={local.lon}
                      baixada={baixada}
                      limiteGeadaC={p.limiteGeadaC}
                      ajusteBaixadaC={p.ajusteBaixadaC}
                    />
                  }
                  rodape={<BotoesCompartilhar hrefWhatsApp={hrefWhatsApp} onAgenda={() => setAba("calendario")} />}
                />
              ) : (
                hoje && (
                    <JaPlantei
                      d={dEf}
                      baixada={baixada}
                      cicloSoja={p.cicloSoja}
                      hoje={hoje}
                      onModo={setModo}
                      onMudarData={() => setFolha("data")}
                      onRotacoes={() => setAba("depois")}
                      rodape={<BotoesCompartilhar hrefWhatsApp={hrefWhatsApp} onAgenda={() => setAba("calendario")} />}
                    />
                )
              )}
            </main>
          </>
        )}

        {aba === "calendario" && hoje && (
          <div className="pb-24">
            <TelaCalendario
              local={local}
              d={dEf}
              baixada={baixada}
              cicloMilho={p.cicloMilho}
              hoje={hoje}
              modo={modo}
              caderno={caderno}
              acoes={acoesCaderno}
              onMenu={() => setAba("mais")}
            />
          </div>
        )}

        {aba === "depois" && (
          <div className="pb-24">
            <TelaRotacoes
              nomeLocal={local.nome}
              d={dEf}
              datas={datasEf}
              trigo={local.trigo}
              baixada={baixada}
              modelo={modelo}
              foco={foco}
              onFoco={setFoco}
              restricoes={restricoes}
              onRestricao={(k) => setRestricoes((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]))}
              onMenu={() => setAba("mais")}
            />
          </div>
        )}

        {aba === "safra" && hoje && (
          <div className="pb-24">
            <TelaSafra
              local={local}
              d={dEf}
              baixada={baixada}
              cicloMilho={p.cicloMilho}
              hoje={hoje}
              modelo={modelo}
              modo={modo}
              caderno={caderno}
              onMenu={() => setAba("mais")}
            />
          </div>
        )}

        {aba === "mais" && (
          <>
            <CabecalhoInterno
              titulo={t("Mais", "More")}
              subtitulo={t("Sua lavoura e idioma", "Your field and language")}
              onVoltar={() => setAba("risco")}
            />
            <main className={`-mt-6 flex flex-col gap-3.5 px-4 pb-28 ${MAIN_LARGO}`}>
              <Coluna>
              <Grupo ordem={1}>
              <section className={cartao}>
                <h2 className="m-0 text-lg font-black tracking-normal">{t("Sua lavoura", "Your field")}</h2>
                <LinhaEscolha
                  icone={
                    <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-[#E3F2E1]">
                      <IcPin />
                    </span>
                  }
                  rotulo={t("Município", "Municipality")}
                  valor={local.nome}
                  acao={t("Trocar", "Change")}
                  onClick={() => setFolha("municipio")}
                />
                <LinhaEscolha
                  icone={
                    <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-[#E3F2E1]">
                      <IcSoja size={20} />
                    </span>
                  }
                  rotulo={modo === "ja" ? t("Plantei a soja em", "I planted soybeans on") : t("Vou plantar a soja em", "I’ll plant soybeans on")}
                  valor={diaLongo(d.dataSoja, lang)}
                  acao={t("Mudar", "Change")}
                  onClick={() => setFolha("data")}
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={baixada}
                  onClick={() => setBaixada(!baixada)}
                  className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-none bg-[#EAF2FB] px-3.5 text-left"
                >
                  <IcBaixada />
                  <span className="flex-1 text-[15px] font-extrabold text-texto">{t("Lavoura em baixada", "Field in a lowland")}</span>
                  <Chave ligada={baixada} />
                </button>
                <RelevoTalhao limiteM={RELEVO.regraBaixadaTpiM} baixada={baixada} onBaixada={setBaixada} evidencia={evidenciaRelevo} />
              </section>
              </Grupo>
              <Grupo ordem={4}>
              <details className="group rounded-3xl bg-white px-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-lg font-black">
                  {t("Para técnicos: testes e método", "For agronomists: tests and method")}
                  <span aria-hidden="true" className="text-xl text-texto-2 transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="flex flex-col gap-3.5 pb-[18px]">
              <TestesReais />

              <Detalhes
                local={local}
                d={d}
                dEf={dEf}
                baixada={baixada}
                fase={fase}
                onFase={setFase}
                filtroTexto={filtroTexto}
                params={p}
                backtest={data.backtest}
                enso={data.enso}
              />
                </div>
              </details>
              </Grupo>
              </Coluna>

              <Coluna lado>
              <Grupo ordem={2}>
              <section className={cartao}>
                <h2 className="m-0 text-lg font-black tracking-normal">{t("Idioma", "Language")}</h2>
                <div role="group" aria-label={t("Idioma", "Language")} className="grid grid-cols-2 gap-1 rounded-full bg-campo p-1">
                  {(["en", "pt"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      lang={l}
                      aria-pressed={lang === l}
                      onClick={() => setLang(l)}
                      className={`min-h-[46px] cursor-pointer rounded-full border-none text-[15px] font-extrabold ${lang === l ? "bg-texto text-white" : "bg-transparent text-texto"}`}
                    >
                      {l === "pt" ? "Português" : "English"}
                    </button>
                  ))}
                </div>
              </section>

              <InstalarApp />
              </Grupo>
              <Grupo ordem={5}>
              <button
                type="button"
                onClick={() => irEtapa("intro")}
                className="min-h-12 w-full cursor-pointer rounded-full border-[1.5px] border-[#D6CFBE] bg-white text-base font-extrabold text-texto"
              >
                {t("Ver a introdução de novo", "See the introduction again")}
              </button>
              <p className="m-0 px-1 text-center font-mono text-[11px] tracking-[0.14em] text-texto-2">HOUSTON, WE HAVE A HARVEST · NASA SPACE APPS 2026</p>
              </Grupo>
              </Coluna>
            </main>
          </>
        )}

        <BarraAbas aba={aba} onAba={setAba} />
      </>
    );
  }

  return (
    <LangContext.Provider value={lang}>
      {etapa === "app" ? (
        // Computador: barra lateral fixa (BarraAbas) + área do conteúdo ocupando o resto da largura.
        <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-palha lg:ml-[232px] lg:mr-0 lg:w-auto lg:max-w-none">{conteudo}</div>
      ) : (
        // Introdução e carregamento: no computador, um cartão no meio da tela sobre o céu escuro.
        <div className="lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:bg-ceu lg:p-10">
          <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-palha lg:mx-0 lg:min-h-[min(860px,calc(100vh-5rem))] lg:max-w-[480px] lg:overflow-hidden lg:rounded-[32px] lg:shadow-[0_24px_60px_rgba(0,0,0,.35)] lg:ring-1 lg:ring-ceu-line lg:[&_.min-h-screen]:min-h-[min(860px,calc(100vh-5rem))]">
            {conteudo}
          </div>
        </div>
      )}

      {folha === "municipio" && (
        <Folha titulo={t("Onde fica sua lavoura?", "Where is your field?")} onFechar={fecharFolha}>
          <div role="radiogroup" aria-label={t("Município", "Municipality")} className="flex flex-wrap gap-2">
            {locais.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={l.id === local.id}
                onClick={() => {
                  setLocalId(l.id);
                  setFolha(null);
                }}
                className={`min-h-12 cursor-pointer rounded-full border-none px-4 text-[15px] font-extrabold ${l.id === local.id ? "bg-lavoura text-white" : "bg-white text-texto"}`}
              >
                {l.nome}
              </button>
            ))}
          </div>
          <EscolherLugar
            params={p}
            indiceEnso={data.indiceEnso}
            onLocal={(l) => {
              adicionarLocal(l);
              setLocalId(l.id);
              setFolha(null);
            }}
          />
        </Folha>
      )}

      {folha === "data" && (
        <Folha titulo={modo === "ja" ? t("Quando você plantou a soja?", "When did you plant soybeans?") : t("Quando vai plantar a soja?", "When will you plant soybeans?")} onFechar={fecharFolha}>
          <div className="rounded-3xl bg-white p-4">
            <SeletorDia datas={datasEf} idx={idx} onIdx={setIdx} baixada={baixada} titulo={t("Data de plantio da soja", "Soybean planting date")} />
          </div>
          <button
            type="button"
            onClick={fecharFolha}
            className="min-h-14 cursor-pointer rounded-full border-none bg-lavoura text-[17px] font-extrabold text-white"
          >
            {t("Pronto", "Done")}
          </button>
        </Folha>
      )}
    </LangContext.Provider>
  );
}
