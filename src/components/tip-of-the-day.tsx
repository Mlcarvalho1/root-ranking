import { getDailyTip } from "@/lib/tips";

export function TipOfTheDay() {
  return (
    <p className="rounded-lg border-2 border-dashed border-ink/30 bg-parchment px-4 py-2 text-sm text-ink-soft">
      <span className="font-semibold text-ink">Dica do dia:</span>{" "}
      {getDailyTip()}
    </p>
  );
}
