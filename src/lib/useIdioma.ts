"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";

/** Lê a escolha de idioma (só no cliente): ?lang=pt|en, depois a escolha guardada, depois o idioma do celular. */
function lerPreferenciaDeIdioma(): Lang | "nenhuma" {
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "pt" || q === "en") return q;
    const guardado = localStorage.getItem("weharvest-lang");
    if (guardado === "pt" || guardado === "en") return guardado;
  } catch {
    /* ignora: sem acesso ao armazenamento */
  }
  return navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "nenhuma";
}

/** Idioma: escolha no app > ?lang=pt|en > escolha anterior > celular em português > inglês (padrão do NASA Space Apps). */
export function useIdioma(): { lang: Lang; setLang: (l: Lang) => void } {
  const preferencia = useSyncExternalStore(() => () => {}, lerPreferenciaDeIdioma, () => "nenhuma" as const);
  const [escolhido, setEscolhido] = useState<Lang | null>(null);
  const lang: Lang = escolhido ?? (preferencia === "pt" ? "pt" : "en");
  const setLang = (l: Lang) => {
    setEscolhido(l);
    try {
      localStorage.setItem("weharvest-lang", l);
    } catch {
      /* sem armazenamento: a escolha vale só nesta visita */
    }
  };
  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  }, [lang]);
  return { lang, setLang };
}
