# Handoff: Under Score — mobile app (onboarding → score a book → listen)

## Overview

**Under Score** turns the book you're reading into a soundtrack. The user names a book, the app
reads its metadata/description to infer a mood, proposes that read back in one sentence, lets the
user correct it with pre-filled chips, then generates a ~30-track playlist and pushes it to
Spotify. Playlists are organised into **sections** per book, so the score can shift as the story
does.

This bundle covers the **iOS mobile app** only — 12 screens, one core loop, dark and light themes.
Audience: casual readers who want ambience with zero effort. The design's governing constraint is
that **the happy path requires no input beyond naming the book** — every mood control is optional
and arrives pre-answered.

## About the design files

The files in `prototypes/` are **design references authored in HTML** — working prototypes that
show intended look and behaviour. They are **not production code to copy**. The task is to
**recreate these designs in the target codebase's environment** (SwiftUI, React Native, React,
etc.) using its established patterns, component library and navigation stack. If no codebase
exists yet, pick the framework that fits the product (this is an iOS-first mobile app; SwiftUI or
React Native are the natural choices) and implement there.

Two things in the prototypes are scaffolding, not design:
- The dark page background, the phone bezel, the 9:41 status bar and the home indicator are a
  **device frame for presentation**. The real app is only what's inside.
- The right-hand "Jump to a screen" rail and theme toggle are **prototype navigation aids**. They
  do not ship.

## Fidelity

**High fidelity.** Colours, typography, spacing, radii, motion and copy are final and should be
matched precisely. Every value below is exact. Two things are deliberately placeholder and marked
as such: track artwork (mood-gradient swatches stand in for real album art from the music
provider) and book covers (same). Wire those to real imagery.

Layout is specified at **393 × 852pt (iPhone 16 / 15 / 14 Pro)**. Content areas must flex; see
Responsive behaviour.

---

## Design tokens

All tokens live in `design-system/tokens/`. Import those files rather than retyping values. The
theme is switched by setting `data-theme="light"` / `"dark"` on the app root (dark is default).

### Base palette

| Token | Hex | Token | Hex |
|---|---|---|---|
| `--plum-950` | `#0B0410` | `--pink-500` | `#FF0084` |
| `--plum-900` | `#150A1E` | `--rose-500` | `#EA0C5F` |
| `--plum-800` | `#1F0F2A` | `--coral-500` | `#EA6E4B` |
| `--plum-700` | `#2B1638` | `--orange-500` | `#FF5341` |
| `--plum-600` | `#3A1E66` | `--orange-400` | `#FF8820` |
| `--lilac-300` | `#CDA8E2` | `--amber-400` | `#FFA200` |
| `--lilac-200` | `#E4CFF0` | `--peel-400` | `#F6BA00` |
| `--orchid-500` | `#D653A9` | `--yellow-300` | `#FAF26F` |
| `--magenta-600` | `#C0007A` | `--seafoam-300` | `#ABE3D2` |
| | | `--indigo-700` | `#002296` |

### Semantic — dark (default)

`--bg #0B0410` · `--surface #150A1E` · `--surface-2 #1F0F2A` · `--surface-raised #2B1638`
`--border rgba(255,255,255,.10)` · `--border-strong rgba(255,255,255,.18)`
`--ink #F8F1FB` · `--ink-muted #BCA9CC` · `--ink-faint #8A7699`
`--primary #FF0084` · `--primary-ink #180310` · `--accent #FFA200`
`--shadow-glow 0 20px 40px -14px rgba(255,0,132,.45)` · `--shadow-soft 0 12px 30px -12px rgba(0,0,0,.55)`

### Semantic — light

`--bg #FFF8EF` · `--surface #FFFFFF` · `--surface-2 #FDEFE0` · `--surface-raised #FFFFFF`
`--border rgba(43,15,61,.12)` · `--border-strong rgba(43,15,61,.22)`
`--ink #2B0F3D` · `--ink-muted #6B5581` · `--ink-faint #9C89AC`
`--primary #FF0084` · `--primary-ink #FFFFFF` · `--accent #D97A00`
`--shadow-glow 0 16px 32px -14px rgba(255,0,132,.30)` · `--shadow-soft 0 10px 24px -12px rgba(43,15,61,.14)`

