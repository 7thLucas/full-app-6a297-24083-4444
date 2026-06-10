import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { UserRole } from "~/modules/authentication/authentication.types";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  if (user.role === UserRole.Admin) return redirect("/dashboard");
  return redirect("/check-in");
}

export default function IndexPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth/login");
      else if (user.role === "admin") navigate("/dashboard");
      else navigate("/check-in");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}
