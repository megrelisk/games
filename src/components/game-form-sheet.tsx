"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { FileDropzone } from "@/components/file-dropzone";
import { useGames } from "@/components/games-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIsDesktop } from "@/hooks/use-media-query";
import { complexityLabel, uid } from "@/lib/format";
import type { FileMeta } from "@/lib/repository";
import { CATEGORIES, type CategorySlug, type ComponentItem, type Game, type GameInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_ITEMS = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.label]));

interface FormState {
  title: string;
  tagline: string;
  category: CategorySlug;
  tags: string;
  min_players: string;
  max_players: string;
  duration_minutes: string;
  min_age: string;
  complexity: number | null;
  cover_url: string;
  rules_md: string;
  setup_md: string;
  notes_md: string;
  components: ComponentItem[];
}

const EMPTY: FormState = {
  title: "",
  tagline: "",
  category: "board",
  tags: "",
  min_players: "2",
  max_players: "4",
  duration_minutes: "30",
  min_age: "",
  complexity: null,
  cover_url: "",
  rules_md: "",
  setup_md: "",
  notes_md: "",
  components: [],
};

function fromGame(g: Game): FormState {
  return {
    title: g.title,
    tagline: g.tagline ?? "",
    category: g.category,
    tags: g.tags.join(", "),
    min_players: String(g.min_players),
    max_players: String(g.max_players),
    duration_minutes: String(g.duration_minutes),
    min_age: g.min_age ? String(g.min_age) : "",
    complexity: g.complexity ?? null,
    cover_url: g.cover_url && !g.cover_url.startsWith("data:") && !g.cover_url.startsWith("blob:") ? g.cover_url : "",
    rules_md: g.rules_md,
    setup_md: g.setup_md ?? "",
    notes_md: g.notes_md ?? "",
    components: g.components,
  };
}

function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface GameFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  game?: Game;
  onSaved?: (game: Game) => void;
}

/**
 * Sheet shell. The popup unmounts when closed, so `GameFormBody` (which owns
 * all form state) starts fresh on every open — no reset effects needed.
 */
export function GameFormSheet({ open, onOpenChange, mode, game, onSaved }: GameFormSheetProps) {
  const isDesktop = useIsDesktop();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "gap-0 p-0",
          isDesktop
            ? "w-full sm:max-w-xl"
            : "h-[94dvh] rounded-t-3xl border-t-0 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)]",
        )}
      >
        <GameFormBody
          isDesktop={isDesktop}
          onOpenChange={onOpenChange}
          mode={mode}
          game={game}
          onSaved={onSaved}
        />
      </SheetContent>
    </Sheet>
  );
}

