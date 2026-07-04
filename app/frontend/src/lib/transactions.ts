import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiFetch } from "./api";

export const transactionSchema = z.object({
  account_id: z.coerce.number().int().positive("Conta obrigatória"),
  category_id: z.coerce.number().int().positive("Categoria obrigatória"),
  schedule_id: z.coerce.number().int().positive().optional().nullable(),
  type: z.string().min(1),
  amount: z.coerce.number(),
  date: z.string().min(1, "Data obrigatória"),
  description: z.string().optional().nullable(),
  status: z.string().min(1),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export type Transaction = {
  id: number;
  account_id: number;
  category_id: number;
  schedule_id: number | null;
  type: string;
  amount: string;
  date: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export const transactionsQueryOptions = queryOptions({
  queryKey: ["transactions"],
  queryFn: () => apiFetch<Transaction[]>("/transactions"),
});

export const transactionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["transactions", id],
    queryFn: () => apiFetch<Transaction>(`/transactions/${id}`),
  });

const serialize = (data: Partial<TransactionInput>) => ({
  ...data,
  amount: data.amount !== undefined ? String(data.amount) : undefined,
  schedule_id:
    data.schedule_id === undefined || data.schedule_id === null ? null : Number(data.schedule_id),
});

export const createTransaction = (data: TransactionInput) =>
  apiFetch<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(serialize(data)),
  });

export const updateTransaction = (id: number, data: Partial<TransactionInput>) =>
  apiFetch<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(serialize(data)),
  });

export const deleteTransaction = (id: number) =>
  apiFetch<void>(`/transactions/${id}`, { method: "DELETE" });
