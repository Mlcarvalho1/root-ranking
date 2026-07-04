import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { factions, users } from "@/db/schema";
import type { MatchInput } from "@/lib/match-schema";

/**
 * Validações que dependem do banco: jogadores existem, facções existem e
 * facção só se repete se for o Vagabundo (allows_duplicate).
 * Retorna mensagem de erro ou null se tudo ok.
 */
export async function validateMatchAgainstDb(
  input: MatchInput,
): Promise<string | null> {
  const userIds = input.players.map((p) => p.userId);
  const factionIds = input.players.map((p) => p.factionId);

  const [foundUsers, foundFactions] = await Promise.all([
    db.select({ id: users.id }).from(users).where(inArray(users.id, userIds)),
    db.select().from(factions).where(inArray(factions.id, factionIds)),
  ]);

  if (foundUsers.length !== new Set(userIds).size) {
    return "Jogador inexistente na partida";
  }

  const byId = new Map(foundFactions.map((f) => [f.id, f]));
  const counts = new Map<number, number>();
  for (const id of factionIds) {
    if (!byId.has(id)) return "Facção inexistente";
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    const faction = byId.get(id)!;
    if (count > 1 && !faction.allowsDuplicate) {
      return `A facção ${faction.name} não pode se repetir na partida`;
    }
  }

  return null;
}
