"use client";

import { Film, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import type { MediaFile } from "@/lib/types";
import { cn } from "@/lib/utils";

/** YouTube link details: video id, optional start offset (from `t=1373s` / `t=1373`), and whether it's a Short. */
function youTube(url: string): { id: string; start: number | null; short: boolean } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const t = u.searchParams.get("t") ?? u.searchParams.get("start");
    const start = t && /^\d+s?$/.test(t) ? Number.parseInt(t, 10) : null;
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? { id, start, short: false } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? { id, start, short: false } : null;
      }
      const m = u.pathname.match(/^\/(shorts|embed)\/([^/?]+)/);
      if (m) return { id: m[2], start, short: m[1] === "shorts" };
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoPlayer({ media, onRemove }: { media: MediaFile; onRemove?: () => void }) {
  const yt = youTube(media.url);

  return (
    <figure className="group/video overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div className={cn("relative bg-black", yt?.short ? "aspect-[9/16] max-h-[70vh]" : "aspect-video")}>
        {yt ? (
          <iframe
            src={`https://www.youtube.com/embed/${yt.id}${yt.start ? `?start=${yt.start}` : ""}`}
            title={media.title ?? "YouTube ვიდეო"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <video
            controls
            playsInline
            preload="metadata"
            poster={media.poster_url ?? undefined}
            src={media.url}
            className="h-full w-full"
          >
            შენი ბრაუზერი HTML5 ვიდეოს ვერ უჭერს მხარს.{" "}
            <a href={media.url} className="underline">
              ჩამოტვირთე კლიპი
            </a>
            .
          </video>
        )}
      </div>
      <figcaption className="flex items-center gap-3 px-4 py-3">
        <Film className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{media.title ?? "ვიდეო კლიპი"}</p>
          {media.caption && <p className="truncate text-xs text-muted-foreground">{media.caption}</p>}
        </div>
        {media.duration_seconds ? (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatClock(media.duration_seconds)}
          </span>
        ) : null}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="ვიდეოს წაშლა"
            onClick={onRemove}
            className="text-muted-foreground opacity-0 transition-opacity group-hover/video:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 />
          </Button>
        )}
      </figcaption>
    </figure>
  );
}
