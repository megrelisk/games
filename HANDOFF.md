# HANDOFF — „თამაშების დროა" (Games Time)

დაწერილია ახალ ექაუნთზე/სესიაზე გადასასვლელად. ეს ფაილი ყველაფერს გიყვება: რა არის პროექტი, რა გაკეთდა, როგორ მუშაობს და რა წესებით ვმუშაობდით.

> **პირველი ნაბიჯი ახალ სესიაში:** წაიკითხე ეს ფაილი, `AGENTS.md` (Next.js 16 განსხვავდება ცნობილისგან — წაიკითხე `node_modules/next/dist/docs/` კოდის წერამდე) და `README.md`.

---

## 1. რა არის პროექტი

ქართულენოვანი წვეულების თამაშების კოლექცია და წესების ჰაბი ივენტისთვის **„13 სექტემბერი — სოსოს თამაშები"**. ყველაფერი ქართულადაა (მხოლოდ თამაშების სათაურებია ინგლისურად). რედაქტირება შეუძლია ნებისმიერს ბმულით, ლოგინის გარეშე.

- **საიტის სახელი:** „თამაშების დროა" (ადრე „თამაშების საღამო" იყო — გადარქმეულია).
- **მთავარ გვერდზე** ინტრო-ტექსტის ბლოკი არ არის (მოთხოვნით წაშლილია).
- **ამჟამად ბაზაში: 93 თამაში.**

## 2. ტექნოლოგიები

| რა | დეტალი |
|---|---|
| ფრეიმვორქი | **Next.js 16.3.2** (App Router, Turbopack), React 19, TypeScript |
| სტილი | Tailwind v4 (`@theme inline`, `@plugin "@tailwindcss/typography"`), კლასი `.rules-prose` |
| UI | shadcn/ui **base-nova** სტილი, აგებულია **@base-ui/react**-ზე (არა Radix!) |
| ხატულები | Lucide |
| ბაზა | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) |
| შრიფტები | Noto Serif Georgian (`--font-display`), Noto Sans Georgian (`--font-sans`), JetBrains Mono (მხოლოდ ლათინური) |
| `<html lang>` | `ka` |

### base-ui-ს ნიუანსები (მნიშვნელოვანია)
- `render` prop პატერნი; Button, რომელიც `<a>`/`Link`-ად ირენდერება, **აუცილებლად** `nativeButton={false}`-ით.
- `onCheckedChange`, `onValueChange`; Select-ს სჭირდება `items` map.
- **არასოდეს** ჩასვა ქართული ტექსტი `font-mono` ელემენტში (JetBrains Mono ქართულს არ შეიცავს).

## 3. გარემო და გაშვება

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npx tsc --noEmit -p .
npm run build
```

- **`.env.local`** (რეპოში არ არის გაზიარებული — **გასაღები არასოდეს დაბეჭდო ჩატში**):
  - `NEXT_PUBLIC_SUPABASE_URL=https://gkkumcbfubvrouovbbcf.supabase.co` (მხოლოდ ბეის URL, **`/rest/v1/`-ის გარეშე**)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- Claude Code-ის dev სერვერი: `.claude/launch.json` → სახელი `games-night-dev`, პორტი 3000. თუ პორტი დაკავებულია (მომხმარებელს შეიძლება უკვე ჰქონდეს გაშვებული), უბრალოდ `navigate` `http://localhost:3000`-ზე.
- გარემოს ვარიანტები: Supabase ცვლადების გარეშე აპი **local რეჟიმში** მუშაობს (mock-data + localStorage). ცვლადებით — რეალური ბაზა.

## 4. კოდის რუკა

