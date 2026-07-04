"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, CardTitle } from "@/components/ui";
import { FactionIcon } from "@/components/faction-chip";
import {
  FACTION_REACH,
  MILITANT_FACTIONS,
  RECOMMENDED_REACH,
  SECOND_VAGABOND_REACH,
} from "@/lib/reach";
import { combinations } from "@/lib/random";

type FactionOption = {
  id: number;
  name: string;
  code: string;
  color: string;
  allowsDuplicate: boolean;
};

// Uma "cópia" selecionável de facção: o Vagabundo tem duas, com alcances
// diferentes (5 e 2)
type Copy = { factionId: number; code: string; reach: number; second: boolean };

function buildCopies(factions: FactionOption[]): Copy[] {
  const copies: Copy[] = factions.map((f) => ({
    factionId: f.id,
    code: f.code,
    reach: FACTION_REACH[f.code] ?? 0,
    second: false,
  }));
  for (const f of factions) {
    if (f.allowsDuplicate) {
      copies.push({
        factionId: f.id,
        code: f.code,
        reach: SECOND_VAGABOND_REACH,
        second: true,
      });
    }
  }
  return copies;
}

export function SetupPlanner({ factions }: { factions: FactionOption[] }) {
  const [players, setPlayers] = useState(4);
  const [counts, setCounts] = useState<Record<number, number>>({});

  const target = RECOMMENDED_REACH[players];
  const byId = useMemo(
    () => new Map(factions.map((f) => [f.id, f])),
    [factions],
  );

  const selection = Object.entries(counts).filter(([, n]) => n > 0);
  const selectedCount = selection.reduce((sum, [, n]) => sum + n, 0);
  const totalReach = selection.reduce((sum, [id, n]) => {
    const faction = byId.get(Number(id))!;
    const first = FACTION_REACH[faction.code] ?? 0;
    return sum + first + (n > 1 ? SECOND_VAGABOND_REACH : 0);
  }, 0);
  const hasMilitant = selection.some(([id]) =>
    MILITANT_FACTIONS.has(byId.get(Number(id))!.code),
  );

  const reachOk = totalReach >= target;
  const countOk = selectedCount === players;
  const ready = reachOk && countOk && hasMilitant;

  function toggle(faction: FactionOption) {
    setCounts((counts) => {
      const current = counts[faction.id] ?? 0;
      const max = faction.allowsDuplicate ? 2 : 1;
      return { ...counts, [faction.id]: (current + 1) % (max + 1) };
    });
  }

  function draw() {
    const copies = buildCopies(factions);
    const valid = combinations(copies, players).filter((combo) => {
      const reach = combo.reduce((sum, c) => sum + c.reach, 0);
      if (reach < target) return false;
      if (!combo.some((c) => MILITANT_FACTIONS.has(c.code))) return false;
      // segunda cópia só entra acompanhada da primeira
      return combo.every(
        (c) =>
          !c.second ||
          combo.some((o) => o.factionId === c.factionId && !o.second),
      );
    });
    if (valid.length === 0) return;
    const combo = valid[Math.floor(Math.random() * valid.length)];
    const next: Record<number, number> = {};
    for (const copy of combo) next[copy.factionId] = (next[copy.factionId] ?? 0) + 1;
    setCounts(next);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Quantos jogadores?</CardTitle>
        <div className="flex flex-wrap items-center gap-2 p-4">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPlayers(n)}
              className={`size-12 cursor-pointer rounded-full border-2 font-display text-xl font-bold transition-all active:translate-y-0.5 ${
                players === n
                  ? "border-ember-dark bg-ember text-parchment-light shadow-card"
                  : "border-ink/30 text-ink-soft hover:border-ink/60"
              }`}
            >
              {n}
            </button>
          ))}
          <span className="ml-2 text-sm text-ink-soft">
            Alcance recomendado: <strong className="text-ink">{target}+</strong>
          </span>
        </div>
      </Card>

      <Card>
        <CardTitle className="flex items-center justify-between">
          <span>Facções</span>
          <span className="text-sm font-normal opacity-80">
            toque para escolher — o Vagabundo aceita 2 cópias
          </span>
        </CardTitle>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {factions.map((f) => {
            const count = counts[f.id] ?? 0;
            const selected = count > 0;
            const reach = FACTION_REACH[f.code] ?? 0;
            const militant = MILITANT_FACTIONS.has(f.code);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f)}
                className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all active:translate-y-0.5 ${
                  selected
                    ? "bg-parchment-light shadow-card"
                    : "border-ink/20 hover:border-ink/50 hover:bg-parchment-light/60"
                }`}
                style={selected ? { borderColor: f.color } : undefined}
              >
                {count > 1 && (
                  <span className="absolute right-2 top-2 rounded-full bg-ink px-1.5 font-display text-xs font-bold text-parchment-light">
                    ×2
                  </span>
                )}
                <FactionIcon code={f.code} name={f.name} color={f.color} size="lg" />
                <span className="font-display text-sm font-bold leading-tight">
                  {f.name}
                </span>
                <span className="flex items-center gap-2 text-xs text-ink-soft">
                  <span>
                    Alcance <strong className="text-ink">{reach}</strong>
                    {f.allowsDuplicate && count > 1 && (
                      <strong className="text-ink">+{SECOND_VAGABOND_REACH}</strong>
                    )}
                  </span>
                  {militant && (
                    <span
                      title="Facção militante"
                      className="flex items-center gap-0.5"
                    >
                      <img src="/art/item-sword.webp" alt="" className="size-3.5" />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>Equilíbrio da mesa</CardTitle>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-4xl font-bold text-ember-dark">
              {totalReach}
            </span>
            <span className="text-ink-soft">
              de {target} de alcance · {selectedCount} de {players} facções
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full border-2 border-ink/30 bg-parchment-dark">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((totalReach / target) * 100, 100)}%`,
                backgroundColor: reachOk ? "var(--color-moss)" : "var(--color-ember)",
              }}
            />
          </div>
          {selectedCount > 0 && (
            <ul className="space-y-1 text-sm">
              {!countOk && (
                <li className="text-ink-soft">
                  {selectedCount < players
                    ? `Escolha mais ${players - selectedCount} ${players - selectedCount === 1 ? "facção" : "facções"}.`
                    : `Remova ${selectedCount - players} ${selectedCount - players === 1 ? "facção" : "facções"}.`}
                </li>
              )}
              {!reachOk && (
                <li className="font-semibold text-rust">
                  Alcance insuficiente — a partida tende a ficar lenta e sem
                  conflito.
                </li>
              )}
              {!hasMilitant && (
                <li className="font-semibold text-rust">
                  Inclua ao menos uma facção militante (
                  <img
                    src="/art/item-sword.webp"
                    alt="espada"
                    className="inline size-3.5"
                  />
                  ) para manter a pressão no mapa.
                </li>
              )}
              {ready && (
                <li className="font-semibold text-moss">
                  Mesa equilibrada! Boa partida — e que vença a melhor facção.
                </li>
              )}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="button" onClick={draw}>
              Sortear mesa equilibrada
            </Button>
            <Button type="button" variant="outline" onClick={() => setCounts({})}>
              Limpar
            </Button>
            {ready && (
              <Link
                href="/matches/new"
                className="font-display font-bold text-ember-dark underline"
              >
                Registrar a partida depois →
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
