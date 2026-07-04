import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/users";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  accountsQueryOptions,
  createAccount,
  deleteAccount,
  accountSchema,
  type AccountInput,
} from "@/lib/accounts";
import { formatBRL } from "@/lib/mockDashboard";

export const Route = createFileRoute("/contas")({
  head: () => ({ meta: [{ title: "Contas — VPB" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQueryOptions),
  component: AccountsPage,
  errorComponent: ({ error }) => (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function AccountsPage() {
  const { data: allAccounts } = useSuspenseQuery(accountsQueryOptions);
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const session = mounted ? getSession() : null;
  const accounts = session?.id ? allAccounts.filter((a) => a.user_id === session.id) : [];

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      user_id: session?.id ?? 1,
      bank: "",
      branch: "",
      account_number: "",
      account_type: "corrente",
      balance: 0,
    },
  });

  useEffect(() => {
    if (session?.id) form.setValue("user_id", session.id);
  }, [session?.id, form]);

  const createM = useMutation({
    mutationFn: (v: AccountInput) => {
      const current = getSession();
      if (!current?.id) throw new Error("Faça login novamente");
      return createAccount({ ...v, user_id: current.id });
    },
    onSuccess: () => {
      toast.success("Conta criada");
      form.reset({ ...form.getValues(), bank: "", branch: "", account_number: "", balance: 0 });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      router.invalidate();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Conta removida");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Contas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas bancárias.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-display uppercase tracking-wide">
              <Plus className="mr-1 h-4 w-4" /> Nova conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova conta bancária</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => createM.mutate(v))} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="bank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Banco do Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filial</FormLabel>
                        <FormControl>
                          <Input placeholder="0001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="12345-6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Conta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="corrente">Corrente</SelectItem>
                            <SelectItem value="poupanca">Poupança</SelectItem>
                            <SelectItem value="salario">Salário</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Saldo da Conta (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createM.isPending}
                  className="font-display uppercase tracking-wide"
                >
                  {createM.isPending ? "Criando..." : "Criar"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.length === 0 && (
          <div className="col-span-full rounded-2xl bg-card/70 p-8 text-center text-sm text-muted-foreground ring-1 ring-white/5">
            Nenhuma conta cadastrada.
          </div>
        )}
        {accounts.map((a) => (
          <div key={a.id} className="rounded-2xl bg-card/70 p-5 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#a3ff3d] shadow-[0_0_8px_#a3ff3d]" />
                <h3 className="font-display text-xl">{a.bank}</h3>
              </div>
              <button
                disabled
                className="rounded-full bg-accent/30 px-3 py-1 text-xs text-accent opacity-60"
                title="Edição via API indisponível"
              >
                <Pencil className="mr-1 inline h-3 w-3" /> Editar conta
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Info label="Tipo" value={a.account_type} />
              <Info label="Filial" value={a.branch} />
              <Info label="Nº conta" value={a.account_number} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Saldo</div>
                <div
                  className={`font-display text-2xl ${Number(a.balance) < 0 ? "text-destructive" : "text-[oklch(0.85_0.25_140)]"}`}
                >
                  R$ {formatBRL(a.balance)}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Conta {a.bank} {a.account_number} será removida.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => delM.mutate(a.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
