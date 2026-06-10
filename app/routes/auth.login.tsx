import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest, signJwt, buildAuthCookie } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { UserRole } from "~/modules/authentication/authentication.types";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import { Building2 } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (user) {
    return redirect(user.role === UserRole.Admin ? "/dashboard" : "/check-in");
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  try {
    const user = await AuthService.login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    const token = signJwt({
      sub: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
      email_verified: user.email_verified,
    });
    return redirect("/", { headers: { "Set-Cookie": buildAuthCookie(token, new URL(request.url).hostname) } });
  } catch (error: any) {
    return { error: error.message ?? "Invalid credentials" };
  }
}

interface ActionData {
  error?: string;
}

export default function LoginRoute() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { config, loading } = useConfigurables();

  const appName = loading ? "PresenceHQ" : (config?.appName ?? "PresenceHQ");
  const tagline = loading ? "Attendance & SOP Management" : (config?.tagline ?? "Attendance & SOP Management");
  const primaryColor = loading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{appName}</h1>
          <p className="mt-1 text-sm text-slate-500">{tagline}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mb-6 text-sm text-slate-500">Enter your credentials to continue</p>

          <Form method="post" className="space-y-4">
            {actionData?.error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionData.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </Form>
        </div>

        {/* Demo info */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="mb-1.5 font-medium text-slate-700">Demo Credentials</p>
          <div className="space-y-1">
            <p><span className="font-medium text-slate-600">HR Admin:</span> admin@example.com / ChangeMe123!</p>
            <p><span className="font-medium text-slate-600">Employee:</span> alice@example.com / Employee123!</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          New employee?{" "}
          <Link to="/auth/register" className="text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
