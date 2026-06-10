import { cn } from "~/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "indigo" | "green" | "amber" | "red" | "slate";
  className?: string;
}

const accentMap = {
  indigo: "bg-indigo-50 text-indigo-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-50 text-slate-600",
};

const valueColorMap = {
  indigo: "text-indigo-700",
  green: "text-green-700",
  amber: "text-amber-700",
  red: "text-red-700",
  slate: "text-slate-900",
};

export function StatCard({ label, value, icon: Icon, accent = "slate", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={cn("mt-1 text-2xl font-bold", valueColorMap[accent])}>{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2.5", accentMap[accent])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
