# Chicken Nugget Quest — Planning Document

## Context

We are greenfielding **Chicken Nugget Quest** under [`/Users/jerry/Projects/CNQ`](/Users/jerry/Projects/CNQ) (folder exists, currently empty). The goal of this phase is a **design + technical planning document** that locks vision, MVP (vertical slice) scope, and an implementation path—not full production content.

Inspired by the brief style of [JSDUNGEON/requirements.md](/Users/jerry/Projects/JSDUNGEON/requirements.md), but with a clearer systems breakdown and shippable slice definition.

---

## Vision (locked from design Q&A)

| Decision | Choice |
|----------|--------|
| Genre | Roguelike / dungeon crawl |
| Fantasy | Hungry adventurer; **nuggets are resources**, not the PC |
| Platform | Browser game engine (**Phaser** recommended over raw Pixi) |
| Scope | **Vertical slice** (one polished path that proves the fantasy) |
| Tone | Silly / absurdist comedy |
| Multiplayer | Single-player only |
| Combat / move | **Turn-based grid** (classic roguelike) |
| Nugget role | **Health / hunger** resource |
| Win condition | **Escape with level-specific dipping sauces** |
| Art | Simple **custom pixel sprites** |
| Project root | `CNQ/` |

### Elevator pitch

You are a starving adventurer trapped in a cursed fast-food labyrinth. Every step burns hunger. Chicken nuggets keep you alive. Each floor guards a legendary **dipping sauce**. Collect the sauces and escape—or starve trying, forever re-rolling the deep fryer of fate.

---

## Recommended approach

### Core loop (one run)

1. **Enter floor** → procedural rooms, enemies, nuggets, one **floor sauce**.
2. **Explore on a grid** → each move/action advances the turn (enemies act after you).
3. **Manage hunger** → nuggets restore hunger/HP; starvation damages or kills.
4. **Fight or flee** absurdist enemies (e.g. Sentient Ketchup Packets, Freezer Burn Elementals).
5. **Secure the floor’s dipping sauce** (pickup or light puzzle / mini-boss gate).
6. **Descend or exit** when the sauce is secured.
7. **Win** by escaping with the required sauces; **lose** on death (permadeath → new run).

### Why this loop

- Hunger + sauce collection = comedy fantasy *and* readable roguelike tension.
- Turn-based grid keeps implementation bounded for a vertical slice.
- Phaser gives scenes, input, tilemaps, and audio without rebuilding engine glue.

### Tech recommendation

- **Phaser 3** (not bare Pixi): scenes, cameras, arcade or matter physics optional, good tilemap support. Pixi alone would force more custom framework work for little gain at this scope.
- **TypeScript + Vite** (or plain JS + Vite if you prefer zero friction)—recommend TypeScript for grid/entity types.
- **No backend** for the slice: local-only runs, high score / seed in `localStorage`.
- **Procedural layout**: simple room-and-corridor or BSP generator; fixed seed support for debugging.

---

## Vertical slice definition (what “done” means)

Ship **one complete, funny, replayable path**—not a full campaign.

### In slice

- Title screen → new run → **2–3 floors** → escape victory screen (or death → run summary).
- Turn-based movement + basic melee attack on a grid.
- Hunger meter fed by nugget pickups; starvation consequences.
- **One unique dipping sauce per floor** (3 sauces total if 3 floors); must hold them to “escape.”
- A small enemy roster (3–4 types) with distinct behaviors (melee chaser, ranged spitter, slow tank, etc.).
- Inventory: at least sauces + consumable nuggets (or auto-eat on pickup for simplicity).
- Procedural floors with rooms, corridors, stairs, sauce pedestal/room.
- Pixel sprites for player, 3–4 enemies, nugget, sauces, tiles (walls/floor/door).
- Sound stubs or a few SFX; optional silly music loop.
- Death = run over; show sauces found + floors cleared + nuggets eaten (comedy stats).

### Out of slice (later)

- Full bestiary, deep itemization, classes, meta-progression shop.
- Online leaderboards, multiplayer, controller polish, mobile UI parity.
- Complex crafting, multi-path story branches, cutscenes.
- Mod support, level editor.

### Slice success criteria

A stranger can play a full run in **5–15 minutes**, understand hunger + sauce goals without a manual, laugh at least once, and want one more run.

---

## Systems design (concise)

### Player

- Stats: HP, Hunger, Attack, (optional Defense).
- Actions per turn: Move (1 tile, 4-dir), Wait, Melee adjacent, Use item (if any).
- Hunger: decreases every N turns or every step; at 0, take damage each turn (or hard death—prefer damage for fairness).
- Nuggets: pickup restores Hunger (and maybe small HP). Variants later (spicy = attack buff) are post-slice.

### Dipping sauces (run objectives)

- Each floor has **exactly one** level-specific sauce (Floor 1: WeakSauce, Floor 2: BBQ, Floor 3: AwesomeSauce).
- Sauces are **quest items**: not consumed; carried to exit.
- Escape condition: leave the final exit with all sauces from floors visited (or fixed set for the slice).
- Comedy framing: sauces are “legendary condiments sealed by the Culinary Council.”

### Combat

- Grid, turn-based: player acts → all enemies act.
- Simple bump-to-attack; optional separate attack key if facing matters (default: bump is enough).
- Enemies: FOV or simple scent (if player in range, pathfind; else wander).
- No complex status effect matrix in slice beyond maybe “sticky” (skip turn) for ketchup jokes.

### World / generation

