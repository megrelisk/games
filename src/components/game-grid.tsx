"use client";

import { Dices } from "lucide-react";

import { GameCard } from "@/components/game-card";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameGrid({
  games,
  onClear,
  className,
}: {
  games: Game[];
  onClear?: () => void;
  className?: string;
}) {
  if (games.length === 0) {
    return (
      <div className="animate-fade flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-20 text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-felt-soft text-felt">
          <Dices className="size-5" strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-2xl">კოლექციაში შესაბამისი თამაში ვერ მოიძებნა.</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          სცადე ნაკლები ფილტრი — ან დაამატე თამაში, რომელსაც ეძებდი.
        </p>
        {onClear && (
          <Button variant="outline" className="mt-5 rounded-full" onClick={onClear}>
            ფილტრების გასუფთავება
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-9 2xl:grid-cols-5",
        className,
      )}
    >
      {games.map((g, i) => (
        <GameCard key={g.id} game={g} index={i} priority={i < 4} />
      ))}
    </div>
  );
}
