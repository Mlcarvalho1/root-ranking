// Dicas curtas sobre Root exibidas no topo do ranking. A dica muda uma vez
// por dia (mesmo índice para todo mundo, sem precisar de estado no banco).

const TIPS = [
  "A Marquesa de Gatos vence dominando o tabuleiro com madeira e edifícios — ela sofre no início se perder território rápido demais.",
  "A Aliança da Floresta ganha pontos revoltando-se: quanto mais simpatia acumulada, maior o placar de uma revolta bem-sucedida.",
  "O Vagabundo é a única facção que pode repetir na mesma partida — cada um joga com um caminho de relacionamentos independente.",
  "Vitória por coalizão só conta se os dois jogadores marcarem coalizão na súmula — coalizão não é combinação automática de quem chegou junto ao topo.",
  "O Império da Águia perde a coroa (e vira Turmoil) quando fica sem cartas de Decreto para cumprir — fique de olho na mão do jogador.",
  "As Vespas Ferais pontuam com Ameaças e Compulsões cumpridas — elas não controlam clareiras, então dominância é praticamente impossível.",
  "Ratos Ribeirinhos lucram com comércio: mercadorias trocadas por rota valem mais pontos quanto mais rara for a combinação de bens.",
  "O Culto Lagarto ganha adeptos e pode declarar uma facção como o Culto Rival — perder para o Rival vale pontos extras para o culto.",
];

export function getDailyTip(date: Date = new Date()): string {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return TIPS[dayIndex % TIPS.length];
}
