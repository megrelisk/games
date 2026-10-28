"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const noop = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // false on the server / first paint, true after hydration — no effect needed
  const mounted = React.useSyncExternalStore(noop, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={isDark ? "ღია რეჟიმზე გადართვა" : "მუქ რეჟიმზე გადართვა"}
      className={className}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunMedium className="size-[18px]" /> : <MoonStar className="size-[18px]" />}
    </Button>
  );
}
