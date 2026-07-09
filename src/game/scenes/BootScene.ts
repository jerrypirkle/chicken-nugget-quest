import Phaser from 'phaser';
import tune1Url from '../../assets/Tune 1.m4a';
import tune2Url from '../../assets/Tune 2.m4a';
import titleNuggetUrl from '../../assets/title-nugget.png';
import { audio } from '../audio/AudioService';
import { generateTextures } from '../assets/generateTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.audio('tune1', tune1Url);
    this.load.audio('tune2', tune2Url);
    this.load.image('title_nugget', titleNuggetUrl);
  }

  create(): void {
    // Crisp pixels when scaling the high-res 8-bit nugget
    if (this.textures.exists('title_nugget')) {
      this.textures.get('title_nugget').setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    audio.bindPhaser(this.game);
    generateTextures(this);
    this.scene.start('Title');
  }
}
