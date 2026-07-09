import type { GridPos, TileType } from '../data/types';
import { isWalkable } from '../map/DungeonGenerator';

const DIRS: GridPos[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

/** BFS one step toward target; returns next cell or null. */
export function nextStepToward(
  from: GridPos,
  to: GridPos,
  tiles: TileType[][],
  blocked: Set<string>,
): GridPos | null {
  if (from.x === to.x && from.y === to.y) return null;

  const h = tiles.length;
  const w = tiles[0]?.length ?? 0;
  const key = (x: number, y: number) => `${x},${y}`;
  const q: GridPos[] = [from];
  const prev = new Map<string, string | null>();
  prev.set(key(from.x, from.y), null);

  let found: GridPos | null = null;

  while (q.length > 0) {
    const cur = q.shift()!;
    if (cur.x === to.x && cur.y === to.y) {
      found = cur;
      break;
    }
    for (const d of DIRS) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      const tile = tiles[ny]![nx]!;
      const isTarget = nx === to.x && ny === to.y;
      if (!isTarget) {
        if (!isWalkable(tile)) continue;
        if (blocked.has(k) && !(nx === from.x && ny === from.y)) continue;
      }
      prev.set(k, key(cur.x, cur.y));
      q.push({ x: nx, y: ny });
    }
  }

  if (!found) {
    // Greedy fallback: step that reduces manhattan if free
    let best: GridPos | null = null;
    let bestDist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    for (const d of DIRS) {
      const nx = from.x + d.x;
      const ny = from.y + d.y;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!isWalkable(tiles[ny]![nx]!)) continue;
      if (blocked.has(key(nx, ny))) continue;
      const dist = Math.abs(nx - to.x) + Math.abs(ny - to.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: nx, y: ny };
      }
    }
    return best;
  }

  // Walk back to step after from
  let curKey = key(found.x, found.y);
  const path: string[] = [curKey];
  while (prev.get(curKey)) {
    curKey = prev.get(curKey)!;
    path.push(curKey);
  }
  path.reverse();
  if (path.length < 2) return null;
  const [, next] = path;
  const [sx, sy] = next!.split(',').map(Number);
  return { x: sx!, y: sy! };
}

export function manhattan(a: GridPos, b: GridPos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
