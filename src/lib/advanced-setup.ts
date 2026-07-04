// Dados e regras puras do Advanced Setup oficial da expansão Marauder
// (Lei de Root, apêndice A): draft de facções com carta travada, landmarks,
// hirelings e mão inicial de 5 cartas. Os ids de mapa/baralho são os mesmos
// usados no registro de partidas (match-schema.ts).

import { MAPS as MAP_IDS, DECKS as DECK_IDS } from "@/lib/match-schema";

export type MapId = (typeof MAP_IDS)[number];
export type DeckId = (typeof DECK_IDS)[number];
export type LandmarkId =
  | "ferry"
  | "tower"
  | "lost_city"
  | "legendary_forge"
  | "black_market"
  | "elder_treetop";

export type GameMap = { id: MapId; name: string; note: string };
export type Deck = { id: DeckId; name: string; note: string };

export type Landmark = {
  id: LandmarkId;
  name: string;
  // Balsa e Torre já vêm montadas nos mapas Lago/Montanha: não entram no
  // sorteio de landmarks quando o mapa correspondente está em jogo
  nativeMap?: MapId;
  setupText: string;
};

export type Hireling = {
  id: string;
  promotedName: string;
  demotedName: string;
  // Facção que sai do draft quando este hireling está em jogo (A.6)
  factionCode: string | null;
};

export const GAME_MAPS: GameMap[] = [
  { id: "autumn", name: "Outono", note: "O mapa clássico — naipes impressos nas clareiras." },
  { id: "winter", name: "Inverno", note: "Naipes sorteados: embaralhe os 12 marcadores e distribua um por clareira." },
  { id: "lake", name: "Lago", note: "Traz a balsa; naipes sorteados com marcadores." },
  { id: "mountain", name: "Montanha", note: "Traz a torre e caminhos fechados; naipes sorteados com marcadores." },
];

export const GAME_DECKS: Deck[] = [
  { id: "standard", name: "Padrão", note: "O baralho do jogo base." },
  { id: "exiles_partisans", name: "Exilados & Partidários", note: "Mais interação e cartas persistentes." },
  { id: "squires_disciples", name: "Escudeiros & Discípulos", note: "O baralho da expansão Marauder." },
];

export const LANDMARKS: Landmark[] = [
  {
    id: "ferry",
    name: "Balsa (Ferry)",
    nativeMap: "lake",
    setupText: "Coloque a balsa em uma clareira à margem do rio, conforme a carta do landmark.",
  },
  {
    id: "tower",
    name: "Torre (Tower)",
    nativeMap: "mountain",
    setupText: "Coloque a torre em uma clareira com ruína, conforme a carta do landmark.",
  },
  {
    id: "lost_city",
    name: "Cidade Perdida (Lost City)",
    setupText: "Monte conforme a carta do landmark.",
  },
  {
    id: "legendary_forge",
    name: "Forja Lendária (Legendary Forge)",
    setupText: "Monte conforme a carta do landmark — ela redistribui os itens craftáveis por naipe.",
  },
  {
    id: "black_market",
    name: "Mercado Negro (Black Market)",
    setupText: "Monte conforme a carta do landmark — ele separa cartas do baralho como estoque.",
  },
  {
    id: "elder_treetop",
    name: "Copa Anciã (Elder Treetop)",
    setupText: "Monte conforme a carta do landmark.",
  },
];

// TODO: conferir a lista completa e os nomes rebaixados contra a Lei de Root
export const HIRELINGS: Hireling[] = [
  { id: "forest_patrol", promotedName: "Forest Patrol", demotedName: "Feline Physicians", factionCode: "marquise" },
  { id: "last_dynasty", promotedName: "Last Dynasty", demotedName: "Bluebird Nobles", factionCode: "eyrie" },
  { id: "spring_uprising", promotedName: "Spring Uprising", demotedName: "Rabbit Scouts", factionCode: "alliance" },
  { id: "riverfolk_flotilla", promotedName: "Riverfolk Flotilla", demotedName: "Otter Divers", factionCode: "riverfolk" },
  { id: "warm_sun_prophets", promotedName: "Warm Sun Prophets", demotedName: "Lizard Envoys", factionCode: "cult" },
  { id: "the_exile", promotedName: "The Exile", demotedName: "The Brigand", factionCode: "vagabond" },
  { id: "sunward_expedition", promotedName: "Sunward Expedition", demotedName: "Mole Artisans", factionCode: "duchy" },
  { id: "corvid_spies", promotedName: "Corvid Spies", demotedName: "Raven Sentries", factionCode: "corvids" },
  { id: "vault_keepers", promotedName: "Vault Keepers", demotedName: "Badger Bodyguards", factionCode: "keepers" },
  { id: "flame_bearers", promotedName: "Flame Bearers", demotedName: "Rat Smugglers", factionCode: "hundreds" },
  { id: "popular_band", promotedName: "Popular Band", demotedName: "Street Band", factionCode: null },
  { id: "highway_bandits", promotedName: "Highway Bandits", demotedName: "Bandit Gangs", factionCode: null },
];

export const HIRELING_BY_ID = new Map(HIRELINGS.map((h) => [h.id, h]));

// Resumo mostrado após cada escolha no draft; os detalhes ficam na carta
// de setup avançado que acompanha cada facção na caixa
export const FACTION_SETUP_TEXT: Record<string, string> = {
  marquise:
    "Coloque a Fortaleza em qualquer clareira e monte a guarnição, serraria, oficina e recrutador conforme a carta de setup.",
  eyrie:
    "Escolha um líder, monte o Decreto e coloque o ninho com os guerreiros iniciais conforme a carta de setup.",
  alliance:
    "Separe os apoiadores iniciais e deixe as bases prontas conforme a carta de setup.",
  vagabond:
    "Escolha o personagem, coloque o peão em uma floresta e prepare itens iniciais e ruínas conforme a carta de setup.",
  riverfolk:
    "Coloque os guerreiros iniciais nas clareiras do rio e defina os preços dos serviços conforme a carta de setup.",
  cult:
    "Coloque o jardim e os guerreiros na clareira-natal e revele o Pária conforme a carta de setup.",
  duchy:
    "Coloque a Toca e os guerreiros na clareira-natal e prepare os ministros conforme a carta de setup.",
  corvids:
    "Coloque os guerreiros e as tramas iniciais conforme a carta de setup.",
  hundreds:
    "Coloque o Senhor da Guerra com a horda na clareira-natal, saqueie o item e escolha o humor conforme a carta de setup.",
  keepers:
    "Coloque os guerreiros nas duas clareiras-natais e esconda as relíquias nas florestas conforme a carta de setup.",
};

// A.6: quantos hirelings viram para o lado rebaixado, por número de jogadores
// (2 → 0, 3 → 1, 4 → 2, 5+ → 3)
export function demotedCount(players: number): number {
  return Math.min(Math.max(players - 2, 0), 3);
}

// A.6: facções que saem do draft por terem hireling correspondente em jogo
export function excludedFactionCodes(hirelingIds: string[]): Set<string> {
  const codes = new Set<string>();
  for (const id of hirelingIds) {
    const code = HIRELING_BY_ID.get(id)?.factionCode;
    if (code) codes.add(code);
  }
  return codes;
}
