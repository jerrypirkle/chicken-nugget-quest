import Phaser from 'phaser';
import { audio } from '../audio/AudioService';
import {
  ACHIEVEMENTS,
  BONUS_ACHIEVEMENTS,
  displayName,
  getDeaths,
  getRunsPlayed,
  isAchievementUnlocked,
  recordDeath,
  recordRunPlayed,
  type AchievementDef,
} from '../data/achievements';
import { isBossIntroPending, maybeFlagBossIntroPending } from '../data/bossUnlock';
import { sauceById } from '../data/content';
import { formatBestSteps, getBestSteps } from '../data/highScore';
import { createNewRun, nextRunStartingHunger } from '../data/runState';
import type { RunState } from '../data/types';

const COUNTDOWN_START = 5;
const ACH_ICON = 28;
const ACH_GAP = 6;

export class EndScene extends Phaser.Scene {
  private countdownText!: Phaser.GameObjects.Text;
  private countdownValue = COUNTDOWN_START;
  private countdownTimer?: Phaser.Time.TimerEvent;
  private left = false;
  private endedRun!: RunState;
  private tooltipText?: Phaser.GameObjects.Text;
  private routeToBoss = false;

  constructor() {
    super('End');
  }

  create(data: { run: RunState }): void {
    const { run } = data;
    this.endedRun = run;
    const { width, height } = this.scale;
    const victory = run.stats.victory;
    const newHigh = Boolean(victory && run.stats.newHighScore);
    const best = getBestSteps();
    this.left = false;
    this.countdownValue = COUNTDOWN_START;

    // Count every finished run (win or lose) toward Hungry
    if (recordRunPlayed()) {
      if (!run.stats.newlyUnlockedAchievements) {
        run.stats.newlyUnlockedAchievements = [];
      }
      run.stats.newlyUnlockedAchievements.push('hungry');
    }
    if (!victory) {
      recordDeath();
    }
    // First time all 10 core achievements complete → Boss of the Sauce intro
    maybeFlagBossIntroPending();
    this.routeToBoss = isBossIntroPending();
    const gamesPlayed = getRunsPlayed();
    const deaths = getDeaths();

    audio.stopMusic();
    void audio.unlock().then(() => {
      if (newHigh) {
        audio.play('highScore');
      } else if (victory) {
        audio.play('win');
      } else {
        audio.play('death');
      }
    });

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1210);

    this.add
      .text(
        width / 2,
        height * 0.07,
        victory ? 'SAUCEOME!' : 'HUNGER WINS THIS ROUND',
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '26px',
          color: victory ? '#6dffb0' : '#ff6b6b',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    let bodyTop = height * 0.13;
    if (newHigh) {
      this.add
        .text(width / 2, bodyTop, `★ NEW BEST STEPS: ${run.stats.steps} ★`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '16px',
          color: '#f5d080',
        })
        .setOrigin(0.5);
      bodyTop += height * 0.04;
    }

    const sauceNames =
      run.stats.saucesCollected.length > 0
        ? run.stats.saucesCollected.map((id) => sauceById(id).name).join('\n  ')
        : '(none — tragic)';

    const body = [
      victory
        ? 'All the nuggs belong to us!'
        : `Cause of defeat: ${run.stats.causeOfDeath ?? 'unknown culinary horror'}`,
      '',
      `Steps taken:     ${run.stats.steps}`,
      `Best steps:      ${formatBestSteps(best)}`,
      `Games played:    ${gamesPlayed}`,
      `Deaths:          ${deaths}`,
      `Floors cleared:  ${run.stats.floorsCleared}`,
      `Turns survived:  ${run.stats.turnsSurvived}`,
      `Nuggets eaten:   ${run.stats.nuggetsEaten}`,
      `Enemies slain:   ${run.stats.enemiesSlain}`,
      '',
      'Sauces collected:',
      `  ${sauceNames}`,
    ].join('\n');

    this.add
      .text(width / 2, bodyTop + 8, body, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#e8dcc8',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    // Achievements row
    this.add
      .text(width / 2, height * 0.58, 'ACHIEVEMENTS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#c9a227',
      })
      .setOrigin(0.5);

    this.drawAchievements(width / 2, height * 0.63);

