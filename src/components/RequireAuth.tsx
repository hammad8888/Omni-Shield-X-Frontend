import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">
        Checking session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