### Gradients

```
--grad-warm  linear-gradient(120deg, #FF0084 0%, #FF5341 55%, #FF8820 100%)   /* primary CTA, logo fill */
--grad-hero  linear-gradient(135deg, #002296 0%, #C0007A 32%, #EA0C5F 52%, #FF5341 72%, #F6BA00 100%)
```

**Mood gradients** — the signature device. Each mood maps to two stops; they stand in for artwork
everywhere (playlist headers, cards, track rows, section rows, player art).

| Mood | Stop A | Stop B |
|---|---|---|
| cozy | `#EA6E4B` | `#FAF26F` |
| melancholy | `#3A1E66` | `#CDA8E2` |
| hopeful | `#FAF26F` | `#ABE3D2` |
| tense | `#3A1E66` | `#D653A9` |
| dreamy | `#CDA8E2` | `#ABE3D2` |
| nostalgic | `#D653A9` | `#EA6E4B` |

Single-mood swatch: `linear-gradient(160deg, A, B)`.
**Two-mood composite** (used whenever the user has two moods selected) — take mood 1's pair as
`a` and mood 2's as `b`, then:
`linear-gradient(160deg, a[0] 0%, a[1] 46%, b[1] 100%)`.

### Typography

Fonts load from Google Fonts (see `design-system/tokens/typography.css`). On native, bundle the
equivalents.

```
--font-display  'Quicksand', ui-rounded, sans-serif     /* headings, buttons, labels */
--font-body     'Inter', system, sans-serif             /* body copy */
--font-mono     'Andale Mono', 'Space Mono', monospace  /* eyebrows, timecodes, percentages */
--font-logo       JayaGiri Sans        (assets/fonts/)  /* "under" */
--font-logo-rough JayaGiri Sans Rough  (assets/fonts/)  /* "score" */
```

| Role | Spec |
|---|---|
| `--text-display-xl` | 600 56px/1.05 display |
| `--text-display-lg` | 600 40px/1.08 display |
| `--text-display-md` | 600 28px/1.15 display |
| `--text-title` | 600 22px/1.25 display |
| `--text-body-lg` | 400 18px/1.5 body |
| `--text-body` | 400 16px/1.55 body |
| `--text-body-sm` | 400 14px/1.5 body |
| `--text-eyebrow` | 700 12px/1.4 mono, letter-spacing `.14em`, uppercase, `--ink-faint` |

Screen-specific overrides used in the prototype: splash logo 66px/1.04; splash headline
600 34px/1.12, `letter-spacing:-.02em`, centred; screen H1 600 28px/1.1 `letter-spacing:-.01em`;
step headings 600 30px/1.14; playlist title 600 30px/1.1; player track title 600 25px/1.15.

**Casing rule:** sentence case everywhere. The only all-caps are mono eyebrows and button labels
(uppercase, `.05em` tracking, 12px, weight 500).

### Spacing, radii, motion

4px base scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72.
Screen horizontal padding: **22px** (26px on splash/connect). Bottom safe padding: 34px.

```
--radius-sm    10px   /* list rows, small controls */
--radius-card  20px   /* cards, gradient panels */
--radius-lg    28px
--radius-pill  999px  /* every button, chip, input, switch */

--ease-standard cubic-bezier(.32,.72,0,1)
--dur-fast 120ms   --dur-med 220ms
```

Minimum tap target 44px. Buttons: `lg` = 56px tall, default = 44px.

---

## Component inventory

These exist in the design system bundle (`design-system/`) and should map to real components in
the target codebase.

| Component | Notes |
|---|---|
| `Button` | Three variants — see below |
| `PlayButton` | Circular gradient play/pause FAB; CSS-shape glyph, no icon font |
| `SearchInput` | Pill field, solid dot instead of a magnifier icon |
| `ThemeSwitch` | Light/dark pill toggle |
| `MoodChip` | Selectable pill; **gradient border when selected** (see below) |
| `ProgressDots` | Onboarding step indicator; active dot elongates |
| `TabBar` | Bottom nav — Now / Library / Profile |
| `PlaylistCard` | Card with mood-gradient artwork band |

