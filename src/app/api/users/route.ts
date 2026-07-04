import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function GET() {
  const list = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
    })
    .from(users)
    .orderBy(asc(users.displayName));
  return NextResponse.json(list);
}
