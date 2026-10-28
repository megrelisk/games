"use client";

import * as React from "react";
import { Download, Pause, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import type { MediaFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const BAR_COUNT = 44;
const SPEEDS = [1, 1.25, 1.5, 2] as const;

/** Deterministic pseudo-waveform so each note has its own silhouette. */
function bars(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = Math.sin((i / (BAR_COUNT - 1)) * Math.PI) * 0.6 + 0.4;
    out.push(0.25 + r * 0.75 * envelope);
  }
  return out;
}

export function AudioPlayer({ media, onRemove }: { media: MediaFile; onRemove?: () => void }) {
  const ref = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(media.duration_seconds ?? 0);
  const [speedIdx, setSpeedIdx] = React.useState(0);
  const shape = React.useMemo(() => bars(media.id + media.url), [media.id, media.url]);

  const progress = duration ? Math.min(1, time / duration) : 0;

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const seekTo = (ratio: number) => {
    const el = ref.current;
    if (!el || !duration) return;
    el.currentTime = Math.max(0, Math.min(duration, ratio * duration));
  };

  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (ref.current) ref.current.playbackRate = SPEEDS[next];
  };

  return (
    <div className="group/audio flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border sm:gap-4 sm:p-4">
      <audio
        ref={ref}
        src={media.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "პაუზა" : "დაკვრა"}
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-felt text-felt-foreground shadow-[0_8px_20px_-8px_var(--felt)] transition-transform duration-300 ease-out-expo active:scale-95",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        )}
      >
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium">{media.title ?? "ხმოვანი ჩანაწერი"}</p>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {formatClock(time)} / {formatClock(duration)}
          </span>
        </div>
        <div
          role="slider"
          aria-label="გადახვევა"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            onScrub(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && onScrub(e)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") seekTo(progress + 0.05);
            if (e.key === "ArrowLeft") seekTo(progress - 0.05);
            if (e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
          className="mt-2 flex h-8 cursor-pointer touch-none items-end gap-[2px] outline-none focus-visible:ring-3 focus-visible:ring-ring/40 rounded-md"
        >
          {shape.map((h, i) => {
            const filled = i / BAR_COUNT < progress;
            return (
              <span
                key={i}
                className={cn(
                  "w-full min-w-[2px] rounded-full transition-[background-color,transform] duration-300",
                  filled ? "bg-felt" : "bg-foreground/15",
                  playing && filled && "animate-pulse",
                )}
                style={{
                  height: `${Math.round(h * 100)}%`,
                  animationDelay: `${(i % 6) * 90}ms`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="xs"
          onClick={cycleSpeed}
          aria-label="დაკვრის სიჩქარე"
          className="w-10 font-mono text-[11px] text-muted-foreground tabular-nums"
        >
          {SPEEDS[speedIdx]}×
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="ჩამოტვირთვა"
          nativeButton={false}
          render={<a href={media.url} download target="_blank" rel="noreferrer" />}
          className="text-muted-foreground"
        >
          <Download />
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="ხმოვანი ჩანაწერის წაშლა"
            onClick={onRemove}
            className="text-muted-foreground opacity-0 transition-opacity group-hover/audio:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  );
}
