import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function apiClient<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();

  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      const data = await response.json();
      errorMessage = data?.message || errorMessage;
    } catch {}

    throw new Error(errorMessage);
  }

  return response.json();
}