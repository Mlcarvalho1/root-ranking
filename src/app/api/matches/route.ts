import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { matches, matchPlayers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { recomputeRatings } from "@/lib/elo";
import { matchInputSchema } from "@/lib/match-schema";
import { validateMatchAgainstDb } from "@/lib/matches";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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
  const matchId = await db.transaction(async (tx) => {
    const [match] = await tx
      .insert(matches)
      .values({ ...matchData, createdBy: session.userId })
      .returning({ id: matches.id });
    await tx
      .insert(matchPlayers)
      .values(players.map((p) => ({ ...p, matchId: match.id })));
    return match.id;
  });

  await recomputeRatings();

  return NextResponse.json({ id: matchId }, { status: 201 });
}
