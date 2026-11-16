export function Fonte({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[13px] leading-relaxed text-ink-faint [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ink ${className}`}>
      {children}
    </p>
  );
}
