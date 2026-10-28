import type { DocumentKind, MediaKind, UploadKind } from "./types";

export function formatPlayers(min: number, max: number): string {
  if (min === max) return `${min}`;
  if (max >= 20) return `${min}+`;
  return `${min}–${max}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} წთ`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} სთ ${m} წთ` : `${h} სთ`;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "დღეს";
  if (days === 1) return "გუშინ";
  if (days < 30) return `${days} დღის წინ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} თვის წინ`;
  return `${Math.floor(months / 12)} წლის წინ`;
}

export function complexityLabel(level?: number | null): string {
  switch (level) {
    case 1:
      return "მარტივი";
    case 2:
      return "მსუბუქი";
    case 3:
      return "საშუალო";
    case 4:
      return "რთული";
    case 5:
      return "ტვინის გასატეხი";
    default:
      return "—";
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function uid(prefix = ""): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}-${rnd}` : rnd;
}

/* ------------------------------------------------------------------ */
/*  File classification                                                */
/* ------------------------------------------------------------------ */

export const ACCEPTED = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/aac", "audio/webm", "audio/ogg"],
  document: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
  ],
} as const;

export const ACCEPT_ATTR = [
  ...ACCEPTED.image,
  ...ACCEPTED.video,
  ...ACCEPTED.audio,
  ...ACCEPTED.document,
  ".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.mp3,.wav,.m4a,.pdf,.docx,.xlsx,.pptx",
].join(",");

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function classifyFile(file: { name: string; type: string }): UploadKind | null {
  const type = file.type.toLowerCase();
  const ext = extOf(file.name);
  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (type.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext)) return "video";
  if (type.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg"].includes(ext)) return "audio";
  if (
    (ACCEPTED.document as readonly string[]).includes(type) ||
    ["pdf", "docx", "xlsx", "pptx", "doc", "xls", "ppt"].includes(ext)
  )
    return "document";
  return null;
}

export function documentKind(name: string, type?: string): DocumentKind {
  const ext = extOf(name);
  if (ext === "pdf" || type === "application/pdf") return "pdf";
  if (["docx", "doc"].includes(ext)) return "docx";
  if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
  if (["pptx", "ppt"].includes(ext)) return "pptx";
  return "other";
}

export function kindLabel(kind: UploadKind | MediaKind): string {
  return { image: "ფოტო", video: "ვიდეო", audio: "აუდიო", document: "დოკუმენტი" }[kind];
}
