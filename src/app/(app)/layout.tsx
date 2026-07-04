import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { Leaf, TreeLine } from "@/components/decor";

const NAV_LINKS = [
  { href: "/rankings", label: "Rankings" },
  { href: "/matches", label: "Partidas" },
  { href: "/matches/new", label: "Nova partida" },
  { href: "/setup", label: "Montar partida" },
  { href: "/profile", label: "Perfil" },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      {/* trilha tracejada na borda, como os caminhos entre clareiras do tabuleiro */}
      <header className="border-b-2 border-dashed border-ink/40 bg-parchment-light/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <Link
            href="/rankings"
            className="flex items-center gap-1.5 font-display text-3xl font-bold text-root-red"
          >
            <Leaf className="size-6 text-moss" />
            Root Ranking
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 font-display text-lg font-bold">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ink-soft hover:text-root-red"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-ink-faint sm:inline">
              {session.displayName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="mt-8 space-y-2 pb-4 text-center text-xs text-ink-faint">
        <TreeLine />
        <p>Projeto de fãs — Root é © Leder Games</p>
      </footer>
    </>
  );
}
