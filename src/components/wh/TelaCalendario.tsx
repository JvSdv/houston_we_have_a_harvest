"use client";

import { useRef, useState } from "react";
import type { DataView, LocalView } from "@/lib/view-data";
import { IcCheck, IcColheita, IcExclamacao, IcFlor, IcMilho, IcSoja } from "@/components/wh/Arte";
import { CabecalhoInterno, Coluna, MAIN_LARGO } from "@/components/wh/Moldura";
import { CalendarioMes, mesNaSafra, usePrevisao } from "@/components/wh/CalendarioMes";
import { isoDe, type AcoesCaderno, type Caderno, type LembreteId } from "@/components/wh/caderno";
import { encontroFlorGeada, eventosDaSafra, paraAgenda, type TipoEvento } from "@/components/wh/safra";
import { anoDaSafra, baixarIcs, diasEntre, fraseDez, linkGoogleAgenda } from "@/components/wh/modelo";
import { fmtDia, useLang, useT } from "@/lib/i18n";

export type { LembreteId };

const ICONE: Record<LembreteId, { no: React.ReactNode; fundo: string }> = {
  soja: { no: <IcSoja size={24} />, fundo: "#E3F2E1" },
  colheita: { no: <IcColheita size={24} />, fundo: "#FBEFD2" },
  milho: { no: <IcMilho size={24} />, fundo: "#FBEFD2" },
  flor: { no: <IcFlor size={24} />, fundo: "#FDE3D3" },
};

