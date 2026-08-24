import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "positive" | "warning";

/**
 * One tile in the Quick Stats row: a small labelled icon, the figure itself,
 * and an optional footnote chip. The chip carries a tone rather than a raw
 * colour so the row reads consistently and stays legible in dark mode.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note?: string;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {note && (
        <span
          className={cn(
            "mt-2 inline-block rounded-full px-2 py-0.5 text-[0.68rem] font-medium",
            tone === "positive" &&
              "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
            tone === "warning" &&
              "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
            tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          {note}
        </span>
      )}
    </div>
  );
}
