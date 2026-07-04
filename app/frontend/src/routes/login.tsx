import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { login, saveSession, loginSchema, type LoginInput } from "@/lib/users";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — VPB" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const m = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      saveSession(user);
      toast.success(`Bem-vindo, ${user.name}!`);
      router.navigate({ to: "/" });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Falha no login"),
  });

  return (
    <div className="min-h-screen w-full bg-diamond-frame flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-lavender bg-triangles-soft p-8 sm:p-12 shadow-2xl">
        <form onSubmit={form.handleSubmit((v) => m.mutate(v))} className="space-y-6">
          <h1 className="font-display text-5xl sm:text-6xl text-lavender-foreground text-center">
            Login
          </h1>
          <p className="text-center text-sm text-lavender-foreground/80">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-semibold text-white underline-offset-2 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>

          <Field
            label="E-mail"
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <Field
            label="Senha"
            type="password"
            placeholder="••••••"
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />

          <button
            type="submit"
            disabled={m.isPending}
            className="btn-chunky w-full mt-2 active:translate-y-[2px] disabled:opacity-60"
          >
            {m.isPending ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm">
            <Link
              to="/recuperar-senha"
              className="text-lavender-foreground/80 underline-offset-2 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Field = function Field({ label, error, ...props }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="label-chunky">{label}</span>
      <input {...props} className="input-chunky focus:input-chunky-focus" />
      {error && <span className="block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
};
