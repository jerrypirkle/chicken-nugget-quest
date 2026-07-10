import Phaser from 'phaser';
import tune1Url from '../../assets/Tune 1.m4a';
import tune2Url from '../../assets/Tune 2.m4a';
import titleNuggetUrl from '../../assets/title-nugget.png';
import macclowenPortraitUrl from '../../assets/macclowen-portrait.png';
import macclowenPigtailsUrl from '../../assets/macclowen-pigtails.png';
import macclowenCrownUrl from '../../assets/macclowen-crown.png';
import macclowenScaryUrl from '../../assets/macclowen-scary.png';
import { audio } from '../audio/AudioService';
import { generateTextures } from '../assets/generateTextures';

const HIRES_KEYS = [
  'title_nugget',
  'boss_mac_portrait',
  'boss_mac_pigtails',
  'boss_mac_crown',
  'boss_mac_clown',
] as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.audio('tune1', tune1Url);
    this.load.audio('tune2', tune2Url);
    this.load.image('title_nugget', titleNuggetUrl);
    this.load.image('boss_mac_portrait', macclowenPortraitUrl);
    this.load.image('boss_mac_pigtails', macclowenPigtailsUrl);
    this.load.image('boss_mac_crown', macclowenCrownUrl);
    this.load.image('boss_mac_clown', macclowenScaryUrl);
  }

  create(): void {
    // Crisp pixels when scaling high-res 8-bit art
    for (const key of HIRES_KEYS) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }

    audio.bindPhaser(this.game);
    generateTextures(this);
    this.scene.start('Title');
  }
}
