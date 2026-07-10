import Phaser from 'phaser';
import { audio } from '../audio/AudioService';
import {
  ENEMIES,
  FLAVOR,
  pickMessage,
  sauceById,
} from '../data/content';
import {
  getAchievement,
  unlockAchievement,
  type AchievementId,
} from '../data/achievements';
import { maybeFlagBossIntroPending } from '../data/bossUnlock';
import { getBestSteps, tryRecordBestSteps } from '../data/highScore';
import { hasAllSauces } from '../data/runState';
import {
  HANGRY_SPRITE_SCALE,
  HANGRY_THRESHOLD,
  HUNGER_PER_ACTION,
  NUGGET_HUNGER,
  TILE_SIZE,
  type RunState,
  type TileType,
} from '../data/types';
import {
  createEnemy,
  createPlayer,
  resetActorIds,
  type Actor,
} from '../entities/Actor';
import {
  generateFloor,
  isWalkable,
  type GeneratedFloor,
} from '../map/DungeonGenerator';
import { MessageLog } from '../systems/MessageLog';
import { manhattan, nextStepToward } from '../systems/pathfinding';

interface Pickup {
  x: number;
  y: number;
  kind: 'nugget' | 'sauce';
  sauceId?: string;
  sprite: Phaser.GameObjects.Image;
}

export class DungeonScene extends Phaser.Scene {
  private run!: RunState;
  private floor!: GeneratedFloor;
  private player!: Actor;
  private enemies: Actor[] = [];
  private pickups: Pickup[] = [];
  private log = new MessageLog(5);
  private busy = false;
  private helpVisible = false;

  private tileLayer!: Phaser.GameObjects.Container;
  private entityLayer!: Phaser.GameObjects.Container;
  private actorSprites = new Map<string, Phaser.GameObjects.Image>();
  private hudText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private floorTitle!: Phaser.GameObjects.Text;
  private helpPanel!: Phaser.GameObjects.Container;
  private sauceGotOnFloor = false;
  private wasHangry = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyWait!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyH!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keySlash!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  /** Nuggets eaten on the current floor/round (for Skinny). */
  private nuggetsThisRound = 0;

  constructor() {
    super('Dungeon');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
    this.busy = false;
    this.helpVisible = false;
    this.sauceGotOnFloor = false;
    this.wasHangry = false;
    this.nuggetsThisRound = 0;
    this.enemies = [];
    this.pickups = [];
    this.actorSprites.clear();
    this.log = new MessageLog(5);
    resetActorIds();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x120e0c);
    this.tileLayer = this.add.container(0, 0);
    this.entityLayer = this.add.container(0, 0);

    this.buildFloor();
    this.buildHud();
    this.bindInput();
    this.refreshHud();
    this.centerCamera();

    this.log.add(`Welcome to ${this.floor.floor.name}.`);
    this.log.add(`Objective: claim the ${sauceById(this.floor.floor.sauceId).name}.`);
    this.refreshLog();