### Button variants (updated during this project — note the reordering)

| Variant | Fill | Ink | Shadow | Use |
|---|---|---|---|---|
| **primary** | `--grad-warm` | `--primary-ink` | `--shadow-glow` | The main action on a screen with no competing gradient |
| **secondary** | `--btn-secondary-fill` — `rgba(255,255,255,.12)` dark / `rgba(43,15,61,.10)` light | `--ink` | none | Ghost pill. The default alternative action |
| **tertiary** | `--btn-tertiary-fill` `#2B0F3D` | `#FFF8EF` | `0 18px 34px -16px rgba(43,15,61,.55)` | Solid plum. Used where the background is already a gradient |

**All three share one label spec: 16px, weight 500, uppercase, `.05em` tracking, centred, 52px
tall at `lg`.** Labels must not vary in size between variants.

Press state: `scale(.96)`. No hover colour shifts — glow and gradient carry emphasis.

### The one-gradient rule

**Two gradients must never overlap.** This governs several decisions:
- On the splash, the haze dies just above the CTAs: in dark the primary sits on flat plum and
  takes the warm gradient; in light it stays solid plum (tertiary).
- On the playlist header, the band is a gradient, so its controls are flat translucent pills.
- The splash lockup is a solid fill in both themes (see Splash) — never a gradient over the haze.

### MoodChip — selected state

Selected chips are **gradient-bordered, not gradient-filled**:

```css
border: 1.5px solid transparent;
background: linear-gradient(<surface>,<surface>) padding-box,
            var(--grad-warm) border-box;
color: var(--ink);
```
where `<surface>` is `#150A1E` (dark) / `#FFF8EF` (light). Unselected uses the same double-background
technique with `--border` in place of the gradient, and `--ink-muted` text. Selected chips append
a `✓` to the label.

---

## Screens

Twelve screens. Order below follows the flows.

### 1. Splash

- **Purpose:** state the promise, start the flow.
- **Background — three stacked layers** (children of the phone shell, behind the status bar and
  content, all `pointer-events:none`). This replaced the earlier blurred-mesh wash:
  1. **Ground** — flat `#1F0F2A` dark / `#FDEFE0` light (a warm cream, deliberately deeper than `--bg`).
  2. **Haze** — `--grad-hero`, `blur(36px)`, box `left/right:-30% · top:-12% · height:64%`,
     opacity `.78` dark / `.50` light, faded with
     `mask-image: linear-gradient(180deg, #000 0%, #000 44%, rgba(0,0,0,.4) 72%, transparent 100%)`
     so it dies just above the CTAs.
  3. **Record** — a 540 × 540 circle centred horizontally at `bottom:-270px`, so only its top half
     is on screen. Fill `#3A1E66` dark / `#E4CFF0` light; grooves are
     `repeating-radial-gradient(circle at center, transparent 0 16px, L 16px 17px)` with
     `L = rgba(11,4,16,.32)` dark / `rgba(43,15,61,.14)` light. The CTAs sit on the record.
     Over the grooves, a **sheen** — a soft band of light across the disc, peaking just past its
     leading edge: `#FFFFFF` at `.06` dark, `#2B0F3D` at `.05` light (on the pale disc a
     shadow-side reads where a white highlight would not). The disc is otherwise rotationally
     symmetric, so the sheen is what its spin has to carry — see Animation.
- **Logo lockup:** solid single-colour SVGs, 242px, centred —
  `assets/under-score-logo-lilac.svg` (lilac `--lilac-200`, dark theme — matches the tagline) /
  `assets/under-score-logo-plum.svg` (plum, light theme). **The gradient-filled mark is retired on the splash** — the lockup is
  always one solid colour. Tagline beneath: "a soundtrack to all your stories" (16px display,
  `--lilac-200` dark / `--plum-600` light) — same colour as the lockup in each theme.
