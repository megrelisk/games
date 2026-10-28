"use client";

import Link from "next/link";
import { Clock, Users } from "lucide-react";

import { CoverImage } from "@/components/cover-image";
import { formatDuration, formatPlayers } from "@/lib/format";
import { CATEGORIES, type Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameCard({
  game,
  index = 0,
  priority,
  className,
}: {
  game: Game;
  index?: number;
  priority?: boolean;
  className?: string;
}) {
  const cat = CATEGORIES.find((c) => c.slug === game.category);

  return (
    <Link
      href={`/game/${game.id}`}
      prefetch
      className={cn(
        "group/card block animate-rise rounded-2xl outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 14) * 45}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/[0.06] transition-shadow duration-500 group-hover/card:shadow-[0_24px_50px_-24px_rgba(20,20,16,0.35)]">
        <CoverImage
          src={game.cover_url}
          title={game.title}
          category={game.category}
          priority={priority}
          imgClassName="transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.045]"
        />
        {/* soft vignette so overlay chips read on any photo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />
      </div>

      <div className="px-1 pt-3">
        <h3 className="font-display text-[1.35rem] leading-[1.1] text-balance text-foreground transition-colors duration-300 group-hover/card:text-felt md:text-2xl">
          {game.title}
        </h3>
        {game.tagline && (
          <p className="mt-1 hidden truncate text-sm text-muted-foreground sm:block">
            {game.tagline}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-2.5 text-[13px] text-muted-foreground sm:gap-3">
          <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums sm:gap-1.5">
            <Users className="size-3.5" strokeWidth={1.75} />
            {formatPlayers(game.min_players, game.max_players)}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums sm:gap-1.5">
            <Clock className="size-3.5" strokeWidth={1.75} />
            {formatDuration(game.duration_minutes)}
          </span>
          <span className="ml-auto inline-flex h-5 shrink-0 items-center rounded-full bg-felt-soft px-2 text-[11px] font-medium tracking-wide whitespace-nowrap text-felt dark:text-felt">
            {cat?.short ?? game.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
