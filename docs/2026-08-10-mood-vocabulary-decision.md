# Mood vocabulary: closed union or open strings?

**Status:** decided and implemented, 2026-08-10. The vocabulary is closed in `@underscore/shared`
and expanded from six to ten. See "Decision" below; the sections above it are the original
analysis, kept for the reasoning.
**Raised:** 2026-08-10, from a review comment on `app/src/lib/gradients.ts:64`.

## The mismatch

`MoodProfileSchema` in `packages/shared/src/moodProfile.ts` types mood as an open list:

```ts
mood: z.array(z.string()),
```

The design fixes exactly six. `app/src/lib/gradients.ts` encodes them as a closed union
(`MOODS`, `Mood`, `MOOD_STOPS`) because each mood is a two-stop gradient that stands in for
artwork everywhere — playlist headers, cards, track rows, player art:

| mood | stops |
|---|---|
| cozy | `#EA6E4B` → `#FAF26F` |
| melancholy | `#3A1E66` → `#CDA8E2` |
| hopeful | `#FAF26F` → `#ABE3D2` |
| tense | `#3A1E66` → `#D653A9` |
| dreamy | `#CDA8E2` → `#ABE3D2` |
| nostalgic | `#D653A9` → `#EA6E4B` |

So a mood Claude invents has no artwork, and the UI has to discard it.

## Why the six are more than a colour lookup

The correction UI is built on the same six. From the handoff README:

- `:306` — the mood screen is "Six `MoodChip`s, 9px gap, wrapping — melancholy, dreamy, cozy,
  tense, hopeful, nostalgic."
- `:331` — on the manual-mood screen nothing is pre-selected; if the user picks none,
  `melancholy` is assumed.

The user can therefore only ever *express* one of six. If the model returns "wistful" there is no
chip for it, no gradient for it, and no way for the user to confirm or correct it. An open
`string[]` does not buy expressiveness — it moves the failure from the schema to the render.

## Decision

Close the vocabulary at the source rather than narrowing it at the UI boundary.

1. `MOODS`, `Mood` and `DEFAULT_MOOD` live in `packages/shared/src/moodProfile.ts` as the canonical
   list. `app/src/lib/gradients.ts` imports and re-exports them; it keeps only `MOOD_STOPS` and
   `moodGradient`, and the narrowing comment is gone.
2. `MoodProfileSchema.mood` is `z.array(z.enum(MOODS)).max(2)`. The cap is the design's — "MOOD ·
   PICK UP TO TWO", README `:330` — and it matches what `moodGradient` can composite. There is no
   `.min`: the manual-genre path legitimately produces `mood = []` (API design `:138`), and
   `moodGradient` applies `DEFAULT_MOOD` itself so no call site has to remember the fallback.
3. The model does its own mapping. The analysis tool's `input_schema` carries the enum, and the
   prompt asks for the one or two closest, with anything more specific preserved in `summary`.
   "Wistful" comes back as `["nostalgic", "melancholy"]` and the summary still says wistful.

   This replaces the hand-written synonym table this doc originally recommended. A table can only
   cover near-misses someone thought of in advance; the model already has the semantic knowledge to
   do the mapping, and it sees the book that the table never would.

   `enum` in a tool schema is a strong steer, not a hard guarantee, so `MoodProfileSchema.parse` on
   the server stays the real gate — one retry on failure, then `502 UPSTREAM_UNAVAILABLE`.

Nuance the vocabulary cannot carry has a home: `MoodProfile.summary` is free text, and it is what
the "read, as a sentence" line renders (`Melancholy · Dreamy · Slow burn`, README `:303`).

### Expanded to ten

The original six clustered oddly — four of them (melancholy, dreamy, nostalgic, cozy) sit in the
same low-energy interior register, and nothing covered romance, comedy, adventure or horror. Four
added, using only colours already in `PALETTE`:

| mood | stops |
|---|---|
| romantic | `#EA0C5F` → `#E4CFF0` |
| playful | `#FFA200` → `#ABE3D2` |
| epic | `#002296` → `#FF5341` |
| haunting | `#2B1638` → `#ABE3D2` |

`haunting` is dread/horror; `tense` stays suspense and plot pressure.

These pairs are engineering's proposal — the handoff owns the gradient language, so they want a
look from design, as does the mood screen now carrying ten chips rather than six. Nothing consumes
them yet, so revising is cheap.

### The cost, accepted

This is a product ceiling, not just a typing choice. An eleventh mood later means a new gradient
pair, a new chip, and a schema change across all three workspaces. It also constrains the analysis
step: the model cannot report a mood the design did not anticipate, even when that would be the
honest answer. Ten covers enough of the space that the trade is worth it, and `summary` absorbs
what the list cannot.

Note for the playlist header: the band's ink-contrast rule (README `:360-369`) is specced as a
luminance formula rather than per-mood constants, so the new moods need no extra work there — but
`epic` and `haunting` are the pairs most likely to straddle the 0.3 threshold and are worth
eyeballing once that screen exists.

## Related, now settled

`MoodProfileSchema.pacing` keeps its `slow | steady | fast` wire values; the design's labels live in
`PACING_LABELS` in `app/src/lib/gradients.ts`. Display strings belong where display concerns are,
and the wire format stays stable if the copy changes.