- **Copy:** the live prototype is the source of truth for splash copy — read it out of
  `prototypes/Under Score App.dc.html`.
- **CTAs:** `Get started →` — **primary (warm gradient)** in dark, where the footing under it is
  flat plum; **tertiary (solid plum)** in light. Then `I already have an account` (secondary),
  12px gap.
- **Status-bar ink** flips with theme: `#F8F1FB` dark, `#2B0F3D` light.
- Chosen from explorations `9c` (dark) and `10a` (light) in
  `prototypes/Under Score Splash Options.dc.html`.

### 2. How it works

- Three swipeable pages, always skippable. Eyebrow `STEP 0N · HOW IT WORKS` left, `Skip` (ghost) right.
- Heading 600 30px/1.14, then body `--text-body-lg` `--ink-muted`, then a 236px mood-gradient panel
  (`--radius-card`, `--shadow-soft`) — dreamy, melancholy, cozy per page.
- Bottom: centred `ProgressDots` (3), then primary button — `Next →` on pages 1–2,
  `Connect music →` on page 3.
- Copy:
  1. "Say what you're reading." / "Search any title or author. Under Score pulls the blurb, the genre and the era — you never fill in a form."
  2. "It reads the mood." / "Pacing, tone, setting — said back to you in one sentence, so you can correct it if it lands wrong."
  3. "Press play." / "Thirty tracks, scored to where you are in the story, sent straight to Spotify."

### 3. Connect music

- Eyebrow `STEP 03 · CONNECT`; heading "Where should the music go?";
  body "Pick one now, add the other later. Under Score only ever creates new playlists — nothing
  you already have is touched."
- Two rows, `--surface` fill, `1px --border`, `--radius-sm`, 16px padding, 38px circular gradient
  avatar, title + sub, chevron: **Spotify** ("Playlists and playback control") and **Apple Music**
  ("Coming soon", 50% opacity, non-interactive).
- Bottom: secondary `Not now — just show me a preview` + caption "You can hear 30-second previews
  without connecting."
- **Connect is soft-gated.** Skipping still reaches a generated playlist; it just can't be saved.
  A persistent "Connect to save" banner should appear on Now and on results in that state.

### 4. Search

- Header row: `← Back` (ghost) / eyebrow `NEW SCORE` / spacer.
- `SearchInput`, placeholder "Search a title or author", focused on entry.
- Eyebrow flips between `RECENT AND POPULAR` (empty query) and `RESULTS`.
- Rows: 48 × 70 cover (mood-gradient placeholder, 6px radius, `--shadow-soft`), title 600 16px
  display, meta `Author · Year · Genre` in `--text-body-sm --ink-muted`; `1px --border` bottom rule.
- Debounced query, max 8 results, no infinite scroll.
- **No-result state** (query typed, zero matches): heading 600 19px display — `No match for “<query>”.`
  then `--text-body-sm --ink-muted` — "Not every book is in the catalogue yet. You can score it by
  hand — genre, mood and pacing are all it needs."
- A secondary full-width `Can't find it? Score it by hand →` button is pinned below the list on
  **every** state of this screen, not only the empty one. It routes to screen 6b.

### 5. Book detail

- `← Back`, then 108 × 158 cover beside title (`--text-title`), author, and a mono eyebrow
  `Genre · Year`.
- Blurb in `--text-body --ink-muted`. Hairline rule.
- **"Where are you?"** — eyebrow, then a range slider 0–100 (`accent-color: --primary`) with the
  value in 600 15px mono beside it. Caption: "Roughly is fine. It decides which part of the story
  gets scored."
- Bottom: primary `Score it →` + caption "Takes about ten seconds."
- Progress is a slider, never a required chapter number — casual readers don't track those.

### 6. Mood (the differentiating screen)

The model guesses from metadata first; chips are the **correction** layer, never a blank form.

- Header: `← Back` / eyebrow `STEP 02 · MOOD` / spacer.
- Heading "Here's how it reads."
- 118px mood-gradient panel, `--radius-card`, cross-fades on change (`--dur-med --ease-standard`).
- **The read, as a sentence:** 600 19px/1.35 display — `Melancholy · Dreamy · Slow burn`
  (interpunct-joined moods + pacing). Below it a one-paragraph rationale in `--text-body-sm --ink-muted`.
