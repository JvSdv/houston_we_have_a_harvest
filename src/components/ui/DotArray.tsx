export function DotArray({
  preenchidos,
  cor,
  rotulo,
}: {
  preenchidos: number;
  cor: "frost" | "drought";
  rotulo: string;
}) {
  const on = cor === "frost" ? "bg-frost" : "bg-drought";
  return (
    <div className="flex gap-1.5" role="img" aria-label={rotulo}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`size-3.5 rounded-full sm:size-4 ${i < preenchidos ? on : "border border-line bg-surface-2"}`}
        />
      ))}
    </div>
  );
}
