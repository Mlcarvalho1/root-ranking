type Standing = { isWinner: boolean; score: number };

export function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("pt-BR");
}

// Vencedores primeiro; depois por pontuação decrescente
export function sortByStanding<T extends Standing>(players: T[]): T[] {
  return [...players].sort(
    (a, b) => Number(b.isWinner) - Number(a.isWinner) || b.score - a.score,
  );
}
