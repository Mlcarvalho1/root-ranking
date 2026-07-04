import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { factions, users } from "@/db/schema";
import { MatchForm } from "@/components/match-form";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const [userList, factionList] = await Promise.all([
    db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .orderBy(asc(users.displayName)),
    db
      .select({
        id: factions.id,
        name: factions.name,
        code: factions.code,
        color: factions.color,
        allowsDuplicate: factions.allowsDuplicate,
      })
      .from(factions)
      .orderBy(asc(factions.id)),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Nova partida</h1>
      <MatchForm users={userList} factions={factionList} />
    </div>
  );
}
