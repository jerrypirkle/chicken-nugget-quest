import Phaser from 'phaser';
import { audio } from '../audio/AudioService';
import { unlockAchievement } from '../data/achievements';
import { submitBossScore, getBestBossScore, formatBossScore } from '../data/bossScore';

const HUNGER_MAX = 100;
const HUNGER_DRAIN_PER_SEC = 1.8;
const HUNGER_NUGGET = 22;
const FLY_CONTACT_DMG = 10;
const BOSS_CONTACT_DMG = 18;
const BOSS_BULLET_DMG = 12;
const PLAYER_SPEED = 300;
const EGG_SPEED = 420;
const EGG_COOLDOWN_MS = 140;
const EGG_BASE_DMG = 8;
const BOMB_DMG = 55;
const SCROLL_SPEED = 55;

type Phase = 'gauntlet' | 'boss' | 'won' | 'dead';

interface FlyData {
  hp: number;
  pathT: number;
  pathSpeed: number;
  formationX: number;
  formationY: number;
  diving: boolean;
  diveVx: number;
  diveVy: number;
}

interface BossData {
  form: 0 | 1 | 2;
  hp: number;
  maxHp: number;
  shootTimer: number;
  /** Counts volleys; every 3rd shot replaces one projectile with a coin. */
  shotCount: number;
  /** Random wander target (screen space). */
  targetX: number;
  targetY: number;
  /** Seconds until we force a new random target. */
  retargetIn: number;
}

const FORM_KEYS = ['boss_mac_pigtails', 'boss_mac_crown', 'boss_mac_clown'] as const;
const FORM_NAMES = ['Pigtails Protocol', 'Crown Privilege', 'Clown Court'] as const;
const FORM_HP = [280, 320, 360];
/** Display size for high-res portrait forms (escalates slightly each phase). */
const FORM_SIZE = [128, 148, 168] as const;
/**
 * Base move speed (px/s). Each form is 2× the previous:
 * form 0 = 1×, form 1 = 2×, form 2 = 4×.
 */
const BOSS_BASE_SPEED = 95;

/**
 * Boss of the Sauce — vertical shooter: Galaga-style flies, then frozen 3-form boss.
 */
export class BossShooterScene extends Phaser.Scene {
  private phase: Phase = 'gauntlet';
  private hunger = HUNGER_MAX;
  private hangry = false;
  private cents = 0;
  private bombs = 0;
  private damageDealt = 0;
  private nuggetsEaten = 0;
  private ended = false;

  private player!: Phaser.Physics.Arcade.Sprite;
  private eggs!: Phaser.Physics.Arcade.Group;
  private flies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private bossBullets!: Phaser.Physics.Arcade.Group;
  private bombsGroup!: Phaser.Physics.Arcade.Group;
  private boss?: Phaser.Physics.Arcade.Sprite;
  private bossData?: BossData;
  /** Red wash overlay (never tint the portrait textures). */
  private bossHitFx?: Phaser.GameObjects.Rectangle;
  /** Brief i-frames after a form change so multi-egg frames don't glitch the new form. */
  private bossFormIframesUntil = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private lastEggAt = 0;
  private invulnUntil = 0;
  private flapFrame = 0;
  private nextFlapAt = 0;

  private hudHunger!: Phaser.GameObjects.Text;
  private hudWallet!: Phaser.GameObjects.Text;
  private hudPhase!: Phaser.GameObjects.Text;
  private hudBoss!: Phaser.GameObjects.Text;
  private scrollY = 0;
  private bgStars: Phaser.GameObjects.Rectangle[] = [];

  private wavesSpawned = 0;
  private readonly totalWaves = 4;
  private nextWaveAt = 0;
  private gauntletDone = false;
  /** Timestamp when red hit FX should hide. */
  private bossFlashUntil = 0;
  /** Next boss-phase edge nugget drop (ms timestamp). */
  private nextBossNuggetAt = 0;

  constructor() {
    super('BossShooter');
  }

  create(): void {
    const { width, height } = this.scale;
    this.phase = 'gauntlet';
    this.hunger = HUNGER_MAX;
    this.hangry = false;
    this.cents = 0;
    this.bombs = 0;
    this.damageDealt = 0;
    this.nuggetsEaten = 0;
    this.ended = false;
    this.wavesSpawned = 0;
    this.gauntletDone = false;
    this.scrollY = 0;
    this.boss = undefined;
    this.bossData = undefined;
    this.bossHitFx = undefined;
    this.invulnUntil = 0;
    this.bossFlashUntil = 0;
    this.bossFormIframesUntil = 0;
    this.nextBossNuggetAt = 0;
    this.lastEggAt = 0;
    this.bgStars = [];

    void audio.unlock();
    audio.stopMusic();
    audio.startMusic();

    this.add.rectangle(width / 2, height / 2, width, height, 0x120c18);

    // Parallax starfield
    for (let i = 0; i < 40; i++) {
      const star = this.add
        .rectangle(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height),
          Phaser.Math.Between(1, 3),
          Phaser.Math.Between(1, 3),
          0xf5d080,
          Phaser.Math.FloatBetween(0.2, 0.7),
        )
        .setDepth(0);
      this.bgStars.push(star);
    }

