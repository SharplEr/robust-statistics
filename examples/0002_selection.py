#!/usr/bin/env python3
"""Lesson 0002: why conditional p99 may rise when requests improve.

This is a deterministic teaching population of 1000 request IDs, not production
data or a statistical significance test. Quantiles use inverse ECDF (nearest rank).
Run from the course root: python3 examples/0002_selection.py --recovered 50
"""
import argparse
from math import ceil


def quantile(values, p):
    if not values or not 0 < p <= 1:
        raise ValueError("Expected nonempty sample and 0 < p <= 1")
    return sorted(values)[ceil(len(values) * p) - 1]


def selection_case(recovered):
    if not isinstance(recovered, int) or not 0 <= recovered <= 50:
        raise ValueError("recovered must be an integer in [0, 50]")
    before_success = [30] * 900 + [200] * 50
    after_success = before_success + [900] * recovered
    return {
        "before_success": before_success,
        "after_success": after_success,
        "before_all": before_success + [1000] * 50,
        "after_all": after_success + [1000] * (50 - recovered),
        "after_error_rate": (50 - recovered) / 1000,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recovered", type=int, choices=range(51), default=50, metavar="0..50")
    args = parser.parse_args()
    data = selection_case(args.recovered)
    print("Fixed population: 1000 request IDs; empirical quantiles in ms")
    print("level    before_success    after_success    delta_success    after_all")
    for p in (0.5, 0.75, 0.9, 0.95, 0.99):
        old = quantile(data["before_success"], p)
        new = quantile(data["after_success"], p)
        print(f"p{p * 100:<5.0f} {old:>15} {new:>16} {new - old:>16} "
              f"{quantile(data['after_all'], p):>12}")
    print(f"Error rate: 5.00% -> {data['after_error_rate']:.2%}")
    print("All recovered requests: response latency 1000 -> 900 ms; error -> success.")
    print("No request slowed down. Success membership changed.")
    print("Deadline hits and completeness are separate flags, not inferred in this toy model.")


if __name__ == "__main__":
    main()
