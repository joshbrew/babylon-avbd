import assert from "node:assert/strict";
import {
  galtonStatistics,
  galtonChart,
} from "../demo/galton-board/statistics.js";

// Twenty independent left/right peg choices approach a normal distribution.
const binomial = Array(25).fill(0);
let coefficient = 1;
for (let k = 0; k <= 20; k++) {
  binomial[k + 2] = coefficient;
  coefficient *= (20 - k) / (k + 1);
}
const normal = galtonStatistics(binomial);
assert.ok(Math.abs(normal.mean) < 1e-12);
assert.ok(Math.abs(normal.kurtosis - 2.9) < 1e-10);
assert.ok(normal.cdfError < 0.01);
assert.ok(Math.abs(normal.skewness) < 1e-12);
assert.ok(galtonStatistics(Array(25).fill(1)).cdfError > 0.05);
assert.ok(galtonStatistics([100, ...Array(23).fill(0), 100]).cdfError > 0.3);
// Symmetric side peaks can look balanced while still being far from normal.
const twoStreams = Array.from(
  { length: 33 },
  (_, i) => Math.exp(-((i - 7) ** 2) / 18) + Math.exp(-((i - 25) ** 2) / 18),
);
assert.ok(Math.abs(galtonStatistics(twoStreams).skewness) < 1e-12);
assert.ok(galtonStatistics(twoStreams).cdfError > 0.1);
assert.equal(galtonStatistics(Array(25).fill(0)).count, 0);
assert.ok(!galtonChart(Array(25).fill(0)).includes("NaN"));
assert.ok(galtonChart(Array(33).fill(0)).includes('viewBox="0 0 330 95"'));
assert.ok(galtonChart(binomial, 40000).includes("40,000 / 40,000 released"));
console.log(
  "Galton statistics: normal, uniform, two-peak, edge-heavy and empty samples checked",
);
