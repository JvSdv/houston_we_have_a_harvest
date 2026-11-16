// Busca de município (Open-Meteo Geocoding, CC BY 4.0) e localização do aparelho. Só o nome digitado
// (ou as coordenadas, no caso do GPS) sai do aparelho; nada é guardado.

export interface Lugar {
  nome: string;
  /** Estado (por extenso), quando o serviço informa. */
  estado: string | null;
  lat: number;
  lon: number;
  populacao: number | null;
}

/** Caixa que contém o Brasil; fora dela o app não calcula (os ciclos e limites são do Sul do Brasil). */
export function dentroDoBrasil(lat: number, lon: number): boolean {
  return lat >= -34 && lat <= 6 && lon >= -74 && lon <= -34;
}

/** Regiões onde os ciclos e limites do app foram pensados (Sul do Brasil: PR, SC, RS). Acima disso, só aviso. */
export function noSulDoBrasil(lat: number): boolean {
  return lat <= -22;
}

type Resposta = {
  results?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    country_code?: string;
    admin1?: string;
    population?: number;
  }[];
};

export function interpretarBusca(json: unknown): Lugar[] {
  const lista = (json as Resposta)?.results;
  if (!Array.isArray(lista)) return [];
  const vistos = new Set<string>();
  const out: Lugar[] = [];
  for (const r of lista) {
    if (r.country_code !== "BR" || !r.name || typeof r.latitude !== "number" || typeof r.longitude !== "number") continue;
    if (!dentroDoBrasil(r.latitude, r.longitude)) continue;
    const chave = `${r.name}|${r.admin1 ?? ""}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push({
      nome: r.name,
      estado: r.admin1 ?? null,
      lat: Math.round(r.latitude * 10000) / 10000,
      lon: Math.round(r.longitude * 10000) / 10000,
      populacao: typeof r.population === "number" ? r.population : null,
    });
  }
  return out;
}

export async function buscarLugares(
  texto: string,
  opcoes: { signal?: AbortSignal; fetchFn?: typeof fetch } = {},
): Promise<Lugar[]> {
  const q = texto.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({
    name: q,
    count: "10",
    language: "pt",
    format: "json",
    countryCode: "BR",
  })}`;
  const res = await (opcoes.fetchFn ?? fetch)(url, { signal: opcoes.signal });
  if (!res.ok) throw new Error(`Busca respondeu ${res.status}`);
  return interpretarBusca(await res.json());
}

/** Identificador estável de um ponto escolhido pelo usuário (arredondado para ~100 m). */
export function idDoPonto(lat: number, lon: number): string {
  return `ponto-${lat.toFixed(3)}_${lon.toFixed(3)}`;
}