- Hairline rule. Eyebrow row: `MOOD · CHANGE IF IT'S OFF` with a ghost `Reset` at the right.
- Six `MoodChip`s, 9px gap, wrapping — melancholy, dreamy, cozy, tense, hopeful, nostalgic.
  Pre-selected ones carry `✓`. **Max two selected**; selecting a third drops the oldest.
- Eyebrow `PACING`, then three pills — Slow burn / Steady / Breakneck, single-select, same
  gradient-border treatment.
- Bottom: primary `Generate playlist →`.
- Every change re-renders the sentence and the gradient live.

### 6b. Score it by hand (no book match)

Same skeleton as screen 6, with the two things the catalogue would otherwise supply — a title and a
genre — asked for directly. Reached from the search screen's by-hand button; there is no book
detail step in front of it.

- Header: `← Back` (returns to Search) / eyebrow `STEP 02 · BY HAND` / spacer.
- Heading "Tell us how it reads."
- 118px mood-gradient panel, identical behaviour to screen 6 (live cross-fade from selections).
- The read, as a sentence: `Genre · Mood(s) · Pacing`, 600 19px/1.35 display. Rationale line beneath:
  "Nothing to look up. The score comes from what you pick here."
- Hairline rule.
- Eyebrow `TITLE`, then a pill text input — 52px, `--radius-pill`, `--surface`, `1px --border`,
  20px horizontal padding, placeholder "What are you reading?". Optional; it only names the playlist.
- Eyebrow `GENRE`, then single-select pills wrapping at 9px gap: Literary, Fantasy, Sci-fi, Mystery,
  Thriller, Romance, Horror, Memoir, History, Poetry. Selected pill takes the MoodChip selected
  treatment and appends `✓`. Default `Literary`.
- Eyebrow `MOOD · PICK UP TO TWO`, then the same six `MoodChip`s. Max two, same drop-oldest rule.
  Unlike screen 6 nothing is pre-selected; if the user picks none, `melancholy` is assumed.
- Eyebrow `PACING`, then the same three pills.
- The content column scrolls; the CTA block is pinned. Bottom: primary `Generate playlist →` with a
  caption that reflects the typed title ("Scored as “<title>”.") or, when empty, "A title is
  optional — it just names the playlist."
- Generating from here builds a synthetic book record (`id: 'manual'`, author "Added by you", year
  `—`) and runs the identical generation sequence. Back from the resulting playlist returns here,
  not to screen 6.

### 7. Generating

- Centred: 210px mood-gradient square, slowly drifting (see Animation).
- "Scoring <Book>…" 600 24px/1.2 centred.
- Three named steps, 260px column, 10px gaps: `✓`/`◌` mono glyph + label. Completed steps go
  `--primary`; pending `--ink-faint` at 40% opacity. Step 2's label is **replaced by the mood
  sentence** once complete — the wait is where the product's intelligence becomes legible.
- Steps: "Read the book's register" → "Matched the mood" → "Finding thirty tracks…"
- Timing: step 1 at 700ms, then 1100ms each; total ≈ 3s in the prototype, 8–15s in reality.
- Back cancels.

### 8. Playlist (result)

- **280px full-bleed mood-gradient band** at the top, extending under the status bar
  (content column is offset `-52px` to allow this).
- A scrim over the band's top 130px: `linear-gradient(180deg, rgba(11,4,16,.62) 0%, rgba(11,4,16,.28) 55%, transparent 100%)`.
- Two flat pills on the band at y≈56: `← BACK` and `REGENERATE` — 36px tall, `--radius-pill`,
  12px/500 uppercase `.05em`.
- Band bottom: eyebrow `<BOOK> · <N>%` then playlist title 600 30px/1.1. **Titles are generated**
  ("Tides and Statues"), never "<Book> playlist".
