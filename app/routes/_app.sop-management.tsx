import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { StatusBadge } from "~/components/presence-hq/status-badge";
import { cn } from "~/lib/utils";
import {
  FileText,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X,
  Loader2,
  ExternalLink,
  FolderOpen,
} from "lucide-react";

interface SopRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  filename: string;
  fileSize: number;
  status: "draft" | "published";
  uploadedBy: string;
  publishedAt: string | null;
  createdAt: string;
}

export default function SopManagementPage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const navigate = useNavigate();
  const [sops, setSops] = useState<SopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/sops"); return; }
    fetchSops();
  }, [user, navigate]);

  async function fetchSops() {
    setLoading(true);
    try {
      const res = await fetch("/api/presence-hq/sops");
      const json = await res.json();
      if (json.success) setSops(json.data);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) {
      setFormError("Title and file are required");
      return;
    }
    setUploading(true);
    setFormError(null);
    try {
      // Step 1: Upload the file via the uploader module
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/uploader/document", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        setFormError(uploadJson.message ?? "File upload failed");
        return;
      }
      const { url: fileUrl, originalname: filename, mimeType, size: fileSize } = uploadJson.data;

      // Step 2: Create the SOP record
      const sopRes = await fetch("/api/presence-hq/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, fileUrl, filename, mimeType, fileSize }),
      });
      const sopJson = await sopRes.json();
      if (!sopJson.success) {
        setFormError(sopJson.message ?? "Failed to create SOP");
        return;
      }
      setSops((prev) => [sopJson.data, ...prev]);
      setShowForm(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setFile(null);
    } catch (e) {
      setFormError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function togglePublish(sop: SopRecord) {
    setActionLoading(sop.id);
    const endpoint = sop.status === "published"
      ? `/api/presence-hq/sops/${sop.id}/unpublish`
      : `/api/presence-hq/sops/${sop.id}/publish`;
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setSops((prev) => prev.map((s) => s.id === sop.id ? json.data : s));
      }
    } catch {}
    finally { setActionLoading(null); }
  }

  async function deleteSop(sopId: string) {
    if (!confirm("Delete this SOP permanently?")) return;
    setActionLoading(sopId);
    try {
      await fetch(`/api/presence-hq/sops/${sopId}`, { method: "DELETE" });
      setSops((prev) => prev.filter((s) => s.id !== sopId));
    } catch {}
    finally { setActionLoading(null); }
  }

  function formatSize(bytes: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SOP Management</h1>
            <p className="text-sm text-slate-500">Upload, organize, and publish SOPs to employees</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(null); }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={16} />
          Upload SOP
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upload New SOP</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Employee Code of Conduct"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. HR Policy, Operations"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of this document..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
            {/* File upload zone */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Document File *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
                  file
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <FileText size={24} className="mb-2 text-green-600" />
                    <p className="text-sm font-medium text-green-700">{file.name}</p>
                    <p className="text-xs text-green-600">{formatSize(file.size)}</p>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="mb-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600">Click to select a file</p>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX, TXT — up to 20 MB</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SOP List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">All Documents ({sops.length})</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : sops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No SOPs uploaded yet</p>
            <p className="text-xs text-slate-400">Click "Upload SOP" to add the first document</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sops.map((sop) => (
              <div key={sop.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{sop.title}</p>
                    {sop.category && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        {sop.category}
                      </span>
                    )}
                  </div>
                  {sop.description && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{sop.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {sop.filename} · {formatSize(sop.fileSize)} · Uploaded {new Date(sop.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={sop.status} />
                  {sop.fileUrl && sop.fileUrl !== "#" && (
                    <a
                      href={sop.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="View document"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => togglePublish(sop)}
                    disabled={actionLoading === sop.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40"
                    title={sop.status === "published" ? "Unpublish" : "Publish"}
                  >
                    {actionLoading === sop.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : sop.status === "published" ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteSop(sop.id)}
                    disabled={actionLoading === sop.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