| გზა | რა არის |
|---|---|
| `src/app/page.tsx` → `components/home-view.tsx` | მთავარი: ძებნა, კატეგორიის ჩიპები, ფილტრები, ბარათების ბადე |
| `src/app/game/[id]/page.tsx` → `components/game/game-detail-view.tsx` | თამაშის გვერდი: ჰერო, წესები/მოწყობა/შენიშვნები (Markdown ტაბები), კომპონენტების ჩეკლისტი, გალერეა + lightbox, ვიდეო, აუდიო, დოკუმენტები |
| `src/components/game/media-gallery.tsx` | გალერეა; lightbox-ში ღილაკი **„ყდად დაყენება"**, ბარათზე ნიშანი **„ყდა"** |
| `src/components/game/video-player.tsx` | YouTube iframe (`watch`/`youtu.be`/`shorts`/`embed`), **მხარს უჭერს `t=` დროის ნიშნულს** (`?start=N`); Shorts — ვერტიკალური, სხვა — `aspect-video` |
| `src/components/games-provider.tsx` | კლიენტის სტეიტი: `games, createGame, updateGame, addFiles, removeMedia, removeDocument, setCover` |
| `src/app/event/` + `components/event/event-view.tsx` | **ივენთის გვერდი** (`/event`): პროგრამის ბილდერი (თამაშების არჩევა, რიგითობა, ზევით/ქვევით, წაშლა) + თუდუ-ლისტი კატეგორიებად |
| `src/lib/mock-data.ts` | **92+ თამაშის წყარო** — `MOCK_GAMES` (იხ. ქვემოთ „მონაცემების მოდელი") |
| `src/lib/event-mock-data.ts` | ივენთის საწყისი მონაცემები |
| `src/lib/data.ts` | სერვერული წაკითხვა; Supabase-ის შეცდომისას fallback mock-ზე |
| `src/lib/repository.ts` | ჩაწერა + ატვირთვა (`backend = "supabase" \| "local"`), `setCoverUrl(...)` |
| `src/lib/event-repository.ts` | ივენთის ჩაწერა (`moveProgramItem` upsert-ში ყველა NOT NULL ველი გადაეცემა) |
| `src/lib/filters.ts` | კლიენტის ძებნა: სათაური > სიტყვის პრეფიქსი > ქვესტრიქონი > თეგი/კატეგორია > tagline/წესები |
| `src/lib/types.ts` | ტიპები + 6 კატეგორია: `board, card, sheet, party, dice, word` |
| `supabase/schema.sql` | ცხრილები `games, media_files, attached_documents, events, event_program_items, todo_items`; ღია RLS; 4 საჯარო ბაკეტი `game-images, game-videos, game-audio, game-docs` (**უკვე გაშვებულია ბაზაში**) |
| `scripts/seed.ts` | mock-data → ბაზა (იხ. ქვემოთ) |
| `scripts/upload-screens.ts` | ნუმერირებული სქრინების ატვირთვა ბაკეტში |
| `next.config.ts` | `remotePatterns`: images.unsplash.com, *.supabase.co, *.supabase.in, i.pinimg.com, drive.usercontent.google.com, drive.google.com, i.ytimg.com |

## 5. მონაცემების მოდელი და mock-data-ს პატერნები

თითო თამაში (`Game`): `id, slug, title, tagline, category, tags[], min/max_players, duration_minutes, min_age, complexity (1–5), cover_url, rules_md, setup_md, notes_md, components[], media[], documents[]`.

`mock-data.ts`-ის დამხმარე ფუნქციები:
- `u(id)` — Unsplash URL.
- `t(daysAgo)` — თარიღი.
- `s(slug, n)` — ატვირთული სქრინი: `…/game-images/screens/<slug>/NN.jpg`.
- `shots(gameId, slug, captions[])` — გალერეის ჩანაწერები სქრინებისთვის (`null` = წარწერის გარეშე).
- `yt(gameId, videoId, startSeconds, title, caption)` — YouTube კლიპი დროის ნიშნულით.
- კონსტანტები სრული სეზონებისთვის: `TT_S1..TT_S5` (ИМПРОКОМ-ის არხის ვიდეოების ID-ები).

### წესები ტექსტებისთვის
- ქართული ბრჭყალები TS სტრინგებში: **„…"** (U+201E/U+201C), არასდროს ASCII `"` `"…"` სტრინგის შიგნით (TS1002 შეცდომას იძლევა).
- `Intl.DateTimeFormat("ka-GE")` ამ გარემოში არ მუშაობს — თვეები ხელით მასივშია.
- ყოველი ახალი თამაში: Markdown წესები სექციებით (მიზანი / მოსამზადებელი / როგორ ვითამაშოთ / ვარიანტები / რჩევა), `components[]`, თეგები, ფასი: ქართულად.

## 6. Seed-ის წესები (ძალიან მნიშვნელოვანი)

```bash
npm run seed            # ახალი თამაშები + (additive) backfill
npm run seed -- --sync  # ძალით გადააწერს არსებულ რიგებს mock-data-დან
```

- **ნაგულისხმევად არსებულ რიგებს არ ეხება** — ცოცხალი რედაქტირებები (სახელები, წესები, ყდები, რომლებიც საიტიდან შეიცვალა) დაცულია. (მაგ. „Truth or Lie" ცოცხლად გადარქმეულია „Deceive your opponent"-ად.)
- **ერთადერთი additive გამონაკლისი:** ახალი გალერეის სურათები (URL-ით, რომელიც რიგში ჯერ არ არის) და ცარიელი ყდა ივსება.
- ივენთის პროგრამა და თუდუები მხოლოდ პირველად შექმნისას ითესება.
- **თუ თამაშის კონტენტი mock-data-ში შეცვალე და ბაზაში უკვე არსებობს:** ან `--sync`, ან რიგის წაშლა REST-ით და ხელახალი seed:
  ```bash
  set -a; . ./.env.local; set +a
  curl -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/games?slug=eq.<slug>" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ```
  (cascade-ით media/docs იშლება).

## 7. სურათების ატვირთვა

საქაღალდე: `adding games screens/` (ფაილები `N.jpg`, `N (1).jpg`, `N (2).jpg`… — N არის ჯგუფის ნომერი).

```bash
npx tsx scripts/upload-screens.ts <slug>=<ჯგუფი> [<slug>=<ჯგუფი> …]
SCREENS_DIR="<სხვა საქაღალდე>" npx tsx scripts/upload-screens.ts …
```

- ჩაიწერება `game-images/screens/<slug>/01.jpg, 02.jpg…`; `N.jpg` პირველია. ძველი ზედმეტი ფაილები იშლება.
- ⚠️ ობიექტებს **1 წლიანი cache** აქვთ — **იგივე გზაზე სურათის ჩანაცვლება** CDN/Next-optimizer-ში ძველს ტოვებს. სურათების შესაცვლელად გამოიყენე **ახალი slug-საქაღალდე** და გადააბი mock-data (მაგ. `second-take-prank`).
- ჯგუფის არგუმენტი **რიცხვი** უნდა იყოს; სხვა პაკეტებისთვის ფაილები დროებით გადაარქვი ნუმერაციაზე.
- SVG-ს ბაკეტი/Next Image პირდაპირ არ იღებს — `sharp`-ით გადაიყვანე JPG-ში (`node_modules/sharp` უკვე არის, rsvg-ით).
- Google Drive სურათები: `https://drive.usercontent.google.com/download?id=<ID>&export=view&authuser=0`.

## 8. რა გაკეთდა — ქრონოლოგია

1. **საწყისი აგება:** მთავარი ბადე + ძებნა/ჩიპები/ფილტრები; თამაშის გვერდი (ტაბები, ჩეკლისტი, გალერეა + lightbox, ვიდეო, აუდიო, დოკუმენტები); დამატება/რედაქტირების sheet მულტი-ატვირთვით; Supabase ცხრილები და ბაკეტები; კლიენტის ფილტრაცია.
2. **ქართულიზაცია:** მთელი საიტი ქართულად, ტესტ-თამაშები წაშლილია, მონაცემები რეალური ბაზიდან.
3. **პირველი რეალური თამაშები** მომხმარებლის ლინკებით/სურათებით, წესების გადაწერა საიტის სტილში.
4. **Supabase-ის დაკავშირება + პირველი seed.** ბრენდის გადარქმევა („თამაშების დროა"), ჰერო-ინტროს წაშლა.
5. **ივენთის გვერდი** (`/event`): პროგრამის ბილდერი + თუდუ-ლისტი; კატეგორია „კონტენტკრეატორის თასქები", დავალება „რატომ გადაწყვიტეთ მონაწილეობა?".
6. **თამაშების ტალღები** (რუსულიდან/ინგლისურიდან ქართულად): Short RAM, Funny Words, Answer The F***ing Question, Mental Connection, Whitney Houston, Wrong Answer Is Correct Answer (70 კითხვა), Make The Face, Don't Squat, Screaming Run, Music Contest (20 სიმღერა), Protect The President, Unique Number, **Secret Task** (50 ზრდასრულთა + 50 ბავშვთა + 30 გამოწვევა), Not First Not Last, Phone Call, Lever, Sticker Duel (ბუტაფორიული დანის ალტერნატივები), Three Boxes, Truth or Lie, The Final Button.
7. **ყდის არჩევა გალერეიდან** — `setCover` (provider), `coverUrl`/`onSetCover` (gallery), toasts; ტესტირებულია ცოცხალ ბაზაზე. **Seed-ის დაცვა** (`--sync` opt-in).
8. **სქრინების ტალღა 1–22** (`adding games screens/`): Yoga Challenge, Two Hands, Second Take, Perfect Cut, Kangaroo Toss, Words Are Hard, Boomer vs Gen Z, Follow the Move, Cheers to the Governor, Party Blower Duel, Cup Drop, Clap on the Drop, Password, Fan the Fish, Wink Murder, Name Duel, Human Slot Machine, Charades, Hot & Cold Mission, Rebus Cipher. Protect The President-ს და Screaming Run-ს სურათები backfill-ით მიემატა. (მე-16 ჯგუფის წესები შეცდომით ყოფილა მე-3-ზე — გასწორდა; Second Take-ის სურათები გადატანილია საქაღალდეში `second-take-prank`.)
9. **სეზონები „თეიბლ თაიმი"** (რუსული შოუ Тейбл Тайм, ИМПРОКОМ) — **40 თამაში**, ყველას თეგები **`Table Time`** + `სეზონი N` + ტიპის თეგები (კარტით სათამაშო, კამათელი, სიტყვები…):
   - **I სეზონი (8):** Bonjour Madame, The Hat, Perudo, Russian Lotto, Password*, Cheat, Kubiki, Chapaev. (*Password წინა ტალღიდან იყო — თეგები/ვიდეო მიემატა.) რეალური კადრები არ არის → ყდა ცარიელია (კატეგორიის პლეისჰოლდერი).
   - **II სეზონი (8):** Sound Quiz, Memo, Buttons, King & Scum, Contact, Palma, Shagai Naadan, Odd or Even — რეალური კადრები (3-3).
   - **III სეზონი (8):** Magnet Garden, Treasure Chests, By Touch, Draw the Movie, Match Cards, Shut the Box, Letter Rush, Stone Tower — რეალური კადრები.
   - **IV სეზონი (8):** Four Questions, Hundred Cells, The Heap, Two Words, Find the Number, Not Tic-Tac-Toe, Horse Race, Coalition.
   - **V სეზონი (8, კოოპერატიული):** Coalition II, How I See It, Yahtzee, Tabletime, Silhouette, The Blow, Hot or Cold, The Puzzle.
   - IV და V სეზონის სურათები **AI-გენერირებული ვექტორული ილუსტრაციებია** (არა რეალური კადრები) — ყოველ თამაშს ამის შენიშვნა `notes_md`-ში აქვს. Coalition = Coalition II მექანიკით (The Mind-ის მსგავსი) — ამიტომ ორი ცალკე slug.
   - ყოველ თამაშს აბმული აქვს **YouTube კლიპი ზუსტი დროის ნიშნულით** (სეზონის სრული ვიდეო; თავები ამოღებულია ვიდეოს აღწერიდან).

### YouTube ვიდეოები (ИМПРОКОМ)
| სეზონი | Video ID |
|---|---|
| I | `om6nokYjYFw` |
| II | `oK8paUMVhgM` |
| III | `LWGIRs5P26U` |
| IV | `TAAYHwq33I4` |
| V | `7MZZWt25HUY` |

## 9. ცნობილი ნიუანსები / ხარვეზები

- **ძებნა სეზონით:** `„სეზონი 4"` ძებნა fuzzy-ა და სხვა სეზონებსაც აბრუნებს (ტოკენებით ემთხვევა). ზუსტი თეგ-ფილტრი ჯერ არ არის გაკეთებული — შეთავაზებული იყო, მომხმარებელს არ უპასუხია.
- **I სეზონის ყდები** ცარიელია — თუ გინდა, ვიდეოდან კადრები უნდა გადაიღო და ატვირთო.
- **Protect The President:** მომხმარებლის ჩასმული სურათი მაშინ ვერ ამოვიღე; სურათები მოგვიანებით პაპკიდან (ჯგუფი 10) დაემატა.
- **სკრინშოტები ბრაუზერში ხშირად timeout-ს აძლევს** — ვერიფიკაციისთვის გამოიყენე `get_page_text` / `read_page` / `javascript_tool`. `seed` ტაბის კონსოლი მოძველებული შეიძლება იყოს — შეცდომების შესამოწმებლად ახალი ტაბი გახსენი.
- გარკვეული ფორმატირების ხარვეზი: season 4/5-ის `media: [...shots(...)]` ბლოკებში ინდენტაცია არათანაბარია (კოდი სწორია; prettier გაშვებულია ფაილზე).
- `prettier` პროექტში dev-დამოკიდებულებად არ არის (npx-ით ისვამს).
- ბაზა **ღიაა ყველასთვის** (anon read/write) — ეს დიზაინით ასეა („ბმულის მქონეს რედაქტირება შეუძლია").

## 10. შემდეგი შესაძლო ნაბიჯები

- `adding games screens/` საქაღალდეში შემდეგი ჯგუფები (თუ მომხმარებელი ახალ სიას გამოგიგზავნის: ნომერი + აღწერა → სურათები იმავე ნომრით).
- თეგის ზუსტი ფილტრი/ჩიპები (`Table Time`, `სეზონი N`, „კარტით სათამაშო") მთავარ გვერდზე.
- I სეზონის რეალური კადრების გადაღება ვიდეოდან.
- გაწმენდა: `scripts/upload-screens.ts`-ის lint warnings (`_` ცვლადები seed-ში).

## 11. მომხმარებლის პრეფერენციები (როგორ ვმუშაობდით)

- პასუხები **ქართულად**, მოკლე დასკვნით: რა გაკეთდა, რა ვერიფიცირდა, რა ნიუანსია.
- მომხმარებელი აგზავნის ინფორმაციას რუსულად/ინგლისურად/ქართულად ნაკუწებად → საჭიროა თარგმნა და „საიტის სტილში" გადაწერა.
- თამაშების სურათები პაპკაში ნუმერაციით; ჩაწერილი სიის ნომერი = სურათების ჯგუფის ნომერი.
- „გააკეთე იგივე" = იგივე პროცესი: ზიპის გახსნა → ტექსტის ამოღება → კადრების ატვირთვა → mock-data → seed → ბრაუზერში შემოწმება.
- ყოველი ცვლილების შემდეგ: `npx tsc --noEmit -p .`, `npx eslint src/lib/mock-data.ts`, seed, ბრაუზერში ვერიფიკაცია (`http://localhost:3000/game/<slug>`).
