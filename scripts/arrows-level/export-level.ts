// Writes one real Arrows level (shape + arrows + a valid clearing order) as the TypeScript module
// src/experience/scene/arrowsLevel.ts. Expects the arrows-game repo next to this one (../arrows-game).
// Run from arrows-game so its own imports resolve, e.g. from the snaxx-tech checkout's parent folder:
//   cd arrows-game && npx tsx ../snaxx-tech/scripts/arrows-level/export-level.ts Circle 0 > ../snaxx-tech/src/experience/scene/arrowsLevel.ts
import { LevelGenerator, shapeNameForLevel } from '../../../arrows-game/src/core/levelGenerator';
import { toChar } from '../../../arrows-game/src/core/direction';

const want = process.argv[2] ?? 'Heart';
const rows: string[] = [];
for (let i = 0; i < 400; i++) {
  if (shapeNameForLevel(i).toLowerCase() !== want.toLowerCase()) continue;
  const lv = LevelGenerator.generate(i);
  rows.push(`${i}:${lv.arrowCount}:${lv.board.rows}x${lv.board.cols}:${lv.difficulty}`);
}
console.error('candidates', rows.slice(0, 12).join(' '));
const pick = Number(process.argv[3] ?? rows[0].split(':')[0]);
const lv = LevelGenerator.generate(pick);
const board = lv.board;
const arrows = [...board.arrows()];
const out = arrows.map((a) => ({ cells: a.cells.map((c) => [c.r, c.c]), dir: toChar(a.headDir) }));
// A valid clearing order: repeatedly fire any arrow whose lane is clear.
const order: number[] = [];
while (!board.isCleared()) {
  const a = board.arrows().find((x) => board.canExit(x));
  if (!a) throw new Error('stuck');
  order.push(arrows.indexOf(a));
  board.tryRemove(a);
}

process.stdout.write(`// Level ${pick + 1} of Arrows (shape "${lv.shapeName}", ${board.rows}x${board.cols}, ${arrows.length} arrows), dealt by the game's own
// LevelGenerator (arrows-game/src/core/levelGenerator.ts, generate(${pick})). \`cells\` run tail -> head as
// [row, col] with row 0 at the top; \`dir\` is the head's facing (U/D/L/R). \`order\` is one valid clearing
// sequence: each arrow's lane to the edge is clear when it fires (checked with BoardLogic.canExit).
// Regenerate with scripts/arrows-level/export-level.ts if the game's generator changes; do not edit by hand.

export interface ArrowsLevelArrow {
  cells: [number, number][];
  dir: 'U' | 'D' | 'L' | 'R';
}

export const ARROWS_LEVEL = {
  rows: ${board.rows},
  cols: ${board.cols},
  arrows: [
${out.map((a) => `  ${JSON.stringify(a)}`).join(',\n')}
  ] as ArrowsLevelArrow[],
  order: [${order.join(',')}],
};
`);
