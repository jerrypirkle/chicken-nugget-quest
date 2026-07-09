# Chicken Nugget Quest

A single-player, turn-based grid roguelike. You are a hungry adventurer trapped in a cursed fast-food labyrinth. Chicken nuggets keep you alive. Legendary **dipping sauces** are your ticket out.

> Every step burns hunger. Collect the sauces. Escape The Fryer.

<p align="center">
  <img src="src/assets/title-nugget.png" alt="8-bit chicken nugget with pixel light rays" width="320" />
</p>

## Features

- 3 procedural floors: Drive-Thru Dungeon → Ketchup Catacombs → The Fryer
- Single hunger bar (life + resource); hangry at ≤20%
- One unique sauce per floor (WeakSauce, BBQ, AwesomeSauce)
- Bump-to-attack combat, permadeath runs
- Achievements, best-steps high score, career stats (`localStorage`)
- Browser game: Phaser 3 + TypeScript + Vite

## Play locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).  
With `host: true` in Vite config, LAN peers can use `http://<your-ip>:5173`.

### Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move (bump enemies to attack; spends hunger) |
| `.` or Space | Wait a turn (no hunger cost) |
| `?` or H | Toggle help |
| 1 / 2 / 3 | Title: pick starting hunger |
| M | Mute / unmute (saved) |

### Starting hunger

| Choice | Hunger |
|--------|--------|
| 1 — I just ate | 100/100 |
| 2 — I could eat | 80/100 |
| 3 — I need Nuggs! | 50/100 |

At ≤20% hunger you go **HANGRY**: double damage, larger sprite, red eyes.

**High score:** fewest steps to clear all floors.  
**Audio:** procedural SFX/BGM plus countdown tunes in `src/assets/`.

## Build

```bash
npm run build
npm run preview
```

## Design notes

See [docs/PLAN.md](docs/PLAN.md).

## License

MIT — see [LICENSE](LICENSE).
