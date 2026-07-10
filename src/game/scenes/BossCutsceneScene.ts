import Phaser from 'phaser';
import { audio } from '../audio/AudioService';
import { markBossIntroStarted } from '../data/bossUnlock';

const COUNTDOWN_START = 5;

/**
 * High-res MacClowen portrait + same 5s countdown pattern as EndScene,
 * then launches Boss of the Sauce.
 */
export class BossCutsceneScene extends Phaser.Scene {
  private countdownText!: Phaser.GameObjects.Text;
  private countdownValue = COUNTDOWN_START;
  private countdownTimer?: Phaser.Time.TimerEvent;
  private left = false;

  constructor() {
    super('BossCutscene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.left = false;
    this.countdownValue = COUNTDOWN_START;
    markBossIntroStarted();

    audio.stopMusic();
    void audio.unlock();

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1210);

    this.add
      .text(width / 2, height * 0.06, 'BOSS OF THE SAUCE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        color: '#f5d080',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.12, 'King MacClowen demands a franchise fee…', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#c4a882',
      })
      .setOrigin(0.5);

    if (this.textures.exists('boss_mac_portrait')) {
      this.textures.get('boss_mac_portrait').setFilter(Phaser.Textures.FilterMode.NEAREST);
      // Match title-nugget hero treatment: large, crisp, subtle pulse
      const heroY = height * 0.42;
      const portrait = this.add
        .image(width / 2, heroY, 'boss_mac_portrait')
        .setOrigin(0.5)
        .setDisplaySize(280, 280);

      this.tweens.add({
        targets: portrait,
        alpha: { from: 0.92, to: 1 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: portrait,
        y: heroY - 6,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: portrait,
        angle: { from: -1.5, to: 1.5 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(width / 2, height * 0.66, 'Get ready, chicken.', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#e8dcc8',
      })
      .setOrigin(0.5);

    this.countdownText = this.add
      .text(width / 2, height * 0.78, String(this.countdownValue), {
        fontFamily: 'Courier New, monospace',
        fontSize: '52px',
        color: '#f5d080',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.92, '[ ENTER / SPACE ] skip  ·  M mute', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#8a7a68',
      })
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
          this.enterBoss();
        }
      },
    });

    const skip = () => this.enterBoss();
    this.input.keyboard?.once('keydown-ENTER', skip);
    this.input.keyboard?.once('keydown-SPACE', skip);
    this.input.keyboard?.once('keydown-M', () => {
      void audio.unlock();
      audio.toggleMute();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.countdownTimer?.remove(false);
    });
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
      audio.playPhaserKey('tune1', 2.5);
    } else if (this.countdownValue === 1) {
      audio.playPhaserKey('tune2', 2.5);
    }
  }

  private enterBoss(): void {
    if (this.left) return;
    this.left = true;
    this.countdownTimer?.remove(false);
    audio.stopPhaserKey('tune1');
    audio.stopPhaserKey('tune2');
    audio.play('ui');
    this.scene.start('BossShooter');
  }
}
