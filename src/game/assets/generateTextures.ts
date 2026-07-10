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

  // Achievement: Franchisee - beat King MacClowen
  tex('ach_franchisee', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x2a1840, 1);
    g.fillRoundedRect(2, 2, s - 4, s - 4, 4);
    // crown
    g.fillStyle(0xf5d080, 1);
    g.fillRect(6, 8, 12, 6);
    g.fillRect(6, 5, 2, 4);
    g.fillRect(11, 4, 2, 5);
    g.fillRect(16, 5, 2, 4);
    // red clown nose
    g.fillStyle(0xff3333, 1);
    g.fillCircle(12, 16, 3);
  });

  // —— Boss of the Sauce sprites (24×24 gameplay, larger portrait) ——

  const texN = (key: string, w: number, h: number, draw: () => void) => {
    g.clear();
    draw();
    g.generateTexture(key, w, h);
  };

  // Chicken player — top-down, in flight, facing up (screen-north).
  // wingPose: 0 = wings wide, 1 = wings tucked (flap frame)
  // hangry: glowing red eyes
  const drawChicken = (wingPose: 0 | 1, hangry: boolean) => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);

    if (wingPose === 0) {
      // Wings fully spread (flight silhouette)
      g.fillStyle(0xd8c8a8, 1);
      g.fillTriangle(0, 11, 10, 12, 3, 18);
      g.fillTriangle(24, 11, 14, 12, 21, 18);
      g.fillStyle(0xe8dcc0, 1);
      g.fillTriangle(2, 9, 11, 11, 5, 16);
      g.fillTriangle(22, 9, 13, 11, 19, 16);
      g.fillStyle(0xfff8e8, 1);
      g.fillTriangle(3, 9, 10, 11, 5, 13);
      g.fillTriangle(21, 9, 14, 11, 19, 13);
    } else {
      // Wings mid-beat (narrower, swept back)
      g.fillStyle(0xd8c8a8, 1);
      g.fillTriangle(4, 10, 11, 13, 6, 17);
      g.fillTriangle(20, 10, 13, 13, 18, 17);
      g.fillStyle(0xe8dcc0, 1);
      g.fillTriangle(5, 10, 11, 12, 7, 15);
      g.fillTriangle(19, 10, 13, 12, 17, 15);
    }

    // Tail fan (aft / bottom)
    g.fillStyle(0xc8b898, 1);
    g.fillTriangle(12, 16, 7, 23, 9, 22);
    g.fillTriangle(12, 16, 15, 23, 17, 22);
    g.fillStyle(0xb8a070, 1);
    g.fillTriangle(12, 15, 10, 23, 14, 23);

    // Body (elongated oval, head→tail axis)
    g.fillStyle(0xf5f0e0, 1);
    g.fillEllipse(12, 13, 8, 14);
    // Belly highlight
    g.fillStyle(0xfffaf0, 1);
    g.fillEllipse(12, 13, 4, 8);

    // Head (forward / top)
    g.fillStyle(0xfff8e8, 1);
    g.fillCircle(12, 6, 5);
    // Comb
    g.fillStyle(0xe03030, 1);
    g.fillRect(10, 1, 2, 3);
    g.fillRect(12, 0, 2, 3);
    g.fillRect(14, 1, 2, 2);
    // Beak pointing up (flight / fire direction)
    g.fillStyle(0xf0a020, 1);
    g.fillTriangle(12, 0, 9, 4, 15, 4);
    g.fillStyle(0xd88810, 1);
    g.fillTriangle(12, 1, 10, 4, 14, 4);

    // Eyes left/right (top-down) — hangry = glowing red
    if (hangry) {
      // Outer glow
      g.fillStyle(0xff2020, 0.45);
      g.fillCircle(10, 6, 4);
      g.fillCircle(14, 6, 4);
      g.fillStyle(0xff4040, 0.7);
      g.fillCircle(10, 6, 3);
      g.fillCircle(14, 6, 3);
      // Hot red core
      g.fillStyle(0xff0000, 1);
      g.fillRect(8, 4, 4, 4);
      g.fillRect(12, 4, 4, 4);
      // Bright pupil highlight
      g.fillStyle(0xffaaaa, 1);
      g.fillRect(9, 5, 1, 1);
      g.fillRect(13, 5, 1, 1);
      g.fillStyle(0xffffff, 1);
      g.fillRect(10, 5, 1, 1);
      g.fillRect(14, 5, 1, 1);
    } else {
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(9, 5, 2, 2);
      g.fillRect(13, 5, 2, 2);
    }

    // Wattle
    g.fillStyle(0xc02828, 1);
    g.fillRect(11, 7, 2, 2);
  };

  tex('boss_chicken', () => drawChicken(0, false));
  tex('boss_chicken_b', () => drawChicken(1, false));
  tex('boss_chicken_hangry', () => drawChicken(0, true));
  tex('boss_chicken_hangry_b', () => drawChicken(1, true));

  // Egg bullet
  tex('boss_egg', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0xfff8e0, 1);
    g.fillEllipse(12, 12, 8, 10);
    g.fillStyle(0xffe8a0, 1);
    g.fillEllipse(12, 13, 4, 5);
  });

  // Fly enemy
  tex('boss_fly', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    // wings
    g.fillStyle(0xa0c0e0, 0.85);
    g.fillEllipse(6, 10, 8, 5);
    g.fillEllipse(18, 10, 8, 5);
    // body
    g.fillStyle(0x2a2a2a, 1);
    g.fillEllipse(12, 13, 8, 10);
    // eyes
    g.fillStyle(0xff4040, 1);
    g.fillRect(9, 9, 2, 2);
    g.fillRect(13, 9, 2, 2);
    // legs
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(8, 18, 1, 3);
    g.fillRect(12, 19, 1, 3);
    g.fillRect(15, 18, 1, 3);
  });

  // Coins
  const drawCoin = (color: number, mark: string) => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(color, 1);
    g.fillCircle(12, 12, 8);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(10, 9, 3);
    g.fillStyle(0x1a1a1a, 1);
    // simple denomination tick marks via rects
    if (mark === '1') {
      g.fillRect(11, 8, 2, 8);
    } else if (mark === '5') {
      g.fillRect(9, 8, 6, 2);
      g.fillRect(9, 8, 2, 4);
      g.fillRect(9, 11, 6, 2);
      g.fillRect(13, 13, 2, 3);
      g.fillRect(9, 15, 6, 2);
    } else if (mark === '10') {
      g.fillRect(7, 8, 2, 8);
      g.fillRect(11, 8, 5, 2);
      g.fillRect(11, 8, 2, 8);
      g.fillRect(14, 8, 2, 8);
      g.fillRect(11, 14, 5, 2);
    } else {
      // 25
      g.fillRect(6, 8, 5, 2);
      g.fillRect(6, 8, 2, 8);
      g.fillRect(6, 14, 5, 2);
      g.fillRect(12, 8, 5, 2);
      g.fillRect(12, 8, 2, 4);
      g.fillRect(12, 11, 5, 2);
      g.fillRect(15, 13, 2, 3);
      g.fillRect(12, 14, 5, 2);
    }
  };

  tex('boss_coin_1', () => drawCoin(0xb87333, '1')); // copper
  tex('boss_coin_5', () => drawCoin(0xc0c0c0, '5')); // nickel
  tex('boss_coin_10', () => drawCoin(0xd0d0d8, '10')); // dime
  tex('boss_coin_25', () => drawCoin(0xc0c8d0, '25')); // quarter

  // Dollar bomb
  tex('boss_dollar', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRoundedRect(2, 6, 20, 12, 2);
    g.fillStyle(0x6dffb0, 1);
    g.fillRect(4, 8, 16, 8);
    g.fillStyle(0x1a4030, 1);
    g.fillRect(10, 9, 4, 6);
    g.fillStyle(0x2d6a4f, 1);
    g.fillCircle(12, 12, 2);
  });

  // Nugget pickup (reuse look, slightly distinct key)
  tex('boss_nugget', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0xc47a20, 1);
    g.fillRoundedRect(5, 7, 14, 11, 3);
    g.fillStyle(0xe8a040, 1);
    g.fillRoundedRect(7, 9, 10, 7, 2);
    g.fillStyle(0xfff0c0, 0.5);
    g.fillRect(8, 10, 3, 2);
  });

  // Boss projectiles
  tex('boss_bullet', () => {
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, s, s);
    g.fillStyle(0xff4444, 1);
    g.fillCircle(12, 12, 4);
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(12, 12, 2);
  });

  // King MacClowen form sprites + portrait are high-res PNGs (BootScene).
  // Procedural fallbacks only if an asset failed to load.
  const drawMacFallback = (form: 'pigtails' | 'crown' | 'clown', size: number) => {
    const cx = size / 2;
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, size, size);
    const suit =
      form === 'pigtails' ? 0xc41e3a : form === 'crown' ? 0x1a4a8a : 0xff2222;
    g.fillStyle(suit, 1);
    g.fillRoundedRect(size * 0.28, size * 0.48, size * 0.44, size * 0.42, 4);
    g.fillStyle(0xffe0c0, 1);
    g.fillCircle(cx, size * 0.38, size * 0.18);
    if (form === 'pigtails') {
      g.fillStyle(0xd4a017, 1);
      g.fillCircle(cx, size * 0.28, size * 0.14);
      g.fillCircle(size * 0.22, size * 0.42, size * 0.08);
      g.fillCircle(size * 0.78, size * 0.42, size * 0.08);
    } else if (form === 'crown') {
      g.fillStyle(0xf5d080, 1);
      g.fillRect(size * 0.3, size * 0.18, size * 0.4, size * 0.12);
    } else {
      g.fillStyle(0xff2222, 1);
      g.fillEllipse(cx, size * 0.26, size * 0.38, size * 0.16);
      g.fillStyle(0xff3333, 1);
      g.fillCircle(cx, size * 0.42, size * 0.06);
    }
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - size * 0.08, size * 0.34, size * 0.05, size * 0.05);
    g.fillRect(cx + size * 0.04, size * 0.34, size * 0.05, size * 0.05);
  };

  if (!scene.textures.exists('boss_mac_pigtails')) {
    texN('boss_mac_pigtails', 48, 48, () => drawMacFallback('pigtails', 48));
  }
  if (!scene.textures.exists('boss_mac_crown')) {
    texN('boss_mac_crown', 48, 48, () => drawMacFallback('crown', 48));
  }
  if (!scene.textures.exists('boss_mac_clown')) {
    texN('boss_mac_clown', 48, 48, () => drawMacFallback('clown', 48));
  }

  if (!scene.textures.exists('boss_mac_portrait')) {
    const PORTRAIT = 256;
    texN('boss_mac_portrait', PORTRAIT, PORTRAIT, () => {
      const p = PORTRAIT;
      g.fillStyle(0x000000, 1);
      g.fillRect(0, 0, p, p);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        g.lineStyle(8, 0xf5d080, 0.85);
        g.lineBetween(p / 2, p / 2, p / 2 + Math.cos(a) * p * 0.55, p / 2 + Math.sin(a) * p * 0.55);
      }
      // White mask face
      g.fillStyle(0xf5f5f5, 1);
      g.fillEllipse(p / 2, p / 2, p * 0.52, p * 0.62);
      g.lineStyle(6, 0x0a0a0a, 1);
      g.strokeEllipse(p / 2, p / 2, p * 0.52, p * 0.62);
      // Blue eyeshadow diamonds
      g.fillStyle(0x3a7bd5, 1);
      g.fillTriangle(p * 0.32, p * 0.38, p * 0.42, p * 0.28, p * 0.42, p * 0.48);
      g.fillTriangle(p * 0.68, p * 0.38, p * 0.58, p * 0.28, p * 0.58, p * 0.48);
      g.fillStyle(0x1a1a1a, 1);
      g.fillEllipse(p * 0.38, p * 0.4, p * 0.08, p * 0.1);
      g.fillEllipse(p * 0.62, p * 0.4, p * 0.08, p * 0.1);
      // Red nose
      g.fillStyle(0xe02020, 1);
      g.fillCircle(p / 2, p * 0.48, p * 0.07);
      // Cheeks
      g.fillStyle(0xf08090, 1);
      g.fillCircle(p * 0.28, p * 0.52, p * 0.05);
      g.fillCircle(p * 0.72, p * 0.52, p * 0.05);
      // Grin
      g.fillStyle(0xc01828, 1);
      g.fillEllipse(p / 2, p * 0.68, p * 0.36, p * 0.18);
      g.fillStyle(0x0a0a0a, 1);
      g.fillEllipse(p / 2, p * 0.68, p * 0.28, p * 0.12);
      g.fillStyle(0xf0c040, 1);
      for (let t = 0; t < 5; t++) {
        g.fillRect(p * 0.36 + t * p * 0.06, p * 0.64, p * 0.04, p * 0.05);
      }
    });
  }

  g.destroy();
}
