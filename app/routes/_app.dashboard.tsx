import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { StatCard } from "~/components/presence-hq/stat-card";
import { StatusBadge } from "~/components/presence-hq/status-badge";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface SlaRow {
  userId: string;
  username: string;
  email: string;
  totalWorkdays: number;
  validDays: number;
  compliancePercent: number;
  slaStatus: "valid" | "flagged";
}

type Period = "7d" | "30d" | "thisMonth";

function getPeriodDates(period: Period): { startDate: string; endDate: string } {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  if (period === "7d") {
    const start = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
    return { startDate: start, endDate: end };
  }
  if (period === "30d") {
    const start = new Date(today.getTime() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
    return { startDate: start, endDate: end };
  }
  // thisMonth
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  return { startDate: start, endDate: end };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SlaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [error, setError] = useState<string | null>(null);

  const slaThreshold = configLoading ? 80 : (config?.slaThreshold ?? 80);

  const fetchSla = useCallback(async () => {
    if (user?.role !== "admin") {
      navigate("/check-in");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getPeriodDates(period);
      const params = new URLSearchParams({ startDate, endDate, threshold: String(slaThreshold) });
      const res = await fetch(`/api/presence-hq/attendance/sla?${params}`);
      const json = await res.json();
      if (json.success) setRows(json.data);
      else setError(json.message ?? "Failed to load SLA data");
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [user, navigate, period, slaThreshold]);

  useEffect(() => { fetchSla(); }, [fetchSla]);

  const validCount = rows.filter((r) => r.slaStatus === "valid").length;
  const flaggedCount = rows.filter((r) => r.slaStatus === "flagged").length;
  const avgCompliance =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.compliancePercent, 0) / rows.length)
      : 0;

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SLA Compliance Dashboard</h1>
            <p className="text-sm text-slate-500">Monitor attendance compliance per employee</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden text-sm">
            {(["7d", "30d", "thisMonth"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 font-medium transition-colors",
                  period === p
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
                style={period === p ? { backgroundColor: primaryColor } : undefined}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "This Month"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchSla}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={rows.length}
          icon={Users}
          accent="indigo"
        />
        <StatCard
          label="Meeting SLA"
          value={validCount}
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          label="Flagged"
          value={flaggedCount}
          icon={AlertTriangle}
          accent="amber"
        />
        <StatCard
          label="Avg Compliance"
          value={`${avgCompliance}%`}
          icon={Calendar}
          accent={avgCompliance >= slaThreshold ? "green" : "amber"}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Employee Compliance — SLA Threshold: {slaThreshold}%
          </h2>
        </div>

        {error && (
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No attendance data for this period</p>
            <p className="text-xs text-slate-400">Employees haven't checked in yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Workdays
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Present
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Compliance
                  </th>
                  <th className="px-3 py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows
                  .sort((a, b) => b.compliancePercent - a.compliancePercent)
                  .map((row) => (
                    <tr key={row.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-6 pr-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {row.username.charAt(0).toUpperCase()}
                          </div>
                          {row.username}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{row.email}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{row.totalWorkdays}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{row.validDays}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.compliancePercent >= slaThreshold
                                  ? "bg-green-500"
                                  : "bg-amber-500"
                              )}
                              style={{ width: `${Math.min(row.compliancePercent, 100)}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "min-w-[3rem] text-right font-semibold",
                              row.compliancePercent >= slaThreshold
                                ? "text-green-700"
                                : "text-amber-700"
                            )}
                          >
                            {row.compliancePercent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pl-3 pr-6 text-right">
                        <StatusBadge status={row.slaStatus} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
