import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";
import { Camera, Upload, CheckCircle2, Clock, Loader2, RefreshCw, X } from "lucide-react";
import { StatusBadge } from "~/components/presence-hq/status-badge";

interface AttendanceRecord {
  id: string;
  date: string;
  photoUrl: string | null;
  status: "valid" | "flagged" | "pending";
  checkedInAt: string | null;
}

export default function CheckInPage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");
  const welcomeMessage = configLoading
    ? "Upload your face photo to check in for today."
    : (config?.welcomeMessage ?? "Upload your face photo to check in for today.");

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchTodayStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/presence-hq/attendance/today");
      const json = await res.json();
      if (json.success) setTodayRecord(json.data);
    } catch {}
    finally { setLoadingStatus(false); }
  }, []);

  useEffect(() => { fetchTodayStatus(); }, [fetchTodayStatus]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  }

  function clearFile() {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCheckIn() {
    if (!selectedFile) { setError("Please select a face photo first"); return; }
    setUploading(true);
    setError(null);
    try {
      // Upload the image
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await fetch("/api/uploader/image", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        setError(uploadJson.message ?? "Failed to upload photo");
        return;
      }
      const { url: photoUrl, originalname: photoFilename } = uploadJson.data;

      // Record the check-in
      const checkInRes = await fetch("/api/presence-hq/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl, photoFilename, date: today }),
      });
      const checkInJson = await checkInRes.json();
      if (!checkInJson.success) {
        setError(checkInJson.message ?? "Check-in failed");
        return;
      }
      setTodayRecord(checkInJson.data);
      setPreview(null);
      setSelectedFile(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const alreadyCheckedIn = todayRecord?.status === "valid";

  return (
    <div className="flex min-h-full flex-col items-center justify-start p-6 lg:p-8">
      {/* Header */}
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <Camera size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Check-In</h1>
          <p className="mt-1 text-sm text-slate-500">{todayFormatted}</p>
        </div>

        {/* Welcome message */}
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-700"
          style={{ borderColor: `${primaryColor}33`, backgroundColor: `${primaryColor}0d`, color: primaryColor }}
        >
          {welcomeMessage}
        </div>

        {/* Today's status card */}
        {loadingStatus ? (
          <div className="mb-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : alreadyCheckedIn ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-green-600" />
            <p className="text-base font-semibold text-green-800">You're checked in for today!</p>
            <p className="mt-1 text-sm text-green-600">
              {todayRecord?.checkedInAt
                ? `Checked in at ${new Date(todayRecord.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Attendance recorded"}
            </p>
            {todayRecord?.photoUrl && todayRecord.photoUrl !== "#" && (
              <div className="mt-4 flex justify-center">
                <img
                  src={todayRecord.photoUrl}
                  alt="Your check-in photo"
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              </div>
            )}
            <button
              onClick={fetchTodayStatus}
              className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-green-600 hover:text-green-700"
            >
              <RefreshCw size={12} /> Refresh status
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <Clock size={24} className="mx-auto mb-1 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">Not yet checked in today</p>
          </div>
        )}

        {/* Upload zone */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            {alreadyCheckedIn ? "Update Today's Check-In Photo" : "Upload Your Face Photo"}
          </h2>

          {/* Preview */}
          {preview ? (
            <div className="relative mb-4 flex justify-center">
              <img
                src={preview}
                alt="Face photo preview"
                className="h-48 w-48 rounded-full border-4 object-cover shadow-md"
                style={{ borderColor: primaryColor }}
              />
              <button
                onClick={clearFile}
                className="absolute right-10 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 shadow hover:bg-red-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
            >
              <Upload size={28} className="mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Click to select a photo</p>
              <p className="text-xs text-slate-400">JPG, PNG, WEBP — face clearly visible</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileSelect}
          />

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {preview ? "Change Photo" : "Select Photo"}
            </button>
            <button
              onClick={handleCheckIn}
              disabled={!selectedFile || uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Uploading…</>
              ) : (
                <><Camera size={14} /> Check In</>
              )}
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Today's status:</span>
          {loadingStatus ? (
            <span>Loading…</span>
          ) : (
            <StatusBadge status={todayRecord?.status ?? "pending"} />
          )}
        </div>
      </div>
    </div>
  );
}
