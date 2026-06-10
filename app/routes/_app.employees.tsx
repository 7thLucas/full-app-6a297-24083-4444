import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { StatusBadge } from "~/components/presence-hq/status-badge";
import { StatCard } from "~/components/presence-hq/stat-card";
import { Users, UserCheck, UserX, Calendar } from "lucide-react";

interface AttendanceRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  date: string;
  photoUrl: string | null;
  status: "valid" | "flagged" | "pending";
  checkedInAt: string | null;
}

interface EmployeeSummary {
  userId: string;
  username: string;
  email: string;
  lastSeen: string | null;
  totalPresent: number;
  todayStatus: "valid" | "pending";
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/check-in"); return; }
    fetch("/api/presence-hq/attendance")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRecords(j.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  // Build per-employee summaries
  const employeeMap = new Map<string, EmployeeSummary>();
  for (const r of records) {
    if (!employeeMap.has(r.userId)) {
      employeeMap.set(r.userId, {
        userId: r.userId,
        username: r.username,
        email: r.email,
        lastSeen: null,
        totalPresent: 0,
        todayStatus: "pending",
      });
    }
    const entry = employeeMap.get(r.userId)!;
    if (r.status === "valid") {
      entry.totalPresent++;
      if (!entry.lastSeen || r.date > entry.lastSeen) entry.lastSeen = r.date;
      if (r.date === today) entry.todayStatus = "valid";
    }
  }
  const employees = Array.from(employeeMap.values()).sort((a, b) =>
    a.username.localeCompare(b.username)
  );

  const checkedInToday = employees.filter((e) => e.todayStatus === "valid").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500">Directory and today's attendance status</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Employees" value={employees.length} icon={Users} accent="indigo" />
        <StatCard label="Checked In Today" value={checkedInToday} icon={UserCheck} accent="green" />
        <StatCard
          label="Not Yet Checked In"
          value={employees.length - checkedInToday}
          icon={UserX}
          accent="amber"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">All Employees</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No employee attendance records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Days Present</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Seen</th>
                  <th className="px-3 py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {emp.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{emp.username}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{emp.email}</td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">{emp.totalPresent}</td>
                    <td className="px-3 py-3 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {emp.lastSeen ?? "—"}
                      </div>
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      <StatusBadge status={emp.todayStatus} />
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
