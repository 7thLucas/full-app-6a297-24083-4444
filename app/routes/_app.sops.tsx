import { useEffect, useState } from "react";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { StatusBadge } from "~/components/presence-hq/status-badge";
import { cn } from "~/lib/utils";
import { BookOpen, FileText, ExternalLink, FolderOpen, Search } from "lucide-react";

interface SopRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  filename: string;
  fileSize: number;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
}

export default function SopsPage() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfigurables();
  const [sops, setSops] = useState<SopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const primaryColor = configLoading ? "#4F46E5" : (config?.brandColor?.primary ?? "#4F46E5");

  useEffect(() => {
    fetch("/api/presence-hq/sops")
      .then((r) => r.json())
      .then((j) => { if (j.success) setSops(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(sops.map((s) => s.category).filter(Boolean)))];

  const filtered = sops.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function formatSize(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isAdmin ? "All Documents" : "Company SOPs & Rules"}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "All uploaded SOP documents"
              : "Published company policies and standard operating procedures"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm min-w-48">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>
        {categories.length > 1 && (
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedCategory === cat
                    ? "text-white border-transparent"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
                style={selectedCategory === cat ? { backgroundColor: primaryColor } : undefined}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <FolderOpen size={40} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            {sops.length === 0 ? "No SOPs have been published yet" : "No documents match your search"}
          </p>
          <p className="text-xs text-slate-400">
            {sops.length === 0 ? "HR will publish documents here when ready" : "Try a different search term"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sop) => (
            <div
              key={sop.id}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  <FileText size={18} />
                </div>
                <div className="flex items-center gap-1.5">
                  {isAdmin && <StatusBadge status={sop.status} />}
                  {sop.category && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {sop.category}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="mb-1 text-sm font-semibold text-slate-900 leading-snug">{sop.title}</h3>
              {sop.description && (
                <p className="mb-3 flex-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{sop.description}</p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-400">
                  <p>{sop.filename}</p>
                  {sop.publishedAt && (
                    <p>Published {new Date(sop.publishedAt).toLocaleDateString()}</p>
                  )}
                </div>
                {sop.fileUrl && sop.fileUrl !== "#" && (
                  <a
                    href={sop.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ExternalLink size={12} />
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
