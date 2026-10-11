// Compare the actual binned sample with a normal curve fitted to its mean and
// spread. Binning and finite samples make this an approximate normality check.
const normalCDF = (x) => {
  const z = Math.abs(x) / Math.SQRT2,
    t = 1 / (1 + 0.3275911 * z);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return (1 + Math.sign(x) * erf) / 2;
};
export function galtonStatistics(bins) {
  const count = bins.reduce((a, b) => a + b, 0);
  if (!count)
    return {
      count,
      mean: 0,
      standardDeviation: 0,
      skewness: 0,
      kurtosis: 0,
      cdfError: 0,
      expected: bins.map(() => 0),
    };
  const halfWidth = bins.length * 0.52;
  const centers = bins.map((_, i) => -halfWidth + (i + 0.5) * 1.04);
  const mean = bins.reduce((s, n, i) => s + n * centers[i], 0) / count;
  const moment = (k) =>
    bins.reduce((s, n, i) => s + n * (centers[i] - mean) ** k, 0) / count;
  const variance = moment(2),
    standardDeviation = Math.sqrt(variance);
  if (!standardDeviation)
    return {
      count,
      mean,
      standardDeviation,
      skewness: 0,
      kurtosis: 0,
      cdfError: 1,
      expected: bins.map(() => 0),
    };
  let cumulative = 0,
    cdfError = 0;
  const expected = bins.map((n, i) => {
    const low = normalCDF((-halfWidth + i * 1.04 - mean) / standardDeviation);
    const high = normalCDF(
      (-halfWidth + (i + 1) * 1.04 - mean) / standardDeviation,
    );
    cumulative += n / count;
    cdfError = Math.max(cdfError, Math.abs(cumulative - high));
    return count * (high - low);
  });
  return {
    count,
    mean,
    standardDeviation,
    skewness: moment(3) / standardDeviation ** 3,
    kurtosis: moment(4) / variance ** 2,
    cdfError,
    expected,
  };
}
export function galtonChart(bins, released = 0, total = 40000) {
  const s = galtonStatistics(bins),
    max = Math.max(1, ...bins, ...s.expected),
    chartWidth = bins.length * 10;
  const bars = bins
    .map(
      (n, i) =>
        `<rect x="${i * 10 + 1}" y="${85 - (n / max) * 80}" width="8" height="${(n / max) * 80}" fill="#398b9b"><title>Bin ${i + 1}: ${n.toLocaleString()} marbles</title></rect>`,
    )
    .join("");
  const curve = s.expected
    .map((n, i) => `${i * 10 + 5},${85 - (n / max) * 80}`)
    .join(" ");
  return `<svg viewBox="0 0 ${chartWidth} 95" role="img" aria-label="Measured marble bin counts with fitted normal curve">${bars}<polyline points="${curve}" fill="none" stroke="#d65d3b" stroke-width="2"/><path d="M0 85H${chartWidth}" stroke="#687b85"/></svg><p>${s.count.toLocaleString()} collected · ${released.toLocaleString()} / ${total.toLocaleString()} released</p><small>Blue: actual bins. Orange: normal curve fitted to their mean and spread.</small>`;
}
