export function Switch({
  checked,
  onChange,
  label,
  hint,
  icone,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  icone?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-start gap-3 text-left"
    >
      <span
        className={`mt-0.5 flex h-[26px] w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-brand" : "bg-line-strong"
        }`}
        aria-hidden="true"
      >
        <span className={`size-[22px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold text-ink">
          {icone}
          {label}
        </span>
        {hint && <span className="block text-sm text-ink-muted">{hint}</span>}
      </span>
    </button>
  );
}
