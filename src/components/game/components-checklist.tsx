"use client";

import { ListChecks, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ComponentsChecklist({ game, onEdit }: { game: Game; onEdit: () => void }) {
  const [checked, setChecked] = useLocalStorage<string[]>(`gn:checklist:${game.id}`, []);
  const items = game.components;
  const required = items.filter((c) => !c.optional);
  const done = required.filter((c) => checked.includes(c.id)).length;
  const pct = required.length ? Math.round((done / required.length) * 100) : 0;
  const allSet = required.length > 0 && done === required.length;

  const toggle = (id: string, on: boolean) =>
    setChecked((prev) => (on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));

  return (
    <section className="animate-rise stagger-3 rounded-3xl bg-card p-5 ring-1 ring-border sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">რა გვჭირდება</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length ? (
              allSet ? (
                <span className="text-felt">ყველაფერი მაგიდაზეა.</span>
              ) : (
                <>
                  შეგროვილია <span className="text-foreground tabular-nums">{done}</span> / {required.length}
                </>
              )
            ) : (
              "სია ჯერ ცარიელია."
            )}
          </p>
        </div>
        {checked.length > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="ჩეკლისტის განულება"
            onClick={() => setChecked([])}
            className="text-muted-foreground"
          >
            <RotateCcw />
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-felt transition-[width] duration-500 ease-out-expo"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {items.length ? (
        <ul className="mt-4 -mx-2">
          {items.map((c) => {
            const on = checked.includes(c.id);
            return (
              <li key={c.id}>
                <label
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60",
                  )}
                >
                  <Checkbox
                    checked={on}
                    onCheckedChange={(v) => toggle(c.id, Boolean(v))}
                    className="size-[18px] rounded-[6px] data-checked:border-felt data-checked:bg-felt"
                  />
                  <span
                    className={cn(
                      "flex-1 text-[15px] leading-snug transition-colors",
                      on && "text-muted-foreground line-through decoration-felt/60",
                    )}
                  >
                    {c.label}
                    {c.optional && (
                      <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 align-middle text-[10px] tracking-wide text-muted-foreground uppercase no-underline">
                        არასავალდებულო
                      </span>
                    )}
                  </span>
                  {c.qty && (
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">×{c.qty}</span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={onEdit}>
          <ListChecks data-icon="inline-start" />
          კომპონენტების დამატება
        </Button>
      )}
    </section>
  );
}
