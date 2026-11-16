import type { ComponentProps } from "react";

type Variante = "primary" | "secondary" | "ghost";

const BASE = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold disabled:opacity-50";
const VARIANTES: Record<Variante, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-brand underline-offset-2 hover:underline",
};

type Props = { variant?: Variante; className?: string } & (
  | ({ href: string } & Omit<ComponentProps<"a">, "className">)
  | ({ href?: undefined } & Omit<ComponentProps<"button">, "className">)
);

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  const cls = `${BASE} ${VARIANTES[variant]} ${className}`;
  if ("href" in rest && rest.href !== undefined) {
    return <a className={cls} {...(rest as ComponentProps<"a">)} />;
  }
  const b = rest as ComponentProps<"button">;
  return <button type={b.type ?? "button"} className={cls} {...b} />;
}
