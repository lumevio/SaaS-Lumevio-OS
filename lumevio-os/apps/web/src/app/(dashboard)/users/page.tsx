"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type UserItem = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  organizationRoles?: Array<{
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    role: {
      key: string;
      name: string;
    };
  }>;
};

export default function UsersPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve([]);

      const usersPromise = isPlatformAdmin
        ? apiClient<UserItem[]>("/users")
        : Promise.resolve([]);

      const [orgs, usersData] = await Promise.all([orgsPromise, usersPromise]);

      setOrganizations(orgs);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [isPlatformAdmin]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim() || !organizationId) {
      setError("Uzupełnij email, hasło i organizację");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiClient("/users", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          organizationId,
        }),
      });

      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setOrganizationId("");

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć użytkownika");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Użytkownicy</h1>
        <p style={styles.subtitle}>
          Zarządzanie kontami dostępu do organizacji.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj użytkownika</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Imię"
                style={styles.input}
              />

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nazwisko"
                style={styles.input}
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={styles.input}
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
                type="password"
                style={styles.input}
              />

              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                style={styles.input}
              >
                <option value="">Wybierz organizację</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz użytkownika"}
              </button>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dostęp użytkowników</h2>
          <p style={styles.muted}>
            Tylko superadmin może tworzyć i zarządzać użytkownikami.
          </p>
        </section>
      )}

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Lista użytkowników</h2>
            <button onClick={() => void loadPage()} style={styles.secondaryButton}>
              Odśwież
            </button>
          </div>

          {loading ? (
            <p style={styles.muted}>Ładowanie...</p>
          ) : users.length === 0 ? (
            <p style={styles.muted}>Brak użytkowników.</p>
          ) : (
            <div style={styles.list}>
              {users.map((user) => (
                <article key={user.id} style={styles.userCard}>
                  <div style={styles.userTop}>
                    <div>
                      <h3 style={styles.userName}>
                        {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Bez nazwy"}
                      </h3>
                      <p style={styles.userEmail}>{user.email}</p>
                    </div>
                  </div>

                  <div style={styles.rolesWrap}>
                    {user.organizationRoles?.length ? (
                      user.organizationRoles.map((item, index) => (
                        <div key={`${user.id}-${index}`} style={styles.roleCard}>
                          <div style={styles.roleOrg}>{item.organization.name}</div>
                          <div style={styles.roleName}>{item.role.name}</div>
                        </div>
                      ))
                    ) : (
                      <p style={styles.muted}>Brak przypisanych organizacji.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    color: "#fff",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 8,
    color: "#9ea8d8",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
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
    height: 46,
    borderRadius: 14,
    border: "none",
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#6d7cff",
    color: "#fff",
  },
  secondaryButton: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },
  error: {
    margin: 0,
    color: "#ff8f8f",
  },
  muted: {
    color: "#9ea8d8",
  },
  list: {
    display: "grid",
    gap: 16,
  },
  userCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  userTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 14,
  },
  userName: {
    margin: 0,
    fontSize: 20,
  },
  userEmail: {
    margin: "6px 0 0 0",
    color: "#9ea8d8",
  },
  rolesWrap: {
    display: "grid",
    gap: 10,
  },
  roleCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
  },
  roleOrg: {
    fontWeight: 700,
    color: "#fff",
  },
  roleName: {
    marginTop: 6,
    color: "#9ea8d8",
    fontSize: 14,
  },
};