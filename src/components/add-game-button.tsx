"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { GameFormSheet } from "@/components/game-form-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddGameButton({
  className,
  variant = "default",
  label = "თამაშის დამატება",
  size = "lg",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "fab";
  label?: string;
  size?: "default" | "lg" | "sm";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {variant === "fab" ? (
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-[0_14px_30px_-10px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out-expo active:scale-95",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
            className,
          )}
        >
          <Plus className="size-6" strokeWidth={2} />
        </button>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={() => setOpen(true)}
          className={cn("rounded-full px-4", className)}
        >
          <Plus data-icon="inline-start" />
          {label}
        </Button>
      )}
      <GameFormSheet open={open} onOpenChange={setOpen} mode="create" />
    </>
  );
}
