import type { Metadata } from "next";

import { GameDetailView } from "@/components/game/game-detail-view";
import { getGame } from "@/lib/data";
import { formatDuration, formatPlayers } from "@/lib/format";
import { categoryLabel } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return { title: "თამაში" };
  return {
    title: game.title,
    description:
      game.tagline ??
      `${categoryLabel(game.category)} · ${formatPlayers(game.min_players, game.max_players)} მოთამაშე · ${formatDuration(game.duration_minutes)}`,
    openGraph: game.cover_url ? { images: [{ url: game.cover_url }] } : undefined,
  };
}

export default async function GamePage({ params }: Params) {
  const { id } = await params;
  const game = await getGame(id);
  return <GameDetailView id={id} initialGame={game} />;
}
