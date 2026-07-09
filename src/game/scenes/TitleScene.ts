import Phaser from 'phaser';
import { audio } from '../audio/AudioService';
import { formatBestSteps, getBestSteps } from '../data/highScore';
import { createNewRun } from '../data/runState';

interface HungerChoice {
  key: string;
  label: string;
  hunger: number;
}

const HUNGER_CHOICES: HungerChoice[] = [
  { key: '1', label: 'I just ate', hunger: 100 },
  { key: '2', label: 'I could eat', hunger: 80 },
  { key: '3', label: 'I need Nuggs!', hunger: 50 },
];

export class TitleScene extends Phaser.Scene {
  private muteHint!: Phaser.GameObjects.Text;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    audio.stopMusic();

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1210);

    this.add
      .text(width / 2, height * 0.07, 'CHICKEN NUGGET QUEST', {
        fontFamily: 'Courier New, monospace',
        fontSize: '34px',
        color: '#f5d080',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.13, 'A cursed and deep-fried roguelike', {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        color: '#c4a882',
      })
      .setOrigin(0.5);

    // High-res 8-bit nugget + pixel light rays (transparent bg)
    if (this.textures.exists('title_nugget')) {
      const heroY = height * 0.34;
      const nugget = this.add
        .image(width / 2, heroY, 'title_nugget')
        .setOrigin(0.5)
        .setDisplaySize(260, 260);

      // Soft glow pulse behind rays
      this.tweens.add({
        targets: nugget,
        alpha: { from: 0.92, to: 1 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: nugget,
        y: heroY - 8,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: nugget,
        angle: { from: -2, to: 2 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const best = getBestSteps();
    this.add
      .text(
        width / 2,
        height * 0.54,
        best === null
          ? 'Best steps: —  (clear all floors to set a record)'
          : `Best steps: ${formatBestSteps(best)}  (lower is better)`,
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#f5d080',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.59,
        "Nuggets keep you alive. Collect every level's sauce. Escape The Fryer.",
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: '#e8dcc8',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.66, 'How hungry are you?', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: '#f5d080',
      })
      .setOrigin(0.5);

    const optionY = [0.72, 0.78, 0.84];

    HUNGER_CHOICES.forEach((choice, i) => {
      const t = this.add
        .text(
          width / 2,
          height * optionY[i]!,
          `[ ${choice.key} ]  ${choice.label}  (${choice.hunger}/100)`,
          {
            fontFamily: 'Courier New, monospace',
            fontSize: '15px',
            color: '#6dffb0',
          },
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      t.on('pointerover', () => t.setColor('#ffffff'));
      t.on('pointerout', () => t.setColor('#6dffb0'));
      t.on('pointerdown', () => {
        void this.startRun(choice.hunger);
      });
    });

    this.muteHint = this.add
      .text(width / 2, height * 0.91, this.muteLabel(), {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#8a7a68',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.96, 'Press 1 / 2 / 3  ·  M mute  ·  ? help in-game', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#8a7a68',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      void audio.unlock();
    });

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-ONE', () => {
        void this.startRun(HUNGER_CHOICES[0]!.hunger);
      });
      kb.on('keydown-TWO', () => {
        void this.startRun(HUNGER_CHOICES[1]!.hunger);
      });
      kb.on('keydown-THREE', () => {
        void this.startRun(HUNGER_CHOICES[2]!.hunger);
      });
      kb.on('keydown-NUMPAD_ONE', () => {
        void this.startRun(HUNGER_CHOICES[0]!.hunger);
      });
      kb.on('keydown-NUMPAD_TWO', () => {
        void this.startRun(HUNGER_CHOICES[1]!.hunger);
      });
      kb.on('keydown-NUMPAD_THREE', () => {
        void this.startRun(HUNGER_CHOICES[2]!.hunger);
      });
      kb.on('keydown-M', () => this.toggleMute());

      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        kb.removeAllListeners();
      });
    }
  }

  private muteLabel(): string {
    return audio.isMuted() ? 'Sound: OFF  (M to unmute)' : 'Sound: ON  (M to mute)';
  }

  private toggleMute(): void {
    void audio.unlock();
    audio.toggleMute();
    this.muteHint.setText(this.muteLabel());
    if (!audio.isMuted()) {
      audio.play('ui');
    }
  }

  private async startRun(startingHunger: number): Promise<void> {
    await audio.unlock();
    audio.play('ui');
    const run = createNewRun({ startingHunger });
    this.scene.start('Dungeon', { run });
  }
}
