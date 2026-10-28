"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Dices, LayoutGrid, Search } from "lucide-react";

import { AddGameButton } from "@/components/add-game-button";
import { useGames } from "@/components/games-provider";
import { cn } from "@/lib/utils";

function NavButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
        "active:bg-muted/60",
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { games } = useGames();
  const isHome = pathname === "/";

  const goHome = () => {
    if (isHome) window.scrollTo({ top: 0, behavior: "smooth" });
    else router.push("/");
  };

  const focusSearch = () => {
    if (!isHome) {
      router.push("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    const el = document.getElementById("game-search") as HTMLInputElement | null;
    setTimeout(() => el?.focus(), 250);
  };

  const surprise = () => {
    if (!games.length) return;
    const pick = games[Math.floor(Math.random() * games.length)];
    router.push(`/game/${pick.id}`);
  };

  return (
    <nav
      aria-label="მობილური ნავიგაცია"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 px-2 pt-2 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center">
        <NavButton label="კოლექცია" active={isHome} onClick={goHome}>
          <LayoutGrid className="size-5" strokeWidth={1.75} />
        </NavButton>
        <NavButton label="ძიება" onClick={focusSearch}>
          <Search className="size-5" strokeWidth={1.75} />
        </NavButton>
        <div className="-mt-7 flex flex-1 justify-center">
          <AddGameButton variant="fab" />
        </div>
        <NavButton label="ივენთი" active={pathname === "/event"} onClick={() => router.push("/event")}>
          <CalendarDays className="size-5" strokeWidth={1.75} />
        </NavButton>
        <NavButton label="სიურპრიზი" onClick={surprise}>
          <Dices className="size-5" strokeWidth={1.75} />
        </NavButton>
      </div>
    </nav>
  );
}
