import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AdminApiError, authApi, SESSION_EXPIRED_EVENT } from "./api";
import type { AdminUser } from "./types";
import { FullPageSpinner } from "./ui";

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const ME_KEY = ["admin", "me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof AdminApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const onExpired = () => qc.setQueryData(ME_KEY, null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await authApi.login(email, password);
      qc.setQueryData(ME_KEY, u);
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    qc.setQueryData(ME_KEY, null);
    // Drop all cached admin data except the (now empty) signed-in user.
    qc.removeQueries({ queryKey: ["admin"], predicate: (q) => q.queryKey[1] !== "me" });
  }, [qc]);

  const value = useMemo(() => ({ user: user ?? null, loading: isLoading, login, logout }), [user, isLoading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function RequireAuth({ children, role }: { children: ReactNode; role?: AdminUser["role"] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
