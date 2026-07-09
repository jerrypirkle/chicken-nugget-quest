export interface Actor {
  id: string;
  kind: 'player' | 'enemy';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  name: string;
  /** Enemy definition id when kind === 'enemy' */
  enemyId?: string;
  dead: boolean;
}

let nextId = 1;

export function createPlayer(x: number, y: number, hp: number, maxHp: number, attack: number): Actor {
  return {
    id: `player-${nextId++}`,
    kind: 'player',
    x,
    y,
    hp,
    maxHp,
    attack,
    name: 'Hungry Adventurer',
    dead: false,
  };
}

export function createEnemy(
  x: number,
  y: number,
  enemyId: string,
  name: string,
  hp: number,
  attack: number,
): Actor {
  return {
    id: `enemy-${nextId++}`,
    kind: 'enemy',
    x,
    y,
    hp,
    maxHp: hp,
    attack,
    name,
    enemyId,
    dead: false,
  };
}

export function resetActorIds(): void {
  nextId = 1;
}
