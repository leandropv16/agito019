const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type NextInit = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

export async function publicGet<T>(path: string, init?: NextInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    next: {
      revalidate: init?.next?.revalidate ?? 60,
      tags: init?.next?.tags ?? ["public"],
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new ApiError(response.status, body.code ?? "HTTP_ERROR", body.message ?? "Erro ao carregar");
  }
  return response.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new ApiError(response.status, body.code ?? "HTTP_ERROR", body.message ?? "Erro na requisição");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export { API_URL };