    const newly = run.stats.newlyUnlockedAchievements ?? [];
    if (newly.length > 0) {
      const names = newly
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id)
        .join(', ');
      this.add
        .text(width / 2, height * 0.7, `New: ${names}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: '#6dffb0',
        })
        .setOrigin(0.5);
    }

    this.countdownText = this.add
      .text(width / 2, height * 0.8, String(this.countdownValue), {
        fontFamily: 'Courier New, monospace',
        fontSize: '52px',
        color: '#f5d080',
      })
      .setOrigin(0.5);

    const nextHunger = nextRunStartingHunger(run);
    const nextHint = this.routeToBoss
      ? 'Boss of the Sauce awaits…'
      : victory
        ? `Next: hardest hunger (${nextHunger}/100)`
        : `Next: same hunger (${nextHunger}/100)`;

    this.add
      .text(
        width / 2,
        height * 0.92,
        this.routeToBoss
          ? `${nextHint}  ·  [ ENTER / SPACE ] face King MacClowen`
          : `${nextHint}  ·  [ ENTER / SPACE / ESC ] start now`,
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: this.routeToBoss ? '#ff9f43' : '#c9a227',
        },
      )
      .setOrigin(0.5);

    this.applyCountdownTick();

    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN_START - 1,
      callback: () => {
        if (this.left) return;
        this.countdownValue -= 1;
        if (this.countdownValue >= 1) {
          this.applyCountdownTick();
        } else {
          this.startNextRun();
        }
      },
    });

    const skip = () => this.startNextRun();
    this.input.keyboard?.once('keydown-ENTER', skip);
    this.input.keyboard?.once('keydown-SPACE', skip);
    this.input.keyboard?.once('keydown-ESC', skip);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.countdownTimer?.remove(false);
    });
  }

  private drawAchievements(centerX: number, y: number): void {
    const n = ACHIEVEMENTS.length;
    const totalW = n * ACH_ICON + (n - 1) * ACH_GAP;
    let x = centerX - totalW / 2 + ACH_ICON / 2;

    this.tooltipText = this.add
      .text(centerX, y + ACH_ICON / 2 + 18, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#e8dcc8',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 3 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setDepth(50);

    for (const def of ACHIEVEMENTS) {
      const unlocked = isAchievementUnlocked(def.id);
      const key = unlocked && !def.placeholder ? def.iconKey : 'ach_locked';
      const img = this.add
        .image(x, y, key)
        .setDisplaySize(ACH_ICON, ACH_ICON)
        .setInteractive({ useHandCursor: true });

      if (!unlocked) {
        img.setTint(0x888888);
      }

      img.on('pointerover', () => this.showAchTooltip(def, unlocked, img.x, y));
      img.on('pointerout', () => this.tooltipText?.setVisible(false));

      x += ACH_ICON + ACH_GAP;
    }

    // Secret 11th: Franchisee (bonus) — shown when boss path is open
    const bonus = BONUS_ACHIEVEMENTS[0];
    if (bonus) {
      const unlocked = isAchievementUnlocked(bonus.id);
      const bossPath =
        unlocked ||
        this.routeToBoss ||
        ACHIEVEMENTS.every((a) => isAchievementUnlocked(a.id));
      if (bossPath) {
        const key = unlocked ? bonus.iconKey : 'ach_locked';
        const img = this.add
          .image(x + 8, y, key)
          .setDisplaySize(ACH_ICON, ACH_ICON)
          .setInteractive({ useHandCursor: true });
        if (!unlocked) img.setTint(0x888888);
        img.on('pointerover', () => this.showAchTooltip(bonus, unlocked, img.x, y));
        img.on('pointerout', () => this.tooltipText?.setVisible(false));
      }
    }
  }

  private showAchTooltip(def: AchievementDef, unlocked: boolean, x: number, y: number): void {
    if (!this.tooltipText) return;
    const title = displayName(def, unlocked);
    const desc = unlocked && !def.placeholder ? def.description : '???';
    this.tooltipText.setText(`${title}\n${desc}`);
    this.tooltipText.setPosition(x, y + ACH_ICON / 2 + 10);
    this.tooltipText.setVisible(true);
  }

  private applyCountdownTick(): void {
    this.countdownText.setText(String(this.countdownValue));
    this.tweens.add({
      targets: this.countdownText,
      scale: { from: 1.25, to: 1 },
      duration: 200,
      ease: 'Quad.easeOut',
    });

    if (this.countdownValue >= 2 && this.countdownValue <= 4) {
      this.playTune('tune1');
    } else if (this.countdownValue === 1) {
      this.playTune('tune2');
    }
  }

  private playTune(key: 'tune1' | 'tune2'): void {
    audio.playPhaserKey(key, 2.5);
  }

  private startNextRun(): void {
    if (this.left) return;
    this.left = true;
    this.countdownTimer?.remove(false);
    audio.stopPhaserKey('tune1');
    audio.stopPhaserKey('tune2');
    audio.play('ui');
    if (this.routeToBoss) {
      this.scene.start('BossCutscene');
      return;
    }
    const startingHunger = nextRunStartingHunger(this.endedRun);
    const run = createNewRun({ startingHunger });
    this.scene.start('Dungeon', { run });
  }
}
