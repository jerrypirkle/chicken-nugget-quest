import type { EnemyDef, FloorDef, SauceDef } from './types';

export const SAUCES: SauceDef[] = [
  {
    id: 'weak_sauce',
    name: 'WeakSauce',
    floor: 1,
    color: 0xc4a882,
    blurb: 'Barely a condiment. The Culinary Council is not impressed.',
  },
  {
    id: 'bbq',
    name: 'BBQ',
    floor: 2,
    color: 0x8b3a1a,
    blurb: 'Classic. Smoky. Respectable. Do not get it on the map.',
  },
  {
    id: 'awesome_sauce',
    name: 'AwesomeSauce',
    floor: 3,
    color: 0xff6b9d,
    blurb: 'Peak dip. Franchise legend. Handle with greased hands.',
  },
];

export const ENEMIES: Record<string, EnemyDef> = {
  hangry_rat: {
    id: 'hangry_rat',
    name: 'Hangry Rat',
    glyph: 'r',
    color: 0x9a7b5a,
    hp: 4,
    attack: 2,
    aggroRange: 6,
    speed: 1,
    messages: {
      attack: [
        'The Hangry Rat nips your ankle. Rude.',
        'Tiny teeth, big attitude.',
      ],
      death: [
        'The Hangry Rat collapses mid-squeak.',
        'One less freeloader at the buffet.',
      ],
    },
  },
  vengeful_fry: {
    id: 'vengeful_fry',
    name: 'Vengeful Fry',
    glyph: 'f',
    color: 0xe8b84a,
    hp: 6,
    attack: 3,
    aggroRange: 7,
    speed: 1,
    messages: {
      attack: [
        'A crispy slap! Salt in the wound, literally.',
        'The Vengeful Fry pokes with potato fury.',
      ],
      death: [
        'The fry goes limp. Too limp. Never limp enough.',
        'You have committed carbohydrate violence.',
      ],
    },
  },
  napkin_swarm: {
    id: 'napkin_swarm',
    name: 'Sentient Napkin Swarm',
    glyph: 'n',
    color: 0xf0f0f0,
    hp: 5,
    attack: 2,
    aggroRange: 5,
    speed: 1,
    messages: {
      attack: [
        'Paper cuts! The worst cuts!',
        'The swarm absorbs your dignity.',
      ],
      death: [
        'The napkins settle into a sad little pile.',
        'Recyclable. Sort of.',
      ],
    },
  },
  managers_special: {
    id: 'managers_special',
    name: "Manager's Special",
    glyph: 'M',
    color: 0xc44,
    hp: 14,
    attack: 4,
    aggroRange: 8,
    speed: 1,
    messages: {
      attack: [
        "The Manager's Special files a complaint against your HP.",
        'Corporate synergy deals 4 damage.',
      ],
      death: [
        'The Special is discontinued. Permanently.',
        'You have closed the account.',
      ],
    },
  },
};

export const FLOORS: FloorDef[] = [
  {
    index: 0,
    name: 'Drive-Thru Dungeon',
    sauceId: 'weak_sauce',
    enemyIds: ['hangry_rat', 'vengeful_fry'],
    nuggetCount: [8, 12],
    enemyCount: [5, 8],
    mapW: 36,
    mapH: 24,
    roomCount: [6, 9],
  },
  {
    index: 1,
    name: 'Ketchup Catacombs',
    sauceId: 'bbq',
    enemyIds: ['hangry_rat', 'vengeful_fry', 'napkin_swarm'],
    nuggetCount: [7, 11],
    enemyCount: [7, 10],
    mapW: 38,
    mapH: 26,
    roomCount: [7, 10],
  },
  {
    index: 2,
    name: 'The Fryer',
    sauceId: 'awesome_sauce',
    enemyIds: ['vengeful_fry', 'napkin_swarm', 'managers_special'],
    nuggetCount: [6, 10],
    enemyCount: [8, 11],
    mapW: 40,
    mapH: 28,
    roomCount: [8, 11],
  },
];

export function sauceById(id: string): SauceDef {
  const s = SAUCES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown sauce: ${id}`);
  return s;
}

export function pickMessage(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)] ?? list[0]!;
}

export const FLAVOR = {
  eatNugget: [
    'You eat a lukewarm nugget. Morale rises. Cholesterol also rises.',
    'Crispy. Greasy. Life-affirming.',
    'The nugget whispers secrets of the drive-thru. You chew louder.',
    'Protein acquired. Dignity optional.',
  ],
  hangryOn: [
    'HANGRY. Your eyes go red. The dungeon looks edible.',
    'Blood sugar critically low. Damage doubled. Manners offline.',
    'You swell with rage and empty calories. HANGRY MODE.',
  ],
  hangryOff: [
    'The red fades from your eyes. You are merely hungry again.',
    'Hangry subsides. You remember how to use indoor voice.',
  ],
  starve: [
    'Your stomach files a formal grievance. Case closed: fatal.',
    'Hunger wins. The franchise claims another soul.',
    'You collapse mid-combo. No refunds.',
  ],
  noExit: [
    'The exit hums shut. Sauces incomplete. The Culinary Council is disappointed.',
    'You need every legendary dip. This is non-negotiable franchise policy.',
  ],
  getSauce: [
    'Sauce secured. The condiment gods approve (reluctantly).',
    'A legendary dip joins your inventory. Do not shake the bag.',
  ],
  floorClear: [
    'Stairs down. Deeper into the combo meal.',
    'The fryer oil thickens. Onward.',
  ],
};
