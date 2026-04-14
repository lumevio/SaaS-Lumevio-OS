'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export function useCrud<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await request<T[]>(`/${endpoint}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: unknown) {
    await request(`/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await load();
  }

  async function update(id: string, payload: unknown) {
    await request(`/${endpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await load();
  }

  async function remove(id: string) {
    await request(`/${endpoint}/${id}`, {
      method: 'DELETE',
    });
    await load();
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  return {
    data,
    loading,
    error,
    load,
    create,
    update,
    remove,
  };
}