export function TelaCalendario({
  local,
  d,
  baixada,
  cicloMilho,
  hoje,
  modo,
  caderno,
  acoes,
  onVoltar,
  onMenu,
}: {
  local: LocalView;
  d: DataView;
  baixada: boolean;
  cicloMilho: number;
  hoje: Date;
  modo: "vou" | "ja";
  caderno: Caderno;
  acoes: AcoesCaderno;
  onVoltar?: () => void;
  onMenu?: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const ano = anoDaSafra(hoje);
  const intl = lang === "en" ? "en-US" : "pt-BR";
  const curto = (x: Date) => new Intl.DateTimeFormat(intl, { day: "2-digit", month: "2-digit" }).format(x);
  const eventos = eventosDaSafra({ d, local, cicloMilho, hoje, t, lang, feitos: caderno.feitos, modo });
  const geada = baixada ? d.geadaBaixada : d.geada;
  const encontro = encontroFlorGeada(eventos);
  const ajustou = eventos.some((e) => e.ajustado);
  const prev = usePrevisao(local.lat, local.lon);

  const [sel, setSel] = useState<Date>(hoje);
  const [mes, setMes] = useState(mesNaSafra(hoje));
  const [foco, setFoco] = useState<TipoEvento | null>(null);
  const [editando, setEditando] = useState<LembreteId | null>(null);
  const [dataEdit, setDataEdit] = useState(isoDe(hoje));
  const refCal = useRef<HTMLElement>(null);

  const ir = (tipo: TipoEvento) => {
    const e = eventos.find((x) => x.tipo === tipo);
    if (!e) return;
    setSel(e.inicio);
    setMes(mesNaSafra(e.inicio));
    setFoco(tipo);
    refCal.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const lembretes = (["soja", "colheita", "milho", "flor"] as LembreteId[]).map((id) => {
    const e = eventos.find((x) => x.tipo === id)!;
    const automatico = id === "soja" && modo === "ja" && !caderno.feitos.soja;
    return { id, e, feito: !!e.feitoEm, automatico, faltam: diasEntre(hoje, e.inicio) };
  });
  const feitos = lembretes.filter((x) => x.feito).length;
  const nota = t("Planejado com o weharvest (dados NASA POWER). Confirme com seu agrônomo.", "Planned with weharvest (NASA POWER data). Confirm with your agronomist.");

  const salvarTodos = () => {
    const futuros = eventos.filter((e) => e.tipo !== "geada" && !e.feitoEm && diasEntre(hoje, e.fim ?? e.inicio) >= 0);
    baixarIcs(paraAgenda(futuros.length ? futuros : eventos.filter((e) => e.tipo !== "geada"), local.nome, nota), `weharvest-safra-${ano}-${String(ano + 1).slice(2)}.ics`);
  };

  const quando = (x: (typeof lembretes)[number]) => {
    const { e, faltam } = x;
    if (x.feito) return t(`feito em ${curto(e.feitoEm!)}`, `done on ${curto(e.feitoEm!)}`);
    const data = e.fim ? `${curto(e.inicio)} ${t("a", "to")} ${curto(e.fim)}` : curto(e.inicio);
    if (faltam > 1) return `${data} · ${t(`em ${faltam} dias`, `in ${faltam} days`)}`;
    if (faltam === 1) return `${data} · ${t("amanhã", "tomorrow")}`;
    if (faltam === 0) return `${data} · ${t("hoje", "today")}`;
    return `${data} · ${t("já passou: fez?", "date passed: done?")}`;
  };

  const botao = "flex min-h-11 flex-none cursor-pointer items-center rounded-full border-none px-3.5 text-sm font-extrabold no-underline";

  return (
    <>
      <CabecalhoInterno
        etiqueta={t(`SAFRA ${ano}/${String(ano + 1).slice(2)}`, `SEASON ${ano}/${String(ano + 1).slice(2)}`)}
        titulo={t("Seu ano na lavoura", "Your year in the field")}
        subtitulo={t(`${local.nome} · soja ${fmtDia(d.dataSoja, lang)} → milho safrinha`, `${local.nome} · soybeans ${fmtDia(d.dataSoja, lang)} → second-crop corn`)}
        onVoltar={onVoltar}
        onMenu={onMenu}
      />
      <main className={`-mt-6 flex flex-col gap-3.5 px-4 pb-10 ${MAIN_LARGO}`}>
        <Coluna>
        <section ref={refCal} className="wh-in flex scroll-mt-4 flex-col gap-3.5 rounded-[28px] bg-white p-4 shadow-[0_6px_20px_rgba(20,35,26,.07)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="m-0 text-xl font-black tracking-normal">{t("Calendário da safra", "Season calendar")}</h2>
              <span className="text-sm text-texto-2">{t("Toque num dia para ver e anotar", "Tap a day to see it and add notes")}</span>
            </div>
            {foco && (
              <button type="button" onClick={() => setFoco(null)} className={`${botao} bg-campo text-texto`}>
                {t("Ver tudo", "Show all")}
              </button>
            )}
          </div>
          <CalendarioMes
            eventos={eventos}
            hoje={hoje}
            ano={ano}
            sel={sel}
            onSel={(x) => {
              setSel(x);
              setFoco(null);
            }}
            mes={mes}
            onMes={setMes}
            foco={foco}
            previsao={prev.tipo === "ok" ? prev.dias : null}
            notas={caderno.notas}
            onAnotar={acoes.anotar}
            onApagarNota={acoes.apagarNota}
          />
          <div className="flex items-start gap-2.5 rounded-2xl bg-[#FDF0E7] px-3.5 py-3">
            <IcExclamacao />
            <span className="text-[15px] leading-[1.4] text-[#6B2C08]">
              {encontro ? (
                <>
                  {t(
                    `De ${curto(encontro.inicio)} a ${curto(encontro.fim)} a flor do milho e o frio se encontram (dias em `,
                    `From ${curto(encontro.inicio)} to ${curto(encontro.fim)} corn flowering and the cold overlap (days in `,
                  )}
                  <strong>{t("laranja claro", "light orange")}</strong>
                  {t("). É aí que mora o risco.", "). That is where the risk lies.")}
                </>
              ) : geada.anosComEvento > 0 ? (
                <>
                  {t(
                    "A flor do milho termina antes do pico do frio, mas geadas mais cedo davam um risco de ",
                    "Corn flowering ends before the peak of the cold, but earlier frosts gave a risk of ",
                  )}
                  <strong>{fraseDez(geada, lang)}</strong>.
                </>
              ) : (
                t("Com esta data, a flor do milho fica fora da época de geada.", "With this date, corn flowering stays outside the frost season.")
              )}
              {ajustou &&
                t(
                  " As datas foram ajustadas pelo que você marcou como feito; o risco mostrado no app é o da data planejada.",
                  " Dates were adjusted to what you marked as done; the risk shown in the app is for the planned date.",
                )}
            </span>
          </div>
          {prev.tipo === "erro" && (
            <p className="m-0 text-[13px] text-texto-2">{t("Previsão do tempo indisponível agora.", "Weather forecast unavailable right now.")}</p>
          )}
          {prev.tipo === "ok" && (
            <p className="m-0 text-[13px] text-texto-2">
              {t("Ícones de tempo: previsão dos próximos 7 dias (", "Weather icons: next 7 days forecast (")}
              <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                Open-Meteo
              </a>
              ).
            </p>
          )}
        </section>
        </Coluna>

        <Coluna lado>
        <section className="wh-in flex flex-col gap-1.5 rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]" style={{ animationDelay: ".1s" }}>
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="m-0 text-lg font-black tracking-normal">{t("Lembretes", "Reminders")}</h2>
            <span className="text-sm text-texto-2">{t(`${feitos} de ${lembretes.length} feito${feitos === 1 ? "" : "s"}`, `${feitos} of ${lembretes.length} done`)}</span>
          </div>
          <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[#EEE8DB]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#7CC46A,#2E7D4A)] transition-[width]" style={{ width: `${(feitos / lembretes.length) * 100}%` }} />
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {lembretes.map((x) => {
              const perto = x.faltam <= 7;
              return (
                <li key={x.id} className="flex flex-col border-b border-divisor py-2">
                  <div className="flex min-h-12 items-center gap-3">
                    <span
                      className="flex size-11 flex-none items-center justify-center rounded-full"
                      style={{ background: x.feito ? "#2E7D4A" : ICONE[x.id].fundo }}
                    >
                      {x.feito ? <IcCheck /> : ICONE[x.id].no}
                    </span>
                    <button
                      type="button"
                      onClick={() => ir(x.id)}
                      aria-label={t(`${x.e.titulo}: ver no calendário`, `${x.e.titulo}: show on the calendar`)}
                      className="flex min-h-11 flex-1 cursor-pointer flex-col items-start border-none bg-transparent p-0 text-left"
                    >
                      <span className={`text-[15px] font-extrabold ${x.feito ? "text-texto-2 line-through" : "text-texto"}`}>{x.e.titulo}</span>
                      <span className={`text-sm ${x.faltam < 0 && !x.feito ? "font-bold text-risco" : "text-texto-2"}`}>{quando(x)}</span>
                    </button>
                    {x.feito ? (
                      !x.automatico && (
                        <button type="button" onClick={() => acoes.marcarFeito(x.id, null)} className={`${botao} bg-transparent text-texto-2 underline`}>
                          {t("Desfazer", "Undo")}
                        </button>
                      )
                    ) : perto ? (
                      <button
                        type="button"
                        aria-expanded={editando === x.id}
                        onClick={() => {
                          setEditando(editando === x.id ? null : x.id);
                          setDataEdit(isoDe(x.e.inicio <= hoje ? x.e.inicio : hoje));
                        }}
                        className={`${botao} bg-lavoura text-white`}
                      >
                        {t("Feito", "Done")}
                      </button>
                    ) : (
                      <a
                        href={linkGoogleAgenda({ titulo: x.e.titulo, inicio: x.e.inicio, fim: x.e.fim, descricao: `${local.nome} · ${x.e.detalhe}. ${nota}` })}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t(`Adicionar à agenda: ${x.e.titulo}`, `Add to calendar: ${x.e.titulo}`)}
                        className={`${botao} bg-[#E3F2E1] text-lavoura-escura`}
                      >
                        + {t("Agenda", "Calendar")}
                      </a>
                    )}
                  </div>
                  {editando === x.id && (
                    <form
                      className="ml-14 mt-1 flex flex-wrap items-center gap-2"
                      onSubmit={(ev) => {
                        ev.preventDefault();
                        if (!dataEdit) return;
                        acoes.marcarFeito(x.id, dataEdit);
                        setEditando(null);
                      }}
                    >
                      <label className="flex flex-col gap-1 text-sm font-bold text-texto-2">
                        {x.id === "flor" ? t("Quando a flor terminou?", "When did flowering end?") : t("Em que dia você fez?", "On which day did you do it?")}
                        <input
                          type="date"
                          value={dataEdit}
                          max={isoDe(hoje)}
                          onChange={(ev) => setDataEdit(ev.target.value)}
                          className="min-h-11 rounded-xl border-[1.5px] border-[#D6CFBE] bg-white px-3 text-[15px] text-texto"
                        />
                      </label>
                      <button type="submit" className={`${botao} mt-6 bg-texto text-white`}>
                        {t("Salvar", "Save")}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
          {ajustou && (
            <p className="m-0 mt-1 text-[13px] text-texto-2">
              {t("Com a data real, o app ajusta as etapas seguintes.", "With the real date, the app moves the next stages.")}
            </p>
          )}
          <button
            type="button"
            onClick={salvarTodos}
            className="mt-2 min-h-12 cursor-pointer rounded-full border-[1.5px] border-[#D6CFBE] bg-white text-[15px] font-extrabold text-texto"
          >
            {t("Salvar tudo na agenda do celular", "Save all to your phone calendar")}
          </button>
        </section>
        </Coluna>
      </main>
    </>
  );
}

