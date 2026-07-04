import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, AlertTriangle, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/users";

import { TypeBadge } from "@/components/TypeBadge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import {
  schedulesQueryOptions,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  paySchedule,
  scheduleSchema,
  type ScheduleInput,
  type Schedule,
} from "@/lib/schedules";
import { categoriesQueryOptions, type Category } from "@/lib/categories";
import { accountsQueryOptions, type Account } from "@/lib/accounts";
import { accountLabel } from "@/components/CategoryCombobox";
import { formatBRL } from "@/lib/mockDashboard";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};
const isPastDate = (iso: string) => !!iso && iso < todayISO();

export const Route = createFileRoute("/agendamentos")({
  head: () => ({ meta: [{ title: "Agendamentos — VPB" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(schedulesQueryOptions),
  component: SchedulesPage,
  errorComponent: ({ error }) => (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function ScheduleFormFields({
  form,
  accounts,
  categories,
  sessionUserId,
}: {
  form: ReturnType<typeof useForm<ScheduleInput>>;
  accounts: Account[];
  categories: Category[];
  sessionUserId: number | null;
}) {
  const dueDate = form.watch("due_date");
  const past = isPastDate(dueDate);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Conta</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar conta..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma conta cadastrada
                    </div>
                  )}
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <CategoryCombobox
                  categories={categories}
                  value={field.value}
                  onChange={field.onChange}
                  currentUserId={sessionUserId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {past && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Esta data de vencimento já passou. Cadastre uma{" "}
            <Link to="/transacoes" className="underline font-semibold">
              transação
            </Link>{" "}
            em vez de um agendamento.
          </div>
        </div>
      )}
    </div>
  );
}

function EditDialog({
  schedule,
  accounts,
  categories,
  sessionUserId,
}: {
  schedule: Schedule;
  accounts: Account[];
  categories: Category[];
  sessionUserId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      user_id: schedule.user_id,
      account_id: schedule.account_id,
      category_id: schedule.category_id,
      type: schedule.type,
      amount: Number(schedule.amount),
      due_date: schedule.due_date.slice(0, 10),
      description: schedule.description ?? "",
      status: schedule.status,
    },
  });

  const dueDate = form.watch("due_date");
  const past = isPastDate(dueDate);

  const m = useMutation({
    mutationFn: (v: ScheduleInput) => updateSchedule(schedule.id, v),
    onSuccess: () => {
      toast.success("Agendamento atualizado");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      router.invalidate();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar agendamento #{schedule.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => m.mutate(v))} className="space-y-4">
            <ScheduleFormFields
              form={form}
              accounts={accounts}
              categories={categories}
              sessionUserId={sessionUserId}
            />
            <Button type="submit" disabled={m.isPending || past}>
              {m.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SchedulesPage() {
  const { data: allSchedules } = useSuspenseQuery(schedulesQueryOptions);
  const { data: allCategories = [] } = useSuspenseQuery({
    ...categoriesQueryOptions,
    retry: false,
  });
  const { data: allAccounts = [] } = useSuspenseQuery({ ...accountsQueryOptions, retry: false });
  const qc = useQueryClient();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const session = mounted ? getSession() : null;
  const sessionUserId = session?.id ?? null;

  const accounts =
    sessionUserId != null ? allAccounts.filter((a) => a.user_id === sessionUserId) : [];
  const categories = allCategories.filter(
    (c) => c.user_id == null || (sessionUserId != null && c.user_id === sessionUserId),
  );
  const schedules = sessionUserId
    ? allSchedules.filter(
        (s) => s.user_id === sessionUserId && String(s.status).toLowerCase() !== "pago",
      )
    : [];

  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      user_id: session?.id ?? 1,
      account_id: 0,
      category_id: 0,
      type: "despesa",
      amount: 0,
      due_date: new Date().toISOString().slice(0, 10),
      description: "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (session?.id) form.setValue("user_id", session.id);
    if (!form.getValues("account_id") && accounts[0]?.id) {
      form.setValue("account_id", accounts[0].id);
    }
  }, [session?.id, accounts, form]);

  const dueDate = form.watch("due_date");
  const past = isPastDate(dueDate);

  const createM = useMutation({
    mutationFn: (v: ScheduleInput) => {
      const current = getSession();
      if (!current?.id) throw new Error("Faça login novamente");
      return createSchedule({ ...v, user_id: current.id, status: "pending" });
    },
    onSuccess: () => {
      toast.success("Agendamento criado");
      form.reset({ ...form.getValues(), amount: 0, description: "" });
      qc.invalidateQueries({ queryKey: ["schedules"] });
      router.invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      toast.success("Agendamento removido");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [payTarget, setPayTarget] = useState<Schedule | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const payM = useMutation({
    mutationFn: (input: { id: number; amount: number }) =>
      paySchedule(input.id, {
        amount: input.amount,
        payment_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      toast.success("Pagamento registrado");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      router.invalidate();
      setPayTarget(null);
      setPayAmount("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Receitas e despesas programadas.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-display uppercase tracking-wide">
              <Plus className="mr-1 h-4 w-4" /> Criar Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo agendamento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => createM.mutate(v))} className="space-y-4">
                <ScheduleFormFields
                  form={form}
                  accounts={accounts}
                  categories={categories}
                  sessionUserId={sessionUserId}
                />
                <Button
                  type="submit"
                  disabled={createM.isPending || past}
                  className="font-display uppercase tracking-wide"
                >
                  {createM.isPending ? "Criando..." : "Criar"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-3">
        {schedules.length === 0 && (
          <div className="rounded-2xl bg-card/70 p-8 text-center text-sm text-muted-foreground ring-1 ring-white/5">
            Nenhum agendamento cadastrado.
          </div>
        )}
        {schedules.map((s) => {
          const cat = allCategories.find((c) => c.id === s.category_id);
          return (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-2xl bg-card/70 p-4 ring-1 ring-white/5"
            >
              <div className="flex-1">
                <div className="font-display text-lg">
                  {s.description || `Agendamento #${s.id}`}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <TypeBadge type={s.type} />

                  {cat && <span>· {cat.name}</span>}
                  <span>
                    · Vence em{" "}
                    {mounted
                      ? new Date(s.due_date).toLocaleDateString("pt-BR")
                      : s.due_date.slice(0, 10)}
                  </span>
                </div>
              </div>
              <div
                className={`font-display text-xl ${
                  s.type === "receita" ? "text-[oklch(0.85_0.25_140)]" : "text-[oklch(0.7_0.25_25)]"
                }`}
              >
                R$ {formatBRL(s.amount)}
              </div>
              {String(s.status).toLowerCase() !== "pago" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPayTarget(s);
                    setPayAmount(String(s.amount ?? ""));
                  }}
                  className="border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                >
                  <Check className="mr-1 h-4 w-4" /> Pago
                </Button>
              )}

              <EditDialog
                schedule={s}
                accounts={accounts}
                categories={categories}
                sessionUserId={sessionUserId}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>O item #{s.id} será removido.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => delM.mutate(s.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!payTarget}
        onOpenChange={(o) => {
          if (!o) {
            setPayTarget(null);
            setPayAmount("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amount = Number(payAmount);
              if (!payTarget) return;
              if (!Number.isFinite(amount) || amount <= 0) {
                toast.error("Informe um valor válido");
                return;
              }
              payM.mutate({ id: payTarget.id, amount });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Valor pago (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={payM.isPending}
              className="w-full font-display uppercase tracking-wide"
            >
              {payM.isPending ? "Registrando..." : "Confirmar pagamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
