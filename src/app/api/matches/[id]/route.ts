import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { matches, matchPlayers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { recomputeRatings } from "@/lib/elo";
import { matchInputSchema } from "@/lib/match-schema";
import { validateMatchAgainstDb } from "@/lib/matches";

type Params = { params: Promise<{ id: string }> };

type AuthResult =
  | { error: 401 | 403 | 404; match?: never }
  | { error?: never; match: typeof matches.$inferSelect };

async function authorizeMatch(idParam: string): Promise<AuthResult> {
  const session = await getSession();
  const id = Number(idParam);
  if (!session || !Number.isInteger(id)) return { error: 401 };

  const match = await db.query.matches.findFirst({ where: eq(matches.id, id) });
  if (!match) return { error: 404 };
  if (match.createdBy !== session.userId && !session.isAdmin) {
    return { error: 403 };
  }
  return { match };
}

const ERROR_MESSAGES = {
  401: "Não autenticado",
  403: "Só quem registrou a partida (ou admin) pode alterá-la",
  404: "Partida não encontrada",
};

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authorizeMatch(id);
  if (auth.error !== undefined) {
    return NextResponse.json(
      { error: ERROR_MESSAGES[auth.error] },
      { status: auth.error },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = matchInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const dbError = await validateMatchAgainstDb(parsed.data);
  if (dbError) {
    return NextResponse.json({ error: dbError }, { status: 400 });
  }

  const { players, ...matchData } = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(matches).set(matchData).where(eq(matches.id, auth.match.id));
    await tx.delete(matchPlayers).where(eq(matchPlayers.matchId, auth.match.id));
    await tx
      .insert(matchPlayers)
      .values(players.map((p) => ({ ...p, matchId: auth.match.id })));
  });

  await recomputeRatings();

  return NextResponse.json({ id: auth.match.id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authorizeMatch(id);
  if (auth.error !== undefined) {
    return NextResponse.json(
      { error: ERROR_MESSAGES[auth.error] },
      { status: auth.error },
    );
  }

  await db.delete(matches).where(eq(matches.id, auth.match.id));
  await recomputeRatings();

  return NextResponse.json({ ok: true });
}
