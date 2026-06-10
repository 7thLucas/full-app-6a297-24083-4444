import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { StatusBadge } from "~/components/presence-hq/status-badge";
import { Calendar, Clock, Search, Image } from "lucide-react";
import { cn } from "~/lib/utils";

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

export default function AttendancePage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  const fetchRecords = useCallback(async () => {
    if (user?.role !== "admin") { navigate("/my-attendance"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/presence-hq/attendance");
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch {}
    finally { setLoading(false); }
  }, [user, navigate]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter(
    (r) =>
      r.username.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search)
  );

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
          <Calendar size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Log</h1>
          <p className="text-sm text-slate-500">All employee check-in records</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Search size={16} className="shrink-0 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or date…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-In Time</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Photo</th>
                  <th className="px-3 py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {r.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{r.username}</p>
                          <p className="text-xs text-slate-500">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar size={13} className="text-slate-400" />
                        {r.date}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock size={13} className="text-slate-400" />
                        {formatTime(r.checkedInAt)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {r.photoUrl && r.photoUrl !== "#" ? (
                        <button
                          onClick={() => setSelectedPhoto(r.photoUrl)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors"
                          style={{ color: primaryColor }}
                        >
                          <Image size={14} />
                          <span className="text-xs">View</span>
                        </button>
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

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-h-[80vh] max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Check-in Photo</p>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <img
              src={selectedPhoto}
              alt="Employee check-in face photo"
              className="w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
