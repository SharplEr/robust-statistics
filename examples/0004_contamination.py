#!/usr/bin/env python3
"""Lesson 0004: finite-sample replacement breakdown, deterministic examples.

Standard library only. Requires sampling_helpers.py in the same directory.
The convention is the minimum number of replacements causing unbounded change.
Quantiles use inverse ECDF. All demonstrated replacements are positive and above
the largest original observation. No errors are detected automatically.
"""
import argparse
from math import ceil, isfinite
from statistics import fmean, median
from sampling_helpers import empirical_quantile


def clean_sample(n):
    if not isinstance(n, int) or n < 3 or n > 1001 or n % 2 == 0:
        raise ValueError("n must be odd, 3..1001")
    return [20 + 380 * (i / (n - 1)) ** 4 for i in range(n)]


def thresholds(n):
    clean_sample(n)
    return {"mean": 1, "median": (n + 1) // 2,
            "p95": n - ceil(.95 * n) + 1, "p99": n - ceil(.99 * n) + 1}


def summarize(values):
    return {"mean": fmean(values), "median": median(values),
            "p95": empirical_quantile(values, .95), "p99": empirical_quantile(values, .99)}


def replace(n=101, m=1, exponent=6):
    clean = clean_sample(n)
    if not isinstance(m, int) or not 0 <= m <= n or not isfinite(exponent) or not 3 <= exponent <= 12:
        raise ValueError("Expected integer 0 <= m <= n and exponent 3..12")
    magnitude = 10 ** exponent
    corrupted = [magnitude if i < m else value for i, value in enumerate(clean)]
    return {"n": n, "m": m, "magnitude": magnitude, "clean": clean, "corrupted": corrupted,
            "before": summarize(clean), "after": summarize(corrupted), "thresholds": thresholds(n)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n", type=int, default=101)
    parser.add_argument("--m", type=int, default=1)
    parser.add_argument("--exponent", type=float, default=6)
    args = parser.parse_args()
    try:
        data = replace(args.n, args.m, args.exponent)
    except ValueError as error:
        parser.error(str(error))
    print(f"n={args.n}, replaced={args.m}, M={data['magnitude']:.6g} ms")
    print("statistic    clean          replaced       minimum replacements for +infinity")
    for name, old in data["before"].items():
        print(f"{name:<12} {old:<14.5g} {data['after'][name]:<14.5g} {data['thresholds'][name]}/{args.n}")
    print("\nFor fixed n and m, increase M. Numerical finiteness at one M is not a breakdown proof.")
    print("A real delayed request and a measurement error may have identical numbers but different targets.")


if __name__ == "__main__":
    main()
