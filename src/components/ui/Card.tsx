export function Card({
  as = "section",
  className = "",
  children,
  ...rest
}: { as?: "section" | "div" | "article"; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(28,33,23,0.06)] sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  eyebrow,
  title,
  titleId,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  titleId?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">{eyebrow}</p>
        )}
        <h2 id={titleId} className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
