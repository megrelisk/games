"use client";

import { Clock, SlidersHorizontal, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_FILTERS,
  DURATION_FILTERS,
  PLAYER_FILTERS,
  SORT_OPTIONS,
  isDefaultFilters,
  type GameFilters,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

function toItems(opts: readonly { value: string; label: string }[]) {
  return Object.fromEntries(opts.map((o) => [o.value, o.label]));
}

const PLAYER_ITEMS = toItems(PLAYER_FILTERS);
const DURATION_ITEMS = toItems(DURATION_FILTERS);
const SORT_ITEMS = toItems(SORT_OPTIONS);

export function FilterBar({
  filters,
  onChange,
  resultCount,
  total,
  className,
}: {
  filters: GameFilters;
  onChange: (next: GameFilters) => void;
  resultCount: number;
  total: number;
  className?: string;
}) {
  const dirty = !isDefaultFilters(filters);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select
        value={filters.players}
        items={PLAYER_ITEMS}
        onValueChange={(v) => onChange({ ...filters, players: (v ?? "any") as GameFilters["players"] })}
      >
        <SelectTrigger
          size="sm"
          aria-label="მოთამაშეთა რაოდენობა"
          className={cn("rounded-full bg-card", filters.players !== "any" && "border-foreground/50")}
        >
          <Users className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLAYER_FILTERS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.duration}
        items={DURATION_ITEMS}
        onValueChange={(v) => onChange({ ...filters, duration: (v ?? "any") as GameFilters["duration"] })}
      >
        <SelectTrigger
          size="sm"
          aria-label="თამაშის ხანგრძლივობა"
          className={cn("rounded-full bg-card", filters.duration !== "any" && "border-foreground/50")}
        >
          <Clock className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DURATION_FILTERS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        items={SORT_ITEMS}
        onValueChange={(v) => onChange({ ...filters, sort: (v ?? "recent") as GameFilters["sort"] })}
      >
        <SelectTrigger size="sm" aria-label="დალაგება" className="rounded-full bg-card">
          <SlidersHorizontal className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {dirty ? (
            <>
              <span className="text-foreground">{resultCount}</span> / {total}
            </>
          ) : (
            <>{total} თამაში</>
          )}
        </span>
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            <X />
            გასუფთავება
          </Button>
        )}
      </div>
    </div>
  );
}
