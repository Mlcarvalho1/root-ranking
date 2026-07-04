import Link from "next/link";

export function RankingsTabs({ active }: { active: "players" | "factions" }) {
  const base = "rounded-t-lg border-2 border-b-0 px-4 py-2 font-display font-bold";
  return (
    <div className="flex gap-1 border-b-2 border-dashed border-ink/50">
      <Link
        href="/rankings"
        className={`${base} ${
          active === "players"
            ? "border-ink bg-ink text-parchment-light"
            : "border-transparent text-ink-soft hover:text-root-red"
        }`}
      >
        Jogadores
      </Link>
      <Link
        href="/rankings/factions"
        className={`${base} ${
          active === "factions"
            ? "border-ink bg-ink text-parchment-light"
            : "border-transparent text-ink-soft hover:text-root-red"
        }`}
      >
        Facções
      </Link>
    </div>
  );
}
