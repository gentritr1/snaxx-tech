// Exports one real Arrows level (shape + arrows + a valid clearing order) as JSON, for
// src/experience/scene/arrowsLevel.ts. Expects the arrows-game repo next to this one
// (../arrows-game). Run from arrows-game so its own imports resolve:
//   cd ../arrows-game && npx tsx ../snaxx-tech/scripts/arrows-level/export-level.ts Circle 0 > level.json
import { LevelGenerator, shapeNameForLevel } from '../../../arrows-game/src/core/levelGenerator';
import { toChar } from '../../../arrows-game/src/core/direction';
const want = process.argv[2] ?? 'Heart';
const rows: string[] = [];
for (let i = 0; i < 400; i++) {
  const name = shapeNameForLevel(i);
  if (name.toLowerCase() !== want.toLowerCase()) continue;
  const lv = LevelGenerator.generate(i);
  rows.push(`${i}:${lv.arrowCount}:${lv.board.rows}x${lv.board.cols}:${lv.difficulty}`);
}
console.error('candidates', rows.slice(0, 12).join(' '));
const pick = Number(process.argv[3] ?? rows[0].split(':')[0]);
const lv = LevelGenerator.generate(pick);
const board = lv.board as any;
const arrows: any[] = [...board.arrows()];
const out = arrows.map((a: any) => ({ cells: a.cells.map((c: any) => [c.r, c.c]), dir: toChar(a.headDir) }));
// A valid clearing order: repeatedly fire any arrow whose lane is clear.
const order: number[] = [];
while (!board.isCleared()) {
  const live = [...board.arrows()];
  const a = live.find((x: any) => board.canExit(x));
  if (!a) throw new Error('stuck');
  order.push(arrows.indexOf(a));
  board.tryRemove(a);
}
process.stdout.write(JSON.stringify({ level: pick, shape: lv.shapeName, rows: board.rows, cols: board.cols, arrows: out, order }));
