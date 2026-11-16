"use client";

import { useState } from "react";
import type { DataView } from "@/lib/view-data";
import { diaLongo, emDez, fraseDez } from "@/components/wh/modelo";
import { fmtDia, useLang, useT } from "@/lib/i18n";
import { Folha } from "@/components/wh/Moldura";

/** Cor de cada data pela geada (anos em 10): verde = pouca, laranja = muita. */
export function corGeada(n: number): string {
  return n <= 1 ? "#7CC46A" : n === 2 ? "#A8D88F" : n === 3 ? "#F2C46A" : "#E9A17A";
}

function Seta({ dir }: { dir: "esq" | "dir" }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14231A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "esq" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/** Escolha da data de plantio: dia grande com setas e uma régua para arrastar, colorida pelo risco de geada. */
export function SeletorDia({
  datas,
  idx,
  onIdx,
  baixada,
  titulo,
}: {
  datas: DataView[];
  idx: number;
  onIdx: (i: number) => void;
  baixada: boolean;
  titulo: string;
}) {
  const t = useT();
  const lang = useLang();
  const [aberto, setAberto] = useState(false);
  const g = (x: DataView) => (baixada ? x.geadaBaixada : x.geada);
  const d = datas[idx];
  const n = datas.length;
  const pos = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
  // marcas de mês: primeira data de cada mês
  const marcas = datas
    .map((x, i) => ({ i, m: x.dataSoja.slice(0, 2) }))
    .filter((x, k, arr) => k === 0 || arr[k - 1].m !== x.m);
  const MESES = lang === "en" ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  return (
    <div className="flex flex-col gap-2.5">
      <span id="wh-q-data" className="text-base font-extrabold">
        {titulo}
      </span>
      <div className="flex items-center gap-2 rounded-2xl bg-campo p-1.5">
        <button
          type="button"
          aria-label={t("Data anterior", "Earlier date")}
          disabled={idx === 0}
          onClick={() => onIdx(idx - 1)}
          className="flex size-12 flex-none cursor-pointer items-center justify-center rounded-xl border-none bg-white disabled:opacity-40"
        >
          <Seta dir="esq" />
        </button>
        <div className="flex flex-1 flex-col items-center" aria-live="polite">
          <span className="text-[22px] font-black leading-tight">{diaLongo(d.dataSoja, lang)}</span>
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-texto-2">
            <span className="size-2.5 rounded-full" style={{ background: corGeada(emDez(g(d)).n) }} />
            {t(`risco de geada: ${fraseDez(g(d), lang)}`, `frost risk: ${fraseDez(g(d), lang)}`)}
          </span>
        </div>
        <button
          type="button"
          aria-label={t("Data seguinte", "Later date")}
          disabled={idx === n - 1}
          onClick={() => onIdx(idx + 1)}
          className="flex size-12 flex-none cursor-pointer items-center justify-center rounded-xl border-none bg-white disabled:opacity-40"
        >
          <Seta dir="dir" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-lavoura bg-white px-3 text-[15px] font-extrabold text-lavoura"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
        {t("Abrir calendário", "Open calendar")}
      </button>
      {aberto && (
        <Folha titulo={t("Escolha o dia de plantio da soja", "Pick the soybean planting day")} onFechar={() => setAberto(false)}>
          <Calendario datas={datas} idx={idx} g={g} onEscolher={(i) => { onIdx(i); setAberto(false); }} />
        </Folha>
      )}
      <div className="relative px-3.5 pt-1">
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {datas.map((x) => (
            <span key={x.dataSoja} className="h-full flex-1" style={{ background: corGeada(emDez(g(x)).n) }} />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={n - 1}
          step={1}
          value={idx}
          onChange={(e) => onIdx(Number(e.target.value))}
          aria-labelledby="wh-q-data"
          aria-valuetext={`${fmtDia(d.dataSoja, lang)} · ${t(`risco de geada: ${fraseDez(g(d), lang)}`, `frost risk: ${fraseDez(g(d), lang)}`)}`}
          className="wh-range absolute inset-x-0 -top-2 h-11 w-full"
        />
        <div className="relative mt-2 h-4 text-[13px] font-bold text-texto-2" aria-hidden="true">
          {marcas.map((x) => (
            <span key={x.i} className="absolute -translate-x-1/2" style={{ left: `${pos(x.i)}%` }}>
              {MESES[Number(x.m) - 1]}
            </span>
          ))}
        </div>
      </div>
      <span className="text-[13px] text-texto-2">
        {t("Esta é a data da SOJA. O risco mostrado é o da geada no milho que vem depois. Verde = menos geada.", "This is the SOYBEAN date. The risk shown is frost on the corn that follows. Green = less frost.")}
      </span>
    </div>
  );
}

const diaDoAno = (mmdd: string) => Date.UTC(2026, Number(mmdd.slice(0, 2)) - 1, Number(mmdd.slice(3, 5))) / 86_400_000;

/** Calendário de set a dez: cada dia leva a cor da data de simulação mais próxima (a cada ~5 dias); tocar escolhe essa data. */
function Calendario({ datas, idx, g, onEscolher }: { datas: DataView[]; idx: number; g: (x: DataView) => Parameters<typeof emDez>[0]; onEscolher: (i: number) => void }) {
  const t = useT();
  const lang = useLang();
  const MESES = lang === "en" ? ["September", "October", "November", "December"] : ["Setembro", "Outubro", "Novembro", "Dezembro"];
  const SEM = lang === "en" ? ["S", "M", "T", "W", "T", "F", "S"] : ["D", "S", "T", "Q", "Q", "S", "S"];
  const maisProxima = (mmdd: string) => {
    const k = diaDoAno(mmdd);
    let melhor = 0;
    datas.forEach((x, i) => {
      if (Math.abs(diaDoAno(x.dataSoja) - k) < Math.abs(diaDoAno(datas[melhor].dataSoja) - k)) melhor = i;
    });
    return melhor;
  };
  const primeira = datas[0].dataSoja;
  const ultima = datas[datas.length - 1].dataSoja;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-bold text-texto-2">
        {[
          ["#7CC46A", t("menos geada", "less frost")],
          ["#F2C46A", t("atenção", "caution")],
          ["#E9A17A", t("mais geada", "more frost")],
        ].map(([c, r]) => (
          <span key={r} className="flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: c }} />
            {r}
          </span>
        ))}
      </div>
      {[8, 9, 10, 11].map((m) => {
        const dias = new Date(Date.UTC(2026, m + 1, 0)).getUTCDate();
        const ini = new Date(Date.UTC(2026, m, 1)).getUTCDay();
        return (
          <section key={m} aria-label={MESES[m - 8]}>
            <h3 className="m-0 mb-1.5 text-base font-black">{MESES[m - 8]}</h3>
            <div className="grid grid-cols-7 gap-1 text-center">
              {SEM.map((d, i) => (
                <span key={i} className="text-xs font-bold text-texto-2">{d}</span>
              ))}
              {Array.from({ length: ini }, (_, i) => <span key={`v${i}`} />)}
              {Array.from({ length: dias }, (_, i) => {
                const mmdd = `${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                if (mmdd < primeira || mmdd > ultima) return <span key={mmdd} className="flex h-11 items-center justify-center text-sm text-texto-2/40">{i + 1}</span>;
                const k = maisProxima(mmdd);
                const sel = k === idx;
                return (
                  <button
                    key={mmdd}
                    type="button"
                    onClick={() => onEscolher(k)}
                    aria-label={`${diaLongo(mmdd, lang)} · ${t(`risco de geada: ${fraseDez(g(datas[k]), lang)}`, `frost risk: ${fraseDez(g(datas[k]), lang)}`)}`}
                    aria-pressed={sel}
                    className={`h-11 cursor-pointer rounded-xl text-[15px] font-extrabold text-texto ${sel ? "border-[3px] border-texto" : "border-none"}`}
                    style={{ background: corGeada(emDez(g(datas[k])).n) }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="m-0 text-[13px] leading-[1.4] text-texto-2">
        {t("O risco é calculado a cada ~5 dias; o dia que você tocar usa a data calculada mais próxima.", "Risk is computed every ~5 days; the day you tap uses the nearest computed date.")}
      </p>
    </div>
  );
}
