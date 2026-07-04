"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useReducer } from "react";
import Link from "next/link";
import { Button, Card, CardTitle, Input, Label, cx } from "@/components/ui";
import { FactionIcon } from "@/components/faction-chip";
import { MILITANT_FACTIONS } from "@/lib/reach";
import {
  FACTION_SETUP_TEXT,
  GAME_DECKS,
  GAME_MAPS,
  HIRELINGS,
  HIRELING_BY_ID,
  LANDMARKS,
  demotedCount,
  excludedFactionCodes,
  type DeckId,
  type LandmarkId,
  type MapId,
} from "@/lib/advanced-setup";
import { generatePool, type PoolCard } from "@/lib/synergy";
import {
  fullCollection,
  loadCollection,
  saveCollection,
  type Collection,
} from "@/lib/collection";
import { shuffle } from "@/lib/random";

type FactionOption = { id: number; name: string; code: string; color: string };

type DrawnHireling = { id: string; demoted: boolean };

const STEPS = [
  { id: "collection", label: "Coleção" },
  { id: "players", label: "Jogadores" },
  { id: "map", label: "Mapa" }, // A.1
  { id: "deck", label: "Baralho" }, // A.2
  { id: "seating", label: "Assentos" }, // A.4
  { id: "landmarks", label: "Landmarks" }, // A.5
  { id: "hirelings", label: "Hirelings" }, // A.6
  { id: "hands", label: "Cartas" }, // A.7
  { id: "draft", label: "Draft" }, // A.8
  { id: "final", label: "Fim" }, // A.9–A.10
] as const;

type StepId = (typeof STEPS)[number]["id"];

type WizardState = {
  step: number;
  maxStep: number;
  collection: Collection | null; // null até carregar do localStorage
  playerCount: number;
  names: string[];
  map: MapId | null;
  deck: DeckId | null;
  seating: number[] | null; // índices de jogador na ordem do turno
  landmarksEnabled: boolean;
  landmarkCount: 1 | 2;
  landmarks: LandmarkId[] | null;
  hirelingsEnabled: boolean;
  hirelings: DrawnHireling[] | null;
  pool: PoolCard[] | null;
  poolScore: number | null;
  picks: string[]; // picks[k] = facção escolhida pelo k-ésimo a draftar
};

const INITIAL: WizardState = {
  step: 0,
  maxStep: 0,
  collection: null,
  playerCount: 4,
  names: Array(6).fill(""),
  map: null,
  deck: null,
  seating: null,
  landmarksEnabled: false,
  landmarkCount: 1,
  landmarks: null,
  hirelingsEnabled: false,
  hirelings: null,
  pool: null,
  poolScore: null,
  picks: [],
};

type Action =
  | { type: "load-collection"; collection: Collection }
  | { type: "set-collection"; collection: Collection }
  | { type: "toggle-collection"; group: keyof Collection; id: string }
  | { type: "goto"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "set-players"; count: number }
  | { type: "set-name"; index: number; name: string }
  | { type: "set-map"; map: MapId }
  | { type: "set-deck"; deck: DeckId }
  | { type: "set-seating"; seating: number[] }
  | { type: "set-landmarks-enabled"; enabled: boolean }
  | { type: "set-landmark-count"; count: 1 | 2 }
  | { type: "set-landmarks"; landmarks: LandmarkId[] }
  | { type: "set-hirelings-enabled"; enabled: boolean }
  | { type: "set-hirelings"; hirelings: DrawnHireling[] }
  | { type: "set-pool"; pool: PoolCard[]; score: number }
  | { type: "pick"; code: string }
  | { type: "undo-pick" };

function withCollection(
  state: WizardState,
  collection: Collection,
): WizardState {
  return {
    ...state,
    collection,
    map: state.map && collection.maps.includes(state.map) ? state.map : null,
    deck:
      state.deck && collection.decks.includes(state.deck) ? state.deck : null,
    landmarks: null,
    hirelings: null,
    pool: null,
    poolScore: null,
    picks: [],
  };
}

