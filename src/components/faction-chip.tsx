/* eslint-disable @next/next/no-img-element */
export function FactionIcon({
  code,
  name,
  color,
  size = "md",
}: {
  code: string;
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const outer = { sm: "size-6", md: "size-8", lg: "size-12" }[size];
  const inner = { sm: "size-4", md: "size-6", lg: "size-9" }[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 bg-parchment-light ${outer}`}
      style={{ borderColor: color }}
    >
      <img src={`/factions/${code}.webp`} alt={name} className={inner} />
    </span>
  );
}

export function FactionChip({
  name,
  color,
  code,
  size = "md",
}: {
  name: string;
  color: string;
  code: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        size === "sm"
          ? "inline-flex items-center gap-1.5 text-sm"
          : "inline-flex items-center gap-2"
      }
    >
      <FactionIcon code={code} name={name} color={color} size={size} />
      {name}
    </span>
  );
}
