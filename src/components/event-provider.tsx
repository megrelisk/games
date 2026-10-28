"use client";

import * as React from "react";

import {
  addProgramItem,
  addTodoItem,
  moveProgramItem,
  removeProgramItem,
  removeTodoItem,
  toggleTodoItem,
} from "@/lib/event-repository";
import { backend } from "@/lib/repository";
import type { EventRecord, Game } from "@/lib/types";

export interface EventContextValue {
  event: EventRecord;
  addActivity: (game: Game) => Promise<void>;
  removeActivity: (itemId: string) => Promise<void>;
  moveActivity: (index: number, direction: -1 | 1) => Promise<void>;
  addTodo: (category: string, label: string) => Promise<void>;
  toggleTodo: (itemId: string, done: boolean) => Promise<void>;
  removeTodo: (itemId: string) => Promise<void>;
}

const EventContext = React.createContext<EventContextValue | null>(null);

const OVERLAY_KEY = "gn:event-overlay:v1";

function saveOverlay(event: EventRecord) {
  if (backend !== "local") return;
  try {
    window.localStorage.setItem(OVERLAY_KEY, JSON.stringify(event));
  } catch {
    /* quota exceeded — keep session-only */
  }
}

function loadOverlay(): EventRecord | null {
  if (backend !== "local") return null;
  try {
    const raw = window.localStorage.getItem(OVERLAY_KEY);
    return raw ? (JSON.parse(raw) as EventRecord) : null;
  } catch {
    return null;
  }
}

export function EventProvider({
  initialEvent,
  children,
}: {
  initialEvent: EventRecord;
  children: React.ReactNode;
}) {
  const [event, setEvent] = React.useState<EventRecord>(initialEvent);

  React.useEffect(() => {
    const overlay = loadOverlay();
    if (overlay && overlay.id === initialEvent.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvent(overlay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = React.useCallback((next: EventRecord) => {
    setEvent(next);
    saveOverlay(next);
  }, []);

  const addActivity = React.useCallback<EventContextValue["addActivity"]>(
    async (game) => {
      const entry = await addProgramItem(event, game);
      commit({ ...event, program: [...event.program, entry] });
    },
    [commit, event],
  );

  const removeActivity = React.useCallback<EventContextValue["removeActivity"]>(
    async (itemId) => {
      const program = await removeProgramItem(itemId, event.program);
      commit({ ...event, program });
    },
    [commit, event],
  );

  const moveActivity = React.useCallback<EventContextValue["moveActivity"]>(
    async (index, direction) => {
      const program = await moveProgramItem(event.program, index, direction);
      commit({ ...event, program });
    },
    [commit, event],
  );

  const addTodo = React.useCallback<EventContextValue["addTodo"]>(
    async (category, label) => {
      const item = await addTodoItem(event, category, label);
      commit({ ...event, todos: [...event.todos, item] });
    },
    [commit, event],
  );

  const toggleTodo = React.useCallback<EventContextValue["toggleTodo"]>(
    async (itemId, done) => {
      await toggleTodoItem(itemId, done);
      commit({ ...event, todos: event.todos.map((t) => (t.id === itemId ? { ...t, done } : t)) });
    },
    [commit, event],
  );

  const removeTodo = React.useCallback<EventContextValue["removeTodo"]>(
    async (itemId) => {
      const todos = await removeTodoItem(itemId, event.todos);
      commit({ ...event, todos });
    },
    [commit, event],
  );

  const value = React.useMemo<EventContextValue>(
    () => ({ event, addActivity, removeActivity, moveActivity, addTodo, toggleTodo, removeTodo }),
    [event, addActivity, removeActivity, moveActivity, addTodo, toggleTodo, removeTodo],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent(): EventContextValue {
  const ctx = React.useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used within <EventProvider>");
  return ctx;
}
