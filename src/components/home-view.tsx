"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { CategoryChips } from "@/components/category-chips";
import { FilterBar } from "@/components/filter-bar";
import { GameGrid } from "@/components/game-grid";
import { useGames } from "@/components/games-provider";
import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DEFAULT_FILTERS, filterGames, type GameFilters } from "@/lib/filters";
import type { CategorySlug } from "@/lib/types";

export function HomeView() {
  const { games } = useGames();
  const router = useRouter();
  const [filters, setFilters] = React.useState<GameFilters>(DEFAULT_FILTERS);

  const filtered = React.useMemo(() => filterGames(games, filters), [games, filters]);

  const counts = React.useMemo(() => {
    const c: Partial<Record<CategorySlug | "all", number>> = { all: games.length };
    for (const g of games) c[g.category] = (c[g.category] ?? 0) + 1;
    return c;
  }, [games]);

  const surprise = () => {
    const pool = filtered.length ? filtered : games;
    if (!pool.length) return;
    router.push(`/game/${pool[Math.floor(Math.random() * pool.length)].id}`);
  };

  return (
    <>
      <SiteHeader query={filters.query} onQueryChange={(q) => setFilters((f) => ({ ...f, query: q }))} />

      <main className="mx-auto w-full max-w-7xl px-4 pb-32 md:px-8 md:pb-20">
        {/* Utility row — mobile already has the surprise action in its bottom nav */}
        <div className="hidden justify-end pt-8 md:flex md:pt-10">
          <Button
            variant="outline"
            size="lg"
            onClick={surprise}
            className="animate-rise h-11 w-fit rounded-full border-foreground/15 bg-card px-5"
          >
            <Sparkles data-icon="inline-start" className="text-felt" />
            ამოგვირჩიე ერთი
          </Button>
        </div>

        {/* Controls */}
        <section className="animate-rise sticky top-16 z-30 -mx-4 mt-4 space-y-3 bg-background/90 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:mt-6 md:space-y-4 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <CategoryChips
            value={filters.category}
            counts={counts}
            onChange={(category) => setFilters((f) => ({ ...f, category }))}
          />
          <FilterBar
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
            total={games.length}
          />
        </section>

        {/* Grid */}
        <section className="mt-6 md:mt-10">
          <GameGrid
            key={`${filters.category}-${filters.players}-${filters.duration}-${filters.sort}`}
            games={filtered}
            onClear={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}
          />
        </section>
      </main>

      <MobileNav />
    </>
  );
}
