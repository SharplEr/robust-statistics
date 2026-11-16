"""Calibration experiment. Standard library; same draws as the HTML lesson.

Run from the course root:
python3 examples/0005_influence_efficiency.py --scenario symmetric --n 51
"""
import argparse
import json
import sys
sys.dont_write_bytecode = True
from statistics import mean, median
from sampling_helpers import mulberry32, normal_generator

SCENARIOS = {"clean": (0, 0, 1), "symmetric": (.02, 0, 20), "asymmetric": (.02, 20, 1)}


def moments(estimates, theta):
    average = mean(estimates)
    return {"bias": average - theta,
            "variance": mean((value - average) ** 2 for value in estimates),
            "mse": mean((value - theta) ** 2 for value in estimates)}


def simulate(n=51, scenario="clean", seed=43, repetitions=1000):
    if n not in (11, 51, 201) or scenario not in SCENARIOS or not 0 <= seed <= 4294967295 or not 1 <= repetitions <= 10000:
        raise ValueError("Invalid simulation settings")
    epsilon, shift, scale = SCENARIOS[scenario]
    theta = 10
    rng = mulberry32(seed)
    normal = normal_generator(rng)
    estimates = {"mean": [], "median": []}
    for _ in range(repetitions):
        sample = []
        for _ in range(n):
            bad = next(rng) < epsilon
            z = next(normal)
            sample.append(theta + (shift + scale * z if bad else z))
        estimates["mean"].append(mean(sample))
        estimates["median"].append(median(sample))
    bias = epsilon * shift
    variance = ((1 - epsilon) + epsilon * scale ** 2 + epsilon * (1 - epsilon) * shift ** 2) / n
    return {"n": n, "scenario": scenario, "seed": seed, "repetitions": repetitions, "theta": theta,
            "mean": moments(estimates["mean"], theta), "median": moments(estimates["median"], theta),
            "exactMean": {"bias": bias, "variance": variance, "mse": variance + bias ** 2}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n", type=int, choices=(11, 51, 201), default=51)
    parser.add_argument("--scenario", choices=SCENARIOS, default="clean")
    parser.add_argument("--seed", type=int, default=43)
    parser.add_argument("--repetitions", type=int, default=1000)
    args = parser.parse_args()
    print(json.dumps(simulate(args.n, args.scenario, args.seed, args.repetitions), indent=2, ensure_ascii=False))
