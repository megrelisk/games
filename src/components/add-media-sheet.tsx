"use client";

import * as React from "react";
import { CloudUpload, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { FileDropzone } from "@/components/file-dropzone";
import { useGames } from "@/components/games-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import type { FileMeta } from "@/lib/repository";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
}

/** Shell — the popup unmounts on close, so the body's state resets on every open. */
export function AddMediaSheet({ open, onOpenChange, game }: Props) {
  const isDesktop = useIsDesktop();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "gap-0 p-0",
          isDesktop ? "w-full sm:max-w-lg" : "max-h-[92dvh] rounded-t-3xl border-t-0",
        )}
      >
        <AddMediaBody isDesktop={isDesktop} onOpenChange={onOpenChange} game={game} />
      </SheetContent>
    </Sheet>
  );
}

function AddMediaBody({
  isDesktop,
  onOpenChange,
  game,
}: Omit<Props, "open"> & { isDesktop: boolean }) {
  const { addFiles } = useGames();
  const [files, setFiles] = React.useState<File[]>([]);
  const [meta, setMeta] = React.useState<Record<string, FileMeta>>({});
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!files.length) return;
    setSaving(true);
    try {
      const { media, documents } = await addFiles(game.id, files, meta);
      const n = media.length + documents.length;
      toast.success(`${game.title}-ს დაემატა ${n} ფაილი.`);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("ატვირთვა ვერ მოხერხდა. სცადე თავიდან.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!isDesktop && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-foreground/15" />}
      <SheetHeader className="flex-row items-start justify-between gap-4 px-5 pt-4 pb-3 md:px-7 md:pt-6">
        <div>
          <SheetTitle className="font-display text-2xl font-normal tracking-tight md:text-3xl">
            {game.title}-ისთვის დამატება
          </SheetTitle>
          <SheetDescription>ფოტოები, სახელმძღვანელო კლიპები, ხმოვანი ჩანაწერები ან დოკუმენტები.</SheetDescription>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="დახურვა" onClick={() => onOpenChange(false)}>
          <X />
        </Button>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-7">
        <FileDropzone files={files} onChange={setFiles} meta={meta} onMetaChange={setMeta} />
      </div>

      <div className="safe-bottom flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card/60 px-5 pt-3 md:px-7 md:pb-5">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
          გაუქმება
        </Button>
        <Button size="lg" onClick={submit} disabled={saving || !files.length} className="rounded-full px-5">
          {saving ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <CloudUpload data-icon="inline-start" />
          )}
          {saving ? "იტვირთება…" : files.length ? `ატვირთვა (${files.length})` : "ატვირთვა"}
        </Button>
      </div>
    </>
  );
}
