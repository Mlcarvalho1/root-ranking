"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorText, Input, Label } from "@/components/ui";
import { FallingLeaves } from "@/components/decor";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(form.get("username")).trim().toLowerCase(),
        displayName: String(form.get("displayName")).trim(),
        password: form.get("password"),
      }),
    });
    if (res.ok) {
      router.push("/rankings");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao criar conta");
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
          className="h-32 w-full border-b-2 border-ink/40 object-cover"
        />
        <div className="p-6">
        <h1 className="mb-1 text-center text-4xl font-bold text-root-red">
          Criar conta
        </h1>
        <p className="mb-6 text-center text-ink-soft">
          Junte-se à disputa pela floresta
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              pattern="[a-zA-Z0-9_]{3,32}"
              title="Letras sem acento, de 3 a 32 caracteres (números e _ são opcionais)"
              required
            />
          </div>
          <div>
            <Label htmlFor="displayName">Nome exibido</Label>
            <Input id="displayName" name="displayName" maxLength={64} required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-ember-dark underline">
            Entrar
          </Link>
        </p>
        </div>
      </Card>
    </main>
  );
}
