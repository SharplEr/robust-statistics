#!/usr/bin/env python3
"""Lesson 0001: exact latency targets, a sample and a replacement experiment.

Run: python3 examples/0001_estimand.py
Standard library only. The Mulberry32 implementation matches assets/statistics.js.
Synthetic model: A=10 ms; B=9 ms with probability 1-epsilon, slow otherwise.
This model is an exercise, not an assumption about actual benchmark distributions.
"""

import argparse
from math import isfinite
from statistics import fmean, median


def mulberry32(seed):
    """Deterministic PRNG for teaching, not cryptography."""
    state = seed & 0xFFFFFFFF
    while True:
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        value = ((state ^ (state >> 15)) * (state | 1)) & 0xFFFFFFFF
        value ^= (value + ((value ^ (value >> 7)) * (value | 61))) & 0xFFFFFFFF
        yield ((value ^ (value >> 14)) & 0xFFFFFFFF) / 4294967296


def model(epsilon=0.01, slow=1000.0):
    if not isfinite(epsilon) or not 0 <= epsilon < 0.5:
        raise ValueError("epsilon must be finite and in [0, 0.5)")
    if not isfinite(slow) or slow < 9:
        raise ValueError("slow must be finite and >= 9")
    return {
        "mean": (1 - epsilon) * 9 + epsilon * slow,
        "median": 9.0,
        "breach": epsilon if slow > 100 else 0.0,
    }


def draw_sample(n=1000, epsilon=0.01, slow=1000.0, seed=43):
    model(epsilon, slow)
    if not isinstance(n, int) or n < 1:
        raise ValueError("n must be a positive integer")
    random = mulberry32(seed)
    return [slow if next(random) < epsilon else 9.0 for _ in range(n)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--epsilon", type=float, default=0.01)
    parser.add_argument("--slow", type=float, default=1000.0)
    parser.add_argument("--n", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=43)
    args = parser.parse_args()
    try:
        exact = model(args.epsilon, args.slow)
        sample = draw_sample(args.n, args.epsilon, args.slow, args.seed)
    except ValueError as error:
        parser.error(str(error))
    print("Exact model; A: mean=10 ms, median=10 ms, P(T>100)=0%")
    print(f"B: mean={exact['mean']:.4f} ms, median={exact['median']:.4f} ms, "
          f"P(T>100)={exact['breach']:.2%}")
    print(f"One sample B; n={args.n}, seed={args.seed}:")
    print(f"mean={fmean(sample):.4f} ms, median={median(sample):.4f} ms, "
          f"P_hat(T>100)={sum(x > 100 for x in sample) / len(sample):.2%}")
    print("\nReplacement experiment; estimator target must be specified:")
    for replacement in (11, 1000, 1_000_000):
        values = [9, 10, 10, 10, replacement]
        print(f"M={replacement:>9}: mean={fmean(values):>12.2f}, median={median(values):.2f}")
    print("\nFor 1,000,000 sequential requests, expected total:")
    print(f"A={1_000_000 * 10 / 1000:.0f} s; B={1_000_000 * exact['mean'] / 1000:.0f} s")
    print("This is expected sequential service time, not concurrent wall-clock throughput.")


if __name__ == "__main__":
    main()
