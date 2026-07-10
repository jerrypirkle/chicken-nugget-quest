# Boss of the Sauce — Design Lock

Final achievement-gated stage for **Chicken Nugget Quest**.  
8-bit look preserved; genre shifts from turn-based roguelike to a **vertical-scrolling shooter**.

**Status:** Design locked (ready for implementation)  
**Related:** [PLAN.md](./PLAN.md), achievements in `src/game/data/achievements.ts`

---

## 1. Elevator pitch

After earning all 10 career achievements, the player unlocks **Boss of the Sauce**: a short Galaga-style fly gauntlet, then a three-form fight against **King MacClowen**. Play as a chicken, auto-fire eggs, stock dollar-bill bombs from pocket change, and manage real-time hunger (with HANGRY at ≤20%).

---

## 2. Unlock & entry

| Rule | Decision |
|------|----------|
| Gate | All **10** existing achievements unlocked |
| Title | Permanent option: **Boss of the Sauce** (only when available) |
| On 10th unlock | Cutscene → stage (does not wait for a later visit only) |
| Cutscene | High-res **8-bit portrait of King MacClowen** (generated in-engine, same quality bar as title nugget) + **same 5-second countdown + sounds** as the endgame screen |
| Also | Anytime later: start from **title menu** |
| Dev unlock | `localStorage` flag only (no UI cheat, no URL param). Suggested key: `cnq-boss-dev-unlock=1` |

### Immediate-entry flow (10th achievement)

1. Achievement unlock resolves as today (log / end UI as applicable).
2. Cutscene: MacClowen portrait + 5s countdown (reuse endgame countdown audio/timing).
3. Transition into `BossShooterScene` (or equivalent).

If the 10th unlocks mid-run, finish whatever minimal UI is needed so the countdown is readable, then enter the stage (do not soft-lock the dungeon).

---

## 3. Genre & presentation

| Aspect | Decision |
|--------|----------|
| Art | Custom **8-bit / pixel** sprites (procedural canvas textures like existing game art; portrait quality like **title nugget**) |
| Tone | Silly fast-food absurdist comedy |
| Genre | **Vertical-scrolling shooter** (not grid / not turn-based) |
| Length | **~2–3 minutes** successful clear |
| Pre-boss scroll | Vertical scroll **on** during fly gauntlet |
| Boss scroll | **Freeze scroll** for the King MacClowen arena fight |

---

## 4. Player: chicken

| System | Decision |
|--------|----------|
| Avatar | Chicken (not the roguelike adventurer) |
| Move | Arrow keys / WASD |
| Primary fire | **Auto-fire eggs** (upward) |
| Bomb | **Space** — spend 1 stocked dollar-bill bomb |
| Mute | **M** (existing audio service) |

No mouse/touch requirement for v1. No focus-slow mode for v1.

---

## 5. Hunger (real-time)

| Rule | Decision |
|------|----------|
| Model | Hunger is the life resource |
| Drain | **Passive drain over time** |
| Hits | Fly / boss contact or bullets **subtract hunger** |
| Death | Hunger ≤ 0 |
| Nuggets | Occasional pickups **restore hunger** |
| HANGRY | At **≤20%** max hunger: **2× damage** on eggs and bombs |
| Stage start | Fresh **100** hunger (not carried from dungeon run) unless changed later |

HUD: hunger bar + HANGRY feedback consistent with roguelike fantasy.

---

## 6. Coins & dollar bombs

| Rule | Decision |
|------|----------|
| Denominations | **1¢, 5¢, 10¢, 25¢** (US) |
| Placement | **Risk-reward lanes** — better value on more dangerous paths |
| Wallet | Running cent total this attempt |
| Threshold | Every **100¢** → **+1 bomb** stock; subtract 100¢ from wallet (remainder keeps) |
| Fire | **Space** consumes 1 bomb (if stock ≥ 1) |
| VFX | Projectile / blast reads as a **dollar bill** |
| Power | **Mid** — heavy splash / ~half-screen; not full clear, not weak tick |
| On retry | **Reset** wallet, bomb stock, and pickups for a clean arcade attempt |

---

## 7. Fly gauntlet (pre-boss)

| Rule | Decision |
|------|----------|
| Enemy | Flies |
| Staging | **Galaga-style bonus waves**: enter in formation, loop / path, dive in readable patterns |
| Duration | Short; feeds overall **2–3 min** clear with boss |
| Scroll | Vertical scrolling **active** |
| Drops | Coins (risk lanes) + occasional **nuggets** |

No separate midboss required for v1; formation spectacle carries the gauntlet.

---

## 8. King MacClowen

**Identity:** Parody mash of Ronald McDonald, Burger King, and Wendy’s pigtails.

### Form order (locked)

1. **Pigtails** — “friendly” opener  
2. **Crown** — royal / BK-coded mid  
3. **Clown** — nightmare finale  

### Fight rules

| Rule | Decision |
|------|----------|
| Structure | **Three-form** continuous boss; patterns change per form (HP thresholds or form HP bars) |
| Scroll | **Frozen** for entire boss arena |
| Adds | Optional light fly adds if needed for pacing; not required in first pass |
| Portrait | In-engine generated high-res 8-bit portrait for cutscene (title-nugget quality bar) |

