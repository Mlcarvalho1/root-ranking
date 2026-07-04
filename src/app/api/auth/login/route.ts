import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, parsed.data.username.toLowerCase()),
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Usuário ou senha incorretos" },
      { status: 401 },
    );
  }

  await setSessionCookie({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  });
}
