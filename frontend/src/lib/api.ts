import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "Unknown error");
    throw new Error(`API Error ${res.status}: ${errBody}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}

/**
 * Wrapper for form submissions: calls API, shows toast, refreshes data
 */
export async function submitForm<T>(
  path: string,
  body: unknown,
  opts: { successMsg?: string; onSuccess?: (data: T) => void; onError?: (err: Error) => void } = {}
): Promise<T | null> {
  try {
    const result = await apiPost<T>(path, body);
    toast.success(opts.successMsg || "Data berhasil disimpan!");
    opts.onSuccess?.(result);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    toast.error(msg);
    opts.onError?.(err instanceof Error ? err : new Error(msg));
    return null;
  }
}
