"use client";

import * as React from "react";
import { CloudUpload, X } from "lucide-react";
import { toast } from "sonner";

import { MediaKindIcon } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCEPT_ATTR, classifyFile, formatBytes, kindLabel } from "@/lib/format";
import type { FileMeta } from "@/lib/repository";
import type { UploadKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_TONE: Record<UploadKind, string> = {
  image: "bg-felt-soft text-felt",
  video: "bg-[oklch(0.94_0.03_290)] text-[oklch(0.5_0.14_290)] dark:bg-[oklch(0.3_0.05_290)] dark:text-[oklch(0.8_0.1_290)]",
  audio: "bg-[oklch(0.95_0.04_60)] text-[oklch(0.55_0.14_60)] dark:bg-[oklch(0.3_0.05_60)] dark:text-[oklch(0.82_0.1_60)]",
  document: "bg-muted text-muted-foreground",
};

function Thumb({ file, kind }: { file: File; kind: UploadKind }) {
  const url = React.useMemo(() => (kind === "image" ? URL.createObjectURL(file) : null), [file, kind]);
  React.useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (kind === "image" && url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-11 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-lg", KIND_TONE[kind])}>
      <MediaKindIcon kind={kind} className="size-5" />
    </span>
  );
}

export function FileDropzone({
  files,
  onChange,
  meta,
  onMetaChange,
  disabled,
  compact,
  className,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  meta?: Record<string, FileMeta>;
  onMetaChange?: (meta: Record<string, FileMeta>) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of incoming) {
      if (!classifyFile(f)) rejected.push(f.name);
      else if (!files.some((x) => x.name === f.name && x.size === f.size)) accepted.push(f);
    }
    if (rejected.length) {
      toast.error(`მხარდაუჭერელია: ${rejected.slice(0, 3).join(", ")}${rejected.length > 3 ? "…" : ""}`, {
        description: "სურათები, MP4/WebM ვიდეო, MP3/WAV/M4A აუდიო, PDF, DOCX, XLSX, PPTX.",
      });
    }
    if (accepted.length) onChange([...files, ...accepted]);
  };

  const remove = (f: File) => onChange(files.filter((x) => x !== f));

  const setMeta = (name: string, patch: FileMeta) =>
    onMetaChange?.({ ...(meta ?? {}), [name]: { ...(meta?.[name] ?? {}), ...patch } });

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-all duration-300 outline-none",
          compact ? "px-4 py-6" : "px-6 py-10",
          dragging
            ? "border-felt bg-felt-soft/60"
            : "border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/50",
          "focus-visible:ring-3 focus-visible:ring-ring/40",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border transition-transform duration-300 group-hover:-translate-y-0.5">
          <CloudUpload className="size-5 text-felt" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-medium">
          ჩააგდე ფაილები აქ, ან <span className="text-felt underline-offset-4 group-hover:underline">აირჩიე</span>
        </p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          სურათები · MP4 / WebM · MP3 / WAV / M4A · PDF, DOCX, XLSX, PPTX
        </p>
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {files.map((f) => {
            const kind = classifyFile(f) ?? "document";
            const m = meta?.[f.name] ?? {};
            return (
              <li key={`${f.name}-${f.size}`} className="flex items-start gap-3 p-3">
                <Thumb file={f} kind={kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      {kindLabel(kind)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                  {onMetaChange && (
                    <Input
                      value={m.caption ?? ""}
                      onChange={(e) => setMeta(f.name, { caption: e.target.value })}
                      placeholder={
                        kind === "document"
                          ? "მოკლე აღწერა (არასავალდებულო)"
                          : kind === "image"
                            ? "წარწერა (არასავალდებულო)"
                            : "სათაური (არასავალდებულო)"
                      }
                      className="mt-2 h-8 bg-muted/40 text-sm"
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${f.name}-ის წაშლა`}
                  onClick={() => remove(f)}
                  className="text-muted-foreground"
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