// Todo sorteio acontece nos handlers; o reducer é puro e concentra a
// invalidação: mudar um passo anterior descarta os resultados derivados
function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "load-collection":
      return { ...state, collection: action.collection };
    case "set-collection":
      return withCollection(state, action.collection);
    case "toggle-collection": {
      if (!state.collection) return state;
      const group = state.collection[action.group] as string[];
      return withCollection(state, {
        ...state.collection,
        [action.group]: toggleItem(group, action.id),
      });
    }
    case "goto":
      return { ...state, step: action.step };
    case "next": {
      const step = Math.min(state.step + 1, STEPS.length - 1);
      return { ...state, step, maxStep: Math.max(state.maxStep, step) };
    }
    case "back":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "set-players":
      return {
        ...state,
        playerCount: action.count,
        seating: null,
        hirelings: null,
        pool: null,
        poolScore: null,
        picks: [],
      };
    case "set-name": {
      const names = [...state.names];
      names[action.index] = action.name;
      return { ...state, names };
    }
    case "set-map":
      // Balsa/Torre dependem do mapa — re-sortear landmarks
      return { ...state, map: action.map, landmarks: null };
    case "set-deck":
      return { ...state, deck: action.deck };
    case "set-seating":
      // a ordem do draft muda junto, então as escolhas caem
      return { ...state, seating: action.seating, picks: [] };
    case "set-landmarks-enabled":
      return { ...state, landmarksEnabled: action.enabled, landmarks: null };
    case "set-landmark-count":
      return { ...state, landmarkCount: action.count, landmarks: null };
    case "set-landmarks":
      return { ...state, landmarks: action.landmarks };
    case "set-hirelings-enabled":
      return {
        ...state,
        hirelingsEnabled: action.enabled,
        hirelings: null,
        pool: null,
        poolScore: null,
        picks: [],
      };
    case "set-hirelings":
      return {
        ...state,
        hirelings: action.hirelings,
        pool: null,
        poolScore: null,
        picks: [],
      };
    case "set-pool":
      return { ...state, pool: action.pool, poolScore: action.score, picks: [] };
    case "pick":
      return { ...state, picks: [...state.picks, action.code] };
    case "undo-pick":
      return { ...state, picks: state.picks.slice(0, -1) };
  }
}

function stepComplete(s: WizardState, id: StepId): boolean {
  switch (id) {
    case "collection":
      return (
        s.collection !== null &&
        s.collection.maps.length > 0 &&
        s.collection.decks.length > 0 &&
        s.collection.factions.length >= 3
      );
    case "players":
      return true;
    case "map":
      return s.map !== null;
    case "deck":
      return s.deck !== null;
    case "seating":
      return s.seating !== null;
    case "landmarks":
      return !s.landmarksEnabled || (s.landmarks?.length ?? 0) > 0;
    case "hirelings":
      return !s.hirelingsEnabled || s.hirelings !== null;
    case "hands":
      return true;
    case "draft":
      return s.pool !== null && s.picks.length === s.playerCount;
    case "final":
      return true;
  }
}

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((x) => x !== item)
    : [...list, item];
}

function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold transition-all active:translate-y-0.5",
        selected
          ? "border-moss bg-parchment-light text-ink shadow-card"
          : "border-ink/20 text-ink-faint hover:border-ink/50 hover:text-ink-soft",
      )}
    >
      {children}
    </button>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  note,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "cursor-pointer rounded-xl border-2 p-3 text-left transition-all active:translate-y-0.5",
        selected
          ? "border-ember-dark bg-parchment-light shadow-card"
          : "border-ink/20 hover:border-ink/50 hover:bg-parchment-light/60",
      )}
    >
      <span className="block font-display text-base font-bold">{title}</span>
      <span className="block text-xs text-ink-soft">{note}</span>
    </button>
  );
}

