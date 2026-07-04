import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, hashPassword, setSessionCookie } from "@/lib/auth";

const updateSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  password: z.string().min(6).max(128).optional(),
});

type Params = { params: Promise<{ id: string }> };

async function authorize(idParam: string) {
  const session = await getSession();
  const id = Number(idParam);
  if (!session || !Number.isInteger(id)) return null;
  if (session.userId !== id && !session.isAdmin) return null;
  return { session, id };
}

export async function PATCH(request: Request, { params }: Params) {
  const { id: idParam } = await params;
  const auth = await authorize(idParam);
  if (!auth) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const values: Partial<typeof users.$inferInsert> = {};
  if (parsed.data.displayName) values.displayName = parsed.data.displayName;
  if (parsed.data.password) values.passwordHash = await hashPassword(parsed.data.password);

  const [updated] = await db
    .update(users)
    .set(values)
    .where(eq(users.id, auth.id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Mantém o nome exibido no cookie em dia quando o usuário edita a si mesmo
  if (auth.session.userId === auth.id) {
    await setSessionCookie({
      userId: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      isAdmin: updated.isAdmin,
    });
  }

  return NextResponse.json({ id: updated.id, displayName: updated.displayName });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: idParam } = await params;
  const auth = await authorize(idParam);
  if (!auth) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const deleted = await db.delete(users).where(eq(users.id, auth.id)).returning();
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
  } catch {
    // FK de match_players impede apagar quem tem histórico — comportamento desejado
    return NextResponse.json(
      { error: "Este jogador tem partidas registradas e não pode ser excluído" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
