import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearSession, deleteUser, getSession, type LoginResponse } from "@/lib/users";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Sua Conta — VPB" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const router = useRouter();
  useEffect(() => {
    setUser(getSession());
  }, []);

  const m = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("Usuário deletado");
      clearSession();
      window.dispatchEvent(new Event("vpb:session"));
      router.navigate({ to: "/login" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const initial = (user?.name?.[0] ?? "U").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="font-display text-4xl">Sua Conta</h1>

      <div className="flex flex-col items-center gap-8">
        <div className="grid h-44 w-44 place-items-center rounded-full bg-white font-display text-6xl text-black shadow-2xl">
          {initial}
        </div>

        <div className="w-full rounded-2xl bg-card px-6 py-4 text-center font-display text-xl">
          Nome: <span className="text-white">{user?.name ?? "—"}</span>
        </div>

        {user?.email && <div className="text-sm text-muted-foreground">{user.email}</div>}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="font-display text-xl text-destructive underline underline-offset-4 hover:opacity-80">
              Deletar Usuário
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é permanente. Você será desconectado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => user && m.mutate(user.id)}
                disabled={!user || m.isPending}
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
