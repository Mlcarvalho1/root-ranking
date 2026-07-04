// Runner de migrations para produção — empacotado com esbuild no build do
// Docker e executado antes do server.js subir (ver Dockerfile).
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("Migrations aplicadas");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
