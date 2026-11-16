"use client";

import { useRef } from "react";

const COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

/** Controle segmentado (2–4 opções). `cols` fixa as colunas (padrão: uma por opção). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className = "",
  cols,
  redondo = true,
}: {
  label: string;
  options: { id: T; label: string; sub?: string; lang?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  cols?: 2 | 3 | 4;
  redondo?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(k)) return;
    const itens = [...(ref.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])];
    const i = itens.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    const prox = itens[(i + (k === "ArrowRight" || k === "ArrowDown" ? 1 : -1) + itens.length) % itens.length];
    prox.focus();
    prox.click();
  };
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`grid gap-1 bg-surface-2 p-1 ${COLS[cols ?? options.length]} ${redondo ? "rounded-3xl" : "rounded-2xl"} ${className}`}
    >
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={sel}
            tabIndex={sel ? 0 : -1}
            lang={o.lang}
            onClick={() => onChange(o.id)}
            className={`flex min-h-11 flex-col items-center justify-center rounded-full px-3 text-[15px] leading-tight ${
              sel ? "bg-surface font-bold text-ink shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <span>{o.label}</span>
            {o.sub && <span className="text-[13px] font-normal">{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}
