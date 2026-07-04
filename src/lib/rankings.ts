import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { factions, matches, matchPlayers, ratings, users } from "@/db/schema";

export type PlayerRankingRow = {
  userId: number;
  displayName: string;
  elo: number | null;
  played: number;
  wins: number;
  avgScore: number | null;
};

export async function getPlayerRankings(): Promise<PlayerRankingRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      elo: ratings.elo,
      played: sql<number>`count(${matchPlayers.id})::int`,
      wins: sql<number>`coalesce(sum(case when ${matchPlayers.isWinner} then 1 else 0 end), 0)::int`,
      avgScore: sql<number | null>`avg(${matchPlayers.score})::float`,
    })
    .from(users)
    .leftJoin(matchPlayers, sql`${matchPlayers.userId} = ${users.id}`)
    .leftJoin(ratings, sql`${ratings.userId} = ${users.id}`)
    .groupBy(users.id, users.displayName, ratings.elo)
    .orderBy(sql`${ratings.elo} DESC NULLS LAST, count(${matchPlayers.id}) DESC`);
  return rows;
}

export type FactionRankingRow = {
  factionId: number;
  name: string;
  code: string;
  color: string;
  picks: number;
  presence: number;
  wins: number;
  avgScore: number | null;
};

export async function getFactionRankings(): Promise<{
  rows: FactionRankingRow[];
  totalMatches: number;
}> {
  const [rows, [{ totalMatches }]] = await Promise.all([
    db
      .select({
        factionId: factions.id,
        name: factions.name,
        code: factions.code,
        color: factions.color,
        picks: sql<number>`count(${matchPlayers.id})::int`,
        // partidas distintas em que a facção apareceu (dois Vagabundos = 1 partida)
        presence: sql<number>`count(distinct ${matchPlayers.matchId})::int`,
        wins: sql<number>`coalesce(sum(case when ${matchPlayers.isWinner} then 1 else 0 end), 0)::int`,
        avgScore: sql<number | null>`avg(${matchPlayers.score})::float`,
      })
      .from(factions)
      .leftJoin(matchPlayers, sql`${matchPlayers.factionId} = ${factions.id}`)
      .groupBy(factions.id, factions.name, factions.code, factions.color)
      .orderBy(
        sql`(coalesce(sum(case when ${matchPlayers.isWinner} then 1 else 0 end), 0)::float / nullif(count(${matchPlayers.id}), 0)) DESC NULLS LAST, count(${matchPlayers.id}) DESC`,
      ),
    db.select({ totalMatches: sql<number>`count(*)::int` }).from(matches),
  ]);
  return { rows, totalMatches };
}