- **Contrast rule — important.** The band is a mood gradient whose lightness varies per mood, so
  the header ink is *computed*, not hardcoded. Two independent decisions:
  - **Top controls** — from the relative luminance of the gradient's *first* stop,
    weighted `lum(a[0])*.62 + lum(a[1])*.38`, then `*0.74` for the scrim. Above `0.3` →
    plum ink `#2B0F3D` on a `rgba(255,248,239,.72)` pill; below → cream `#FFF8EF` on
    `rgba(43,15,61,.62)`. Status-bar ink follows this same value.
  - **Bottom title block** — sits at ~70% along the gradient, so it derives from the *last* stops:
    `lum(a[1])*.55 + lum(b[1])*.45 > 0.3` → dark ink `#180310`, else cream. Nearly every mood pair
    ends light, so this is usually dark.
  Reimplement this as a luminance helper, not as fixed colours; warm moods (cozy) invert both.
- Below the band: mood sentence + `30 tracks · 1 hr 52 min` in `--text-body-sm`.
- Action row: primary `Save to Spotify` (becomes `Saved ✓`) + 52px `PlayButton`.
- Track rows: 42px gradient art square, title 600 15px display, artist `--text-body-sm --ink-muted`,
  duration in 12px mono `--ink-faint`. Tapping a row opens the player at that track.

### 9. Saved sheet

- Bottom sheet over a `rgba(8,3,12,.6)` scrim: `--surface`, `24px 24px 0 0`, rise animation.
- 40 × 4 grabber, 60px `--grad-warm` circle with `✓`, heading "<Playlist> is in your Spotify."
  600 21px/1.25 centred, body "It stays in step with the book — just say when the story turns."
- Buttons: primary `Open in Spotify →`, secondary `Play here instead`, ghost `Done`.
- Dismiss lands on **Now** with this book current — the loop closes into daily use.

### 10. Now / Library / Player / Profile

**Now** — H1 "Now playing" + 40px `--grad-warm` circular `+` (opens Search).
Current-book card: `--surface`, `1px --border`, `--radius-card`, `--shadow-soft`, 132px gradient
band, then eyebrow `<BOOK> · <N>%`, title, `<Playlist> · 30 tracks`, and two 44px buttons —
primary `Resume` and secondary **`Story turned?`** (the re-score entry point).
Then eyebrow `EARLIER SECTIONS` and rows: 46px gradient square, section title, `0–20% · Dreamy`, `▶`.

**Library** — H1 "Your library", three filter pills (All / Reading / Finished, gradient-border
selected), then a column of `PlaylistCard`s (title, book, mood, track count). Tap → book detail;
long-press → delete.

**Player** — `← Back` / eyebrow `<PLAYLIST>` / `⋯`. A blurred drifting mood-gradient fills the
upper half at 50% opacity behind everything. 300px gradient artwork panel, track title
600 25px/1.15, artist `--text-body`, then **`<Book> · <N>% · <Mood>`** in `--text-body-sm --ink-faint`
— that context line is the only thing that makes this not a generic player; keep it.
Scrubber: 4px track, `--primary` fill, 11px mono timecodes.
Transport: `⏮` and `⏭` at **62 × 62 with a 46px glyph** (nearly as large as the FAB), 26px gaps,
76px `PlayButton` centre.

**Profile** — H1, 60px avatar + name + "14 books scored · 9 hrs listened".
`CONNECTED`: Spotify (with account email, ghost `Disconnect`) and Apple Music ("Coming soon", 55%).
`PREFERENCES`: three `ThemeSwitch` rows — Light theme / Nudge me when the mood drifts / Explicit
tracks. Ghost `Sign out`. Settings are intentionally thin; this is not a feature surface.

### App background (all non-splash screens)

A subtle blotchy purple, **not flat near-black**:

