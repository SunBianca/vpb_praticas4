import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { createUser, login, saveSession, userSchema, type UserInput } from "@/lib/users";
import { Field } from "./login";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — VPB" }] }),
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const form = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const m = useMutation({
    mutationFn: async (v: UserInput) => {
      await createUser(v);
      return login({ email: v.email, password: v.password });
    },
    onSuccess: (user) => {
      saveSession(user);
      toast.success("Conta criada!");
      router.navigate({ to: "/" });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen w-full bg-diamond-frame flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-lavender bg-triangles-soft p-8 sm:p-12 shadow-2xl">
        <form onSubmit={form.handleSubmit((v) => m.mutate(v))} className="space-y-5">
          <h1 className="font-display text-4xl sm:text-5xl text-lavender-foreground text-center">
            Crie sua nova conta
          </h1>
          <p className="text-center text-sm text-lavender-foreground/80">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-white underline-offset-2 hover:underline"
            >
              Entrar
            </Link>
          </p>

          <Field
            label="Nome"
            placeholder="Seu nome"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <Field
            label="E-mail"
            type="email"
            placeholder="voce@exemplo.com"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <Field
            label="Senha"
            type="password"
            placeholder="mínimo 4 caracteres"
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />

          <button
            type="submit"
            disabled={m.isPending}
            className="btn-chunky w-full mt-2 active:translate-y-[2px] disabled:opacity-60"
          >
            {m.isPending ? "Criando..." : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
