import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, setSessionCookie } from "@/lib/auth";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Usuário precisa de ao menos 3 caracteres")
    .max(32)
    .regex(
      /^[a-z0-9_]+$/,
      "Use letras minúsculas sem acento (números e _ são opcionais)",
    ),
  displayName: z.string().min(1, "Informe um nome").max(64),
  password: z.string().min(6, "Senha precisa de ao menos 6 caracteres").max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { username, displayName, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (existing) {
    return NextResponse.json({ error: "Usuário já existe" }, { status: 409 });
  }

  // Primeiro usuário registrado vira admin
  const [{ total }] = await db.select({ total: count() }).from(users);

  const [user] = await db
    .insert(users)
    .values({
      username,
      displayName,
      passwordHash: await hashPassword(password),
      isAdmin: total === 0,
    })
    .returning();

  await setSessionCookie({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
  });

  return NextResponse.json(
    { id: user.id, username: user.username, displayName: user.displayName },
    { status: 201 },
  );
}
