"use client";

import { useEffect, useState } from "react";
import { clearSession, getToken, getUser, type SessionUser } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const currentToken = getToken();
    const currentUser = getUser();

    setToken(currentToken);
    setUser(currentUser);
    setReady(true);
  }, []);

  function logout() {
    clearSession();
    setUser(null);
    setToken(null);
  }

  return {
    user,
    token,
    ready,
    isAuthenticated: !!token,
    isPlatformAdmin: !!user?.isPlatformAdmin,
    logout,
  };
}