import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { accountLabel } from "@/components/CategoryCombobox";
import { formatBRL } from "@/lib/mockDashboard";
import type { Transaction } from "@/lib/transactions";
import type { Account } from "@/lib/accounts";
import type { Category } from "@/lib/categories";

const toNum = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
};

// Stable palette for categories
const PALETTE = [
  "#a855f7",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];

export function ReportsTab({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const [period, setPeriod] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const filtered = useMemo(
    () => transactions.filter((t) => (t.date ?? "").slice(0, 7) === period),
    [transactions, period],
  );

  // Build chart data: x = day, one series per "Categoria (tipo)"
  const { chartData, series } = useMemo(() => {
    const seriesMap = new Map<
      string,
      { key: string; categoryId: number; type: string; name: string }
    >();
    const dayBuckets = new Map<string, Record<string, number>>();

    for (const t of filtered) {
      const day = (t.date ?? "").slice(8, 10);
      if (!day) continue;
      const cat = categories.find((c) => c.id === t.category_id);
      const catName = cat?.name ?? `#${t.category_id}`;
      const key = `${t.category_id}__${t.type}`;
      if (!seriesMap.has(key)) {
        seriesMap.set(key, {
          key,
          categoryId: t.category_id,
          type: t.type,
          name: `${catName} (${t.type})`,
        });
      }
      if (!dayBuckets.has(day)) dayBuckets.set(day, {});
      const row = dayBuckets.get(day)!;
      row[key] = (row[key] ?? 0) + toNum(t.amount);
    }

    const days = Array.from(dayBuckets.keys()).sort();
    const data = days.map((d) => ({ day: d, ...dayBuckets.get(d)! }));
    return { chartData: data, series: Array.from(seriesMap.values()) };
  }, [filtered, categories]);

  const totals = useMemo(() => {
    let receita = 0,
      despesa = 0;
    for (const t of filtered) {
      if (t.type === "receita") receita += toNum(t.amount);
      else if (t.type === "despesa") despesa += toNum(t.amount);
    }
    return { receita, despesa };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Período</label>
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value || new Date().toISOString().slice(0, 7))}
            className="w-44"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPeriod(new Date().toISOString().slice(0, 7))}
        >
          Mês atual
        </Button>
        <div className="ml-auto flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Receitas: </span>
            <span className="font-display text-[oklch(0.85_0.25_140)]">
              R$ {formatBRL(totals.receita)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Despesas: </span>
            <span className="font-display text-[oklch(0.7_0.25_25)]">
              R$ {formatBRL(totals.despesa)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
        <h3 className="mb-4 font-display text-xl">Tendências por categoria</h3>
        {series.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Sem dados para o período.
          </div>
        ) : (
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,28,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `R$ ${formatBRL(v)}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.map((s, i) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={PALETTE[i % PALETTE.length]}
                    strokeWidth={2}
                    strokeDasharray={s.type === "despesa" ? "5 4" : undefined}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Linha contínua = receita · Linha tracejada = despesa
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-display text-xl">Transações do período</h3>
        <div className="space-y-3 rounded-2xl bg-card/60 p-4 ring-1 ring-white/5">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Nenhuma transação no período.</div>
          ) : (
            [...filtered]
              .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id))
              .map((t) => {
                const acc = accounts.find((a) => a.id === t.account_id);
                const cat = categories.find((c) => c.id === t.category_id);
                const isIncome = t.type === "receita";
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 rounded-xl bg-card/80 px-4 py-3 ring-1 ring-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-lg">
                        {t.description || `Transação #${t.id}`}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <TypeBadge type={t.type} />
                        <StatusBadge status={t.status} />
                        {cat && <span>{cat.name}</span>}
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
              })
          )}
        </div>
      </div>
    </div>
  );
}