Each form should be visually distinct (palette, headgear, attack telegraphs) on a shared body language.

---

## 9. Failure & retry

| Rule | Decision |
|------|----------|
| On death | **Arcade retry** — restart **Boss of the Sauce** only |
| Roguelike | Do **not** force a full dungeon reroll |
| Economy | Wallet + bombs reset on retry |
| Hunger | Reset to stage start (100) |

---

## 10. Rewards & persistence

| Reward | Decision |
|--------|----------|
| Achievement | **11th secret achievement: “Franchisee”** (beats King MacClowen) |
| High score | Track best **damage dealt + nuggets eaten** (single combined score metric for the stage) |
| Storage | `localStorage` (same pattern as achievements / best steps) |
| Title flair | Optional victory line / indicator that Franchisee is earned (keep light) |

### Score metric (locked)

```
bossScore = totalDamageDealt + nuggetsEaten
```

Persist **best** `bossScore` across clears. Show on stage HUD end and title if useful.

### Achievements UI note

Career grid today is “exactly 10.” **Franchisee** is an 11th:

- Keep the 10-slot row for the original set.
- Show Franchisee as a **secret / bonus** slot (e.g. under the row or “★ Franchisee”) when unlocked or as `???` when boss is available but not beaten.

---

## 11. Audio

| Moment | Direction |
|--------|-----------|
| Cutscene countdown | **Reuse** endgame 5s countdown SFX / timing |
| Stage BGM | New short loop or variant (fast-food circus / fryer panic) — can stub then polish |
| SFX | Egg shot, coin pickup, bomb, hit, form change sting, victory jingle |

---

## 12. Controls summary

| Input | Action |
|-------|--------|
| ←→↑↓ / WASD | Move chicken |
| (auto) | Fire eggs upward |
| **Space** | Fire dollar-bill bomb (if stocked) |
| M | Mute / unmute |

---

## 13. Technical sketch (implementation)

### New / touched areas

| Area | Work |
|------|------|
| `scenes/BossShooterScene.ts` | Main stage: scroll gauntlet + frozen boss arena |
| `scenes/BossCutsceneScene.ts` (or phase inside shooter) | Portrait + 5s countdown |
| `data/achievements.ts` | `franchisee` id; `areAllAchievementsUnlocked()`; unlock on boss win |
| `data/bossScore.ts` | Best damage+nuggets persistence |
| `data/bossUnlock.ts` | Availability = all 10 **or** dev flag |
| `assets/generateTextures.ts` | Chicken, egg, flies, coins, nugget, dollar bomb, MacClowen forms + portrait |
| `TitleScene` | Menu entry when unlocked |
| Achievement unlock path / `EndScene` | Trigger cutscene when 10th completes |
| Physics | Phaser **Arcade** physics (real-time), not turn manager |

### Dev flag

```js
localStorage.setItem('cnq-boss-dev-unlock', '1')
```

Clear with `removeItem`. Production builds can honor the same flag for QA.

### Suggested scene flow

```
Title ──(Boss of the Sauce)──► Cutscene ──► BossShooter ──win──► Victory / Franchisee
                ▲                    ▲            │
                │                    │            └──death──► Retry prompt ──► BossShooter
   all 10 unlock (from End / dungeon)
```

---

## 14. Acceptance criteria

- [ ] Stage unavailable until all 10 achievements **or** dev flag  
- [ ] Title shows **Boss of the Sauce** when available  
- [ ] On 10th achievement: portrait cutscene + 5s countdown + enter stage  
- [ ] Chicken moves, auto eggs, Space bombs, hunger drain + hits, HANGRY at ≤20%  
- [ ] Coins 1/5/10/25 in risk lanes; 100¢ → +1 bomb  
- [ ] Galaga-like fly formations while scrolling  
- [ ] Boss: scroll frozen; forms **Pigtails → Crown → Clown**  
- [ ] Death retries stage only; economy/hunger reset  
- [ ] Win unlocks **Franchisee**; updates best **damage + nuggets eaten**  
- [ ] Art stays 8-bit; portrait matches title-nugget quality bar  

---

## 15. Out of scope (v1)

- Mouse / touch controls  
- Focus (slow move) mode  
- Carrying dungeon hunger/sauces into the stage  
- Online leaderboards  
- Full-screen nuke bomb  
- Extra midboss between flies and King  

---

## 16. Decision log (Q&A)

| Topic | Lock |
|-------|------|
| Stage name | **Boss of the Sauce** |
| Entry | Title unlock **and** immediate path after all 10 |
| Health | Drain over time + hit damage; HANGRY ≤20% = 2× damage |
| Primary fire | Auto-fire **eggs** |
| Bomb key | **Space** |
| Coins → bomb | Stock every 100¢; fire on key |
| Coin layout | Risk-reward lanes |
| Flies | Galaga-style formation waves |
| Boss forms | **Pigtails → Crown → Clown**; freeze scroll |
| Duration | Short arcade 2–3 min |
| Cutscene | In-engine MacClowen portrait + endgame-style 5s countdown |
| Failure | Arcade retry boss only |
| Rewards | **Franchisee** achievement + high score (damage + nuggets eaten) |
| Portrait art | Generate in-engine (title nugget bar) |
| Dev | `localStorage` flag only |

---

*Last updated: 2026-07-08*
