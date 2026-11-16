"use client";

// Caderno de campo do produtor: o que ele marcou como feito (com a data real) e as anotações de cada dia.
// Fica só no aparelho (localStorage), separado por município e safra. Sem armazenamento, vale só nesta visita.
import { useCallback, useMemo, useSyncExternalStore } from "react";

export type LembreteId = "soja" | "colheita" | "milho" | "flor";

export interface Caderno {
  /** Data real (AAAA-MM-DD) em que cada etapa foi feita. */
  feitos: Partial<Record<LembreteId, string>>;
  /** Anotações por dia (AAAA-MM-DD). */
  notas: Record<string, string[]>;
}

const EVENTO = "weharvest-caderno";
const memoria = new Map<string, string>();

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return memoria.get(chave) ?? null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    memoria.set(chave, valor);
  }
  window.dispatchEvent(new Event(EVENTO));
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function interpretarCaderno(s: string | null): Caderno {
  try {
    const x = s ? (JSON.parse(s) as Partial<Caderno>) : null;
    const feitos: Caderno["feitos"] = {};
    for (const [k, v] of Object.entries(x?.feitos ?? {})) if (typeof v === "string" && ISO.test(v)) feitos[k as LembreteId] = v;
    const notas: Caderno["notas"] = {};
    for (const [k, v] of Object.entries(x?.notas ?? {}))
      if (ISO.test(k) && Array.isArray(v)) {
        const lista = v.filter((n): n is string => typeof n === "string" && n.trim() !== "");
        if (lista.length) notas[k] = lista;
      }
    return { feitos, notas };
  } catch {
    return { feitos: {}, notas: {} };
  }
}

export const isoDe = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
export const dataDeIso = (s: string) => new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));

export interface AcoesCaderno {
  marcarFeito: (id: LembreteId, iso: string | null) => void;
  anotar: (iso: string, texto: string) => void;
  apagarNota: (iso: string, i: number) => void;
}

/** `chave` nula (antes de saber a data de hoje) devolve um caderno vazio e ações que não fazem nada. */
export function useCaderno(chave: string | null): { caderno: Caderno } & AcoesCaderno {
  const inscrever = useCallback((avisar: () => void) => {
    window.addEventListener(EVENTO, avisar);
    window.addEventListener("storage", avisar);
    return () => {
      window.removeEventListener(EVENTO, avisar);
      window.removeEventListener("storage", avisar);
    };
  }, []);
  const bruto = useSyncExternalStore(
    inscrever,
    () => (chave ? ler(chave) : null),
    () => null,
  );
  const caderno = useMemo(() => interpretarCaderno(bruto), [bruto]);

  const mudar = useCallback(
    (f: (c: Caderno) => Caderno) => {
      if (!chave) return;
      gravar(chave, JSON.stringify(f(interpretarCaderno(ler(chave)))));
    },
    [chave],
  );

  return {
    caderno,
    marcarFeito: (id, iso) =>
      mudar((c) => {
        const feitos = { ...c.feitos };
        if (iso) feitos[id] = iso;
        else delete feitos[id];
        return { ...c, feitos };
      }),
    anotar: (iso, texto) =>
      mudar((c) => {
        const limpo = texto.trim().slice(0, 280);
        if (!limpo) return c;
        return { ...c, notas: { ...c.notas, [iso]: [...(c.notas[iso] ?? []), limpo] } };
      }),
    apagarNota: (iso, i) =>
      mudar((c) => {
        const lista = (c.notas[iso] ?? []).filter((_, k) => k !== i);
        const notas = { ...c.notas };
        if (lista.length) notas[iso] = lista;
        else delete notas[iso];
        return { ...c, notas };
      }),
  };
}
