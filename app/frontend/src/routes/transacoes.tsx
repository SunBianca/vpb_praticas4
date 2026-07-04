import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
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
import { CategoryCombobox, accountLabel } from "@/components/CategoryCombobox";
import {
  transactionsQueryOptions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  transactionSchema,
  type TransactionInput,
  type Transaction,
} from "@/lib/transactions";
import { accountsQueryOptions, type Account } from "@/lib/accounts";
import { categoriesQueryOptions, type Category } from "@/lib/categories";
import { formatBRL } from "@/lib/mockDashboard";
import { getSession } from "@/lib/users";

export const Route = createFileRoute("/transacoes")({
  head: () => ({ meta: [{ title: "Transações — VPB" }] }),
  component: TransactionsPage,
  errorComponent: ({ error }) => (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div>Nada encontrado.</div>,
});

function TransactionFormFields({
  form,
  accounts,
  categories,
  currentUserId,
}: {
  form: ReturnType<typeof useForm<TransactionInput>>;
  accounts: Account[];
  categories: Category[];
  currentUserId: number | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="account_id"
        render={({ field }) => (
          <FormItem>
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
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <FormControl>
              <CategoryCombobox
                categories={categories}
                value={field.value}
                onChange={field.onChange}
                currentUserId={currentUserId}
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
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="schedule_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ID do agendamento (opcional)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : Number(e.target.value))
                }
              />
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
  );
}

function EditDialog({
  tx,
  accounts,
  categories,
  currentUserId,
}: {
  tx: Transaction;
  accounts: Account[];
  categories: Category[];
  currentUserId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id: tx.account_id,
      category_id: tx.category_id,
      schedule_id: tx.schedule_id ?? null,
      type: tx.type,
      amount: Number(tx.amount),
      date: tx.date.slice(0, 10),
      description: tx.description ?? "",
      status: tx.status,
    },
  });

  const m = useMutation({
    mutationFn: (v: TransactionInput) => updateTransaction(tx.id, v),
    onSuccess: () => {
      toast.success("Transação atualizada");
      qc.invalidateQueries({ queryKey: ["transactions"] });
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
          <DialogTitle>Editar transação #{tx.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => m.mutate(v))} className="space-y-4">
            <TransactionFormFields
              form={form}
              accounts={accounts}
              categories={categories}
              currentUserId={currentUserId}
            />

            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionsPage() {
  const { data: allTransactions = [], error } = useSuspenseQuery({
    ...transactionsQueryOptions,
    retry: false,
  });
  const { data: allAccounts = [] } = useSuspenseQuery({ ...accountsQueryOptions, retry: false });
  const { data: allCategories = [] } = useSuspenseQuery({
    ...categoriesQueryOptions,
    retry: false,
  });
  const sessionId = getSession()?.id;
  const [dateMode, setDateMode] = useState<"month" | "day">("month");
  const [period, setPeriod] = useState<string>("all");
  const [search, setSearch] = useState("");
  const accounts = sessionId != null ? allAccounts.filter((a) => a.user_id === sessionId) : [];
  const userAccountIds = new Set(accounts.map((a) => a.id));
  const scopedTx = allTransactions.filter((t) => userAccountIds.has(t.account_id));
  const byPeriod =
    period === "all"
      ? scopedTx
      : scopedTx.filter((t) => {
          const d = t.date ?? "";
          return dateMode === "month" ? d.slice(0, 7) === period : d.slice(0, 10) === period;
        });
  const term = search.trim().toLowerCase();
  const transactions = term
    ? byPeriod.filter((t) => {
        const desc = (t.description ?? "").toLowerCase();
        const catName = (
          allCategories.find((c) => c.id === t.category_id)?.name ?? ""
        ).toLowerCase();
        return desc.includes(term) || catName.includes(term);
      })
    : byPeriod;
  const categories = allCategories.filter(
    (c) => c.user_id == null || (sessionId != null && c.user_id === sessionId),
  );
  const qc = useQueryClient();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id: accounts[0]?.id ?? 0,
      category_id: categories[0]?.id ?? 0,
      schedule_id: null,
      type: "despesa",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: "",
      status: "completed",
    },
  });

  useEffect(() => {
    if (!form.getValues("account_id") && accounts[0]?.id) {
      form.setValue("account_id", accounts[0].id);
    }
    if (!form.getValues("category_id") && categories[0]?.id) {
      form.setValue("category_id", categories[0].id);
    }
  }, [accounts, categories, form]);

  const createM = useMutation({
    mutationFn: (v: TransactionInput) => {
      const current = getSession();
      if (!current?.id) throw new Error("Faça login novamente");
      return createTransaction({ ...v, status: "completed" });
    },
    onSuccess: () => {
      toast.success("Transação criada");
      form.reset({ ...form.getValues(), amount: 0, description: "" });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      router.invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      toast.success("Transação removida");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Transações</h1>
          <p className="text-sm text-muted-foreground">Movimentações financeiras registradas.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-display uppercase tracking-wide">
              <Plus className="mr-1 h-4 w-4" /> Criar Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova transação</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => createM.mutate(v))} className="space-y-4">
                <TransactionFormFields
                  form={form}
                  accounts={accounts}
                  categories={categories}
                  currentUserId={sessionId ?? null}
                />
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

      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Buscar</label>
          <Input
            type="search"
            placeholder="Descrição ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Filtrar por
          </label>
          <Select
            value={dateMode}
            onValueChange={(v: "month" | "day") => {
              setDateMode(v);
              setPeriod(
                v === "month"
                  ? new Date().toISOString().slice(0, 7)
                  : new Date().toISOString().slice(0, 10),
              );
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="day">Dia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            {dateMode === "month" ? "Mês" : "Data"}
          </label>
          <Input
            type={dateMode === "month" ? "month" : "date"}
            value={period === "all" ? "" : period}
            onChange={(e) => setPeriod(e.target.value || "all")}
            className="w-44"
          />
        </div>
        <Button
          type="button"
          variant={period === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("all")}
        >
          Todos
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDateMode("month");
            setPeriod(new Date().toISOString().slice(0, 7));
          }}
        >
          Mês atual
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDateMode("day");
            setPeriod(new Date().toISOString().slice(0, 10));
          }}
        >
          Hoje
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {transactions.length} {transactions.length === 1 ? "transação" : "transações"}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-card/70 p-6 text-sm text-muted-foreground ring-1 ring-white/5">
          Não foi possível carregar a lista de transações: {String((error as Error).message)}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.length === 0 && (
            <div className="rounded-2xl bg-card/70 p-8 text-center text-sm text-muted-foreground ring-1 ring-white/5">
              Nenhuma transação cadastrada.
            </div>
          )}
          {transactions.map((t) => {
            const acc = accounts.find((a) => a.id === t.account_id);
            const cat = allCategories.find((c) => c.id === t.category_id);
            return (
              <div
                key={t.id}
                className="flex items-center gap-4 rounded-2xl bg-card/70 p-4 ring-1 ring-white/5"
              >
                <div className="flex-1">
                  <div className="font-display text-lg">
                    {t.description || `Transação #${t.id}`}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <TypeBadge type={t.type} />
                    <StatusBadge status={t.status} />
                    {cat && <Badge variant="outline">{cat.name}</Badge>}
                    {acc && <span>{accountLabel(acc)}</span>}
                    <span>
                      {mounted ? new Date(t.date).toLocaleDateString("pt-BR") : t.date.slice(0, 10)}
                    </span>
                  </div>
                </div>
                {(() => {
                  const pending =
                    String(t.status ?? "").toLowerCase() === "pendente" ||
                    String(t.status ?? "").toLowerCase() === "pending";
                  const hide = pending && t.type === "despesa";
                  return (
                    <div
                      className={`font-display text-xl ${
                        t.type === "receita"
                          ? "text-[oklch(0.85_0.25_140)]"
                          : "text-[oklch(0.7_0.25_25)]"
                      }`}
                    >
                      {hide ? "—" : `R$ ${formatBRL(t.amount)}`}
                    </div>
                  );
                })()}
                <EditDialog
                  tx={t}
                  accounts={accounts}
                  categories={categories}
                  currentUserId={sessionId ?? null}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                      <AlertDialogDescription>O item #{t.id} será removido.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => delM.mutate(t.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
