"use client";

import { useState } from "react";
import type { DataView, LocalView } from "@/lib/view-data";
import { CabecalhoInterno, Coluna, MAIN_LARGO } from "@/components/wh/Moldura";
import { IcWhatsApp } from "@/components/wh/Arte";
import { anoDaSafra, baixarIcs, fraseDez, type ModeloRotacoes } from "@/components/wh/modelo";
import { baixarTexto, COR_EVENTO, eventosDaSafra, montarCsv, paraAgenda } from "@/components/wh/safra";
import { dataDeIso, type Caderno } from "@/components/wh/caderno";
import { fmtDia, useLang, useT } from "@/lib/i18n";

type Bloco = "datas" | "risco" | "rotacao" | "notas";

/** Aba Safra: o produtor escolhe o que entra e gera relatório, agenda ou planilha da safra dele. */
export function TelaSafra({
  local,
  d,
  baixada,
  cicloMilho,
  hoje,
  modelo,
  modo,
  caderno,
  onMenu,
}: {
  local: LocalView;
  d: DataView;
  baixada: boolean;
  cicloMilho: number;
  hoje: Date;
  modelo: ModeloRotacoes;
  modo: "vou" | "ja";
  caderno: Caderno;
  onMenu?: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const ano = anoDaSafra(hoje);
  const safra = `${ano}/${String(ano + 1).slice(2)}`;
  const todos = eventosDaSafra({ d, local, cicloMilho, hoje, t, lang, feitos: caderno.feitos, modo });
  const [escolhidos, setEscolhidos] = useState<Bloco[]>(["datas", "risco", "rotacao", "notas"]);
  const tem = (b: Bloco) => escolhidos.includes(b);
  const alternar = (b: Bloco) => setEscolhidos((xs) => (xs.includes(b) ? xs.filter((x) => x !== b) : [...xs, b]));

  const eventos = tem("datas") ? todos : [];
  const geada = baixada ? d.geadaBaixada : d.geada;
  const seca = d.seca;
  const todasNotas = Object.entries(caderno.notas)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([iso, ns]) => ns.map((n) => ({ dia: dataDeIso(iso), texto: n })));
  const notas = tem("notas") ? todasNotas : [];
  const melhor = lang === "en" ? modelo.melhor.r.en.nome : modelo.melhor.r.pt.nome;
  const data = (x: Date) => new Intl.DateTimeFormat(lang === "en" ? "en-US" : "pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(x);
  const periodo = (e: (typeof todos)[number]) =>
    (e.fim ? `${data(e.inicio)} – ${data(e.fim)}` : data(e.inicio)) + (e.feitoEm ? ` (${t("feito", "done")})` : "");
  const nota = t("Planejado com o weharvest (dados NASA POWER). Confirme com seu agrônomo.", "Planned with weharvest (NASA POWER data). Confirm with your agronomist.");
  const titulo = t(`Relatório da safra ${safra}`, `Season report ${safra}`);
  const campo = `${local.nome} · ${t("soja em", "soybeans on")} ${fmtDia(d.dataSoja, lang)}${baixada ? ` · ${t("lavoura em baixada", "lowland field")}` : ""}`;

  const linhasRisco = [
    `${t("Risco de geada na flor do milho", "Frost risk at corn flowering")}: ${fraseDez(geada, lang)} (${geada.anosComEvento} ${t("de", "of")} ${geada.totalAnos} ${t("safras", "seasons")})`,
    `${t("Risco de seca", "Drought risk")}: ${fraseDez(seca, lang)} (${seca.anosComEvento} ${t("de", "of")} ${seca.totalAnos} ${t("safras", "seasons")})`,
  ];
  const aviso = t(
    `Histórico de ${geada.totalAnos} anos (NASA POWER), não é previsão do tempo. O número é a frequência do evento, não a perda de produção.`,
    `${geada.totalAnos}-year history (NASA POWER), not a weather forecast. The number is how often the event happened, not the yield loss.`,
  );

  const texto = [
    titulo.toUpperCase(),
    campo,
    t(`Gerado em ${data(hoje)}`, `Generated on ${data(hoje)}`),
    "",
    ...(eventos.length ? [t("DATAS DA SAFRA", "SEASON DATES"), ...eventos.map((e) => `- ${e.titulo}: ${periodo(e)}`), ""] : []),
    ...(tem("risco") ? [t("RISCO HISTÓRICO", "HISTORICAL RISK"), ...linhasRisco.map((l) => `- ${l}`), aviso, ""] : []),
    ...(tem("rotacao") ? [t("O QUE PLANTAR DEPOIS DA SOJA", "WHAT TO PLANT AFTER SOYBEANS"), `- ${melhor}. ${modelo.motivo}`, ""] : []),
    ...(notas.length ? [t("SUAS ANOTAÇÕES", "YOUR NOTES"), ...notas.map((n) => `- ${data(n.dia)}: ${n.texto}`), ""] : []),
    nota,
  ].join("\n");

  const nada = escolhidos.length === 0;
  const slug = local.nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const arquivo = `weharvest-${slug}-${ano}-${String(ano + 1).slice(2)}`;

  const botao =
    "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-[#D6CFBE] bg-white px-4 text-[15px] font-extrabold text-texto disabled:cursor-not-allowed disabled:opacity-40";

  const OPCOES: [Bloco, string, string, string][] = [
    ["datas", t("Datas da safra", "Season dates"), t("plantio, colheita, flor do milho e geada", "planting, harvest, corn flowering and frost"), COR_EVENTO.soja],
    ["risco", t("Risco de geada e seca", "Frost and drought risk"), t("quantas safras tiveram o problema", "how many seasons had the problem"), "#B4480E"],
    ["rotacao", t("O que plantar depois", "What to plant next"), t("a rotação indicada pra você", "the rotation suggested for you"), "#2E7D4A"],
    [
      "notas",
      t("Suas anotações", "Your notes"),
      todasNotas.length
        ? t(`${todasNotas.length} anotaç${todasNotas.length === 1 ? "ão" : "ões"} do calendário`, `${todasNotas.length} note${todasNotas.length === 1 ? "" : "s"} from the calendar`)
        : t("anote no Calendário, tocando num dia", "add them in the Calendar by tapping a day"),
      "#14231A",
    ],
  ];

  return (
    <>
      <CabecalhoInterno
        etiqueta={t(`SAFRA ${safra}`, `SEASON ${safra}`)}
        titulo={t("Sua safra", "Your season")}
        subtitulo={t("Escolha o que quer ver, baixe ou mande para o técnico", "Pick what you want, download it or send it to your advisor")}
        onMenu={onMenu}
      />
      <main className={`-mt-6 flex flex-col gap-3.5 px-4 pb-10 ${MAIN_LARGO}`}>
        <Coluna lado>
        <section className="wh-in flex flex-col gap-3 rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.07)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-lg font-black tracking-normal">{t("O que entra no relatório", "What goes in the report")}</h2>
            <button
              type="button"
              onClick={() => setEscolhidos(nada ? OPCOES.map(([b]) => b) : [])}
              className="min-h-11 cursor-pointer border-none bg-transparent text-sm font-extrabold text-lavoura-escura underline"
            >
              {nada ? t("Marcar tudo", "Select all") : t("Limpar", "Clear")}
            </button>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {OPCOES.map(([b, rotulo, sub, cor]) => (
              <li key={b}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={tem(b)}
                  onClick={() => alternar(b)}
                  className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 text-left text-[15px] font-extrabold text-texto ${
                    tem(b) ? "border-lavoura bg-[#EEF7EC]" : "border-transparent bg-campo"
                  }`}
                >
                  <span className="size-3 flex-none rounded-full" style={{ background: cor }} />
                  <span className="flex flex-1 flex-col py-2">
                    {rotulo}
                    <span className="text-[13px] font-semibold text-texto-2">{sub}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-6 flex-none items-center justify-center rounded-md text-sm text-white ${tem(b) ? "bg-lavoura" : "bg-white ring-2 ring-[#D6CFBE]"}`}
                  >
                    {tem(b) ? "✓" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="wh-in flex flex-col gap-2.5 rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]" style={{ animationDelay: ".1s" }}>
          <h2 className="m-0 text-lg font-black tracking-normal">{t("Gerar e baixar", "Generate and download")}</h2>
          <button type="button" disabled={nada} onClick={() => window.print()} className={`${botao} !border-none !bg-lavoura-escura !text-white`}>
            {t("Gerar relatório (PDF)", "Generate report (PDF)")}
          </button>
          <p className="m-0 text-[13px] leading-[1.45] text-texto-2">
            {t("Abre a impressão: escolha “Salvar como PDF” para guardar o arquivo.", "Opens printing: choose “Save as PDF” to keep the file.")}
          </p>
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <button type="button" disabled={nada} onClick={() => baixarTexto(texto, `${arquivo}.txt`, "text/plain")} className={botao}>
              {t("Baixar texto", "Download text")}
            </button>
            <button type="button" disabled={eventos.length + notas.length === 0} onClick={() => baixarTexto(montarCsv(eventos, notas, t("Anotação", "Note")), `${arquivo}.csv`, "text/csv")} className={botao}>
              {t("Baixar planilha", "Download sheet")}
            </button>
            <button
              type="button"
              disabled={eventos.length === 0}
              onClick={() => baixarIcs(paraAgenda(eventos, local.nome, nota), `${arquivo}.ics`)}
              className={botao}
            >
              {t("Baixar agenda", "Download calendar")}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noreferrer"
              aria-disabled={nada}
              className={`${botao} no-underline ${nada ? "pointer-events-none opacity-40" : ""}`}
            >
              <IcWhatsApp />
              WhatsApp
            </a>
          </div>
        </section>
        </Coluna>

        <Coluna>
        <section id="relatorio" className="wh-in rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]" style={{ animationDelay: ".2s" }}>
          <div className="flex flex-col gap-3 text-texto">
            <div className="border-b-2 border-texto pb-2">
              <span className="font-mono text-xs tracking-[0.14em] text-texto-2">WEHARVEST · NASA POWER</span>
              <h2 className="m-0 text-xl font-black tracking-normal">{titulo}</h2>
              <p className="m-0 text-sm">{campo}</p>
              <p className="m-0 text-[13px] text-texto-2">{t(`Gerado em ${data(hoje)}`, `Generated on ${data(hoje)}`)}</p>
            </div>
            {nada && <p className="m-0 text-sm text-texto-2">{t("Marque acima o que você quer no relatório.", "Tick above what you want in the report.")}</p>}
            {eventos.length > 0 && (
              <div>
                <h3 className="m-0 mb-1 text-base font-black">{t("Datas da safra", "Season dates")}</h3>
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                  {eventos.map((e) => (
                    <li key={e.tipo} className="flex justify-between gap-3 border-b border-divisor py-1">
                      <span className="flex items-center gap-2 font-bold">
                        <span className="size-2.5 flex-none rounded-full" style={{ background: e.cor }} />
                        {e.titulo}
                      </span>
                      <span className="text-right">{periodo(e)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tem("risco") && (
              <div>
                <h3 className="m-0 mb-1 text-base font-black">{t("Risco histórico", "Historical risk")}</h3>
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                  {linhasRisco.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <p className="m-0 mt-1 text-[13px] text-texto-2">{aviso}</p>
              </div>
            )}
            {tem("rotacao") && (
              <div>
                <h3 className="m-0 mb-1 text-base font-black">{t("O que plantar depois da soja", "What to plant after soybeans")}</h3>
                <p className="m-0 text-sm">
                  <strong>{melhor}.</strong> {modelo.motivo}
                </p>
              </div>
            )}
            {notas.length > 0 && (
              <div>
                <h3 className="m-0 mb-1 text-base font-black">{t("Suas anotações", "Your notes")}</h3>
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                  {notas.map((n, k) => (
                    <li key={k} className="flex gap-3 border-b border-divisor py-1">
                      <span className="flex-none font-bold">{data(n.dia)}</span>
                      <span className="break-words">{n.texto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="m-0 text-[13px] text-texto-2">{nota}</p>
          </div>
        </section>
        </Coluna>
      </main>
    </>
  );
}
