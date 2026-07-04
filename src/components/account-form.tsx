"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorText, Input, Label } from "@/components/ui";

export function AccountForm({
  userId,
  displayName,
}: {
  userId: number;
  displayName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password"));
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(form.get("displayName")).trim(),
        ...(newPassword ? { password: newPassword } : {}),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao salvar");
    }
  }

  async function onDelete() {
    if (!confirm("Excluir sua conta? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/register");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao excluir a conta");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Nome exibido</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          maxLength={64}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Nova senha (deixe em branco para manter)</Label>
        <Input id="password" name="password" type="password" minLength={6} />
      </div>
      <ErrorText>{error}</ErrorText>
      {saved && <p className="text-sm font-semibold text-moss">Salvo!</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="danger" onClick={onDelete}>
          Excluir conta
        </Button>
      </div>
    </form>
  );
}
