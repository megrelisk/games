import { File, FileSpreadsheet, FileText, Film, Image, Music, Presentation } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DocumentKind, MediaKind } from "@/lib/types";

export const DOC_STYLE: Record<DocumentKind, { label: string; tone: string; Icon: typeof FileText }> = {
  pdf: { label: "PDF", tone: "bg-[oklch(0.95_0.03_25)] text-[oklch(0.5_0.18_25)] dark:bg-[oklch(0.3_0.06_25)] dark:text-[oklch(0.8_0.12_25)]", Icon: FileText },
  docx: { label: "DOCX", tone: "bg-[oklch(0.95_0.03_255)] text-[oklch(0.5_0.15_255)] dark:bg-[oklch(0.3_0.06_255)] dark:text-[oklch(0.8_0.1_255)]", Icon: FileText },
  xlsx: { label: "XLSX", tone: "bg-[oklch(0.95_0.04_150)] text-[oklch(0.48_0.13_150)] dark:bg-[oklch(0.3_0.06_150)] dark:text-[oklch(0.8_0.12_150)]", Icon: FileSpreadsheet },
  pptx: { label: "PPTX", tone: "bg-[oklch(0.95_0.04_55)] text-[oklch(0.55_0.16_55)] dark:bg-[oklch(0.3_0.06_55)] dark:text-[oklch(0.82_0.12_55)]", Icon: Presentation },
  other: { label: "FILE", tone: "bg-muted text-muted-foreground", Icon: File },
};

export function DocIcon({
  kind,
  className,
  iconClassName,
}: {
  kind: DocumentKind;
  className?: string;
  iconClassName?: string;
}) {
  const { Icon, tone } = DOC_STYLE[kind] ?? DOC_STYLE.other;
  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-5", iconClassName)} strokeWidth={1.75} />
    </span>
  );
}

export function MediaKindIcon({ kind, className }: { kind: MediaKind | "document"; className?: string }) {
  const Icon = kind === "image" ? Image : kind === "video" ? Film : kind === "audio" ? Music : File;
  return <Icon className={className} strokeWidth={1.75} />;
}
