"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorText, Input, Label } from "@/components/ui";
import { FallingLeaves } from "@/components/decor";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(form.get("username")).trim().toLowerCase(),
        password: form.get("password"),
      }),
    });
    if (res.ok) {
      router.push("/rankings");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha no login");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <FallingLeaves />
      <Card className="relative w-full max-w-sm overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/cover.webp"
          alt="Arte da capa de Root"
          className="h-40 w-full border-b-2 border-ink/40 object-cover"
        />
        <div className="p-6">
        <h1 className="mb-1 text-center text-4xl font-bold text-root-red">
          Root Ranking
        </h1>
        <p className="mb-6 text-center text-ink-soft">
          A floresta aguarda seus resultados
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input id="username" name="username" autoComplete="username" required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          Ainda sem conta?{" "}
          <Link href="/register" className="font-semibold text-ember-dark underline">
            Criar conta
          </Link>
        </p>
        </div>
      </Card>
    </main>
  );
}
