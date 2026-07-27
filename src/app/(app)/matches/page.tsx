import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { matches } from "@/db/schema";
import { Card } from "@/components/ui";
import { FactionChip } from "@/components/faction-chip";
import { Crown } from "@/components/decor";
import { MatchSearch } from "@/components/match-search";
import { MAP_LABELS } from "@/lib/match-schema";
import { formatDate, sortByStanding } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const list = await db.query.matches.findMany({
    with: { players: { with: { user: true, faction: true } } },
    orderBy: [desc(matches.playedAt), desc(matches.id)],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Partidas</h1>
        <Link
          href="/matches/new"
          className="rounded-full border-2 border-ember-dark bg-ember px-5 py-2 font-display font-bold text-parchment-light hover:bg-ember-dark"
        >
          + Nova partida
        </Link>
      </div>

      <MatchSearch />

      {list.length === 0 && (
        <Card className="p-8 text-center text-ink-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/art/vagabond.webp"
            alt=""
            className="mx-auto mb-3 w-24 opacity-90"
          />
          Nenhuma partida registrada ainda. A floresta está em paz... por enquanto.
        </Card>
      )}

      {list.map((match, index) => (
        <Link key={match.id} href={`/matches/${match.id}`} className="block">
          <Card
            className="p-4 transition-all hover:-translate-y-0.5 hover:bg-parchment-dark/40"
            style={{ animationDelay: `${Math.min(index * 70, 400)}ms` }}
          >
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 text-sm text-ink-soft">
              <span className="font-display text-lg font-semibold text-ink">
                {formatDate(match.playedAt)}
              </span>
              {match.map && <span>Mapa: {MAP_LABELS[match.map] ?? match.map}</span>}
              <span>{match.players.length} jogadores</span>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
              {sortByStanding(match.players).map((p) => (
                <li key={p.id} className={p.isWinner ? "font-bold" : ""}>
                  <FactionChip
                    name={p.user.displayName}
                    color={p.faction.color}
                    code={p.faction.code}
                    size="sm"
                  />
                  <span className="ml-1 text-sm text-ink-soft">
                    {p.score} pts
                  </span>
                  {p.isWinner && (
                    <Crown className="mb-1 ml-1 inline size-4 text-ember-dark" />
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </Link>
      ))}
    </div>
  );
}