- Tilemap: wall, floor, door, stairs down, sauce altar, spawn.
- Generator: place rooms → connect → sprinkle nuggets/enemies → place sauce room farther from start.
- Fog of war or simple explored memory (nice for roguelike feel; can start without FOV and add if time).

### UI

- HUD: HP, Hunger bar, sauces collected icons, floor number.
- Messages log: “You eat a lukewarm nugget. Morale rises. Cholesterol also rises.”
- Screens: Title, Play, Victory, Game Over, (optional) How to Play overlay.

---

## Project layout (to create under `CNQ/`)

```
CNQ/
  docs/
    PLAN.md                 # this design (copy of approved plan)
    GDD.md                  # living game design notes (optional split)
  package.json
  index.html
  src/
    main.ts                 # Phaser boot
    game/
      scenes/               # Boot, Title, Dungeon, UI overlays
      systems/              # TurnManager, Hunger, Combat, FOV
      map/                  # Generator, TileMap helpers
      entities/             # Player, Enemy, Item
      data/                 # enemy defs, sauce defs, messages
    assets/                 # pixel sprites, sfx
  README.md
```

---

## Critical files (implementation phase)

| Path | Role |
|------|------|
| `CNQ/docs/PLAN.md` | Approved planning source of truth |
| `CNQ/package.json` | Phaser + Vite (+ TS) tooling |
| `CNQ/src/main.ts` | Game config, scene registration |
| `CNQ/src/game/scenes/DungeonScene.ts` | Main play loop |
| `CNQ/src/game/systems/TurnManager.ts` | Action queue / enemy turns |
| `CNQ/src/game/systems/HungerSystem.ts` | Drain, starve, eat |
| `CNQ/src/game/map/DungeonGenerator.ts` | Rooms, sauce placement |
| `CNQ/src/game/entities/*` | Player / enemies / pickups |
| `CNQ/src/game/data/*` | Content tables (sauces, enemies, copy) |

**Reuse:** No existing CNQ code. Pattern reference only: [JSDUNGEON](/Users/jerry/Projects/JSDUNGEON) for “small browser roguelike brief → prototype” mindset—not code dependency.

---

## Content seed (slice flavor)

**Working titles for floors / sauces** (editable later):

1. **Drive-Thru Dungeon** — Sauce: *WeakSauce*
2. **Ketchup Catacombs** — Sauce: *BBQ*
3. **The Fryer** — Sauce: *AwesomeSauce*; exit portal after pickup

**Enemy seeds:** Hangry Rat, Vengeful Fry, Sentient Napkin Swarm, Manager’s Special (mini-boss optional on floor 3).

**Player fantasy:** Not a nugget—an adventurer who treats the dungeon like a cursed combo meal.

---

## Implementation phases (after plan approval)

1. **Scaffold** — Vite + Phaser + TS; blank dungeon scene; colored tiles if sprites not ready.
2. **Grid + turns** — Player move/wait; bump attack; enemy chase AI; turn pipeline solid.
3. **Hunger + nuggets** — Resource loop; death by combat or starvation.
4. **Generator + multi-floor** — 2–3 floors, stairs, sauce items, escape win check.
5. **Pixel art pass** — Replace placeholders; sauce icons; HUD.
6. **Juice + copy** — Messages, screens, SFX, run summary stats.
7. **Playtest polish** — Balance hunger drain vs nugget density; ensure sauces are findable.

---

## Open decisions (non-blocking defaults)

These can change during implementation without derailing the slice:

| Topic | Default for slice |
|-------|-------------------|
| FOV / fog of war | Start **without**; add if slice time allows |
| Inventory UI | Auto-eat nuggets; sauces as auto-tracked quest items |
| Difficulty modes | One balanced curve |
| Seeds / daily run | Debug seed only |
| Phaser physics | **None** for combat—pure grid logic |
| Mobile touch | Mouse/keyboard first; optional swipe later |
| Engine language | **TypeScript** preferred |

If any of these defaults are wrong, say so before implementation.

---

## Verification (how we know the plan executed)

### Playtest checklist

- [ ] New game starts a run on floor 1 with full hunger.
- [ ] Moving spends turns; enemies act after player.
- [ ] Nuggets restore hunger; starvation hurts/kills when empty.
- [ ] Each floor has a obtainable sauce; sauces persist across floors.
- [ ] Reaching the exit **without** all sauces fails or blocks escape (explicit feedback).
- [ ] Reaching the exit **with** all sauces shows victory + silly stats.
- [ ] Death shows game over + run summary; restart works.
- [ ] A full win and a full loss are both achievable in one sitting.
- [ ] No hard crashes on generate / floor transition.

### Dev verification

- `npm install && npm run dev` serves the game locally.
- Build (`npm run build`) succeeds with no TS errors.
- Generator with fixed seed produces stable layout for debugging.

---

## Document deliverables (this phase)

On approval / implementation kickoff:

1. Write `CNQ/docs/PLAN.md` (this document, project-local).
2. Optionally `CNQ/README.md` with pitch + how to run (after scaffold).
3. Do **not** start coding until this plan is approved (plan-mode constraint respected).

---

## Summary

**Chicken Nugget Quest** is a single-player, turn-based grid roguelike in the browser (Phaser), where a hungry adventurer survives on nuggets and must escape with **level-specific dipping sauces**. The first milestone is a **vertical slice**: 2–3 floors, hunger loop, sauces as objectives, small enemy set, custom pixel art, permadeath runs, absurdist comedy tone—all under `CNQ/`.
