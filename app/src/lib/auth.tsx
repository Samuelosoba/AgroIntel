import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResponse, User } from "@agrointel/shared";
import { api, tokenStore } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setLoading(false));
  }, []);

  const accept = ({ token, user }: AuthResponse) => {
    tokenStore.set(token);
    setUser(user);
  };

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => accept(await api<AuthResponse>("/auth/login", { method: "POST", json: { email, password } })),
    register: async (input) => accept(await api<AuthResponse>("/auth/register", { method: "POST", json: input })),
    logout: () => {
      tokenStore.set(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
