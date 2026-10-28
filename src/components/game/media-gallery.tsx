"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, ImageUp, Maximize2, Star, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { MediaFile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MediaGallery({
  images,
  coverUrl,
  onAdd,
  onRemove,
  onSetCover,
}: {
  images: MediaFile[];
  /** The game's current cover — the matching photo gets a badge and its "set as cover" action is disabled. */
  coverUrl?: string | null;
  onAdd: () => void;
  onRemove?: (id: string) => void;
  onSetCover?: (url: string) => void | Promise<void>;
}) {
  const [index, setIndex] = React.useState<number | null>(null);
  const [settingCover, setSettingCover] = React.useState(false);
  const open = index !== null;
  const current = open ? images[index] : null;
  const currentIsCover = Boolean(current && coverUrl && current.url === coverUrl);

  const go = React.useCallback(
    (dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const handleSetCover = async () => {
    if (!current || !onSetCover || currentIsCover) return;
    setSettingCover(true);
    try {
      await onSetCover(current.url);
    } finally {
      setSettingCover(false);
    }
  };

  return (
    <section id="gallery" className="animate-rise stagger-4 scroll-mt-24">
      <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
        <h2 className="font-display text-3xl tracking-tight">
          გალერეა{" "}
          {images.length > 0 && (
            <span className="font-sans text-base text-muted-foreground tabular-nums">{images.length}</span>
          )}
        </h2>
        <Button variant="ghost" size="sm" onClick={onAdd} className="rounded-full text-muted-foreground">
          <ImagePlus data-icon="inline-start" />
          ფოტოების დამატება
        </Button>
      </div>

      {images.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center transition-colors hover:bg-muted/40"
        >
          <ImagePlus className="mb-2 size-6 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-display text-xl">ფოტოები ჯერ არ არის.</p>
          <p className="text-sm text-muted-foreground">შემდეგ თამაშზე გადაუღე სურათი მოწყობას.</p>
        </button>
      ) : (
        <div className="mt-5 grid auto-rows-[minmax(120px,1fr)] grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {images.map((m, i) => {
            const isCover = Boolean(coverUrl && m.url === coverUrl);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={m.caption ? `გახსნა: ${m.caption}` : `ფოტო ${i + 1}-ის გახსნა`}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/[0.06] outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  i === 0 && images.length > 2 && "col-span-2 row-span-2",
                )}
              >
                <Image
                  src={m.url}
                  alt={m.caption ?? ""}
                  fill
                  sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                  unoptimized={m.url.startsWith("data:") || m.url.startsWith("blob:")}
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                />
                {isCover && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-felt px-2 py-0.5 text-[11px] font-medium text-felt-foreground shadow-sm">
                    <Star className="size-3 fill-current" />
                    ყდა
                  </span>
                )}
                <span className="absolute right-2 bottom-2 inline-flex size-7 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="h-[100dvh] max-w-none! w-screen rounded-none border-0 bg-black/95 p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">ფოტოს გადამხედი</DialogTitle>
          {current && (
            <div className="relative flex h-full w-full flex-col">
              <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70">
                <span className="tabular-nums">
                  {index! + 1} / {images.length}
                </span>
                <div className="flex items-center gap-1">
                  {onSetCover && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentIsCover || settingCover}
                      onClick={handleSetCover}
                      className="rounded-full text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-70"
                    >
                      {currentIsCover ? (
                        <Star data-icon="inline-start" className="fill-current text-felt" />
                      ) : (
                        <ImageUp data-icon="inline-start" />
                      )}
                      {currentIsCover ? "ყდაა" : settingCover ? "ინახება…" : "ყდად დაყენება"}
                    </Button>
                  )}
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="ფოტოს წაშლა"
                      className="text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        onRemove(current.id);
                        setIndex(images.length > 1 ? Math.max(0, index! - 1) : null);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="დახურვა"
                    className="text-white/70 hover:bg-white/10 hover:text-white"
                    onClick={() => setIndex(null)}
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <div className="relative min-h-0 flex-1">
                <Image
                  key={current.id}
                  src={current.url}
                  alt={current.caption ?? ""}
                  fill
                  sizes="100vw"
                  priority
                  unoptimized={current.url.startsWith("data:") || current.url.startsWith("blob:")}
                  className="animate-fade object-contain"
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="წინა"
                      onClick={() => go(-1)}
                      className="absolute top-1/2 left-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 md:left-6"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="შემდეგი"
                      onClick={() => go(1)}
                      className="absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 md:right-6"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="safe-bottom px-4 pt-3 text-center">
                <p className="font-display text-lg text-white/90">{current.caption ?? " "}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
