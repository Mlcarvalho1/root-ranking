import { type ComponentProps } from "react";

export function cx(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "animate-rise rounded-xl border-2 border-ink/50 bg-parchment-light shadow-card",
        className,
      )}
      {...props}
    />
  );
}

// Faixa escura com texto claro, como o cabeçalho das pranchetas de facção
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cx(
        "rounded-t-[10px] bg-ink px-4 py-2.5 font-display text-xl font-bold tracking-wide text-parchment-light",
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "outline" | "danger" }) {
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-5 py-2 font-display text-base font-bold tracking-wide transition-all active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-ember-dark bg-ember text-parchment-light hover:bg-ember-dark",
        variant === "outline" &&
          "border-ink/50 bg-transparent text-ink hover:bg-parchment-dark",
        variant === "danger" &&
          "border-rust bg-transparent text-rust hover:bg-rust hover:text-parchment-light",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "w-full rounded-lg border-2 border-ink/40 bg-parchment-light px-3 py-2 text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx(
        "w-full rounded-lg border-2 border-ink/40 bg-parchment-light px-3 py-2 text-ink focus:border-ember focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cx(
        "w-full rounded-lg border-2 border-ink/40 bg-parchment-light px-3 py-2 text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cx("mb-1 block text-sm font-semibold text-ink-soft", className)}
      {...props}
    />
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-sm font-semibold text-rust">{children}</p>;
}
