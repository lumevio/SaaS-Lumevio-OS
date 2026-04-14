import { getToken, clearSession } from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

type ApiClientOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiClient<T = any>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const token = options.skipAuth ? null : getToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Brak połączenia z API. Sprawdź czy backend działa na ${API_URL}`
    );
  }

  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sesja wygasła");
  }

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Błąd API: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data as T;
}