"use client";

import * as React from "react";
import { Check, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { CoverImage } from "@/components/cover-image";
import { useEvent } from "@/components/event-provider";
import { useGames } from "@/components/games-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchScore } from "@/lib/filters";
import { formatDuration, formatPlayers } from "@/lib/format";

export function AddActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { games } = useGames();
  const { event, addActivity } = useEvent();
  const [query, setQuery] = React.useState("");
  const [addingId, setAddingId] = React.useState<string | null>(null);

  const usedIds = React.useMemo(() => new Set(event.program.map((p) => p.game_id)), [event.program]);

  const results = React.useMemo(() => {
    const q = query.trim();
    const scored = games.map((g) => ({ g, score: q ? searchScore(g, q) : 1 }));
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || a.g.title.localeCompare(b.g.title))
      .map((s) => s.g);
  }, [games, query]);

  const handleAdd = async (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    setAddingId(gameId);
    try {
      await addActivity(game);
      toast.success(`"${game.title}" დაემატა პროგრამას.`);
    } catch (err) {
      console.error(err);
      toast.error("ვერ დაემატა. სცადე თავიდან.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">აქტივობის დამატება</DialogTitle>
          <DialogDescription>აირჩიე თამაში კოლექციიდან — პროგრამის ბოლოში დაემატება.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="მოძებნე თამაში…"
            className="h-9 pl-9"
          />
        </div>

        <div className="-mx-1 max-h-80 space-y-1 overflow-y-auto px-1">
          {results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">ვერაფერი მოიძებნა.</p>
          )}
          {results.map((g) => {
            const used = usedIds.has(g.id);
            return (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
              >
                <div className="size-10 shrink-0 overflow-hidden rounded-lg">
                  <CoverImage src={g.cover_url} title={g.title} category={g.category} sizes="40px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatPlayers(g.min_players, g.max_players)} · {formatDuration(g.duration_minutes)}
                  </p>
                </div>
                <Button
                  variant={used ? "ghost" : "outline"}
                  size="icon-sm"
                  disabled={used || addingId === g.id}
                  aria-label={used ? `${g.title} უკვე დამატებულია` : `${g.title}-ის დამატება`}
                  onClick={() => handleAdd(g.id)}
                >
                  {used ? <Check className="text-felt" /> : <Plus />}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
