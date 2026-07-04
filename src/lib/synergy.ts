// Camada NÃO-oficial por cima do Advanced Setup: o pool de facções continua
// seguindo as regras do apêndice A (1 militante garantida, pool = jogadores+1,
// carta travada), mas o sorteio favorece conjuntos com maior sinergia.

import { MILITANT_FACTIONS } from "@/lib/reach";
import { combinations, shuffle } from "@/lib/random";

// Scores curados de sinergia par-a-par (-2 a +3), baseados no conhecimento
// da comunidade — AJUSTÁVEIS. Pares ausentes valem 0 (neutro).
// Chave canônica: os dois codes em ordem alfabética unidos por ":".
export const SYNERGY_PAIRS: Record<string, number> = {
  "riverfolk:vagabond": 3, // as Lontras vendem cartas e serviços; o Vagabundo compra itens
  "eyrie:riverfolk": 2, // o Decreto tem fome de cartas — cliente ideal das Lontras
  "marquise:vagabond": 2, // a Marquise crafta muito e alimenta o mercado de itens
  "alliance:marquise": 2, // gato espalhado pelo mapa é o alvo clássico da simpatia
  "alliance:hundreds": 2, // a devastação da Horda faz a revolta prosperar
  "cult:hundreds": 2, // mesa agressiva enche as Almas Perdidas
  "duchy:eyrie": 1, // dois expansionistas disputando território
  "duchy:marquise": 1, // dois construtores brigando por clareiras
  "corvids:duchy": 1, // tabuleiro denso e previsível favorece as tramas
  "keepers:vagabond": 1, // relíquias e itens circulando pela mesa
  "cult:keepers": 1,
  "cult:eyrie": 1,
  "eyrie:vagabond": 1,
  "cult:riverfolk": -1, // duas facções lentas juntas esvaziam a pressão
  "alliance:corvids": -1, // dois insurgentes de baixo impacto militar
  "alliance:cult": -2, // par clássico de mesa parada
};

export function pairSynergy(a: string, b: string): number {
  const key = a < b ? `${a}:${b}` : `${b}:${a}`;
  return SYNERGY_PAIRS[key] ?? 0;
}

// Soma de sinergia sobre todos os pares do conjunto
export function poolSynergy(codes: string[]): number {
  let total = 0;
  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      total += pairSynergy(codes[i], codes[j]);
    }
  }
  return total;
}

export type PoolCard = { code: string; locked: boolean };

// Controla a variedade da amostragem softmax: menor = quase sempre o pool de
// maior sinergia; maior = quase uniforme
const TEMPERATURE = 2.5;

// Sorteia um pool de jogadores+1 facções com ao menos uma militante,
// ponderado pela sinergia total, e reconstitui a estrutura do A.8:
// a primeira carta é a militante garantida; se a última for insurgente,
// ela entra travada. Retorna null se não houver facções suficientes.
export function generatePool(opts: {
  available: string[];
  players: number;
  temperature?: number;
}): { pool: PoolCard[]; score: number } | null {
  const { available, players, temperature = TEMPERATURE } = opts;
  const size = players + 1;
  if (available.length < size) return null;

  const pools = combinations(available, size).filter((codes) =>
    codes.some((code) => MILITANT_FACTIONS.has(code)),
  );
  if (pools.length === 0) return null;

  const scores = pools.map(poolSynergy);
  const best = Math.max(...scores);
  const weights = scores.map((s) => Math.exp((s - best) / temperature));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let roll = Math.random() * totalWeight;
  let index = 0;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      index = i;
      break;
    }
  }

  const chosen = pools[index];
  const militants = chosen.filter((code) => MILITANT_FACTIONS.has(code));
  const guaranteed = militants[Math.floor(Math.random() * militants.length)];
  const dealt = shuffle(chosen.filter((code) => code !== guaranteed));
  const last = dealt[dealt.length - 1];
  const lockedCode = MILITANT_FACTIONS.has(last) ? null : last;

  return {
    pool: [guaranteed, ...dealt].map((code) => ({
      code,
      locked: code === lockedCode,
    })),
    score: scores[index],
  };
}
