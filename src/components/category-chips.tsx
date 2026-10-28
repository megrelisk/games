"use client";

import { CATEGORIES, type CategorySlug } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryChips({
  value,
  onChange,
  counts,
  className,
}: {
  value: CategorySlug | "all";
  onChange: (next: CategorySlug | "all") => void;
  counts?: Partial<Record<CategorySlug | "all", number>>;
  className?: string;
}) {
  const items: { slug: CategorySlug | "all"; label: string }[] = [
    { slug: "all", label: "ყველა" },
    ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label })),
  ];

  return (
    <div
      role="tablist"
      aria-label="კატეგორიის მიხედვით გაფილტვრა"
      className={cn(
        "scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0",
        className,
      )}
    >
      {items.map(({ slug, label }) => {
        const active = value === slug;
        const n = counts?.[slug];
        return (
          <button
            key={slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(slug)}
            className={cn(
              "group inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-all duration-300 ease-out-expo select-none",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              active
                ? "border-foreground bg-foreground text-background shadow-sm"
                : "border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted/60",
            )}
          >
            <span>{label}</span>
            {typeof n === "number" && (
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  active ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
