"use client";

import { Baby, Clock, Gauge, ImagePlus, Link2, Pencil, Printer, Users } from "lucide-react";
import { toast } from "sonner";

import { CoverImage } from "@/components/cover-image";
import { Button } from "@/components/ui/button";
import { complexityLabel, formatDuration, formatPlayers, formatRelative } from "@/lib/format";
import { categoryLabel, type Game } from "@/lib/types";

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-felt-soft text-felt">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="leading-tight">
        <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
        <p className="font-display text-xl tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function GameHero({
  game,
  onEdit,
  onAddMedia,
}: {
  game: Game;
  onEdit: () => void;
  onAddMedia: () => void;
}) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("ბმული დაკოპირდა.");
    } catch {
      toast.error("ვერ დაკოპირდა — გამოიყენე მისამართის ველი.");
    }
  };

  return (
    <section className="animate-rise">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-foreground/[0.06] sm:aspect-[21/9]">
        <CoverImage
          src={game.cover_url}
          title={game.title}
          category={game.category}
          priority
          sizes="(max-width: 1200px) 100vw, 1152px"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="relative z-10 -mt-10 mx-3 rounded-3xl bg-card p-5 ring-1 ring-border shadow-[0_30px_60px_-40px_rgba(20,20,16,0.45)] sm:-mt-16 sm:mx-8 sm:p-8 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-felt uppercase">
              {categoryLabel(game.category)}
              <span className="text-muted-foreground/60">·</span>
              <span className="font-normal tracking-normal text-muted-foreground normal-case">
                განახლდა {formatRelative(game.updated_at)}
              </span>
            </p>
            <h1 className="font-display text-4xl leading-[0.98] tracking-tight text-balance sm:text-5xl md:text-6xl">
              {game.title}
            </h1>
            {game.tagline && (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {game.tagline}
              </p>
            )}
            {game.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {game.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button onClick={onEdit} size="lg" className="rounded-full px-4">
              <Pencil data-icon="inline-start" />
              რედაქტირება
            </Button>
            <Button onClick={onAddMedia} variant="outline" size="lg" className="rounded-full bg-card px-4">
              <ImagePlus data-icon="inline-start" />
              მედიის დამატება
            </Button>
            <Button onClick={copyLink} variant="ghost" size="icon-lg" aria-label="ბმულის კოპირება" className="rounded-full">
              <Link2 />
            </Button>
            <Button
              onClick={() => window.print()}
              variant="ghost"
              size="icon-lg"
              aria-label="წესების ბეჭდვა"
              className="hidden rounded-full md:inline-flex"
            >
              <Printer />
            </Button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-6 sm:grid-cols-4">
          <Spec icon={Users} label="მოთამაშეები" value={formatPlayers(game.min_players, game.max_players)} />
          <Spec icon={Clock} label="ხანგრძლივობა" value={formatDuration(game.duration_minutes)} />
          <Spec icon={Baby} label="ასაკი" value={game.min_age ? `${game.min_age}+` : "ნებისმიერი"} />
          <Spec icon={Gauge} label="სირთულე" value={complexityLabel(game.complexity)} />
        </div>
      </div>
    </section>
  );
}
