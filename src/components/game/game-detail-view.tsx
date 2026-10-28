"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { AddMediaSheet } from "@/components/add-media-sheet";
import { AudioPlayer } from "@/components/game/audio-player";
import { ComponentsChecklist } from "@/components/game/components-checklist";
import { DocumentsSection } from "@/components/game/documents-section";
import { GameHero } from "@/components/game/game-hero";
import { MediaGallery } from "@/components/game/media-gallery";
import { RulesSection } from "@/components/game/rules-section";
import { VideoPlayer } from "@/components/game/video-player";
import { GameFormSheet } from "@/components/game-form-sheet";
import { useGames } from "@/components/games-provider";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@/lib/types";

export function GameDetailView({ id, initialGame }: { id: string; initialGame: Game | null }) {
  const { getGame, ready, removeMedia, removeDocument, setCover } = useGames();
  const game = getGame(id) ?? initialGame;
  const [editOpen, setEditOpen] = React.useState(false);
  const [mediaOpen, setMediaOpen] = React.useState(false);

  if (!game) {
    return (
      <>
        <SiteHeader variant="detail" />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-8">
          {!ready ? (
            <div className="space-y-6 pt-6">
              <Skeleton className="aspect-[4/3] w-full rounded-3xl sm:aspect-[21/9]" />
              <Skeleton className="mx-8 h-40 rounded-3xl" />
            </div>
          ) : (
            <div className="flex flex-col items-center py-32 text-center">
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">404</p>
              <h1 className="mt-2 font-display text-5xl">ეს თამაში კოლექციაში არ არის.</h1>
              <p className="mt-3 max-w-sm text-muted-foreground">
                შესაძლოა წაშლილია, ან ბმული არასწორად არის აკრეფილი.
              </p>
              <Button className="mt-6 rounded-full" nativeButton={false} render={<Link href="/" />}>
                <ArrowLeft data-icon="inline-start" />
                ყველა თამაშთან დაბრუნება
              </Button>
            </div>
          )}
        </main>
      </>
    );
  }

  const images = game.media.filter((m) => m.kind === "image");
  const videos = game.media.filter((m) => m.kind === "video");
  const audios = game.media.filter((m) => m.kind === "audio");

  const handleRemoveMedia = async (mediaId: string) => {
    try {
      await removeMedia(game.id, mediaId);
      toast.success("წაშლილია.");
    } catch {
      toast.error("ვერ წაიშალა.");
    }
  };
  const handleRemoveDoc = async (docId: string) => {
    try {
      await removeDocument(game.id, docId);
      toast.success("წაშლილია.");
    } catch {
      toast.error("ვერ წაიშალა.");
    }
  };
  const handleSetCover = async (url: string) => {
    try {
      await setCover(game.id, url);
      toast.success("ყდა შეიცვალა.");
    } catch {
      toast.error("ყდა ვერ შეიცვალა.");
    }
  };

  return (
    <>
      <SiteHeader variant="detail" />

      <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-32 md:px-8 md:pt-6 md:pb-24 print:pt-0">
        <GameHero game={game} onEdit={() => setEditOpen(true)} onAddMedia={() => setMediaOpen(true)} />

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
          <div className="min-w-0 space-y-14">
            <RulesSection game={game} onEdit={() => setEditOpen(true)} />

            <MediaGallery
              images={images}
              coverUrl={game.cover_url}
              onAdd={() => setMediaOpen(true)}
              onRemove={handleRemoveMedia}
              onSetCover={handleSetCover}
            />

            {videos.length > 0 && (
              <section id="videos" className="animate-rise stagger-5 scroll-mt-24 print:hidden">
                <div className="border-b border-border pb-3">
                  <h2 className="font-display text-3xl tracking-tight">
                    კლიპები{" "}
                    <span className="font-sans text-base text-muted-foreground tabular-nums">{videos.length}</span>
                  </h2>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {videos.map((v) => (
                    <VideoPlayer key={v.id} media={v} onRemove={() => handleRemoveMedia(v.id)} />
                  ))}
                </div>
              </section>
            )}

            {audios.length > 0 && (
              <section id="voice" className="animate-rise stagger-6 scroll-mt-24 print:hidden">
                <div className="border-b border-border pb-3">
                  <h2 className="font-display text-3xl tracking-tight">
                    ხმოვანი ჩანაწერები{" "}
                    <span className="font-sans text-base text-muted-foreground tabular-nums">{audios.length}</span>
                  </h2>
                </div>
                <div className="mt-5 space-y-3">
                  {audios.map((a) => (
                    <AudioPlayer key={a.id} media={a} onRemove={() => handleRemoveMedia(a.id)} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8 self-start lg:sticky lg:top-24 print:hidden">
            <ComponentsChecklist game={game} onEdit={() => setEditOpen(true)} />
            <DocumentsSection documents={game.documents} onAdd={() => setMediaOpen(true)} onRemove={handleRemoveDoc} />
          </aside>
        </div>
      </main>

      {/* Mobile action bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border/60 bg-background/85 px-4 pt-2.5 backdrop-blur-xl md:hidden print:hidden">
        <Button size="lg" className="h-11 flex-1 rounded-full" onClick={() => setEditOpen(true)}>
          <Pencil data-icon="inline-start" />
          რედაქტირება
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-11 flex-1 rounded-full bg-card"
          onClick={() => setMediaOpen(true)}
        >
          <ImagePlus data-icon="inline-start" />
          მედიის დამატება
        </Button>
      </div>

      <GameFormSheet open={editOpen} onOpenChange={setEditOpen} mode="edit" game={game} />
      <AddMediaSheet open={mediaOpen} onOpenChange={setMediaOpen} game={game} />
    </>
  );
}
