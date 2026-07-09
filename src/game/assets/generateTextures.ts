import Phaser from 'phaser';
import { TILE_SIZE } from '../data/types';
import { SAUCES } from '../data/content';

/** Procedural pixel-ish textures — no external art pipeline required. */
export function generateTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const s = TILE_SIZE;

  const tex = (key: string, draw: () => void) => {
    g.clear();
    draw();
    g.generateTexture(key, s, s);
  };

  // Floor
  tex('tile_floor', () => {
    g.fillStyle(0x3a2a1e, 1);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x443022, 1);
    g.fillRect(2, 2, 4, 3);
    g.fillRect(14, 16, 5, 3);
    g.fillStyle(0x2e2218, 1);
    g.fillRect(0, s - 1, s, 1);
    g.fillRect(s - 1, 0, 1, s);
  });

  // Wall
  tex('tile_wall', () => {
    g.fillStyle(0x1a1410, 1);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x5a4030, 1);
    g.fillRect(1, 1, s - 2, s - 2);
    g.fillStyle(0x3d2a20, 1);
    g.fillRect(1, 10, s - 2, 2);
    g.fillRect(11, 1, 2, s - 2);
    g.fillStyle(0x7a5a40, 1);
    g.fillRect(2, 2, 3, 3);
  });

  // Door
  tex('tile_door', () => {
    g.fillStyle(0x3a2a1e, 1);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x6b4226, 1);
    g.fillRect(4, 2, s - 8, s - 3);
    g.fillStyle(0xc9a227, 1);
    g.fillCircle(s - 8, s / 2, 2);
  });

  // Stairs
  tex('tile_stairs', () => {
    g.fillStyle(0x3a2a1e, 1);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x888070, 1);
    g.fillRect(3, 16, 18, 4);
    g.fillRect(5, 11, 14, 4);
    g.fillRect(7, 6, 10, 4);
    g.fillStyle(0xc0b8a0, 1);
    g.fillRect(9, 2, 6, 3);
  });

  // Exit portal
  tex('tile_exit', () => {
    g.fillStyle(0x3a2a1e, 1);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x2a6b4a, 1);
    g.fillCircle(s / 2, s / 2, 9);
    g.fillStyle(0x6dffb0, 1);
    g.fillCircle(s / 2, s / 2, 5);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(s / 2 - 2, s / 2 - 2, 2);
  });

  // Sauce altar base
  tex('tile_altar', () => {
    g.fillStyle(0x3a2a1e, 1);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x4a4050, 1);
    g.fillRect(4, 14, 16, 6);
    g.fillStyle(0x6a6080, 1);
    g.fillRect(6, 10, 12, 5);
    g.fillStyle(0x9a90b0, 1);
    g.fillRect(8, 6, 8, 5);
  });

  const drawPlayer = (eyeColor: number) => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    // boots
    g.fillStyle(0x4a3020, 1);
    g.fillRect(6, 18, 4, 4);
    g.fillRect(14, 18, 4, 4);
    // body cloak
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(7, 8, 10, 11);
    // head
    g.fillStyle(0xe8c4a0, 1);
    g.fillRect(8, 3, 8, 7);
    // eyes
    g.fillStyle(eyeColor, 1);
    g.fillRect(10, 5, 2, 2);
    g.fillRect(14, 5, 2, 2);
    // belt
    g.fillStyle(0xc9a227, 1);
    g.fillRect(7, 14, 10, 2);
  };

  // Player (normal eyes)
  tex('sprite_player', () => drawPlayer(0x1a1a1a));

  // Player hangry (red eyes)
  tex('sprite_player_hangry', () => drawPlayer(0xff2020));

  // Nugget
  tex('sprite_nugget', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0xc47a20, 1);
    g.fillRoundedRect(5, 7, 14, 11, 3);
    g.fillStyle(0xe8a838, 1);
    g.fillRoundedRect(7, 9, 10, 7, 2);
    g.fillStyle(0xf5d080, 1);
    g.fillRect(9, 10, 3, 2);
  });

  // Enemies
  const enemyDraw: Record<string, () => void> = {
    hangry_rat: () => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, s, s);
      g.fillStyle(0x7a5a40, 1);
      g.fillEllipse(12, 14, 14, 10);
      g.fillStyle(0x5a4030, 1);
      g.fillCircle(6, 10, 3);
      g.fillCircle(18, 10, 3);
      g.fillStyle(0xff4444, 1);
      g.fillRect(9, 12, 2, 2);
      g.fillRect(14, 12, 2, 2);
      g.fillStyle(0xffaaaa, 1);
      g.fillTriangle(20, 14, 23, 12, 23, 16);
    },
    vengeful_fry: () => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, s, s);
      g.fillStyle(0xd4a017, 1);
      g.fillRoundedRect(9, 3, 6, 18, 2);
      g.fillStyle(0xf0c040, 1);
      g.fillRect(10, 5, 4, 12);
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(10, 8, 2, 2);
      g.fillRect(13, 8, 2, 2);
      g.fillStyle(0xff2222, 1);
      g.fillRect(11, 14, 3, 1);
    },
    napkin_swarm: () => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, s, s);
      g.fillStyle(0xf5f5f0, 1);
      g.fillRect(4, 6, 8, 10);
      g.fillRect(10, 8, 8, 10);
      g.fillRect(7, 4, 7, 8);
      g.fillStyle(0xccccc8, 1);
      g.fillRect(5, 8, 6, 1);
      g.fillRect(12, 12, 5, 1);
      g.fillStyle(0x333, 1);
      g.fillRect(8, 10, 2, 2);
      g.fillRect(14, 12, 2, 2);
    },
    managers_special: () => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, s, s);
      // name tag body
      g.fillStyle(0xcc3333, 1);
      g.fillRoundedRect(3, 5, 18, 14, 2);
      g.fillStyle(0xffffff, 1);
      g.fillRect(5, 8, 14, 8);
      g.fillStyle(0x222, 1);
      g.fillRect(7, 10, 3, 2);
      g.fillRect(14, 10, 3, 2);
      g.fillStyle(0xcc3333, 1);
      g.fillRect(8, 14, 8, 1);
      // little crown of capitalism
      g.fillStyle(0xc9a227, 1);
      g.fillRect(8, 2, 8, 3);
      g.fillRect(7, 3, 2, 3);
      g.fillRect(15, 3, 2, 3);
    },
  };

  for (const [id, draw] of Object.entries(enemyDraw)) {
    tex(`enemy_${id}`, draw);
  }

  // Sauces
  for (const sauce of SAUCES) {
    tex(`sauce_${sauce.id}`, () => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, s, s);
      // cup
      g.fillStyle(0xffffff, 1);
      g.fillRect(7, 8, 10, 12);
      g.fillStyle(sauce.color, 1);
      g.fillRect(8, 9, 8, 8);
      g.fillStyle(0xdddddd, 1);
      g.fillRect(6, 7, 12, 3);
      g.fillStyle(0xeeeeee, 1);
      g.fillRect(10, 4, 4, 4);
    });
  }

  // Achievement: locked (grey + ?)
  tex('ach_locked', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x4a4a4a, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRoundedRect(4, 4, s - 8, s - 8, 3);
    g.fillStyle(0x8a8a8a, 1);
    // question mark body
    g.fillRect(10, 5, 4, 3);
    g.fillRect(13, 7, 3, 3);
    g.fillRect(10, 9, 4, 3);
    g.fillRect(10, 13, 3, 2);
    g.fillRect(10, 17, 3, 3);
  });

  // Achievement: McBummer - You Died (sad nugget / tomb)
  tex('ach_mc_bummer', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x6b3030, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // tombstone
    g.fillStyle(0x9a9a9a, 1);
    g.fillRect(7, 8, 10, 12);
    g.fillStyle(0xb0b0b0, 1);
    g.fillCircle(12, 8, 5);
    // RIP
    g.fillStyle(0x333333, 1);
    g.fillRect(9, 10, 6, 2);
    g.fillRect(10, 13, 4, 2);
    // X eyes vibe
    g.fillStyle(0xcc2222, 1);
    g.fillRect(8, 6, 2, 2);
    g.fillRect(14, 6, 2, 2);
  });

  // Achievement: Saucy - all 3 sauces then die
  tex('ach_saucy', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x4a3060, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // three sauce cups
    const cups: [number, number][] = [
      [5, 0xc4a882],
      [10, 0x8b3a1a],
      [15, 0xff6b9d],
    ];
    for (const [cx, color] of cups) {
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx, 8, 4, 8);
      g.fillStyle(color, 1);
      g.fillRect(cx, 9, 4, 5);
    }
    // little skull hint under cups
    g.fillStyle(0xcccccc, 1);
    g.fillRect(9, 17, 6, 4);
    g.fillStyle(0x222222, 1);
    g.fillRect(10, 18, 1, 1);
    g.fillRect(13, 18, 1, 1);
  });

  // Achievement: 10-piece - 10 nuggets in one run
  tex('ach_ten_piece', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x5a3a18, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // box / carton
    g.fillStyle(0xe8a838, 1);
    g.fillRect(5, 10, 14, 10);
    g.fillStyle(0xc47a20, 1);
    g.fillRect(5, 10, 14, 3);
    // nuggets peeking
    g.fillStyle(0xe8a838, 1);
    g.fillCircle(9, 9, 3);
    g.fillCircle(14, 8, 3);
    g.fillCircle(12, 11, 2);
    // "10"
    g.fillStyle(0x2a1810, 1);
    g.fillRect(8, 14, 2, 4);
    g.fillRect(11, 14, 4, 1);
    g.fillRect(11, 14, 1, 4);
    g.fillRect(14, 14, 1, 4);
    g.fillRect(11, 17, 4, 1);
  });

  // Achievement: 20-piece - 20 nuggets in one run
  tex('ach_twenty_piece', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x3a2810, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // bigger full carton
    g.fillStyle(0xf0b040, 1);
    g.fillRect(4, 9, 16, 11);
    g.fillStyle(0xc47a20, 1);
    g.fillRect(4, 9, 16, 3);
    // more nuggets
    g.fillStyle(0xe8a838, 1);
    g.fillCircle(8, 8, 3);
    g.fillCircle(13, 7, 3);
    g.fillCircle(17, 9, 2);
    g.fillCircle(10, 11, 2);
    g.fillCircle(15, 11, 2);
    // "20"
    g.fillStyle(0x2a1810, 1);
    g.fillRect(6, 15, 4, 1);
    g.fillRect(9, 15, 1, 4);
    g.fillRect(6, 17, 4, 1);
    g.fillRect(6, 15, 1, 2);
    g.fillRect(6, 18, 4, 1);
    g.fillRect(12, 15, 4, 1);
    g.fillRect(12, 15, 1, 4);
    g.fillRect(15, 15, 1, 4);
    g.fillRect(12, 18, 4, 1);
  });

  // Achievement: Get Your Steps In - 100+ steps
  tex('ach_get_your_steps_in', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x1a4a3a, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // path / footprints
    g.fillStyle(0x6dffb0, 1);
    g.fillRect(6, 16, 3, 2);
    g.fillRect(10, 12, 3, 2);
    g.fillRect(14, 8, 3, 2);
    g.fillRect(8, 6, 2, 2);
    g.fillRect(12, 4, 2, 2);
    // trail dots
    g.fillStyle(0x3a8a6a, 1);
    g.fillRect(7, 14, 1, 1);
    g.fillRect(11, 10, 1, 1);
    g.fillRect(15, 6, 1, 1);
  });

  // Achievement: Want Fries with That? - killed by fry
  tex('ach_want_fries', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x8b5a10, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // fry
    g.fillStyle(0xe8b84a, 1);
    g.fillRoundedRect(10, 4, 5, 16, 2);
    g.fillStyle(0xf0c040, 1);
    g.fillRect(11, 6, 3, 11);
    // angry eyes
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(11, 8, 1, 2);
    g.fillRect(13, 8, 1, 2);
    g.fillStyle(0xff2222, 1);
    g.fillRect(11, 13, 3, 1);
    // salt dots
    g.fillStyle(0xffffff, 1);
    g.fillRect(7, 7, 1, 1);
    g.fillRect(17, 10, 1, 1);
    g.fillRect(8, 14, 1, 1);
  });

  // Achievement: Combo Meal - all enemy types
  tex('ach_combo_meal', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x2a3a5a, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // tray
    g.fillStyle(0x888888, 1);
    g.fillRect(4, 14, 16, 6);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(4, 14, 16, 2);
    // four meal bits (rat brown, fry yellow, napkin white, special red)
    g.fillStyle(0x9a7b5a, 1);
    g.fillRect(5, 8, 3, 5);
    g.fillStyle(0xe8b84a, 1);
    g.fillRect(9, 7, 2, 6);
    g.fillStyle(0xf0f0f0, 1);
    g.fillRect(12, 8, 3, 5);
    g.fillStyle(0xcc3333, 1);
    g.fillRect(16, 8, 3, 5);
  });

  // Achievement: Skinny - win without nuggets
  tex('ach_skinny', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x3a5060, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // thin figure
    g.fillStyle(0xe8c4a0, 1);
    g.fillRect(10, 4, 4, 4);
    g.fillStyle(0x6a90b0, 1);
    g.fillRect(10, 8, 4, 8);
    g.fillStyle(0x4a3020, 1);
    g.fillRect(10, 16, 2, 4);
    g.fillRect(12, 16, 2, 4);
    // crossed-out nugget
    g.fillStyle(0xc47a20, 1);
    g.fillCircle(17, 7, 3);
    g.fillStyle(0xff4444, 1);
    g.fillRect(14, 6, 7, 2);
  });

  // Achievement: Ketchup - beat existing best steps
  tex('ach_ketchup', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x5a1010, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // ketchup bottle
    g.fillStyle(0xcc2222, 1);
    g.fillRect(9, 8, 6, 12);
    g.fillStyle(0xee3333, 1);
    g.fillRect(10, 6, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(10, 10, 4, 3);
    // arrow up (beating score)
    g.fillStyle(0x6dffb0, 1);
    g.fillTriangle(18, 8, 15, 12, 21, 12);
    g.fillRect(17, 12, 2, 5);
  });

  // Achievement: Hungry - 10 runs played
  tex('ach_hungry', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x4a2818, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // growling stomach / circle
    g.fillStyle(0xe8a070, 1);
    g.fillEllipse(12, 13, 14, 10);
    g.fillStyle(0xc07050, 1);
    g.fillEllipse(12, 13, 10, 7);
    // "10"
    g.fillStyle(0xf5d080, 1);
    g.fillRect(7, 6, 2, 4);
    g.fillRect(10, 6, 3, 1);
    g.fillRect(10, 6, 1, 4);
    g.fillRect(12, 6, 1, 4);
    g.fillRect(10, 9, 3, 1);
    // rumble lines
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(5, 12, 2, 1);
    g.fillRect(17, 14, 2, 1);
  });

  g.destroy();
}
