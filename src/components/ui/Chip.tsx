"use client";

import { Check } from "lucide-react";
import { useRef } from "react";

export function ChipGroup({
  label,
  type,
  children,
  className = "",
}: {
  label: string;
  type: "radio" | "toggle";
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (type !== "radio") return;
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
      role={type === "radio" ? "radiogroup" : "group"}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

/** Chip de seleção. Em grupo radio, só o selecionado entra na ordem do Tab (roving tabindex). */
export function Chip({
  selected,
  onClick,
  icon,
  children,
  role = "radio",
  tracejado = false,
  expanded,
  anySelected = true,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  role?: "radio" | "button";
  tracejado?: boolean;
  expanded?: boolean;
  /** Se nenhum chip do grupo está selecionado, todos ficam focáveis. */
  anySelected?: boolean;
}) {
  const base = "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[15px] font-semibold sm:px-4";
  const cls = tracejado
    ? `${base} border-dashed border-line-strong bg-surface text-brand hover:bg-surface-2`
    : selected
      ? `${base} border-brand bg-brand text-white`
      : `${base} border-line-strong bg-surface text-ink hover:bg-surface-2`;
  const aria =
    role === "radio"
      ? { role: "radio" as const, "aria-checked": selected, tabIndex: selected || !anySelected ? 0 : -1 }
      : { "aria-expanded": expanded };
  return (
    <button type="button" onClick={onClick} className={cls} {...aria}>
      {selected && !tracejado ? <Check className="size-4" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
