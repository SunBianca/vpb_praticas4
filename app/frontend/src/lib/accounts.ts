import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiFetch } from "./api";

export const accountSchema = z.object({
  user_id: z.coerce.number().int().positive("ID do usuário obrigatório"),
  bank: z.string().min(1, "Banco obrigatório"),
  branch: z.string().min(1, "Agência obrigatória"),
  account_number: z.string().min(1, "Número obrigatório"),
  account_type: z.string().min(1, "Tipo obrigatório"),
  balance: z.coerce.number(),
});

export type AccountInput = z.infer<typeof accountSchema>;

export type Account = {
  id: number;
  user_id: number;
  bank: string;
  branch: string;
  account_number: string;
  account_type: string;
  balance: string;
  created_at: string;
  updated_at: string;
};

export const accountsQueryOptions = queryOptions({
  queryKey: ["accounts"],
  queryFn: () => apiFetch<Account[]>("/accounts"),
});

export type AccountDashboard = {
  total_balance: string;
  monthly_income: string;
  monthly_expenses: string;
};

export const accountDashboardQueryOptions = (accountId: number) =>
  queryOptions({
    queryKey: ["accounts", accountId, "dashboard"],
    queryFn: () => apiFetch<AccountDashboard>(`/accounts/${accountId}/dashboard`),
  });

export const createAccount = (data: AccountInput) =>
  apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify({ ...data, balance: String(data.balance) }),
  });

export const deleteAccount = (id: number) =>
  apiFetch<void>(`/accounts/${id}`, { method: "DELETE" });
