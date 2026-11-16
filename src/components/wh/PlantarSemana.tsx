"use client";

import { useEffect, useMemo, useState } from "react";
import { avaliarPrevisao, PARAMS_PREVISAO, type PrevisaoDiaria } from "@/lib/engine/previsao.ts";
import { IcTempo } from "@/components/wh/Arte";
import { fmtNum, useLang, useT } from "@/lib/i18n";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "ok"; dados: PrevisaoDiaria & { weather_code?: number[] } };

const COR: Record<string, { fundo: string; borda: string; texto: string; pt: string; en: string }> = {
  "nao-plantar": { fundo: "#FDE3D3", borda: "#E07A3E", texto: "#6B2C08", pt: "Melhor esperar", en: "Better wait" },
  atencao: { fundo: "#FFF4DC", borda: "#F2C46A", texto: "#5C3D07", pt: "Atenção", en: "Caution" },
  // Não dizemos "pode plantar": no teste com estações (teste 5) a previsão da semana avisou poucas das geadas e chuvas fortes.
  "sem-alerta": { fundo: "#E3F2E1", borda: "#7CC46A", texto: "#1F5A34", pt: "Sem alerta na previsão", en: "No alert in the forecast" },
};

/** "Posso plantar a soja esta semana?": previsão de 16 dias (Open-Meteo) com as regras do motor (src/lib/engine/previsao.ts). */
export function PlantarSemana({
  nome,
  lat,
  lon,
  baixada,
  limiteGeadaC,
  ajusteBaixadaC,
}: {
  nome: string;
  lat: number;
  lon: number;
  baixada: boolean;
  limiteGeadaC: number;
  ajusteBaixadaC: number;
}) {
  const t = useT();
  const lang = useLang();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code&forecast_days=16&timezone=America%2FSao_Paulo`,
      { signal: ctrl.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j) => {
        if (!j?.daily?.time) throw new Error("resposta inesperada");
        setEstado({ tipo: "ok", dados: j.daily });
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name !== "AbortError") setEstado({ tipo: "erro" });
      });
    return () => ctrl.abort();
  }, [lat, lon]);

  const limite = limiteGeadaC + (baixada ? ajusteBaixadaC : 0);
  const av = useMemo(
    () =>
      estado.tipo === "ok"
        ? avaliarPrevisao(estado.dados, { ...PARAMS_PREVISAO, limiteGeadaC }, baixada ? ajusteBaixadaC : 0, lang)
        : null,
    [estado, limiteGeadaC, baixada, ajusteBaixadaC, lang],
  );
  const SEMANA = lang === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const c = av ? COR[av.nivel] : null;

  return (
    <section className="wh-in flex flex-col gap-3 rounded-3xl bg-white p-[18px] shadow-[0_6px_20px_rgba(20,35,26,.05)]" aria-labelledby="wh-semana">
      <div className="flex flex-col gap-0.5">
        <h2 id="wh-semana" className="m-0 text-lg font-black tracking-normal">
          {t("Posso plantar esta semana?", "Can I plant this week?")}
        </h2>
        <span className="text-sm text-texto-2">{t(`Previsão para ${nome}`, `Forecast for ${nome}`)}</span>
      </div>

      {estado.tipo === "carregando" && (
        <ul className="m-0 grid list-none grid-cols-7 gap-[5px] p-0" aria-busy="true">
          {Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="h-[92px] animate-pulse rounded-2xl bg-campo" />
          ))}
        </ul>
      )}
      {estado.tipo === "erro" && (
        <p className="m-0 rounded-2xl bg-campo p-3 text-sm text-texto-2">
          {t(
            "Sem previsão agora (sem internet ou serviço fora do ar). O resto da tela usa dados históricos e continua valendo.",
            "No forecast right now (offline or service down). The rest of the screen uses historical data and still applies.",
          )}
        </p>
      )}
      {estado.tipo === "ok" && av && c && (
        <>
          <div role="status" className="flex flex-col gap-1.5 rounded-2xl border-2 p-3.5" style={{ background: c.fundo, borderColor: c.borda, color: c.texto }}>
            <span className="text-[13px] font-extrabold uppercase tracking-[0.04em]">{t(c.pt, c.en)}</span>
            <span className="text-[17px] font-extrabold leading-[1.3]">{av.titulo}</span>
            {av.mensagens.length > 0 && (
              <ul className="m-0 flex list-disc flex-col gap-0.5 pl-5 text-[15px] leading-[1.4]">
                {av.mensagens.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
          <ul className="m-0 grid list-none grid-cols-7 gap-[5px] p-0" aria-label={t("Próximos 7 dias", "Next 7 days")}>
            {estado.dados.time.slice(0, 7).map((dia, i) => {
              const tmin = estado.dados.temperature_2m_min[i];
              const chuva = estado.dados.precipitation_sum[i];
              const cod = estado.dados.weather_code?.[i] ?? 0;
              const frio = tmin !== null && tmin <= limite;
              const forte = chuva !== null && chuva >= PARAMS_PREVISAO.chuvaForteMm;
              const wd = new Date(`${dia}T12:00:00`).getDay();
              return (
                <li
                  key={dia}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2 ${frio ? "bg-[#DCE8F6]" : i === 0 ? "bg-texto text-white" : "bg-campo"}`}
                  aria-label={`${SEMANA[wd]}: ${t("mínima", "low")} ${tmin === null ? "–" : fmtNum(tmin, 0, lang)}°, ${t("chuva", "rain")} ${chuva === null ? "–" : fmtNum(chuva, 0, lang)} mm`}
                >
                  <span className={`text-[13px] font-bold ${i === 0 && !frio ? "text-broto" : "text-texto-2"}`}>{SEMANA[wd]}</span>
                  <IcTempo tipo={cod >= 51 || (chuva ?? 0) >= 1 ? "chuva" : cod >= 2 ? "nuvem" : "sol"} />
                  <span className={`text-[13px] font-extrabold ${frio ? "text-[#2F5A92]" : ""}`}>{tmin === null ? "–" : `${fmtNum(tmin, 0, lang)}°`}</span>
                  <span className={`text-xs ${forte ? "font-extrabold text-[#9A3D0B]" : i === 0 && !frio ? "text-claro-2" : "text-texto-2"}`}>
                    {chuva === null ? "–" : `${fmtNum(chuva, 0, lang)}mm`}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="m-0 text-sm leading-[1.4] text-texto-2">
            {t(
              "Confie mais nos próximos 2 a 3 dias; veja de novo perto do dia. Previsão não é garantia. Fonte: Open-Meteo.",
              "Trust the next 2–3 days most; check again close to the day. A forecast is not a guarantee. Source: Open-Meteo.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
