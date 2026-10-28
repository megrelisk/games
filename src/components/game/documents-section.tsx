"use client";

import { Download, Paperclip, Trash2 } from "lucide-react";

import { DOC_STYLE, DocIcon } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBytes } from "@/lib/format";
import type { AttachedDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DocumentsSection({
  documents,
  onAdd,
  onRemove,
  className,
}: {
  documents: AttachedDocument[];
  onAdd: () => void;
  onRemove?: (id: string) => void;
  className?: string;
}) {
  return (
    <section id="files" className={cn("animate-rise stagger-5 scroll-mt-24", className)}>
      <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
        <h2 className="font-display text-2xl tracking-tight">
          ფაილები{" "}
          {documents.length > 0 && (
            <span className="font-sans text-sm text-muted-foreground tabular-nums">{documents.length}</span>
          )}
        </h2>
        <Button variant="ghost" size="sm" onClick={onAdd} className="rounded-full text-muted-foreground">
          <Paperclip data-icon="inline-start" />
          მიმაგრება
        </Button>
      </div>

      {documents.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 flex w-full flex-col items-center rounded-2xl border border-dashed border-border py-8 text-center transition-colors hover:bg-muted/40"
        >
          <Paperclip className="mb-2 size-5 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-display text-lg">ფაილი არ არის მიმაგრებული.</p>
          <p className="text-xs text-muted-foreground">PDF წესები, საანგარიშო ფურცლები, სლაიდები.</p>
        </button>
      ) : (
        <ul className="mt-4 space-y-2">
          {documents.map((d) => {
            const sample = !d.url || d.url === "#";
            const style = DOC_STYLE[d.kind] ?? DOC_STYLE.other;
            return (
              <li
                key={d.id}
                className="group/doc flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border transition-shadow hover:shadow-[0_12px_30px_-20px_rgba(20,20,16,0.4)]"
              >
                <DocIcon kind={d.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={d.name}>
                    {d.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-medium tracking-wide">{style.label}</span>
                    <span className="mx-1.5 text-muted-foreground/50">·</span>
                    {formatBytes(d.size_bytes)}
                    {d.description && (
                      <>
                        <span className="mx-1.5 text-muted-foreground/50">·</span>
                        {d.description}
                      </>
                    )}
                  </p>
                </div>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${d.name}-ის წაშლა`}
                    onClick={() => onRemove(d.id)}
                    className="text-muted-foreground opacity-0 transition-opacity group-hover/doc:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 />
                  </Button>
                )}
                {sample ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span>
                          <Button variant="outline" size="icon-sm" disabled aria-label="ჩამოტვირთვა მიუწვდომელია">
                            <Download />
                          </Button>
                        </span>
                      }
                    />
                    <TooltipContent>სანიმუშო ჩანაწერია — ფაილი ჯერ არ არის მიმაგრებული</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`${d.name}-ის ჩამოტვირთვა`}
                    className="rounded-full"
                    nativeButton={false}
                    render={<a href={d.url} download={d.name} target="_blank" rel="noreferrer" />}
                  >
                    <Download />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
