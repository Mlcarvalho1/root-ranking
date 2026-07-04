import Link from "next/link";
import { cx } from "@/components/ui";

const TABS = [
  { key: "reach", href: "/setup", label: "Alcance (Reach)" },
  { key: "draft", href: "/setup/draft", label: "Draft (Advanced Setup)" },
] as const;

export function SetupModeTabs({ active }: { active: "reach" | "draft" }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cx(
            "rounded-full border-2 px-4 py-1.5 font-display text-base font-bold tracking-wide transition-all",
            tab.key === active
              ? "border-ember-dark bg-ember text-parchment-light shadow-card"
              : "border-ink/30 text-ink-soft hover:border-ink/60 hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
