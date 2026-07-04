/* eslint-disable @next/next/no-img-element */
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { factions } from "@/db/schema";
import { Card } from "@/components/ui";
import { SetupModeTabs } from "@/components/setup-mode-tabs";
import { SetupWizard } from "@/components/setup-wizard";

export const dynamic = "force-dynamic";

export default async function DraftSetupPage() {
  const factionList = await db
    .select({
      id: factions.id,
      name: factions.name,
      code: factions.code,
      color: factions.color,
    })
    .from(factions)
    .orderBy(asc(factions.id));

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Montar partida</h1>

      <SetupModeTabs active="draft" />

      <Card className="flex flex-col items-center gap-4 p-4 sm:flex-row">
        <img
          src="/art/marauder-box.webp"
          alt="Root: The Marauder Expansion"
          className="w-36 shrink-0 rounded-lg"
        />
        <div className="space-y-2 text-sm text-ink-soft">
          <p>
            O <strong className="text-ink">Advanced Setup</strong> da expansão
            Marauder monta a mesa com um{" "}
            <strong className="text-ink">draft de facções</strong>: um pool com
            uma facção a mais que o número de jogadores, ao menos uma militante
            garantida, e cada um escolhe a sua começando pelo último da ordem.
          </p>
          <p>
            Aqui o sorteio do pool ainda ganha um tempero da casa: ele favorece
            facções com <strong className="text-ink">sinergia</strong> entre si.
            Siga os passos e boa partida.
          </p>
        </div>
      </Card>

      <SetupWizard factions={factionList} />
    </div>
  );
}