    // Music only during a run; restart-safe if already playing
    void audio.unlock().then(() => {
      audio.startMusic();
    });
  }

  private buildFloor(): void {
    this.floor = generateFloor(this.run.floorIndex, this.run.seed);
    this.tileLayer.removeAll(true);
    this.entityLayer.removeAll(true);
    this.actorSprites.clear();
    this.pickups = [];
    this.enemies = [];
    this.sauceGotOnFloor = this.run.sauces.includes(this.floor.floor.sauceId);

    const { tiles, width, height } = this.floor;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y]![x]!;
        const key = this.tileKey(t);
        const img = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, key);
        img.setDisplaySize(TILE_SIZE, TILE_SIZE);
        this.tileLayer.add(img);
      }
    }

    this.player = createPlayer(
      this.floor.playerStart.x,
      this.floor.playerStart.y,
      this.run.hunger,
      this.run.maxHunger,
      this.run.attack,
    );
    this.wasHangry = this.isHangry();
    this.spawnActorSprite(this.player, this.wasHangry ? 'sprite_player_hangry' : 'sprite_player');
    this.applyHangryVisuals();

    for (const n of this.floor.nuggets) {
      const sprite = this.add.image(
        n.x * TILE_SIZE + TILE_SIZE / 2,
        n.y * TILE_SIZE + TILE_SIZE / 2,
        'sprite_nugget',
      );
      sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.entityLayer.add(sprite);
      this.pickups.push({ x: n.x, y: n.y, kind: 'nugget', sprite });
    }

    if (!this.sauceGotOnFloor) {
      const s = this.floor.saucePos;
      const sid = this.floor.floor.sauceId;
      const sprite = this.add.image(
        s.x * TILE_SIZE + TILE_SIZE / 2,
        s.y * TILE_SIZE + TILE_SIZE / 2,
        `sauce_${sid}`,
      );
      sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.entityLayer.add(sprite);
      this.pickups.push({ x: s.x, y: s.y, kind: 'sauce', sauceId: sid, sprite });
    }

    for (const e of this.floor.enemies) {
      const def = ENEMIES[e.enemyId]!;
      const actor = createEnemy(e.x, e.y, def.id, def.name, def.hp, def.attack);
      this.enemies.push(actor);
      this.spawnActorSprite(actor, `enemy_${def.id}`);
    }
  }

  private tileKey(t: TileType): string {
    switch (t) {
      case 'wall':
        return 'tile_wall';
      case 'door':
        return 'tile_door';
      case 'stairs':
        return 'tile_stairs';
      case 'exit':
        return 'tile_exit';
      case 'sauce_altar':
        return 'tile_altar';
      default:
        return 'tile_floor';
    }
  }

  private spawnActorSprite(actor: Actor, key: string): void {
    const img = this.add.image(
      actor.x * TILE_SIZE + TILE_SIZE / 2,
      actor.y * TILE_SIZE + TILE_SIZE / 2,
      key,
    );
    img.setDisplaySize(TILE_SIZE, TILE_SIZE);
    img.setDepth(10);
    this.entityLayer.add(img);
    this.actorSprites.set(actor.id, img);
  }

  private buildHud(): void {
    const w = this.scale.width;
    this.floorTitle = this.add
      .text(12, 8, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#f5d080',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hudText = this.add
      .text(12, 36, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#e8dcc8',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.logText = this.add
      .text(12, this.scale.height - 12, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#c4b8a0',
        backgroundColor: '#000000cc',
        padding: { x: 8, y: 6 },
        lineSpacing: 3,
        wordWrap: { width: w - 40 },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(100);

    this.helpPanel = this.add.container(w / 2, this.scale.height / 2).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 440, 320, 0x1a1210, 0.95).setStrokeStyle(2, 0xc9a227);
    const ht = this.add
      .text(
        0,
        0,
        [
          'HELP',
          '',
          'Arrows / WASD  — move',
          '. or Space     — wait',
          'Bump enemy     — attack',
          '',
          'Hunger IS your life bar.',
          'Move/attack spends hunger.',
          'At 20% hunger: HANGRY',
          '  (2x damage, bigger, red eyes).',
          'Nuggets refill hunger.',
          'Grab each floor sauce.',
          'Exit needs ALL sauces.',
          'M — mute / unmute',
          '',
          '[ ? / H / ESC ] close',
        ].join('\n'),
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#e8dcc8',
          align: 'left',
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);
    this.helpPanel.add([bg, ht]);
    this.helpPanel.setVisible(false);
  }

  private bindInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.cursors = kb.createCursorKeys();
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyWait = kb.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyH = kb.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.keyEsc = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keySlash = kb.addKey(Phaser.Input.Keyboard.KeyCodes.FORWARD_SLASH);
    this.keyM = kb.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  update(): void {
    if (!this.cursors) return;

    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      const muted = audio.toggleMute();
      this.log.add(muted ? 'Sound muted.' : 'Sound on.');
      if (!muted) {
        void audio.unlock().then(() => {
          audio.play('ui');
          audio.startMusic();
        });
      }
      this.refreshLog();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyH) || Phaser.Input.Keyboard.JustDown(this.keySlash)) {
      this.toggleHelp();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc) && this.helpVisible) {
      this.toggleHelp(false);
      return;
    }

    if (this.busy || this.helpVisible || this.player?.dead) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.playerAction(0, -1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.playerAction(0, 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.playerAction(-1, 0);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.playerAction(1, 0);
    } else if (
      Phaser.Input.Keyboard.JustDown(this.keyWait) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    ) {
      this.playerAction(0, 0);
    }
  }

  private toggleHelp(force?: boolean): void {
    const next = force ?? !this.helpVisible;
    if (next !== this.helpVisible) {
      audio.play('ui');
    }
    this.helpVisible = next;
    this.helpPanel.setVisible(this.helpVisible);
  }

  private playerAction(dx: number, dy: number): void {
    if (this.player.dead || this.busy) return;
    this.busy = true;
    // Re-resume audio on gameplay input (covers suspended contexts after unlock)
    void audio.ensureRunning().then((ok) => {
      if (ok) audio.resumeMusicIfNeeded(true);
    });

    let leftFloor = false;
    let spentAction = false;

    if (dx !== 0 || dy !== 0) {
      const nx = this.player.x + dx;
      const ny = this.player.y + dy;
      if (!this.inBounds(nx, ny) || !isWalkable(this.floor.tiles[ny]![nx]!)) {
        audio.play('bump');
        this.busy = false;
        return;
      }
      const foe = this.enemyAt(nx, ny);
      if (foe) {
        this.attack(this.player, foe);
        spentAction = true;
      } else {
        this.player.x = nx;
        this.player.y = ny;
        this.syncSprite(this.player);
        this.run.stats.steps += 1;
        if (this.run.stats.steps > 100) {
          this.tryUnlockAchievement('get_your_steps_in');
        }
        audio.play('move');
        this.resolvePickups();
        leftFloor = this.tryPortal();
        spentAction = true;
      }
    }

    if (leftFloor) return;

    // Move and attack spend hunger; waiting does not.
    if (spentAction) {
      this.spendHunger(HUNGER_PER_ACTION);
    }

    if (this.player.dead) {
      this.log.add(pickMessage(FLAVOR.starve));
      this.finishDeath(this.run.stats.causeOfDeath ?? 'starvation (the silent franchise killer)');
      return;
    }

    this.run.stats.turnsSurvived += 1;

    this.enemyTurns();
    if (this.player.dead) {
      this.finishDeath(this.run.stats.causeOfDeath ?? 'enemy action');
      return;
    }

    this.syncHangry();
    this.centerCamera();
    this.refreshHud();
    this.refreshLog();
    this.busy = false;
  }

  private isHangry(): boolean {
    if (this.run.maxHunger <= 0) return false;
    return this.run.hunger > 0 && this.run.hunger / this.run.maxHunger <= HANGRY_THRESHOLD;
  }

  private spendHunger(amount: number): void {
    this.run.hunger = Math.max(0, this.run.hunger - amount);
    this.player.hp = this.run.hunger;
    if (this.run.hunger <= 0) {
      this.player.dead = true;
      this.run.stats.causeOfDeath = 'starvation (the silent franchise killer)';
    }
  }

  private syncHangry(): void {
    const hangry = this.isHangry();
    if (hangry && !this.wasHangry) {
      this.log.add(pickMessage(FLAVOR.hangryOn));
      audio.play('hangry');
    } else if (!hangry && this.wasHangry) {
      this.log.add(pickMessage(FLAVOR.hangryOff));
    }
    this.wasHangry = hangry;
    this.applyHangryVisuals();
  }

  private applyHangryVisuals(): void {
    const spr = this.actorSprites.get(this.player.id);
    if (!spr) return;
    const hangry = this.isHangry();
    const key = hangry ? 'sprite_player_hangry' : 'sprite_player';
    if (spr.texture.key !== key) {
      spr.setTexture(key);
    }
    const size = hangry ? TILE_SIZE * HANGRY_SPRITE_SCALE : TILE_SIZE;
    spr.setDisplaySize(size, size);
  }

  private playerAttackDamage(): number {
    return this.isHangry() ? this.player.attack * 2 : this.player.attack;
  }

  private enemyTurns(): void {
    const blocked = this.occupancy(true);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const def = ENEMIES[e.enemyId!]!;
      const dist = manhattan(e, this.player);
      if (dist === 1) {
        this.attack(e, this.player);
        if (this.player.dead) {
          this.run.stats.causeOfDeath = `${e.name} (extra crispy)`;
          return;
        }
        continue;
      }
      if (dist <= def.aggroRange) {
        blocked.delete(`${e.x},${e.y}`);
        const step = nextStepToward(e, this.player, this.floor.tiles, blocked);
        if (step && !this.enemyAt(step.x, step.y) && !(step.x === this.player.x && step.y === this.player.y)) {
          e.x = step.x;
          e.y = step.y;
          this.syncSprite(e);
        }
        blocked.add(`${e.x},${e.y}`);
      } else if (Math.random() < 0.35) {
        // idle wander
        const dirs = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];
        const d = dirs[Math.floor(Math.random() * dirs.length)]!;
        const nx = e.x + d.x;
        const ny = e.y + d.y;
        if (
          this.inBounds(nx, ny) &&
          isWalkable(this.floor.tiles[ny]![nx]!) &&
          !this.enemyAt(nx, ny) &&
          !(nx === this.player.x && ny === this.player.y)
        ) {
          blocked.delete(`${e.x},${e.y}`);
          e.x = nx;
          e.y = ny;
          this.syncSprite(e);
          blocked.add(`${e.x},${e.y}`);
        }
      }
    }
  }

  private attack(attacker: Actor, defender: Actor): void {
    const damage =
      attacker.kind === 'player' ? this.playerAttackDamage() : attacker.attack;
    defender.hp -= damage;

    if (attacker.kind === 'player') {
      audio.play('attack');
      const tag = this.isHangry() ? ' (HANGRY!)' : '';
      this.log.add(`You thwack the ${defender.name} for ${damage}${tag}.`);
    } else {
      audio.play('hit');
      const def = ENEMIES[attacker.enemyId!]!;
      this.log.add(pickMessage(def.messages.attack));
    }

    if (defender.kind === 'player') {
      // Player vitality is hunger only.
      this.run.hunger = Math.max(0, defender.hp);
      defender.hp = this.run.hunger;
    }

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.dead = true;
      if (defender.kind === 'enemy') {
        const def = ENEMIES[defender.enemyId!]!;
        this.log.add(pickMessage(def.messages.death));
        this.run.stats.enemiesSlain += 1;
        const typeId = defender.enemyId!;
        if (!this.run.stats.enemyTypesSlain.includes(typeId)) {
          this.run.stats.enemyTypesSlain.push(typeId);
        }
        const allTypes = Object.keys(ENEMIES);
        if (allTypes.every((id) => this.run.stats.enemyTypesSlain.includes(id))) {
          this.tryUnlockAchievement('combo_meal');
        }
        const spr = this.actorSprites.get(defender.id);
        spr?.destroy();
        this.actorSprites.delete(defender.id);
        this.enemies = this.enemies.filter((e) => e.id !== defender.id);
      } else {
        this.run.hunger = 0;
        this.run.stats.causeOfDeath = `${attacker.name} (extra crispy)`;
        if (attacker.enemyId === 'vengeful_fry') {
          this.tryUnlockAchievement('want_fries');
        }
      }
    }

    // flash
    const spr = this.actorSprites.get(defender.id);
    if (spr) {
      this.tweens.add({
        targets: spr,
        alpha: 0.3,
        duration: 60,
        yoyo: true,
      });
    }
  }

  private resolvePickups(): void {
    const here = this.pickups.filter((p) => p.x === this.player.x && p.y === this.player.y);
    for (const p of here) {
      if (p.kind === 'nugget') {
        this.run.hunger = Math.min(this.run.maxHunger, this.run.hunger + NUGGET_HUNGER);
        this.player.hp = this.run.hunger;
        this.run.stats.nuggetsEaten += 1;
        this.nuggetsThisRound += 1;
        this.log.add(pickMessage(FLAVOR.eatNugget));
        audio.play('eat');
        this.syncHangry();
        if (this.run.stats.nuggetsEaten >= 10) {
          this.tryUnlockAchievement('ten_piece');
        }
        if (this.run.stats.nuggetsEaten >= 20) {
          this.tryUnlockAchievement('twenty_piece');
        }
      } else if (p.kind === 'sauce' && p.sauceId) {
        if (!this.run.sauces.includes(p.sauceId)) {
          this.run.sauces.push(p.sauceId);
          this.run.stats.saucesCollected.push(p.sauceId);
          this.sauceGotOnFloor = true;
          this.log.add(pickMessage(FLAVOR.getSauce));
          this.log.add(sauceById(p.sauceId).blurb);
          audio.play('sauce');
        }
      }
      p.sprite.destroy();
    }
    this.pickups = this.pickups.filter((p) => !(p.x === this.player.x && p.y === this.player.y));
  }

  /** @returns true if the scene is leaving this floor */
  private tryPortal(): boolean {
    const tile = this.floor.tiles[this.player.y]![this.player.x]!;

    if (tile === 'stairs') {
      if (!this.run.sauces.includes(this.floor.floor.sauceId)) {
        this.log.add('The stairs refuse. Floor sauce first — franchise rules.');
        return false;
      }
      this.run.stats.floorsCleared += 1;
      this.run.floorIndex += 1;
      this.run.hunger = this.player.hp;
      this.log.add(pickMessage(FLAVOR.floorClear));
      if (this.nuggetsThisRound === 0) {
        this.tryUnlockAchievement('skinny');
      }
      audio.play('stairs');
      this.scene.restart({ run: this.run });
      return true;
    }

    if (tile === 'exit') {
      if (!this.run.sauces.includes(this.floor.floor.sauceId)) {
        this.log.add('Grab AwesomeSauce first. Priorities.');
        return false;
      }
      if (!hasAllSauces(this.run)) {
        this.log.add(pickMessage(FLAVOR.noExit));
        return false;
      }
      this.run.stats.floorsCleared += 1;
      this.run.stats.victory = true;
      this.run.hunger = this.player.hp;
      const previousBest = getBestSteps();
      this.run.stats.newHighScore = tryRecordBestSteps(this.run.stats.steps);
      // Ketchup: beat a score that already existed (not the first-ever clear)
      if (previousBest !== null && this.run.stats.newHighScore) {
        this.tryUnlockAchievement('ketchup');
      }
      if (this.nuggetsThisRound === 0) {
        this.tryUnlockAchievement('skinny');
      }
      audio.stopMusic();
      this.scene.start('End', { run: this.run });
      return true;
    }

    return false;
  }

  private finishDeath(cause: string): void {
    this.run.stats.causeOfDeath = cause;
    this.run.stats.victory = false;
    this.run.hunger = 0;
    this.player.hp = 0;
    this.tryUnlockAchievement('mc_bummer');
    if (hasAllSauces(this.run)) {
      this.tryUnlockAchievement('saucy');
    }
    audio.stopMusic();
    this.scene.start('End', { run: this.run });
  }

  /** Unlock if new; log + track on run stats. */
  private tryUnlockAchievement(id: AchievementId): void {
    if (!unlockAchievement(id)) return;
    const def = getAchievement(id);
    this.log.add(`Achievement unlocked: ${def.name}`);
    this.refreshLog();
    if (!this.run.stats.newlyUnlockedAchievements) {
      this.run.stats.newlyUnlockedAchievements = [];
    }
    this.run.stats.newlyUnlockedAchievements.push(id);
    maybeFlagBossIntroPending();
  }

  private occupancy(includePlayer: boolean): Set<string> {
    const s = new Set<string>();
    if (includePlayer) s.add(`${this.player.x},${this.player.y}`);
    for (const e of this.enemies) {
      if (!e.dead) s.add(`${e.x},${e.y}`);
    }
    return s;
  }

  private enemyAt(x: number, y: number): Actor | undefined {
    return this.enemies.find((e) => !e.dead && e.x === x && e.y === y);
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.floor.width && y < this.floor.height;
  }

  private syncSprite(actor: Actor): void {
    const spr = this.actorSprites.get(actor.id);
    if (!spr) return;
    spr.setPosition(actor.x * TILE_SIZE + TILE_SIZE / 2, actor.y * TILE_SIZE + TILE_SIZE / 2);
  }

  private centerCamera(): void {
    const px = this.player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = this.player.y * TILE_SIZE + TILE_SIZE / 2;
    this.cameras.main.centerOn(px, py);
  }

  private refreshHud(): void {
    const floorNum = this.run.floorIndex + 1;
    this.floorTitle.setText(
      `Floor ${floorNum}/3 — ${this.floor.floor.name}`,
    );

    const sauces = ['weak_sauce', 'bbq', 'awesome_sauce']
      .map((id) => {
        const s = sauceById(id);
        const got = this.run.sauces.includes(id);
        return got ? `[${s.name}]` : `[····]`;
      })
      .join(' ');

    const huBar = this.bar(this.run.hunger, this.run.maxHunger, 10);
    const hangry = this.isHangry();
    const atk = this.playerAttackDamage();
    const status = hangry ? '  *** HANGRY ***' : '';

    this.hudText.setText(
      [
        `Hunger ${this.run.hunger}/${this.run.maxHunger} ${huBar}${status}`,
        `ATK ${atk}${hangry ? ' (2x)' : ''}   Steps ${this.run.stats.steps}   Nuggets ${this.run.stats.nuggetsEaten}`,
        `Sauces ${sauces}`,
      ].join('\n'),
    );

    this.hudText.setColor(hangry ? '#ff6b6b' : '#e8dcc8');
  }

  private bar(cur: number, max: number, width: number): string {
    const filled = Math.round((Math.max(0, cur) / max) * width);
    return '█'.repeat(filled) + '·'.repeat(Math.max(0, width - filled));
  }

  private refreshLog(): void {
    this.logText.setText(this.log.getLines().join('\n'));
  }
}
