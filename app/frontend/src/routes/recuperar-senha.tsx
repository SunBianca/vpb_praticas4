import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { updatePassword, type User } from "@/lib/users";
import { Field } from "./login";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — VPB" }] }),
  component: RecuperarSenhaPage,
});

function RecuperarSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");

  const lookup = useMutation({
    mutationFn: async (e: string) => {
      const users = await apiFetch<User[]>("/users");
      const found = users.find((u) => u.email.toLowerCase() === e.toLowerCase().trim());
      if (!found) throw new Error("E-mail não encontrado");
      return found;
    },
    onSuccess: (u) => setUser(u),
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não carregado");
      if (password.length < 4) throw new Error("Mínimo 4 caracteres");
      await updatePassword(user.id, password);
    },
    onSuccess: () => {
      toast.success("Senha atualizada");
      router.navigate({ to: "/login" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen w-full bg-diamond-frame flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-lavender bg-triangles-soft p-8 sm:p-12 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="text-sm text-lavender-foreground/80 underline-offset-2 hover:underline"
          >
            ← Voltar
          </Link>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-lavender-foreground text-center">
          Recuperar senha
        </h1>

        {!user ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup.mutate(email);
            }}
            className="space-y-5"
          >
            <Field
              label="E-mail"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={lookup.isPending}
              className="btn-chunky w-full mt-2 active:translate-y-[2px] disabled:opacity-60"
            >
              {lookup.isPending ? "Buscando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-5"
          >
            <Field label="Nome" value={user.name} disabled readOnly />
            <Field label="E-mail" value={user.email} disabled readOnly />
            <Field
              label="Nova senha"
              type="password"
              placeholder="mínimo 4 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              disabled={save.isPending}
              className="btn-chunky w-full mt-2 active:translate-y-[2px] disabled:opacity-60"
            >
              {save.isPending ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
