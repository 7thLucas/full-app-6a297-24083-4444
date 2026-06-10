import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import { Building2 } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  if (getUserFromRequest(request)) return redirect("/");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  try {
    await AuthService.forgotPassword(String(formData.get("email") ?? ""));
  } catch {}
  return { success: true, message: "If that email exists, a reset link has been sent. Check your inbox." };
}

interface ActionData {
  success?: boolean;
  message?: string;
}

export default function ForgotPasswordRoute() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { config, loading } = useConfigurables();

  const appName = loading ? "PresenceHQ" : (config?.appName ?? "PresenceHQ");
  const primaryColor = loading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{appName}</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Forgot password</h2>
          <p className="mb-6 text-sm text-slate-500">Enter your email to receive a reset link</p>

          {actionData?.success ? (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {actionData.message}
            </div>
          ) : (
            <Form method="post" className="space-y-4">
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </Form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link to="/auth/login" className="text-indigo-600 hover:text-indigo-700">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
