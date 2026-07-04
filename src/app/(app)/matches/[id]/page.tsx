import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { matches } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui";
import { FactionChip } from "@/components/faction-chip";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { Crown } from "@/components/decor";
import { DECK_LABELS, MAP_LABELS, WIN_TYPE_LABELS } from "@/lib/match-schema";
import { formatDate, sortByStanding } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();

  const [session, match] = await Promise.all([
    getSession(),
    db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        players: { with: { user: true, faction: true } },
        creator: true,
      },
    }),
  ]);
  if (!match) notFound();

  const canEdit = session && (session.userId === match.createdBy || session.isAdmin);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Partida de {formatDate(match.playedAt)}</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              href={`/matches/${match.id}/edit`}
              className="rounded-full border-2 border-ink/50 px-5 py-2 font-display font-bold hover:bg-parchment-dark"
            >
              Editar
            </Link>
            <DeleteMatchButton matchId={match.id} />
          </div>
        )}
      </div>

      <Card>
        <CardTitle>Súmula</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-ink/20 text-sm text-ink-soft">
                <th className="px-4 py-2">Jogador</th>
                <th className="px-4 py-2">Facção</th>
                <th className="px-4 py-2 text-right">Pontos</th>
                <th className="px-4 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {sortByStanding(match.players).map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-dashed border-ink/25 ${p.isWinner ? "bg-ember/15 font-semibold" : ""}`}
                >
                  <td className="px-4 py-2.5">{p.user.displayName}</td>
                  <td className="px-4 py-2.5">
                    <FactionChip
                      name={p.faction.name}
                      color={p.faction.color}
                      code={p.faction.code}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.score}</td>
                  <td className="px-4 py-2.5">
                    {p.isWinner ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Crown className="size-4 text-ember-dark" />
                        Vitória ({WIN_TYPE_LABELS[p.winType ?? "points"]})
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4 text-sm text-ink-soft">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>Mapa: {match.map ? (MAP_LABELS[match.map] ?? match.map) : "—"}</span>
          <span>Baralho: {match.deck ? (DECK_LABELS[match.deck] ?? match.deck) : "—"}</span>
          <span>Registrada por: {match.creator.displayName}</span>
        </div>
        {match.notes && <p className="mt-2 whitespace-pre-wrap text-ink">{match.notes}</p>}
        <div
          aria-hidden
          className="mt-3 flex justify-center gap-3 border-t border-dashed border-ink/25 pt-3 opacity-80"
        >
          {["boot", "sack", "coin", "sword", "tea", "crossbow", "hammer", "torch"].map(
            (item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item}
                src={`/art/item-${item}.webp`}
                alt=""
                className="size-5"
              />
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
