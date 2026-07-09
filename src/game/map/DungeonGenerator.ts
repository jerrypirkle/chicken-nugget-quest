import { FLOORS } from '../data/content';
import { mulberry32, pick, randInt } from '../data/runState';
import type { FloorDef, GridPos, Room, TileType } from '../data/types';

export interface PlacedEnemy {
  x: number;
  y: number;
  enemyId: string;
}

export interface GeneratedFloor {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[];
  playerStart: GridPos;
  saucePos: GridPos;
  stairsPos: GridPos | null;
  exitPos: GridPos | null;
  nuggets: GridPos[];
  enemies: PlacedEnemy[];
  floor: FloorDef;
}

function roomCenter(r: Room): GridPos {
  return {
    x: r.x + Math.floor(r.w / 2),
    y: r.y + Math.floor(r.h / 2),
  };
}

function roomsOverlap(a: Room, b: Room, pad = 1): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

function carveRoom(tiles: TileType[][], room: Room): void {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      tiles[y]![x] = 'floor';
    }
  }
}

function carveHCorridor(tiles: TileType[][], x1: number, x2: number, y: number): void {
  const [a, b] = x1 < x2 ? [x1, x2] : [x2, x1];
  for (let x = a; x <= b; x++) {
    if (tiles[y]?.[x] !== undefined) tiles[y]![x] = 'floor';
  }
}

function carveVCorridor(tiles: TileType[][], y1: number, y2: number, x: number): void {
  const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1];
  for (let y = a; y <= b; y++) {
    if (tiles[y]?.[x] !== undefined) tiles[y]![x] = 'floor';
  }
}

function connectRooms(tiles: TileType[][], a: Room, b: Room, rng: () => number): void {
  const ca = roomCenter(a);
  const cb = roomCenter(b);
  if (rng() < 0.5) {
    carveHCorridor(tiles, ca.x, cb.x, ca.y);
    carveVCorridor(tiles, ca.y, cb.y, cb.x);
  } else {
    carveVCorridor(tiles, ca.y, cb.y, ca.x);
    carveHCorridor(tiles, ca.x, cb.x, cb.y);
  }
}

function floorTiles(tiles: TileType[][]): GridPos[] {
  const out: GridPos[] = [];
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y]!.length; x++) {
      if (tiles[y]![x] === 'floor') out.push({ x, y });
    }
  }
  return out;
}

function dist2(a: GridPos, b: GridPos): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function generateFloor(floorIndex: number, seed: number): GeneratedFloor {
  const floor = FLOORS[floorIndex]!;
  const rng = mulberry32(seed + floorIndex * 9973 + 42);
  const { mapW: w, mapH: h } = floor;

  const tiles: TileType[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => 'wall' as TileType),
  );

  const targetRooms = randInt(rng, floor.roomCount[0], floor.roomCount[1]);
  const rooms: Room[] = [];
  let attempts = 0;
  while (rooms.length < targetRooms && attempts < 200) {
    attempts++;
    const rw = randInt(rng, 4, 8);
    const rh = randInt(rng, 4, 7);
    const rx = randInt(rng, 1, w - rw - 2);
    const ry = randInt(rng, 1, h - rh - 2);
    const room: Room = { x: rx, y: ry, w: rw, h: rh };
    if (rooms.some((r) => roomsOverlap(r, room))) continue;
    rooms.push(room);
    carveRoom(tiles, room);
  }

  // Ensure at least 2 rooms
  if (rooms.length < 2) {
    const fallback: Room = { x: 2, y: 2, w: 8, h: 6 };
    rooms.push(fallback);
    carveRoom(tiles, fallback);
    const fallback2: Room = { x: w - 12, y: h - 10, w: 8, h: 6 };
    rooms.push(fallback2);
    carveRoom(tiles, fallback2);
  }

  for (let i = 1; i < rooms.length; i++) {
    connectRooms(tiles, rooms[i - 1]!, rooms[i]!, rng);
  }
  // Extra loops for connectivity flavor
  if (rooms.length > 3) {
    connectRooms(tiles, rooms[0]!, rooms[rooms.length - 1]!, rng);
  }

  const startRoom = rooms[0]!;
  const sauceRoom = rooms[rooms.length - 1]!;
  const playerStart = roomCenter(startRoom);
  const saucePos = roomCenter(sauceRoom);
  tiles[saucePos.y]![saucePos.x] = 'sauce_altar';

  const isLast = floorIndex >= FLOORS.length - 1;
  let stairsPos: GridPos | null = null;
  let exitPos: GridPos | null = null;

  // Place stairs/exit near sauce but not on it
  const candidates = floorTiles(tiles).filter(
    (p) =>
      !(p.x === saucePos.x && p.y === saucePos.y) &&
      !(p.x === playerStart.x && p.y === playerStart.y) &&
      dist2(p, saucePos) <= 8,
  );
  const portalSpot =
    candidates.length > 0
      ? candidates[Math.floor(rng() * candidates.length)]!
      : { x: saucePos.x, y: Math.min(h - 2, saucePos.y + 1) };

  if (isLast) {
    exitPos = portalSpot;
    tiles[exitPos.y]![exitPos.x] = 'exit';
  } else {
    stairsPos = portalSpot;
    tiles[stairsPos.y]![stairsPos.x] = 'stairs';
  }

  const blocked = new Set<string>([
    `${playerStart.x},${playerStart.y}`,
    `${saucePos.x},${saucePos.y}`,
    ...(stairsPos ? [`${stairsPos.x},${stairsPos.y}`] : []),
    ...(exitPos ? [`${exitPos.x},${exitPos.y}`] : []),
  ]);

  const free = floorTiles(tiles).filter((p) => !blocked.has(`${p.x},${p.y}`));
  const shuffle = [...free];
  for (let i = shuffle.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffle[i], shuffle[j]] = [shuffle[j]!, shuffle[i]!];
  }

  let idx = 0;
  const nuggetN = randInt(rng, floor.nuggetCount[0], floor.nuggetCount[1]);
  const nuggets: GridPos[] = [];
  for (let n = 0; n < nuggetN && idx < shuffle.length; n++, idx++) {
    const p = shuffle[idx]!;
    nuggets.push(p);
    blocked.add(`${p.x},${p.y}`);
  }

  const enemyN = randInt(rng, floor.enemyCount[0], floor.enemyCount[1]);
  const enemies: PlacedEnemy[] = [];
  for (let n = 0; n < enemyN && idx < shuffle.length; n++, idx++) {
    const p = shuffle[idx]!;
    // Keep spawn away from player
    if (dist2(p, playerStart) < 16) {
      n--;
      continue;
    }
    enemies.push({
      x: p.x,
      y: p.y,
      enemyId: pick(rng, floor.enemyIds),
    });
  }

  // Guarantee one Manager's Special on final floor
  if (isLast && !enemies.some((e) => e.enemyId === 'managers_special')) {
    const far = shuffle.find(
      (p) => dist2(p, playerStart) > 25 && !blocked.has(`${p.x},${p.y}`),
    );
    if (far) {
      enemies.push({ x: far.x, y: far.y, enemyId: 'managers_special' });
    }
  }

  return {
    width: w,
    height: h,
    tiles,
    rooms,
    playerStart,
    saucePos,
    stairsPos,
    exitPos,
    nuggets,
    enemies,
    floor,
  };
}

export function isWalkable(tile: TileType): boolean {
  return tile !== 'wall';
}
