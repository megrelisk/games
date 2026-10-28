import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GamesProvider } from "@/components/games-provider";
import { getGames } from "@/lib/data";

import "./globals.css";

const sans = Noto_Sans_Georgian({
  variable: "--font-sans",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Noto_Serif_Georgian({
  variable: "--font-display",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "თამაშების დროა — კოლექცია და წესები",
    template: "%s · თამაშების დროა",
  },
  description:
    "სამაგიდო, კარტის, ფურცლისა და წვეულების თამაშების საერთო კოლექცია — წესები, კომპონენტები, მედია და ფაილები, რედაქტირებადი მაგიდასთან ყველასთვის.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1b201d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const games = await getGames();

  return (
    <html
      lang="ka"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <GamesProvider initialGames={games}>{children}</GamesProvider>
          </TooltipProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
