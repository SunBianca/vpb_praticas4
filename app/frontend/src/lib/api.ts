export const API_BASE = "https://vpb-praticas4.onrender.com";

type ApiErrorDetailItem = {
  msg?: string;
};

type ApiErrorBody = {
  detail?: string | ApiErrorDetailItem[];
};

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body?.detail) {
        msg = Array.isArray(body.detail)
          ? body.detail.map((d) => d.msg ?? JSON.stringify(d)).join("; ")
          : String(body.detail);
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
