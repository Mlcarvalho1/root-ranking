import { z } from "zod";

export const MAPS = ["autumn", "winter", "lake", "mountain"] as const;
export const DECKS = ["standard", "exiles_partisans", "squires_disciples"] as const;

export const MAP_LABELS: Record<string, string> = {
  autumn: "Outono",
  winter: "Inverno",
  lake: "Lago",
  mountain: "Montanha",
};

export const DECK_LABELS: Record<string, string> = {
  standard: "Padrão",
  exiles_partisans: "Exilados & Partidários",
  squires_disciples: "Escudeiros & Discípulos",
};

export const WIN_TYPE_LABELS: Record<string, string> = {
  points: "Pontos",
  dominance: "Dominância",
  coalition: "Coalizão",
};

const playerSchema = z.object({
  userId: z.number().int().positive(),
  factionId: z.number().int().positive(),
  score: z.number().int().min(0).max(60),
  isWinner: z.boolean(),
  winType: z.enum(["points", "dominance", "coalition"]).nullish(),
});

export const matchInputSchema = z
  .object({
    playedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    map: z.enum(MAPS).nullish(),
    deck: z.enum(DECKS).nullish(),
    notes: z.string().max(2000).nullish(),
    players: z.array(playerSchema).min(2, "Mínimo de 2 jogadores").max(6, "Máximo de 6 jogadores"),
  })
  .superRefine((match, ctx) => {
    const userIds = match.players.map((p) => p.userId);
    if (new Set(userIds).size !== userIds.length) {
      ctx.addIssue({ code: "custom", message: "Jogador repetido na partida" });
    }

    const winners = match.players.filter((p) => p.isWinner);
    if (winners.length === 0) {
      ctx.addIssue({ code: "custom", message: "A partida precisa de um vencedor" });
    }
    if (winners.length > 2) {
      ctx.addIssue({
        code: "custom",
        message: "No máximo 2 vencedores (coalizão do Vagabundo)",
      });
    }
    if (winners.length === 2 && !winners.every((w) => w.winType === "coalition")) {
      ctx.addIssue({
        code: "custom",
        message: "Dois vencedores só por coalizão — marque ambos como 'Coalizão'",
      });
    }
    if (winners.length === 1 && winners[0].winType === "coalition") {
      ctx.addIssue({
        code: "custom",
        message: "Vitória por coalizão exige dois vencedores",
      });
    }
    for (const p of match.players) {
      if (!p.isWinner && p.winType) {
        ctx.addIssue({
          code: "custom",
          message: "Tipo de vitória só se aplica a vencedores",
        });
      }
    }
  })
  .transform((match) => ({
    ...match,
    players: match.players.map((p) => ({
      ...p,
      winType: p.isWinner ? (p.winType ?? "points") : null,
    })),
  }));

export type MatchInput = z.infer<typeof matchInputSchema>;
