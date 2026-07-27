import { Card } from "@/components/ui";
import { RankingsTabs } from "@/components/rankings-tabs";
import { SuitRow } from "@/components/suit-row";
import { Crown } from "@/components/decor";
import { TipOfTheDay } from "@/components/tip-of-the-day";
import { getPlayerRankings } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export default async function PlayerRankingsPage() {
  const rows = await getPlayerRankings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rankings</h1>
        <SuitRow />
      </div>
      <RankingsTabs active="players" />
      <TipOfTheDay />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-ink/20 text-sm text-ink-soft">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Jogador</th>
                <th className="px-4 py-2 text-right">Elo</th>
                <th className="px-4 py-2 text-right">Vitórias</th>
                <th className="px-4 py-2 text-right">Partidas</th>
                <th className="px-4 py-2 text-right">Taxa de vitória</th>
                <th className="px-4 py-2 text-right">Pontuação média</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.userId}
                  className={`border-b border-dashed border-ink/25 ${index === 0 && row.played > 0 ? "bg-ember/15" : ""}`}
                >
                  <td className="px-4 py-2.5 font-display font-semibold">
                    {row.played === 0 ? (
                      "—"
                    ) : index === 0 ? (
                      <Crown className="size-5 text-ember-dark" />
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{row.displayName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.elo != null ? Math.round(row.elo) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.wins}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.played}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.played > 0
                      ? `${Math.round((row.wins / row.played) * 100)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.avgScore != null ? row.avgScore.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="p-8 text-center text-ink-soft">Nenhum jogador ainda.</p>
        )}
      </Card>
      <p className="text-sm text-ink-faint">
        Elo começa em 1000 e é recalculado a cada partida registrada, comparando
        cada dupla de jogadores pela colocação final.
      </p>
    </div>
  );
}
