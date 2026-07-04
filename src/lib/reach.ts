// Sistema de Alcance (Reach) da Lei de Root: um guia para escolher mesas
// equilibradas. Facções somando o alcance recomendado dão uma partida
// equilibrada; recomenda-se ao menos uma facção militante. Não confundir com
// o Advanced Setup da expansão Marauder (draft de facções, sem Reach) —
// esse vive em src/lib/advanced-setup.ts.

export const FACTION_REACH: Record<string, number> = {
  marquise: 10,
  hundreds: 9,
  duchy: 8,
  keepers: 8,
  eyrie: 7,
  vagabond: 5,
  riverfolk: 5,
  alliance: 3,
  corvids: 3,
  cult: 2,
};

// O segundo Vagabundo vale menos que o primeiro
export const SECOND_VAGABOND_REACH = 2;

export const MILITANT_FACTIONS = new Set([
  "marquise",
  "eyrie",
  "duchy",
  "hundreds",
  "keepers",
]);

export const RECOMMENDED_REACH: Record<number, number> = {
  2: 17,
  3: 18,
  4: 21,
  5: 25,
  6: 28,
};
