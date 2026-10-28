"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { CategorySlug } from "@/lib/types";

/** Deterministic hue per title so fallback art is stable. */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

const MOTIF: Record<CategorySlug, React.ReactNode> = {
  board: (
    <>
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}${c}`}
            x={20 + c * 16}
            y={20 + r * 16}
            width="14"
            height="14"
            rx="2"
            opacity={(r + c) % 2 ? 0.35 : 0.12}
          />
        )),
      )}
    </>
  ),
  card: (
    <>
      <rect x="22" y="18" width="40" height="56" rx="5" opacity="0.14" transform="rotate(-10 42 46)" />
      <rect x="36" y="18" width="40" height="56" rx="5" opacity="0.28" transform="rotate(6 56 46)" />
    </>
  ),
  sheet: (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="18" x2="82" y1={24 + i * 11} y2={24 + i * 11} strokeWidth="2" opacity="0.25" stroke="currentColor" />
      ))}
      <line x1="30" x2="30" y1="14" y2="86" strokeWidth="2" opacity="0.4" stroke="currentColor" />
    </>
  ),
  party: (
    <>
      {[
        [22, 30, 5],
        [48, 18, 7],
        [72, 34, 4],
        [34, 60, 6],
        [62, 66, 8],
        [80, 78, 3],
        [18, 82, 4],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} opacity={0.15 + (i % 3) * 0.1} />
      ))}
    </>
  ),
  dice: (
    <>
      <rect x="22" y="22" width="56" height="56" rx="12" opacity="0.14" />
      {[
        [36, 36],
        [64, 36],
        [50, 50],
        [36, 64],
        [64, 64],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" opacity="0.45" />
      ))}
    </>
  ),
  word: (
    <>
      {["A", "B", "C"].map((ch, i) => (
        <g key={ch} opacity={0.2 + i * 0.12}>
          <rect x={16 + i * 24} y={34} width="20" height="20" rx="3" />
          <text x={26 + i * 24} y={49} textAnchor="middle" fontSize="12" fontFamily="serif" fill="var(--paper)">
            {ch}
          </text>
        </g>
      ))}
    </>
  ),
};

export function FallbackCover({
  title,
  category,
  className,
}: {
  title: string;
  category: CategorySlug;
  className?: string;
}) {
  const hue = hashHue(title);
  return (
    <div
      aria-hidden
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{
        background: `linear-gradient(145deg, oklch(0.93 0.04 ${hue}) 0%, oklch(0.84 0.07 ${(hue + 40) % 360}) 100%)`,
        color: `oklch(0.38 0.08 ${hue})`,
      }}
    >
      <svg viewBox="0 0 100 100" className="h-3/5 w-3/5 fill-current" role="presentation">
        {MOTIF[category] ?? MOTIF.board}
      </svg>
      <span className="absolute bottom-3 left-3 font-display text-2xl italic opacity-70">
        {title.slice(0, 1)}
      </span>
    </div>
  );
}

export function CoverImage({
  src,
  title,
  category,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority,
  className,
  imgClassName,
}: {
  src?: string | null;
  title: string;
  category: CategorySlug;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = src && !failed;
  const isData = src?.startsWith("data:") || src?.startsWith("blob:");

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-muted", className)}>
      {showImage ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isData}
          onError={() => setFailed(true)}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <FallbackCover title={title} category={category} />
      )}
    </div>
  );
}
