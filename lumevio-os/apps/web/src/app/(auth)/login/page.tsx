"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("admin@lumevio.pl");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/dashboard";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("lumevio_token");
    if (token) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const text = await response.text();

      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Niepoprawna odpowiedź serwera: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data?.message || "Nie udało się zalogować");
      }

      if (!data?.token || !data?.user) {
        throw new Error("Niepoprawna odpowiedź serwera");
      }

      saveSession(data.token, data.user);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd logowania");
      console.error("LOGIN ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>LUMEVIO OS</h1>
        <p style={styles.subtitle}>Zaloguj się do panelu administracyjnego</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            style={styles.input}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Hasło"
            type="password"
            autoComplete="current-password"
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>

          {error ? <p style={styles.error}>{error}</p> : null}
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#05051b",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 28,
  },
  title: {
    color: "#fff",
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
  },
  subtitle: {
    color: "#a4afdf",
    marginTop: 8,
    marginBottom: 20,
  },
  form: {
    display: "grid",
    gap: 14,
  },
  input: {
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  button: {
    height: 48,
    borderRadius: 14,
    border: "none",
    background: "#6d7cff",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  error: {
    margin: 0,
    color: "#ff8f8f",
  },
};