FROM node:24-alpine AS deps
RUN npm install -g pnpm@10.33.2
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
RUN npm install -g pnpm@10.33.2
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build && \
    pnpm exec esbuild src/db/migrate.ts --bundle --platform=node --format=cjs --outfile=migrate.cjs

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/migrate.cjs ./migrate.cjs
COPY --from=build /app/drizzle ./drizzle
EXPOSE 3000
# Aplica migrations pendentes e sobe o servidor
CMD ["sh", "-c", "node migrate.cjs && node server.js"]
