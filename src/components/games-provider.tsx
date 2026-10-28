"use client";

import * as React from "react";

import {
  backend,
  createGameRecord,
  deleteDocumentRecord,
  deleteMediaRecord,
  persistFiles,
  setCoverUrl,
  updateGameRecord,
  type FileMeta,
  type PersistedFiles,
} from "@/lib/repository";
import type { Game, GameInput } from "@/lib/types";

export interface GamesContextValue {
  games: Game[];
  /** true once the local overlay (if any) has been merged on the client */
  ready: boolean;
  backend: "local" | "supabase";
  getGame: (idOrSlug: string) => Game | undefined;
  createGame: (input: GameInput, files?: File[], meta?: Record<string, FileMeta>) => Promise<Game>;
  updateGame: (id: string, input: GameInput, files?: File[], meta?: Record<string, FileMeta>) => Promise<Game>;
  addFiles: (gameId: string, files: File[], meta?: Record<string, FileMeta>) => Promise<PersistedFiles>;
  removeMedia: (gameId: string, mediaId: string) => Promise<void>;
  removeDocument: (gameId: string, docId: string) => Promise<void>;
  /** Make one of the game's uploaded images its cover. */
  setCover: (gameId: string, url: string) => Promise<void>;
}

const GamesContext = React.createContext<GamesContextValue | null>(null);

const OVERLAY_KEY = "gn:overlay:v1";

/** Local-mode persistence: created/edited games, minus ephemeral blob: URLs. */
function saveOverlay(games: Record<string, Game>) {
  if (backend !== "local") return;
  try {
    const cleaned: Record<string, Game> = {};
    for (const [id, g] of Object.entries(games)) {
      cleaned[id] = {
        ...g,
        cover_url: g.cover_url?.startsWith("blob:") ? null : g.cover_url,
        media: g.media.filter((m) => !m.url.startsWith("blob:")),
        documents: g.documents.filter((d) => !d.url.startsWith("blob:")),
      };
    }
    window.localStorage.setItem(OVERLAY_KEY, JSON.stringify(cleaned));
  } catch {
    /* quota exceeded — keep session-only */
  }
}

function loadOverlay(): Record<string, Game> {
  if (backend !== "local") return {};
  try {
    const raw = window.localStorage.getItem(OVERLAY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Game>) : {};
  } catch {
    return {};
  }
}

export function GamesProvider({
  initialGames,
  children,
}: {
  initialGames: Game[];
  children: React.ReactNode;
}) {
  const [games, setGames] = React.useState<Game[]>(initialGames);
  const [ready, setReady] = React.useState(false);
  const overlayRef = React.useRef<Record<string, Game>>({});

  // Merge local overlay after mount (avoids hydration mismatch). This is a
  // one-time sync from an external store (localStorage) — intentional.
  React.useEffect(() => {
    const overlay = loadOverlay();
    overlayRef.current = overlay;
    if (Object.keys(overlay).length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGames((prev) => {
        const byId = new Map(prev.map((g) => [g.id, g]));
        for (const g of Object.values(overlay)) byId.set(g.id, g);
        return Array.from(byId.values());
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  const commit = React.useCallback((next: Game) => {
    setGames((prev) => {
      const i = prev.findIndex((g) => g.id === next.id);
      if (i === -1) return [next, ...prev];
      const copy = prev.slice();
      copy[i] = next;
      return copy;
    });
    overlayRef.current = { ...overlayRef.current, [next.id]: next };
    saveOverlay(overlayRef.current);
  }, []);

  const getGame = React.useCallback(
    (idOrSlug: string) => games.find((g) => g.id === idOrSlug || g.slug === idOrSlug),
    [games],
  );

  const createGame = React.useCallback<GamesContextValue["createGame"]>(
    async (input, files = [], meta = {}) => {
      let game = await createGameRecord(input, games);
      if (files.length) {
        const { media, documents } = await persistFiles(game.id, files, meta);
        game = { ...game, media, documents };
        if (!game.cover_url) {
          const firstImage = media.find((m) => m.kind === "image");
          if (firstImage) {
            game = { ...game, cover_url: firstImage.url };
            await setCoverUrl(game.id, firstImage.url);
          }
        }
      }
      commit(game);
      return game;
    },
    [commit, games],
  );

  const updateGame = React.useCallback<GamesContextValue["updateGame"]>(
    async (id, input, files = [], meta = {}) => {
      const current = games.find((g) => g.id === id);
      if (!current) throw new Error("Game not found");
      let game = await updateGameRecord(current, input);
      if (files.length) {
        const { media, documents } = await persistFiles(game.id, files, meta);
        game = {
          ...game,
          media: [...game.media, ...media],
          documents: [...game.documents, ...documents],
        };
        if (!game.cover_url) {
          const firstImage = media.find((m) => m.kind === "image");
          if (firstImage) {
            game = { ...game, cover_url: firstImage.url };
            await setCoverUrl(game.id, firstImage.url);
          }
        }
      }
      commit(game);
      return game;
    },
    [commit, games],
  );

  const addFiles = React.useCallback<GamesContextValue["addFiles"]>(
    async (gameId, files, meta = {}) => {
      const current = games.find((g) => g.id === gameId);
      if (!current) throw new Error("Game not found");
      const result = await persistFiles(gameId, files, meta);
      let game: Game = {
        ...current,
        media: [...current.media, ...result.media],
        documents: [...current.documents, ...result.documents],
        updated_at: new Date().toISOString(),
      };
      if (!game.cover_url) {
        const firstImage = result.media.find((m) => m.kind === "image");
        if (firstImage) {
          game = { ...game, cover_url: firstImage.url };
          await setCoverUrl(game.id, firstImage.url);
        }
      }
      commit(game);
      return result;
    },
    [commit, games],
  );

  const removeMedia = React.useCallback<GamesContextValue["removeMedia"]>(
    async (gameId, mediaId) => {
      const current = games.find((g) => g.id === gameId);
      if (!current) return;
      await deleteMediaRecord(mediaId);
      commit({ ...current, media: current.media.filter((m) => m.id !== mediaId) });
    },
    [commit, games],
  );

  const removeDocument = React.useCallback<GamesContextValue["removeDocument"]>(
    async (gameId, docId) => {
      const current = games.find((g) => g.id === gameId);
      if (!current) return;
      await deleteDocumentRecord(docId);
      commit({ ...current, documents: current.documents.filter((d) => d.id !== docId) });
    },
    [commit, games],
  );

  const setCover = React.useCallback<GamesContextValue["setCover"]>(
    async (gameId, url) => {
      const current = games.find((g) => g.id === gameId);
      if (!current || current.cover_url === url) return;
      await setCoverUrl(gameId, url);
      commit({ ...current, cover_url: url, updated_at: new Date().toISOString() });
    },
    [commit, games],
  );

  const value = React.useMemo<GamesContextValue>(
    () => ({
      games,
      ready,
      backend,
      getGame,
      createGame,
      updateGame,
      addFiles,
      removeMedia,
      removeDocument,
      setCover,
    }),
    [games, ready, getGame, createGame, updateGame, addFiles, removeMedia, removeDocument, setCover],
  );

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}

export function useGames(): GamesContextValue {
  const ctx = React.useContext(GamesContext);
  if (!ctx) throw new Error("useGames must be used within <GamesProvider>");
  return ctx;
}
