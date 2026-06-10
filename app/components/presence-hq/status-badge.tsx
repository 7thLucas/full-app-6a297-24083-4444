import { cn } from "~/lib/utils";

interface StatusBadgeProps {
  status: "valid" | "flagged" | "pending" | "published" | "draft";
  className?: string;
}

const statusConfig = {
  valid: { label: "Valid", className: "bg-green-50 text-green-700 ring-1 ring-green-600/20" },
  flagged: { label: "Flagged", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20" },
  pending: { label: "Pending", className: "bg-slate-50 text-slate-600 ring-1 ring-slate-500/20" },
  published: { label: "Published", className: "bg-green-50 text-green-700 ring-1 ring-green-600/20" },
  draft: { label: "Draft", className: "bg-slate-50 text-slate-600 ring-1 ring-slate-500/20" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
