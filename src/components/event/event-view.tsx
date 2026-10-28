"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronDown, ChevronUp, ListPlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AddActivityDialog } from "@/components/event/add-activity-dialog";
import { useEvent } from "@/components/event-provider";
import { CoverImage } from "@/components/cover-image";
import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatDuration, formatPlayers } from "@/lib/format";
import { cn } from "@/lib/utils";

const GEORGIAN_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

function formatEventDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${GEORGIAN_MONTHS[month - 1]}, ${year}`;
}

export function EventView() {
  const { event, removeActivity, moveActivity, addTodo, toggleTodo, removeTodo } = useEvent();
  const [addOpen, setAddOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("");

  const categories = React.useMemo(() => {
    const map = new Map<string, typeof event.todos>();
    for (const t of event.todos) {
      const key = t.category.trim() || "ზოგადი";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [event.todos]);

  const knownCategories = React.useMemo(
    () => Array.from(new Set(event.todos.map((t) => t.category.trim()).filter(Boolean))),
    [event.todos],
  );

  const submitTodo = async () => {
    const label = newLabel.trim();
    if (!label) return;
    try {
      await addTodo(newCategory, label);
      setNewLabel("");
    } catch (err) {
      console.error(err);
      toast.error("ვერ დაემატა. სცადე თავიდან.");
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    try {
      await moveActivity(index, direction);
    } catch (err) {
      console.error(err);
      toast.error("ვერ გადაინაცვლა.");
    }
  };

  const handleRemoveActivity = async (id: string) => {
    try {
      await removeActivity(id);
    } catch (err) {
      console.error(err);
      toast.error("ვერ წაიშალა.");
    }
  };

  const handleToggleTodo = async (id: string, done: boolean) => {
    try {
      await toggleTodo(id, done);
    } catch (err) {
      console.error(err);
      toast.error("ვერ განახლდა.");
    }
  };

  const handleRemoveTodo = async (id: string) => {
    try {
      await removeTodo(id);
    } catch (err) {
      console.error(err);
      toast.error("ვერ წაიშალა.");
    }
  };

  return (
    <>
      <SiteHeader variant="detail" />

      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-32 md:px-8 md:pt-10 md:pb-24">
        {/* Header */}
        <section className="animate-rise">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-felt uppercase">
            <Calendar className="size-3.5" strokeWidth={1.75} />
            {formatEventDate(event.event_date)}
          </p>
          <h1 className="font-display text-4xl leading-[0.98] tracking-tight text-balance sm:text-5xl">
            {event.title}
          </h1>
        </section>

        {/* Program */}
        <section className="animate-rise mt-10">
          <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
            <h2 className="font-display text-2xl tracking-tight">
              პროგრამა{" "}
              {event.program.length > 0 && (
                <span className="font-sans text-sm text-muted-foreground tabular-nums">{event.program.length}</span>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)} className="rounded-full text-muted-foreground">
              <ListPlus data-icon="inline-start" />
              აქტივობის დამატება
            </Button>
          </div>

          {event.program.length === 0 ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-4 flex w-full flex-col items-center rounded-2xl border border-dashed border-border py-10 text-center transition-colors hover:bg-muted/40"
            >
              <ListPlus className="mb-2 size-5 text-muted-foreground" strokeWidth={1.5} />
              <p className="font-display text-lg">პროგრამა ჯერ ცარიელია.</p>
              <p className="text-xs text-muted-foreground">აირჩიე პირველი აქტივობა კოლექციიდან.</p>
            </button>
          ) : (
            <ol className="mt-4 space-y-2">
              {event.program.map((entry, i) => (
                <li
                  key={entry.id}
                  className="group/prog flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-felt-soft font-display text-sm text-felt tabular-nums">
                    {i + 1}
                  </span>
                  <div className="size-11 shrink-0 overflow-hidden rounded-lg">
                    <CoverImage
                      src={entry.game.cover_url}
                      title={entry.game.title}
                      category={entry.game.category}
                      sizes="44px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/game/${entry.game.id}`}
                      className="truncate text-sm font-medium hover:text-felt hover:underline underline-offset-2"
                    >
                      {entry.game.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatPlayers(entry.game.min_players, entry.game.max_players)} ·{" "}
                      {formatDuration(entry.game.duration_minutes)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/prog:opacity-100 focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="ზემოთ გადატანა"
                      disabled={i === 0}
                      onClick={() => handleMove(i, -1)}
                      className="text-muted-foreground"
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="ქვემოთ გადატანა"
                      disabled={i === event.program.length - 1}
                      onClick={() => handleMove(i, 1)}
                      className="text-muted-foreground"
                    >
                      <ChevronDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${entry.game.title}-ის წაშლა პროგრამიდან`}
                      onClick={() => handleRemoveActivity(entry.id)}
                      className="text-muted-foreground"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* To-do list */}
        <section className="animate-rise mt-10">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-2xl tracking-tight">
              თუ-დუ ლისტი{" "}
              {event.todos.length > 0 && (
                <span className="font-sans text-sm text-muted-foreground tabular-nums">{event.todos.length}</span>
              )}
            </h2>
          </div>

          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">სია ჯერ ცარიელია.</p>
          ) : (
            <div className="mt-4 space-y-5">
              {categories.map(([category, items]) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    {category}
                  </p>
                  <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                    {items.map((t) => (
                      <li key={t.id} className="group/todo flex items-center gap-3 px-3 py-2.5">
                        <Checkbox
                          checked={t.done}
                          onCheckedChange={(v) => handleToggleTodo(t.id, Boolean(v))}
                          className="size-[18px] rounded-[6px] data-checked:border-felt data-checked:bg-felt"
                        />
                        <span
                          className={cn(
                            "flex-1 text-[15px] leading-snug",
                            t.done && "text-muted-foreground line-through decoration-felt/60",
                          )}
                        >
                          {t.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${t.label}-ის წაშლა`}
                          onClick={() => handleRemoveTodo(t.id)}
                          className="text-muted-foreground opacity-0 transition-opacity group-hover/todo:opacity-100 focus-visible:opacity-100"
                        >
                          <X />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Add todo */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitTodo();
                }
              }}
              placeholder="ახალი დავალება…"
              className="h-10 flex-1"
            />
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitTodo();
                }
              }}
              list="event-todo-categories"
              placeholder="კატეგორია (არასავალდებულო)"
              className="h-10 sm:w-56"
            />
            <datalist id="event-todo-categories">
              {knownCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Button variant="outline" className="h-10 shrink-0" onClick={submitTodo} disabled={!newLabel.trim()}>
              <Plus data-icon="inline-start" />
              დამატება
            </Button>
          </div>
        </section>
      </main>

      <AddActivityDialog open={addOpen} onOpenChange={setAddOpen} />
      <MobileNav />
    </>
  );
}
