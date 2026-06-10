import { useEffect, useState, useCallback } from "react";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { StatusBadge } from "~/components/presence-hq/status-badge";
import { StatCard } from "~/components/presence-hq/stat-card";
import { ClipboardList, CheckCircle2, AlertTriangle, Calendar, TrendingUp } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  photoUrl: string | null;
  status: "valid" | "flagged" | "pending";
  checkedInAt: string | null;
}

export default function MyAttendancePage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");
  const slaThreshold = configLoading ? 80 : (config?.slaThreshold ?? 80);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/presence-hq/attendance/my");
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const validDays = records.filter((r) => r.status === "valid").length;
  const totalDays = records.length;
  const compliancePercent = totalDays > 0 ? Math.round((validDays / totalDays) * 100) : 0;
  const slaStatus: "valid" | "flagged" =
    compliancePercent >= slaThreshold ? "valid" : "flagged";

  function formatTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Attendance</h1>
          <p className="text-sm text-slate-500">Your personal attendance history and SLA status</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Days Present" value={validDays} icon={CheckCircle2} accent="green" />
        <StatCard label="Total Records" value={totalDays} icon={Calendar} accent="indigo" />
        <StatCard
          label="Compliance"
          value={`${compliancePercent}%`}
          icon={TrendingUp}
          accent={compliancePercent >= slaThreshold ? "green" : "amber"}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">SLA Status</p>
          <div className="mt-2">
            <StatusBadge
              status={loading ? "pending" : slaStatus}
              className="text-sm px-3 py-1"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Threshold: {slaThreshold}%</p>
        </div>
      </div>

      {/* Compliance bar */}
      {!loading && totalDays > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Overall Attendance Compliance</span>
            <span
              className={compliancePercent >= slaThreshold ? "text-green-700 font-semibold" : "text-amber-700 font-semibold"}
            >
              {compliancePercent}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${compliancePercent >= slaThreshold ? "bg-green-500" : "bg-amber-500"}`}
              style={{ width: `${compliancePercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
            <span>0%</span>
            <span className="text-slate-500">SLA target: {slaThreshold}%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Attendance History</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No attendance records yet</p>
            <p className="text-xs text-slate-400">Check in daily by uploading your face photo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-In Time</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Photo</th>
                  <th className="px-3 py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <Calendar size={13} className="text-slate-400" />
                        {r.date}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{formatTime(r.checkedInAt)}</td>
                    <td className="px-3 py-3">
                      {r.photoUrl && r.photoUrl !== "#" ? (
                        <img
                          src={r.photoUrl}
                          alt={`Check-in photo for ${r.date}`}
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      <StatusBadge status={r.status} />
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
