"""Shared high-precision beta masses and Harrell–Davis helpers."""
import math
try:
    import mpmath as mp
except ImportError:
    raise SystemExit("Python example needs mpmath: python3 -m pip install mpmath")
from statistics import mean


def beta_interval(a, b, low, high):
    """Unnormalized by truncation: probability of a Beta variable in [low,high]."""
    if low >= high:
        return mp.mpf(0)
    if (low + high) / 2 > a / (a + b):
        return mp.betainc(b, a, 1 - high, 1 - low, regularized=True)
    return mp.betainc(a, b, low, high, regularized=True)


def hd_weights(n, p):
    """Positive beta interval masses. Reflect upper intervals to avoid 1−1 cancellation."""
    if not isinstance(n, int) or not 1 <= n <= 200 or not math.isfinite(p) or not 0 < p < 1:
        raise ValueError("Expected integer 1 <= n <= 200 and 0 < p < 1")
    with mp.workdps(80):
        prob = mp.mpf(str(p))
        a, b = (n + 1) * prob, (n + 1) * (1 - prob)
        result = []
        for i in range(1, n + 1):
            low, high = mp.mpf(i - 1) / n, mp.mpf(i) / n
            mass = beta_interval(a, b, low, high)
            if mass <= 0:
                raise ArithmeticError("Nonpositive beta mass: increase numerical precision")
            result.append(+mass)
        if abs(mp.fsum(result) - 1) > mp.mpf('1e-60'):
            raise ArithmeticError("Beta masses failed normalization")
        return result


def estimate(values, p):
    if not values or not all(math.isfinite(x) for x in values):
        raise ValueError("Expected nonempty finite sample")
    weights = hd_weights(len(values), p)
    with mp.workdps(80):
        value = mp.fsum(w * mp.mpf(str(x)) for w, x in zip(weights, sorted(values)))
    return value, weights


def moments(estimates, target):
    average = mean(estimates)
    return dict(bias=average - target,
                variance=mean((value - average) ** 2 for value in estimates),
                mse=mean((value - target) ** 2 for value in estimates))

