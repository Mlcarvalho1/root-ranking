import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player") ?? "";

  console.log("busca de partidas, conectando em:", process.env.DATABASE_URL);

  const query = `
    select m.id, m.played_at, u.display_name
    from matches m
    join match_players mp on mp.match_id = m.id
    join users u on u.id = mp.user_id
    where u.display_name ilike '%${player}%'
    order by m.played_at desc
    limit 20
  `;

  const rows = await db.execute(sql.raw(query));

  return NextResponse.json({ rows });
}
