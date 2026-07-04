"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardTitle,
  ErrorText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import {
  DECK_LABELS,
  DECKS,
  MAP_LABELS,
  MAPS,
  matchInputSchema,
  WIN_TYPE_LABELS,
} from "@/lib/match-schema";
import { Crown } from "@/components/decor";

type UserOption = { id: number; displayName: string };
type FactionOption = {
  id: number;
  name: string;
  code: string;
  color: string;
  allowsDuplicate: boolean;
};

type PlayerRow = {
  userId: string;
  factionId: string;
  score: string;
  isWinner: boolean;
  winType: string;
};

export type MatchFormInitial = {
  matchId: number;
  playedAt: string;
  map: string | null;
  deck: string | null;
  notes: string | null;
  players: {
    userId: number;
    factionId: number;
    score: number;
    isWinner: boolean;
    winType: string | null;
  }[];
};

const emptyRow = (): PlayerRow => ({
  userId: "",
  factionId: "",
  score: "0",
  isWinner: false,
  winType: "points",
});

export function MatchForm({
  users,
  factions,
  initial,
}: {
  users: UserOption[];
  factions: FactionOption[];
  initial?: MatchFormInitial;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [playedAt, setPlayedAt] = useState(
    initial?.playedAt ?? new Date().toISOString().slice(0, 10),
  );
  const [map, setMap] = useState(initial?.map ?? "");
  const [deck, setDeck] = useState(initial?.deck ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [rows, setRows] = useState<PlayerRow[]>(
    initial
      ? initial.players.map((p) => ({
          userId: String(p.userId),
          factionId: String(p.factionId),
          score: String(p.score),
          isWinner: p.isWinner,
          winType: p.winType ?? "points",
        }))
      : [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
  );

  function updateRow(index: number, patch: Partial<PlayerRow>) {
    setRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (rows.some((r) => !r.userId || !r.factionId)) {
      setError("Preencha jogador e facção em todas as linhas");
      return;
    }

    const payload = {
      playedAt,
      map: map || null,
      deck: deck || null,
      notes: notes.trim() || null,
      players: rows.map((r) => ({
        userId: Number(r.userId),
        factionId: Number(r.factionId),
        score: Number(r.score),
        isWinner: r.isWinner,
        winType: r.isWinner ? r.winType : null,
      })),
    };

    const parsed = matchInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSaving(true);
    const res = await fetch(
      initial ? `/api/matches/${initial.matchId}` : "/api/matches",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    );
    if (res.ok) {
      const data = await res.json();
      router.push(`/matches/${data.id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao salvar a partida");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardTitle>Dados da partida</CardTitle>
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="playedAt">Data</Label>
            <Input
              id="playedAt"
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="map">Mapa</Label>
            <Select id="map" value={map} onChange={(e) => setMap(e.target.value)}>
              <option value="">—</option>
              {MAPS.map((value) => (
                <option key={value} value={value}>
                  {MAP_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="deck">Baralho</Label>
            <Select id="deck" value={deck} onChange={(e) => setDeck(e.target.value)}>
              <option value="">—</option>
              {DECKS.map((value) => (
                <option key={value} value={value}>
                  {DECK_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Momentos memoráveis, traições, promessas quebradas..."
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Súmula</CardTitle>
        <div className="space-y-3 p-4">
          {rows.map((row, index) => {
            const faction = factions.find((f) => String(f.id) === row.factionId);
            return (
              <div
                key={index}
                className="animate-rise rounded-lg border-2 border-ink/20 p-3"
                style={{
                  borderLeftWidth: 6,
                  borderLeftColor: faction?.color ?? "rgb(59 42 29 / 0.2)",
                }}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_6rem_auto_auto]">
                  <div>
                    <Label>Jogador</Label>
                    <Select
                      value={row.userId}
                      onChange={(e) => updateRow(index, { userId: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Pontos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={row.score}
                      onChange={(e) => updateRow(index, { score: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => updateRow(index, { isWinner: !row.isWinner })}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 font-display font-bold transition-all active:translate-y-0.5 ${
                        row.isWinner
                          ? "border-ember-dark bg-mustard/40 text-ink"
                          : "border-ink/30 text-ink-faint hover:border-ink/60 hover:text-ink-soft"
                      }`}
                    >
                      <Crown
                        className={`size-4 ${row.isWinner ? "text-ember-dark" : ""}`}
                      />
                      {row.isWinner ? "Vencedor!" : "Venceu?"}
                    </button>
                  </div>
                  {row.isWinner && (
                    <div>
                      <Label>Vitória por</Label>
                      <Select
                        value={row.winType}
                        onChange={(e) => updateRow(index, { winType: e.target.value })}
                      >
                        {Object.entries(WIN_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Label>
                    Facção
                    {faction && (
                      <span className="ml-2 font-normal text-ink-faint">
                        {faction.name}
                      </span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {factions.map((f) => {
                      const selected = row.factionId === String(f.id);
                      const takenElsewhere =
                        !f.allowsDuplicate &&
                        rows.some(
                          (other, i) => i !== index && other.factionId === String(f.id),
                        );
                      return (
                        <button
                          key={f.id}
                          type="button"
                          title={f.name}
                          disabled={takenElsewhere}
                          onClick={() =>
                            updateRow(index, {
                              factionId: selected ? "" : String(f.id),
                            })
                          }
                          className={`flex size-11 cursor-pointer items-center justify-center rounded-full border-2 bg-parchment-light transition-all disabled:cursor-not-allowed disabled:opacity-25 ${
                            selected
                              ? "scale-110 shadow-card"
                              : "border-ink/25 hover:scale-105"
                          }`}
                          style={selected ? { borderColor: f.color } : undefined}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/factions/${f.code}.webp`}
                            alt={f.name}
                            className="size-8"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
                {rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setRows((rows) => rows.filter((_, i) => i !== index))}
                    className="mt-2 cursor-pointer text-sm font-semibold text-rust underline"
                  >
                    Remover jogador
                  </button>
                )}
              </div>
            );
          })}
          {rows.length < 6 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setRows((rows) => [...rows, emptyRow()])}
            >
              + Adicionar jogador
            </Button>
          )}
        </div>
      </Card>

      <ErrorText>{error}</ErrorText>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : initial ? "Salvar alterações" : "Registrar partida"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
