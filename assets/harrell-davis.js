/* Pure teaching experiments. HTML uses a validated finite grid of high-precision weights. */
(function (root) {
  "use strict";
  const stats = root.CourseStats || require("./statistics.js");
  const table = root.CourseHDWeights || require("./hd-weights.js");
  const moments = (root.CourseEfficiency || require("./influence-efficiency.js")).moments;
  function weights(n, p) {
    const values = table[String(n)] && table[String(n)][String(p)];
    if (!values) throw new RangeError("HTML presets: n=5/9/19, p=.1/.5/.9. General computation: Python example.");
    return values;
  }
  function dot(values, coefficients) {
    if (!Array.isArray(values) || values.length !== coefficients.length || !values.every(Number.isFinite)) {
      throw new RangeError("Expected finite values matching the weight vector");
    }
    return values.slice().sort((a, b) => a - b).reduce((sum, value, i) => sum + coefficients[i] * value, 0);
  }
  function typeWeights(n, p, type) {
    const result = stats.quantileDetails(Array.from({length: n}, (_, i) => i + 1), p, type);
    const coefficients = Array(n).fill(0);
    coefficients[result.lowerRank - 1] += 1 - result.weightUpper;
    coefficients[result.upperRank - 1] += result.weightUpper;
    return coefficients;
  }
  function replacement(n = 5, p = .5, exponent = 0) {
    const hdWeights = weights(n, p);
    if (!Number.isFinite(exponent) || exponent < 0 || exponent > 8) throw new RangeError("Expected exponent 0..8");
    const clean = Array.from({length: n}, (_, i) => i + 1), magnitude = n * 10 ** exponent;
    const replaced = clean.slice(); replaced[n - 1] = magnitude;
    const coefficients = {type1: typeWeights(n, p, 1), type7: typeWeights(n, p, 7), hd: hdWeights};
    const results = Object.fromEntries(Object.entries(coefficients).map(([key, w]) => [key,
      {before: dot(clean, w), after: dot(replaced, w), weightMaximum: w[n - 1]}]));
    return {n, p, exponent, magnitude, clean, replaced, coefficients, results};
  }
  function simulate(scenario = "clean", seed = 43, repetitions = 2000) {
    if (!["clean", "wide"].includes(scenario) || !Number.isInteger(seed) || seed < 0 || seed > 4294967295 ||
        !Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10000) throw new RangeError("Invalid Monte Carlo settings");
    const rng = stats.mulberry32(seed), normal = stats.normalGenerator(rng), w = weights(5, .5);
    const estimates = {type7: [], hd: []};
    for (let r = 0; r < repetitions; r++) {
      const sample = Array.from({length: 5}, () => {
        const rare = rng() < .02, value = normal();
        return value * (scenario === "wide" && rare ? 100 : 1);
      }).sort((a, b) => a - b);
      estimates.type7.push(stats.median(sample));
      estimates.hd.push(dot(sample, w));
    }
    return {n: 5, p: .5, target: 0, seed, repetitions, scenario,
      type7: moments(estimates.type7, 0), hd: moments(estimates.hd, 0)};
  }
  root.CourseHD = Object.freeze({weights, dot, typeWeights, replacement, simulate});
  if (typeof module !== "undefined" && module.exports) module.exports = root.CourseHD;
}(typeof globalThis !== "undefined" ? globalThis : this));
