import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiFetch } from "./api";

export const scheduleSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  account_id: z.coerce.number().int().positive("Selecione uma conta"),
  category_id: z.coerce.number().int().positive("Selecione uma categoria"),
  type: z.string().min(1),
  amount: z.coerce.number(),
  due_date: z.string().min(1, "Data obrigatória"),
  description: z.string().optional().nullable(),
  status: z.string().min(1),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export type Schedule = {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number;
  type: string;
  amount: string;
  due_date: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export const schedulesQueryOptions = queryOptions({
  queryKey: ["schedules"],
  queryFn: () => apiFetch<Schedule[]>("/schedules"),
});

export const scheduleQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["schedules", id],
    queryFn: () => apiFetch<Schedule>(`/schedules/${id}`),
  });

export const createSchedule = (data: ScheduleInput) =>
  apiFetch<Schedule>("/schedules", {
    method: "POST",
    body: JSON.stringify({ ...data, amount: String(data.amount) }),
  });

export const updateSchedule = (id: number, data: Partial<ScheduleInput>) =>
  apiFetch<Schedule>(`/schedules/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...data,
      amount: data.amount !== undefined ? String(data.amount) : undefined,
    }),
  });

export const deleteSchedule = (id: number) =>
  apiFetch<void>(`/schedules/${id}`, { method: "DELETE" });

export const paySchedule = (scheduleId: number, data: { amount: number; payment_date: string }) =>
  apiFetch(`/schedules/${scheduleId}/payments`, {
    method: "POST",
    body: JSON.stringify({ amount: String(data.amount), payment_date: data.payment_date }),
  });
