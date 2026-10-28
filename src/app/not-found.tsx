import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader variant="detail" />
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-32 text-center md:px-8">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">404</p>
        <h1 className="mt-2 font-display text-5xl">აქ არაფერი არ არის.</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">გვერდი, რომელსაც ეძებდი, მაგიდიდან გაქრა.</p>
        <Button className="mt-6 rounded-full" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft data-icon="inline-start" />
          კოლექციასთან დაბრუნება
        </Button>
      </main>
    </>
  );
}
