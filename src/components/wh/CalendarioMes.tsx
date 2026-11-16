"use client";

import { useEffect, useRef, useState } from "react";
import { IcGeada, IcTempo } from "@/components/wh/Arte";
import { isoDe } from "@/components/wh/caderno";
import { COR_EVENTO, eventosDoDia, mesmoDia, type EventoSafra, type TipoEvento } from "@/components/wh/safra";
import { useLang, useT } from "@/lib/i18n";

const maiuscula = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Mês da safra (0 = setembro … 11 = agosto) de uma data. */
export const mesNaSafra = (x: Date) => (x.getMonth() + 4) % 12;

// ---------- previsão de 7 dias (Open-Meteo) ----------

export interface DiaPrevisto {
  codigo: number;
  tmin: number | null;
  tmax: number | null;
  chuva: number | null;
  vento: number | null;
}

/** Previsão dos próximos 7 dias por data (AAAA-MM-DD). Envia só as coordenadas públicas do município. */
export function usePrevisao(lat: number, lon: number): { tipo: "carregando" | "erro" } | { tipo: "ok"; dias: Record<string, DiaPrevisto> } {
  const [estado, setEstado] = useState<{ chave: string; r: { tipo: "erro" } | { tipo: "ok"; dias: Record<string, DiaPrevisto> } } | null>(null);
  const chave = `${lat},${lon}`;
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max&forecast_days=7&timezone=America%2FSao_Paulo`,
      { signal: ctrl.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j) => {
        const dd = j?.daily;
        if (!dd?.time) throw new Error("resposta inesperada");
        const dias: Record<string, DiaPrevisto> = {};
        (dd.time as string[]).forEach((data, i) => {
          dias[data] = {
            codigo: dd.weather_code?.[i] ?? 0,
            tmin: dd.temperature_2m_min?.[i] ?? null,
            tmax: dd.temperature_2m_max?.[i] ?? null,
            chuva: dd.precipitation_sum?.[i] ?? null,
            vento: dd.wind_speed_10m_max?.[i] ?? null,
          };
        });
        setEstado({ chave: `${lat},${lon}`, r: { tipo: "ok", dias } });
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name !== "AbortError") setEstado({ chave: `${lat},${lon}`, r: { tipo: "erro" } });
      });
    return () => ctrl.abort();
  }, [lat, lon]);
  return estado && estado.chave === chave ? estado.r : { tipo: "carregando" };
}

const icone = (x: DiaPrevisto): "sol" | "nuvem" | "chuva" => (x.codigo >= 51 || (x.chuva ?? 0) >= 1 ? "chuva" : x.codigo >= 2 ? "nuvem" : "sol");
const geadaPrevista = (x: DiaPrevisto) => x.tmin !== null && x.tmin <= 3;
function pulverizar(x: DiaPrevisto): { cor: string; pt: string; en: string } {
  const chuva = x.chuva ?? 0;
  const vento = x.vento ?? 0;
  if (chuva >= 5 || vento >= 25) return { cor: "#B4480E", pt: "evite pulverizar", en: "avoid spraying" };
  if (chuva >= 1 || vento >= 15) return { cor: "#9A6A12", pt: "pulverizar com atenção", en: "spray with caution" };
  return { cor: "#2E7D4A", pt: "bom para pulverizar", en: "good for spraying" };
}

// ---------- calendário ----------

const FAIXAS: TipoEvento[] = ["flor", "geada"];
const PONTOS: TipoEvento[] = ["soja", "colheita", "milho"];

export function CalendarioMes({
  eventos,
  hoje,
  ano,
  sel,
  onSel,
  mes,
  onMes,
  foco,
  previsao,
  notas,
  onAnotar,
  onApagarNota,
}: {
  eventos: EventoSafra[];
  hoje: Date;
  ano: number;
  sel: Date;
  onSel: (x: Date) => void;
  mes: number;
  onMes: (m: number) => void;
  /** Etapa destacada (as outras ficam apagadas). */
  foco: TipoEvento | null;
  previsao: Record<string, DiaPrevisto> | null;
  notas: Record<string, string[]>;
  onAnotar: (iso: string, texto: string) => void;
  onApagarNota: (iso: string, i: number) => void;
}) {
  const t = useT();
  const lang = useLang();
  const [texto, setTexto] = useState("");
  const toque = useRef<number | null>(null);

  const primeiro = new Date(mes < 4 ? ano : ano + 1, (mes + 8) % 12, 1);
  const dias = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
  const vazios = primeiro.getDay();
  const intl = lang === "en" ? "en-US" : "pt-BR";
  const nomeMes = maiuscula(new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(primeiro));
  const semana = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(intl, { weekday: "narrow" }).format(new Date(2025, 8, 7 + i)));
  const curto = (x: Date) => new Intl.DateTimeFormat(intl, { day: "2-digit", month: "2-digit" }).format(x);
  const longo = maiuscula(new Intl.DateTimeFormat(intl, { weekday: "long", day: "numeric", month: "long" }).format(sel));
  const diasDoMes = Array.from({ length: dias }, (_, i) => new Date(primeiro.getFullYear(), primeiro.getMonth(), i + 1));

  const isoSel = isoDe(sel);
  const doDia = eventosDoDia(eventos, sel);
  const notasDoDia = notas[isoSel] ?? [];
  const prevSel = previsao?.[isoSel];
  const proximo = [...eventos]
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
    .find((e) => e.inicio.getTime() > sel.getTime());

  const irPara = (x: Date) => {
    onSel(x);
    onMes(mesNaSafra(x));
  };
  const trocarMes = (m: number) => onMes(Math.min(11, Math.max(0, m)));

  // legenda só com o que aparece neste mês
  const noMes = new Set<string>();
  diasDoMes.forEach((x) => {
    eventosDoDia(eventos, x).forEach((e) => noMes.add(e.tipo));
    if (notas[isoDe(x)]) noMes.add("nota");
    const p = previsao?.[isoDe(x)];
    if (p && geadaPrevista(p)) noMes.add("geadaPrevista");
  });

  const seta = "flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-campo text-lg font-black text-texto disabled:opacity-30";
  const apagado = (tipo: TipoEvento) => (foco && foco !== tipo ? 0.25 : 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button type="button" className={seta} disabled={mes === 0} onClick={() => trocarMes(mes - 1)} aria-label={t("Mês anterior", "Previous month")}>
          ‹
        </button>
        <div className="flex flex-col items-center">
          <h3 className="m-0 text-lg font-black tracking-normal" aria-live="polite">
            {nomeMes}
          </h3>
          {mes !== mesNaSafra(hoje) && (
            <button
              type="button"
              onClick={() => irPara(hoje)}
              className="min-h-8 cursor-pointer rounded-full border-none bg-texto px-3 text-[13px] font-extrabold text-white"
            >
              {t(`Hoje · ${curto(hoje)}`, `Today · ${curto(hoje)}`)}
            </button>
          )}
        </div>
        <button type="button" className={seta} disabled={mes === 11} onClick={() => trocarMes(mes + 1)} aria-label={t("Próximo mês", "Next month")}>
          ›
        </button>
      </div>

      <div
        role="grid"
        aria-label={nomeMes}
        className="grid touch-pan-y grid-cols-7 gap-y-1"
        onTouchStart={(e) => {
          toque.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (toque.current === null) return;
          const dx = e.changedTouches[0].clientX - toque.current;
          toque.current = null;
          if (Math.abs(dx) > 50) trocarMes(dx < 0 ? mes + 1 : mes - 1);
        }}
      >
        {semana.map((s, i) => (
          <span key={i} role="columnheader" className="pb-1 text-center text-[13px] font-bold text-texto-2">
            {s}
          </span>
        ))}
        {Array.from({ length: vazios }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {diasDoMes.map((data, i) => {
          const iso = isoDe(data);
          const ev = eventosDoDia(eventos, data);
          const ehHoje = mesmoDia(data, hoje);
          const ativo = mesmoDia(data, sel);
          const p = previsao?.[iso];
          const temNota = !!notas[iso];
          const flor = ev.find((e) => e.tipo === "flor");
          const gea = ev.find((e) => e.tipo === "geada");
          const encontro = flor && gea && !foco;
          const rotulo = [
            new Intl.DateTimeFormat(intl, { day: "numeric", month: "long" }).format(data),
            ehHoje ? t("hoje", "today") : "",
            ...ev.map((e) => e.titulo),
            temNota ? t("tem anotação", "has a note") : "",
            p && geadaPrevista(p) ? t("geada prevista", "frost forecast") : "",
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-selected={ativo}
              aria-label={rotulo}
              onClick={() => onSel(data)}
              className="relative h-[58px] cursor-pointer border-none bg-transparent p-0"
            >
              <span
                className={`absolute inset-x-[2px] inset-y-0 rounded-xl ${ativo ? "ring-2 ring-texto" : ""}`}
                style={{ background: encontro ? "#FDE3D3" : ativo ? "#FFFFFF" : "#F3F0E7" }}
              />
              <span
                className={`absolute left-[6px] top-[5px] flex size-6 items-center justify-center rounded-full text-[14px] leading-none ${
                  ehHoje ? "bg-texto font-black text-white" : "font-bold text-texto"
                }`}
              >
                {i + 1}
              </span>
              {p && (
                <span className="absolute right-[5px] top-[28px]">
                  {geadaPrevista(p) ? <IcGeada size={16} ponta={false} /> : <IcTempo tipo={icone(p)} size={16} />}
                </span>
              )}
              <span className="absolute left-[7px] top-[33px] flex gap-[3px]">
                {ev
                  .filter((e) => PONTOS.includes(e.tipo))
                  .map((e) => (
                    <span key={e.tipo} className="size-2 rounded-full" style={{ background: e.cor, opacity: apagado(e.tipo) }} />
                  ))}
                {temNota && <span className="size-2 rounded-full border-2 border-texto bg-white" />}
              </span>
              {FAIXAS.map((tipo, lane) => {
                const e = ev.find((x) => x.tipo === tipo);
                if (!e?.fim) return null;
                const comeca = mesmoDia(data, e.inicio) || data.getDay() === 0 || i === 0;
                const termina = mesmoDia(data, e.fim) || data.getDay() === 6 || i === dias - 1;
                return (
                  <span
                    key={tipo}
                    className="absolute h-[5px]"
                    style={{
                      bottom: 5 + (1 - lane) * 7,
                      left: comeca ? 4 : 0,
                      right: termina ? 4 : 0,
                      background: e.cor,
                      opacity: apagado(tipo),
                      borderRadius: `${mesmoDia(data, e.inicio) ? 3 : 0}px ${mesmoDia(data, e.fim) ? 3 : 0}px ${mesmoDia(data, e.fim) ? 3 : 0}px ${mesmoDia(data, e.inicio) ? 3 : 0}px`,
                    }}
                  />
                );
              })}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] font-bold text-texto-2">
        {(["soja", "colheita", "milho"] as const)
          .filter((k) => noMes.has(k))
          .map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: COR_EVENTO[k] }} />
              {eventos.find((x) => x.tipo === k)?.titulo}
            </span>
          ))}
        {(["flor", "geada"] as const)
          .filter((k) => noMes.has(k))
          .map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-[5px] w-4 rounded-sm" style={{ background: COR_EVENTO[k] }} />
              {eventos.find((x) => x.tipo === k)?.titulo}
            </span>
          ))}
        {noMes.has("flor") && noMes.has("geada") && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-[#FDE3D3] ring-1 ring-[#E07A3E]" />
            {t("flor + frio", "flowers + cold")}
          </span>
        )}
        {noMes.has("nota") && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-texto bg-white" />
            {t("sua anotação", "your note")}
          </span>
        )}
        {noMes.has("geadaPrevista") && (
          <span className="flex items-center gap-1.5">
            <IcGeada size={14} ponta={false} />
            {t("geada prevista", "frost forecast")}
          </span>
        )}
        {noMes.size === 0 && <span>{t("Nada da safra neste mês.", "Nothing from the season this month.")}</span>}
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl bg-campo p-3.5" aria-live="polite">
        <span className="text-[15px] font-extrabold">
          {mesmoDia(sel, hoje) ? t("Hoje · ", "Today · ") : ""}
          {longo}
        </span>

        {prevSel && (
          <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5">
            {geadaPrevista(prevSel) ? <IcGeada size={24} ponta={false} /> : <IcTempo tipo={icone(prevSel)} />}
            <span className="flex flex-col text-sm leading-[1.35]">
              <span className="font-extrabold">
                {prevSel.tmin !== null && prevSel.tmax !== null ? `${Math.round(prevSel.tmin)}° ${t("a", "to")} ${Math.round(prevSel.tmax)}°` : "–"}
                {prevSel.chuva !== null ? ` · ${t("chuva", "rain")} ${Math.round(prevSel.chuva)} mm` : ""}
              </span>
              {geadaPrevista(prevSel) ? (
                <span className="font-bold text-geada">{t("Risco de geada nesta noite", "Frost risk tonight")}</span>
              ) : (
                <span className="font-bold" style={{ color: pulverizar(prevSel).cor }}>
                  {t(pulverizar(prevSel).pt, pulverizar(prevSel).en)}
                </span>
              )}
            </span>
          </div>
        )}

        {doDia.map((e) => (
          <span key={e.tipo} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-2.5 flex-none rounded-full" style={{ background: e.cor }} />
            <span>
              <strong>{e.titulo}</strong>
              {e.feitoEm && <span className="font-bold text-lavoura">{t(" · feito", " · done")}</span>}
              <br />
              <span className="text-texto-2">{e.detalhe}</span>
            </span>
          </span>
        ))}

        {doDia.length === 0 && !prevSel && notasDoDia.length === 0 && (
          <span className="text-sm text-texto-2">{t("Nada marcado neste dia.", "Nothing scheduled on this day.")}</span>
        )}
        {doDia.length === 0 && proximo && (
          <button
            type="button"
            onClick={() => irPara(proximo.inicio)}
            className="min-h-11 cursor-pointer self-start border-none bg-transparent p-0 text-left text-sm font-extrabold text-lavoura-escura underline"
          >
            {t(`Próximo: ${proximo.titulo} (${curto(proximo.inicio)})`, `Next: ${proximo.titulo} (${curto(proximo.inicio)})`)}
          </button>
        )}

        {notasDoDia.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {notasDoDia.map((n, k) => (
              <li key={k} className="flex items-center gap-2 rounded-xl bg-white py-1 pl-3 pr-1 text-sm">
                <span className="flex-1 break-words">{n}</span>
                <button
                  type="button"
                  onClick={() => onApagarNota(isoSel, k)}
                  aria-label={t(`Apagar anotação: ${n}`, `Delete note: ${n}`)}
                  className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-xl text-texto-2"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onAnotar(isoSel, texto);
            setTexto("");
          }}
        >
          <label className="sr-only" htmlFor="wh-nota">
            {t("Anotar neste dia", "Note for this day")}
          </label>
          <input
            id="wh-nota"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={280}
            placeholder={t("Anotar: ex. aplicar fungicida", "Note: e.g. apply fungicide")}
            className="min-h-11 min-w-0 flex-1 rounded-full border-[1.5px] border-[#D6CFBE] bg-white px-4 text-[15px] text-texto"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            className="min-h-11 flex-none cursor-pointer rounded-full border-none bg-lavoura px-4 text-sm font-extrabold text-white disabled:opacity-40"
          >
            {t("Anotar", "Add")}
          </button>
        </form>
      </div>
    </div>
  );
}
