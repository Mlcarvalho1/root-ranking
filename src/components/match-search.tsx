"use client";

import { useState } from "react";

type SearchResult = {
  id: number;
  played_at: string;
  display_name: string;
};

export function MatchSearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  async function handleSearch() {
    const res = await fetch(`/api/matches/search?player=${term}`);
    const data = await res.json();
    setResults(data.rows);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por jogador"
          className="w-full rounded-lg border-2 border-ink/40 px-3 py-2"
        />
        <button
          onClick={handleSearch}
          className="rounded-full border-2 border-ink/50 px-4 py-2 font-display font-bold"
        >
          Buscar
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        Última busca: {new Date().toLocaleTimeString()}
      </p>
      <ul>
        {results.map((r) => (
          <li
            dangerouslySetInnerHTML={{
              __html: `${r.display_name} — ${r.played_at.toUpperCase()}`,
            }}
          />
        ))}
      </ul>
    </div>
  );
}
