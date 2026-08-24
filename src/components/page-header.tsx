import { ChevronRight } from "lucide-react";

/**
 * Breadcrumb, title and a slot for the page's actions. Actions sit beside the
 * title on wide screens and wrap under it on narrow ones, so a long title never
 * squeezes the buttons into two lines of text.
 */
export default function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: string[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" />}
                {crumb}
              </span>
            ))}
          </p>
        )}
        <h1 className="font-heading truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
