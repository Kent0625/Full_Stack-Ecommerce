"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, loginUser, registerUser } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = "archive_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    if (!savedToken) return;

    fetchCurrentUser(savedToken)
      .then((currentUser) => {
        setToken(savedToken);
        setUser(currentUser);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const response = await loginUser({ email, password });
        window.localStorage.setItem(TOKEN_KEY, response.access_token);
        setToken(response.access_token);
        setUser(response.user);
      },
      async register(payload) {
        const response = await registerUser(payload);
        window.localStorage.setItem(TOKEN_KEY, response.access_token);
        setToken(response.access_token);
        setUser(response.user);
      },
      logout() {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
