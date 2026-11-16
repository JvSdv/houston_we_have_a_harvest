import type { MetadataRoute } from "next";

/** Manifesto do app: permite "Adicionar à tela inicial" e abrir sem a barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "weharvest · Houston, We Have a Harvest",
    short_name: "weharvest",
    description:
      "When to plant soybeans to protect second-crop corn from frost and drought. NASA daily data since 1981. / Quando plantar a soja para proteger o milho safrinha.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1424",
    theme_color: "#0A1424",
    lang: "pt-BR",
    categories: ["agriculture", "weather", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
