import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest, signJwt, buildAuthCookie } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { UserRole } from "~/modules/authentication/authentication.types";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import { Building2 } from "lucide-react";
import { useRef } from "react";

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

const DEMO_ACCOUNTS = {
  admin: { email: "admin@example.com", password: "ChangeMe123!" },
  employee: { email: "alice@example.com", password: "Employee123!" },
} as const;

export default function LoginRoute() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { config, loading } = useConfigurables();
  const formRef = useRef<HTMLFormElement>(null);

  const appName = loading ? "PresenceHQ" : (config?.appName ?? "PresenceHQ");
  const tagline = loading ? "Attendance & SOP Management" : (config?.tagline ?? "Attendance & SOP Management");
  const primaryColor = loading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  function loginAsDemo(account: keyof typeof DEMO_ACCOUNTS) {
    const form = formRef.current;
    if (!form) return;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const passwordInput = form.elements.namedItem("password") as HTMLInputElement;
    emailInput.value = DEMO_ACCOUNTS[account].email;
    passwordInput.value = DEMO_ACCOUNTS[account].password;
    // Use a small timeout so React sees the DOM values before submission
    setTimeout(() => form.requestSubmit(), 0);
  }

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

          <Form ref={formRef} method="post" className="space-y-4">
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

          {/* Demo account separator */}
          <div className="mt-6 flex items-center gap-3">
            <hr className="flex-1 border-slate-200" />
            <span className="text-xs text-slate-400 whitespace-nowrap">or try a demo account</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          {/* Demo login buttons */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => loginAsDemo("admin")}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              Login as HR Admin
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo("employee")}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              Login as Employee
            </button>
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