    this.eggs = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 160, // hangry 3-way spray needs more projectiles
      runChildUpdate: false,
    });
    this.flies = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.bossBullets = this.physics.add.group();
    this.bombsGroup = this.physics.add.group();

    this.player = this.physics.add.sprite(width / 2, height - 70, 'boss_chicken');
    this.player.setCollideWorldBounds(true);
    this.player.setDisplaySize(48, 48);
    this.player.setDepth(10);
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    pBody.setSize(14, 16);
    pBody.setOffset(5, 4);
    this.flapFrame = 0;
    this.nextFlapAt = 0;

    this.physics.add.overlap(this.eggs, this.flies, (egg, fly) => {
      this.hitFly(egg as Phaser.Physics.Arcade.Image, fly as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.flies, (_p, fly) => {
      this.playerHitFly(fly as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.pickups, (_p, pickup) => {
      this.collectPickup(pickup as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.bossBullets, (_p, b) => {
      this.playerHitBullet(b as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.overlap(this.eggs, this.bossBullets, () => {
      /* eggs don't cancel bullets */
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.on('keydown-M', () => {
      void audio.unlock();
      audio.toggleMute();
    });

    this.hudPhase = this.add
      .text(12, 10, 'BOSS OF THE SAUCE — Fly Gauntlet', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#f5d080',
      })
      .setDepth(100)
      .setScrollFactor(0);

    this.hudHunger = this.add
      .text(12, 32, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#e8dcc8',
      })
      .setDepth(100)
      .setScrollFactor(0);

    this.hudWallet = this.add
      .text(12, 52, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#6dffb0',
      })
      .setDepth(100)
      .setScrollFactor(0);

    this.hudBoss = this.add
      .text(width / 2, 32, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#ff6b6b',
      })
      .setOrigin(0.5, 0)
      .setDepth(100)
      .setScrollFactor(0);

    this.add
      .text(width - 12, 10, `Best: ${formatBossScore(getBestBossScore())}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#8a7a68',
      })
      .setOrigin(1, 0)
      .setDepth(100)
      .setScrollFactor(0);

    this.add
      .text(width / 2, height - 14, 'WASD/Arrows move  ·  auto eggs  ·  SPACE bomb  ·  M mute', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#6a5a48',
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0);

    this.nextWaveAt = this.time.now + 800;
    this.updateHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
      audio.stopMusic();
    });
  }

  update(_t: number, dtMs: number): void {
    if (this.ended) return;
    const dt = dtMs / 1000;

    // Background scroll during gauntlet only
    if (this.phase === 'gauntlet') {
      this.scrollY += SCROLL_SPEED * dt;
      for (const star of this.bgStars) {
        star.y += SCROLL_SPEED * dt * (0.5 + star.width * 0.1);
        if (star.y > this.scale.height) {
          star.y = -4;
          star.x = Phaser.Math.Between(0, this.scale.width);
        }
      }
    }

    this.hunger -= HUNGER_DRAIN_PER_SEC * dt;
    this.checkHangry();
    if (this.hunger <= 0) {
      this.die('Starved mid-flight. The franchise is merciless.');
      return;
    }

    this.movePlayer();
    this.updateChickenFlap();
    this.autoFireEggs();
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.fireBomb();
    }

    if (this.phase === 'gauntlet') {
      this.updateGauntlet();
      this.updateFlies(dt);
    } else if (this.phase === 'boss' && this.boss && this.bossData) {
      this.updateBoss(dt);
      this.updateBossFlash();
      this.updateBossNuggetDrops();
      // Two-arg callback: never confuse egg with boss when destroying
      this.physics.world.overlap(this.eggs, this.boss, (obj1, obj2) => {
        this.hitBossFromOverlap(obj1 as Phaser.GameObjects.GameObject, obj2 as Phaser.GameObjects.GameObject);
      });
      this.physics.world.overlap(this.player, this.boss, () => {
        this.hurtPlayer(BOSS_CONTACT_DMG);
      });
    }

    this.cleanupOffscreen();
    this.updateHud();
  }

  private movePlayer(): void {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left?.isDown || this.wasd.left.isDown) vx -= 1;
    if (this.cursors.right?.isDown || this.wasd.right.isDown) vx += 1;
    if (this.cursors.up?.isDown || this.wasd.up.isDown) vy -= 1;
    if (this.cursors.down?.isDown || this.wasd.down.isDown) vy += 1;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      body.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
    } else {
      body.setVelocity(0, 0);
    }
  }

  private chickenTextureKeys(): [string, string] {
    return this.hangry
      ? ['boss_chicken_hangry', 'boss_chicken_hangry_b']
      : ['boss_chicken', 'boss_chicken_b'];
  }

  private updateChickenFlap(): void {
    if (this.time.now < this.nextFlapAt) return;
    this.nextFlapAt = this.time.now + 120;
    this.flapFrame = 1 - this.flapFrame;
    const keys = this.chickenTextureKeys();
    this.player.setTexture(keys[this.flapFrame]!);
    this.player.setDisplaySize(48, 48);
  }

  private eggDamage(): number {
    return this.hangry ? EGG_BASE_DMG * 2 : EGG_BASE_DMG;
  }

  private bombDamage(): number {
    return this.hangry ? BOMB_DMG * 2 : BOMB_DMG;
  }

  private autoFireEggs(): void {
    const now = this.time.now;
    if (now - this.lastEggAt < EGG_COOLDOWN_MS) return;
    this.lastEggAt = now;

    // Hangry: 3-way spray (left / straight / right). Normal: single shot up.
    const angles = this.hangry
      ? [-0.38, 0, 0.38] // radians off straight-up
      : [0];

    for (const ang of angles) {
      this.spawnEgg(ang);
    }
  }

  /** Fire one egg; `ang` is radians offset from straight up (negative = left). */
  private spawnEgg(ang: number): void {
    const egg = this.eggs.get(this.player.x, this.player.y - 20, 'boss_egg') as
      | Phaser.Physics.Arcade.Image
      | null;
    if (!egg) return;
    egg.setActive(true).setVisible(true);
    egg.setDisplaySize(16, 20);
    if (this.hangry) {
      egg.setTint(0xffccaa); // warm tint so spray reads as hangry fire
    } else {
      egg.clearTint();
    }
    this.physics.world.enable(egg);
    const body = egg.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Straight up is angle -π/2 in Phaser velocity space (x right, y down)
    const dir = -Math.PI / 2 + ang;
    body.setVelocity(Math.cos(dir) * EGG_SPEED, Math.sin(dir) * EGG_SPEED);
    body.setSize(10, 12);
    egg.setData('dmg', this.eggDamage());
  }

  private fireBomb(): void {
    if (this.bombs <= 0) {
      audio.play('bump');
      return;
    }
    this.bombs -= 1;
    audio.play('sauce');

    const bill = this.bombsGroup.create(
      this.player.x,
      this.player.y - 30,
      'boss_dollar',
    ) as Phaser.Physics.Arcade.Sprite;
    bill.setDisplaySize(28, 20);
    bill.setDepth(15);
    const body = bill.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, -220);

    // Detonate after short flight
    this.time.delayedCall(280, () => {
      if (!bill.active) return;
      this.detonateBomb(bill.x, bill.y);
      bill.destroy();
    });
  }

  /** Dollar bomb: damages every enemy currently on screen (full clear). */
  private detonateBomb(x: number, y: number): void {
    const { width, height } = this.scale;
    // Full-screen flash + expanding ring for feedback
    const flash = this.add
      .rectangle(width / 2, height / 2, width, height, 0x6dffb0, 0.28)
      .setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 220,
      onComplete: () => flash.destroy(),
    });
    const ring = this.add.circle(x, y, 12, 0x6dffb0, 0.4).setDepth(21);
    this.tweens.add({
      targets: ring,
      radius: Math.max(width, height),
      alpha: 0,
      duration: 320,
      onComplete: () => ring.destroy(),
    });
    this.cameras.main.shake(120, 0.008);
    audio.play('attack');

    const dmg = this.bombDamage();

    // All flies on screen
    this.flies.getChildren().forEach((obj) => {
      const fly = obj as Phaser.Physics.Arcade.Sprite;
      if (!fly.active) return;
      if (this.isOnScreen(fly.x, fly.y)) {
        this.damageFly(fly, dmg);
      }
    });

    // King MacClowen if present and on screen
    if (this.boss?.active && this.bossData && this.isOnScreen(this.boss.x, this.boss.y)) {
      this.applyBossDamage(dmg);
    }
  }

  private isOnScreen(px: number, py: number, pad = 40): boolean {
    const { width, height } = this.scale;
    return px >= -pad && px <= width + pad && py >= -pad && py <= height + pad;
  }

  private updateGauntlet(): void {
    if (this.gauntletDone) {
      if (this.flies.countActive(true) === 0) {
        this.startBoss();
      }
      return;
    }
    if (this.time.now >= this.nextWaveAt && this.wavesSpawned < this.totalWaves) {
      this.spawnWave(this.wavesSpawned);
      this.wavesSpawned += 1;
      this.nextWaveAt = this.time.now + 3200;
      if (this.wavesSpawned >= this.totalWaves) {
        this.gauntletDone = true;
      }
    }
  }

  private spawnWave(index: number): void {
    const { width } = this.scale;
    const count = 8 + index * 2;
    const rows = index % 2 === 0 ? 2 : 3;
    const cols = Math.ceil(count / rows);
    const spacingX = Math.min(70, (width - 120) / cols);
    const startX = width / 2 - ((cols - 1) * spacingX) / 2;
    const baseY = -40;

    let n = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (n >= count) break;
        const fx = startX + c * spacingX;
        const fy = baseY - r * 36;
        const fly = this.flies.create(fx, fy - 80, 'boss_fly') as Phaser.Physics.Arcade.Sprite;
        fly.setDisplaySize(28, 28);
        fly.setData('data', {
          hp: 12 + index * 4,
          pathT: c * 0.15 + r * 0.4,
          pathSpeed: 1.1 + index * 0.15,
          formationX: fx,
          formationY: 80 + r * 40 + index * 10,
          diving: false,
          diveVx: 0,
          diveVy: 0,
        } satisfies FlyData);
        const body = fly.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(16, 16);
        n++;
      }
    }

    // Risk-reward coin lanes: center safer pennies, edges quarters/dimes
    this.spawnCoinLane(width * 0.5, -20, 1);
    this.spawnCoinLane(width * 0.2, -60, index >= 1 ? 10 : 5);
    this.spawnCoinLane(width * 0.8, -60, index >= 1 ? 10 : 5);
    if (index >= 2) {
      this.spawnCoinLane(width * 0.12, -100, 25);
      this.spawnCoinLane(width * 0.88, -100, 25);
    }
    if (index === 1 || index === 3) {
      // Edge lanes only (left / right) — never center
      this.spawnEdgeNugget(-90);
    }

    audio.play('ui');
  }

  private spawnCoinLane(
    x: number,
    y: number,
    cents: 1 | 5 | 10 | 25,
    vx = 0,
    vy = SCROLL_SPEED + 40,
  ): void {
    const key =
      cents === 1
        ? 'boss_coin_1'
        : cents === 5
          ? 'boss_coin_5'
          : cents === 10
            ? 'boss_coin_10'
            : 'boss_coin_25';
    const coin = this.pickups.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    coin.setDisplaySize(22, 22);
    coin.setDepth(6);
    coin.setData('kind', 'coin');
    coin.setData('cents', cents);
    const body = coin.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(vx, vy);
  }

  /** Weighted random denomination for boss-volley coin drops (enough to bank bombs). */
  private randomBossCoinCents(): 1 | 5 | 10 | 25 {
    const r = Math.random();
    if (r < 0.15) return 1;
    if (r < 0.35) return 5;
    if (r < 0.7) return 10;
    return 25;
  }

  /**
   * Nuggets only spawn on the left or right edge of the screen (risk lanes).
   * `y` is spawn height (usually above the top).
   */
  private spawnEdgeNugget(y = -30): void {
    const { width } = this.scale;
    // Outer ~18% of the screen on each side
    const left = Phaser.Math.Between(Math.floor(width * 0.06), Math.floor(width * 0.18));
    const right = Phaser.Math.Between(Math.floor(width * 0.82), Math.floor(width * 0.94));
    const x = Math.random() < 0.5 ? left : right;
    this.spawnNugget(x, y);
  }

  private spawnNugget(x: number, y: number): void {
    const n = this.pickups.create(x, y, 'boss_nugget') as Phaser.Physics.Arcade.Sprite;
    n.setDisplaySize(24, 24);
    n.setData('kind', 'nugget');
    n.setDepth(6);
    const body = n.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Fall downward (works in gauntlet scroll and frozen boss arena)
    body.setVelocity(0, 70);
  }

  /** Periodic edge nugget drops while fighting King MacClowen. */
  private updateBossNuggetDrops(): void {
    if (this.ended) return;
    if (this.time.now < this.nextBossNuggetAt) return;
    // Every 4.4–7.6s (50% fewer than the original 2.2–3.8s cadence)
    this.nextBossNuggetAt = this.time.now + Phaser.Math.Between(4400, 7600);
    this.spawnEdgeNugget(-28);
  }

  private updateFlies(dt: number): void {
    const { width, height } = this.scale;
    this.flies.getChildren().forEach((obj) => {
      const fly = obj as Phaser.Physics.Arcade.Sprite;
      if (!fly.active) return;
      const d = fly.getData('data') as FlyData;
      d.pathT += d.pathSpeed * dt;

      if (!d.diving) {
        // Enter then figure-8 / sine formation (Galaga-ish)
        const enter = Math.min(1, d.pathT / 2);
        const sway = Math.sin(d.pathT * 2.2) * 40;
        const bob = Math.sin(d.pathT * 1.5 + d.formationX) * 12;
        fly.x = d.formationX + sway * enter;
        fly.y = Phaser.Math.Linear(d.formationY - 120, d.formationY, enter) + bob;

        // Random dive toward player
        if (enter >= 1 && Math.random() < 0.003) {
          d.diving = true;
          const angle = Phaser.Math.Angle.Between(fly.x, fly.y, this.player.x, this.player.y);
          const spd = 180 + Math.random() * 80;
          d.diveVx = Math.cos(angle) * spd;
          d.diveVy = Math.sin(angle) * spd;
        }
      } else {
        fly.x += d.diveVx * dt;
        fly.y += d.diveVy * dt;
        if (fly.y > height + 40 || fly.x < -40 || fly.x > width + 40) {
          // Return to formation
          d.diving = false;
          d.pathT = 2;
          fly.x = d.formationX;
          fly.y = d.formationY;
        }
      }
    });
  }

  private hitFly(
    egg: Phaser.Physics.Arcade.Image,
    fly: Phaser.Physics.Arcade.Sprite,
  ): void {
    if (!egg.active || !fly.active) return;
    const dmg = (egg.getData('dmg') as number) || this.eggDamage();
    egg.destroy();
    this.damageFly(fly, dmg);
  }

  private damageFly(fly: Phaser.Physics.Arcade.Sprite, dmg: number): void {
    const d = fly.getData('data') as FlyData;
    d.hp -= dmg;
    this.damageDealt += dmg;
    audio.play('hit');
    fly.setTintFill(0xffffff);
    this.time.delayedCall(50, () => {
      if (fly.active) fly.clearTint();
    });
    if (d.hp <= 0) {
      // chance drop
      if (Math.random() < 0.35) {
        const centsRoll = Math.random();
        const cents: 1 | 5 | 10 | 25 =
          centsRoll > 0.92 ? 25 : centsRoll > 0.75 ? 10 : centsRoll > 0.45 ? 5 : 1;
        this.spawnCoinLane(fly.x, fly.y, cents);
      }
      fly.destroy();
      audio.play('attack');
    }
  }

  private playerHitFly(fly: Phaser.Physics.Arcade.Sprite): void {
    if (!fly.active) return;
    this.hurtPlayer(FLY_CONTACT_DMG);
  }

  private playerHitBullet(b: Phaser.Physics.Arcade.Image): void {
    if (!b.active) return;
    b.destroy();
    this.hurtPlayer(BOSS_BULLET_DMG);
  }

  private hurtPlayer(amount: number): void {
    if (this.time.now < this.invulnUntil) return;
    this.invulnUntil = this.time.now + 600;
    this.hunger -= amount;
    audio.play('hit');
    this.player.setTint(0xff6666);
    this.time.delayedCall(120, () => {
      if (this.player.active) this.player.clearTint();
    });
    this.checkHangry();
    if (this.hunger <= 0) {
      this.die('You were deep-fried by the competition.');
    }
  }

  private checkHangry(): void {
    const was = this.hangry;
    this.hangry = this.hunger <= HUNGER_MAX * 0.2 && this.hunger > 0;
    if (this.hangry && !was) {
      audio.play('hangry');
    }
    if (this.hangry !== was) {
      const keys = this.chickenTextureKeys();
      this.player.setTexture(keys[this.flapFrame]!);
      this.player.setDisplaySize(48, 48);
    }
  }

  private collectPickup(p: Phaser.Physics.Arcade.Sprite): void {
    if (!p.active) return;
    const kind = p.getData('kind') as string;
    if (kind === 'coin') {
      const c = p.getData('cents') as number;
      this.cents += c;
      while (this.cents >= 100) {
        this.cents -= 100;
        this.bombs += 1;
        audio.play('sauce');
      }
      audio.play('ui');
    } else if (kind === 'nugget') {
      this.hunger = Math.min(HUNGER_MAX, this.hunger + HUNGER_NUGGET);
      this.nuggetsEaten += 1;
      audio.play('eat');
      this.checkHangry();
    }
    p.destroy();
  }

  private startBoss(): void {
    if (this.phase === 'boss') return;
    this.phase = 'boss';
    this.hudPhase.setText('BOSS OF THE SAUCE — King MacClowen');
    audio.play('highScore');

    // Clear remaining pickups velocity freeze scroll feel
    this.pickups.getChildren().forEach((o) => {
      const s = o as Phaser.Physics.Arcade.Sprite;
      const b = s.body as Phaser.Physics.Arcade.Body | null;
      if (b) b.setVelocity(0, 30);
    });

    const { width } = this.scale;
    this.bossData = {
      form: 0,
      hp: FORM_HP[0]!,
      maxHp: FORM_HP[0]!,
      shootTimer: 0,
      shotCount: 0,
      targetX: width / 2,
      targetY: 120,
      retargetIn: 0,
    };
    const size0 = FORM_SIZE[0]!;
    this.boss = this.physics.add.sprite(width / 2, 120, FORM_KEYS[0]);
    this.boss.setDepth(8);
    this.applyBossFormVisual(0);
    this.pickBossTarget(true);
    // Hit FX sits above the boss portrait
    this.bossHitFx = this.add
      .rectangle(width / 2, 120, size0 * 0.55, size0 * 0.55, 0xff2222, 0.55)
      .setDepth(9)
      .setVisible(false);

    this.cameras.main.flash(200, 245, 208, 128);
    this.showBanner(FORM_NAMES[0]!);
    // First boss-phase nugget after intro (also 50% rarer cadence)
    this.nextBossNuggetAt = this.time.now + 3600;
  }

  /** Apply form texture + size + hitbox; always force visible/alpha. */
  private applyBossFormVisual(form: 0 | 1 | 2): void {
    if (!this.boss) return;
    const key = FORM_KEYS[form];
    const size = FORM_SIZE[form]!;
    if (this.textures.exists(key)) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.boss.clearTint();
    this.boss.setAlpha(1);
    this.boss.setVisible(true);
    this.boss.setActive(true);
    this.boss.setTexture(key);
    // setTexture can reset scale — always re-apply display size after
    this.boss.setDisplaySize(size, size);
    this.applyBossHitbox(size);
    if (this.bossHitFx) {
      this.bossHitFx.setSize(size * 0.55, size * 0.55);
      this.bossHitFx.setVisible(false);
    }
  }

  private applyBossHitbox(displaySize: number): void {
    if (!this.boss) return;
    const body = this.boss.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    body.setImmovable(true);
    // Size in unscaled frame pixels; Arcade scales with the sprite
    const frame = this.boss.frame;
    const fw = Math.max(1, frame.realWidth || frame.width || 1024);
    const fh = Math.max(1, frame.realHeight || frame.height || 1024);
    const hitFrac = 0.4;
    const hitW = fw * hitFrac;
    const hitH = fh * hitFrac;
    body.setSize(hitW, hitH, false);
    body.setOffset((fw - hitW) / 2, (fh - hitH) / 2);
    // Keep body online after texture swaps
    body.updateFromGameObject();
    void displaySize;
  }

  private showBanner(text: string): void {
    const { width, height } = this.scale;
    const t = this.add
      .text(width / 2, height * 0.4, text, {
        fontFamily: 'Courier New, monospace',
        fontSize: '22px',
        color: '#f5d080',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: height * 0.35,
      duration: 1600,
      onComplete: () => t.destroy(),
    });
  }

  /** Form 0 = 1×, form 1 = 2×, form 2 = 4× base speed. */
  private bossSpeed(): number {
    const form = this.bossData?.form ?? 0;
    return BOSS_BASE_SPEED * Math.pow(2, form);
  }

  /**
   * Pick a random point in the upper arena. Forms stay on-screen;
   * faster forms retarget more often so motion stays chaotic.
   */
  private pickBossTarget(immediate = false): void {
    if (!this.bossData || !this.boss) return;
    const { width, height } = this.scale;
    const marginX = 70;
    const minY = 70;
    const maxY = Math.min(height * 0.42, 260);
    this.bossData.targetX = Phaser.Math.Between(marginX, Math.floor(width - marginX));
    this.bossData.targetY = Phaser.Math.Between(minY, Math.floor(maxY));
    // Faster forms change direction more often
    const form = this.bossData.form;
    const minT = immediate ? 0.05 : Math.max(0.25, 0.9 / Math.pow(2, form));
    const maxT = Math.max(0.45, 1.6 / Math.pow(2, form));
    this.bossData.retargetIn = Phaser.Math.FloatBetween(minT, maxT);
  }

  private updateBoss(dt: number): void {
    if (!this.boss || !this.bossData || !this.boss.active) return;
    const bd = this.bossData;
    const { width, height } = this.scale;

    bd.retargetIn -= dt;
    const dx = bd.targetX - this.boss.x;
    const dy = bd.targetY - this.boss.y;
    const dist = Math.hypot(dx, dy);

    // Arrive or timer expired → new random destination
    if (bd.retargetIn <= 0 || dist < 12) {
      this.pickBossTarget();
    }

    const speed = this.bossSpeed();
    if (dist > 1) {
      this.boss.x += (dx / dist) * speed * dt;
      this.boss.y += (dy / dist) * speed * dt;
    }

    // Clamp to upper playfield
    const marginX = 60;
    const minY = 60;
    const maxY = Math.min(height * 0.45, 280);
    this.boss.x = Phaser.Math.Clamp(this.boss.x, marginX, width - marginX);
    this.boss.y = Phaser.Math.Clamp(this.boss.y, minY, maxY);

    // Light jitter so path never looks perfectly linear
    this.boss.x += Math.sin(this.time.now / 180 + bd.form) * 8 * dt * (bd.form + 1);
    this.boss.y += Math.cos(this.time.now / 220 + bd.form * 2) * 6 * dt * (bd.form + 1);

    bd.shootTimer -= dt;
    if (bd.shootTimer <= 0) {
      this.bossShoot();
      bd.shootTimer = Math.max(0.28, 0.9 - bd.form * 0.18);
    }
  }

  private bossShoot(): void {
    if (!this.boss || !this.bossData) return;
    const form = this.bossData.form;
    const patterns =
      form === 0
        ? [0]
        : form === 1
          ? [-0.35, 0, 0.35]
          : [-0.55, -0.25, 0, 0.25, 0.55];

    this.bossData.shotCount += 1;
    // Every 3rd volley: randomly replace one projectile with a collectible coin
    const coinSlot =
      this.bossData.shotCount % 3 === 0
        ? Phaser.Math.Between(0, patterns.length - 1)
        : -1;

    const muzzleY = this.boss.y + this.boss.displayHeight * 0.28;
    const speed = 200 + form * 40;

    for (let i = 0; i < patterns.length; i++) {
      const ang = patterns[i]!;

      let vx: number;
      let vy: number;
      if (form >= 1) {
        const a = Phaser.Math.Angle.Between(
          this.boss.x,
          this.boss.y,
          this.player.x,
          this.player.y,
        );
        vx = Math.cos(a + ang * 0.5) * speed;
        vy = Math.sin(a + ang * 0.5) * speed;
      } else {
        const base = Math.PI / 2; // down
        vx = Math.cos(base + ang) * speed * 0.35;
        vy = Math.sin(base) * speed;
      }

      if (i === coinSlot) {
        // Coin travels on the same path as the replaced shot (collectible, no damage)
        const cents = this.randomBossCoinCents();
        this.spawnCoinLane(this.boss.x, muzzleY, cents, vx * 0.55, Math.max(vy * 0.55, 40));
        continue;
      }

      const bullet = this.bossBullets.create(
        this.boss.x,
        muzzleY,
        'boss_bullet',
      ) as Phaser.Physics.Arcade.Image;
      bullet.setDisplaySize(14, 14);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocity(vx, vy);
    }
    audio.play('bump');
  }

  /**
   * Resolve egg vs boss from overlap args. Never destroy the boss sprite.
   */
  private hitBossFromOverlap(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject,
  ): void {
    if (!this.bossData || !this.boss) return;
    if (this.time.now < this.bossFormIframesUntil) return;

    const a = obj1;
    const b = obj2;
    let egg: Phaser.Physics.Arcade.Image | undefined;

    if (a && a !== this.boss && this.eggs.contains(a)) {
      egg = a as Phaser.Physics.Arcade.Image;
    } else if (b && b !== this.boss && this.eggs.contains(b)) {
      egg = b as Phaser.Physics.Arcade.Image;
    } else if (a && a !== this.boss) {
      egg = a as Phaser.Physics.Arcade.Image;
    } else if (b && b !== this.boss) {
      egg = b as Phaser.Physics.Arcade.Image;
    }
    if (!egg || egg === this.boss || !egg.active) return;

    const dmg = (egg.getData('dmg') as number) || this.eggDamage();
    egg.destroy();
    this.applyBossDamage(dmg);
  }

  private applyBossDamage(dmg: number): void {
    if (!this.boss || !this.bossData) return;
    if (this.time.now < this.bossFormIframesUntil) return;

    this.bossData.hp -= dmg;
    this.damageDealt += dmg;
    audio.play('hit');
    this.flashBossRed();

    // Keep portrait alive/visible even under spam hits
    this.boss.setVisible(true);
    this.boss.setAlpha(1);

    if (this.bossData.hp <= 0) {
      if (this.bossData.form < 2) {
        const next = (this.bossData.form + 1) as 0 | 1 | 2;
        this.bossData.form = next;
        this.bossData.hp = FORM_HP[next]!;
        this.bossData.maxHp = FORM_HP[next]!;
        this.bossFlashUntil = 0;
        this.applyBossFormVisual(next);
        this.pickBossTarget(true); // new form → immediate random dash
        // Short protection so the new form isn't multi-processed same frame
        this.bossFormIframesUntil = this.time.now + 400;
        this.cameras.main.shake(200, 0.01);
        if (next === 2) {
          this.cameras.main.flash(120, 180, 40, 40);
        }
        audio.play('hangry');
        this.showBanner(FORM_NAMES[next]!);
      } else {
        this.win();
      }
    }
  }

  /**
   * Red hit flash via overlay rectangle — never tint portrait textures
   * (tint/tintFill blanks or washes out these high-res RGB sprites).
   */
  private flashBossRed(): void {
    if (!this.boss?.active) return;
    if (!this.bossHitFx) {
      this.bossHitFx = this.add
        .rectangle(
          this.boss.x,
          this.boss.y,
          this.boss.displayWidth * 0.55,
          this.boss.displayHeight * 0.55,
          0xff2222,
          0.55,
        )
        .setDepth(9);
    }
    this.bossHitFx.setPosition(this.boss.x, this.boss.y);
    this.bossHitFx.setSize(this.boss.displayWidth * 0.55, this.boss.displayHeight * 0.55);
    this.bossHitFx.setVisible(true);
    this.bossHitFx.setAlpha(0.55);
    this.bossFlashUntil = this.time.now + 90;
    // Ensure the portrait itself is never left tinted/hidden
    this.boss.clearTint();
    this.boss.setVisible(true);
    this.boss.setAlpha(1);
  }

  private updateBossFlash(): void {
    if (this.bossHitFx?.visible && this.boss) {
      this.bossHitFx.setPosition(this.boss.x, this.boss.y);
    }
    if (this.bossFlashUntil > 0 && this.time.now >= this.bossFlashUntil) {
      this.bossHitFx?.setVisible(false);
      this.bossFlashUntil = 0;
      if (this.boss) {
        this.boss.clearTint();
        this.boss.setVisible(true);
        this.boss.setAlpha(1);
      }
    }
  }

  private cleanupOffscreen(): void {
    const h = this.scale.height;
    this.eggs.getChildren().forEach((o) => {
      const e = o as Phaser.Physics.Arcade.Image;
      if (e.active && e.y < -40) e.destroy();
    });
    this.bossBullets.getChildren().forEach((o) => {
      const e = o as Phaser.Physics.Arcade.Image;
      if (e.active && (e.y > h + 40 || e.y < -40)) e.destroy();
    });
    this.pickups.getChildren().forEach((o) => {
      const e = o as Phaser.Physics.Arcade.Sprite;
      if (e.active && e.y > h + 40) e.destroy();
    });
  }

  private updateHud(): void {
    const hColor = this.hangry ? '#ff6b6b' : '#e8dcc8';
    this.hudHunger.setColor(hColor);
    this.hudHunger.setText(
      `Hunger: ${Math.max(0, Math.ceil(this.hunger))}/${HUNGER_MAX}${
        this.hangry ? '  HANGRY 2×' : ''
      }`,
    );
    this.hudWallet.setText(
      `Wallet: ${this.cents}¢   Bombs: ${this.bombs}   Dmg: ${Math.floor(this.damageDealt)}  Nuggs: ${this.nuggetsEaten}`,
    );
    if (this.phase === 'boss' && this.bossData) {
      const bd = this.bossData;
      this.hudBoss.setText(
        `${FORM_NAMES[bd.form]}  HP ${Math.max(0, Math.ceil(bd.hp))}/${bd.maxHp}`,
      );
    } else {
      this.hudBoss.setText(
        this.gauntletDone
          ? 'Clear the swarm…'
          : `Wave ${Math.min(this.wavesSpawned + 1, this.totalWaves)}/${this.totalWaves}`,
      );
    }
  }

  private die(reason: string): void {
    if (this.ended) return;
    this.ended = true;
    this.phase = 'dead';
    audio.stopMusic();
    audio.play('death');
    this.physics.pause();

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setDepth(200);
    this.add
      .text(width / 2, height * 0.38, 'ORDER UP — YOU LOST', {
        fontFamily: 'Courier New, monospace',
        fontSize: '26px',
        color: '#ff6b6b',
      })
      .setOrigin(0.5)
      .setDepth(201);
    this.add
      .text(width / 2, height * 0.48, reason, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#e8dcc8',
        align: 'center',
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5)
      .setDepth(201);
    this.add
      .text(
        width / 2,
        height * 0.62,
        '[ R / ENTER ] retry Boss of the Sauce\n[ ESC ] title',
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#f5d080',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(201);

    this.input.keyboard?.once('keydown-R', () => this.scene.restart());
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.restart());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));
  }

  private win(): void {
    if (this.ended) return;
    this.ended = true;
    this.phase = 'won';
    audio.stopMusic();
    this.physics.pause();

    // Hide boss hit FX / lingering projectiles feel
    this.bossHitFx?.setVisible(false);
    if (this.boss) {
      this.boss.setVisible(false);
    }

    const { score, isNewBest } = submitBossScore(this.damageDealt, this.nuggetsEaten);
    const newAch = unlockAchievement('franchisee');
    const { width, height } = this.scale;

    // Full blackout first, then fanfare + end card
    const blackout = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(200);
    this.tweens.add({
      targets: blackout,
      alpha: 1,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Hold pure black briefly, then play victory music and show text
        this.time.delayedCall(400, () => {
          void audio.unlock().then(() => {
            audio.playVictoryMusic();
          });
          this.showVictoryCard(score, isNewBest, newAch);
        });
      },
    });
  }

  private showVictoryCard(score: number, isNewBest: boolean, newAch: boolean): void {
    const { width, height } = this.scale;

    const title = this.add
      .text(width / 2, height * 0.28, 'FRANCHISE TERMINATED', {
        fontFamily: 'Courier New, monospace',
        fontSize: '26px',
        color: '#6dffb0',
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setAlpha(0);

    const body = this.add
      .text(
        width / 2,
        height * 0.42,
        [
          'King MacClowen is dethroned.',
          `Damage: ${Math.floor(this.damageDealt)}  ·  Nuggets: ${this.nuggetsEaten}`,
          `Score: ${score}${isNewBest ? '  ★ NEW BEST' : ''}`,
          newAch ? 'Achievement unlocked: Franchisee' : '',
        ]
          .filter(Boolean)
          .join('\n'),
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#e8dcc8',
          align: 'center',
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5)
      .setDepth(201)
      .setAlpha(0);

    const hint = this.add
      .text(width / 2, height * 0.68, '[ ENTER / ESC ] return to title', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#f5d080',
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setAlpha(0);

    this.tweens.add({
      targets: [title, body, hint],
      alpha: 1,
      duration: 500,
      ease: 'Quad.easeOut',
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Title'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Title'));
  }
}
