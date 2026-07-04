import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { factions, matches, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { MatchForm } from "@/components/match-form";

export const dynamic = "force-dynamic";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();

  const [session, match, userList, factionList] = await Promise.all([
    getSession(),
    db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: { players: true },
    }),
    db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .orderBy(asc(users.displayName)),
    db
      .select({
        id: factions.id,
        name: factions.name,
        code: factions.code,
        color: factions.color,
        allowsDuplicate: factions.allowsDuplicate,
      })
      .from(factions)
      .orderBy(asc(factions.id)),
  ]);
  if (!match) notFound();
  if (!session || (session.userId !== match.createdBy && !session.isAdmin)) {
    redirect(`/matches/${matchId}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Editar partida</h1>
      <MatchForm
        users={userList}
        factions={factionList}
        initial={{
          matchId: match.id,
          playedAt: match.playedAt,
          map: match.map,
          deck: match.deck,
          notes: match.notes,
          players: match.players.map((p) => ({
            userId: p.userId,
            factionId: p.factionId,
            score: p.score,
            isWinner: p.isWinner,
            winType: p.winType,
          })),
        }}
      />
    </div>
  );
}
