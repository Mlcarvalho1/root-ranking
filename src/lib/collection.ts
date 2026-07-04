// Coleção do grupo (quais componentes existem na mesa), persistida em
// localStorage — usada apenas em Client Components.

import { z } from "zod";
import {
  GAME_DECKS,
  GAME_MAPS,
  HIRELINGS,
  LANDMARKS,
  type DeckId,
  type LandmarkId,
  type MapId,
} from "@/lib/advanced-setup";

export type Collection = {
  factions: string[];
  maps: MapId[];
  decks: DeckId[];
  landmarks: LandmarkId[];
  hirelings: string[];
};

export const COLLECTION_STORAGE_KEY = "root-ranking:collection";

const collectionSchema = z.object({
  factions: z.array(z.string()),
  maps: z.array(z.string()),
  decks: z.array(z.string()),
  landmarks: z.array(z.string()),
  hirelings: z.array(z.string()),
});

export function fullCollection(factionCodes: string[]): Collection {
  return {
    factions: [...factionCodes],
    maps: GAME_MAPS.map((m) => m.id),
    decks: GAME_DECKS.map((d) => d.id),
    landmarks: LANDMARKS.map((l) => l.id),
    hirelings: HIRELINGS.map((h) => h.id),
  };
}

// Lê do localStorage, descartando ids desconhecidos; sem nada salvo (ou com
// JSON inválido), assume a coleção completa
export function loadCollection(factionCodes: string[]): Collection {
  const full = fullCollection(factionCodes);
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(COLLECTION_STORAGE_KEY);
  } catch {
    return full;
  }
  if (!raw) return full;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return full;
  }
  const result = collectionSchema.safeParse(parsed);
  if (!result.success) return full;

  const keep = <T extends string>(saved: string[], known: T[]): T[] =>
    known.filter((id) => saved.includes(id));
  return {
    factions: keep(result.data.factions, full.factions),
    maps: keep(result.data.maps, full.maps),
    decks: keep(result.data.decks, full.decks),
    landmarks: keep(result.data.landmarks, full.landmarks),
    hirelings: keep(result.data.hirelings, full.hirelings),
  };
}

export function saveCollection(collection: Collection): void {
  try {
    window.localStorage.setItem(
      COLLECTION_STORAGE_KEY,
      JSON.stringify(collection),
    );
  } catch {
    // localStorage indisponível (modo privado etc.) — segue sem persistir
  }
}