export function SetupWizard({ factions }: { factions: FactionOption[] }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const byCode = useMemo(
    () => new Map(factions.map((f) => [f.code, f])),
    [factions],
  );
  const allCodes = useMemo(() => factions.map((f) => f.code), [factions]);

  // localStorage só existe no cliente: carrega após o mount
  useEffect(() => {
    dispatch({ type: "load-collection", collection: loadCollection(allCodes) });
  }, [allCodes]);

  useEffect(() => {
    if (state.collection) saveCollection(state.collection);
  }, [state.collection]);

  const { collection, playerCount, picks } = state;
  const stepId = STEPS[state.step].id;

  const excluded = useMemo(
    () =>
      state.hirelingsEnabled && state.hirelings
        ? excludedFactionCodes(state.hirelings.map((h) => h.id))
        : new Set<string>(),
    [state.hirelingsEnabled, state.hirelings],
  );
  const availableFactions = useMemo(
    () =>
      collection ? collection.factions.filter((c) => !excluded.has(c)) : [],
    [collection, excluded],
  );
  const poolImpossible =
    availableFactions.length < playerCount + 1 ||
    !availableFactions.some((c) => MILITANT_FACTIONS.has(c));

  function rollPool() {
    const result = generatePool({
      available: availableFactions,
      players: playerCount,
    });
    if (result) {
      dispatch({ type: "set-pool", pool: result.pool, score: result.score });
    }
  }

  // Ao entrar no draft sem pool (ou após invalidação), sorteia automaticamente
  useEffect(() => {
    if (stepId !== "draft" || state.pool !== null || !collection) return;
    if (poolImpossible) return;
    rollPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, state.pool, collection, poolImpossible]);

  if (!collection) {
    return (
      <Card>
        <p className="p-4 text-sm text-ink-soft">Carregando a coleção…</p>
      </Card>
    );
  }

  const playerName = (i: number) => state.names[i]?.trim() || `Jogador ${i + 1}`;
  const pickOrder = state.seating ? [...state.seating].reverse() : null;
  const militantChosen = picks.some((c) => MILITANT_FACTIONS.has(c));

  const firstIncomplete = STEPS.findIndex((s) => !stepComplete(state, s.id));
  const maxReachable =
    firstIncomplete === -1
      ? STEPS.length - 1
      : Math.min(state.maxStep, firstIncomplete);
  const currentComplete = stepComplete(state, stepId);

  function renderCollection() {
    const groups: {
      title: string;
      items: { key: string; label: React.ReactNode; selected: boolean; toggle: () => void }[];
    }[] = [
      {
        title: "Facções",
        items: factions.map((f) => ({
          key: f.code,
          label: (
            <>
              <FactionIcon code={f.code} name={f.name} color={f.color} size="sm" />
              {f.name}
            </>
          ),
          selected: collection!.factions.includes(f.code),
          toggle: () =>
            dispatch({ type: "toggle-collection", group: "factions", id: f.code }),
        })),
      },
      {
        title: "Mapas",
        items: GAME_MAPS.map((m) => ({
          key: m.id,
          label: m.name,
          selected: collection!.maps.includes(m.id),
          toggle: () =>
            dispatch({ type: "toggle-collection", group: "maps", id: m.id }),
        })),
      },
      {
        title: "Baralhos",
        items: GAME_DECKS.map((d) => ({
          key: d.id,
          label: d.name,
          selected: collection!.decks.includes(d.id),
          toggle: () =>
            dispatch({ type: "toggle-collection", group: "decks", id: d.id }),
        })),
      },
      {
        title: "Landmarks",
        items: LANDMARKS.map((l) => ({
          key: l.id,
          label: l.name,
          selected: collection!.landmarks.includes(l.id),
          toggle: () =>
            dispatch({ type: "toggle-collection", group: "landmarks", id: l.id }),
        })),
      },
      {
        title: "Hirelings",
        items: HIRELINGS.map((h) => ({
          key: h.id,
          label: h.promotedName,
          selected: collection!.hirelings.includes(h.id),
          toggle: () =>
            dispatch({ type: "toggle-collection", group: "hirelings", id: h.id }),
        })),
      },
    ];

    return (
      <Card>
        <CardTitle>Passo 1 — O que tem na mesa?</CardTitle>
        <div className="space-y-4 p-4">
          <p className="text-sm text-ink-soft">
            Marque os componentes que o grupo possui. Fica salvo neste navegador
            para as próximas partidas.
          </p>
          {groups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="text-sm font-semibold text-ink-soft">{group.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <ToggleChip
                    key={item.key}
                    selected={item.selected}
                    onClick={item.toggle}
                  >
                    {item.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                dispatch({
                  type: "set-collection",
                  collection: fullCollection(allCodes),
                })
              }
            >
              Tenho tudo
            </Button>
            {!stepComplete(state, "collection") && (
              <p className="text-sm font-semibold text-rust">
                Marque ao menos 1 mapa, 1 baralho e 3 facções.
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  function renderPlayers() {
    return (
      <Card>
        <CardTitle>Passo 2 — Quantos jogadores?</CardTitle>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => dispatch({ type: "set-players", count: n })}
                className={cx(
                  "size-12 cursor-pointer rounded-full border-2 font-display text-xl font-bold transition-all active:translate-y-0.5",
                  playerCount === n
                    ? "border-ember-dark bg-ember text-parchment-light shadow-card"
                    : "border-ink/30 text-ink-soft hover:border-ink/60",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: playerCount }, (_, i) => (
              <div key={i}>
                <Label htmlFor={`player-${i}`}>Jogador {i + 1} (opcional)</Label>
                <Input
                  id={`player-${i}`}
                  value={state.names[i]}
                  placeholder={`Jogador ${i + 1}`}
                  onChange={(e) =>
                    dispatch({ type: "set-name", index: i, name: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  function renderMap() {
    const owned = GAME_MAPS.filter((m) => collection!.maps.includes(m.id));
    return (
      <Card>
        <CardTitle>Passo 3 — Mapa (A.1)</CardTitle>
        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {owned.map((m) => (
              <OptionCard
                key={m.id}
                selected={state.map === m.id}
                onClick={() => dispatch({ type: "set-map", map: m.id })}
                title={m.name}
                note={m.note}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              dispatch({
                type: "set-map",
                map: owned[Math.floor(Math.random() * owned.length)].id,
              })
            }
          >
            Sortear mapa
          </Button>
        </div>
      </Card>
    );
  }

  function renderDeck() {
    const owned = GAME_DECKS.filter((d) => collection!.decks.includes(d.id));
    return (
      <Card>
        <CardTitle>Passo 4 — Baralho (A.2)</CardTitle>
        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((d) => (
              <OptionCard
                key={d.id}
                selected={state.deck === d.id}
                onClick={() => dispatch({ type: "set-deck", deck: d.id })}
                title={d.name}
                note={d.note}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              dispatch({
                type: "set-deck",
                deck: owned[Math.floor(Math.random() * owned.length)].id,
              })
            }
          >
            Sortear baralho
          </Button>
        </div>
      </Card>
    );
  }

  function renderSeating() {
    return (
      <Card>
        <CardTitle>Passo 5 — Ordem dos assentos (A.4)</CardTitle>
        <div className="space-y-4 p-4">
          <p className="text-sm text-ink-soft">
            A ordem do turno e o 1º jogador são sorteados. O draft de facções
            começará pelo <strong className="text-ink">último</strong> da ordem.
          </p>
          <Button
            type="button"
            onClick={() =>
              dispatch({
                type: "set-seating",
                seating: shuffle(
                  Array.from({ length: playerCount }, (_, i) => i),
                ),
              })
            }
          >
            {state.seating ? "Sortear de novo" : "Sortear ordem"}
          </Button>
          {state.seating && (
            <ol className="space-y-1.5">
              {state.seating.map((playerIdx, pos) => (
                <li key={playerIdx} className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-ember-dark">
                    {pos + 1}º
                  </span>
                  <span className="font-semibold">{playerName(playerIdx)}</span>
                  {pos === 0 && (
                    <span className="rounded-full bg-ink px-2 py-0.5 font-display text-xs font-bold text-parchment-light">
                      1º jogador
                    </span>
                  )}
                  {pos === playerCount - 1 && (
                    <span className="rounded-full border-2 border-ink/40 px-2 py-0.5 font-display text-xs font-bold text-ink-soft">
                      abre o draft
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>
    );
  }

  function renderLandmarks() {
    const eligible = LANDMARKS.filter(
      (l) => collection!.landmarks.includes(l.id) && l.nativeMap !== state.map,
    );
    const enough = eligible.length >= state.landmarkCount;
    return (
      <Card>
        <CardTitle>Passo 6 — Landmarks (A.5, opcional)</CardTitle>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              selected={!state.landmarksEnabled}
              onClick={() =>
                dispatch({ type: "set-landmarks-enabled", enabled: false })
              }
            >
              Sem landmarks
            </ToggleChip>
            {([1, 2] as const).map((n) => (
              <ToggleChip
                key={n}
                selected={state.landmarksEnabled && state.landmarkCount === n}
                onClick={() => {
                  dispatch({ type: "set-landmarks-enabled", enabled: true });
                  dispatch({ type: "set-landmark-count", count: n });
                }}
              >
                {n} landmark{n > 1 ? "s" : ""}
              </ToggleChip>
            ))}
          </div>
          {state.landmarksEnabled && !enough && (
            <p className="text-sm font-semibold text-rust">
              Sua coleção não tem landmarks suficientes para esse mapa — a Balsa
              e a Torre já vêm nos mapas Lago e Montanha.
            </p>
          )}
          {state.landmarksEnabled && enough && (
            <Button
              type="button"
              onClick={() =>
                dispatch({
                  type: "set-landmarks",
                  landmarks: shuffle(eligible.map((l) => l.id)).slice(
                    0,
                    state.landmarkCount,
                  ),
                })
              }
            >
              {state.landmarks ? "Sortear de novo" : "Sortear landmarks"}
            </Button>
          )}
          {state.landmarksEnabled &&
            state.landmarks &&
            state.seating &&
            state.landmarks.map((id, i) => {
              const landmark = LANDMARKS.find((l) => l.id === id)!;
              const responsible = playerName(
                state.seating![playerCount - 1 - i],
              );
              return (
                <div
                  key={id}
                  className="rounded-xl border-2 border-ink/20 bg-parchment-light p-3"
                >
                  <p className="font-display font-bold">{landmark.name}</p>
                  <p className="text-sm text-ink-soft">
                    <strong className="text-ink">{responsible}</strong> monta:{" "}
                    {landmark.setupText}
                  </p>
                </div>
              );
            })}
        </div>
      </Card>
    );
  }

  function renderHirelings() {
    const owned = collection!.hirelings;
    const demotions = demotedCount(playerCount);
    return (
      <Card>
        <CardTitle>Passo 7 — Hirelings (A.6, opcional)</CardTitle>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              selected={!state.hirelingsEnabled}
              onClick={() =>
                dispatch({ type: "set-hirelings-enabled", enabled: false })
              }
            >
              Sem hirelings
            </ToggleChip>
            <ToggleChip
              selected={state.hirelingsEnabled}
              onClick={() =>
                dispatch({ type: "set-hirelings-enabled", enabled: true })
              }
            >
              Com hirelings
            </ToggleChip>
          </div>
          {state.hirelingsEnabled && owned.length < 3 && (
            <p className="text-sm font-semibold text-rust">
              São sorteados 3 hirelings — marque ao menos 3 na coleção.
            </p>
          )}
          {state.hirelingsEnabled && owned.length >= 3 && (
            <>
              <Button
                type="button"
                onClick={() => {
                  const drawn = shuffle(owned).slice(0, 3);
                  const demoted = new Set(
                    shuffle([0, 1, 2]).slice(0, demotions),
                  );
                  dispatch({
                    type: "set-hirelings",
                    hirelings: drawn.map((id, i) => ({
                      id,
                      demoted: demoted.has(i),
                    })),
                  });
                }}
              >
                {state.hirelings ? "Sortear de novo" : "Sortear 3 hirelings"}
              </Button>
              {state.hirelings && (
                <div className="space-y-2">
                  {state.hirelings.map((h) => {
                    const info = HIRELING_BY_ID.get(h.id)!;
                    const faction = info.factionCode
                      ? byCode.get(info.factionCode)
                      : null;
                    return (
                      <div
                        key={h.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink/20 bg-parchment-light p-3"
                      >
                        <span className="font-display font-bold">
                          {h.demoted ? info.demotedName : info.promotedName}
                        </span>
                        {h.demoted && (
                          <span className="rounded-full bg-ink px-2 py-0.5 font-display text-xs font-bold text-parchment-light">
                            Rebaixado
                          </span>
                        )}
                        {faction && (
                          <span className="ml-auto flex items-center gap-1.5 text-sm text-rust">
                            <FactionIcon
                              code={faction.code}
                              name={faction.name}
                              color={faction.color}
                              size="sm"
                            />
                            {faction.name} sai do draft
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    <li>
                      Com {playerCount} jogadores,{" "}
                      {demotions === 0
                        ? "nenhum hireling é rebaixado"
                        : `${demotions} hireling${demotions > 1 ? "s são rebaixados" : " é rebaixado"} (lado Rebaixado para cima)`}
                      .
                    </li>
                    <li>
                      Coloquem os marcadores de hireling nos espaços{" "}
                      <strong className="text-ink">4, 8 e 12</strong> da trilha
                      de pontos.
                    </li>
                    <li>
                      Começando pelo último jogador e seguindo em sentido
                      anti-horário, montem os hirelings conforme suas cartas.
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    );
  }

  function renderHands() {
    return (
      <Card>
        <CardTitle>Passo 8 — Mão inicial (A.7)</CardTitle>
        <div className="space-y-2 p-4 text-sm text-ink-soft">
          {playerCount === 2 && (
            <p className="font-semibold text-rust">
              Com 2 jogadores: removam as 4 cartas de dominância do baralho
              antes de embaralhar.
            </p>
          )}
          <p>
            Embaralhem o baralho e cada jogador compra{" "}
            <strong className="text-ink">5 cartas</strong>.
          </p>
          <p>
            No fim do setup, cada um escolherá 3 para ficar e devolverá 2 ao
            baralho — segurem as 5 por enquanto.
          </p>
        </div>
      </Card>
    );
  }

  function renderDraft() {
    if (poolImpossible) {
      return (
        <Card>
          <CardTitle>Passo 9 — Draft de facções (A.8)</CardTitle>
          <div className="space-y-2 p-4">
            <p className="text-sm font-semibold text-rust">
              Não há facções suficientes para o draft: são necessárias{" "}
              {playerCount + 1} facções disponíveis, com ao menos uma militante.
            </p>
            <p className="text-sm text-ink-soft">
              Amplie a coleção (passo 1), reduza jogadores ou re-sorteie os
              hirelings — os que correspondem a facções tiram essas facções do
              draft.
            </p>
          </div>
        </Card>
      );
    }
    if (!state.pool || !pickOrder) {
      return (
        <Card>
          <p className="p-4 text-sm text-ink-soft">Sorteando o pool…</p>
        </Card>
      );
    }

    const done = picks.length === playerCount;
    const currentPicker = done ? null : pickOrder[picks.length];
    const lastPick = picks[picks.length - 1];

    return (
      <Card>
        <CardTitle className="flex items-center justify-between">
          <span>Passo 9 — Draft de facções (A.8)</span>
          {state.poolScore !== null && (
            <span className="text-sm font-normal opacity-80">
              sinergia do pool: {state.poolScore > 0 ? "+" : ""}
              {state.poolScore}
            </span>
          )}
        </CardTitle>
        <div className="space-y-4 p-4">
          {excluded.size > 0 && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
              Fora do draft (hireling em jogo):
              {[...excluded].map((code) => {
                const f = byCode.get(code);
                return f ? (
                  <FactionIcon
                    key={code}
                    code={f.code}
                    name={f.name}
                    color={f.color}
                    size="sm"
                  />
                ) : null;
              })}
            </p>
          )}
          <p className="font-display text-lg font-bold">
            {done ? (
              <span className="text-moss">Draft completo!</span>
            ) : (
              <>
                Vez de{" "}
                <span className="text-ember-dark">
                  {playerName(currentPicker!)}
                </span>{" "}
                escolher
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {state.pool.map((card) => {
              const f = byCode.get(card.code)!;
              const pickIndex = picks.indexOf(card.code);
              const picked = pickIndex !== -1;
              const lockedNow = card.locked && !militantChosen && !picked;
              const leftover = done && !picked;
              const militant = MILITANT_FACTIONS.has(card.code);
              return (
                <button
                  key={card.code}
                  type="button"
                  disabled={picked || lockedNow || done}
                  onClick={() => dispatch({ type: "pick", code: card.code })}
                  title={
                    lockedNow
                      ? "Travada: só destrava quando alguém escolher uma militante"
                      : undefined
                  }
                  className={cx(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all",
                    picked || leftover
                      ? "border-ink/20 opacity-60"
                      : lockedNow
                        ? "cursor-not-allowed border-ink/20 opacity-70"
                        : "cursor-pointer border-ink/20 hover:bg-parchment-light/60 active:translate-y-0.5",
                  )}
                  style={
                    !picked && !lockedNow && !leftover
                      ? { borderColor: f.color }
                      : undefined
                  }
                >
                  {lockedNow && (
                    <span className="absolute right-2 top-2" aria-hidden>
                      🔒
                    </span>
                  )}
                  <FactionIcon
                    code={f.code}
                    name={f.name}
                    color={f.color}
                    size="lg"
                  />
                  <span className="font-display text-sm font-bold leading-tight">
                    {f.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                    {militant && (
                      <img
                        src="/art/item-sword.webp"
                        alt="militante"
                        className="size-3.5"
                      />
                    )}
                    {picked && (
                      <strong className="text-ink">
                        {playerName(pickOrder[pickIndex])}
                      </strong>
                    )}
                    {leftover && <span>fora da partida</span>}
                    {lockedNow && <span>travada</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {lastPick && !done && (
            <p className="rounded-xl border-2 border-moss/60 bg-parchment-light p-3 text-sm text-ink-soft">
              <strong className="text-ink">
                {playerName(pickOrder[picks.length - 1])}
              </strong>
              , monte agora: {FACTION_SETUP_TEXT[lastPick] ?? "consulte a carta de setup."}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {picks.length === 0 && (
              <Button type="button" variant="outline" onClick={rollPool}>
                Re-sortear pool
              </Button>
            )}
            {picks.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => dispatch({ type: "undo-pick" })}
              >
                Desfazer última escolha
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  function renderFinal() {
    const mapInfo = GAME_MAPS.find((m) => m.id === state.map);
    const deckInfo = GAME_DECKS.find((d) => d.id === state.deck);
    const leftover = state.pool?.find((c) => !picks.includes(c.code));
    const leftoverFaction = leftover ? byCode.get(leftover.code) : null;
    return (
      <Card>
        <CardTitle>Passo 10 — Últimos ajustes (A.9–A.10)</CardTitle>
        <div className="space-y-4 p-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>
              Cada jogador coloca seu marcador de pontuação no{" "}
              <strong className="text-ink">0</strong> da trilha.
            </li>
            <li>
              Cada jogador escolhe <strong className="text-ink">3 das 5 cartas</strong>{" "}
              da mão e devolve as outras 2, viradas para baixo, ao topo do
              baralho. Embaralhem o baralho em seguida.
            </li>
          </ul>
          <div className="rounded-xl border-2 border-ink/20 bg-parchment-light p-3">
            <p className="font-display font-bold">Resumo da mesa</p>
            <p className="text-sm text-ink-soft">
              Mapa: <strong className="text-ink">{mapInfo?.name}</strong> ·
              Baralho: <strong className="text-ink">{deckInfo?.name}</strong>
              {state.landmarksEnabled && state.landmarks && (
                <>
                  {" "}· Landmarks:{" "}
                  <strong className="text-ink">
                    {state.landmarks
                      .map((id) => LANDMARKS.find((l) => l.id === id)?.name)
                      .join(", ")}
                  </strong>
                </>
              )}
              {state.hirelingsEnabled && state.hirelings && (
                <>
                  {" "}· Hirelings:{" "}
                  <strong className="text-ink">
                    {state.hirelings
                      .map((h) => {
                        const info = HIRELING_BY_ID.get(h.id)!;
                        return h.demoted ? info.demotedName : info.promotedName;
                      })
                      .join(", ")}
                  </strong>
                </>
              )}
            </p>
            {state.seating && pickOrder && (
              <ol className="mt-2 space-y-1.5">
                {state.seating.map((playerIdx, pos) => {
                  const code = picks[playerCount - 1 - pos];
                  const f = code ? byCode.get(code) : null;
                  return (
                    <li key={playerIdx} className="flex items-center gap-2 text-sm">
                      <span className="font-display font-bold text-ember-dark">
                        {pos + 1}º
                      </span>
                      <span className="font-semibold">{playerName(playerIdx)}</span>
                      {f && (
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          <FactionIcon
                            code={f.code}
                            name={f.name}
                            color={f.color}
                            size="sm"
                          />
                          {f.name}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {leftoverFaction && (
              <p className="mt-2 text-xs text-ink-faint">
                Sobrou no pool: {leftoverFaction.name}
              </p>
            )}
          </div>
          <p className="font-display text-lg font-bold text-moss">
            Mesa pronta — boa partida!
          </p>
          <Link
            href="/matches/new"
            className="inline-block font-display font-bold text-ember-dark underline"
          >
            Registrar a partida depois →
          </Link>
        </div>
      </Card>
    );
  }

  const stepRenderers: Record<StepId, () => React.ReactNode> = {
    collection: renderCollection,
    players: renderPlayers,
    map: renderMap,
    deck: renderDeck,
    seating: renderSeating,
    landmarks: renderLandmarks,
    hirelings: renderHirelings,
    hands: renderHands,
    draft: renderDraft,
    final: renderFinal,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => {
          const reachable = i <= maxReachable;
          const current = i === state.step;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!reachable}
              onClick={() => dispatch({ type: "goto", step: i })}
              className={cx(
                "rounded-full border-2 px-2.5 py-0.5 font-display text-xs font-bold transition-all",
                current
                  ? "border-ember-dark bg-ember text-parchment-light"
                  : reachable
                    ? "cursor-pointer border-ink/30 text-ink-soft hover:border-ink/60"
                    : "border-ink/10 text-ink-faint",
              )}
            >
              {i + 1}. {s.label}
            </button>
          );
        })}
      </div>

      {stepRenderers[stepId]()}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={state.step === 0}
          onClick={() => dispatch({ type: "back" })}
        >
          ← Voltar
        </Button>
        {state.step < STEPS.length - 1 && (
          <Button
            type="button"
            disabled={!currentComplete}
            onClick={() => dispatch({ type: "next" })}
          >
            Avançar →
          </Button>
        )}
      </div>
    </div>
  );
}
