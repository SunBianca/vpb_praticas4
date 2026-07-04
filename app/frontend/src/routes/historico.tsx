import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { transactionsQueryOptions } from "@/lib/transactions";
import { accountsQueryOptions } from "@/lib/accounts";
import { getSession } from "@/lib/users";
import { TransactionRow } from "./index";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico — VPB" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(transactionsQueryOptions),
      context.queryClient.ensureQueryData(accountsQueryOptions),
    ]),
  component: HistoricoPage,
  errorComponent: ({ error }) => (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function HistoricoPage() {
  const { data: transactions } = useSuspenseQuery(transactionsQueryOptions);
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const sessionId = mounted ? (getSession()?.id ?? null) : null;

  const sorted = useMemo(() => {
    const ids = new Set(
      accounts.filter((a) => sessionId != null && a.user_id === sessionId).map((a) => a.id),
    );
    return [...transactions]
      .filter((t) => ids.has(t.account_id))
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id));
  }, [transactions, accounts, sessionId]);

  return (
    <div className="space-y-6">
      <h1 className="text-center font-display text-3xl sm:text-4xl">Histórico de movimentações</h1>
      <div className="space-y-3 rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada.
          </div>
        ) : (
          sorted.map((t) => <TransactionRow key={t.id} t={t} accounts={accounts} />)
        )}
      </div>
    </div>
  );
}
