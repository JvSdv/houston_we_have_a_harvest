"use client";

import { useRef, useState } from "react";
import type { EngineParams } from "@/lib/engine/index.ts";
import type { IndiceEnso } from "@/lib/engine/enso.ts";
import { buildLocalView, type LocalView } from "@/lib/local-view.ts";
import { baixarPower } from "@/lib/power.ts";
import { buscarLugares, dentroDoBrasil, idDoPonto, noSulDoBrasil, type Lugar } from "@/lib/lugares.ts";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Fonte } from "@/components/ui/Fonte";
import { useT } from "@/lib/i18n";
import { mensagemFalha, obterLocalizacao } from "@/lib/localizacao";

function Spinner() {
  return <span className="inline-block size-4 rounded-full border-2 border-brand border-t-transparent motion-safe:animate-spin" aria-hidden="true" />;
}

type Aviso = { tipo: "erro" | "info"; pt: string; en: string };

/** Escolha de qualquer município do Sul do Brasil: busca pelo nome ou localização do aparelho; os dados da NASA POWER são baixados na hora. */
export function EscolherLugar({
  params,
  indiceEnso,
  onLocal,
  gpsDestaque = false,
}: {
  params: EngineParams;
  indiceEnso: IndiceEnso;
  onLocal: (l: LocalView) => void;
  /** Mostra "Usar minha localização" como botão grande no topo (primeiro acesso). */
  gpsDestaque?: boolean;
}) {
  const t = useT();
  const [texto, setTexto] = useState("");
  const [achados, setAchados] = useState<Lugar[] | null>(null);
  const [ocupado, setOcupado] = useState<null | "buscando" | "baixando">(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [baixandoNome, setBaixandoNome] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  const comecar = () => {
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    // a NASA às vezes demora: depois de 45 s desistimos e mostramos o erro
    const sinal = ctrl.current.signal;
    setTimeout(() => ctrl.current?.signal === sinal && ctrl.current.abort(), 45_000);
    return sinal;
  };

  const calcular = async (nome: string, lat: number, lon: number) => {
    if (!dentroDoBrasil(lat, lon) || !noSulDoBrasil(lat)) {
      setAviso({
        tipo: "erro",
        pt: "Este app foi calibrado para o Sul do Brasil (ao sul de 22°S: PR, SC, RS e áreas próximas). Em outras regiões os ciclos e a regra de seca não valem, então não calculamos.",
        en: "This app was calibrated for southern Brazil (south of 22°S: PR, SC, RS and nearby areas). In other regions the crop cycles and the drought rule do not apply, so we do not compute.",
      });
      return;
    }
    const sinal = comecar();
    setOcupado("baixando");
    setBaixandoNome(nome);
    setAviso(null);
    try {
      onLocal(await carregarLocal({ nome, lat, lon }, params, indiceEnso, sinal));
      setAchados(null);
      setTexto("");
    } catch (e) {
      setAviso({
        tipo: "erro",
        pt: `Não foi possível baixar os dados da NASA agora${(e as Error).name === "AbortError" ? " (demorou demais)" : ""}. Tente de novo em instantes ou escolha um dos 3 municípios prontos.`,
        en: `We could not download the NASA data right now${(e as Error).name === "AbortError" ? " (it took too long)" : ""}. Try again in a moment or pick one of the 3 ready-made municipalities.`,
      });
    } finally {
      setOcupado(null);
    }
  };

  const buscar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (texto.trim().length < 2) return;
    const sinal = comecar();
    setOcupado("buscando");
    setAviso(null);
    setAchados(null);
    try {
      const r = await buscarLugares(texto, { signal: sinal });
      setAchados(r);
      if (r.length === 0)
        setAviso({
          tipo: "info",
          pt: "Nenhum município encontrado com esse nome. Confira a grafia.",
          en: "No municipality found with that name. Check the spelling.",
        });
    } catch {
      setAviso({
        tipo: "erro",
        pt: "A busca de município não respondeu. Tente de novo ou use sua localização.",
        en: "The municipality search did not respond. Try again or use your location.",
      });
    } finally {
      setOcupado(null);
    }
  };

  const usarGps = async () => {
    setOcupado("buscando");
    setAviso(null);
    setAchados(null);
    try {
      const c = await obterLocalizacao({ timeout: 15_000, maximumAge: 600_000 });
      setOcupado(null);
      await calcular(t("Minha localização", "My location"), Math.round(c.latitude * 10000) / 10000, Math.round(c.longitude * 10000) / 10000);
    } catch (e) {
      setOcupado(null);
      const m = mensagemFalha(e);
      setAviso({ tipo: "erro", pt: `${m.pt} Ou busque pelo nome do município.`, en: `${m.en} Or search by municipality name.` });
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      {gpsDestaque && (
        <button
          type="button"
          onClick={usarGps}
          disabled={ocupado !== null}
          className="mb-3 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-lavoura text-[17px] font-extrabold text-white disabled:opacity-60"
        >
          <LocateFixed className="size-6" aria-hidden="true" />
          {t("Usar minha localização", "Use my location")}
        </button>
      )}
      <p className="font-semibold">{gpsDestaque ? t("Ou busque pelo nome", "Or search by name") : t("Outro município do Sul do Brasil", "Another municipality in southern Brazil")}</p>
      <form onSubmit={buscar} className="mt-2 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="busca-municipio">
          {t("Nome do município", "Municipality name")}
        </label>
        <div className="relative min-w-0 flex-1 basis-48">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            id="busca-municipio"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t("Ex.: Guarapuava", "E.g. Guarapuava")}
            autoComplete="off"
            className="min-h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-base text-ink placeholder:text-ink-faint"
          />
        </div>
        <Button type="submit" disabled={ocupado !== null || texto.trim().length < 2}>
          {t("Buscar", "Search")}
        </Button>
        {!gpsDestaque && (
          <Button variant="secondary" onClick={usarGps} disabled={ocupado !== null}>
            <LocateFixed className="size-5" aria-hidden="true" />
            {t("Usar minha localização", "Use my location")}
          </Button>
        )}
      </form>

      <div role="status" aria-live="polite" className="mt-2 text-sm">
        {ocupado === "buscando" && (
          <p className="flex items-center gap-2 text-ink-muted">
            <Spinner />
            {t("Buscando…", "Searching…")}
          </p>
        )}
        {ocupado === "baixando" && (
          <p className="flex items-center gap-2 text-ink-muted">
            <Spinner />
            {t(
              `Baixando 45 anos de dados da NASA para ${baixandoNome}… (alguns segundos)`,
              `Downloading 45 years of NASA data for ${baixandoNome}… (a few seconds)`,
            )}
          </p>
        )}
        {aviso && (
          <Callout tom={aviso.tipo === "erro" ? "cautela" : "info"}>
            <p>{t(aviso.pt, aviso.en)}</p>
          </Callout>
        )}
      </div>

      {achados && achados.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {achados.map((l) => (
            <li key={`${l.nome}-${l.lat}-${l.lon}`}>
              <button
                onClick={() => calcular(l.estado ? `${l.nome} (${l.estado})` : l.nome, l.lat, l.lon)}
                disabled={ocupado !== null}
                className="min-h-11 w-full rounded-xl border border-line-strong bg-surface px-4 py-2 text-left hover:bg-surface-2 disabled:opacity-50"
              >
                <span className="block font-bold">{l.nome}</span>
                <span className="block text-[13px] text-ink-faint">
                  {l.estado ?? "—"} · {l.lat.toFixed(2)}, {l.lon.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="m-0 mt-2 text-[13px] text-ink-muted lg:hidden">
        {t("Dados da NASA. Sua cidade fica só neste aparelho.", "NASA data. Your town stays on this device.")}
      </p>
      <Fonte className="mt-2 hidden lg:block">
        {t(
          "A busca usa o Open-Meteo (CC BY 4.0) e os dados vêm direto da NASA POWER, no seu navegador. Só o nome digitado (ou as coordenadas, se usar a localização) é enviado a esses serviços. A cidade escolhida fica guardada só neste aparelho.",
          "The search uses Open-Meteo (CC BY 4.0) and the data come straight from NASA POWER, in your browser. Only the typed name (or the coordinates, if you use your location) is sent to those services. The chosen town is stored only on this device.",
        )}
      </Fonte>
    </div>
  );
}

/** Baixa os 45 anos da NASA POWER para um ponto e calcula a tela (usado na busca e ao reabrir o app com uma cidade guardada). */
export async function carregarLocal(
  lugar: { nome: string; lat: number; lon: number },
  params: EngineParams,
  indiceEnso: IndiceEnso,
  signal?: AbortSignal,
): Promise<LocalView> {
  const { nome, lat, lon } = lugar;
  const id = idDoPonto(lat, lon);
  const dados = await baixarPower({ id, nome, lat, lon }, { signal });
  return buildLocalView({ id, nome, lat, lon, dados, relevo: null, params, indiceEnso, personalizado: true });
}
