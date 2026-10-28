"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Search, X } from "lucide-react";

import { AddGameButton } from "@/components/add-game-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        className,
      )}
      aria-label="თამაშების დროა — მთავარი გვერდი"
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-felt opacity-40 [animation-duration:2.4s]" />
        <span className="relative inline-flex size-2.5 rounded-full bg-felt" />
      </span>
      <span className="font-display text-[1.45rem] leading-none tracking-tight">
        თამაშების <em className="text-felt">დროა</em>
      </span>
    </Link>
  );
}

type Props =
  | {
      variant?: "home";
      query: string;
      onQueryChange: (q: string) => void;
    }
  | {
      variant: "detail";
      query?: undefined;
      onQueryChange?: undefined;
    };

export function SiteHeader(props: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isHome = props.variant !== "detail";

  // "/" focuses search (home only)
  React.useEffect(() => {
    if (!isHome) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        props.onQueryChange?.("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome, props]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-5 md:px-8">
        {isHome ? (
          <Wordmark className="shrink-0" />
        ) : (
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full pr-3 pl-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">ყველა თამაში</span>
            <span className="sm:hidden">უკან</span>
          </Link>
        )}

        {isHome && (
          <div className="relative ml-auto flex-1 md:mx-auto md:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="game-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="მოძებნე თამაში, თეგი, წესები…"
              value={props.query}
              onChange={(e) => props.onQueryChange(e.target.value)}
              className="h-10 rounded-full border-transparent bg-muted/70 pr-9 pl-10 text-[15px] shadow-none transition-colors placeholder:text-muted-foreground/80 hover:bg-muted focus-visible:border-border focus-visible:bg-card focus-visible:ring-2 md:text-sm dark:bg-muted/50 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {props.query ? (
              <button
                type="button"
                aria-label="ძიების გასუფთავება"
                onClick={() => {
                  props.onQueryChange("");
                  inputRef.current?.focus();
                }}
                className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border bg-card px-1.5 font-mono text-[10px] text-muted-foreground md:inline-block">
                /
              </kbd>
            )}
          </div>
        )}

        <div className={cn("flex items-center gap-1", !isHome && "ml-auto")}>
          {!isHome && <Wordmark className="mr-2 hidden sm:inline-flex" />}
          <Button
            variant="ghost"
            size="sm"
            className="hidden rounded-full text-muted-foreground md:inline-flex"
            nativeButton={false}
            render={<Link href="/event" />}
          >
            <CalendarDays data-icon="inline-start" />
            ივენთი
          </Button>
          <ThemeToggle />
          <AddGameButton className="hidden md:inline-flex" />
        </div>
      </div>
    </header>
  );
}
