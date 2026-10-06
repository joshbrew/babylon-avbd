// Running bond with half bricks at the ends: every course has the same footprint.
export function brickWallLayout({
  rows = 7,
  columns = 7,
  layers = 2,
  centerX = 2.75,
  centerZ = 4.15,
  half = [0.1, 0.065, 0.24],
  gap = 0.001,
} = {}) {
  const bricks = [];
  const length = half[2] * 2,
    width = columns * length;
  for (let layer = 0; layer < layers; layer++)
    for (let row = 0; row < rows; row++) {
      const staggered = row % 2 === 1,
        count = columns + (staggered ? 1 : 0);
      let cursor = -width / 2;
      for (let column = 0; column < count; column++) {
        const fraction =
          staggered && (column === 0 || column === count - 1) ? 0.5 : 1;
        const brickLength = length * fraction;
        bricks.push({
          half: [half[0], half[1], brickLength / 2 - gap / 2],
          position: [
            centerX + layer * (2 * half[0] + gap),
            half[1] + row * (2 * half[1] + gap),
            centerZ + cursor + brickLength / 2,
          ],
          mass: 8.8 * fraction,
        });
        cursor += brickLength;
      }
    }
  return bricks;
}
