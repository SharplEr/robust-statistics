#!/usr/bin/env python3
"""Lesson 0003: sampling variability of empirical quantiles and maxima.

Standard library only; keep sampling_helpers.py alongside this file.
Browser and Python use the same RNG and ordering of generated requests.
No real production data, timeouts, censoring, dependence or query-mix changes.
"""
import argparse
from math import ceil, isfinite
from sampling_helpers import empirical_quantile, mulberry32

LEVELS = (.5, .95, .99)
MINIMUM = 15
SHAPE = 1.5


def population_quantile(p, scale=1):
    if not isfinite(p) or not 0 <= p < 1 or not isfinite(scale) or scale <= 0:
        raise ValueError("Expected 0 <= p < 1 and scale > 0")
    return scale * MINIMUM / (1 - p) ** (1 / SHAPE)


def one_run(n, rng, scale):
    ordered = sorted(population_quantile(next(rng), scale) for _ in range(n))
    return {"p50": ordered[ceil(.5 * n) - 1],
            "p95": ordered[ceil(.95 * n) - 1],
            "p99": ordered[ceil(.99 * n) - 1], "max": ordered[-1]}


def simulate(n=200, seed=43, improvement=0, repeats=200):
    if (not isinstance(n, int) or not 2 <= n <= 100000 or
            not isinstance(repeats, int) or not 2 <= repeats <= 2000 or
            not isfinite(improvement) or not 0 <= improvement <= 30 or
            not isinstance(seed, int) or not 0 <= seed <= 4294967295):
        raise ValueError("Invalid n, seed, improvement or repeats")
    rng = mulberry32(seed)
    scale = 1 - improvement / 100
    before, after = [], []
    for _ in range(repeats):
        before.append(one_run(n, rng, 1))
        after.append(one_run(n, rng, scale))
    return {"n": n, "seed": seed, "improvement": improvement, "repeats": repeats,
            "before": before, "after": after,
            "true_before": [population_quantile(p) for p in LEVELS],
            "true_after": [population_quantile(p, scale) for p in LEVELS],
            "positive_differences": sum(b["p99"] > a["p99"] for a, b in zip(before, after))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n", type=int, default=200)
    parser.add_argument("--seed", type=int, default=43)
    parser.add_argument("--improvement", type=float, default=0)
    parser.add_argument("--repeats", type=int, default=200)
    args = parser.parse_args()
    try:
        data = simulate(args.n, args.seed, args.improvement, args.repeats)
    except ValueError as error:
        parser.error(str(error))
    print(f"Pareto model: minimum={MINIMUM} ms, shape={SHAPE}; n={args.n}, seed={args.seed}")
    print(f"B scales latency by {1 - args.improvement / 100:.2f}; {args.repeats} independent pairs")
    for i, name in enumerate(("p50", "p95", "p99", "max")):
        a = [run[name] for run in data["before"]]
        b = [run[name] for run in data["after"]]
        target = f"{data['true_before'][i]:.2f} -> {data['true_after'][i]:.2f}" if i < 3 else "depends on n"
        print(f"{name}: target {target} ms; empirical central 90% across runs "
              f"A=[{empirical_quantile(a,.05):.2f}, {empirical_quantile(a,.95):.2f}], "
              f"B=[{empirical_quantile(b,.05):.2f}, {empirical_quantile(b,.95):.2f}]")
    print("These simulation ranges are NOT confidence intervals from production observations.")
    a, b = data["before"][0]["p99"], data["after"][0]["p99"]
    print(f"First pair sample p99: {a:.2f} -> {b:.2f}; delta={b-a:.2f} ms")
    print(f"Sample p99(B)>p99(A): {data['positive_differences']}/{args.repeats} pairs")
    print(f"Expected observations above true p99: {args.n * .01:g}")


if __name__ == "__main__":
    main()
