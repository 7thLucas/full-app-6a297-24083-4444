import { Outlet, useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { Sidebar } from "./sidebar";
import { useEffect } from "react";

export function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
