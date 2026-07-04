# Root Ranking

Ranking de partidas de [Root](https://ledergames.com/products/root-a-game-of-woodland-might-and-right) entre amigos: registre a súmula de cada partida (pontuação, facção, vencedor) e acompanhe o ranking de jogadores (Elo + estatísticas) e de facções.

Projeto de fãs — Root é © Leder Games.

## Stack

- **Next.js 16** (App Router, full-stack) + TypeScript
- **PostgreSQL** + **Drizzle ORM**
- Auth com JWT (`jose`) em cookie httpOnly + `bcryptjs` — sem verificação de email, é um app para uso entre amigos
- Tailwind CSS 4 com tema inspirado na estética do jogo

## Desenvolvimento

```sh
docker compose -f docker-compose.dev.yml up -d   # Postgres local
cp .env.example .env                              # preencha DATABASE_URL e JWT_SECRET
pnpm install
pnpm db:migrate                                   # cria tabelas e seeda as facções
pnpm dev
```

O primeiro usuário registrado vira admin (pode editar/apagar qualquer partida).

Scripts úteis:

- `pnpm db:generate` — gera migration a partir de mudanças em `src/db/schema.ts`
- `pnpm db:migrate` — aplica migrations
- `pnpm db:studio` — UI do Drizzle para inspecionar o banco

## Regras do domínio (validação da súmula)

- 2 a 6 jogadores, sem jogador repetido
- Facção não se repete na partida, **exceto o Vagabundo**
- Pelo menos 1 vencedor; 2 vencedores apenas em **coalizão** (ambos marcados como coalizão)
- Tipos de vitória: pontos, dominância ou coalizão — vitórias não dependem só da pontuação

## Elo

Cada partida vira comparações par-a-par por colocação (vencedor na frente de todos; entre não-vencedores decide a pontuação), com K = 32 dividido pelo número de oponentes. O rating é **recalculado do zero a partir do histórico completo** sempre que uma partida é criada, editada ou apagada — a tabela `ratings` é só cache.

## Deploy no Dokploy

1. **Postgres**: crie um serviço de banco (Databases → PostgreSQL) e anote a URL interna de conexão.
2. **App**: crie uma Application apontando para este repositório, build type **Dockerfile**.
3. **Variáveis de ambiente**:
   - `DATABASE_URL` — URL interna do Postgres do passo 1
   - `JWT_SECRET` — gere com `openssl rand -hex 32`
4. Configure o domínio (porta do container: **3000**) com HTTPS.
5. Deploy. As migrations rodam automaticamente no start do container (`migrate.cjs`), incluindo o seed das facções.
