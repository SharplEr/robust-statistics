/* Shared deterministic statistics for local lessons. No network or dependencies. */
(function (root) {
  "use strict";
  function valuesOf(values) {
    if (!Array.isArray(values) || !values.length || !values.every(Number.isFinite)) {
      throw new RangeError("Expected a nonempty array of finite numbers");
    }
    return values;
  }
  function mean(values) {
    return valuesOf(values).reduce((sum, x) => sum + x, 0) / values.length;
  }
  function median(values) {
    const sorted = valuesOf(values).slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }
  function empiricalQuantile(values, p) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError("p must be in [0, 1]");
    const sorted = valuesOf(values).slice().sort((a, b) => a - b);
    return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
  }
  function quantileDetails(values, p, type) {
    if (!Number.isFinite(p) || p < 0 || p > 1 || ![1, 7, 8].includes(type)) {
      throw new RangeError("Expected p in [0, 1] and Hyndman–Fan type 1, 7 or 8");
    }
    const sorted = valuesOf(values).slice().sort((a, b) => a - b), n = sorted.length;
    const h = type === 1 ? n * p : type === 7 ? 1 + (n - 1) * p : (n + 1 / 3) * p + 1 / 3;
    if (type === 1) {
      const rank = Math.max(1, Math.ceil(n * p));
      return {type, n, p, h, lowerRank: rank, upperRank: rank, weightUpper: 0,
        value: empiricalQuantile(sorted, p)};
    }
    const position = Math.max(1, Math.min(n, h)), lowerRank = Math.floor(position);
    const weightUpper = position - lowerRank, upperRank = weightUpper ? lowerRank + 1 : lowerRank;
    const lower = sorted[lowerRank - 1], upper = sorted[upperRank - 1];
    return {type, n, p, h, lowerRank, upperRank, weightUpper,
      value: lower === upper ? lower : (1 - weightUpper) * lower + weightUpper * upper};
  }
  function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function model(epsilon, slow, fast = 9) {
    if (!Number.isFinite(epsilon) || epsilon < 0 || epsilon >= 0.5 ||
        !Number.isFinite(slow) || !Number.isFinite(fast) || slow < fast) {
      throw new RangeError("Expected 0 <= epsilon < 0.5 and finite slow >= fast");
    }
    return {
      mean: (1 - epsilon) * fast + epsilon * slow,
      median: fast,
      breach: (1 - epsilon) * Number(fast > 100) + epsilon * Number(slow > 100)
    };
  }
  function normalGenerator(rng) {
    let spare = null;
    return function () {
      if (spare !== null) { const value = spare; spare = null; return value; }
      const radius = Math.sqrt(-2 * Math.log(1 - rng()));
      const angle = 2 * Math.PI * rng();
      spare = radius * Math.sin(angle);
      return radius * Math.cos(angle);
    };
  }
  function drawSample(n, epsilon, slow, seed, fast = 9) {
    model(epsilon, slow, fast);
    if (!Number.isInteger(n) || n < 1) throw new RangeError("Expected positive integer n");
    const rng = mulberry32(seed);
    return Array.from({ length: n }, () => rng() < epsilon ? slow : fast);
  }
  const api = Object.freeze({ mean, median, empiricalQuantile, quantileDetails, mulberry32, normalGenerator, model, drawSample });
  root.CourseStats = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
}(typeof globalThis !== "undefined" ? globalThis : this));
