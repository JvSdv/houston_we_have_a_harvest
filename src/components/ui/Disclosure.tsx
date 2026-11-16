import { ChevronDown } from "lucide-react";

/** Acordeão nativo. Regra: nunca colocar um Disclosure dentro de outro. */
export function Disclosure({
  titulo,
  subtitulo,
  defaultOpen,
  open,
  children,
  onToggle,
  className = "",
}: {
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  children: React.ReactNode;
  onToggle?: (aberto: boolean) => void;
  className?: string;
}) {
  return (
    <details
      className={`group rounded-xl border border-line bg-surface ${className}`}
      open={open ?? defaultOpen}
      onToggle={onToggle ? (e) => onToggle(e.currentTarget.open) : undefined}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          {titulo}
          {subtitulo && <span className="block text-sm font-normal text-ink-muted">{subtitulo}</span>}
        </span>
        <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