```
/* dark */
radial-gradient(64% 30% at 6% 2%,   rgba(58,30,102,.85) 0%, transparent 70%),
radial-gradient(58% 26% at 98% 18%, rgba(192,0,122,.24) 0%, transparent 72%),
radial-gradient(74% 34% at 14% 62%, rgba(90,42,140,.40) 0%, transparent 74%),
radial-gradient(66% 30% at 92% 88%, rgba(58,30,102,.55) 0%, transparent 76%),
#150A1E

/* light */
radial-gradient(66% 32% at 6% 2%,   rgba(246,186,0,.28) 0%, transparent 70%),
radial-gradient(60% 28% at 98% 16%, rgba(255,0,132,.20) 0%, transparent 72%),
radial-gradient(76% 36% at 14% 60%, rgba(255,83,65,.16) 0%, transparent 74%),
radial-gradient(68% 32% at 94% 86%, rgba(214,83,169,.22) 0%, transparent 76%),
#FFF8EF
```

---

## Interactions & behaviour

**Navigation.** Three tabs — Now (0) / Library (1) / Profile (2). Search → Book → Mood →
Generating → Playlist is a **modal full-screen flow** pushed from Now or Library, not a tab. The
tab bar is hidden throughout that flow, on the player and during onboarding.

**Back affordance.** One treatment everywhere: a ghost `← Back` at the top-left. On the playlist
band it becomes a flat translucent pill because it sits on a gradient. Do not mix in `Cancel`
or bare `⌄`/`←` glyphs.

**Mood selection.** Max two moods; a third replaces the oldest. `Reset` restores the model's
guess. Pacing is single-select. Sentence and gradient update live.

**Generation.** Staged, cancellable. On failure keep the draft and offer retry. If fewer than 30
tracks resolve against the provider, ship what resolved and state the count.

**Playback** is **remote control of Spotify**, not local audio. Without a Premium session the
transport collapses to a single "Open in Spotify" button. The prototype's 1s position tick is a
stand-in for real playback state.

**Re-score** ("Story turned?" on Now) is the shipped model: reader-triggered → confirm progress →
one mood pass → a **new section** appended to the book. Earlier sections stay playable. Two
alternatives were explored and deferred (pre-cut three-act generation; a nudge after a listening
threshold) — see the wireframe file if you need that context.

**Animation.**
- `us-fade` — screen enter: 220ms, `opacity 0→1` + `translateY(8px→0)`.
- `us-drift` — gradient panels: 14–16s infinite ease-in-out, `scale(1.04→1.12)` with ±2% translate.
- `us-spin` — the splash record: 18s infinite linear rotation, carrying the sheen once around per
  turn, under a wobble of ±3px x / ±2px y on 5.5s and 7.3s ease-in-out cycles. The two wobble
  periods are deliberately not multiples of each other, so the sway does not repeat a closed path.
  The wobble is applied outside the rotation, in screen space — inside it, a sideways sway becomes
  an orbit.
- `us-fall` — the splash CTAs: the content column fades out over 120–160ms while the record grows
  about its own centre to cover the viewport (~520ms, ease-in-out quad); the pushed screen then
  fades in over the full-bleed disc. This is the one transition that does **not** take
  `--ease-standard`: that curve spends 60% of its travel in its first quarter, which on a 3.5×
  growth reads as a cut rather than a zoom. Reduced motion drops all three of these and navigates
  flat.
- `us-rise` — bottom sheet: 240ms `--ease-standard`, `translateY(100%→0)`.
- Chip/pill toggles and gradient cross-fades: `--dur-med` `--ease-standard`.
- Press: `scale(.96)`.

**Responsive.** Fixed-height panels (280px band, 300px player art, 236px onboarding panel) are
tuned for 852pt. On shorter devices scale those down before touching type; content columns scroll
with hidden scrollbars. Type never goes below 12px, tap targets never below 44px.

---

## Copy rules

Two rules were set explicitly during design and apply to all future copy:

1. **Never use first-person plural.** No "we", "us", "our". Use the product as subject
   ("Under Score pulls the blurb"), second person / imperative ("Name the book"), or agentless
   phrasing ("It reads the mood"). This is a hard rule.
2. **Sentence case everywhere**, except mono eyebrows and button labels (uppercase).

Voice: warm, a little literary, never corporate. Short declarative sentences. Interpunct (`·`)
chains descriptors. No emoji anywhere.

---

## State

