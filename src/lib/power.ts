// Baixa e organiza, no navegador, a série diária da NASA POWER de qualquer ponto.
// Mesmo formato compacto dos arquivos pré-baixados (scripts/fetch_power_daily.mjs): arrays por parâmetro,
// índice i = data inicial + i dias; valores ausentes (-999) viram null; dias finais sem dado são removidos.
// A API da NASA aceita chamadas do navegador (access-control-allow-origin: *).

import type { DadosDiarios } from "./engine/index.ts";

export const PARAMETROS_POWER = ["T2M_MIN", "T2M_MAX", "PRECTOTCORR", "GWETROOT", "GWETTOP"] as const;
export const INICIO_POWER = "19810101";
/** Menos que isto não dá para contar safras com confiança mínima. */
const MIN_DIAS = 365 * 20;

const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");

export function urlPower(lat: number, lon: number, hoje: Date = new Date()): string {
  const qs = new URLSearchParams({
    parameters: PARAMETROS_POWER.join(","),
    community: "AG",
    longitude: String(lon),
    latitude: String(lat),
    start: INICIO_POWER,
    end: yyyymmdd(hoje),
    format: "JSON",
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${qs}`;
}

export interface LocalPower {
  id: string;
  nome: string;
  lat: number;
  lon: number;
}

type RespostaPower = {
  header?: { fill_value?: number; api?: { version?: string }; sources?: string[]; time_standard?: string };
  geometry?: { coordinates?: number[] };
  properties?: { parameter?: Record<string, Record<string, number | null>> };
  parameters?: Record<string, { units?: string }>;
};

/** Converte a resposta da API no formato compacto do app. Lança erro se a resposta não tiver o esperado. */
export function compactarPower(json: unknown, loc: LocalPower, url: string, agora: Date = new Date()): DadosDiarios {
  const r = json as RespostaPower;
  const params = r?.properties?.parameter;
  if (!params || PARAMETROS_POWER.some((p) => !params[p])) throw new Error("Resposta inesperada da NASA POWER");
  const fill = r.header?.fill_value ?? -999;
  const limpo = (v: number | null | undefined) => (v === undefined || v === null || v === fill ? null : v);
  const datas = Object.keys(params[PARAMETROS_POWER[0]]).sort();
  let ultimo = datas.length - 1;
  while (ultimo >= 0 && PARAMETROS_POWER.every((p) => limpo(params[p][datas[ultimo]]) === null)) ultimo--;
  const mantidas = datas.slice(0, ultimo + 1);
  if (mantidas.length < MIN_DIAS) throw new Error("A NASA POWER devolveu poucos dados para este ponto");

  const data = Object.fromEntries(PARAMETROS_POWER.map((p) => [p, mantidas.map((d) => limpo(params[p][d]))]));
  const ausentes = Object.fromEntries(
    PARAMETROS_POWER.map((p) => [p, (data[p] as (number | null)[]).filter((v) => v === null).length]),
  );
  const fmt = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return {
    meta: {
      id: loc.id,
      name: loc.nome,
      lat: loc.lat,
      lon: loc.lon,
      source: "NASA POWER Daily API (community=AG)",
      sourceDocs: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
      url,
      downloadedAt: agora.toISOString(),
      apiVersion: r.header?.api?.version ?? null,
      dataSources: r.header?.sources ?? [],
      gridElevationM: r.geometry?.coordinates?.[2] ?? null,
      timeStandard: r.header?.time_standard ?? null,
      units: Object.fromEntries(PARAMETROS_POWER.map((p) => [p, r.parameters?.[p]?.units ?? null])),
      start: fmt(mantidas[0]),
      end: fmt(mantidas[mantidas.length - 1]),
      days: mantidas.length,
      missingValues: ausentes,
    },
    data: data as unknown as DadosDiarios["data"],
  };
}

export async function baixarPower(
  loc: LocalPower,
  opcoes: { signal?: AbortSignal; fetchFn?: typeof fetch; hoje?: Date } = {},
): Promise<DadosDiarios> {
  const url = urlPower(loc.lat, loc.lon, opcoes.hoje);
  const res = await (opcoes.fetchFn ?? fetch)(url, { signal: opcoes.signal });
  if (!res.ok) throw new Error(`NASA POWER respondeu ${res.status}`);
  return compactarPower(await res.json(), loc, url, opcoes.hoje);
}
