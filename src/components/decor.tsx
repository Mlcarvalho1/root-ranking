// Elementos decorativos — folha, árvores, coroa e folhas caindo.
import type { CSSProperties } from "react";

export function Leaf({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      style={style}
      fill="currentColor"
    >
      <path d="M12 2C7.5 6.5 4.5 11 6.5 16.5c1.5 4 4 5 5 5.5.2-1.5.3-3 .1-4.6-.9-.5-1.9-1.4-2.6-2.9 1 .7 2 1.1 2.4 1.2C10.6 12 11 8 12 2z" />
      <path d="M12 2c1 6 1.4 10 .6 13.7.4-.1 1.4-.5 2.4-1.2-.7 1.5-1.7 2.4-2.6 2.9-.2 1.6-.1 3.1.1 4.6 1-.5 3.5-1.5 5-5.5C19.5 11 16.5 6.5 12 2z" />
    </svg>
  );
}

export function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M3 8.5l4.6 3.4L12 4.5l4.4 7.4L21 8.5l-1.5 9H4.5L3 8.5z" />
      <rect x="4.5" y="18.5" width="15" height="2.2" rx="1" />
    </svg>
  );
}

function Tree({ color, height }: { color: string; height: number }) {
  return (
    <svg
      viewBox="0 0 24 32"
      aria-hidden
      style={{ height, color }}
      className="w-auto"
      fill="currentColor"
    >
      <path d="M12 1C8 5 4 9.5 4 15c0 4.5 3.5 8 8 8s8-3.5 8-8c0-5.5-4-10-8-14z" />
      <rect x="10.6" y="21" width="2.8" height="10" rx="1.2" />
    </svg>
  );
}

// Fileira de árvores outonais que balançam, como a margem do mapa de outono
export function TreeLine() {
  const trees = [
    { color: "var(--color-moss)", height: 26 },
    { color: "var(--color-ember)", height: 34 },
    { color: "var(--color-mustard)", height: 22 },
    { color: "var(--color-moss)", height: 30 },
    { color: "var(--color-rust)", height: 24 },
    { color: "var(--color-ember)", height: 28 },
    { color: "var(--color-mustard)", height: 32 },
    { color: "var(--color-moss)", height: 24 },
  ];
  return (
    <div aria-hidden className="flex items-end justify-center gap-3 opacity-45">
      {trees.map((tree, i) => (
        <span
          key={i}
          className="tree-sway inline-flex"
          style={{ animationDelay: `${i * 0.7}s` }}
        >
          <Tree {...tree} />
        </span>
      ))}
    </div>
  );
}

const LEAVES = [
  { left: "6%", delay: 0, duration: 12, size: 18, color: "var(--color-ember)" },
  { left: "20%", delay: 4, duration: 15, size: 14, color: "var(--color-mustard)" },
  { left: "36%", delay: 8, duration: 13, size: 20, color: "var(--color-rust)" },
  { left: "52%", delay: 2, duration: 16, size: 15, color: "var(--color-moss)" },
  { left: "68%", delay: 6, duration: 12.5, size: 18, color: "var(--color-ember)" },
  { left: "82%", delay: 10, duration: 14, size: 15, color: "var(--color-mustard)" },
  { left: "93%", delay: 1, duration: 17, size: 13, color: "var(--color-rust)" },
];

// Folhas de outono caindo suavemente pela tela (CSS puro, respeita
// prefers-reduced-motion)
export function FallingLeaves() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {LEAVES.map((leaf, i) => (
        <Leaf
          key={i}
          className="leaf-fall absolute"
          style={{
            left: leaf.left,
            top: "-24px",
            width: leaf.size,
            height: leaf.size,
            color: leaf.color,
            animationDuration: `${leaf.duration}s`,
            animationDelay: `${leaf.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
