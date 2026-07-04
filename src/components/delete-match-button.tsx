"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function DeleteMatchButton({ matchId }: { matchId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  return (
    <Button
      variant="danger"
      disabled={deleting}
      onClick={async () => {
        if (!confirm("Apagar esta partida? O ranking será recalculado.")) return;
        setDeleting(true);
        const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
        if (res.ok) {
          router.push("/matches");
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error ?? "Falha ao apagar a partida");
          setDeleting(false);
        }
      }}
    >
      {deleting ? "Apagando..." : "Apagar"}
    </Button>
  );
}