function GameFormBody({
  isDesktop,
  onOpenChange,
  mode,
  game,
  onSaved,
}: Omit<GameFormSheetProps, "open"> & { isDesktop: boolean }) {
  const router = useRouter();
  const { createGame, updateGame } = useGames();

  const [form, setForm] = React.useState<FormState>(() =>
    mode === "edit" && game ? fromGame(game) : EMPTY,
  );
  const [files, setFiles] = React.useState<File[]>([]);
  const [meta, setMeta] = React.useState<Record<string, FileMeta>>({});
  const [newItem, setNewItem] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addComponent = () => {
    const label = newItem.trim();
    if (!label) return;
    // "6x Dice" / "Dice ×6" style shorthand → qty
    const m = label.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    const item: ComponentItem = m
      ? { id: uid("c"), label: m[2].trim(), qty: m[1] }
      : { id: uid("c"), label };
    set("components", [...form.components, item]);
    setNewItem("");
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "მიუთითე სახელი.";
    const min = Number(form.min_players);
    const max = Number(form.max_players);
    if (!Number.isInteger(min) || min < 1) e.min_players = "მინ. მოთამაშეები ≥ 1";
    if (!Number.isInteger(max) || max < min) e.max_players = "მაქს. უნდა იყოს ≥ მინ.";
    const dur = Number(form.duration_minutes);
    if (!Number.isFinite(dur) || dur <= 0) e.duration_minutes = "წუთები > 0";
    if (!form.rules_md.trim()) e.rules_md = "ორიოდე სტრიქონიც კმარა.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("რამდენიმე ველს ყურადღება სჭირდება.");
      return;
    }
    const input: GameInput = {
      title: form.title,
      tagline: form.tagline,
      category: form.category,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      min_players: Number(form.min_players),
      max_players: Number(form.max_players),
      duration_minutes: Number(form.duration_minutes),
      min_age: form.min_age ? Number(form.min_age) : null,
      complexity: form.complexity,
      cover_url: form.cover_url.trim() || null,
      rules_md: form.rules_md,
      setup_md: form.setup_md,
      notes_md: form.notes_md,
      components: form.components,
    };

    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createGame(input, files, meta);
        toast.success(`"${created.title}" კოლექციაშია.`);
        onOpenChange(false);
        onSaved?.(created);
        router.push(`/game/${created.id}`);
      } else if (game) {
        const updated = await updateGame(game.id, input, files, meta);
        toast.success("შენახულია.");
        onOpenChange(false);
        onSaved?.(updated);
      }
    } catch (err) {
      console.error(err);
      toast.error("ვერ შეინახა. სცადე თავიდან.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        {/* grab handle on mobile */}
        {!isDesktop && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-foreground/15" />}

        <SheetHeader className="flex-row items-start justify-between gap-4 px-5 pt-4 pb-3 md:px-7 md:pt-6">
          <div>
            <SheetTitle className="font-display text-2xl font-normal tracking-tight md:text-3xl">
              {mode === "create" ? "თამაშის დამატება" : `${game?.title ?? "თამაშის"}-ის რედაქტირება`}
            </SheetTitle>
            <SheetDescription>
              {mode === "create"
                ? "ანგარიში არ სჭირდება — პირდაპირ კოლექციაში გამოქვეყნდება."
                : "ცვლილებები ყველასთვის მაშინვე გამოჩნდება, როგორც კი შეინახავ."}
            </SheetDescription>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="დახურვა" onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-7">
          <div className="space-y-7">
            {/* Basics */}
            <section className="space-y-4">
              <Field label="სახელი" htmlFor="gf-title">
                <Input
                  id="gf-title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="მაგ. Codenames"
                  aria-invalid={Boolean(errors.title)}
                  className="h-10 text-base"
                  autoFocus={isDesktop}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </Field>
              <Field label="მოკლე აღწერა" htmlFor="gf-tagline" hint="ერთი სტრიქონი, რომელიც დააინტერესებს.">
                <Input
                  id="gf-tagline"
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="ერთი სიტყვა. სამი აგენტი. მკვლელს ნუ შეეხები."
                  className="h-10"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="კატეგორია">
                  <Select
                    value={form.category}
                    items={CATEGORY_ITEMS}
                    onValueChange={(v) => v && set("category", v as CategorySlug)}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="თეგები" htmlFor="gf-tags" hint="მძიმით გამოყოფილი">
                  <Input
                    id="gf-tags"
                    value={form.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="ბლეფი, სწრაფი"
                    className="h-10"
                  />
                </Field>
              </div>
            </section>

            {/* Specs */}
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="მინ. მოთამაშე" htmlFor="gf-min">
                  <Input
                    id="gf-min"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={form.min_players}
                    onChange={(e) => set("min_players", e.target.value)}
                    aria-invalid={Boolean(errors.min_players)}
                    className="h-10"
                  />
                </Field>
                <Field label="მაქს. მოთამაშე" htmlFor="gf-max">
                  <Input
                    id="gf-max"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={form.max_players}
                    onChange={(e) => set("max_players", e.target.value)}
                    aria-invalid={Boolean(errors.max_players)}
                    className="h-10"
                  />
                </Field>
                <Field label="წუთი" htmlFor="gf-dur">
                  <Input
                    id="gf-dur"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(e) => set("duration_minutes", e.target.value)}
                    aria-invalid={Boolean(errors.duration_minutes)}
                    className="h-10"
                  />
                </Field>
                <Field label="ასაკი" htmlFor="gf-age">
                  <Input
                    id="gf-age"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={form.min_age}
                    onChange={(e) => set("min_age", e.target.value)}
                    placeholder="8+"
                    className="h-10"
                  />
                </Field>
              </div>
              {(errors.min_players || errors.max_players || errors.duration_minutes) && (
                <p className="text-xs text-destructive">
                  {errors.min_players ?? errors.max_players ?? errors.duration_minutes}
                </p>
              )}
              <Field label="სირთულე">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={form.complexity === n}
                      onClick={() => set("complexity", form.complexity === n ? null : n)}
                      className={cn(
                        "h-9 flex-1 rounded-lg border text-sm transition-colors",
                        form.complexity === n
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="w-24 pl-2 text-xs text-muted-foreground">
                    {complexityLabel(form.complexity)}
                  </span>
                </div>
              </Field>
            </section>

            {/* Text */}
            <section className="space-y-2">
              <Tabs defaultValue="rules">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    წესები და გზამკვლევი
                  </Label>
                  <TabsList variant="line" className="h-8">
                    <TabsTrigger value="rules">წესები</TabsTrigger>
                    <TabsTrigger value="setup">მომზადება</TabsTrigger>
                    <TabsTrigger value="notes">შენიშვნები</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="rules">
                  <Textarea
                    value={form.rules_md}
                    onChange={(e) => set("rules_md", e.target.value)}
                    placeholder={"## მიზანი\nიყავი პირველი, ვინც…\n\n## შენს სვლაზე\n1. ააგდე კამათელი\n2. გადაადგილდი\n3. შეასრულე მოქმედება"}
                    rows={9}
                    aria-invalid={Boolean(errors.rules_md)}
                    className="min-h-40 text-[14px] leading-relaxed"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    მხარდაჭერილია Markdown — სათაურები, სიები, ცხრილები, **გამუქება**.
                    {errors.rules_md && <span className="ml-2 text-destructive">{errors.rules_md}</span>}
                  </p>
                </TabsContent>
                <TabsContent value="setup">
                  <Textarea
                    value={form.setup_md}
                    onChange={(e) => set("setup_md", e.target.value)}
                    placeholder={"1. აურიე…\n2. დაურიგე 7 ბარათი თითოეულს…"}
                    rows={9}
                    className="min-h-40 text-[14px] leading-relaxed"
                  />
                </TabsContent>
                <TabsContent value="notes">
                  <Textarea
                    value={form.notes_md}
                    onChange={(e) => set("notes_md", e.target.value)}
                    placeholder="შინაური წესები, ვარიაციები, ვინ იგებს ყოველთვის…"
                    rows={9}
                    className="min-h-40 text-[14px] leading-relaxed"
                  />
                </TabsContent>
              </Tabs>
            </section>

            {/* Components */}
            <section className="space-y-2">
              <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                კომპონენტების ჩეკლისტი
              </Label>
              {form.components.length > 0 && (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {form.components.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 py-1.5 pr-1 pl-3 text-sm">
                      <span className="flex-1 truncate">{c.label}</span>
                      {c.qty && <span className="font-mono text-xs text-muted-foreground">×{c.qty}</span>}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${c.label}-ის წაშლა`}
                        onClick={() => set("components", form.components.filter((x) => x.id !== c.id))}
                        className="text-muted-foreground"
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addComponent();
                    }
                  }}
                  placeholder="მაგ. 5x კამათელი, საანგარიშო ფურცელი, ტაიმერი…"
                  className="h-10"
                />
                <Button variant="outline" className="h-10 shrink-0" onClick={addComponent} disabled={!newItem.trim()}>
                  <Plus data-icon="inline-start" />
                  დამატება
                </Button>
              </div>
            </section>

            {/* Files */}
            <section className="space-y-2">
              <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                ფოტოები, კლიპები, ხმოვანი ჩანაწერები და ფაილები
              </Label>
              <FileDropzone files={files} onChange={setFiles} meta={meta} onMetaChange={setMeta} compact />
              <Field label="ყდის სურათის ბმული" htmlFor="gf-cover" hint="არასავალდებულოა — თუ ცარიელია, პირველი ატვირთული ფოტო გახდება ყდა.">
                <Input
                  id="gf-cover"
                  value={form.cover_url}
                  onChange={(e) => set("cover_url", e.target.value)}
                  placeholder="https://…"
                  className="h-10"
                />
              </Field>
            </section>
          </div>
        </div>

        <div className="safe-bottom flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card/60 px-5 pt-3 md:px-7 md:pb-5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            გაუქმება
          </Button>
          <Button size="lg" onClick={submit} disabled={saving} className="rounded-full px-5">
            {saving ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <Plus data-icon="inline-start" />
            )}
            {saving ? "იქვეყნება…" : mode === "create" ? "გამოქვეყნება" : "შენახვა"}
          </Button>
        </div>
    </>
  );
}
