import { Link, useLocation, Form } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Camera,
  ClipboardList,
  BookOpen,
  LogOut,
  Building2,
} from "lucide-react";

const hrNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/attendance", label: "Attendance", icon: Calendar },
  { to: "/sop-management", label: "SOP Management", icon: FileText },
];

const employeeNavItems = [
  { to: "/check-in", label: "Check In", icon: Camera },
  { to: "/my-attendance", label: "My Attendance", icon: ClipboardList },
  { to: "/sops", label: "SOPs", icon: BookOpen },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { config, loading } = useConfigurables();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? hrNavItems : employeeNavItems;

  const primaryColor = loading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Brand header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Building2 size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {loading ? "PresenceHQ" : (config?.appName ?? "PresenceHQ")}
          </p>
          <p className="truncate text-xs text-slate-500">
            {loading ? "" : (config?.tagline ?? "HR Attendance")}
          </p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            isAdmin
              ? "bg-indigo-50 text-indigo-700"
              : "bg-emerald-50 text-emerald-700"
          )}
        >
          {isAdmin ? "HR Admin" : "Employee"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  style={
                    isActive
                      ? { backgroundColor: `${primaryColor}14`, color: primaryColor }
                      : undefined
                  }
                >
                  <Icon
                    size={16}
                    style={isActive ? { color: primaryColor } : undefined}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {user?.username?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.username ?? ""}</p>
            <p className="truncate text-xs text-slate-500">{user?.email ?? ""}</p>
          </div>
        </div>
        <Form method="post" action="/auth/logout">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </Form>
      </div>
    </aside>
  );
}
