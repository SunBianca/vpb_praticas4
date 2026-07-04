import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { formatBRL } from "@/lib/mockDashboard";
import { accountsQueryOptions, accountDashboardQueryOptions, type Account } from "@/lib/accounts";
import { transactionsQueryOptions, type Transaction } from "@/lib/transactions";
import { schedulesQueryOptions, paySchedule, type Schedule } from "@/lib/schedules";
import { categoriesQueryOptions, type Category } from "@/lib/categories";
import { getSession } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { accountLabel } from "@/components/CategoryCombobox";
import { ReportsTab } from "@/components/ReportsTab";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — VPB" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQueryOptions),
  component: DashboardPage,
  errorComponent: ({ error }) => (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const toNum = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v ?? "0");
  return Number.isFinite(n) ? n : 0;
};

const isPending = (s: string | null | undefined) => {
  const k = String(s ?? "").toLowerCase();
  return k === "pendente" || k === "pending";
};

function DashboardPage() {
  const { data: allAccounts } = useSuspenseQuery(accountsQueryOptions);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const sessionId = mounted ? (getSession()?.id ?? null) : null;
  const accounts = useMemo(
    () => (sessionId ? allAccounts.filter((a) => a.user_id === sessionId) : []),
    [allAccounts, sessionId],
  );
  const userAccountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts]);

  const [selected, setSelected] = useState<string>("all");
  const isAll = selected === "all";
  const accountId = isAll ? undefined : Number(selected);
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );

  const dashboardQuery = useQuery({
    ...accountDashboardQueryOptions(accountId ?? 0),
    enabled: !isAll && !!accountId,
    retry: false,
  });

  const allDashboards = useQueries({
    queries: accounts.map((a) => ({
      ...accountDashboardQueryOptions(a.id),
      enabled: isAll,
      retry: false,
    })),
  });

  const aggregated = useMemo(() => {
    if (!isAll) return null;
    const data = allDashboards.map((q) => q.data).filter(Boolean);
    return {
      total_balance: data.reduce((s, d) => s + toNum(d!.total_balance), 0),
      monthly_income: data.reduce((s, d) => s + toNum(d!.monthly_income), 0),
      monthly_expenses: data.reduce((s, d) => s + toNum(d!.monthly_expenses), 0),
    };
  }, [isAll, allDashboards]);

  const aggregating = isAll && allDashboards.some((q) => q.isLoading);

  const dashValues = isAll
    ? aggregated && {
        total_balance: aggregated.total_balance,
        monthly_income: aggregated.monthly_income,
        monthly_expenses: aggregated.monthly_expenses,
      }
    : dashboardQuery.data && {
        total_balance: toNum(dashboardQuery.data.total_balance),
        monthly_income: toNum(dashboardQuery.data.monthly_income),
        monthly_expenses: toNum(dashboardQuery.data.monthly_expenses),
      };

  const dashLoading = isAll ? aggregating : dashboardQuery.isLoading;
  const dashError = !isAll && dashboardQuery.isError ? (dashboardQuery.error as Error) : null;

  const txQuery = useQuery({ ...transactionsQueryOptions, retry: false });
  const schedQuery = useQuery({ ...schedulesQueryOptions, retry: false });
  const catQuery = useQuery({ ...categoriesQueryOptions, retry: false });
  const qc = useQueryClient();
  const router = useRouter();

  const scopedTx = useMemo(() => {
    let list = (txQuery.data ?? []).filter((t) => userAccountIds.has(t.account_id));
    if (!isAll && accountId) list = list.filter((t) => t.account_id === accountId);
    return list;
  }, [txQuery.data, userAccountIds, isAll, accountId]);

  const scopedSched = useMemo(() => {
    let list = (schedQuery.data ?? []).filter((s) => sessionId != null && s.user_id === sessionId);
    if (!isAll && accountId) list = list.filter((s) => s.account_id === accountId);
    return list;
  }, [schedQuery.data, sessionId, isAll, accountId]);

  const pendingExpenses = useMemo(() => {
    const tx = scopedTx
      .filter((t) => isPending(t.status) && t.type === "despesa")
      .reduce((s, t) => s + toNum(t.amount), 0);
    const sc = scopedSched
      .filter((s) => isPending(s.status) && s.type === "despesa")
      .reduce((acc, s) => acc + toNum(s.amount), 0);
    return tx + sc;
  }, [scopedTx, scopedSched]);
  const pendingIncome = useMemo(() => {
    const tx = scopedTx
      .filter((t) => isPending(t.status) && t.type === "receita")
      .reduce((s, t) => s + toNum(t.amount), 0);
    const sc = scopedSched
      .filter((s) => isPending(s.status) && s.type === "receita")
      .reduce((acc, s) => acc + toNum(s.amount), 0);
    return tx + sc;
  }, [scopedTx, scopedSched]);

  const upcomingSchedules = useMemo(
    () =>
      [...scopedSched]
        .filter((s) => isPending(s.status))
        .sort((a, b) => (a.due_date > b.due_date ? 1 : a.due_date < b.due_date ? -1 : a.id - b.id))
        .slice(0, 3),
    [scopedSched],
  );

  const recent = useMemo(
    () =>
      [...scopedTx]
        .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id))
        .slice(0, 5),
    [scopedTx],
  );

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
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">
            {isAll ? "Dashboard" : `Dados ${selectedAccount?.bank ?? ""}`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aqui está sua visão geral financeira de hoje.
          </p>
        </div>

        {accounts.length > 0 ? (
          <div className="w-64">
            <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
              Conta
            </label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.bank} · {a.account_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Link to="/contas" className="text-sm text-accent hover:underline">
            Cadastre uma conta
          </Link>
        )}
      </header>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10">
          {dashError ? (
            <div className="rounded-2xl bg-card/70 p-6 text-sm text-muted-foreground ring-1 ring-white/5">
              Não foi possível carregar o dashboard desta conta: {dashError.message}
            </div>
          ) : (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="Saldo Total"
                value={dashValues?.total_balance ?? 0}
                tone={(dashValues?.total_balance ?? 0) < 0 ? "destructive" : "success"}
                loading={dashLoading}
              />
              <KpiCard
                label="Renda (este mês)"
                value={dashValues?.monthly_income ?? 0}
                tone="neutral"
                loading={dashLoading}
              />
              <KpiCard
                label="Despesas (este mês)"
                value={dashValues?.monthly_expenses ?? 0}
                tone="destructive"
                loading={dashLoading}
              />
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2">
            <KpiCard
              label="Valores a pagar"
              value={pendingExpenses}
              tone="warning"
              loading={txQuery.isLoading}
            />
            <KpiCard
              label="Valores a receber"
              value={pendingIncome}
              tone="warning"
              loading={txQuery.isLoading}
            />
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl">Próximos pagamentos</h2>
              <Link to="/agendamentos" className="text-sm text-accent hover:underline">
                Ver agendamentos
              </Link>
            </div>

            <div className="space-y-3 rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
              {schedQuery.isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">…</div>
              ) : upcomingSchedules.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhum agendamento pendente.
                </div>
              ) : (
                upcomingSchedules.map((s) => (
                  <ScheduleRow
                    key={s.id}
                    s={s}
                    categories={catQuery.data ?? []}
                    onPay={(sch) => {
                      setPayTarget(sch);
                      setPayAmount(String(sch.amount ?? ""));
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl">Movimentações recentes</h2>
              <Link to="/historico" className="text-sm text-accent hover:underline">
                Mostrar todos
              </Link>
            </div>

            <div className="space-y-3 rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
              {txQuery.isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">…</div>
              ) : txQuery.isError ? (
                <div className="p-4 text-sm text-destructive">
                  {(txQuery.error as Error).message}
                </div>
              ) : recent.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                recent.map((t) => <TransactionRow key={t.id} t={t} accounts={accounts} />)
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab
            transactions={scopedTx}
            accounts={accounts}
            categories={catQuery.data ?? []}
          />
        </TabsContent>
      </Tabs>

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

function KpiCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number;
  tone: "success" | "destructive" | "warning" | "neutral";
  loading?: boolean;
}) {
  const color =
    tone === "success"
      ? "text-[oklch(0.85_0.25_140)]"
      : tone === "destructive"
        ? "text-[oklch(0.7_0.25_25)]"
        : tone === "warning"
          ? "text-yellow-300"
          : "text-foreground";
  return (
    <div className="rounded-2xl bg-card/70 p-6 ring-1 ring-white/5 backdrop-blur">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-3 font-display text-3xl sm:text-4xl ${color}`}>
        {loading ? "…" : `R$ ${formatBRL(value)}`}
      </div>
    </div>
  );
}

export function TransactionRow({ t, accounts }: { t: Transaction; accounts: Account[] }) {
  const isIncome = t.type === "receita";
  const acc = accounts.find((a) => a.id === t.account_id);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card/80 px-4 py-3 ring-1 ring-white/5">
      <div className="flex-1 min-w-0">
        <div className="truncate font-display text-lg">{t.description || `Transação #${t.id}`}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <TypeBadge type={t.type} />
          <StatusBadge status={t.status} />
          {acc && <span>{accountLabel(acc)}</span>}
          <span>{new Date(t.date).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
      <div
        className={`font-display text-base ${
          isIncome ? "text-[oklch(0.85_0.25_140)]" : "text-[oklch(0.7_0.25_25)]"
        }`}
      >
        R$ {formatBRL(t.amount)}
      </div>
    </div>
  );
}

function ScheduleRow({
  s,
  categories,
  onPay,
}: {
  s: Schedule;
  categories: Category[];
  onPay: (s: Schedule) => void;
}) {
  const isIncome = s.type === "receita";
  const cat = categories.find((c) => c.id === s.category_id);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card/80 px-4 py-3 ring-1 ring-white/5">
      <div className="flex-1 min-w-0">
        <div className="truncate font-display text-lg">
          {s.description || `Agendamento #${s.id}`}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <TypeBadge type={s.type} />
          <StatusBadge status={s.status} />
          {cat && <span>{cat.name}</span>}
          <span>Vence em {new Date(s.due_date).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
      <div
        className={`font-display text-base ${
          isIncome ? "text-[oklch(0.85_0.25_140)]" : "text-[oklch(0.7_0.25_25)]"
        }`}
      >
        R$ {formatBRL(s.amount)}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPay(s)}
        className="border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
      >
        <Check className="mr-1 h-4 w-4" /> Pago
      </Button>
    </div>
  );
}
