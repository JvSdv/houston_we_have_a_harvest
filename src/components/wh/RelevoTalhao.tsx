"use client";

import { useState } from "react";
import { IcBaixada } from "@/components/wh/Arte";
import { fmtNum, useLang, useT } from "@/lib/i18n";
import { mensagemFalha, obterLocalizacao } from "@/lib/localizacao";

type Estado =
  | { tipo: "parado" }
  | { tipo: "medindo" }
  | { tipo: "erro"; pt: string; en: string }
  | { tipo: "ok"; tpi: number; ponto: number; min: number; max: number };

/** Grade 7×7 a cada 500 m em volta do ponto (mesmo desenho usado no teste com as estações). */
function grade(lat: number, lon: number) {
  const lats: string[] = [];
  const lons: string[] = [];
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++) {
      lats.push((lat + (i * 500) / 111_320).toFixed(5));
      lons.push((lon + (j * 500) / (111_320 * Math.cos((lat * Math.PI) / 180))).toFixed(5));
    }
  return { lats, lons };
}

/**
 * Mede o relevo do talhão a partir do GPS do celular: quantos metros o ponto fica abaixo (ou acima) da média do entorno
 * de 1,5 km (Copernicus DEM 90 m, via API de elevação do Open-Meteo). Abaixo de `limiteM`, sugere "baixada".
 */
export function RelevoTalhao({
  limiteM,
  baixada,
  onBaixada,
  evidencia,
}: {
  /** TPI (m) a partir do qual o teste com estações indicou ar mais frio. */
  limiteM: number;
  baixada: boolean;
  onBaixada: (b: boolean) => void;
  /** Frase curta com o resultado do teste das estações. */
  evidencia: string;
}) {
  const t = useT();
  const lang = useLang();
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });

  const medir = async () => {
    setEstado({ tipo: "medindo" });
    let c: GeolocationCoordinates;
    try {
      c = await obterLocalizacao({ enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 });
    } catch (e) {
      setEstado({ tipo: "erro", ...mensagemFalha(e) });
      return;
    }
    try {
      const { lats, lons } = grade(c.latitude, c.longitude);
      const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lons.join(",")}`);
      if (!r.ok) throw new Error(String(r.status));
      const alt = (await r.json()).elevation as number[];
      if (!Array.isArray(alt) || alt.length !== 49) throw new Error("resposta inesperada");
      const media = alt.reduce((x, y) => x + y, 0) / alt.length;
      const ponto = alt[24];
      const tpi = Math.round((ponto - media) * 10) / 10;
      setEstado({ tipo: "ok", tpi, ponto, min: Math.min(...alt), max: Math.max(...alt) });
      if (tpi <= limiteM && !baixada) onBaixada(true);
    } catch {
      setEstado({ tipo: "erro", pt: "Não foi possível medir o relevo agora. Tente de novo com internet.", en: "Could not measure the terrain right now. Try again online." });
    }
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-[#EAF2FB] p-3.5">
      <div className="flex items-center gap-3">
        <IcBaixada />
        <div className="flex flex-1 flex-col">
          <span className="text-[15px] font-extrabold">{t("Sua lavoura é baixada?", "Is your field a lowland?")}</span>
          <span className="text-[13px] text-[#33507A]">{t("Meça pelo GPS, de dentro da lavoura", "Measure by GPS, from inside the field")}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={medir}
        disabled={estado.tipo === "medindo"}
        className="min-h-12 cursor-pointer rounded-full border-none bg-geada text-[15px] font-extrabold text-white disabled:opacity-60"
      >
        {estado.tipo === "medindo" ? t("Medindo…", "Measuring…") : t("Medir o relevo da minha lavoura", "Measure my field’s terrain")}
      </button>
      <div role="status" aria-live="polite" className="text-[15px] leading-[1.4] text-[#1D3B63]">
        {estado.tipo === "erro" && <p className="m-0">{t(estado.pt, estado.en)}</p>}
        {estado.tipo === "ok" && (
          <p className="m-0">
            {estado.tpi < 0
              ? t(
                  `Seu ponto fica ${fmtNum(-estado.tpi, 0, lang)} m abaixo da média do terreno em volta (1,5 km). `,
                  `Your point is ${fmtNum(-estado.tpi, 0, lang)} m below the average of the surrounding land (1.5 km). `,
                )
              : t(
                  `Seu ponto fica ${fmtNum(estado.tpi, 0, lang)} m acima da média do terreno em volta (1,5 km). `,
                  `Your point is ${fmtNum(estado.tpi, 0, lang)} m above the average of the surrounding land (1.5 km). `,
                )}
            <strong>
              {estado.tpi <= limiteM
                ? t("Parece baixada: ligamos a opção “baixada”.", "Looks like a lowland: we turned “lowland” on.")
                : t("Não parece baixada.", "Does not look like a lowland.")}
            </strong>
          </p>
        )}
      </div>
      <p className="m-0 text-xs leading-[1.45] text-[#33507A]">
        {evidencia}{" "}
        {t(
          "Relevo: Copernicus DEM 90 m (Open-Meteo). Só as coordenadas são enviadas; nada é guardado fora do aparelho.",
          "Terrain: Copernicus DEM 90 m (Open-Meteo). Only the coordinates are sent; nothing is stored off the device.",
        )}
      </p>
    </div>
  );
}
