---
name: root-ranking-review
description: Checklist de code review para o projeto Root Ranking. Usada pela GitHub Action de review automático (qwen2.5-coder:14b via runner self-hosted) e pode ser invocada manualmente para revisar um diff ou PR deste repositório.
---

# Review — Root Ranking

Revise apenas o que está no diff. Seja objetivo: liste só problemas reais, não elogie o código nem repita o óbvio. Se não houver nada relevante, diga isso em uma linha.

## O que verificar

**Regras de domínio da súmula** (`src/db/schema.ts` e validações de partida):
- 2 a 6 jogadores, sem jogador repetido na mesma partida
- Facção não se repete na partida, exceto o Vagabundo
- Pelo menos 1 vencedor; 2 vencedores só quando ambos estão marcados como coalizão
- Tipo de vitória (pontos, dominância, coalizão) é independente da pontuação — não assuma que maior pontuação implica vitória

**Elo/ranking** (`ratings` é cache, não fonte de verdade):
- Qualquer criação/edição/exclusão de partida deve disparar recálculo do Elo a partir do histórico completo, não um update incremental
- K = 32 dividido pelo número de oponentes — checar se mudanças na lógica de comparação por colocação preservam isso

**Next.js 16** — este projeto usa uma versão com breaking changes em relação ao Next.js "clássico". Antes de aprovar uso de uma API do Next (routing, data fetching, server actions, config), confirme que o código não está assumindo comportamento de versões antigas. Se o diff usar uma API do Next de forma que pareça desatualizada, sinalize para checar `node_modules/next/dist/docs/`.

**Banco de dados (Drizzle + Postgres)**:
- Mudança em `src/db/schema.ts` sem migration correspondente em `drizzle/`
- Queries que deveriam usar transação e não usam (ex.: operações que mexem em partida + ratings)
- SQL raw sem parametrização

**Auth**:
- Rotas/API que deveriam checar sessão (cookie JWT) ou papel de admin e não checam
- Uso de `bcryptjs` para senha — nunca comparar/gravar senha em texto puro
- Segredos (JWT_SECRET, DATABASE_URL) hardcoded ou logados

**Geral**:
- Validação de input com `zod` ausente em endpoint que recebe dados do usuário
- TypeScript: `any` desnecessário, tipos que escondem um bug
- Erros óbvios de lógica, off-by-one, condição invertida
- Complexidade desnecessária para o tamanho do problema (o projeto é pequeno e para uso entre amigos — não sugerir abstrações/infra que não fazem sentido nesse escopo)

## Formato de saída

Markdown curto, em português. Para cada problema: arquivo:linha (se souber), o que está errado, por que importa. Sem problemas → uma frase confirmando que o diff está ok.
