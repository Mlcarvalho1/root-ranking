import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { matches, ratings } from "@/db/schema";

export const ELO_BASE = 1000;
const K_TOTAL = 32;

type PlayerResult = { userId: number; score: number; isWinner: boolean };

// 1 se `a` terminou na frente de `b`, 0.5 empate, 0 se atrás.
// Vencedor fica na frente de qualquer não-vencedor (cobre dominância e
// coalizão, onde a pontuação não decide); entre não-vencedores decide a
// pontuação.
function headToHead(a: PlayerResult, b: PlayerResult): number {
  if (a.isWinner !== b.isWinner) return a.isWinner ? 1 : 0;
  if (a.isWinner) return 0.5; // coalizão: dois vencedores empatam entre si
  if (a.score === b.score) return 0.5;
  return a.score > b.score ? 1 : 0;
}

/**
 * Recalcula o Elo de todos os jogadores a partir do histórico completo e
 * regrava a tabela `ratings`. Chamado após criar/editar/apagar partida —
 * com volume de grupo de amigos isso é barato e elimina qualquer estado
 * inconsistente.
 *
 * Cada partida vira comparações par-a-par por colocação, com K dividido
 * pelo número de oponentes e ratings pré-partida para todos os pares.
 */
export async function recomputeRatings() {
  const history = await db.query.matches.findMany({
    with: { players: true },
    orderBy: [asc(matches.playedAt), asc(matches.id)],
  });

  const elo = new Map<number, number>();
  const played = new Map<number, number>();
  const ratingOf = (userId: number) => elo.get(userId) ?? ELO_BASE;

  for (const match of history) {
    const players = match.players;
    const n = players.length;
    if (n < 2) continue;

    const k = K_TOTAL / (n - 1);
    const delta = new Map<number, number>();

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = players[i];
        const b = players[j];
        const sA = headToHead(a, b);
        const eA =
          1 / (1 + 10 ** ((ratingOf(b.userId) - ratingOf(a.userId)) / 400));
        const change = k * (sA - eA);
        delta.set(a.userId, (delta.get(a.userId) ?? 0) + change);
        delta.set(b.userId, (delta.get(b.userId) ?? 0) - change);
      }
    }

    for (const [userId, change] of delta) {
      elo.set(userId, ratingOf(userId) + change);
      played.set(userId, (played.get(userId) ?? 0) + 1);
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(ratings);
    const rows = [...elo.entries()].map(([userId, value]) => ({
      userId,
      elo: value,
      matchesCounted: played.get(userId) ?? 0,
      updatedAt: new Date(),
    }));
    if (rows.length > 0) await tx.insert(ratings).values(rows);
  });
}