```
screen      'splash'|'how'|'connect'|'search'|'book'|'mood'|'manual'|
            'generating'|'result'|'now'|'library'|'player'|'profile'
page        0..2      onboarding page
theme       'dark'|'light'
query       string    search text
bookId      string    selected book
progress    0..100    reading position
moods       string[]  max 2, seeded from the model's guess
pacing      'Slow burn'|'Steady'|'Breakneck'
tab         0..2
filter      'All'|'Reading'|'Finished'
playing     bool
trackIdx    int
pos         int       seconds
genStep     0..3
showSaved   bool
saved       bool
nudge       bool      "nudge me when the mood drifts"
explicit    bool
manualTitle string    by-hand title, optional
genre       string    by-hand genre, default 'Literary'
manualBook  object    synthetic book record built on by-hand generate
```

Selecting a book seeds `moods`/`pacing` from that book's inferred values and resets
`trackIdx`/`pos`/`saved`.

## Data the design assumes (no API spec was provided)

- **Book search** — title, author, year, genre, description, cover. (Google Books in the brief.)
- **Mood inference** — from description + genre + `progress`, returning: up to 2 moods from the
  fixed six, a pacing value, a one-sentence rationale, and a generated playlist title.
- **Track list** — ~30 tracks (title, artist, duration, artwork, provider URI) resolved against
  the music provider's search.
- **Playlist create** — provider OAuth, create-only scope; the design promises existing playlists
  are never touched.
- **Sections** — a book has N ordered sections, each with its own progress range, mood and playlist.

## Assets

- `assets/wave.svg` — the soundwave mark. Used as a **CSS mask** so it can take a gradient or solid
  fill; on native, use a template/tintable image. 244 × 67 source, drawn at 210 × 52.
- `assets/logo.svg` — full vector logo lockup.
- `assets/under-score-logo-lilac.svg` / `assets/under-score-logo-plum.svg` — solid-fill lockups
  used on the splash (lilac `#E4CFF0` on dark, plum `#3A1E66` on light; the dark lockup matches
  the tagline colour). `assets/under-score-logo-cream.svg` is the earlier cream variant, unused.
- Logo fonts `JayaGiri-Sans.otf` / `JayaGiri-Sans-Rough.otf` live in the design-system project at
  `assets/fonts/` — licensed files from the team; request them before building the splash.
- Book covers and track artwork are **placeholders** (mood gradients). Wire to real provider imagery.
- No icon set exists. Glyphs in the prototype (`▶ ⏮ ⏭ ⌕ ⋯ ✓ →`) are typed characters. If a real
  icon set is needed, a rounded-stroke family (e.g. Lucide) matches the brand geometry — flag it
  rather than mixing styles.

## Screenshots

`screenshots/` holds all 11 dark-theme screens (01–11), the by-hand screen (`06b-by-hand.png`)
plus four light-theme screens (12–15):
splash, mood, playlist and now. They are reference captures — the prototype is authoritative.

**Known capture artifact:** captures include the prototype's right-hand rail and may crop the
lower half of the phone. The prototype is authoritative — open the standalone file to see any
screen in full.

## Files in this bundle

```
screenshots/                          ← 16 reference PNGs, dark + light
prototypes/
  Under Score App — standalone.html   ← self-contained, opens offline. Start here.
  Under Score App.dc.html             ← source of the hi-fi prototype (all 12 screens, both themes)
  Under Score Wireframes.dc.html      ← flow map + annotated wireframes + rejected options
  Under Score Splash Options.dc.html  ← splash explorations; 9c (dark) and 10a (light) are current
design-system/
  styles.css, tokens/                 ← the real token files; import these
assets/
  wave.svg, logo.svg
```

Open the standalone file first — the right-hand rail jumps to any screen and the theme toggle
flips both themes live.

## Open questions for the team

1. Apple Music — in or out of MVP? Currently designed as a visible "Coming soon" row.
2. Where does the listening-time signal come from if playback is remote-controlled? It affects
   whether the nudge-based re-score model is ever viable.
3. Should generated playlists be one Spotify playlist per section, or one playlist per book that
   gets rewritten? The design currently implies per-section.
