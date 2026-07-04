import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { factions, matchPlayers, ratings } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui";
import { FactionChip } from "@/components/faction-chip";
import { AccountForm } from "@/components/account-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [stats, factionStats, rating] = await Promise.all([
    db
      .select({
        played: sql<number>`count(*)::int`,
        wins: sql<number>`coalesce(sum(case when ${matchPlayers.isWinner} then 1 else 0 end), 0)::int`,
        avgScore: sql<number | null>`avg(${matchPlayers.score})::float`,
      })
      .from(matchPlayers)
      .where(eq(matchPlayers.userId, session.userId)),
    db
      .select({
        name: factions.name,
        code: factions.code,
        color: factions.color,
        picks: sql<number>`count(*)::int`,
        wins: sql<number>`coalesce(sum(case when ${matchPlayers.isWinner} then 1 else 0 end), 0)::int`,
      })
      .from(matchPlayers)
      .innerJoin(factions, eq(factions.id, matchPlayers.factionId))
      .where(eq(matchPlayers.userId, session.userId))
      .groupBy(factions.id, factions.name, factions.code, factions.color)
      .orderBy(sql`count(*) DESC`)
      .limit(5),
    db.query.ratings.findFirst({ where: eq(ratings.userId, session.userId) }),
  ]);

  const { played, wins, avgScore } = stats[0];

  const tiles = [
    { label: "Elo", value: rating ? String(Math.round(rating.elo)) : "—" },
    { label: "Partidas", value: String(played) },
    { label: "Vitórias", value: String(wins) },
    {
      label: "Taxa de vitória",
      value: played > 0 ? `${Math.round((wins / played) * 100)}%` : "—",
    },
    {
      label: "Pontuação média",
      value: avgScore != null ? avgScore.toFixed(1) : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {session.displayName}{" "}
        <span className="text-xl font-normal text-ink-faint">@{session.username}</span>
      </h1>

      {/* "clareiras": círculos de borda grossa, como no tabuleiro */}
      <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex aspect-square w-full max-w-36 flex-col items-center justify-center rounded-full border-4 border-ink/60 bg-parchment-light p-2 text-center shadow-card"
          >
            <div className="font-display text-3xl font-bold text-ember-dark">
              {tile.value}
            </div>
            <div className="text-xs text-ink-soft">{tile.label}</div>
          </div>
        ))}
      </div>

      {factionStats.length > 0 && (
        <Card>
          <CardTitle>Suas facções</CardTitle>
          <ul className="divide-y divide-ink/10 p-2">
            {factionStats.map((f) => (
              <li key={f.name} className="flex items-center justify-between px-2 py-2">
                <FactionChip name={f.name} color={f.color} code={f.code} />
                <span className="text-sm text-ink-soft">
                  {f.picks} {f.picks === 1 ? "partida" : "partidas"} · {f.wins}{" "}
                  {f.wins === 1 ? "vitória" : "vitórias"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Conta</CardTitle>
        <div className="p-4">
          <AccountForm userId={session.userId} displayName={session.displayName} />
        </div>
      </Card>
    </div>
  );
}
