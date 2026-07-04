/* eslint-disable @next/next/no-img-element */
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { factions } from "@/db/schema";
import { Card } from "@/components/ui";
import { SetupPlanner } from "@/components/setup-planner";
import { SetupModeTabs } from "@/components/setup-mode-tabs";

export const dynamic = "force-dynamic";

const VAGABONDS = ["thief", "tinker", "ranger", "vagrant", "arbiter", "scoundrel"];

export default async function SetupPage() {
  const factionList = await db
    .select({
      id: factions.id,
      name: factions.name,
      code: factions.code,
      color: factions.color,
      allowsDuplicate: factions.allowsDuplicate,
    })
    .from(factions)
    .orderBy(asc(factions.id));

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Montar partida</h1>

      <SetupModeTabs active="reach" />

      <Card className="flex flex-col items-center gap-4 p-4 sm:flex-row">
        <img
          src="/art/marauder-box.webp"
          alt="Root: The Marauder Expansion"
          className="w-36 shrink-0 rounded-lg"
        />
        <div className="space-y-2 text-sm text-ink-soft">
          <p>
            Para uma mesa equilibrada, o sistema de{" "}
            <strong className="text-ink">Alcance (Reach)</strong> de Root dá a
            cada facção um valor — a capacidade dela de pressionar o mapa.
            Escolham facções cuja soma atinja o alcance recomendado para o
            número de jogadores, incluindo ao menos uma facção{" "}
            <strong className="text-ink">militante</strong>.
          </p>
          <p>
            Monte a mesa manualmente ou deixe a floresta decidir com o sorteio.
            Quer o <strong className="text-ink">Advanced Setup oficial</strong>{" "}
            da expansão Marauder, com draft de facções? Use o modo Draft aí em
            cima.
          </p>
        </div>
        <div aria-hidden className="hidden shrink-0 items-end gap-1 lg:flex">
          {VAGABONDS.map((vb, i) => (
            <img
              key={vb}
              src={`/art/vb-${vb}.webp`}
              alt=""
              className="tree-sway w-8 drop-shadow-sm"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
      </Card>

      <SetupPlanner factions={factionList} />
    </div>
  );
}
