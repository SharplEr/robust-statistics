"""Reusable deterministic sampling helpers for current and future lessons."""
from math import ceil, floor, cos, sin, log, sqrt, pi, isfinite, comb


def mulberry32(seed):
    """The same teaching PRNG as assets/statistics.js; not cryptography."""
    state = seed & 0xFFFFFFFF
    while True:
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        value = ((state ^ (state >> 15)) * (state | 1)) & 0xFFFFFFFF
        value ^= (value + ((value ^ (value >> 7)) * (value | 61))) & 0xFFFFFFFF
        yield ((value ^ (value >> 14)) & 0xFFFFFFFF) / 4294967296


def empirical_quantile(values, p):
    """Inverse ECDF convention; p=0 maps to the observed minimum."""
    if not values or not 0 <= p <= 1:
        raise ValueError("Expected a nonempty sample and p in [0, 1]")
    return sorted(values)[max(0, ceil(len(values) * p) - 1)]


def normal_generator(rng):
    """Box–Muller pairs, in the same order as CourseStats.normalGenerator."""
    while True:
        radius = sqrt(-2 * log(1 - next(rng)))
        angle = 2 * pi * next(rng)
        yield radius * cos(angle)
        yield radius * sin(angle)


def quantile_details(values, p, method):
    """Hyndman–Fan 1/7/8; ranks are one-based, endpoint values are clipped."""
    if not values or not all(isfinite(x) for x in values) or not isfinite(p) or not 0 <= p <= 1 or method not in (1, 7, 8):
        raise ValueError("Expected finite nonempty sample, p in [0, 1] and type 1/7/8")
    ordered = sorted(values)
    n = len(ordered)
    h = n * p if method == 1 else 1 + (n - 1) * p if method == 7 else (n + 1 / 3) * p + 1 / 3
    if method == 1:
        rank = max(1, ceil(n * p))
        return dict(type=method, n=n, p=p, h=h, lowerRank=rank, upperRank=rank,
                    weightUpper=0, value=empirical_quantile(ordered, p))
    position = max(1, min(n, h))
    lower = floor(position)
    weight = position - lower
    upper = lower + 1 if weight else lower
    left, right = ordered[lower - 1], ordered[upper - 1]
    return dict(type=method, n=n, p=p, h=h, lowerRank=lower, upperRank=upper,
                weightUpper=weight, value=left if left == right else (1 - weight) * left + weight * right)


def order_probability_cdf(n, k, u):
    """CDF of F(X_(k)) for a continuous F: a binomial tail / Beta(k,n+1-k).

    Direct finite sum for small teaching examples, not a general beta-CDF library.
    """
    if not isinstance(n, int) or not isinstance(k, int) or not 1 <= k <= n <= 200 or not isfinite(u) or not 0 <= u <= 1:
        raise ValueError("Expected integer 1 <= k <= n <= 200 and u in [0, 1]")
    return sum(comb(n, r) * u ** r * (1 - u) ** (n - r) for r in range(k, n + 1))


def median_plotting_position(n, k):
    """Numerically invert the exact finite-sample CDF at probability 1/2."""
    order_probability_cdf(n, k, .5)
    low, high = 0., 1.
    for _ in range(60):
        middle = (low + high) / 2
        if order_probability_cdf(n, k, middle) < .5:
            low = middle
        else:
            high = middle
    return (low + high) / 2
