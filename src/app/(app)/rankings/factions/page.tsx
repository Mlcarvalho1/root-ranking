import { Card } from "@/components/ui";
import { RankingsTabs } from "@/components/rankings-tabs";
import { SuitRow } from "@/components/suit-row";
import { FactionChip } from "@/components/faction-chip";
import { getFactionRankings } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export default async function FactionRankingsPage() {
  const { rows, totalMatches } = await getFactionRankings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rankings</h1>
        <SuitRow />
      </div>
      <RankingsTabs active="factions" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-ink/20 text-sm text-ink-soft">
                <th className="px-4 py-2">Facção</th>
                <th className="px-4 py-2">Taxa de vitória</th>
                <th className="px-4 py-2 text-right">Vitórias</th>
                <th className="px-4 py-2 text-right">Vezes jogada</th>
                <th className="px-4 py-2 text-right">Presença</th>
                <th className="px-4 py-2 text-right">Pontuação média</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const winRate = row.picks > 0 ? row.wins / row.picks : null;
                return (
                  <tr key={row.factionId} className="border-b border-dashed border-ink/25">
                    <td className="px-4 py-2.5 font-semibold">
                      <FactionChip name={row.name} color={row.color} code={row.code} />
                    </td>
                    <td className="px-4 py-2.5">
                      {winRate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-24 overflow-hidden rounded-full border border-ink/30 bg-parchment-dark">
                            <div
                              className="animate-grow-bar h-full"
                              style={{
                                width: `${Math.round(winRate * 100)}%`,
                                backgroundColor: row.color,
                              }}
                            />
                          </div>
                          <span className="tabular-nums">{Math.round(winRate * 100)}%</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.wins}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.picks}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {totalMatches > 0
                        ? `${Math.round((row.presence / totalMatches) * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {row.avgScore != null ? row.avgScore.toFixed(1) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-sm text-ink-faint">
        Presença = em quantas partidas registradas a facção apareceu.
      </p>
    </div>
  );
}
