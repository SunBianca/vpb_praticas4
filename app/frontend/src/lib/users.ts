import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiFetch } from "./api";

export const userSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(4, "Mínimo 4 caracteres"),
});

export type UserInput = z.infer<typeof userSchema>;

export type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export const usersQueryOptions = queryOptions({
  queryKey: ["users"],
  queryFn: () => apiFetch<User[]>("/users"),
});

export const createUser = (data: UserInput) =>
  apiFetch<User>("/users", { method: "POST", body: JSON.stringify(data) });

export const deleteUser = (id: number) => apiFetch<void>(`/users/${id}`, { method: "DELETE" });

export const updatePassword = (id: number, password: string) =>
  apiFetch<void>(`/users/${id}/password?new_password=${encodeURIComponent(password)}`, {
    method: "PUT",
  });

export type LoginResponse = {
  id: number;
  name: string;
  email: string;
  message?: string;
};

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const login = (data: LoginInput) =>
  apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

const STORAGE_KEY = "vpb.session";

export function saveSession(user: LoginResponse) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("vpb:session"));
  }
}

export function getSession(): LoginResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}
