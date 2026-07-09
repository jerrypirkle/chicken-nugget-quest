import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { DungeonScene } from './game/scenes/DungeonScene';
import { EndScene } from './game/scenes/EndScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#1a1210',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 640,
  },
  scene: [BootScene, TitleScene, DungeonScene, EndScene],
  pixelArt: true,
  audio: {
    disableWebAudio: false,
  },
  input: {
    keyboard: true,
  },
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
