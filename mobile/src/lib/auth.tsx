import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, User } from "@agrointel/shared";
import { api, demoMode, tokenStore } from "./api";
import { demoUser } from "./demo";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  /** Explore the app on sample data, without a server. */
  startDemo: () => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    tokenStore
      .load()
      .then((t) => (t ? api<User>("/auth/me").then(setUser) : undefined))
      .catch(() => tokenStore.set(null))
      .finally(() => setLoading(false));
  }, []);

  const accept = async ({ token, user }: AuthResponse) => {
    await tokenStore.set(token);
    setUser(user);
  };

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => accept(await api<AuthResponse>("/auth/login", { method: "POST", json: { email, password } })),
    register: async (input) => accept(await api<AuthResponse>("/auth/register", { method: "POST", json: input })),
    logout: async () => {
      demoMode.set(false);
      await tokenStore.set(null);
      queryClient.clear();
      setUser(null);
    },
    startDemo: () => {
      queryClient.clear();
      demoMode.set(true);
      setUser(demoUser);
    },
    isDemo: demoMode.isOn(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
