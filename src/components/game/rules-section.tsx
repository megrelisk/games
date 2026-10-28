"use client";

import { BookOpen, Hammer, Pencil, StickyNote } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Game } from "@/lib/types";

export function RulesSection({ game, onEdit }: { game: Game; onEdit: () => void }) {
  const hasSetup = Boolean(game.setup_md?.trim());
  const hasNotes = Boolean(game.notes_md?.trim());

  return (
    <section id="rules" className="animate-rise stagger-2 scroll-mt-24">
      <Tabs defaultValue="rules" className="gap-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-3xl tracking-tight">როგორ ვითამაშოთ</h2>
          <div className="flex items-center gap-2">
            <TabsList variant="line" className="h-9">
              <TabsTrigger value="rules">
                <BookOpen data-icon="inline-start" />
                წესები
              </TabsTrigger>
              {hasSetup && (
                <TabsTrigger value="setup">
                  <Hammer data-icon="inline-start" />
                  მომზადება
                </TabsTrigger>
              )}
              {hasNotes && (
                <TabsTrigger value="notes">
                  <StickyNote data-icon="inline-start" />
                  შენიშვნები
                </TabsTrigger>
              )}
            </TabsList>
            <Button variant="ghost" size="sm" onClick={onEdit} className="rounded-full text-muted-foreground">
              <Pencil data-icon="inline-start" />
              რედაქტირება
            </Button>
          </div>
        </div>

        <TabsContent value="rules" className="pt-6">
          {game.rules_md.trim() ? (
            <Markdown>{game.rules_md}</Markdown>
          ) : (
            <EmptyText onEdit={onEdit} label="წესები ჯერ არ არის დაწერილი." />
          )}
        </TabsContent>
        {hasSetup && (
          <TabsContent value="setup" className="pt-6">
            <Markdown>{game.setup_md!}</Markdown>
          </TabsContent>
        )}
        {hasNotes && (
          <TabsContent value="notes" className="pt-6">
            <Markdown>{game.notes_md!}</Markdown>
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}

function EmptyText({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="font-display text-xl">{label}</p>
      <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={onEdit}>
        დაწერე
      </Button>
    </div>
  );
}
