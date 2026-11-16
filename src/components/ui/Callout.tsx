import type { LucideIcon } from "lucide-react";

export type TomCallout = "info" | "positivo" | "cautela" | "frost" | "drought" | "alto";

const TONS: Record<TomCallout, string> = {
  info: "bg-surface-2 text-ink border-line",
  positivo: "bg-brand-soft text-ink border-brand/40",
  cautela: "bg-mid-soft text-ink border-mid-line",
  frost: "bg-frost-soft text-frost-ink border-frost/40",
  drought: "bg-drought-soft text-drought-ink border-drought/40",
  alto: "bg-high-soft text-ink border-high/40",
};

export function Callout({
  tom,
  icone: Icone,
  className = "",
  children,
}: {
  tom: TomCallout;
  icone?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${TONS[tom]} ${className}`}>
      {Icone && <Icone className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
